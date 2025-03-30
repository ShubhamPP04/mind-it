'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { BackgroundPaths } from "@/components/ui/background-paths"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LogOut, MessageSquarePlus, PlusCircle, Edit2, Trash2, Sparkles, X, Calendar, Wand2, LinkIcon, FileText, File, Boxes, Box, PanelLeftClose, PanelLeftOpen, Paintbrush } from 'lucide-react'
import { generateNoteContent } from '@/utils/gemini'
import { generateOpenRouterContent } from '@/utils/openrouter'
import { ModelSelector, type Model } from '@/components/ui/model-selector'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { Navbar } from "../components/ui/navbar"
import { SpacesSidebar } from "@/components/ui/spaces-sidebar"
import { AVAILABLE_ICONS } from '@/lib/constants'
import { MenuBar } from "../components/ui/menu-bar"
import { Globe } from "lucide-react"

interface Space {
  id: string
  name: string
  color: string
  icon: string
  user_id: string
}

interface Note {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  space_id: string | null
  type: 'note' | 'website' | 'document'
  url?: string
  document_url?: string
  color?: string
}

interface Website {
  id: string
  title: string
  url: string
  content: string
  user_id: string
  space_id: string
  created_at: string
  color?: string
}

interface Document {
  id: string
  title: string
  file_path: string
  content: string
  file_type: string
  file_size: number
  user_id: string
  space_id: string
  created_at: string
  publicUrl?: string
  color?: string
}

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [showNewNote, setShowNewNote] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isAIEnabled, setIsAIEnabled] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model>({
    provider: 'gemini',
    name: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash'
  })
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebarOpen')
      return stored === null ? true : stored === 'true'
    }
    return true
  })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = mounted ? resolvedTheme === "dark" : false
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'all' | 'website' | 'note' | 'document'>('all')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [websites, setWebsites] = useState<Website[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null)

  const contentTypeItems = [
    {
      icon: Boxes,
      label: "All",
      href: "#",
      gradient:
        "radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(126,34,206,0.06) 50%, rgba(107,33,168,0) 100%)",
      iconColor: "text-purple-500",
    },
    {
      icon: FileText,
      label: "Notes",
      href: "#",
      gradient:
        "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.06) 50%, rgba(29,78,216,0) 100%)",
      iconColor: "text-blue-500",
    },
    {
      icon: Globe,
      label: "Websites",
      href: "#",
      gradient:
        "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
      iconColor: "text-green-500",
    },
    {
      icon: File,
      label: "Documents",
      href: "#",
      gradient:
        "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
      iconColor: "text-red-500",
    },
  ]

  useEffect(() => {
    localStorage.setItem('sidebarOpen', isSidebarOpen.toString())
  }, [isSidebarOpen])

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setMounted(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/signin')
          return
        }
        setEmail(user.email || null)

        // First fetch spaces
        const { data: spacesData, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
          .eq('user_id', user.id)
        .order('created_at', { ascending: true })

        if (spacesError) throw spacesError
        setSpaces(spacesData || [])

        // Select the first space if available and fetch its content
        if (spacesData && spacesData.length > 0) {
          const firstSpace = spacesData[0]
          setSelectedSpace(firstSpace)
          
          // Fetch all content types for the first space
          const [notesResult, websitesResult, documentsResult] = await Promise.all([
            supabase
              .from('notes')
              .select('*')
              .eq('user_id', user.id)
              .eq('space_id', firstSpace.id)
              .order('created_at', { ascending: false }),
            supabase
              .from('websites')
              .select('*')
              .eq('user_id', user.id)
              .eq('space_id', firstSpace.id)
              .order('created_at', { ascending: false }),
            supabase
              .from('documents')
              .select('*')
              .eq('user_id', user.id)
              .eq('space_id', firstSpace.id)
              .order('created_at', { ascending: false })
          ])

          // Handle any errors
          if (notesResult.error) throw notesResult.error
          if (websitesResult.error) throw websitesResult.error
          if (documentsResult.error) throw documentsResult.error

          // Process documents to include public URLs
          const documentsWithUrls = await Promise.all(
            (documentsResult.data || []).map(async (doc) => {
              const { data: { publicUrl } } = supabase
                .storage
                .from('documents')
                .getPublicUrl(doc.file_path)
              return { ...doc, publicUrl }
            })
          )

          // Update state with fetched content
          setNotes(notesResult.data || [])
          setWebsites(websitesResult.data || [])
          setDocuments(documentsWithUrls)

          console.log(`Loaded ${notesResult.data?.length || 0} notes`)
          console.log(`Loaded ${websitesResult.data?.length || 0} websites`)
          console.log(`Loaded ${documentsWithUrls.length} documents`)
        }
      } catch (error) {
        console.error('Error initializing app:', error)
        setError('Failed to initialize app. Please try refreshing the page.')
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  // Set up realtime subscriptions
  useEffect(() => {
    if (!mounted) return

    const setupSubscriptions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Subscribe to documents changes
        const documentsChannel = supabase
          .channel('documents_channel')
          .on(
            'postgres_changes' as any, // TODO: Fix type
            { 
              event: '*', 
              schema: 'public', 
              table: 'documents',
              filter: `user_id=eq.${user.id}`
            }, 
            async (payload: { new: { space_id: string } | null }) => {
              if (selectedSpace && payload.new && payload.new.space_id === selectedSpace.id) {
                await fetchDocuments(user.id)
              }
            }
          )
          .subscribe()

        const notesChannel = supabase
          .channel('notes_channel')
          .on(
            'postgres_changes' as any, // TODO: Fix type
            { 
              event: '*', 
              schema: 'public', 
              table: 'notes',
              filter: `user_id=eq.${user.id}`
            }, 
            async (payload: { new: { space_id: string } | null }) => {
              if (selectedSpace && payload.new && payload.new.space_id === selectedSpace.id) {
                await fetchNotes(user.id)
              }
            }
          )
          .subscribe()

        const spacesChannel = supabase
          .channel('spaces_channel')
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'spaces',
              filter: `user_id=eq.${user.id}`
            },
            async (payload) => {
              const { data } = await supabase
                .from('spaces')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })

      if (data) {
        setSpaces(data)
                // Remove auto-selection of first space
                // Only keep selected space if it still exists
                if (selectedSpace) {
                  const spaceStillExists = data.some(space => space.id === selectedSpace.id)
                  if (!spaceStillExists) {
                    setSelectedSpace(null)
                    setNotes([])
                    setWebsites([])
                    setDocuments([])
                  }
                }
              }
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(notesChannel)
          supabase.removeChannel(spacesChannel)
          supabase.removeChannel(documentsChannel)
        }
      } catch (error) {
        console.error('Error setting up subscriptions:', error)
      }
    }

    setupSubscriptions()
  }, [mounted, selectedSpace])

  // Fetch spaces from Supabase
  const fetchSpaces = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setSpaces(data || [])
    } catch (error) {
      console.error('Error fetching spaces:', error)
      setError('Failed to fetch spaces')
    }
  }

  // Create a new space
  const handleCreateSpace = async (name: string, icon: string = 'hash') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user found')
        return
      }

      console.log('Creating new space:', name)

      const color = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
      
      const { data, error } = await supabase
        .from('spaces')
        .insert({
          name,
          color,
          icon,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating space:', error)
        throw error
      }

      if (data) {
        console.log('New space created:', data.id)
        // Only update spaces list, don't change anything else
        setSpaces(prev => [...prev, data])
      }
    } catch (error) {
      console.error('Error in handleCreateSpace:', error)
      setError('Failed to create space')
    }
  }

  // Handle editing a space
  const handleEditSpace = async (spaceId: string, newName: string, newIcon?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const updates: { name: string; icon?: string } = { name: newName }
      if (newIcon) {
        updates.icon = newIcon
      }

      const { data, error } = await supabase
        .from('spaces')
        .update(updates)
        .eq('id', spaceId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setSpaces(prev => prev.map(space => 
          space.id === spaceId ? data : space
        ))
        if (selectedSpace?.id === spaceId) {
          setSelectedSpace(data)
        }
      }
    } catch (error) {
      console.error('Error updating space:', error)
      setError('Failed to update space')
    }
  }

  // Handle deleting a space
  const handleDeleteSpace = async (spaceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user found')
        return
      }

      console.log('Deleting space:', spaceId)

      // First, delete all documents from storage
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('space_id', spaceId)
        .eq('user_id', user.id)

      if (documentsError) {
        console.error('Error fetching documents:', documentsError)
        throw documentsError
      }

      if (documents.length > 0) {
        console.log('Deleting document files from storage')
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove(documents.map(doc => doc.file_path))

        if (storageError) {
          console.error('Error deleting document files:', storageError)
          throw storageError
        }
      }

      // Delete all content in parallel
      console.log('Deleting all content for space:', spaceId)
      await Promise.all([
        // Delete notes
        supabase
          .from('notes')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', user.id),
        
        // Delete websites
        supabase
          .from('websites')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', user.id),
        
        // Delete documents
        supabase
          .from('documents')
          .delete()
          .eq('space_id', spaceId)
          .eq('user_id', user.id)
      ])

      // Finally delete the space itself
      console.log('Deleting space record')
      const { error: spaceError } = await supabase
        .from('spaces')
        .delete()
        .eq('id', spaceId)
        .eq('user_id', user.id)

      if (spaceError) {
        console.error('Error deleting space:', spaceError)
        throw spaceError
      }

      // Update local state
      setSpaces(prev => prev.filter(space => space.id !== spaceId))
      if (selectedSpace?.id === spaceId) {
        setSelectedSpace(null)
        setNotes([])
        setWebsites([])
        setDocuments([])
      }
      
      setError(null)
    } catch (error) {
      console.error('Error in handleDeleteSpace:', error)
      setError('Failed to delete space and its content. Please try again.')
    }
  }

  // Update fetchNotes to filter by space
  const fetchNotes = async (userId: string) => {
    try {
      if (!selectedSpace) {
        console.log('No space selected, clearing notes')
        setNotes([])
        return
      }

      console.log('Fetching notes for space:', selectedSpace.id)
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .eq('space_id', selectedSpace.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error in fetchNotes:', error)
        throw error
      }
      
      console.log(`Fetched ${data?.length || 0} notes for space ${selectedSpace.id}`)
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
      setError('Failed to fetch notes')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/signin')
  }

  const handleStartChat = () => {
    // TODO: Implement chat functionality
    console.log('Starting AI chat...')
  }

  const handleNewNote = () => {
    setEditingNote(null)
    setNewNote({ title: '', content: '' })
    setShowNewNote(true)
  }

  const handleSpaceSelect = async (space: Space | null) => {
    try {
      if (!space) {
        setSelectedSpace(null)
        setNotes([])
        setWebsites([])
        setDocuments([])
        return
      }

      console.log('Selecting space:', space.id)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user found')
        return
      }

      // First set the selected space
    setSelectedSpace(space)
      
      // Clear current content before fetching new content
      setNotes([])
      setWebsites([])
      setDocuments([])
      
      // Reset UI states
    setShowNewNote(false)
    setEditingNote(null)
      setSelectedNote(null)
      setSelectedDocument(null)

      // Fetch content for the selected space
      const [notesResult, websitesResult, documentsResult] = await Promise.all([
        supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .eq('space_id', space.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('websites')
          .select('*')
          .eq('user_id', user.id)
          .eq('space_id', space.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .eq('space_id', space.id)
          .order('created_at', { ascending: false })
      ])

      // Handle any errors
      if (notesResult.error) throw notesResult.error
      if (websitesResult.error) throw websitesResult.error
      if (documentsResult.error) throw documentsResult.error

      // Update state with fetched content
      setNotes(notesResult.data || [])
      setWebsites(websitesResult.data || [])
      
      // Process documents to include public URLs
      const documentsWithUrls = await Promise.all(
        (documentsResult.data || []).map(async (doc) => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('documents')
            .getPublicUrl(doc.file_path)
          return { ...doc, publicUrl }
        })
      )
      setDocuments(documentsWithUrls)

    } catch (error) {
      console.error('Error in handleSpaceSelect:', error)
      setError('Failed to fetch content for selected space')
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload the file to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading file:', uploadError)
        throw new Error('Failed to upload file')
      }

      if (!data?.path) {
        throw new Error('No file path returned')
      }

      return data.path
    } catch (error) {
      console.error('Error in handleFileUpload:', error)
      throw error
    }
  }

  const handleSaveNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user found')
        return
      }

      if (!selectedSpace) {
        setError('Please select a space before adding memories')
        return
      }

      console.log('Saving content to space:', selectedSpace.id)

      switch (activeTab) {
        case 'website':
          if (!websiteUrl) {
            setError('Please enter a website URL')
            return
          }

          const websiteData = {
            title: 'Website Memory',
            url: websiteUrl,
            content: newNote.content,
            user_id: user.id,
            space_id: selectedSpace.id,
            created_at: new Date().toISOString()
          }

          console.log('Saving website to space:', selectedSpace.id)
          const { error: websiteError } = await supabase
            .from('websites')
            .insert(websiteData)

          if (websiteError) throw websiteError
          await fetchWebsites(user.id)
          break

        case 'document':
          if (!documentFile) {
            setError('Please select a document to upload')
            return
          }

          try {
            const filePath = await handleFileUpload(documentFile)
            
            const documentData = {
              title: documentFile.name,
              file_path: filePath,
              content: newNote.content || '',
              file_type: documentFile.type,
              file_size: documentFile.size,
              user_id: user.id,
              space_id: selectedSpace.id,
              created_at: new Date().toISOString()
            }

            console.log('Saving document to space:', selectedSpace.id)
            const { error: documentError } = await supabase
              .from('documents')
              .insert(documentData)

            if (documentError) throw documentError
            await fetchDocuments(user.id)
          } catch (error) {
            console.error('Error handling document:', error)
            setError('Failed to upload document. Please try again.')
            return
          }
          break

        case 'note':
      const noteData = {
        title: newNote.title,
        content: newNote.content,
            user_id: user.id,
            space_id: selectedSpace.id,
            created_at: new Date().toISOString()
      }

          console.log('Saving note to space:', selectedSpace.id)
      if (editingNote) {
        const { error } = await supabase
          .from('notes')
          .update({
            ...noteData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNote.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('notes')
          .insert(noteData)

        if (error) throw error
          }
          await fetchNotes(user.id)
          break
      }

      // Reset form state
      setNewNote({ title: '', content: '' })
      setWebsiteUrl('')
      setDocumentFile(null)
      setShowNewNote(false)
      setEditingNote(null)
      setError(null)
    } catch (error) {
      console.error('Error saving memory:', error)
      setError('Failed to save memory. Please try again.')
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setNewNote({
      title: note.title,
      content: note.content
    })
    setShowNewNote(true)
  }

  const handleDeleteNote = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await fetchNotes(user.id)
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && isAIEnabled) {
      e.preventDefault();
      const prompt = newNote.content.trim();
      if (!prompt) return;

      try {
        setIsGenerating(true);
        const currentContent = prompt; // Store the current content
        setNewNote(prev => ({ ...prev, content: '' })); // Clear the input immediately
        
        if (selectedModel.provider === 'gemini') {
          const aiContent = await generateNoteContent(prompt);
          setNewNote(prev => ({ ...prev, content: aiContent }));
        } else {
          const response = await generateOpenRouterContent(selectedModel.name, prompt);
          if (typeof response === 'string') {
            // Handle error message
            setNewNote(prev => ({ ...prev, content: response }));
          } else {
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('Response body is not readable');
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let accumulatedContent = '';
            
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // Append new chunk to buffer
                buffer += decoder.decode(value, { stream: true });

                // Process complete lines from buffer
                while (true) {
                  const lineEnd = buffer.indexOf('\n');
                  if (lineEnd === -1) break;

                  const line = buffer.slice(0, lineEnd).trim();
                  buffer = buffer.slice(lineEnd + 1);

                  if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') break;

                    try {
                      const parsed = JSON.parse(data);
                      const content = parsed.choices[0].delta.content;
                      if (content) {
                        accumulatedContent += content;
                        setNewNote(prev => ({ ...prev, content: accumulatedContent }));
                      }
                    } catch (e) {
                      // Ignore invalid JSON
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error reading stream:', error);
              setNewNote(prev => ({ ...prev, content: currentContent }));
            } finally {
              reader.releaseLock();
            }
          }
        }
      } catch (error) {
        console.error('Error generating AI content:', error);
        // On error, restore the original content
        setNewNote(prev => ({ ...prev, content: prompt }));
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const handleWebsiteClick = () => {
    setActiveTab('website')
    setNewNote({ title: '', content: '' })
  }

  const handleNoteClick = () => {
    setActiveTab('note')
    setNewNote({ title: '', content: '' })
  }

  const handleDocumentClick = () => {
    setActiveTab('document')
    setNewNote({ title: '', content: '' })
  }

  const handleDocumentDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/pdf' || 
        file.type === 'application/msword' || 
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setDocumentFile(file)
    }
  }

  // Update the fetchWebsites function
  const fetchWebsites = async (userId: string) => {
    try {
      if (!selectedSpace) {
        console.log('No space selected, clearing websites')
        setWebsites([])
        return
      }

      console.log('Fetching websites for space:', selectedSpace.id)

      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', userId)
        .eq('space_id', selectedSpace.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error in fetchWebsites:', error)
        throw error
      }
      
      console.log(`Fetched ${data?.length || 0} websites for space ${selectedSpace.id}`)
      setWebsites(data || [])
    } catch (error) {
      console.error('Error fetching websites:', error)
      setError('Failed to fetch websites')
    }
  }

  // Update the fetchDocuments function
  const fetchDocuments = async (userId: string) => {
    try {
      if (!selectedSpace) {
        console.log('No space selected, clearing documents')
        setDocuments([])
        return
      }

      console.log('Fetching documents for space:', selectedSpace.id)

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('space_id', selectedSpace.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error in fetchDocuments:', error)
        throw error
      }

      // Get signed URLs for each document
      const documentsWithUrls = await Promise.all(
        (data || []).map(async (doc) => {
          const { data: { publicUrl } } = supabase
            .storage
            .from('documents')
            .getPublicUrl(doc.file_path)

          return {
            ...doc,
            publicUrl
          }
        })
      )

      console.log(`Fetched ${documentsWithUrls.length} documents for space ${selectedSpace.id}`)
      setDocuments(documentsWithUrls)
    } catch (error) {
      console.error('Error in fetchDocuments:', error)
      setError('Failed to fetch documents')
    }
  }

  const handleDeleteWebsite = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      await fetchWebsites(user.id)
    } catch (error) {
      console.error('Error deleting website:', error)
      setError('Failed to delete website')
    }
  }

  const handleDeleteDocument = async (id: string, filePath: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // First delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath])

      if (storageError) throw storageError

      // Then delete the document record
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (dbError) throw dbError
      await fetchDocuments(user.id)
    } catch (error) {
      console.error('Error deleting document:', error)
      setError('Failed to delete document')
    }
  }

  // Add this function near other handlers
  const handleColorChange = async (itemId: string, color: string, type: 'note' | 'website' | 'document') => {
    try {
      const { error } = await supabase
        .from(type === 'note' ? 'notes' : type === 'website' ? 'websites' : 'documents')
        .update({ color })
        .eq('id', itemId)

      if (error) throw error

      // Update local state
      if (type === 'note') {
        setNotes(notes.map(note => 
          note.id === itemId ? { ...note, color } : note
        ))
      } else if (type === 'website') {
        setWebsites(websites.map(website => 
          website.id === itemId ? { ...website, color } : website
        ))
      } else {
        setDocuments(documents.map(document => 
          document.id === itemId ? { ...document, color } : document
        ))
      }
    } catch (error) {
      console.error('Error updating color:', error)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-current" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      <BackgroundPaths className="fixed inset-0 -z-20 pointer-events-none" isDark={isDark} />
      <div className="flex w-full relative z-10">
      <SpacesSidebar
        spaces={spaces}
        selectedSpace={selectedSpace}
        onSpaceSelect={handleSpaceSelect}
        onCreateSpace={handleCreateSpace}
          onEditSpace={handleEditSpace}
          onDeleteSpace={handleDeleteSpace}
        isDark={isDark}
        isOpen={isSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar
          isDark={isDark}
          onStartChat={handleStartChat}
          onSignOut={handleSignOut}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
            email={email || undefined}
        />
        <main className="flex-1 overflow-auto p-4 pt-24">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Notes Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className={cn(
                  "text-2xl font-semibold",
                  isDark ? "text-white/90" : "text-black/90"
                )}>
                  {selectedSpace ? selectedSpace.name : 'All Notes'}
                </h2>
                {selectedSpace && (
                  <div 
                      className="px-2.5 py-1 rounded-full text-sm"
                    style={{ 
                        backgroundColor: `${selectedSpace.color}20`,  // Using space color with 20% opacity
                        color: selectedSpace.color  // Using space color for text
                    }}
                  >
                      <span className="font-medium">
                      {notes.length} note{notes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
              <ShimmerButton
                onClick={handleNewNote}
                shimmerColor={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
                background={isDark ? "rgba(20, 20, 20, 0.9)" : "rgba(240, 240, 240, 0.9)"}
                shimmerDuration="2s"
                className={cn(
                  "group font-medium",
                  isDark ? "hover:bg-white/10" : "hover:bg-black/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className={cn(
                    "w-4 h-4 transition-transform group-hover:scale-110",
                    isDark ? "text-white/90" : "text-black"
                  )} />
                    <span className={isDark ? "text-white/90" : "text-black"}>Add Memory</span>
                </div>
              </ShimmerButton>
            </div>

            {/* New/Edit Note Form */}
            {showNewNote && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-6 rounded-xl border",
                  isDark 
                    ? "bg-black/60 border-white/10" 
                    : "bg-white/60 border-black/5"
                )}
              >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Add Memory</h2>
                    <button
                      onClick={() => {
                        setShowNewNote(false)
                        setEditingNote(null)
                        setNewNote({ title: '', content: '' })
                        setIsAIEnabled(false)
                      }}
                      className={cn(
                        "p-2 rounded-lg hover:bg-black/5",
                        isDark ? "text-white/60" : "text-black/60"
                      )}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-12 gap-6">
                    {/* Left Column - Options */}
                    <div className="col-span-4 space-y-4">
                      <button
                        onClick={handleWebsiteClick}
                        className={cn(
                          "w-full p-4 rounded-lg border flex items-center gap-3 transition-colors",
                          isDark 
                            ? "border-white/10 hover:bg-white/5" 
                            : "border-black/10 hover:bg-black/5",
                          activeTab === 'website' && (isDark ? "bg-white/5" : "bg-black/5")
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg",
                          isDark ? "bg-white/5" : "bg-black/5"
                        )}>
                          <LinkIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Website</div>
                          <div className="text-sm opacity-60">Add a website or tweet URL</div>
                        </div>
                      </button>

                      <button
                        onClick={handleNoteClick}
                        className={cn(
                          "w-full p-4 rounded-lg border flex items-center gap-3 transition-colors",
                          isDark 
                            ? "border-white/10 hover:bg-white/5" 
                            : "border-black/10 hover:bg-black/5",
                          activeTab === 'note' && (isDark ? "bg-white/5" : "bg-black/5")
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg",
                          isDark ? "bg-white/10" : "bg-black/10"
                        )}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Note</div>
                          <div className="text-sm opacity-60">Add a note or use the rich editor</div>
                        </div>
                      </button>

                      <button
                        onClick={handleDocumentClick}
                        className={cn(
                          "w-full p-4 rounded-lg border flex items-center gap-3 transition-colors",
                          isDark 
                            ? "border-white/10 hover:bg-white/5" 
                            : "border-black/10 hover:bg-black/5",
                          activeTab === 'document' && (isDark ? "bg-white/5" : "bg-black/5")
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg",
                          isDark ? "bg-white/5" : "bg-black/5"
                        )}>
                          <File className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Document</div>
                          <div className="text-sm opacity-60">Upload a PDF or other document</div>
                        </div>
                      </button>
                    </div>

                    {/* Right Column - Content Editor */}
                    <div className="col-span-8">
                      <div className="space-y-4">
                        {activeTab === 'website' && (
                          <>
                            <h3 className="text-lg font-medium">Website or Tweet URL</h3>
                            <input
                              type="url"
                              placeholder="https://supermemory.ai"
                              value={websiteUrl}
                              onChange={(e) => setWebsiteUrl(e.target.value)}
                              className={cn(
                                "w-full px-4 py-3 rounded-lg border",
                                isDark 
                                  ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                                  : "bg-black/5 border-black/10 text-black placeholder:text-black/30"
                              )}
                            />
                            <div className="text-sm">
                              <span className="font-medium">Pro tip:</span>{" "}
                              <a 
                                href="#" 
                                className={cn(
                                  "text-blue-500 hover:underline",
                                  isDark && "text-blue-400"
                                )}
                              >
                                Use our Chrome extension
                              </a>{" "}
                              to save websites and tweets instantly
                            </div>
                          </>
                        )}

                        {activeTab === 'note' && (
                          <>
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    placeholder="Note Title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg border mr-4",
                      isDark 
                        ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                        : "bg-black/5 border-black/10 text-black placeholder:text-black/30"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    {isAIEnabled && (
                      <ModelSelector
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                        isDark={isDark}
                      />
                    )}
                    <InteractiveHoverButton
                      onClick={() => setIsAIEnabled(!isAIEnabled)}
                      text="AI Mode"
                      className={cn(
                        "w-28",
                        isAIEnabled
                          ? "border-black bg-black text-white hover:border-black/80 hover:bg-black/80"
                          : isDark
                            ? "border-white/10 text-white hover:text-black [&>div]:bg-white"
                            : "border-black/10 text-black hover:text-white [&>div]:bg-black"
                      )}
                    />
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    placeholder={isAIEnabled ? "Write your note and click generate or press Enter for AI assistance..." : "Note Content"}
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    onKeyDown={handleKeyDown}
                    rows={8}
                    className={cn(
                                  "w-full px-4 py-3 rounded-lg border resize-none min-h-[200px]",
                      isDark 
                        ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                        : "bg-black/5 border-black/10 text-black placeholder:text-black/30",
                                  isAIEnabled ? "pr-[100px]" : ""
                    )}
                  />
                  {isAIEnabled && !isGenerating && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const fakeEvent = {
                          key: 'Enter',
                          shiftKey: false,
                          preventDefault: () => {}
                        } as React.KeyboardEvent<HTMLTextAreaElement>;
                        handleKeyDown(fakeEvent);
                      }}
                      className={cn(
                        "absolute bottom-6 right-4 p-1.5 rounded-lg transition-all duration-300",
                        isDark 
                          ? "bg-white/10 hover:bg-white/20 text-white/90" 
                          : "bg-black/10 hover:bg-black/20 text-black/90",
                      )}
                    >
                      <Wand2 className="w-4 h-4" />
                    </button>
                  )}
                  {isGenerating && (
                    <div className={cn(
                      "absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm",
                      isDark ? "bg-black/60" : "bg-white/60"
                    )}>
                      <div className={cn(
                        "flex items-center gap-2",
                        isDark ? "text-white/90" : "text-black/90"
                      )}>
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Generating...</span>
                      </div>
                    </div>
                  )}
                </div>
                          </>
                        )}

                        {activeTab === 'document' && (
                          <>
                            <h3 className="text-lg font-medium">Upload Document</h3>
                            <label
                              htmlFor="document-upload"
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              onDrop={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const file = e.dataTransfer.files[0]
                                if (file && (
                                  file.type === 'application/pdf' || 
                                  file.type === 'application/msword' || 
                                  file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                )) {
                                  if (file.size > 10 * 1024 * 1024) {
                                    setError('File size must be less than 10MB')
                                    return
                                  }
                                  setDocumentFile(file)
                                  setError(null)
                                } else {
                                  setError('Please upload a PDF, DOC, or DOCX file')
                                }
                              }}
                              className={cn(
                                "w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
                                isDark 
                                  ? "border-white/10 bg-white/5 hover:bg-white/10" 
                                  : "border-black/10 bg-black/5 hover:bg-black/10"
                              )}
                            >
                              <input
                                type="file"
                                id="document-upload"
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    if (file.size > 10 * 1024 * 1024) {
                                      setError('File size must be less than 10MB')
                                      return
                                    }
                                    setDocumentFile(file)
                                    setError(null)
                                  }
                                }}
                              />
                              {documentFile ? (
                                <div className="text-center">
                                  <div className={cn(
                                    "p-3 rounded-full mx-auto mb-2",
                                    isDark ? "bg-white/10" : "bg-black/10"
                                  )}>
                                    <File className="w-6 h-6" />
                                  </div>
                                  <p className="font-medium">{documentFile.name}</p>
                                  <p className="text-xs opacity-60 mt-1">
                                    {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setDocumentFile(null)
                                      setError(null)
                                    }}
                                    className={cn(
                                      "text-sm mt-2 px-3 py-1 rounded",
                                      isDark 
                                        ? "text-red-400 hover:bg-red-400/10" 
                                        : "text-red-600 hover:bg-red-600/10"
                                    )}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className={cn(
                                    "p-3 rounded-full",
                                    isDark ? "bg-white/10" : "bg-black/10"
                                  )}>
                                    <File className="w-6 h-6" />
                                  </div>
                                  <p className="text-sm opacity-60">Click to upload or drag and drop</p>
                                  <p className="text-xs opacity-40">PDF, DOC, DOCX (MAX. 10MB)</p>
                                </>
                              )}
                            </label>
                            {error && (
                              <p className={cn(
                                "text-sm mt-2",
                                isDark ? "text-red-400" : "text-red-600"
                              )}>
                                {error}
                              </p>
                            )}
                          </>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "flex-1 px-4 py-2 rounded-lg border flex items-center gap-2",
                            isDark 
                              ? "bg-white/5 border-white/10" 
                              : "bg-black/5 border-black/10"
                          )}>
                            <Box className="w-4 h-4 opacity-60" />
                            <span className="opacity-60">Space</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4">
                  <button
                    onClick={() => {
                      setShowNewNote(false)
                      setEditingNote(null)
                      setNewNote({ title: '', content: '' })
                              setWebsiteUrl('')
                              setDocumentFile(null)
                      setIsAIEnabled(false)
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg",
                      isDark 
                        ? "text-white/60 hover:text-white/90" 
                        : "text-black/60 hover:text-black/90"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className={cn(
                              "px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300",
                              isDark && "bg-white/10 text-white hover:bg-white/20"
                            )}
                          >
                            Add Memory
                  </button>
                        </div>
                      </div>
                    </div>
                </div>
              </motion.div>
            )}

              {/* Content Grid */}
              <div className="space-y-8">
                {/* Content Type Selector */}
                <div className="flex justify-center mb-8">
                  <MenuBar
                    items={contentTypeItems}
                    activeItem={
                      activeTab === 'all' ? 'All' :
                      activeTab === 'note' ? 'Notes' :
                      activeTab === 'website' ? 'Websites' :
                      'Documents'
                    }
                    onItemClick={(label) => {
                      switch (label) {
                        case 'All':
                          setActiveTab('all')
                          break
                        case 'Notes':
                          setActiveTab('note')
                          break
                        case 'Websites':
                          setActiveTab('website')
                          break
                        case 'Documents':
                          setActiveTab('document')
                          break
                      }
                    }}
                    className={cn(
                      isDark 
                        ? "bg-black/20 border-white/5 hover:bg-black/30" 
                        : "bg-white border-black/10 shadow-sm"
                    )}
                  />
                </div>

                {/* Notes Section */}
                {(activeTab === 'all' || activeTab === 'note') && notes.length > 0 && (
                  <div>
                    {activeTab === 'all' && (
                      <h3 className={cn(
                        "text-lg font-medium mb-4",
                        isDark ? "text-white/90" : "text-black/90"
                      )}>
                        Notes
                      </h3>
                    )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedNote(note)}
                  className={cn(
                            "p-6 rounded-xl border group cursor-pointer hover:shadow-lg transition-all duration-300 relative",
                            isDark ? "border-white/10" : "border-black/10",
                            note.color || (isDark ? "bg-black/60" : "bg-white/60"),
                            note.color ? `hover:${note.color.replace('bg-', 'bg-opacity-90')}` : (isDark ? "hover:bg-black/70" : "hover:bg-white/80")
                  )}
                >
                  <div className="flex items-start justify-between">
                    <h3 className={cn(
                      "text-lg font-medium line-clamp-1",
                      isDark ? "text-white/90" : "text-black/90"
                    )}>
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const colors = [
                                    'bg-white dark:bg-zinc-950',
                                    'bg-red-50 dark:bg-red-950',
                                    'bg-blue-50 dark:bg-blue-950',
                                    'bg-green-50 dark:bg-green-950',
                                    'bg-yellow-50 dark:bg-yellow-950',
                                    'bg-purple-50 dark:bg-purple-950',
                                    'bg-pink-50 dark:bg-pink-950',
                                  ];
                                  const currentIndex = colors.indexOf(note.color || colors[0]);
                                  const nextColor = colors[(currentIndex + 1) % colors.length];
                                  handleColorChange(note.id, nextColor, 'note');
                                }}
                                className={cn(
                                  "p-1 rounded-lg transition-colors",
                                  isDark 
                                    ? "hover:bg-white/10 text-white/60 hover:text-white" 
                                    : "hover:bg-black/10 text-black/60 hover:text-black"
                                )}
                              >
                                <Paintbrush className="w-4 h-4" />
                              </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNote(note);
                        }}
                        className={cn(
                          "p-1 rounded-lg transition-colors",
                          isDark 
                            ? "hover:bg-white/10 text-white/60 hover:text-white" 
                            : "hover:bg-black/10 text-black/60 hover:text-black"
                        )}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className={cn(
                          "p-1 rounded-lg transition-colors",
                          isDark 
                            ? "hover:bg-white/10 text-white/60 hover:text-white" 
                            : "hover:bg-black/10 text-black/60 hover:text-black"
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Calendar className="w-3 h-3" />
                    <span className={cn(
                      isDark ? "text-white/40" : "text-black/40"
                    )}>
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <div className={cn(
                    "mt-2 prose prose-base max-w-none line-clamp-4 text-base",
                    isDark ? "prose-invert text-white/60" : "text-black/60"
                  )}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        strong: ({node, ...props}) => (
                          <strong className={cn(
                            "font-bold",
                                    isDark ? "text-white" : "text-black"
                          )} {...props} />
                        ),
                        p: ({node, ...props}) => (
                          <p className="mb-2 last:mb-0" {...props} />
                        )
                      }}
                    >
                      {note.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}
                    </div>
                  </div>
                )}

                {/* Websites Section */}
                {(activeTab === 'all' || activeTab === 'website') && websites.length > 0 && (
                  <div>
                    {activeTab === 'all' && (
                      <h3 className={cn(
                        "text-lg font-medium mb-4 mt-8",
                        isDark ? "text-white/90" : "text-black/90"
                      )}>
                        Websites
                      </h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {websites.map((website) => (
                        <motion.div
                          key={website.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setSelectedWebsite(website)}
                          className={cn(
                            "p-6 rounded-xl border group cursor-pointer hover:shadow-lg transition-all duration-300 relative",
                            isDark ? "border-white/10" : "border-black/10",
                            website.color || (isDark ? "bg-black/60" : "bg-white/60"),
                            website.color ? `hover:${website.color.replace('bg-', 'bg-opacity-90')}` : (isDark ? "hover:bg-black/70" : "hover:bg-white/80")
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={cn(
                                "text-lg font-medium line-clamp-1",
                                isDark ? "text-white/90" : "text-black/90"
                              )}>
                                {website.title}
                              </h3>
                              <a 
                                href={website.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "text-sm hover:underline",
                                  isDark ? "text-blue-400" : "text-blue-600"
                                )}
                              >
                                {website.url}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const colors = [
                                    'bg-white dark:bg-zinc-950',
                                    'bg-red-50 dark:bg-red-950',
                                    'bg-blue-50 dark:bg-blue-950',
                                    'bg-green-50 dark:bg-green-950',
                                    'bg-yellow-50 dark:bg-yellow-950',
                                    'bg-purple-50 dark:bg-purple-950',
                                    'bg-pink-50 dark:bg-pink-950',
                                  ];
                                  const currentIndex = colors.indexOf(website.color || colors[0]);
                                  const nextColor = colors[(currentIndex + 1) % colors.length];
                                  handleColorChange(website.id, nextColor, 'website');
                                }}
                                className={cn(
                                  "p-1 rounded-lg transition-colors",
                                  isDark 
                                    ? "hover:bg-white/10 text-white/60 hover:text-white" 
                                    : "hover:bg-black/10 text-black/60 hover:text-black"
                                )}
                              >
                                <Paintbrush className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWebsite(website.id);
                                }}
                                className={cn(
                                  "p-1 rounded-lg transition-colors",
                                  isDark 
                                    ? "hover:bg-white/10 text-white/60 hover:text-white" 
                                    : "hover:bg-black/10 text-black/60 hover:text-black"
                                )}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <Calendar className="w-3 h-3" />
                            <span className={cn(
                              isDark ? "text-white/40" : "text-black/40"
                            )}>
                              {formatDate(website.created_at)}
                            </span>
                          </div>
                          {website.content && (
                            <div className={cn(
                              "mt-2 prose prose-sm max-w-none line-clamp-3",
                              isDark ? "prose-invert text-white/60" : "text-black/60"
                            )}>
                              {website.content}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                {(activeTab === 'all' || activeTab === 'document') && documents.length > 0 && (
                  <div>
                    {activeTab === 'all' && (
                      <h3 className={cn(
                        "text-lg font-medium mb-4 mt-8",
                        isDark ? "text-white/90" : "text-black/90"
                      )}>
                        Documents
                      </h3>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((document) => (
                        <motion.div
                          key={document.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setSelectedDocument(document)}
                          className={cn(
                            "p-6 rounded-xl border group cursor-pointer hover:shadow-lg transition-all duration-300 relative",
                            isDark ? "border-white/10" : "border-black/10",
                            document.color || (isDark ? "bg-black/60" : "bg-white/60"),
                            document.color ? `hover:${document.color.replace('bg-', 'bg-opacity-90')}` : (isDark ? "hover:bg-black/70" : "hover:bg-white/80")
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={cn(
                                "text-lg font-medium line-clamp-1",
                                isDark ? "text-white/90" : "text-black/90"
                              )}>
                                {document.title}
                              </h3>
                              <div className="flex items-center gap-2 text-sm">
                                <span className={cn(
                                  "uppercase",
                                  isDark ? "text-white/40" : "text-black/40"
                                )}>
                                  {document.file_type.split('/')[1]}
                                </span>
                                <span className={cn(
                                  isDark ? "text-white/40" : "text-black/40"
                                )}>
                                  {(document.file_size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const colors = [
                                    'bg-white dark:bg-zinc-950',
                                    'bg-red-50 dark:bg-red-950',
                                    'bg-blue-50 dark:bg-blue-950',
                                    'bg-green-50 dark:bg-green-950',
                                    'bg-yellow-50 dark:bg-yellow-950',
                                    'bg-purple-50 dark:bg-purple-950',
                                    'bg-pink-50 dark:bg-pink-950',
                                  ];
                                  const currentIndex = colors.indexOf(document.color || colors[0]);
                                  const nextColor = colors[(currentIndex + 1) % colors.length];
                                  handleColorChange(document.id, nextColor, 'document');
                                }}
                                className={cn(
                                  "p-1 rounded-lg transition-colors",
                                  isDark 
                                    ? "hover:bg-white/10 text-white/60 hover:text-white" 
                                    : "hover:bg-black/10 text-black/60 hover:text-black"
                                )}
                              >
                                <Paintbrush className="w-4 h-4" />
                              </button>
                              <a
                                href={document.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                  "p-1 rounded-lg transition-colors",
                                  isDark 
                                    ? "hover:bg-white/10 text-white/60 hover:text-white" 
                                    : "hover:bg-black/10 text-black/60 hover:text-black"
                                )}
                              >
                                <File className="w-4 h-4" />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteDocument(document.id, document.file_path);
                                }}
                                className={cn(
                                  "p-1 rounded-lg transition-colors",
                                  isDark 
                                    ? "hover:bg-white/10 text-white/60 hover:text-white" 
                                    : "hover:bg-black/10 text-black/60 hover:text-black"
                                )}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs">
                            <Calendar className="w-3 h-3" />
                            <span className={cn(
                              isDark ? "text-white/40" : "text-black/40"
                            )}>
                              {formatDate(document.created_at)}
                            </span>
                          </div>
                          {document.content && (
                            <div className={cn(
                              "mt-2 prose prose-sm max-w-none line-clamp-3",
                              isDark ? "prose-invert text-white/60" : "text-black/60"
                            )}>
                              {document.content}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show empty state when no items in current tab or no items at all */}
                {((activeTab === 'note' && notes.length === 0) ||
                  (activeTab === 'website' && websites.length === 0) ||
                  (activeTab === 'document' && documents.length === 0) ||
                  (activeTab === 'all' && notes.length === 0 && websites.length === 0 && documents.length === 0)) && (
                  <div className="text-center py-12">
                    <div className={cn(
                      "text-lg mb-2",
                      isDark ? "text-white/60" : "text-black/60"
                    )}>
                      {activeTab === 'all' 
                        ? 'No content yet'
                        : `No ${activeTab === 'note' ? 'notes' : activeTab === 'website' ? 'websites' : 'documents'} yet`}
                    </div>
                    <button
                      onClick={handleNewNote}
                      className={cn(
                        "text-sm px-4 py-2 rounded-lg transition-colors",
                        isDark 
                          ? "bg-white/10 hover:bg-white/20 text-white" 
                          : "bg-black/10 hover:bg-black/20 text-black"
                      )}
                    >
                      Add your first {activeTab === 'all' ? 'memory' : activeTab === 'note' ? 'note' : activeTab === 'website' ? 'website' : 'document'}
                    </button>
                  </div>
                )}
            </div>

            {/* Full Screen Note Modal */}
            <AnimatePresence>
              {selectedNote && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                  <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedNote(null)}
                  />
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className={cn(
                      "relative w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-xl p-6 shadow-2xl",
                      isDark 
                        ? "bg-black/80 border border-white/10" 
                        : "bg-white/90 border border-black/5"
                    )}
                  >
                    <div className="flex items-center justify-end gap-2 absolute top-4 right-4">
                      <button
                        onClick={() => {
                          handleEditNote(selectedNote);
                          setSelectedNote(null);
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isDark 
                            ? "hover:bg-white/10 text-white/60 hover:text-white" 
                            : "hover:bg-black/10 text-black/60 hover:text-black"
                        )}
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedNote(null)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isDark 
                            ? "hover:bg-white/10 text-white/60 hover:text-white" 
                            : "hover:bg-black/10 text-black/60 hover:text-black"
                        )}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="mb-6">
                      <h2 className={cn(
                        "text-2xl font-semibold mb-2",
                        isDark ? "text-white/90" : "text-black/90"
                      )}>
                        {selectedNote.title}
                      </h2>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span className={cn(
                          isDark ? "text-white/40" : "text-black/40"
                        )}>
                          {formatDate(selectedNote.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className={cn(
                      "prose prose-lg max-w-none",
                      isDark ? "prose-invert text-white/80" : "text-black/80",
                      "whitespace-pre-wrap"
                    )}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          strong: ({node, ...props}) => (
                            <strong className={cn(
                              "font-bold",
                              isDark ? "text-white" : "text-black"
                            )} {...props} />
                          ),
                          p: ({node, ...props}) => (
                            <p className="mb-4 last:mb-0" {...props} />
                          )
                        }}
                      >
                        {selectedNote.content}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

              {/* Full Screen Document Modal */}
              <AnimatePresence>
                {selectedDocument && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  >
                    <div 
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      onClick={() => setSelectedDocument(null)}
                    />
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className={cn(
                        "relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl",
                        isDark 
                          ? "bg-black/80 border border-white/10" 
                          : "bg-white/90 border border-black/5"
                      )}
                    >
                      <div className="flex items-center justify-end gap-2 absolute top-4 right-4">
                        <a
                          href={selectedDocument.publicUrl}
                          download={selectedDocument.title}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isDark 
                              ? "hover:bg-white/10 text-white/60 hover:text-white" 
                              : "hover:bg-black/10 text-black/60 hover:text-black"
                          )}
                        >
                          <File className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => setSelectedDocument(null)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isDark 
                              ? "hover:bg-white/10 text-white/60 hover:text-white" 
                              : "hover:bg-black/10 text-black/60 hover:text-black"
                          )}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="mb-6">
                        <h2 className={cn(
                          "text-2xl font-semibold mb-2",
                          isDark ? "text-white/90" : "text-black/90"
                        )}>
                          {selectedDocument.title}
                        </h2>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span className={cn(
                            isDark ? "text-white/40" : "text-black/40"
                          )}>
                            {formatDate(selectedDocument.created_at)}
                          </span>
                          <span className={cn(
                            "ml-2 px-2 py-0.5 rounded text-xs uppercase",
                            isDark ? "bg-white/10 text-white/60" : "bg-black/10 text-black/60"
                          )}>
                            {selectedDocument.file_type.split('/')[1]}
                          </span>
                          <span className={cn(
                            isDark ? "text-white/40" : "text-black/40"
                          )}>
                            {(selectedDocument.file_size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>

                      {selectedDocument.file_type === 'application/pdf' ? (
                        <div className="relative w-full h-[70vh] rounded-lg border overflow-hidden">
                          <iframe
                            src={selectedDocument.publicUrl}
                            className="absolute inset-0 w-full h-full"
                            style={{
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                            }}
                          />
                        </div>
                      ) : (
                        <div className={cn(
                          "flex flex-col items-center justify-center py-12 text-center",
                          isDark ? "text-white/60" : "text-black/60"
                        )}>
                          <File className="w-12 h-12 mb-4 opacity-40" />
                          <p className="mb-2">This document type cannot be previewed</p>
                          <a
                            href={selectedDocument.publicUrl}
                            download={selectedDocument.title}
                            className={cn(
                              "text-sm px-4 py-2 rounded-lg transition-colors",
                              isDark 
                                ? "bg-white/10 hover:bg-white/20" 
                                : "bg-black/10 hover:bg-black/20"
                            )}
                          >
                            Download Document
                          </a>
                        </div>
                      )}

                      {selectedDocument.content && (
                        <div className={cn(
                          "mt-6 prose prose-lg max-w-none",
                          isDark ? "prose-invert text-white/80" : "text-black/80"
                        )}>
                          <h3 className={cn(
                            "text-lg font-medium mb-2",
                            isDark ? "text-white/90" : "text-black/90"
                          )}>
                            Notes
                          </h3>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              strong: ({node, ...props}) => (
                                <strong className={cn(
                                  "font-bold",
                                  isDark ? "text-white" : "text-black"
                                )} {...props} />
                              ),
                              p: ({node, ...props}) => (
                                <p className="mb-4 last:mb-0" {...props} />
                              )
                            }}
                          >
                            {selectedDocument.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Full Screen Website Modal */}
              <AnimatePresence>
                {selectedWebsite && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  >
                    <div 
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      onClick={() => setSelectedWebsite(null)}
                    />
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className={cn(
                        "relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl",
                        isDark 
                          ? "bg-black/80 border border-white/10" 
                          : "bg-white/90 border border-black/5"
                      )}
                    >
                      <div className="flex items-center justify-end gap-2 absolute top-4 right-4">
                        <a
                          href={selectedWebsite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isDark 
                              ? "hover:bg-white/10 text-white/60 hover:text-white" 
                              : "hover:bg-black/10 text-black/60 hover:text-black"
                          )}
                        >
                          <LinkIcon className="w-5 h-5" />
                        </a>
                        <button
                          onClick={() => setSelectedWebsite(null)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            isDark 
                              ? "hover:bg-white/10 text-white/60 hover:text-white" 
                              : "hover:bg-black/10 text-black/60 hover:text-black"
                          )}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="mb-6">
                        <h2 className={cn(
                          "text-2xl font-semibold mb-2",
                          isDark ? "text-white/90" : "text-black/90"
                        )}>
                          {selectedWebsite.title}
                        </h2>
                        <a 
                          href={selectedWebsite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "text-sm hover:underline",
                            isDark ? "text-blue-400" : "text-blue-600"
                          )}
                        >
                          {selectedWebsite.url}
                        </a>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span className={cn(
                            isDark ? "text-white/40" : "text-black/40"
                          )}>
                            {formatDate(selectedWebsite.created_at)}
                          </span>
                        </div>
                      </div>

                      {selectedWebsite.content && (
                        <div className={cn(
                          "prose prose-lg max-w-none",
                          isDark ? "prose-invert text-white/80" : "text-black/80"
                        )}>
                          <h3 className={cn(
                            "text-lg font-medium mb-2",
                            isDark ? "text-white/90" : "text-black/90"
                          )}>
                            Notes
                          </h3>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              strong: ({node, ...props}) => (
                                <strong className={cn(
                                  "font-bold",
                                  isDark ? "text-white" : "text-black"
                                )} {...props} />
                              ),
                              p: ({node, ...props}) => (
                                <p className="mb-4 last:mb-0" {...props} />
                              )
                            }}
                          >
                            {selectedWebsite.content}
                          </ReactMarkdown>
                        </div>
                      )}

                      <div className={cn(
                        "mt-6 p-8 rounded-lg text-center",
                        isDark ? "bg-white/5" : "bg-black/5"
                      )}>
                        <div className={cn(
                          "text-lg mb-4",
                          isDark ? "text-white/80" : "text-black/80"
                        )}>
                          This website cannot be embedded due to security restrictions.
                        </div>
                        <a
                          href={selectedWebsite.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors",
                            isDark 
                              ? "bg-white/10 hover:bg-white/20 text-white" 
                              : "bg-black/10 hover:bg-black/20 text-black"
                          )}
                        >
                          <LinkIcon className="w-5 h-5" />
                          Open Website in New Tab
                        </a>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
        </div>
      </div>
    </div>
  )
} 
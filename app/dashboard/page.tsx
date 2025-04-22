'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { BackgroundPaths } from "@/components/ui/background-paths"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LayoutGrid, List, LogOut, MessageSquarePlus, PlusCircle, Edit2, Trash2, Sparkles, X, Calendar, Wand2, LinkIcon, FileText, File, Boxes, Box, PanelLeftClose, PanelLeftOpen, Paintbrush, ImageIcon } from 'lucide-react' // Import new icons
import { generateNoteContent } from '@/utils/gemini'
import { generateOpenRouterContent } from '@/utils/openrouter'
import { ModelSelector, type Model } from '@/components/ui/model-selector'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { Navbar } from "../components/ui/navbar"
import { SpacesSidebar } from "@/components/ui/spaces-sidebar"
import { AVAILABLE_ICONS } from '@/lib/icons'
import { MenuBar } from "../components/ui/menu-bar"
import { SearchAndFilter, FilterOptions } from "../components/ui/search-filter"
import { Globe } from "lucide-react"
import Image from 'next/image'
import { MobileFormattingToolbar } from "@/components/ui/mobile-formatting-toolbar"
import { AIGenerationAnimation } from "@/components/ui/ai-generation-animation"
import { Slider } from "@/components/ui/slider"

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
  image_url?: string
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
  const [newNote, setNewNote] = useState({ title: '', content: '', image_url: '' })
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [selectionRange, setSelectionRange] = useState<{start: number; end: number} | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isAIEnabled, setIsAIEnabled] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [imageOpacity, setImageOpacity] = useState<number>(0.4)
  const [selectedModel, setSelectedModel] = useState<Model>(() => {
    // Try to load the selected model from localStorage
    if (typeof window !== 'undefined') {
      const storedModel = localStorage.getItem('selectedModel')
      if (storedModel) {
        try {
          return JSON.parse(storedModel) as Model
        } catch (e) {
          console.error('Error parsing stored model:', e)
        }
      }
    }
    // Default to Gemini 2.0 Flash if no stored model or error
    return {
      provider: 'gemini',
      name: 'gemini-2.0-flash',
      displayName: 'Gemini 2.0 Flash'
    }
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
  const [isCreatingSpace, setIsCreatingSpace] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('hash')
  const [longPressSpace, setLongPressSpace] = useState<Space | null>(null);
  const [showSpaceMenu, setShowSpaceMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressDuration = 500; // ms
  const [searchQuery, setSearchQuery] = useState("")
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    dateRange: 'all',
    sortBy: 'newest'
  })
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [filteredWebsites, setFilteredWebsites] = useState<Website[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [documentViewMode, setDocumentViewMode] = useState<'card' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('documentViewMode') as 'card' | 'grid') || 'card'
    }
    return 'card'
  })

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

  // Save selected model to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedModel', JSON.stringify(selectedModel))
  }, [selectedModel])

  // Save document view mode to localStorage
  useEffect(() => {
    localStorage.setItem('documentViewMode', documentViewMode)
  }, [documentViewMode])

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

        // Get all URL parameters once
        const params = new URLSearchParams(window.location.search)
        const spaceId = params.get('spaceId')
        const sourceType = params.get('type')
        const sourceId = params.get('id')

        console.log('URL parameters:', { spaceId, sourceType, sourceId })

        // First fetch spaces
        const { data: spacesData, error: spacesError } = await supabase
          .from('spaces')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (spacesError) throw spacesError
        setSpaces(spacesData || [])

        // Ensure storage infrastructure is set up
        try {
          const storageResponse = await fetch('/api/storage')
          const storageData = await storageResponse.json()
          console.log('Storage infrastructure status:', storageData)
        } catch (storageError) {
          // Non-blocking error - continue even if this fails
          console.warn('Could not verify storage setup:', storageError)
        }

        let initialSpace = null;

        // Handle space selection based on URL or default to first space
        if (spaceId && spacesData?.length) {
          // If spaceId is provided in the URL, select that space
          const targetSpace = spacesData.find(space => space.id === spaceId)
          if (targetSpace) {
            console.log('Loading space from URL parameter:', targetSpace.name)
            initialSpace = targetSpace
            await handleSpaceSelect(targetSpace)
          }
        } else if (spacesData && spacesData.length > 0) {
          // Select the first space if no spaceId is provided
          initialSpace = spacesData[0]
          console.log('Loading first space:', initialSpace.name)
          await handleSpaceSelect(initialSpace)
        }

        // Space content should be loaded by handleSpaceSelect
        // Now handle source selection if parameters exist
        if (sourceType && sourceId) {
          console.log('Source navigation requested:', { sourceType, sourceId })

          // Set the active tab based on source type
          setActiveTab(sourceType as 'note' | 'website' | 'document')

          // The space may have changed, so we need to wait for the content to load
          setTimeout(() => {
            console.log('Selecting source after timeout')
            if (sourceType === 'note') {
              const note = notes.find(n => n.id === sourceId)
              console.log('Looking for note:', sourceId, note ? 'found' : 'not found', 'in notes array length:', notes.length)
              if (note) setSelectedNote(note)
            } else if (sourceType === 'document') {
              const doc = documents.find(d => d.id === sourceId)
              console.log('Looking for document:', sourceId, doc ? 'found' : 'not found', 'in documents array length:', documents.length)
              if (doc) setSelectedDocument(doc)
            } else if (sourceType === 'website') {
              const website = websites.find(w => w.id === sourceId)
              console.log('Looking for website:', sourceId, website ? 'found' : 'not found', 'in websites array length:', websites.length)
              if (website) setSelectedWebsite(website)
            }
          }, 500)
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
    // If a space is selected, pass its ID to the chat page
    if (selectedSpace) {
      router.push(`/chat?spaceId=${selectedSpace.id}`)
    } else {
      router.push('/chat')
    }
  }

  const handleNewNote = () => {
    setEditingNote(null)
    setNewNote({ title: '', content: '', image_url: '' })
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

      console.log('Selecting space:', space.id, space.name)

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
      setSelectedWebsite(null)

      // Check for source navigation parameters
      const params = new URLSearchParams(window.location.search)
      const sourceType = params.get('type')
      const sourceId = params.get('id')
      if (sourceType && sourceId) {
        console.log('Space selection with source params:', { sourceType, sourceId, space: space.name })
        // Set the active tab based on source type
        setActiveTab(sourceType as 'note' | 'website' | 'document')
      }

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

      // Log content load status
      console.log('Space content loaded:', {
        space: space.name,
        notes: notesResult.data?.length || 0,
        websites: websitesResult.data?.length || 0,
        documents: documentsResult.data?.length || 0
      })

    } catch (error) {
      console.error('Error in handleSpaceSelect:', error)
      setError('Failed to fetch content for selected space')
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

      console.log(`Saving ${activeTab} memory to space:`, selectedSpace.id)

      // Handle different types of content based on active tab
      switch (activeTab) {
        case 'website':
          if (!websiteUrl) {
            setError('Please enter a website URL')
            return
          }

          // Basic URL validation
          let url = websiteUrl
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url
          }

          const websiteData = {
            title: url.split('//')[1].split('/')[0], // Use domain as title
            url: url,
            content: '', // Empty content since we removed fetch functionality
            user_id: user.id,
            space_id: selectedSpace.id,
            created_at: new Date().toISOString()
          }

          console.log('Saving website:', websiteData)
          const { data: websiteResult, error: websiteError } = await supabase
            .from('websites')
            .insert(websiteData)
            .select()
            .single()

          if (websiteError) {
            console.error('Error saving website:', websiteError)
            setError('Failed to save website. Please try again.')
            return
          }

          // Update UI with new website
          setWebsites(prev => [websiteResult, ...prev])
          setWebsiteUrl('') // Reset form
          setShowNewNote(false) // Close form
          setSelectedWebsite(websiteResult) // Select the new website
          setActiveTab('website') // Ensure we're on the websites tab
          console.log('Website saved successfully:', websiteResult)
          break

        case 'document':
          if (!documentFile) {
            setError('Please select a document to upload')
            return
          }

          try {
            console.log('Uploading document:', documentFile.name)
            // Create a unique file name
            const fileExt = documentFile.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            // Upload the file to Supabase storage
            const { error: uploadError, data: uploadData } = await supabase.storage
              .from('documents')
              .upload(filePath, documentFile, {
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error('Error uploading file:', uploadError)
              setError('Failed to upload file. Please try again.')
              return
            }

            if (!uploadData?.path) {
              setError('No file path returned')
              return
            }

            const documentData = {
              title: documentFile.name,
              file_path: filePath,
              content: '', // Empty content since we removed extract functionality
              file_type: documentFile.type,
              file_size: documentFile.size,
              user_id: user.id,
              space_id: selectedSpace.id,
              created_at: new Date().toISOString()
            }

            console.log('Saving document:', documentData)
            const { data: documentResult, error: documentError } = await supabase
              .from('documents')
              .insert(documentData)
              .select()
              .single()

            if (documentError) {
              console.error('Error saving document:', documentError)
              setError('Failed to save document. Please try again.')
              return
            }

            // Get the public URL
            const { data: { publicUrl } } = supabase
              .storage
              .from('documents')
              .getPublicUrl(filePath)

            // Create document with public URL
            const newDocument = { ...documentResult, publicUrl }

            // Update UI with new document
            setDocuments(prev => [newDocument, ...prev])
            setDocumentFile(null) // Reset form
            setShowNewNote(false) // Close form
            setSelectedDocument(newDocument) // Select the new document
            setActiveTab('document') // Ensure we're on the documents tab
            console.log('Document saved successfully:', newDocument)
          } catch (error) {
            console.error('Error handling document:', error)
            setError('Failed to upload document. Please try again.')
          }
          break

        case 'note':
        default:
          if (!newNote.content.trim()) {
            setError('Please enter some content for your note')
            return
          }

          const noteData = {
            title: newNote.title || 'Untitled Note',
            content: newNote.content,
            image_url: newNote.image_url,
            user_id: user.id,
            space_id: selectedSpace.id
          }

          console.log('Saving note:', noteData)

          if (editingNote) {
            // Update existing note
            const { data: updatedNote, error } = await supabase
              .from('notes')
              .update({
                ...noteData,
                updated_at: new Date().toISOString()
              })
              .eq('id', editingNote.id)
              .eq('user_id', user.id)
              .select()
              .single()

            if (error) {
              console.error('Error updating note:', error)
              setError('Failed to update note. Please try again.')
              return
            }

            // Update notes array with the updated note
            setNotes(prev => prev.map(note =>
              note.id === editingNote.id ? updatedNote : note
            ))
            setSelectedNote(updatedNote)
            console.log('Note updated successfully:', updatedNote)
          } else {
            // Create new note
            const { data, error } = await supabase
              .from('notes')
              .insert(noteData)
              .select()
              .single()

            if (error) {
              console.error('Error saving note:', error)
              setError('Failed to save note. Please try again.')
              return
            }

            // Update local state with the new note
            setNotes(prev => [data, ...prev])
            setSelectedNote(data)
            console.log('Note created successfully:', data)
          }

          // Reset UI
          setNewNote({ title: '', content: '', image_url: '' })
          setActiveTab('note')
          break
      }

      // Common cleanup
      setShowNewNote(false)
      setEditingNote(null)
      setIsAIEnabled(false)
      setError(null)
    } catch (error) {
      console.error('Error in handleSaveNote:', error)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setNewNote({
      title: note.title,
      content: note.content,
      image_url: note.image_url || ''
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
    setNewNote({ title: '', content: '', image_url: '' })
  }

  const handleNoteClick = () => {
    setActiveTab('note')
    setNewNote({ title: '', content: '', image_url: '' })
  }

  const handleDocumentClick = () => {
    setActiveTab('document')
    setNewNote({ title: '', content: '', image_url: '' })
  }

  const handleFetchContent = async () => {
    if (!websiteUrl) return

    try {
      setIsGenerating(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Basic URL validation
      let url = websiteUrl
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }

      // Call your backend API to fetch the content
      const response = await fetch('/api/fetch-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch content')
      }

      const { title, content } = await response.json()
      setNewNote(prev => ({
        ...prev,
        title: title || 'Website Memory',
        content: content || 'No content extracted'
      }))
      setError(null)
    } catch (error) {
      console.error('Error fetching content:', error)
      setError('Failed to fetch website content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file')
      return
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setDocumentFile(file)
    setError(null)
  }

  const handleExtractContent = async () => {
    if (!documentFile) return

    try {
      setIsGenerating(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // For text files, read directly
      if (documentFile.type === 'text/plain') {
        const text = await documentFile.text()
        const content = text.slice(0, 2000) // Limit content length

        if (isAIEnabled) {
          // Generate AI summary using OpenRouter
          try {
            const response = await fetch('/api/summarize', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ content }),
            })

            if (!response.ok) {
              throw new Error('Failed to generate summary')
            }

            const { summary } = await response.json()
            setNewNote(prev => ({
              ...prev,
              title: documentFile.name,
              content: `${summary}\n\nOriginal Content:\n${content}`
            }))
          } catch (error) {
            console.error('Error generating summary:', error)
            setError('Failed to generate AI summary. Using original content.')
            setNewNote(prev => ({
              ...prev,
              title: documentFile.name,
              content
            }))
          }
        } else {
          setNewNote(prev => ({
            ...prev,
            title: documentFile.name,
            content
          }))
        }
        return
      }

      // For other document types, we'll need to upload to Supabase first
      // and then extract content server-side
      const formData = new FormData()
      formData.append('file', documentFile)
      formData.append('generateAISummary', isAIEnabled.toString())

      const response = await fetch('/api/extract-document', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to extract content')
      }

      const { title, content, summary } = await response.json()
      setNewNote(prev => ({
        ...prev,
        title: title || documentFile.name,
        content: summary ? `${summary}\n\nOriginal Content:\n${content}` : content
      }))
      setError(null)
    } catch (error) {
      console.error('Error extracting content:', error)
      setError('Failed to extract document content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
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

  const handleImageUpload = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Make sure the file size is under 5MB
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be under 5MB')
      }

      // Create a unique file name
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString().substring(2)}.${fileExt}`
      const filePath = `note-images/${user.id}/${fileName}`

      console.log('Uploading file to:', filePath)

      // Upload the file to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Changed to true to overwrite if exists
        })

      if (uploadError) {
        console.error('Detailed upload error:', JSON.stringify(uploadError))
        throw new Error(uploadError.message || 'Failed to upload image')
      }

      if (!data?.path) {
        throw new Error('No file path returned')
      }

      // Get public URL for the image
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(data.path)

      console.log('Successfully uploaded image, public URL:', publicUrl)
      return publicUrl
    } catch (error) {
      console.error('Detailed error in handleImageUpload:', error)
      throw error
    }
  }

  // Handle long press on space in mobile view
  const handleTouchStart = (space: Space) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressSpace(space);
      setShowSpaceMenu(true);
    }, longPressDuration);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDeleteSpaceFromMobile = () => {
    if (longPressSpace && confirm(`Are you sure you want to delete "${longPressSpace.name}"? This will delete all content inside this space.`)) {
      handleDeleteSpace(longPressSpace.id);
    }
    setShowSpaceMenu(false);
    setLongPressSpace(null);
  };

  // After handleSpaceSelect is complete in the init function
  // Create a useEffect that watches for changes to these states to handle source selection
  useEffect(() => {
    const handleSourceNavigation = async () => {
      // Get URL parameters
      const params = new URLSearchParams(window.location.search);
      const sourceType = params.get('type');
      const sourceId = params.get('id');

      if (sourceType && sourceId && selectedSpace) {
        console.log('Trying to handle source selection after space loaded:', sourceType, sourceId);

        // Set the active tab based on source type
        setActiveTab(sourceType as 'note' | 'website' | 'document');

        // Try to select the specific source
        if (sourceType === 'note') {
          const note = notes.find(n => n.id === sourceId);
          console.log('Looking for note in current space:', note ? 'found' : 'not found');
          if (note) setSelectedNote(note);
        } else if (sourceType === 'document') {
          const doc = documents.find(d => d.id === sourceId);
          console.log('Looking for document in current space:', doc ? 'found' : 'not found');
          if (doc) setSelectedDocument(doc);
        } else if (sourceType === 'website') {
          const website = websites.find(w => w.id === sourceId);
          console.log('Looking for website in current space:', website ? 'found' : 'not found');
          if (website) setSelectedWebsite(website);
        }
      }
    };

    if (selectedSpace) {
      handleSourceNavigation();
    }
  }, [selectedSpace, notes, websites, documents]);

  // Add this useEffect to handle source selection after content is loaded
  useEffect(() => {
    // If we have URL parameters for source navigation, try to select the source
    const handleSourceSelectionAfterContentLoad = async () => {
      const params = new URLSearchParams(window.location.search);
      const sourceType = params.get('type');
      const sourceId = params.get('id');

      if (sourceType && sourceId && selectedSpace) {
        console.log('Trying to select source from URL parameters after content load',
          { sourceType, sourceId, space: selectedSpace.name });

        // Set the active tab based on source type
        setActiveTab(sourceType as 'note' | 'website' | 'document');

        // Use setTimeout to ensure state updates have completed
        setTimeout(() => {
          // Try to find and select the source in the loaded content
          if (sourceType === 'note' && notes.length > 0) {
            const note = notes.find(n => n.id === sourceId);
            console.log('Looking for note:', sourceId, note ? 'found' : 'not found', 'in space:', selectedSpace.name);
            if (note) setSelectedNote(note);
          } else if (sourceType === 'document' && documents.length > 0) {
            const doc = documents.find(d => d.id === sourceId);
            console.log('Looking for document:', sourceId, doc ? 'found' : 'not found', 'in space:', selectedSpace.name);
            if (doc) setSelectedDocument(doc);
          } else if (sourceType === 'website' && websites.length > 0) {
            const website = websites.find(w => w.id === sourceId);
            console.log('Looking for website:', sourceId, website ? 'found' : 'not found', 'in space:', selectedSpace.name);
            if (website) setSelectedWebsite(website);
          }
        }, 500); // Give a 500ms delay to ensure state is fully updated
      }
    };

    // Only run if we have content loaded
    if (selectedSpace && (notes.length > 0 || websites.length > 0 || documents.length > 0)) {
      handleSourceSelectionAfterContentLoad();
    }
  }, [selectedSpace, notes, websites, documents]);

  // Initialize filtered arrays when notes, websites, or documents change
  useEffect(() => {
    setFilteredNotes(notes);
    setFilteredWebsites(websites);
    setFilteredDocuments(documents);
  }, [notes, websites, documents]);

  // Apply search and filters to the items
  useEffect(() => {
    // Filter notes
    const searchFilterNotes = notes.filter(note => {
      // Search filtering
      const matchesSearch = searchQuery === '' ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());

      // Date filtering
      let matchesDate = true;
      if (filterOptions.dateRange !== 'all') {
        const noteDate = new Date(note.created_at);
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0));

        if (filterOptions.dateRange === 'today') {
          matchesDate = noteDate >= todayStart;
        } else if (filterOptions.dateRange === 'week') {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          weekStart.setHours(0, 0, 0, 0);
          matchesDate = noteDate >= weekStart;
        } else if (filterOptions.dateRange === 'month') {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          matchesDate = noteDate >= monthStart;
        }
      }

      return matchesSearch && matchesDate;
    });

    // Sort notes
    let sortedNotes = [...searchFilterNotes];
    if (filterOptions.sortBy === 'newest') {
      sortedNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filterOptions.sortBy === 'oldest') {
      sortedNotes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (filterOptions.sortBy === 'alphabetical') {
      sortedNotes.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredNotes(sortedNotes);

    // Filter websites
    const searchFilterWebsites = websites.filter(website => {
      // Search filtering
      const matchesSearch = searchQuery === '' ||
        website.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        website.content.toLowerCase().includes(searchQuery.toLowerCase());

      // Date filtering
      let matchesDate = true;
      if (filterOptions.dateRange !== 'all') {
        const websiteDate = new Date(website.created_at);
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0));

        if (filterOptions.dateRange === 'today') {
          matchesDate = websiteDate >= todayStart;
        } else if (filterOptions.dateRange === 'week') {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          weekStart.setHours(0, 0, 0, 0);
          matchesDate = websiteDate >= weekStart;
        } else if (filterOptions.dateRange === 'month') {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          matchesDate = websiteDate >= monthStart;
        }
      }

      return matchesSearch && matchesDate;
    });

    // Sort websites
    let sortedWebsites = [...searchFilterWebsites];
    if (filterOptions.sortBy === 'newest') {
      sortedWebsites.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filterOptions.sortBy === 'oldest') {
      sortedWebsites.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (filterOptions.sortBy === 'alphabetical') {
      sortedWebsites.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredWebsites(sortedWebsites);

    // Filter documents
    const searchFilterDocuments = documents.filter(document => {
      // Search filtering
      const matchesSearch = searchQuery === '' ||
        document.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        document.content.toLowerCase().includes(searchQuery.toLowerCase());

      // Date filtering
      let matchesDate = true;
      if (filterOptions.dateRange !== 'all') {
        const documentDate = new Date(document.created_at);
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0));

        if (filterOptions.dateRange === 'today') {
          matchesDate = documentDate >= todayStart;
        } else if (filterOptions.dateRange === 'week') {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          weekStart.setHours(0, 0, 0, 0);
          matchesDate = documentDate >= weekStart;
        } else if (filterOptions.dateRange === 'month') {
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          matchesDate = documentDate >= monthStart;
        }
      }

      return matchesSearch && matchesDate;
    });

    // Sort documents
    let sortedDocuments = [...searchFilterDocuments];
    if (filterOptions.sortBy === 'newest') {
      sortedDocuments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filterOptions.sortBy === 'oldest') {
      sortedDocuments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (filterOptions.sortBy === 'alphabetical') {
      sortedDocuments.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredDocuments(sortedDocuments);
  }, [notes, websites, documents, searchQuery, filterOptions]);

  // Handle search and filter
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilter = (options: FilterOptions) => {
    setFilterOptions(options);
  };

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
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
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
        </div>
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar
          isDark={isDark}
          onStartChat={handleStartChat}
          onSignOut={handleSignOut}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
            email={email || undefined}
        />

          {/* Mobile Spaces Bar */}
          <div className="md:hidden w-full overflow-x-auto sticky top-14 z-30 border-b px-2 py-2"
            style={{
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(8px)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    onClick={() => handleSpaceSelect(space)}
                    onTouchStart={() => handleTouchStart(space)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className={cn(
                      "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors whitespace-nowrap relative",
                      isDark
                        ? selectedSpace?.id === space.id
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5"
                        : selectedSpace?.id === space.id
                          ? "bg-black/10 text-black"
                          : "text-black/60 hover:bg-black/5"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {space.icon && (
                        <div className={cn(
                          "w-4 h-4",
                          isDark
                            ? selectedSpace?.id === space.id
                              ? "text-white"
                              : "text-white/60"
                            : selectedSpace?.id === space.id
                              ? "text-black"
                              : "text-black/60"
                        )}>
                          {(() => {
                            const IconComp = AVAILABLE_ICONS[space.icon];
                            return IconComp ? <IconComp className="w-4 h-4" /> : null;
                          })()}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium">{space.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    // Open create space modal directly
                    setIsCreatingSpace(true);
                    setNewSpaceName('');
                    setSelectedIcon('hash');
                  }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0",
                    isDark
                      ? "text-white/60 hover:bg-white/5 border border-white/10"
                      : "text-black/60 hover:bg-black/5 border border-black/10"
                  )}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">New</span>
                </button>
              </div>
            </div>
          </div>

          <main className="flex-1 overflow-auto p-4 md:pt-24 pt-16">
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
                    "p-4 sm:p-6 rounded-xl border",
                  isDark
                    ? "bg-black/60 border-white/10"
                    : "bg-white/60 border-black/5"
                )}
              >
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                      <h2 className="text-lg sm:text-xl font-semibold">Add Memory</h2>
                    <button
                      onClick={() => {
                        setShowNewNote(false)
                        setEditingNote(null)
                          setNewNote({ title: '', content: '', image_url: '' })
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

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6">
                    {/* Left Column - Options */}
                      <div className="sm:col-span-4 space-y-3 sm:space-y-4">
                      <button
                        onClick={handleWebsiteClick}
                        className={cn(
                            "w-full p-3 sm:p-4 rounded-lg border flex items-center gap-3 transition-colors",
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
                            "w-full p-3 sm:p-4 rounded-lg border flex items-center gap-3 transition-colors",
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
                            "w-full p-3 sm:p-4 rounded-lg border flex items-center gap-3 transition-colors",
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

                      {/* Right Column - Content */}
                      <div className="sm:col-span-8 space-y-4">
                        {activeTab === 'website' && (
                          <div className="space-y-3">
                            <input
                              type="url"
                              value={websiteUrl}
                              onChange={(e) => setWebsiteUrl(e.target.value)}
                              placeholder="Enter website URL"
                              className={cn(
                                "w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition-colors",
                                isDark
                                  ? "border-white/10 focus:border-white/20 placeholder:text-white/30"
                                  : "border-black/10 focus:border-black/20 placeholder:text-black/30"
                              )}
                            />
                          </div>
                        )}

                        {activeTab === 'document' && (
                          <div className="space-y-3">
                            <div
                                className={cn(
                                "w-full p-4 rounded-lg border-2 border-dashed text-center cursor-pointer transition-colors",
                                isDark
                                  ? "border-white/10 hover:bg-white/5"
                                  : "border-black/10 hover:bg-black/5"
                              )}
                              onClick={() => document.getElementById('document-upload')?.click()}
                            >
                              <input
                                type="file"
                                id="document-upload"
                                className="hidden"
                                onChange={handleDocumentUpload}
                                accept=".pdf,.doc,.docx,.txt"
                              />
                              <div className="flex flex-col items-center gap-2">
                                <File className="w-8 h-8 opacity-50" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {documentFile ? documentFile.name : 'Click to upload a document'}
                                  </p>
                                  <p className={cn(
                                    "text-xs mt-1",
                                    isDark ? "text-white/50" : "text-black/50"
                                  )}>
                                    PDF, DOC, DOCX, or TXT
                                  </p>
                            </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'note' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                placeholder="Title"
                    className={cn(
                                  "flex-1 px-3 py-2 rounded-lg border bg-transparent outline-none transition-colors",
                      isDark
                                    ? "border-white/10 focus:border-white/20 placeholder:text-white/30"
                                    : "border-black/10 focus:border-black/20 placeholder:text-black/30"
                                )}
                              />
                              <button
                      onClick={() => setIsAIEnabled(!isAIEnabled)}
                      className={cn(
                                  "ml-2 p-2 rounded-lg transition-colors flex items-center gap-2",
                      isDark
                                    ? isAIEnabled ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                                    : isAIEnabled ? "bg-black/10 text-black" : "text-black/60 hover:text-black hover:bg-black/5"
                                )}
                              >
                                <Sparkles className="w-4 h-4" />
                                <span className="hidden sm:inline">AI Mode</span>
                    </button>
                      </div>

                            {/* Image upload section */}
                            <div
                              className={cn(
                                "w-full p-4 rounded-lg border-2 border-dashed text-center cursor-pointer transition-colors",
                                newNote.image_url
                                  ? "bg-cover bg-center relative"
                                  : isDark
                                    ? "border-white/10 hover:bg-white/5"
                                    : "border-black/10 hover:bg-black/5",
                                "group"
                              )}
                              style={newNote.image_url ? {
                                backgroundImage: `url(${newNote.image_url})`,
                                backgroundSize: 'cover'
                              } : {}}
                              onClick={() => document.getElementById('note-image-upload')?.click()}
                            >
                              <input
                                type="file"
                                id="note-image-upload"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return

                                  // Check if it's an image
                                  if (!file.type.startsWith('image/')) {
                                    setError('Please upload an image file (JPEG, PNG, GIF)')
                                      return
                                    }

                                  setIsImageUploading(true)
                                  try {
                                    const imageUrl = await handleImageUpload(file)
                                    setNewNote(prev => ({ ...prev, image_url: imageUrl }))
                                    setError(null)
                                  } catch (error) {
                                    console.error('Error uploading image:', error)
                                    setError(error instanceof Error ? error.message : 'Failed to upload image. Please try again.')
                                  } finally {
                                    setIsImageUploading(false)
                                  }
                                }}
                                accept="image/*"
                              />
                              <div className="flex flex-col items-center gap-2 z-10 relative">
                                {isImageUploading ? (
                                  <div className={cn(
                                    "p-2 rounded-lg",
                                    isDark ? "bg-black/50" : "bg-white/50"
                                  )}>
                                    <div className="flex items-center gap-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                                      <span className={cn(
                                        "text-sm font-medium",
                                        isDark ? "text-white" : "text-black"
                                      )}>
                                        Uploading...
                                      </span>
                                    </div>
                                  </div>
                                ) : newNote.image_url ? (
                                  <div className={cn(
                                    "p-2 rounded-lg",
                                    isDark ? "bg-black/50" : "bg-white/50"
                                  )}>
                                    <div className={cn(
                                      "text-sm font-medium",
                                      isDark ? "text-white" : "text-black"
                                    )}>
                                      Change Background Image
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className={cn(
                                      "p-2 rounded-full",
                                    isDark ? "bg-white/10" : "bg-black/10"
                                  )}>
                                      <ImageIcon className="w-6 h-6 opacity-50" />
                                  </div>
                                    <div>
                                      <p className="text-sm font-medium">Add a background image</p>
                                      <p className={cn(
                                        "text-xs mt-1",
                                        isDark ? "text-white/50" : "text-black/50"
                                      )}>
                                        JPEG, PNG, or GIF (max 5MB)
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                              {newNote.image_url && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                    setNewNote(prev => ({ ...prev, image_url: '' }))
                                    }}
                                    className={cn(
                                    "absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                                    isDark ? "bg-black/50 text-white" : "bg-white/70 text-black"
                                  )}
                                >
                                  <X className="w-4 h-4" />
                                  </button>
                              )}
                                </div>

                            <div className="relative">
                              {/* Simple Formatting Toolbar */}
                              <MobileFormattingToolbar
                                isDark={isDark}
                                selectedText={selectedText}
                                onFormat={(format, text) => {
                                  if (!selectionRange || !text) return;

                                  const { start, end } = selectionRange;
                                  const content = newNote.content;
                                  let newContent = content;

                                  switch (format) {
                                    case 'bold':
                                      newContent = content.substring(0, start) + `**${text}**` + content.substring(end);
                                      break;
                                    case 'italic':
                                      newContent = content.substring(0, start) + `*${text}*` + content.substring(end);
                                      break;
                                    case 'underline':
                                      newContent = content.substring(0, start) + `<u>${text}</u>` + content.substring(end);
                                      break;
                                    case 'bullet':
                                      newContent = content.substring(0, start) + `\n- ${text}` + content.substring(end);
                                      break;
                                    case 'numbered':
                                      newContent = content.substring(0, start) + `\n1. ${text}` + content.substring(end);
                                      break;
                                    case 'heading':
                                      newContent = content.substring(0, start) + `\n## ${text}` + content.substring(end);
                                      break;
                                    case 'quote':
                                      newContent = content.substring(0, start) + `\n> ${text}` + content.substring(end);
                                      break;
                                    case 'link':
                                      newContent = content.substring(0, start) + `[${text}](url)` + content.substring(end);
                                      break;
                                    case 'code':
                                      newContent = content.substring(0, start) + `\`${text}\`` + content.substring(end);
                                      break;
                                    default:
                                      return;
                                  }

                                  setNewNote({ ...newNote, content: newContent });

                                  // Focus back on the textarea and set cursor position after the formatted text
                                  setTimeout(() => {
                                    if (textareaRef.current) {
                                      textareaRef.current.focus();
                                    }
                                  }, 0);
                                }}
                              />

                              <textarea
                                ref={textareaRef}
                                value={newNote.content}
                                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                onKeyDown={handleKeyDown}
                                onSelect={() => {
                                  if (textareaRef.current) {
                                    const start = textareaRef.current.selectionStart;
                                    const end = textareaRef.current.selectionEnd;

                                    if (start !== end) {
                                      const text = newNote.content.substring(start, end);
                                      setSelectedText(text);
                                      setSelectionRange({ start, end });
                                    } else {
                                      setSelectedText(null);
                                      setSelectionRange(null);
                                    }
                                  }
                                }}
                                onMouseUp={() => {
                                  if (textareaRef.current) {
                                    const start = textareaRef.current.selectionStart;
                                    const end = textareaRef.current.selectionEnd;

                                    if (start !== end) {
                                      const text = newNote.content.substring(start, end);
                                      setSelectedText(text);
                                      setSelectionRange({ start, end });
                                    }
                                  }
                                }}
                                placeholder={isAIEnabled ? "Press Enter to generate with AI..." : "Write your note..."}
                                rows={6}
                                className={cn(
                                  "w-full px-3 py-2 rounded-lg border bg-transparent outline-none transition-colors resize-none",
                                  isDark
                                    ? "border-white/10 focus:border-white/20 placeholder:text-white/30"
                                    : "border-black/10 focus:border-black/20 placeholder:text-black/30"
                                )}
                              />

                              {/* Enhanced AI Generation Animation */}
                              <AnimatePresence>
                                {isGenerating && (
                                  <AIGenerationAnimation
                                    isDark={isDark}
                                    isGenerating={isGenerating}
                                  />
                                )}
                              </AnimatePresence>
                              {isAIEnabled && !isGenerating && (
                                <button
                                  onClick={async () => {
                                    const content = newNote.content.trim();
                                    if (!content) return;

                                    try {
                                      setIsGenerating(true);

                                      if (selectedModel.provider === 'gemini') {
                                        const aiContent = await generateNoteContent(content);
                                        setNewNote({ ...newNote, content: aiContent });
                                      } else {
                                        const response = await generateOpenRouterContent(selectedModel.name, content);
                                        if (typeof response === 'string') {
                                          setNewNote({ ...newNote, content: response });
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

                                              buffer += decoder.decode(value, { stream: true });

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
                                                    const streamContent = parsed.choices[0].delta.content;
                                                    if (streamContent) {
                                                      accumulatedContent += streamContent;
                                                      setNewNote({ ...newNote, content: accumulatedContent });
                                                    }
                                                  } catch (e) {
                                                    // Ignore invalid JSON
                                                  }
                                                }
                                              }
                                            }
                                          } catch (error) {
                                            console.error('Error reading stream:', error);
                                            setNewNote({ ...newNote, content });
                                          } finally {
                                            reader.releaseLock();
                                          }
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Error generating AI content:', error);
                                      setNewNote({ ...newNote, content });
                                    } finally {
                                      setIsGenerating(false);
                                    }
                                  }}
                                  className={cn(
                                    "absolute right-2 bottom-2 p-2 rounded-lg transition-colors",
                                    isDark
                                      ? "hover:bg-white/10 text-white/60 hover:text-white"
                                      : "hover:bg-black/10 text-black/60 hover:text-black"
                                  )}
                                >
                                  <Wand2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {isAIEnabled && (
                        <div className="flex items-center justify-end w-full sm:justify-start">
                            <ModelSelector
                              selectedModel={selectedModel}
                              onModelChange={setSelectedModel}
                              isDark={isDark}
                              openRight={true}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowNewNote(false)
                      setEditingNote(null)
                              setNewNote({ title: '', content: '', image_url: '' })
                      setIsAIEnabled(false)
                    }}
                    className={cn(
                              "px-4 py-2 rounded-lg transition-colors text-sm",
                      isDark
                                ? "text-white/60 hover:bg-white/5"
                                : "text-black/60 hover:bg-black/5"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                            disabled={
                              activeTab === 'website' ? !websiteUrl :
                              activeTab === 'document' ? !documentFile :
                              !newNote.content.trim()
                            }
                    className={cn(
                              "px-4 py-2 rounded-lg transition-colors text-sm font-medium",
                              isDark
                                ? "bg-white text-black hover:bg-white/90 disabled:opacity-50"
                                : "bg-black text-white hover:bg-black/90 disabled:opacity-50"
                            )}
                          >
                            {editingNote ? 'Update' : 'Save'} Memory
                  </button>
                      </div>
                    </div>
                </div>
              </motion.div>
            )}

              {/* Content Grid */}
              <div className="space-y-8">
                {/* Content Type Selector */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-center">
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

                  {/* Search and Filter */}
                  {/* Global Search and Filter (Toggle buttons removed from here) */}
                  <SearchAndFilter
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                    isDark={isDark}
                    className="mt-4"
                  />

                  {/* Filter Result Count */}
                  {searchQuery.trim() !== '' && (
                    <div className={cn(
                      "text-center text-sm py-1.5 rounded-md border",
                      isDark
                        ? "border-slate-700 bg-slate-800/60 text-white/60"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    )}>
                      <span className="font-medium text-xs">
                        Showing {
                          activeTab === 'all'
                            ? filteredNotes.length + filteredWebsites.length + filteredDocuments.length
                            : activeTab === 'note'
                              ? filteredNotes.length
                              : activeTab === 'website'
                                ? filteredWebsites.length
                                : filteredDocuments.length
                        } result{
                          (activeTab === 'all'
                            ? filteredNotes.length + filteredWebsites.length + filteredDocuments.length
                            : activeTab === 'note'
                              ? filteredNotes.length
                              : activeTab === 'website'
                                ? filteredWebsites.length
                                : filteredDocuments.length) !== 1 ? 's' : ''
                        } for <span className={isDark ? "text-emerald-400" : "text-emerald-600"}>"{searchQuery}"</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                {(activeTab === 'all' || activeTab === 'note') && filteredNotes.length > 0 && (
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
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedNote(note)}
                  className={cn(
                    "p-6 rounded-xl border group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden",
                            isDark ? "border-white/10" : "border-black/10",
                            note.color || (isDark ? "bg-black/60" : "bg-white/60"),
                            note.color ? `hover:${note.color.replace('bg-', 'bg-opacity-90')}` : (isDark ? "hover:bg-black/70" : "hover:bg-white/80")
                  )}
                  style={note.image_url ? { position: 'relative' } : {}}
                >
                  {note.image_url && (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${note.image_url})`,
                        opacity: imageOpacity
                      }}
                    />
                  )}

                  <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <h3 className={cn(
                      "text-lg font-medium line-clamp-1",
                      isDark ? "text-white/90" : "text-black/90"
                    )}>
                      {note.title}
                    </h3>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto">
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
                            "p-1 rounded-lg transition-colors pointer-events-auto",
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
                            "p-1 rounded-lg transition-colors pointer-events-auto",
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
                            "p-1 rounded-lg transition-colors pointer-events-auto",
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
                  </div>
                </motion.div>
              ))}
                    </div>
                  </div>
                )}

                {/* Websites Section */}
                {(activeTab === 'all' || activeTab === 'website') && filteredWebsites.length > 0 && (
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
                      {filteredWebsites.map((website) => (
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
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto">
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
                                  "p-1 rounded-lg transition-colors pointer-events-auto",
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
                                  "p-1 rounded-lg transition-colors pointer-events-auto",
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
                {(activeTab === 'all' || activeTab === 'document') && filteredDocuments.length > 0 && (
                  <div>
                    {/* Documents Header and View Toggle */}
                    <div className="flex justify-between items-center mb-4 mt-8">
                      <h3 className={cn(
                        "text-lg font-medium", // Removed mb-4, mt-8 as parent handles spacing
                        isDark ? "text-white/90" : "text-black/90",
                        // Hide heading if only documents tab is active (redundant)
                        activeTab === 'document' && 'sr-only'
                      )}>
                        Documents
                      </h3>
                      {/* View Mode Toggle Buttons - Moved to right side */}
                      <div className="flex items-center gap-1 ml-auto"> {/* Added ml-auto to push to right */}
                        <button
                          onClick={() => setDocumentViewMode('card')}
                          className={cn(
                            "p-1.5 rounded-md transition-colors", // Slightly larger padding, rounded-md
                            documentViewMode === 'card'
                              ? (isDark ? "bg-white/10 text-white" : "bg-black/10 text-black") // Active state
                              : (isDark ? "text-white hover:bg-white/5 hover:text-white/80" : "text-black hover:bg-black/5 hover:text-black/80") // Inactive state - Updated text color
                          )}
                          aria-label="Card View"
                        >
                          <List size={18} className={cn(
                            documentViewMode === 'card'
                              ? (isDark ? "text-white" : "text-black") // Active state
                              : (isDark ? "text-white/50 group-hover:text-white/80" : "text-black/50 group-hover:text-black/80") // Inactive state
                          )} />
                        </button>
                        <button
                          onClick={() => setDocumentViewMode('grid')}
                          className={cn(
                            "p-1.5 rounded-md transition-colors group", // Added group class for hover effects
                            documentViewMode === 'grid'
                              ? (isDark ? "bg-white/10 text-white" : "bg-black/10 text-black") // Active state
                              : (isDark ? "text-white/50 hover:bg-white/5 hover:text-white/80" : "text-black/50 hover:bg-black/5 hover:text-black/80") // Inactive state - Updated text color
                          )}
                          aria-label="Grid View"
                        >
                          <LayoutGrid size={18} className={cn(
                            documentViewMode === 'grid'
                              ? (isDark ? "text-white" : "text-black") // Active state
                              : (isDark ? "text-white/50 group-hover:text-white/80" : "text-black/50 group-hover:text-black/80") // Inactive state
                          )} />
                        </button>
                      </div>
                    </div>

                    {/* Conditional Rendering based on View Mode */}
                    {documentViewMode === 'card' ? (
                      // Card View (Existing Layout)
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDocuments.map((document) => (
                          <motion.div
                            key={document.id}
                            layout // Added layout prop for smoother transitions
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }} // Added exit animation
                            transition={{ duration: 0.2 }} // Added transition duration
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
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto">
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
                                    "p-1 rounded-lg transition-colors pointer-events-auto",
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
                                    "p-1 rounded-lg transition-colors pointer-events-auto",
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
                                    "p-1 rounded-lg transition-colors pointer-events-auto",
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
                    ) : (
                      // Grid View (New Square Layout)
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredDocuments.map((document) => (
                          <motion.div
                            key={document.id}
                            layout // Added layout prop
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "aspect-square p-3 rounded-lg border cursor-pointer transition-all duration-200 relative group flex flex-col items-center justify-center text-center",
                              selectedDocument?.id === document.id
                                ? (isDark ? "bg-slate-700/50 border-slate-600" : "bg-slate-100 border-slate-300") // Highlight selected
                                : (isDark ? "border-white/10" : "border-black/10"), // Default border
                              document.color || (isDark ? "bg-black/60" : "bg-white/60"), // Background color
                              document.color ? `hover:${document.color.replace('bg-', 'bg-opacity-90')}` : (isDark ? "hover:bg-black/70" : "hover:bg-white/80") // Hover background
                            )}
                            onClick={() => setSelectedDocument(document)}
                          >
                            {/* Icon */}
                            <File size={32} className={cn("mb-2 flex-shrink-0", isDark ? "text-white/80" : "text-black/80")} />
                            {/* Title (truncated) */}
                            <h4 className={cn(
                              "text-xs font-medium w-full truncate",
                              isDark ? "text-white/80" : "text-black/80"
                            )}>
                              {document.title || 'Untitled Document'}
                            </h4>
                            {/* Action buttons (appear on hover) */}
                            <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const colors = [
                                    'bg-white dark:bg-zinc-950', 'bg-red-50 dark:bg-red-950', 'bg-blue-50 dark:bg-blue-950',
                                    'bg-green-50 dark:bg-green-950', 'bg-yellow-50 dark:bg-yellow-950', 'bg-purple-50 dark:bg-purple-950',
                                    'bg-pink-50 dark:bg-pink-950'
                                  ];
                                  const currentIndex = colors.indexOf(document.color || colors[0]);
                                  const nextColor = colors[(currentIndex + 1) % colors.length];
                                  handleColorChange(document.id, nextColor, 'document');
                                }}
                                className={cn(
                                  "p-0.5 rounded transition-colors pointer-events-auto",
                                  isDark ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/10 text-black/60 hover:text-black"
                                )}
                                title="Change color"
                              >
                                <Paintbrush size={14} />
                              </button>
                              <a
                                href={document.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                  "p-0.5 rounded transition-colors pointer-events-auto",
                                  isDark ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/10 text-black/60 hover:text-black"
                                )}
                                title="Open Document"
                              >
                                <File size={14} />
                              </a>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(document.id, document.file_path);
                                }}
                                className={cn(
                                  "p-0.5 rounded transition-colors pointer-events-auto",
                                  isDark ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/10 text-black/60 hover:text-black"
                                )}
                                title="Delete Document"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Show empty state when no items in current tab or no items at all */}
                {((activeTab === 'note' && filteredNotes.length === 0) ||
                  (activeTab === 'website' && filteredWebsites.length === 0) ||
                  (activeTab === 'document' && filteredDocuments.length === 0) ||
                  (activeTab === 'all' && filteredNotes.length === 0 && filteredWebsites.length === 0 && filteredDocuments.length === 0)) && (
                  <div className="text-center py-12">
                    <div className={cn(
                      "max-w-md mx-auto",
                      isDark ? "text-white/60" : "text-black/60"
                    )}>
                      {searchQuery.trim() !== '' ? (
                        <>
                          <h3 className="text-xl font-medium mb-3">No matches found</h3>
                          <p className={cn(
                            "mb-4 max-w-sm mx-auto text-sm",
                            isDark ? "text-white/60" : "text-slate-500"
                          )}>
                            Try adjusting your search or filter criteria to find what you're looking for.
                          </p>
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setFilterOptions({
                                dateRange: 'all',
                                sortBy: 'newest'
                              });
                            }}
                            className={cn(
                              "mt-2 px-4 py-2 rounded-md transition-colors text-sm font-medium border",
                              isDark
                                ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                                : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                            )}
                          >
                            Clear search & filters
                          </button>
                        </>
                      ) : (
                        <>
                          <h3 className="text-xl font-medium mb-3">No items to display</h3>
                          <p className={cn(
                            "mb-4 max-w-sm mx-auto text-sm",
                            isDark ? "text-white/60" : "text-slate-500"
                          )}>
                            {activeTab === 'all'
                              ? "Looks like you haven't created any memories yet."
                              : activeTab === 'note'
                                ? "Add your first note by clicking the 'Add Memory' button above."
                                : activeTab === 'website'
                                  ? "You haven't saved any websites yet."
                                  : "You haven't added any documents yet."
                            }
                          </p>
                          <button
                            onClick={
                              activeTab === 'note' || activeTab === 'all'
                                ? handleNewNote
                                : activeTab === 'website'
                                  ? handleWebsiteClick
                                  : handleDocumentClick
                            }
                            className={cn(
                              "mt-2 px-4 py-2 rounded-md transition-colors text-sm font-medium",
                              isDark
                                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:opacity-90"
                                : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:opacity-90"
                            )}
                          >
                            {activeTab === 'note' || activeTab === 'all'
                              ? "Add Memory"
                              : activeTab === 'website'
                                ? "Add Website"
                                : "Add Document"
                            }
                          </button>
                        </>
                      )}
                    </div>
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
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
                    onClick={() => {
                      setSelectedNote(null);
                      setImageOpacity(0.4); // Reset opacity when closing
                    }}
                  />
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className={cn(
                      "relative w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl z-50 flex flex-col",
                      isDark
                        ? "bg-black/80 border border-white/10"
                        : "bg-white/90 border border-black/5"
                    )}
                  >
                    {selectedNote.image_url && (
                      <>
                        <div
                          className="absolute inset-0 bg-cover bg-center rounded-xl"
                          style={{
                            backgroundImage: `url(${selectedNote.image_url})`,
                            pointerEvents: 'none',
                            opacity: imageOpacity
                          }}
                        />
                        <div className={cn(
                          "absolute bottom-4 right-4 z-20 p-1.5 rounded-full backdrop-blur-sm flex items-center gap-2 w-24 opacity-60 hover:opacity-100 transition-opacity duration-200",
                          isDark
                            ? "bg-black/5"
                            : "bg-white/5"
                        )}>
                          <Slider
                            defaultValue={[imageOpacity * 100]}
                            max={100}
                            step={1}
                            onValueChange={(value) => setImageOpacity(value[0] / 100)}
                            className="w-full"
                          />
                        </div>
                      </>
                    )}

                    <div className="relative z-10 p-6 pb-3 border-b border-gray-200/10">
                      <div className="flex items-center justify-between">
                        <h2 className={cn(
                          "text-2xl font-semibold",
                          isDark ? "text-white/90" : "text-black/90"
                        )}>
                          {selectedNote.title}
                        </h2>
                        <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          handleEditNote(selectedNote);
                          setSelectedNote(null);
                          setImageOpacity(0.4); // Reset opacity when editing
                        }}
                        className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors",
                          isDark
                                ? "bg-white/10 hover:bg-white/20 text-white"
                                : "bg-black/10 hover:bg-black/20 text-black"
                        )}
                      >
                            <Edit2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedNote(null);
                          setImageOpacity(0.4); // Reset opacity when closing
                        }}
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
                    </div>

                      <div className="flex items-center gap-2 text-sm mt-2">
                        <Calendar className="w-4 h-4" />
                        <span className={cn(
                          isDark ? "text-white/40" : "text-black/40"
                        )}>
                          {formatDate(selectedNote.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 flex-1 overflow-y-auto p-6 pt-4">
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
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
                      onClick={() => setSelectedDocument(null)}
                    />
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className={cn(
                      "relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl z-50",
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
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
                      onClick={() => setSelectedWebsite(null)}
                    />
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className={cn(
                      "relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-2xl z-50",
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

      {/* Create Space Modal */}
      <AnimatePresence>
        {isCreatingSpace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsCreatingSpace(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={cn(
                "relative w-full max-w-sm rounded-xl p-6 shadow-2xl",
                isDark
                  ? "bg-black/80 border border-white/10"
                  : "bg-white/90 border border-black/5"
              )}
            >
              <h2 className={cn(
                "text-xl font-semibold mb-4",
                isDark ? "text-white/90" : "text-black/90"
              )}>
                Create New Space
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isDark ? "text-white/60" : "text-black/60"
                  )}>
                    Space Name
                  </label>
                  <input
                    type="text"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="Enter space name"
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      isDark
                        ? "bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        : "bg-black/5 border-black/10 text-black placeholder:text-black/30"
                    )}
                  />
                </div>
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isDark ? "text-white/60" : "text-black/60"
                  )}>
                    Icon
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {Object.entries(AVAILABLE_ICONS).map(([key, Icon]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedIcon(key)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isDark
                            ? selectedIcon === key
                              ? "bg-white/20 text-white"
                              : "hover:bg-white/10 text-white/60"
                            : selectedIcon === key
                              ? "bg-black/20 text-black"
                              : "hover:bg-black/10 text-black/60"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreatingSpace(false)}
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
                    type="button"
                    onClick={() => {
                      if (newSpaceName.trim()) {
                        handleCreateSpace(newSpaceName.trim(), selectedIcon);
                        setIsCreatingSpace(false);
                      }
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg",
                      isDark
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-black/10 text-black hover:bg-black/20"
                    )}
                  >
                    Create Space
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Space Delete Menu */}
      <AnimatePresence>
        {showSpaceMenu && longPressSpace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowSpaceMenu(false);
                setLongPressSpace(null);
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={cn(
                "relative w-full max-w-sm rounded-xl p-6 shadow-2xl",
                isDark
                  ? "bg-black/80 border border-white/10"
                  : "bg-white/90 border border-black/5"
              )}
            >
              <h2 className={cn(
                "text-xl font-semibold mb-4",
                isDark ? "text-white/90" : "text-black/90"
              )}>
                Space Options
              </h2>
              <div className="space-y-4">
                <button
                  onClick={handleDeleteSpaceFromMobile}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-lg text-left",
                    isDark
                      ? "bg-red-900/30 text-red-300 hover:bg-red-900/40"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  )}
                >
                  <Trash2 className="w-5 h-5" />
                  <div>
                    <div className="font-medium">Delete Space</div>
                    <div className="text-sm opacity-80 mt-0.5">
                      This will delete "{longPressSpace.name}" and all its content
                    </div>
                  </div>
                </button>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowSpaceMenu(false);
                      setLongPressSpace(null);
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
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
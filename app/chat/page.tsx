'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Send, Bot, User, X, ChevronLeft, ExternalLink, History, PlusCircle, MessagesSquare, Copy, RefreshCw, Trash2, Globe, Search } from 'lucide-react'
import { ModelSelector, type Model } from '@/components/ui/model-selector'
import { ChatGenerationAnimation } from '@/components/ui/chat-generation-animation'
import { useRouter, useSearchParams } from 'next/navigation'
import { generateOpenRouterContent } from '@/utils/openrouter'
import { generateNoteContent } from '@/utils/gemini'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createClient } from '@/utils/supabase/client'
import { Navbar } from "@/app/components/ui/navbar"
import { ExaSearchResults } from "@/components/ui/exa-search-results"

interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string
  sources?: Array<{
    type: 'note' | 'website' | 'document' | 'web-search'
    id: string
    title: string
    url?: string
    content: string
    space_id: string | null
    created_at?: string
  }>
  exaSearchResults?: Array<{
    title: string
    link: string
    snippet: string
    publishedDate?: string
    source?: string
    fullContent?: string
  }>
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface Note {
  id: string
  title: string
  content: string
  created_at: string
  space_id: string | null
}

interface Website {
  id: string
  title: string
  url: string
  content: string
  created_at: string
  space_id: string | null
}

interface Document {
  id: string
  title: string
  content: string
  document_url: string
  created_at: string
  space_id: string | null
}

export default function ChatPage() {
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showConversations, setShowConversations] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [exaSearchEnabled, setExaSearchEnabled] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isExaApiConfigured, setIsExaApiConfigured] = useState(true) // Default to true, will check in useEffect
  const [userContent, setUserContent] = useState<{
    notes: Note[]
    websites: Website[]
    documents: Document[]
  }>({
    notes: [],
    websites: [],
    documents: []
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSpaceId = searchParams ? searchParams.get('spaceId') : null
  const { resolvedTheme } = useTheme()
  const isDark = mounted ? resolvedTheme === 'dark' : false
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
    // Default to Gemini 2.5 Flash if no stored model or error
    return {
      provider: 'gemini',
      name: 'gemini-2.5-flash-preview-05-20',
      displayName: 'Gemini 2.5 Flash'
    }
  })
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Save selected model to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedModel', JSON.stringify(selectedModel))
  }, [selectedModel])

  // Check if Exa API key is configured
  useEffect(() => {
    const checkExaApiKey = async () => {
      try {
        const response = await fetch('/api/exa-check', {
          method: 'GET',
        })
        const data = await response.json()
        setIsExaApiConfigured(data.configured)
      } catch (error) {
        console.error('Error checking Exa API key:', error)
        setIsExaApiConfigured(false)
      }
    }

    checkExaApiKey()
  }, [])

  // Disable Exa search when switching to Gemini models
  useEffect(() => {
    if (selectedModel.provider === 'gemini' && exaSearchEnabled) {
      setExaSearchEnabled(false)
    }
  }, [selectedModel, exaSearchEnabled])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch user's conversations from Supabase
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (error) throw error
        setConversations(data || [])
      } catch (error) {
        console.error('Error fetching conversations:', error)
      }
    }

    if (mounted) {
      fetchConversations()
    }
  }, [mounted, supabase])

  // Load conversation messages when conversation ID changes
  useEffect(() => {
    const loadConversation = async () => {
      if (!currentConversationId) return

      try {
        console.log('Loading conversation:', currentConversationId)

        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', currentConversationId)
          .order('created_at', { ascending: true })

        if (error) throw error

        console.log('Loaded messages:', data)

        if (data && data.length > 0) {
          // Map the database messages to the UI message format
          const uiMessages = data.map(msg => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            sources: msg.sources || undefined
          }))
          setMessages(uiMessages)
        } else {
          setMessages([])
        }
      } catch (error) {
        console.error('Error loading conversation:', error)
      }
    }

    loadConversation()
  }, [currentConversationId, supabase])

  // Fetch user's content from Supabase
  useEffect(() => {
    const fetchUserContent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const [notesResponse, websitesResponse, documentsResponse] = await Promise.all([
          supabase.from('notes').select('*').eq('user_id', user.id),
          supabase.from('websites').select('*').eq('user_id', user.id),
          supabase.from('documents').select('*').eq('user_id', user.id)
        ])

        setUserContent({
          notes: notesResponse.data || [],
          websites: websitesResponse.data || [],
          documents: documentsResponse.data || []
        })
      } catch (error) {
        console.error('Error fetching user content:', error)
      }
    }

    fetchUserContent()
  }, [])

  const createNewConversation = async (firstMessage: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Create a title based on the first user message
      const title = firstMessage.length > 30
        ? firstMessage.substring(0, 30) + '...'
        : firstMessage

      const now = new Date().toISOString()

      // Insert conversation
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title,
          updated_at: now
        })
        .select()
        .single()

      if (error) throw error

      setCurrentConversationId(data.id)
      setConversations(prev => [data, ...prev])

      return data.id
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }

  const saveMessage = async (message: Message, conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          sources: message.sources || null
        })
        .select()
        .single()

      if (error) throw error

      // Update message with ID from database
      return { ...message, id: data.id }
    } catch (error) {
      console.error('Error saving message:', error)
      return message
    }
  }

  const updateConversationTimestamp = async (conversationId: string) => {
    try {
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    } catch (error) {
      console.error('Error updating conversation timestamp:', error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!messageId || !currentConversationId) return

    try {
      // Delete from database
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      // Remove from UI
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      // Delete all messages first
      await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId)

      // Then delete the conversation
      await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)

      // Update state
      setConversations(prev => prev.filter(convo => convo.id !== conversationId))

      // If the deleted conversation was the current one, clear the messages
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  // Function to extract date from user query
  const extractDateFromQuery = (query: string): Date | null => {
    // Common date formats
    const datePatterns = [
      // YYYY-MM-DD
      /\b(\d{4})[-\/](0?[1-9]|1[0-2])[-\/](0?[1-9]|[12]\d|3[01])\b/,
      // MM-DD-YYYY or DD-MM-YYYY
      /\b(0?[1-9]|1[0-2])[-\/](0?[1-9]|[12]\d|3[01])[-\/](\d{4})\b/,
      /\b(0?[1-9]|[12]\d|3[01])[-\/](0?[1-9]|1[0-2])[-\/](\d{4})\b/,
      // Month name formats
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?(?:[,\s]+)?(\d{4})?\b/i,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?(?:[,\s]+)?(\d{4})?\b/i,
      // Day Month format
      /\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)(?:[,\s]+)?(\d{4})?\b/i,
      /\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:[,\s]+)?(\d{4})?\b/i,
      // Relative dates
      /\b(yesterday|today|tomorrow)\b/i,
      /\b(last|this|next)\s+(day|week|month|year)\b/i
    ]

    // Try to match each pattern
    for (const pattern of datePatterns) {
      const match = query.match(pattern)
      if (match) {
        try {
          // Handle different formats
          if (match[0].toLowerCase().includes('yesterday')) {
            const date = new Date()
            date.setDate(date.getDate() - 1)
            return date
          } else if (match[0].toLowerCase().includes('today')) {
            return new Date()
          } else if (match[0].toLowerCase().includes('tomorrow')) {
            const date = new Date()
            date.setDate(date.getDate() + 1)
            return date
          } else if (match[0].toLowerCase().includes('last') ||
                     match[0].toLowerCase().includes('this') ||
                     match[0].toLowerCase().includes('next')) {
            // Handle relative time expressions
            const date = new Date()
            const modifier = match[1].toLowerCase()
            const unit = match[2].toLowerCase()

            if (modifier === 'last') {
              if (unit === 'day') date.setDate(date.getDate() - 1)
              else if (unit === 'week') date.setDate(date.getDate() - 7)
              else if (unit === 'month') date.setMonth(date.getMonth() - 1)
              else if (unit === 'year') date.setFullYear(date.getFullYear() - 1)
            } else if (modifier === 'next') {
              if (unit === 'day') date.setDate(date.getDate() + 1)
              else if (unit === 'week') date.setDate(date.getDate() + 7)
              else if (unit === 'month') date.setMonth(date.getMonth() + 1)
              else if (unit === 'year') date.setFullYear(date.getFullYear() + 1)
            }

            return date
          } else {
            // Try to parse the date string
            const dateStr = match[0].replace(/(?:st|nd|rd|th)/, '')
            const parsedDate = new Date(dateStr)

            // Check if the date is valid
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate
            }
          }
        } catch (e) {
          console.error('Error parsing date:', e)
        }
      }
    }

    return null
  }

  // Function to check if two dates are on the same day
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  // Function to format date for display
  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const findRelevantContent = (query: string) => {
    const relevantContent: Message['sources'] = []
    const queryLower = query.toLowerCase()

    // Check if query contains date-related keywords
    const dateKeywords = ['date', 'day', 'yesterday', 'today', 'tomorrow', 'last', 'this', 'next', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const containsDateKeyword = dateKeywords.some(keyword => queryLower.includes(keyword))

    // Extract date from query if present
    const extractedDate = extractDateFromQuery(query)

    // If date is found in the query, search for content from that date
    if (extractedDate) {
      console.log('Found date in query:', formatDateForDisplay(extractedDate))

      // Check notes by date
      userContent.notes.forEach(note => {
        const noteDate = new Date(note.created_at)
        if (isSameDay(noteDate, extractedDate)) {
          relevantContent.push({
            type: 'note',
            id: note.id,
            title: note.title,
            content: note.content,
            space_id: note.space_id,
            created_at: note.created_at
          })
        }
      })

      // Check websites by date
      userContent.websites.forEach(website => {
        const websiteDate = new Date(website.created_at)
        if (isSameDay(websiteDate, extractedDate)) {
          relevantContent.push({
            type: 'website',
            id: website.id,
            title: website.title,
            url: website.url,
            content: website.content,
            space_id: website.space_id,
            created_at: website.created_at
          })
        }
      })

      // Check documents by date
      userContent.documents.forEach(document => {
        const documentDate = new Date(document.created_at)
        if (isSameDay(documentDate, extractedDate)) {
          relevantContent.push({
            type: 'document',
            id: document.id,
            title: document.title,
            url: document.document_url,
            content: document.content,
            space_id: document.space_id,
            created_at: document.created_at
          })
        }
      })

      // If we found date-specific content, return it
      if (relevantContent.length > 0) {
        return relevantContent
      }
    }

    // If no date was found or no content matched the date, fall back to keyword search
    // Simple relevance scoring based on content matching
    const isRelevant = (text: string) => text.toLowerCase().includes(queryLower)

    // Check notes
    userContent.notes.forEach(note => {
      if (isRelevant(note.title) || isRelevant(note.content)) {
        relevantContent.push({
          type: 'note',
          id: note.id,
          title: note.title,
          content: note.content,
          space_id: note.space_id,
          created_at: note.created_at
        })
      }
    })

    // Check websites
    userContent.websites.forEach(website => {
      if (isRelevant(website.title) || isRelevant(website.content)) {
        relevantContent.push({
          type: 'website',
          id: website.id,
          title: website.title,
          url: website.url,
          content: website.content,
          space_id: website.space_id,
          created_at: website.created_at
        })
      }
    })

    // Check documents
    userContent.documents.forEach(document => {
      if (isRelevant(document.title) || isRelevant(document.content)) {
        relevantContent.push({
          type: 'document',
          id: document.id,
          title: document.title,
          url: document.document_url,
          content: document.content,
          space_id: document.space_id,
          created_at: document.created_at
        })
      }
    })

    return relevantContent
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating) return

    const userMessage = input.trim()
    setInput('')

    // Immediately focus on the input field after submitting
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)

    // Find relevant content before generating response
    const relevantSources = findRelevantContent(userMessage)

    // Check if the query contains a date
    const extractedDate = extractDateFromQuery(userMessage)

    // Create a new conversation if needed
    let conversationId = currentConversationId
    if (!conversationId) {
      conversationId = await createNewConversation(userMessage)
      if (!conversationId) {
        console.error('Failed to create conversation')
        return
      }
    } else {
      // Update timestamp on existing conversation
      updateConversationTimestamp(conversationId)
    }

    // Add user message to state first for immediate feedback
    const userMsg: Message = { role: 'user', content: userMessage }
    setMessages(prev => [...prev, userMsg])

    // Ensure the message is visible by scrolling to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)

    // Save user message to database
    const savedUserMsg = await saveMessage(userMsg, conversationId)

    // If a date was found and we have relevant sources, create a special response
    if (extractedDate && relevantSources.length > 0) {
      const formattedDate = formatDateForDisplay(extractedDate)
      const noteCount = relevantSources.filter(source => source.type === 'note').length
      const websiteCount = relevantSources.filter(source => source.type === 'website').length
      const documentCount = relevantSources.filter(source => source.type === 'document').length

      let contentSummary = `I found ${relevantSources.length} item${relevantSources.length !== 1 ? 's' : ''} from ${formattedDate}:\n\n`

      if (noteCount > 0) {
        contentSummary += `- ${noteCount} note${noteCount !== 1 ? 's' : ''}\n`
      }
      if (websiteCount > 0) {
        contentSummary += `- ${websiteCount} website${websiteCount !== 1 ? 's' : ''}\n`
      }
      if (documentCount > 0) {
        contentSummary += `- ${documentCount} document${documentCount !== 1 ? 's' : ''}\n`
      }

      contentSummary += '\nHere are the items from that date:\n\n'

      // Add titles and content of all items
      relevantSources.forEach((source, index) => {
        contentSummary += `**${index + 1}. ${source.title}** (${source.type})\n`

        // Add content preview for notes
        if (source.type === 'note' && source.content) {
          // Truncate content if it's too long
          const contentPreview = source.content.length > 200
            ? source.content.substring(0, 200) + '...'
            : source.content;
          contentSummary += `${contentPreview}\n\n`;
        } else if (source.type === 'website' || source.type === 'document') {
          // For websites and documents, just add a separator
          contentSummary += '\n';
        }
      })

      const assistantMsg: Message = {
        role: 'assistant',
        content: contentSummary,
        sources: relevantSources
      }

      setMessages(prev => [...prev, assistantMsg])
      await saveMessage(assistantMsg, conversationId)
      return
    }

    // Check if the user is asking for their notes, memories, or content
    const lowerCaseMessage = userMessage.toLowerCase()
    const memoryKeywords = ['my notes', 'my memories', 'my content', 'show me my notes', 'show me my memories',
                           'show all my notes', 'show all my memories', 'show my content', 'what are my memories',
                           'what did i save', 'show me what i saved', 'my saved content', 'my documents',
                           'my websites', 'show everything', 'all my content']

    const isMemoryRequest = memoryKeywords.some(keyword => lowerCaseMessage.includes(keyword))

    if (isMemoryRequest) {
      // Create a special response with all user content
      let contentSummary = `Here's a summary of your saved content:\n\n`

      // Add summary counts
      contentSummary += `**Notes:** ${userContent.notes.length}\n`
      contentSummary += `**Websites:** ${userContent.websites.length}\n`
      contentSummary += `**Documents:** ${userContent.documents.length}\n\n`

      // Check if there's any content at all
      if (userContent.notes.length === 0 && userContent.websites.length === 0 && userContent.documents.length === 0) {
        const assistantMsg: Message = {
          role: 'assistant',
          content: "You don't have any saved content yet. You can create notes, save websites, and upload documents in the dashboard."
        }
        setMessages(prev => [...prev, assistantMsg])
        await saveMessage(assistantMsg, conversationId)
        return
      }

      // Add notes section
      if (userContent.notes.length > 0) {
        contentSummary += `## Notes\n\n`
        userContent.notes.forEach((note, index) => {
          contentSummary += `**${index + 1}. ${note.title}**\n`
          contentSummary += `${note.content.substring(0, 150)}${note.content.length > 150 ? '...' : ''}\n`
          contentSummary += `_Created: ${new Date(note.created_at).toLocaleDateString()}_\n\n`
        })
      }

      // Add websites section
      if (userContent.websites.length > 0) {
        contentSummary += `## Websites\n\n`
        userContent.websites.forEach((website, index) => {
          contentSummary += `**${index + 1}. ${website.title}**\n`
          contentSummary += `URL: ${website.url}\n`
          if (website.content) {
            contentSummary += `${website.content.substring(0, 100)}${website.content.length > 100 ? '...' : ''}\n`
          }
          contentSummary += `_Saved: ${new Date(website.created_at).toLocaleDateString()}_\n\n`
        })
      }

      // Add documents section
      if (userContent.documents.length > 0) {
        contentSummary += `## Documents\n\n`
        userContent.documents.forEach((document, index) => {
          contentSummary += `**${index + 1}. ${document.title}**\n`
          if (document.content) {
            contentSummary += `${document.content.substring(0, 100)}${document.content.length > 100 ? '...' : ''}\n`
          }
          contentSummary += `_Added: ${new Date(document.created_at).toLocaleDateString()}_\n\n`
        })
      }

      // Combine all sources
      const allSources: Message['sources'] = [
        ...userContent.notes.map(note => ({
          type: 'note' as const,
          id: note.id,
          title: note.title,
          content: note.content,
          space_id: note.space_id,
          created_at: note.created_at
        })),
        ...userContent.websites.map(website => ({
          type: 'website' as const,
          id: website.id,
          title: website.title,
          url: website.url,
          content: website.content,
          space_id: website.space_id,
          created_at: website.created_at
        })),
        ...userContent.documents.map(document => ({
          type: 'document' as const,
          id: document.id,
          title: document.title,
          url: document.document_url,
          content: document.content,
          space_id: document.space_id,
          created_at: document.created_at
        }))
      ]

      const assistantMsg: Message = {
        role: 'assistant',
        content: contentSummary,
        sources: allSources
      }

      setMessages(prev => [...prev, assistantMsg])
      await saveMessage(assistantMsg, conversationId)
      return
    }

    setIsGenerating(true)
    if (exaSearchEnabled) {
      setIsSearching(true)
    }

    try {
      // Get previous messages for context (limit to last 10 messages for context window)
      const previousMessages = messages.slice(-10);

      // Format conversation history
      const conversationHistory = previousMessages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

      // Include both conversation history and relevant content in the prompt
      let contextPrompt;

      if (relevantSources.length > 0) {
        // If we have relevant sources, include them
        contextPrompt = `Conversation history:\n${conversationHistory}\n\nBased on the following information:\n\n${relevantSources.map(source =>
          `[${source.type.toUpperCase()}] ${source.title}\n${source.content}\n`
        ).join('\n')}\n\nUser's latest question: ${userMessage}`;
      } else if (previousMessages.length > 1) {
        // If we have conversation history but no relevant sources
        contextPrompt = `Conversation history:\n${conversationHistory}\n\nUser's latest question: ${userMessage}`;
      } else {
        // If this is the first message with no relevant sources
        contextPrompt = userMessage;
      }

      // Perform Exa search if enabled, API key is configured, and using OpenRouter model
      let exaSearchResults = [];
      if (exaSearchEnabled && isExaApiConfigured && selectedModel.provider === 'openrouter') {
        try {
          console.log('Performing Exa search for:', userMessage);
          const searchResponse = await fetch('/api/exa-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: userMessage, numResults: 5 })
          });

          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            exaSearchResults = searchData.results || [];
            console.log('Exa search results:', exaSearchResults);

            // Fetch content for the first result if available
            if (exaSearchResults.length > 0) {
              try {
                const contentResponse = await fetch('/api/fetch-content', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: exaSearchResults[0].link })
                });

                if (contentResponse.ok) {
                  const contentData = await contentResponse.json();
                  if (contentData.content) {
                    // Add the fetched content to the first result
                    exaSearchResults[0].fullContent = contentData.content;
                  }
                }
              } catch (error) {
                console.error('Error fetching content:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error performing Exa search:', error);
        }
      }

      if (selectedModel.provider === 'gemini') {
        const response = await generateNoteContent(contextPrompt)
        const assistantMsg: Message = {
          role: 'assistant',
          content: response,
          sources: relevantSources.length > 0 ? relevantSources : undefined
        }

        // Add to state and save to database
        setMessages(prev => [...prev, assistantMsg])
        await saveMessage(assistantMsg, conversationId)
      } else {
        // For OpenRouter models, pass the exaSearchEnabled flag and search results
        const response = await generateOpenRouterContent(
          selectedModel.name,
          contextPrompt,
          exaSearchEnabled,
          exaSearchResults
        )

        setIsSearching(false)

        if (typeof response === 'string') {
          const assistantMsg: Message = {
            role: 'assistant',
            content: response,
            sources: relevantSources.length > 0 ? relevantSources : undefined,
            exaSearchResults: exaSearchEnabled && exaSearchResults?.length > 0 ? exaSearchResults : undefined
          }

          setMessages(prev => [...prev, assistantMsg])
          await saveMessage(assistantMsg, conversationId)
        } else {
          const reader = response.body?.getReader()
          if (!reader) throw new Error('Response body is not readable')

          const decoder = new TextDecoder()
          let buffer = ''
          let accumulatedContent = ''

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })

              while (true) {
                const lineEnd = buffer.indexOf('\n')
                if (lineEnd === -1) break

                const line = buffer.slice(0, lineEnd).trim()
                buffer = buffer.slice(lineEnd + 1)

                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  if (data === '[DONE]') break

                  try {
                    const parsed = JSON.parse(data)
                    const content = parsed.choices[0].delta.content
                    if (content) {
                      accumulatedContent += content
                      setMessages(prev => {
                        const newMessages = [...prev]
                        if (newMessages[newMessages.length - 1]?.role === 'assistant') {
                          newMessages[newMessages.length - 1].content = accumulatedContent
                          newMessages[newMessages.length - 1].sources = relevantSources.length > 0 ? relevantSources : undefined
                          newMessages[newMessages.length - 1].exaSearchResults = exaSearchEnabled && exaSearchResults?.length > 0 ? exaSearchResults : undefined
                        } else {
                          newMessages.push({
                            role: 'assistant',
                            content: accumulatedContent,
                            sources: relevantSources.length > 0 ? relevantSources : undefined,
                            exaSearchResults: exaSearchEnabled && exaSearchResults?.length > 0 ? exaSearchResults : undefined
                          })
                        }
                        return newMessages
                      })
                    }
                  } catch (e) {
                    // Ignore invalid JSON
                  }
                }
              }
            }

            // After streaming is complete, save the final message to the database
            const finalAssistantMsg: Message = {
              role: 'assistant',
              content: accumulatedContent,
              sources: relevantSources.length > 0 ? relevantSources : undefined
            }
            await saveMessage(finalAssistantMsg, conversationId)
          } catch (error) {
            console.error('Error reading stream:', error)
          } finally {
            reader.releaseLock()
          }
        }
      }
    } catch (error) {
      console.error('Error generating response:', error)
      const errorMsg: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error generating a response. Please try again.'
      }

      setMessages(prev => [...prev, errorMsg])
      if (conversationId) {
        await saveMessage(errorMsg, conversationId)
      }
    } finally {
      setIsGenerating(false)
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar for consistent navigation */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar
          isDark={isDark}
          onStartChat={() => {
            // Navigate back to dashboard with the current space context
            if (currentSpaceId) {
              router.push(`/dashboard?spaceId=${currentSpaceId}`)
            } else {
              router.push('/dashboard')
            }
          }}
          onSignOut={async () => {
            await supabase.auth.signOut()
            router.push('/signin')
          }}
        />
      </div>

      {/* Header */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md",
        isDark
          ? "bg-zinc-900/75 border-zinc-800/50"
          : "bg-white/75 border-zinc-200/50"
      )}>
        <div className="mx-auto max-w-4xl flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push(currentSpaceId ? `/dashboard?spaceId=${currentSpaceId}` : '/dashboard')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isDark
                  ? "hover:bg-zinc-800 text-zinc-400"
                  : "hover:bg-zinc-100 text-zinc-600"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className={cn(
              "text-base sm:text-lg font-medium truncate",
              isDark ? "text-white" : "text-black"
            )}>AI Chat</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setShowConversations(!showConversations)}
                className={cn(
                  "flex items-center justify-center p-1.5 sm:p-2 rounded-md transition-all duration-300",
                  "border relative overflow-hidden group",
                  isDark
                    ? "bg-transparent border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-400"
                    : "bg-transparent border-zinc-400 text-zinc-600 hover:text-black hover:border-zinc-600"
                )}
                aria-label="Chat history"
              >
                <div className={cn(
                  "absolute inset-0 w-0 h-full transition-all duration-300 ease-out group-hover:w-full -z-10",
                  isDark
                    ? "bg-zinc-800/30"
                    : "bg-zinc-100/80",
                  "origin-left"
                )} />
                <MessagesSquare className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 relative z-10",
                  "group-hover:scale-110"
                )} />
              </button>
              <button
                onClick={() => {
                  setMessages([])
                  setCurrentConversationId(null)
                }}
                className={cn(
                  "flex items-center justify-center p-1.5 sm:p-2 rounded-md transition-all duration-300",
                  "border relative overflow-hidden group",
                  isDark
                    ? "bg-transparent border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-400"
                    : "bg-transparent border-zinc-400 text-zinc-600 hover:text-black hover:border-zinc-600"
                )}
                aria-label="New chat"
              >
                <div className={cn(
                  "absolute inset-0 w-0 h-full transition-all duration-300 ease-out group-hover:w-full -z-10",
                  isDark
                    ? "bg-zinc-800/30"
                    : "bg-zinc-100/80",
                  "origin-left"
                )} />
                <PlusCircle className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 relative z-10",
                  "group-hover:scale-110"
                )} />
              </button>
            </div>
            <div className="ml-auto">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conversation History Sidebar */}
      <AnimatePresence>
        {showConversations && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "fixed left-0 top-14 bottom-0 w-full sm:w-72 z-40 border-r overflow-y-auto",
              isDark
                ? "bg-zinc-900/90 backdrop-blur-md border-zinc-800/50"
                : "bg-white/90 backdrop-blur-md border-zinc-200/50"
            )}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn(
                  "font-medium",
                  isDark ? "text-white" : "text-black"
                )}>Conversations</h2>
                <button
                  onClick={() => setShowConversations(false)}
                  className={cn(
                    "sm:hidden p-1 rounded-md",
                    isDark ? "text-white/70 hover:bg-white/10" : "text-black/70 hover:bg-black/10"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className={cn(
                  "text-sm p-3 rounded-lg",
                  isDark ? "bg-white/5 text-white/70" : "bg-black/5 text-black/70"
                )}>
                  No conversations yet. Start chatting!
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer",
                        currentConversationId === conversation.id
                          ? isDark ? "bg-white/10" : "bg-black/10"
                          : isDark ? "hover:bg-white/5" : "hover:bg-black/5",
                        isDark ? "text-white/90" : "text-black/90"
                      )}
                    >
                      <div
                        className="flex-1 truncate pr-2"
                        onClick={() => {
                          setCurrentConversationId(conversation.id)
                          setShowConversations(false)
                        }}
                      >
                        <div className="font-medium text-sm truncate">{conversation.title}</div>
                        <div className="text-xs opacity-60">
                          {new Date(conversation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteConversation(conversation.id)}
                        className={cn(
                          "p-1.5 rounded-md sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
                          isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"
                        )}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pt-20 pb-28 sm:pb-32 bg-gradient-to-b from-transparent">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <div className="space-y-5 sm:space-y-7">
            <AnimatePresence initial={false} mode="sync">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: message.role === 'user' ? 0.1 : 0.3,
                    delay: message.role === 'user' ? 0 : 0.1
                  }}
                  className={cn(
                    "flex gap-2 sm:gap-4 text-sm leading-relaxed",
                    message.role === 'assistant' && "items-start",
                    message.role === 'user' && "items-start justify-end"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 shadow-lg",
                      isDark
                        ? "bg-gradient-to-br from-purple-600/50 to-blue-600/50 border border-purple-500/60 shadow-purple-500/20"
                        : "bg-gradient-to-br from-purple-500/40 to-blue-500/40 border border-purple-500/50 shadow-purple-500/10"
                    )}>
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-md" />
                    </div>
                  )}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: message.role === 'user' ? 0.1 : 0.3,
                      type: "spring",
                      stiffness: message.role === 'user' ? 200 : 100,
                      delay: message.role === 'user' ? 0 : 0.1
                    }}
                    className={cn(
                      "relative flex-1 max-w-[calc(100%-70px)] sm:max-w-2xl rounded-2xl px-4 py-3 sm:px-5 sm:py-4 break-words group shadow-lg",
                      message.role === 'assistant' ? (
                        isDark
                          ? "bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 text-white/95 border border-white/15 shadow-zinc-900/30"
                          : "bg-gradient-to-br from-zinc-50/95 to-zinc-100/95 text-black/95 border border-black/15 shadow-zinc-300/20"
                      ) : (
                        isDark
                          ? "bg-gradient-to-br from-purple-600/40 to-blue-600/40 text-white border border-white/20 shadow-purple-900/30"
                          : "bg-gradient-to-br from-purple-500/30 to-blue-500/30 text-black border border-black/20 shadow-purple-500/20"
                      )
                    )}
                  >
                    {/* Removed the top-right delete button */}

                    {/* Function buttons that appear on hover - positioned at extreme left and right */}
                    <div
                      className={cn(
                        "absolute -bottom-8 left-0 right-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300",
                        "px-0 py-1 z-20 translate-y-2 group-hover:translate-y-0 w-full pointer-events-none group-hover:pointer-events-auto"
                      )}
                    >
                      {/* Left side buttons - positioned at extreme left */}
                      <div className={cn(
                        "flex items-center gap-2 sm:gap-3 px-2 py-1.5 rounded-lg shadow-lg backdrop-blur-sm pointer-events-auto",
                        isDark
                          ? "bg-zinc-800/95 border border-white/15 shadow-zinc-900/30"
                          : "bg-white/95 border border-black/15 shadow-zinc-300/20"
                      )}>
                        {/* Copy button */}
                        <button
                          onClick={() => {
                            try {
                              // Create a temporary textarea element to handle the copy operation
                              const textarea = document.createElement('textarea');
                              textarea.value = message.content;
                              textarea.style.position = 'fixed'; // Make it invisible
                              textarea.style.opacity = '0';
                              document.body.appendChild(textarea);
                              textarea.select();

                              // Execute the copy command
                              const successful = document.execCommand('copy');

                              // Clean up
                              document.body.removeChild(textarea);

                              // If execCommand was successful or if clipboard API is available, try that too
                              if (successful || navigator.clipboard) {
                                // Also try the modern clipboard API as a backup
                                navigator.clipboard.writeText(message.content).catch(e => {
                                  console.log('Clipboard API failed, but execCommand worked:', e);
                                });

                                // Update UI to show copied state
                                if (message.id) {
                                  setCopiedMessageId(message.id);
                                  setTimeout(() => setCopiedMessageId(null), 2000);
                                }
                              } else {
                                console.error('Copy failed');
                              }
                            } catch (err) {
                              console.error('Failed to copy text: ', err);
                            }
                          }}
                          className={cn(
                            "p-1.5 rounded-md transition-colors flex items-center gap-1.5",
                            message.id && copiedMessageId === message.id
                              ? (isDark ? "bg-green-500/20 text-green-400" : "bg-green-500/20 text-green-600")
                              : (isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70")
                          )}
                          title="Copy message"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {message.id && copiedMessageId === message.id && (
                            <span className="text-xs font-medium">Copied!</span>
                          )}
                        </button>

                        {/* Regenerate button - only for assistant messages */}
                        {message.role === 'assistant' && message.id && (
                          <button
                            onClick={async () => {
                              if (!currentConversationId || !message.id) return;

                              // Find the user message that preceded this assistant message
                              const messageIndex = messages.findIndex(msg => msg.id === message.id);
                              if (messageIndex <= 0) return; // No preceding message found

                              const userMessage = messages[messageIndex - 1];
                              if (userMessage.role !== 'user') return;

                              // Delete the current assistant message
                              await deleteMessage(message.id);

                              // Set input to the user's message and submit
                              setInput(userMessage.content);
                              setTimeout(() => {
                                const event = new Event('submit') as any;
                                document.querySelector('form')?.dispatchEvent(event);
                              }, 100);
                            }}
                            className={cn(
                              "p-1.5 rounded-md transition-colors flex items-center gap-1.5",
                              isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"
                            )}
                            title="Regenerate response"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        </div>

                      {/* Right side buttons - positioned at extreme right */}
                      {message.id && (
                        <div className={cn(
                          "flex items-center gap-2 sm:gap-3 px-2 py-1.5 rounded-lg shadow-lg backdrop-blur-sm pointer-events-auto",
                          isDark
                            ? "bg-zinc-800/95 border border-white/15 shadow-zinc-900/30"
                            : "bg-white/95 border border-black/15 shadow-zinc-300/20"
                        )}>
                          {/* Delete button */}
                          <button
                            onClick={() => deleteMessage(message.id!)}
                            className={cn(
                              "p-1.5 rounded-md transition-colors flex items-center gap-1.5",
                              isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"
                            )}
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={cn(
                      "prose prose-sm sm:prose-base max-w-none",
                      isDark ? "prose-invert" : "prose-neutral"
                    )}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "underline transition-colors break-words",
                                isDark
                                  ? "text-blue-400 hover:text-blue-300"
                                  : "text-blue-600 hover:text-blue-800"
                              )}
                            />
                          ),
                          code: ({ className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '')
                            const isInline = !className || !match

                            if (isInline) {
                              return (
                                <code
                                  className={cn(
                                    "rounded px-1 py-0.5 font-mono text-sm",
                                    isDark
                                      ? "bg-white/10 text-white/90"
                                      : "bg-black/10 text-black/90"
                                  )}
                                  {...props}
                                >
                                  {children}
                                </code>
                              )
                            }

                            return (
                              <code
                                className={cn(
                                  className,
                                  "block rounded-md p-3 text-sm font-mono overflow-x-auto",
                                  isDark
                                    ? "bg-white/10 text-white/90"
                                    : "bg-black/10 text-black/90"
                                )}
                                {...props}
                              >
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Sources and Exa Search Results */}
                    {(message.sources && message.sources.length > 0 || message.exaSearchResults && message.exaSearchResults.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className={cn(
                          "mt-3 pt-3 sm:mt-4 sm:pt-4 border-t",
                          isDark ? "border-white/10" : "border-black/10"
                        )}
                      >
                        {/* Sources header */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="space-y-2">
                            <div className={cn(
                              "text-xs font-medium mb-2 flex items-center gap-1.5",
                              isDark ? "text-white/60" : "text-black/60"
                            )}>
                              <div className={cn(
                                "w-4 h-4 rounded-full flex items-center justify-center",
                                isDark ? "bg-blue-500/20" : "bg-blue-500/10"
                              )}>
                                <span className="text-[10px]">{message.sources.length}</span>
                              </div>
                              <span>
                                {message.content.includes('found') && message.content.includes('from') && message.content.includes('item')
                                  ? 'Sources from this date:'
                                  : 'Sources used to generate this response:'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-2.5">
                              {message.sources.map((source, idx) => (
                            <motion.button
                              key={source.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + (idx * 0.1), duration: 0.2 }}
                              onClick={() => {
                                if (source.type === 'website' && source.url) {
                                  window.open(source.url, '_blank');
                                } else {
                                  // Always include source space ID for proper navigation
                                  const spaceId = source.space_id;

                                  // Build the URL for navigation
                                  const url = `/dashboard?type=${source.type}&id=${source.id}${spaceId ? `&spaceId=${spaceId}` : ''}`;
                                  router.push(url);
                                }
                              }}
                              className={cn(
                                "flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md text-xs transition-all",
                                "border shadow-sm hover:shadow-md hover:-translate-y-0.5",
                                source.type === 'note' ? (
                                  isDark
                                    ? "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-300"
                                    : "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 text-purple-700"
                                ) : source.type === 'website' ? (
                                  isDark
                                    ? "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300"
                                    : "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 text-blue-700"
                                ) : (
                                  isDark
                                    ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300"
                                    : "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-amber-700"
                                )
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                                source.type === 'note' ? (
                                  isDark ? "bg-purple-500/20" : "bg-purple-500/10"
                                ) : source.type === 'website' ? (
                                  isDark ? "bg-blue-500/20" : "bg-blue-500/10"
                                ) : (
                                  isDark ? "bg-amber-500/20" : "bg-amber-500/10"
                                )
                              )}>
                                {source.type === 'note' && '📝'}
                                {source.type === 'website' && '🌐'}
                                {source.type === 'document' && '📄'}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium truncate max-w-[150px]">{source.title}</span>
                                {message.content.includes('found') && message.content.includes('from') && message.content.includes('item') && (
                                  <span className="text-[10px] opacity-70 truncate max-w-[150px]">
                                    {new Date(source.created_at || '').toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {source.url && (
                                <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70" />
                              )}
                            </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Exa Search Results */}
                        {message.exaSearchResults && message.exaSearchResults.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <div className="flex items-center gap-1.5 text-xs font-medium">
                              <Search className="w-3.5 h-3.5" />
                              <span>Exa Search Results</span>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-2.5">
                              {message.exaSearchResults.map((result, idx) => (
                                <motion.button
                                  key={`search-${idx}`}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.3 + (idx * 0.1), duration: 0.2 }}
                                  onClick={() => window.open(result.link, '_blank')}
                                  className={cn(
                                    "flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md text-xs transition-all",
                                    "border shadow-sm hover:shadow-md hover:-translate-y-0.5",
                                    isDark
                                      ? "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300"
                                      : "bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 text-blue-700"
                                  )}
                                >
                                  <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                                    isDark ? "bg-blue-500/20" : "bg-blue-500/10"
                                  )}>
                                    <Globe className="w-3 h-3" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium truncate max-w-[150px]">{result.title}</span>
                                    {result.source && (
                                      <span className="text-[10px] opacity-70 truncate max-w-[150px]">{result.source}</span>
                                    )}
                                  </div>
                                  <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70" />
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                  {message.role === 'user' && (
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 shadow-lg",
                      isDark
                        ? "bg-gradient-to-br from-blue-600/50 to-purple-600/50 border border-blue-500/60 shadow-blue-500/20"
                        : "bg-gradient-to-br from-blue-500/40 to-purple-500/40 border border-blue-500/50 shadow-blue-500/10"
                    )}>
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-md" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
                className="flex gap-2 sm:gap-4 text-sm leading-relaxed items-start"
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 shadow-lg",
                  isDark
                    ? "bg-gradient-to-br from-purple-600/50 to-blue-600/50 border border-purple-500/60 shadow-purple-500/20"
                    : "bg-gradient-to-br from-purple-500/40 to-blue-500/40 border border-purple-500/50 shadow-purple-500/10"
                )}>
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-md" />
                </div>
                <div className={cn(
                  "relative flex-1 max-w-[calc(100%-70px)] sm:max-w-2xl rounded-2xl px-4 py-3 shadow-lg",
                  isDark
                    ? "bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 text-white/95 border border-white/15 shadow-zinc-900/30"
                    : "bg-gradient-to-br from-zinc-50/95 to-zinc-100/95 text-black/95 border border-black/15 shadow-zinc-300/20"
                )}>
                  <ChatGenerationAnimation isDark={isDark} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input - With improved circular design */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 border-t backdrop-blur-md pb-3 sm:pb-4",
        isDark
          ? "bg-gradient-to-t from-zinc-900/95 via-zinc-900/90 to-zinc-900/80 border-zinc-800/50 shadow-lg shadow-zinc-950/20"
          : "bg-gradient-to-t from-white/95 via-white/90 to-white/80 border-zinc-200/50 shadow-lg shadow-zinc-300/10"
      )}>
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto px-2 sm:px-3 pt-2 sm:pt-3"
        >
          <div className="relative">
            <div className={cn(
              "flex items-center gap-1.5 mb-1.5",
              input.length > 0 ? "opacity-100 h-6" : "opacity-100 h-6"
            )}>
              {/* Exa Search Toggle Button removed */}

              {input.length > 0 && (
                <button
                  type="button"
                  onClick={() => setInput('')}
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-md transition-colors",
                    isDark
                      ? "bg-white/5 hover:bg-white/10 text-white/70"
                      : "bg-black/5 hover:bg-black/10 text-black/70"
                  )}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Improved circular input box */}
            <div className={cn(
              "relative rounded-full border shadow-lg overflow-hidden max-w-full mx-auto transition-all duration-300",
              isDark
                ? "bg-zinc-800/90 border-white/15 hover:border-white/25 hover:bg-zinc-800/95 shadow-zinc-900/30"
                : "bg-white/90 border-black/15 hover:border-black/25 hover:bg-white/95 shadow-zinc-300/20",
              isGenerating && "opacity-50 pointer-events-none"
            )}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send a message..."
                rows={1}
                disabled={isGenerating}
                className={cn(
                  "w-full px-4 py-2.5 sm:px-5 sm:py-3 pr-12 sm:pr-14 bg-transparent outline-none resize-none",
                  "text-sm leading-relaxed",
                  "placeholder:text-muted-foreground transition-all duration-300",
                  isDark
                    ? "placeholder:text-white/40 focus:placeholder:text-white/50"
                    : "placeholder:text-black/40 focus:placeholder:text-black/50"
                )}
                style={{
                  minHeight: '46px',
                  maxHeight: '120px'
                }}
              />
              <div className="absolute right-2 sm:right-3 bottom-0 top-0 flex items-center justify-center">
                <button
                  type="submit"
                  disabled={!input.trim() || isGenerating}
                  className={cn(
                    "p-2 rounded-full transition-all duration-300 shadow-md",
                    !input.trim()
                      ? (isDark ? "text-white/30" : "text-black/30")
                      : (isDark
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white hover:shadow-lg hover:scale-110"
                          : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400 text-white hover:shadow-lg hover:scale-110"
                        ),
                    isGenerating && "opacity-50 pointer-events-none"
                  )}
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-md" />
                </button>
              </div>
            </div>

            {/* Bottom info area with AI model name */}
            <div className="flex justify-between items-center mt-1.5 text-xs">
              <div className={cn(
                "text-xs",
                isDark ? "text-white/60" : "text-black/60"
              )}>
                {isGenerating ? (
                  <div className="flex items-center gap-1.5">
                    <div className="relative w-3 h-3">
                      <div className={cn(
                        "absolute inset-0 rounded-full animate-ping",
                        isDark ? "bg-purple-400/50" : "bg-purple-500/50"
                      )} style={{ animationDuration: '1.8s' }} />
                      <div className={cn(
                        "absolute inset-0 rounded-full shadow-sm",
                        isDark ? "bg-purple-400/90" : "bg-purple-500/90"
                      )} />
                    </div>
                    <span className="font-medium">AI is thinking{isSearching ? ' and searching with Exa' : ''}...</span>
                  </div>
                ) : (
                  <div>
                    {selectedModel.provider === 'gemini' ? 'Google Gemini' : 'OpenRouter'}
                    {/* Exa search indicator removed */}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedModel.provider === 'openrouter' && (
                  <button
                    type="button"
                    onClick={() => setExaSearchEnabled(!exaSearchEnabled)}
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors",
                      exaSearchEnabled
                        ? (isDark ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-blue-500/20 text-blue-700 border border-blue-500/30")
                        : (isDark ? "bg-zinc-800/50 text-white/50 border border-white/10 hover:border-white/20" : "bg-zinc-100/80 text-black/50 border border-black/10 hover:border-black/20")
                    )}
                    title={exaSearchEnabled ? "Disable Exa search" : "Enable Exa search"}
                  >
                    <Globe className="w-3 h-3" />
                    <span>{exaSearchEnabled ? "Exa search on" : "Exa search off"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    // Add example prompt
                    const examples = [
                      "my notes",
                      "my memories",
                      "Summarize my notes about machine learning",
                      "What are the key points from my saved websites?",
                      "Help me organize my thoughts on this topic",
                      "Compare the information in my saved documents"
                    ];
                    setInput(examples[Math.floor(Math.random() * examples.length)]);
                    inputRef.current?.focus();
                  }}
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-md transition-colors",
                    isDark
                      ? "bg-white/5 hover:bg-white/10 text-white/70"
                      : "bg-black/5 hover:bg-black/10 text-black/70"
                  )}
                >
                  Example
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
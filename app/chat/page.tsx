'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Send, Bot, User, X, ChevronLeft, ExternalLink, History, PlusCircle, MessagesSquare } from 'lucide-react'
import { ModelSelector, type Model } from '@/components/ui/model-selector'
import { useRouter } from 'next/navigation'
import { generateOpenRouterContent } from '@/utils/openrouter'
import { generateNoteContent } from '@/utils/gemini'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createClient } from '@/utils/supabase/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string
  sources?: Array<{
    type: 'note' | 'website' | 'document'
    id: string
    title: string
    url?: string
    content: string
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
  const { resolvedTheme } = useTheme()
  const isDark = mounted ? resolvedTheme === 'dark' : false
  const [selectedModel, setSelectedModel] = useState<Model>({
    provider: 'gemini',
    name: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0'
  })
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const findRelevantContent = (query: string) => {
    const relevantContent: Message['sources'] = []
    const queryLower = query.toLowerCase()

    // Simple relevance scoring based on content matching
    const isRelevant = (text: string) => text.toLowerCase().includes(queryLower)

    // Check notes
    userContent.notes.forEach(note => {
      if (isRelevant(note.title) || isRelevant(note.content)) {
        relevantContent.push({
          type: 'note',
          id: note.id,
          title: note.title,
          content: note.content
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
          content: website.content
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
          content: document.content
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
    
    // Find relevant content before generating response
    const relevantSources = findRelevantContent(userMessage)
    
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
    
    // Save user message to database
    const savedUserMsg = await saveMessage(userMsg, conversationId)
    
    setIsGenerating(true)

    try {
      // Include relevant content in the prompt
      const contextPrompt = relevantSources.length > 0
        ? `Based on the following saved content:\n\n${relevantSources.map(source => 
            `[${source.type.toUpperCase()}] ${source.title}\n${source.content}\n`
          ).join('\n')}\n\nUser question: ${userMessage}`
        : userMessage

      if (selectedModel.provider === 'gemini') {
        const response = await generateNoteContent(contextPrompt)
        const assistantMsg: Message = { 
          role: 'assistant', 
          content: response,
          sources: relevantSources
        }
        
        // Add to state and save to database
        setMessages(prev => [...prev, assistantMsg])
        await saveMessage(assistantMsg, conversationId)
      } else {
        const response = await generateOpenRouterContent(selectedModel.name, contextPrompt)
        if (typeof response === 'string') {
          const assistantMsg: Message = { 
            role: 'assistant', 
            content: response,
            sources: relevantSources
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
                          newMessages[newMessages.length - 1].sources = relevantSources
                        } else {
                          newMessages.push({ 
                            role: 'assistant', 
                            content: accumulatedContent,
                            sources: relevantSources
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
              sources: relevantSources
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
              onClick={() => router.push('/dashboard')}
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
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              isDark={isDark}
            />
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
      <div className="flex-1 overflow-y-auto pt-20 pb-32">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <div className="space-y-4 sm:space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex gap-2 sm:gap-4 text-sm leading-relaxed",
                    message.role === 'assistant' && "items-start",
                    message.role === 'user' && "items-start justify-end"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className={cn(
                      "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0",
                      isDark ? "bg-white/5" : "bg-black/5"
                    )}>
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                  <motion.div 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "relative flex-1 max-w-[calc(100%-64px)] sm:max-w-2xl rounded-2xl px-3 py-2 sm:px-4 sm:py-3 break-words group",
                      message.role === 'assistant' ? (
                        isDark 
                          ? "bg-white/5 text-white/90" 
                          : "bg-black/5 text-black/90"
                      ) : (
                        isDark 
                          ? "bg-white/10 text-white" 
                          : "bg-black/10 text-black"
                      )
                    )}
                  >
                    {/* Delete button */}
                    {message.id && (
                      <button
                        onClick={() => deleteMessage(message.id!)}
                        className={cn(
                          "absolute top-1 right-1 sm:top-2 sm:right-2 p-1 rounded-md opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10",
                          isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/10 text-black/70"
                        )}
                      >
                        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}
                    
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
                          )
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className={cn(
                          "mt-3 pt-3 sm:mt-4 sm:pt-4 border-t",
                          isDark ? "border-white/10" : "border-black/10"
                        )}
                      >
                        <div className={cn(
                          "text-xs font-medium mb-2",
                          isDark ? "text-white/60" : "text-black/60"
                        )}>
                          Sources:
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {message.sources.map((source) => (
                            <button
                              key={source.id}
                              onClick={() => {
                                if (source.type === 'website' && source.url) {
                                  window.open(source.url, '_blank');
                                } else {
                                  router.push(`/dashboard?type=${source.type}&id=${source.id}`);
                                }
                              }}
                              className={cn(
                                "flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs transition-colors",
                                "border",
                                isDark 
                                  ? "bg-white/5 hover:bg-white/10 border-white/10" 
                                  : "bg-black/5 hover:bg-black/10 border-black/10"
                              )}
                            >
                              <span>
                                {source.type === 'note' && '📝'}
                                {source.type === 'website' && '🌐'}
                                {source.type === 'document' && '📄'}
                              </span>
                              <span className="font-medium">{source.title}</span>
                              {source.url && (
                                <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-50" />
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                  {message.role === 'user' && (
                    <div className={cn(
                      "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0",
                      isDark ? "bg-white/5" : "bg-black/5"
                    )}>
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-sm"
              >
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />
                <span>Generating response...</span>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 border-t backdrop-blur-md",
        isDark 
          ? "bg-zinc-900/75 border-zinc-800/50" 
          : "bg-white/75 border-zinc-200/50"
      )}>
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto p-3 sm:p-4"
        >
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              rows={1}
              className={cn(
                "w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 sm:pr-12 rounded-xl border bg-transparent outline-none resize-none",
                "text-sm sm:text-base",
                "placeholder:text-muted-foreground",
                isDark 
                  ? "border-white/10 focus:border-white/20 placeholder:text-white/30" 
                  : "border-black/10 focus:border-black/20 placeholder:text-black/30"
              )}
              style={{
                minHeight: '48px',
                maxHeight: '120px'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-lg transition-colors",
                isDark 
                  ? "hover:bg-white/10 text-white disabled:text-white/30" 
                  : "hover:bg-black/10 text-black disabled:text-black/30"
              )}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
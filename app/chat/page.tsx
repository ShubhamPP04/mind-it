'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Send, Bot, User, X, ChevronLeft, ExternalLink } from 'lucide-react'
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
  sources?: Array<{
    type: 'note' | 'website' | 'document'
    id: string
    title: string
    url?: string
    content: string
  }>
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
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
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
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response,
          sources: relevantSources
        }])
      } else {
        const response = await generateOpenRouterContent(selectedModel.name, contextPrompt)
        if (typeof response === 'string') {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: response,
            sources: relevantSources
          }])
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
          } catch (error) {
            console.error('Error reading stream:', error)
          } finally {
            reader.releaseLock()
          }
        }
      }
    } catch (error) {
      console.error('Error generating response:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I encountered an error generating a response. Please try again.' 
      }])
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
        <div className="mx-auto max-w-4xl flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
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
              "text-lg font-medium",
              isDark ? "text-white" : "text-black"
            )}>AI Chat</h1>
          </div>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pt-20 pb-32">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-4 text-sm leading-relaxed",
                  message.role === 'assistant' && "items-start",
                  message.role === 'user' && "items-start justify-end"
                )}
              >
                {message.role === 'assistant' && (
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                    isDark ? "bg-white/5" : "bg-black/5"
                  )}>
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                <div className={cn(
                  "relative flex-1 max-w-2xl rounded-2xl px-4 py-3 break-words",
                  message.role === 'assistant' ? (
                    isDark 
                      ? "bg-white/5 text-white/90" 
                      : "bg-black/5 text-black/90"
                  ) : (
                    isDark 
                      ? "bg-white/10 text-white" 
                      : "bg-black/10 text-black"
                  )
                )}>
                  <div className={cn(
                    "prose max-w-none",
                    isDark ? "prose-invert" : "prose-neutral"
                  )}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className={cn(
                      "mt-4 pt-4 border-t",
                      isDark ? "border-white/10" : "border-black/10"
                    )}>
                      <div className={cn(
                        "text-xs font-medium mb-2",
                        isDark ? "text-white/60" : "text-black/60"
                      )}>
                        Sources:
                      </div>
                      <div className="flex flex-wrap gap-2">
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
                              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors",
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
                              <ExternalLink className="w-3 h-3 opacity-50" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                    isDark ? "bg-white/5" : "bg-black/5"
                  )}>
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
            {isGenerating && (
              <div className="flex items-center gap-2 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current" />
                <span>Generating response...</span>
              </div>
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
          className="max-w-4xl mx-auto p-4"
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
                "w-full px-4 py-3 pr-12 rounded-xl border bg-transparent outline-none resize-none",
                "placeholder:text-muted-foreground",
                isDark 
                  ? "border-white/10 focus:border-white/20 placeholder:text-white/30" 
                  : "border-black/10 focus:border-black/20 placeholder:text-black/30"
              )}
              style={{
                minHeight: '56px',
                maxHeight: '200px'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors",
                isDark 
                  ? "hover:bg-white/10 text-white disabled:text-white/30" 
                  : "hover:bg-black/10 text-black disabled:text-black/30"
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 
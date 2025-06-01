'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { BackgroundPaths } from "@/components/ui/background-paths"
import { Navbar } from "../components/ui/navbar"
import { Inbox, ArrowLeft, Clock, Check, Bell, Calendar, Filter, Trash2 } from 'lucide-react'
import { DateTimePicker } from '../components/ui/date-time-picker'
import { formatScheduledDate } from '../utils/dateUtils'

interface InboxMessage {
  id: string
  user_id: string
  space_id: string
  message: string
  scheduled_date: string
  created_at: string
  is_read: boolean
}

export default function InboxPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([])
  const [filteredMessages, setFilteredMessages] = useState<InboxMessage[]>([])
  const [filterDate, setFilterDate] = useState<string>('')
  const [showFilter, setShowFilter] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebarOpen')
      return stored === null ? true : stored === 'true'
    }
    return true
  })

  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = mounted ? resolvedTheme === "dark" : false
  const supabase = createClient()

  // Function to fetch inbox messages
  const fetchInboxMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true })

      if (error) {
        console.error('Error fetching inbox messages:', error)
        return
      }

      const messages = data || []
      setInboxMessages(messages)
      setFilteredMessages(messages)
    } catch (error) {
      console.error('Error in fetchInboxMessages:', error)
    }
  }

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

        // Fetch inbox messages
        await fetchInboxMessages(user.id)
      } catch (error) {
        console.error('Error initializing app:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebarOpen', isSidebarOpen.toString())
  }, [isSidebarOpen])

  // Filter messages when filter date changes
  useEffect(() => {
    if (!filterDate) {
      setFilteredMessages(inboxMessages)
      return
    }

    const filterDateObj = new Date(filterDate)
    const filteredMsgs = inboxMessages.filter(msg => {
      const msgDate = new Date(msg.scheduled_date)
      return msgDate.toDateString() === filterDateObj.toDateString()
    })

    setFilteredMessages(filteredMsgs)
  }, [filterDate, inboxMessages])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/signin')
  }

  const handleStartChat = () => {
    router.push('/chat')
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('inbox_messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error marking message as read:', error)
        return
      }

      // Update local state
      setInboxMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      )
    } catch (error) {
      console.error('Error in handleMarkAsRead:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this message?')) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('inbox_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting message:', error)
        return
      }

      // Update local state
      setInboxMessages(prev => prev.filter(msg => msg.id !== messageId))
      setFilteredMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (error) {
      console.error('Error in handleDeleteMessage:', error)
    }
  }

  const formatDate = (dateString: string) => {
    // Use the utility function for consistent formatting
    return formatScheduledDate(dateString)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      <BackgroundPaths className="fixed inset-0 -z-20 pointer-events-none" isDark={isDark} />
      <div className="flex w-full relative z-10">
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar
            isDark={isDark}
            onStartChat={handleStartChat}
            onSignOut={handleSignOut}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
            email={email || undefined}
          />

          <main className="flex-1 overflow-auto p-4 md:pt-24 pt-16">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header with back button */}
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={handleBackToDashboard}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    isDark
                      ? "hover:bg-white/10 text-white/70"
                      : "hover:bg-black/10 text-black/70"
                  )}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <h1 className={cn(
                    "text-2xl font-semibold flex items-center gap-2",
                    isDark ? "text-white/90" : "text-black/90"
                  )}>
                    <Inbox className="w-6 h-6 text-blue-500" />
                    Inbox
                  </h1>
                </div>
              </div>

              {/* Inbox content */}
              <div className={cn(
                "p-6 rounded-xl border",
                isDark
                  ? "bg-black/60 border-white/10"
                  : "bg-white/60 border-black/5"
              )}>
                {inboxMessages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className={cn(
                        "text-lg font-semibold",
                        isDark ? "text-white/90" : "text-black/90"
                      )}>
                        Your Messages
                      </h2>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
                        )}>
                          {inboxMessages.filter(msg => !msg.is_read).length} unread
                        </div>
                        <button
                          onClick={() => setShowFilter(!showFilter)}
                          className={cn(
                            "p-1.5 rounded-full transition-colors",
                            showFilter
                              ? (isDark ? "bg-white/20 text-white" : "bg-black/20 text-black")
                              : (isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-black/10 text-black/60")
                          )}
                        >
                          <Filter className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {showFilter && (
                      <div className={cn(
                        "p-3 rounded-lg border mb-4 animate-in fade-in slide-in-from-top-2 duration-300",
                        isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
                      )}>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className={cn(
                              "text-sm font-medium",
                              isDark ? "text-white/70" : "text-black/70"
                            )}>
                              Filter by date
                            </label>
                            <button
                              onClick={() => {
                                setFilterDate('')
                                setFilteredMessages(inboxMessages)
                              }}
                              className={cn(
                                "text-xs px-2 py-1 rounded transition-colors",
                                isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-black/10 text-black/60"
                              )}
                            >
                              Clear
                            </button>
                          </div>
                          <DateTimePicker
                            value={filterDate}
                            onChange={setFilterDate}
                            isDark={isDark}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {filteredMessages.length > 0 ? (
                        filteredMessages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "p-4 rounded-lg border transition-colors",
                            message.is_read
                              ? (isDark ? "border-white/5 bg-white/5" : "border-black/5 bg-black/5")
                              : (isDark ? "border-blue-500/30 bg-blue-900/10" : "border-blue-300 bg-blue-50")
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "p-1.5 rounded-full",
                                message.is_read
                                  ? (isDark ? "bg-white/10" : "bg-black/10")
                                  : (isDark ? "bg-blue-900/30" : "bg-blue-100")
                              )}>
                                <Bell className={cn(
                                  "w-4 h-4",
                                  message.is_read
                                    ? (isDark ? "text-white/60" : "text-black/60")
                                    : "text-blue-500"
                                )} />
                              </div>
                              <div className={cn(
                                "text-sm font-medium",
                                message.is_read
                                  ? (isDark ? "text-white/70" : "text-black/70")
                                  : (isDark ? "text-white" : "text-black")
                              )}>
                                Scheduled Message
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "flex items-center gap-1 text-xs",
                                isDark ? "text-white/50" : "text-black/50"
                              )}>
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(message.scheduled_date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {!message.is_read && (
                                  <button
                                    onClick={() => handleMarkAsRead(message.id)}
                                    className={cn(
                                      "p-1 rounded-full transition-colors",
                                      isDark
                                        ? "hover:bg-white/10 text-white/60"
                                        : "hover:bg-black/10 text-black/60"
                                    )}
                                    title="Mark as read"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleDeleteMessage(message.id, e)}
                                  className={cn(
                                    "p-1 rounded-full transition-colors",
                                    isDark
                                      ? "hover:bg-red-900/20 text-red-400/70 hover:text-red-400"
                                      : "hover:bg-red-100 text-red-500/70 hover:text-red-500"
                                  )}
                                  title="Delete message"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className={cn(
                            "p-3 rounded-lg",
                            isDark ? "bg-white/5" : "bg-black/5"
                          )}>
                            <p className={cn(
                              message.is_read
                                ? (isDark ? "text-white/70" : "text-black/70")
                                : (isDark ? "text-white/90" : "text-black/90")
                            )}>
                              {message.message}
                            </p>
                          </div>
                        </div>
                      ))
                      ) : (
                        <div className={cn(
                          "p-6 rounded-lg text-center",
                          isDark ? "bg-white/5" : "bg-black/5"
                        )}>
                          <div className="flex flex-col items-center justify-center py-4">
                            <Calendar className={cn(
                              "w-10 h-10 mb-3",
                              isDark ? "text-white/40" : "text-black/40"
                            )} />
                            <p className={cn(
                              "text-sm",
                              isDark ? "text-white/60" : "text-black/60"
                            )}>
                              No messages found for the selected date
                            </p>
                            <button
                              onClick={() => {
                                setFilterDate('')
                                setFilteredMessages(inboxMessages)
                              }}
                              className={cn(
                                "mt-3 px-3 py-1.5 rounded text-xs font-medium transition-colors",
                                isDark
                                  ? "bg-white/10 hover:bg-white/20 text-white"
                                  : "bg-black/10 hover:bg-black/20 text-black"
                              )}
                            >
                              Clear Filter
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Inbox className={cn(
                      "w-16 h-16 mb-4",
                      isDark ? "text-blue-400" : "text-blue-600"
                    )} />
                    <h2 className={cn(
                      "text-xl font-semibold mb-2",
                      isDark ? "text-white/90" : "text-black/90"
                    )}>
                      Your Inbox is Empty
                    </h2>
                    <p className={cn(
                      "max-w-md text-center mb-6",
                      isDark ? "text-white/60" : "text-black/60"
                    )}>
                      This is where you'll find all your important notifications, messages, and updates.
                    </p>
                    <button
                      onClick={() => router.push('/dashboard?tab=inbox')}
                      className={cn(
                        "px-4 py-2 rounded-lg transition-colors",
                        isDark
                          ? "bg-blue-900/30 text-blue-300 hover:bg-blue-900/50"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      )}
                    >
                      Add Your First Message
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { LogOut, MessageSquarePlus, Menu, User, ChevronDown, Settings } from 'lucide-react'
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useUser } from '@/contexts/UserContext'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavbarProps {
  className?: string
  isDark?: boolean
  onStartChat?: () => void
  onSignOut?: () => void
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
  email?: string
}

export function Navbar({ 
  className, 
  isDark = false,
  onStartChat,
  onSignOut,
  onToggleSidebar,
  isSidebarOpen = true,
  email
}: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { profile } = useUser()

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md",
      isDark 
        ? "bg-zinc-900/75 border-zinc-800/50" 
        : "bg-white/75 border-zinc-200/50"
    )}>
      <nav
        className={cn(
          "mx-auto max-w-4xl flex h-14 items-center justify-between px-4",
          className
        )}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark 
                ? "hover:bg-zinc-800 text-zinc-400" 
                : "hover:bg-zinc-100 text-zinc-600"
            )}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link 
            href="/dashboard" 
            className={cn(
              "text-2xl font-calendas italic tracking-tight",
              isDark ? "text-white" : "text-black"
            )}
          >
            mind-it.
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onStartChat}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-300 text-sm",
              "border relative overflow-hidden group",
              isDark 
                ? "bg-transparent border-zinc-600 text-zinc-300 hover:text-white hover:border-zinc-400" 
                : "bg-transparent border-zinc-400 text-zinc-600 hover:text-black hover:border-zinc-600"
            )}
          >
            <div className={cn(
              "absolute inset-0 w-0 h-full transition-all duration-300 ease-out group-hover:w-full",
              isDark 
                ? "bg-zinc-800/30" 
                : "bg-zinc-100/80",
              "origin-left"
            )} />
            <MessageSquarePlus className={cn(
              "w-3.5 h-3.5 transition-all duration-300 relative z-10",
              "group-hover:translate-x-0.5"
            )} />
            <span className={cn(
              "font-medium relative z-10 transition-all duration-300",
              "group-hover:translate-x-0.5"
            )}>AI Chat</span>
          </button>
          <ThemeToggle />
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
                isDark 
                  ? "hover:bg-zinc-800/90 text-zinc-400" 
                  : "hover:bg-zinc-100/90 text-zinc-600"
              )}
            >
              <Avatar className="h-8 w-8 transition-all duration-300 hover:scale-105">
                <AvatarImage 
                  src={profile?.avatar_url || undefined} 
                  alt="User avatar" 
                  className="object-cover object-center"
                />
                <AvatarFallback className="animate-pulse bg-muted">
                  <User className="h-4 w-4 text-muted-foreground/60" />
                </AvatarFallback>
              </Avatar>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-300",
                isProfileOpen && "transform rotate-180"
              )} />
            </button>

            <div className={cn(
              "absolute right-0 mt-2 w-56 rounded-lg shadow-lg py-1 border backdrop-blur-md",
              "transition-all duration-200 origin-top",
              isProfileOpen 
                ? "opacity-100 translate-y-0 scale-100" 
                : "opacity-0 -translate-y-2 scale-95 pointer-events-none",
              isDark 
                ? "bg-zinc-900/75 border-zinc-800/50" 
                : "bg-white/75 border-zinc-200/50"
            )}>
              {email && (
                <div className={cn(
                  "px-3 py-2 border-b",
                  isDark ? "border-zinc-800/50" : "border-zinc-200/50"
                )}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 transition-all duration-300">
                      <AvatarImage 
                        src={profile?.avatar_url || undefined} 
                        alt="User avatar" 
                        className="object-cover object-center"
                      />
                      <AvatarFallback className="animate-pulse bg-muted">
                        <User className="h-4 w-4 text-muted-foreground/60" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <div className={cn(
                        "text-sm font-medium truncate",
                        isDark ? "text-white" : "text-black"
                      )}>
                        {profile?.full_name || 'User'}
                      </div>
                      <div className={cn(
                        "text-xs truncate",
                        isDark ? "text-zinc-400" : "text-zinc-600"
                      )}>
                        {email}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="py-1">
                <button
                  onClick={() => window.location.href = '/account'}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-all duration-200",
                    isDark 
                      ? "hover:bg-zinc-800/90 text-zinc-300 hover:text-white" 
                      : "hover:bg-zinc-100/90 text-zinc-600 hover:text-black"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  <span>Account Settings</span>
                </button>
                <button
                  onClick={onSignOut}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-all duration-200",
                    isDark 
                      ? "hover:bg-zinc-800/90 text-zinc-300 hover:text-white" 
                      : "hover:bg-zinc-100/90 text-zinc-600 hover:text-black"
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
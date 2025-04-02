'use client'

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { LogOut, MessageSquarePlus, Menu, User, ChevronDown, Settings, Sparkle, Star, Bot, Zap, Brain, Moon, Sun } from 'lucide-react'
import { useTheme } from "next-themes"
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
  const { resolvedTheme, setTheme } = useTheme()

  // Function to handle theme change with animation
  const handleThemeChange = () => {
    // Add animation class to the document body
    document.body.classList.add('theme-transition');
    
    // Toggle theme
    setTheme(isDark ? "light" : "dark");
    
    // Remove the class after animation completes
    setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 400); // Match the duration in CSS
  }

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md",
      isDark 
        ? "bg-zinc-900/75 border-zinc-800/50" 
        : "bg-white/75 border-zinc-200/50"
    )}>
      <nav
        className={cn(
          "mx-auto max-w-4xl flex h-14 items-center justify-between px-2 sm:px-4",
          className
        )}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className={cn(
              "hidden md:block p-1.5 sm:p-2 rounded-lg transition-colors",
              isDark 
                ? "hover:bg-zinc-800 text-zinc-400" 
                : "hover:bg-zinc-100 text-zinc-600"
            )}
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <Link 
            href="/dashboard" 
            className={cn(
              "text-xl sm:text-2xl font-calendas italic tracking-tight pl-1 sm:pl-0",
              "relative transition-all duration-300",
              isDark ? "text-white" : "text-black"
            )}
          >
            <span className="relative">
              mind-it
              <span className="text-purple-500 dark:text-purple-400">.</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            onClick={(e) => {
              console.log('Memory button clicked')
              onStartChat?.()
            }}
            className={cn(
              "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all duration-300 text-xs sm:text-sm",
              "border relative overflow-hidden group whitespace-nowrap",
              isDark 
                ? "border-purple-700/40 text-purple-300" 
                : "border-purple-300 text-purple-700"
            )}
          >
            <div className={cn(
              "absolute inset-0 w-0 h-full transition-all duration-300 ease-out group-hover:w-full -z-10",
              isDark 
                ? "bg-purple-900/30" 
                : "bg-purple-100/80",
              "origin-left"
            )} />
            <div className="relative z-10 transition-all duration-300 w-3 sm:w-3.5 h-3 sm:h-3.5 group-hover:translate-x-0.5 group-hover:scale-110">
              <Zap className={cn(
                "w-3 h-3 sm:w-3.5 sm:h-3.5 absolute transition-all duration-300",
                "group-hover:opacity-0 group-hover:scale-75",
                isDark ? "text-purple-300" : "text-purple-700"
              )} />
              <Bot className={cn(
                "w-3 h-3 sm:w-3.5 sm:h-3.5 absolute opacity-0 scale-75 transition-all duration-300",
                "group-hover:opacity-100 group-hover:scale-100",
                isDark ? "text-purple-300" : "text-purple-700"
              )} />
            </div>
            <span className={cn(
              "font-medium relative z-10 transition-all duration-300",
              "group-hover:translate-x-0.5"
            )}>Memory</span>
          </button>
          <button
            onClick={handleThemeChange}
            className={cn(
              "p-1.5 rounded-md transition-all duration-200 relative overflow-hidden group",
              "hover:scale-110 active:scale-95",
              isDark 
                ? "bg-zinc-800/80 text-yellow-300 hover:bg-zinc-800" 
                : "bg-zinc-100/80 text-blue-500 hover:bg-zinc-200/80"
            )}
            aria-label="Toggle theme"
          >
            <div className="relative w-4 h-4">
              <div 
                className={cn(
                  "absolute inset-0 transition-all duration-300 transform",
                  isDark ? "opacity-100 rotate-0" : "opacity-0 rotate-90 scale-50"
                )}
              >
                <Sun className="w-4 h-4" />
              </div>
              <div 
                className={cn(
                  "absolute inset-0 transition-all duration-300 transform",
                  isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0"
                )}
              >
                <Moon className="w-4 h-4" />
              </div>
            </div>
            <div 
              className={cn(
                "absolute inset-0 w-full h-full transform scale-0 group-hover:scale-100 transition-transform duration-300 origin-center",
                "opacity-20 rounded-full",
                isDark ? "bg-yellow-300" : "bg-blue-500"
              )}
            />
          </button>
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200",
                isDark 
                  ? "hover:bg-zinc-800/90 text-zinc-400" 
                  : "hover:bg-zinc-100/90 text-zinc-600"
              )}
            >
              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 transition-all duration-300 hover:scale-105">
                <AvatarImage 
                  src={profile?.avatar_url || undefined} 
                  alt="User avatar" 
                  className="object-cover object-center"
                />
                <AvatarFallback className="animate-pulse bg-muted">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/60" />
                </AvatarFallback>
              </Avatar>
              <ChevronDown className={cn(
                "w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300",
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
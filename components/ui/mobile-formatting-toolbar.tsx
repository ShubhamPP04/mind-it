'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading,
  Quote,
  Code,
  Link,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from 'lucide-react'

interface MobileFormattingToolbarProps {
  isDark: boolean
  onFormat: (format: string, text: string) => void
  selectedText: string | null
}

export function MobileFormattingToolbar({ isDark, onFormat, selectedText }: MobileFormattingToolbarProps) {
  const isDisabled = !selectedText || selectedText.trim() === ''
  const [activeButton, setActiveButton] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Group buttons by category
  const textFormatButtons = [
    { icon: Bold, label: 'Bold', format: 'bold', color: 'text-purple-500' },
    { icon: Italic, label: 'Italic', format: 'italic', color: 'text-purple-500' },
    { icon: Underline, label: 'Underline', format: 'underline', color: 'text-purple-500' }
  ]

  const listFormatButtons = [
    { icon: List, label: 'Bullet List', format: 'bullet', color: 'text-blue-500' },
    { icon: ListOrdered, label: 'Numbered List', format: 'numbered', color: 'text-blue-500' }
  ]

  const styleFormatButtons = [
    { icon: Heading, label: 'Heading', format: 'heading', color: 'text-amber-500' },
    { icon: Quote, label: 'Quote', format: 'quote', color: 'text-amber-500' },
    { icon: Code, label: 'Code', format: 'code', color: 'text-green-500' },
    { icon: Link, label: 'Link', format: 'link', color: 'text-green-500' }
  ]

  // Reset active button after a delay
  useEffect(() => {
    if (activeButton) {
      const timer = setTimeout(() => {
        setActiveButton(null)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [activeButton])

  const handleButtonClick = (format: string) => {
    if (selectedText) {
      setActiveButton(format)
      onFormat(format, selectedText)
    }
  }

  // Render a button with appropriate styling
  const renderButton = (button: any) => (
    <button
      key={button.format}
      onClick={() => handleButtonClick(button.format)}
      className={cn(
        "p-2 rounded-md transition-all relative",
        isMobile ? "w-10 h-10 flex items-center justify-center" : "",
        isDark
          ? "hover:bg-white/10 text-white/80 hover:text-white"
          : "hover:bg-black/10 text-black/80 hover:text-black",
        activeButton === button.format && (
          isDark
            ? "bg-white/20 text-white"
            : "bg-black/10 text-black"
        ),
        "group"
      )}
      disabled={isDisabled}
      title={button.label}
    >
      <button.icon className={cn("w-4 h-4", !isDisabled && button.color)} />

      {/* Active indicator */}
      {activeButton === button.format && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
      )}
    </button>
  )

  // Render a button group with a label
  const renderButtonGroup = (title: string, buttons: any[], showDivider = true) => (
    <div className={cn(
      "flex flex-col items-center px-2",
      showDivider && (
        isMobile 
          ? "border-r-0 pb-2" 
          : "border-r"
      ),
      isDark ? "border-white/10" : "border-black/10"
    )}>
      {!isMobile && (
        <span className={cn(
          "text-xs mb-1 font-medium",
          isDark ? "text-white/50" : "text-black/50"
        )}>
          {title}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        {buttons.map(renderButton)}
      </div>
    </div>
  )

  // Mobile compact view
  if (isMobile && !isExpanded) {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-2 rounded-md backdrop-blur-sm",
          isDark
            ? "bg-black/40 border border-white/10"
            : "bg-white/60 border border-black/10",
          isDisabled && "opacity-50 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {textFormatButtons.map(renderButton)}
        </div>
        
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            "ml-1 p-2 rounded-md transition-all",
            isDark
              ? "hover:bg-white/10 text-white/80 hover:text-white"
              : "hover:bg-black/10 text-black/80 hover:text-black"
          )}
          disabled={isDisabled}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-md backdrop-blur-sm",
        isDark
          ? "bg-black/40 border border-white/10"
          : "bg-white/60 border border-black/10",
        isDisabled && "opacity-50 pointer-events-none",
        isMobile ? "p-2" : "p-2"
      )}
    >
      {isMobile && (
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-dashed" style={{
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }}>
          <span className={cn(
            "text-xs font-medium",
            isDark ? "text-white/70" : "text-black/70"
          )}>
            Formatting
          </span>
          <button
            onClick={() => setIsExpanded(false)}
            className={cn(
              "p-1.5 rounded-md transition-all",
              isDark
                ? "hover:bg-white/10 text-white/80 hover:text-white"
                : "hover:bg-black/10 text-black/80 hover:text-black"
            )}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div className={cn(
        "flex",
        isMobile ? "flex-col gap-3" : "items-center"
      )}>
        {/* Text formatting group */}
        {renderButtonGroup("Text", textFormatButtons, !isMobile)}

        {/* List formatting group */}
        {renderButtonGroup("Lists", listFormatButtons, !isMobile)}

        {/* Style formatting group */}
        {renderButtonGroup("Style", styleFormatButtons, false)}

        {/* Indicator when text is selected */}
        {!isDisabled && !isMobile && (
          <div className="ml-auto flex items-center gap-1 px-2">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className={cn(
              "text-xs",
              isDark ? "text-white/70" : "text-black/70"
            )}>
              Text selected
            </span>
          </div>
        )}
      </div>
      
      {/* Mobile text selected indicator */}
      {!isDisabled && isMobile && (
        <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-dashed" style={{
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }}>
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span className={cn(
            "text-xs",
            isDark ? "text-white/70" : "text-black/70"
          )}>
            Text selected
          </span>
        </div>
      )}
    </div>
  )
}

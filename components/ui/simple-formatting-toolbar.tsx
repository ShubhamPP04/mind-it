'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
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
  Sparkles
} from 'lucide-react'

interface SimpleFormattingToolbarProps {
  isDark: boolean
  onFormat: (format: string, text: string) => void
  selectedText: string | null
}

export function SimpleFormattingToolbar({ isDark, onFormat, selectedText }: SimpleFormattingToolbarProps) {
  const isDisabled = !selectedText || selectedText.trim() === ''
  const [activeButton, setActiveButton] = useState<string | null>(null)

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

  // Render a button group with a label
  const renderButtonGroup = (title: string, buttons: any[]) => (
    <div className={cn(
      "flex flex-col items-center px-2",
      buttons !== styleFormatButtons && "border-r",
      isDark ? "border-white/10" : "border-black/10"
    )}>
      <span className={cn(
        "text-xs mb-1 font-medium",
        isDark ? "text-white/50" : "text-black/50"
      )}>
        {title}
      </span>
      <div className="flex items-center gap-1.5">
        {buttons.map((button) => (
          <button
            key={button.format}
            onClick={() => handleButtonClick(button.format)}
            className={cn(
              "p-2 rounded-md transition-all relative",
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

            {/* Tooltip */}
            <span
              className={cn(
                "absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded-md whitespace-nowrap z-10",
                "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                isDark
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-800 shadow-md"
              )}
            >
              {button.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div
      className={cn(
        "flex items-center gap-0 p-2 rounded-md mb-2 overflow-x-auto backdrop-blur-sm",
        isDark
          ? "bg-black/30 border border-white/10 shadow-lg"
          : "bg-white/30 border border-black/10 shadow-md",
        isDisabled && "opacity-50 pointer-events-none transition-opacity duration-300",
        !isDisabled && "transition-all duration-300"
      )}
    >
      {/* Text formatting group */}
      {renderButtonGroup("Text", textFormatButtons)}

      {/* List formatting group */}
      {renderButtonGroup("Lists", listFormatButtons)}

      {/* Style formatting group */}
      {renderButtonGroup("Style", styleFormatButtons)}

      {/* Indicator when text is selected */}
      {!isDisabled && (
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
  )
}

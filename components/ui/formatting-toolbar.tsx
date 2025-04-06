'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading,
  Link,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  ImageIcon,
  Strikethrough,
  ChevronDown,
  ChevronUp,
  Type
} from 'lucide-react'

interface FormattingToolbarProps {
  isDark: boolean
  onFormat: (format: string, selection?: { start: number; end: number }) => void
  getSelection: () => { start: number; end: number; text: string } | null
  activeSelection?: boolean
}

interface FormatButtonProps {
  icon: any
  label: string
  format: string
  onClick: () => void
  isDark: boolean
  isActive?: boolean
}

// Enhanced button component with hover effects
const FormatButton = ({ icon: Icon, label, format, onClick, isDark, isActive = false }: FormatButtonProps) => {
  // Define gradient backgrounds for active buttons based on format type
  const getActiveGradient = () => {
    if (format === 'bold' || format === 'italic' || format === 'underline' || format === 'strikethrough') {
      return 'bg-gradient-to-br from-purple-500/80 to-indigo-500/80';
    } else if (format === 'bullet' || format === 'numbered') {
      return 'bg-gradient-to-br from-blue-500/80 to-cyan-500/80';
    } else if (format === 'heading' || format === 'paragraph' || format === 'quote') {
      return 'bg-gradient-to-br from-amber-500/80 to-orange-500/80';
    } else if (format === 'link' || format === 'code' || format === 'image') {
      return 'bg-gradient-to-br from-green-500/80 to-emerald-500/80';
    } else if (format.startsWith('align-')) {
      return 'bg-gradient-to-br from-pink-500/80 to-rose-500/80';
    }
    return isDark ? 'bg-white/20' : 'bg-black/20';
  };

  // Handle the click event with stopPropagation to prevent blur
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()} // Prevent blur on mousedown
      className={cn(
        "relative p-2 rounded-md transition-all flex items-center justify-center",
        isActive
          ? cn(getActiveGradient(), "text-white shadow-md")
          : isDark
            ? "hover:bg-white/10 text-white/80 hover:text-white"
            : "hover:bg-black/10 text-black/80 hover:text-black"
      )}
      title={label}
      data-format={format}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="w-4 h-4" />

      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* Tooltip */}
      <motion.span
        className={cn(
          "absolute -top-8 px-2 py-1 text-xs rounded-md whitespace-nowrap opacity-0 pointer-events-none z-50",
          isDark
            ? "bg-gray-800 text-white"
            : "bg-white text-gray-800 shadow-md"
        )}
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {label}
      </motion.span>
    </motion.button>
  )
}

// Format group component
const FormatGroup = ({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) => {
  return (
    <div className={cn(
      "flex flex-col items-center px-2 py-1 border-r",
      isDark ? "border-white/10" : "border-black/10"
    )}>
      <motion.span
        className={cn(
          "text-xs mb-1 font-medium",
          isDark ? "text-white/50" : "text-black/50"
        )}
        whileHover={{ scale: 1.05, color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }}
      >
        {title}
      </motion.span>
      <div className="flex items-center gap-1.5">
        {children}
      </div>
    </div>
  )
}

export function FormattingToolbar({ isDark, onFormat, getSelection, activeSelection = false }: FormattingToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeFormats, setActiveFormats] = useState<string[]>([])

  const handleFormat = (format: string) => {
    const selection = getSelection()
    if (selection) {
      // Prevent default behavior and stop propagation
      onFormat(format, selection)

      // Toggle active state for the format
      setActiveFormats(prev =>
        prev.includes(format)
          ? prev.filter(f => f !== format)
          : [...prev, format]
      )

      // Keep focus on the toolbar after formatting
      setTimeout(() => {
        // Find the button that was clicked and focus it
        try {
          // Use a more reliable selector
          const formatButtons = document.querySelectorAll('.formatting-toolbar button');
          const button = Array.from(formatButtons).find(btn =>
            btn.getAttribute('title')?.toLowerCase() === format.toLowerCase() ||
            btn.getAttribute('data-format') === format
          ) as HTMLButtonElement;

          if (button) {
            button.focus();
          }
        } catch (error) {
          console.error('Error focusing button:', error);
        }
      }, 10);
    }
  }

  // Update active formats when selection changes
  useEffect(() => {
    if (!activeSelection) {
      setActiveFormats([])
    }
  }, [activeSelection])

  // Clear active formats when selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = getSelection()
      if (!selection || selection.start === selection.end) {
        setActiveFormats([])
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [getSelection])

  // Text formatting buttons
  const textFormatButtons = [
    { icon: Bold, label: 'Bold', format: 'bold' },
    { icon: Italic, label: 'Italic', format: 'italic' },
    { icon: Underline, label: 'Underline', format: 'underline' },
    { icon: Strikethrough, label: 'Strikethrough', format: 'strikethrough' },
  ]

  // List formatting buttons
  const listFormatButtons = [
    { icon: List, label: 'Bullet List', format: 'bullet' },
    { icon: ListOrdered, label: 'Numbered List', format: 'numbered' },
  ]

  // Heading and paragraph buttons
  const headingButtons = [
    { icon: Heading, label: 'Heading', format: 'heading' },
    { icon: Type, label: 'Paragraph', format: 'paragraph' },
    { icon: Quote, label: 'Quote', format: 'quote' },
  ]

  // Additional buttons shown when expanded
  const expandedButtons = [
    { icon: Link, label: 'Link', format: 'link' },
    { icon: Code, label: 'Code', format: 'code' },
    { icon: ImageIcon, label: 'Image', format: 'image' },
  ]

  // Alignment buttons
  const alignmentButtons = [
    { icon: AlignLeft, label: 'Align Left', format: 'align-left' },
    { icon: AlignCenter, label: 'Align Center', format: 'align-center' },
    { icon: AlignRight, label: 'Align Right', format: 'align-right' },
  ]

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        "formatting-toolbar flex items-center gap-0 p-2 rounded-md mb-2 overflow-x-auto backdrop-blur-sm z-10",
        isDark
          ? "bg-black/40 border border-white/10 shadow-lg"
          : "bg-white/60 border border-black/10 shadow-md",
        !activeSelection && "opacity-50 pointer-events-none transition-opacity duration-300",
        activeSelection && "transition-all duration-300"
      )}
      onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking on the toolbar itself
    >
      {/* Text formatting group */}
      <FormatGroup title="Text" isDark={isDark}>
        {textFormatButtons.map((button) => (
          <FormatButton
            key={button.format}
            icon={button.icon}
            label={button.label}
            format={button.format}
            onClick={() => handleFormat(button.format)}
            isDark={isDark}
            isActive={activeFormats.includes(button.format)}
          />
        ))}
      </FormatGroup>

      {/* List formatting group */}
      <FormatGroup title="Lists" isDark={isDark}>
        {listFormatButtons.map((button) => (
          <FormatButton
            key={button.format}
            icon={button.icon}
            label={button.label}
            format={button.format}
            onClick={() => handleFormat(button.format)}
            isDark={isDark}
            isActive={activeFormats.includes(button.format)}
          />
        ))}
      </FormatGroup>

      {/* Headings group */}
      <FormatGroup title="Style" isDark={isDark}>
        {headingButtons.map((button) => (
          <FormatButton
            key={button.format}
            icon={button.icon}
            label={button.label}
            format={button.format}
            onClick={() => handleFormat(button.format)}
            isDark={isDark}
            isActive={activeFormats.includes(button.format)}
          />
        ))}
      </FormatGroup>

      {/* Expanded section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex overflow-hidden"
          >
            {/* Insert group */}
            <FormatGroup title="Insert" isDark={isDark}>
              {expandedButtons.map((button) => (
                <FormatButton
                  key={button.format}
                  icon={button.icon}
                  label={button.label}
                  format={button.format}
                  onClick={() => handleFormat(button.format)}
                  isDark={isDark}
                  isActive={activeFormats.includes(button.format)}
                />
              ))}
            </FormatGroup>

            {/* Alignment group */}
            <FormatGroup title="Align" isDark={isDark}>
              {alignmentButtons.map((button) => (
                <FormatButton
                  key={button.format}
                  icon={button.icon}
                  label={button.label}
                  format={button.format}
                  onClick={() => handleFormat(button.format)}
                  isDark={isDark}
                  isActive={activeFormats.includes(button.format)}
                />
              ))}
            </FormatGroup>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand/collapse button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "p-2 rounded-md transition-colors ml-auto flex items-center gap-1",
          isDark
            ? "hover:bg-white/10 text-white/70 hover:text-white"
            : "hover:bg-black/10 text-black/70 hover:text-black"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-xs font-medium">{isExpanded ? "Less" : "More"}</span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </motion.button>
    </motion.div>
  )
}

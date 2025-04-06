'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface StreamingTextProps {
  text: string
  isDark: boolean
  speed?: number
  className?: string
}

export function StreamingText({ text, isDark, speed = 20, className }: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    let currentIndex = 0
    
    const typeNextCharacter = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1))
        currentIndex++
        
        // Calculate dynamic delay based on punctuation
        let delay = speed
        const currentChar = text[currentIndex - 1]
        if (['.', '!', '?'].includes(currentChar)) {
          delay = speed * 8 // Longer pause after sentences
        } else if ([',', ';', ':'].includes(currentChar)) {
          delay = speed * 4 // Medium pause after commas, etc.
        } else if (currentChar === ' ') {
          delay = speed * 0.5 // Slightly faster for spaces
        }
        
        timeoutRef.current = setTimeout(typeNextCharacter, delay)
      } else {
        setIsComplete(true)
      }
    }
    
    // Reset state when text changes
    setDisplayedText('')
    setIsComplete(false)
    currentIndex = 0
    
    // Start typing effect
    timeoutRef.current = setTimeout(typeNextCharacter, 100)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, speed])
  
  return (
    <div className={cn("prose prose-sm sm:prose-base max-w-none", className)}>
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
        {displayedText}
      </ReactMarkdown>
      
      {/* Blinking cursor at the end */}
      {!isComplete && (
        <motion.span
          className={cn(
            "inline-block w-1.5 h-4 ml-0.5 align-middle",
            isDark ? "bg-white/80" : "bg-black/80"
          )}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </div>
  )
}

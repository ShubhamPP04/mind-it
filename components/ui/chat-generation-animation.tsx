'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Sparkles, Bot, Stars, Zap, Brain, Lightbulb, Cpu, Atom } from 'lucide-react'

interface ChatGenerationAnimationProps {
  isDark: boolean
}

// Animated text that simulates typing
const TypingText = ({ text, isDark }: { text: string; isDark: boolean }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 30 + Math.random() * 25) // Slightly faster typing

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text])

  return (
    <span className={cn(
      "font-medium tracking-tight",
      isDark ? "text-white/95" : "text-black/95"
    )}>
      {displayedText}
      <span className="inline-block w-1.5 h-5 ml-0.5 align-middle bg-current animate-pulse rounded-sm" />
    </span>
  )
}

// Enhanced particle effect for the background
const Particle = ({ index, isDark }: { index: number; isDark: boolean }) => {
  const size = Math.random() * 4 + 1.5 // Slightly larger particles
  const duration = Math.random() * 1.8 + 1.2
  const initialX = Math.random() * 100 - 50
  const initialY = Math.random() * 60 - 30

  // Create a variety of colors for particles
  const colors = isDark
    ? [
        "bg-purple-400/70", "bg-blue-400/70", "bg-indigo-400/70",
        "bg-violet-400/70", "bg-fuchsia-400/70", "bg-cyan-400/70"
      ]
    : [
        "bg-purple-500/70", "bg-blue-500/70", "bg-indigo-500/70",
        "bg-violet-500/70", "bg-fuchsia-500/70", "bg-cyan-500/70"
      ]

  const colorClass = colors[index % colors.length]

  return (
    <motion.div
      className={cn(
        "absolute rounded-full",
        colorClass
      )}
      style={{
        width: size,
        height: size,
        filter: `blur(${size > 3 ? '1px' : '0.5px'})` // Add slight blur effect
      }}
      initial={{
        x: initialX,
        y: initialY,
        opacity: 0,
        scale: 0.5
      }}
      animate={{
        x: [initialX, initialX + Math.random() * 50 - 25],
        y: [initialY, initialY - 25 - Math.random() * 25],
        opacity: [0, 0.9, 0],
        scale: [0.5, 1.2, 0.8]
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: index * 0.12,
        ease: "easeInOut"
      }}
    />
  )
}

// Pulse ring animation component
const PulseRing = ({ isDark }: { isDark: boolean }) => {
  return (
    <motion.div
      className={cn(
        "absolute inset-0 rounded-full",
        isDark ? "border border-purple-500/40" : "border border-purple-500/30"
      )}
      initial={{ scale: 0.8, opacity: 0.8 }}
      animate={{
        scale: [0.8, 1.2, 0.8],
        opacity: [0.8, 0, 0.8]
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

export function ChatGenerationAnimation({ isDark }: ChatGenerationAnimationProps) {
  const [currentIcon, setCurrentIcon] = useState(0)
  const [currentText, setCurrentText] = useState(0)
  const icons = [Bot, Sparkles, Stars, Zap, Brain, Lightbulb, Cpu, Atom]
  const Icon = icons[currentIcon]

  const thinkingTexts = [
    "Analyzing your request...",
    "Searching knowledge base...",
    "Generating response...",
    "Crafting the perfect answer...",
    "Processing information...",
    "Connecting ideas...",
    "Exploring possibilities...",
    "Synthesizing concepts..."
  ]

  useEffect(() => {
    const iconInterval = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % icons.length)
    }, 1800) // Slightly faster icon rotation

    const textInterval = setInterval(() => {
      setCurrentText(prev => (prev + 1) % thinkingTexts.length)
    }, 3500) // Slightly faster text rotation

    return () => {
      clearInterval(iconInterval)
      clearInterval(textInterval)
    }
  }, [icons.length, thinkingTexts.length])

  // Generate more particles for a richer effect
  const particles = Array.from({ length: 20 }, (_, i) => (
    <Particle key={i} index={i} isDark={isDark} />
  ))

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        {/* Pulse rings */}
        <PulseRing isDark={isDark} />

        {/* Icon container with enhanced animated background */}
        <motion.div
          className={cn(
            "relative flex items-center justify-center w-9 h-9 rounded-full overflow-hidden", // Slightly larger
            isDark
              ? "bg-gradient-to-br from-purple-600/40 to-blue-600/40 border border-purple-500/50"
              : "bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/40"
          )}
          animate={{
            boxShadow: [
              isDark ? '0 0 10px 0px rgba(168, 85, 247, 0.5)' : '0 0 10px 0px rgba(168, 85, 247, 0.4)',
              isDark ? '0 0 15px 3px rgba(168, 85, 247, 0.7)' : '0 0 15px 3px rgba(168, 85, 247, 0.6)',
              isDark ? '0 0 10px 0px rgba(168, 85, 247, 0.5)' : '0 0 10px 0px rgba(168, 85, 247, 0.4)'
            ],
            background: isDark
              ? [
                  'linear-gradient(135deg, rgba(147, 51, 234, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%)',
                  'linear-gradient(225deg, rgba(147, 51, 234, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%)',
                  'linear-gradient(315deg, rgba(147, 51, 234, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%)'
                ]
              : [
                  'linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
                  'linear-gradient(225deg, rgba(147, 51, 234, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
                  'linear-gradient(315deg, rgba(147, 51, 234, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)'
                ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Enhanced particles in the background */}
          <div className="absolute inset-0 flex items-center justify-center">
            {particles}
          </div>

          {/* Improved rotating icon animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIcon}
              initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 30 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              className="relative z-10"
            >
              <Icon className="w-5 h-5 text-white drop-shadow-md" /> {/* Slightly larger icon */}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Enhanced text animation */}
      <div className="h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentText}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.4, type: "spring", damping: 15 }}
          >
            <TypingText text={thinkingTexts[currentText]} isDark={isDark} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

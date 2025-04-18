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

// Enhanced particle effect for the background with improved visuals
const Particle = ({ index, isDark }: { index: number; isDark: boolean }) => {
  const size = Math.random() * 5 + 2 // Larger particles for better visibility
  const duration = Math.random() * 2 + 1.5 // Slightly longer animation
  const initialX = Math.random() * 120 - 60 // Wider spread
  const initialY = Math.random() * 80 - 40 // Wider spread

  // Create a variety of colors for particles with higher opacity
  const colors = isDark
    ? [
        "bg-purple-400/80", "bg-blue-400/80", "bg-indigo-400/80",
        "bg-violet-400/80", "bg-fuchsia-400/80", "bg-cyan-400/80",
        "bg-pink-400/80", "bg-sky-400/80"
      ]
    : [
        "bg-purple-500/80", "bg-blue-500/80", "bg-indigo-500/80",
        "bg-violet-500/80", "bg-fuchsia-500/80", "bg-cyan-500/80",
        "bg-pink-500/80", "bg-sky-500/80"
      ]

  const colorClass = colors[index % colors.length]

  return (
    <motion.div
      className={cn(
        "absolute rounded-full shadow-sm", // Added shadow for depth
        colorClass
      )}
      style={{
        width: size,
        height: size,
        filter: `blur(${size > 4 ? '1.5px' : '0.7px'})` // Enhanced blur effect
      }}
      initial={{
        x: initialX,
        y: initialY,
        opacity: 0,
        scale: 0.5
      }}
      animate={{
        x: [initialX, initialX + Math.random() * 60 - 30], // More movement
        y: [initialY, initialY - 30 - Math.random() * 30], // More movement
        opacity: [0, 0.95, 0], // Higher peak opacity
        scale: [0.5, 1.3, 0.7] // More dramatic scaling
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: index * 0.1, // Slightly faster start delay
        ease: "easeInOut"
      }}
    />
  )
}

// Enhanced pulse ring animation component with double rings
const PulseRing = ({ isDark }: { isDark: boolean }) => {
  return (
    <>
      {/* Inner pulse ring */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full",
          isDark ? "border-2 border-purple-500/50" : "border-2 border-purple-500/40"
        )}
        initial={{ scale: 0.8, opacity: 0.9 }}
        animate={{
          scale: [0.8, 1.3, 0.8],
          opacity: [0.9, 0, 0.9]
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {/* Outer pulse ring with offset timing */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full",
          isDark ? "border border-blue-500/40" : "border border-blue-500/30"
        )}
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{
          scale: [0.9, 1.4, 0.9],
          opacity: [0.7, 0, 0.7]
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5 // Offset timing for interesting effect
        }}
      />
    </>
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

  // Generate even more particles for a richer visual effect
  const particles = Array.from({ length: 30 }, (_, i) => (
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
            "relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden", // Larger for better visibility
            isDark
              ? "bg-gradient-to-br from-purple-600/50 to-blue-600/50 border border-purple-500/60"
              : "bg-gradient-to-br from-purple-500/40 to-blue-500/40 border border-purple-500/50"
          )}
          animate={{
            boxShadow: [
              isDark ? '0 0 12px 2px rgba(168, 85, 247, 0.6)' : '0 0 12px 2px rgba(168, 85, 247, 0.5)',
              isDark ? '0 0 18px 5px rgba(168, 85, 247, 0.8)' : '0 0 18px 5px rgba(168, 85, 247, 0.7)',
              isDark ? '0 0 12px 2px rgba(168, 85, 247, 0.6)' : '0 0 12px 2px rgba(168, 85, 247, 0.5)'
            ],
            background: isDark
              ? [
                  'linear-gradient(135deg, rgba(147, 51, 234, 0.5) 0%, rgba(59, 130, 246, 0.5) 100%)',
                  'linear-gradient(225deg, rgba(147, 51, 234, 0.5) 0%, rgba(59, 130, 246, 0.5) 100%)',
                  'linear-gradient(315deg, rgba(147, 51, 234, 0.5) 0%, rgba(59, 130, 246, 0.5) 100%)'
                ]
              : [
                  'linear-gradient(135deg, rgba(147, 51, 234, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%)',
                  'linear-gradient(225deg, rgba(147, 51, 234, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%)',
                  'linear-gradient(315deg, rgba(147, 51, 234, 0.4) 0%, rgba(59, 130, 246, 0.4) 100%)'
                ]
          }}
          transition={{
            duration: 2.5, // Slightly faster animation
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
              <Icon className="w-5 h-5 text-white drop-shadow-lg" /> {/* Enhanced drop shadow */}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Enhanced text animation with improved transitions */}
      <div className="h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentText}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring", damping: 12, stiffness: 100 }}
          >
            <TypingText text={thinkingTexts[currentText]} isDark={isDark} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

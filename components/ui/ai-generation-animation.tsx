'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Sparkles, Wand2, Zap, Brain, Stars } from 'lucide-react'

interface AIGenerationAnimationProps {
  isDark: boolean
  isGenerating: boolean
}

// Particle component for the background effect
const Particle = ({ index, isDark }: { index: number; isDark: boolean }) => {
  const size = Math.random() * 4 + 2;
  const duration = Math.random() * 2 + 2;
  const initialX = Math.random() * 200 - 100;
  const initialY = Math.random() * 200 - 100;

  return (
    <motion.div
      className={cn(
        "absolute rounded-full",
        isDark ? "bg-purple-400" : "bg-purple-500"
      )}
      style={{
        width: size,
        height: size,
        opacity: 0.6,
      }}
      initial={{
        x: initialX,
        y: initialY,
        opacity: 0
      }}
      animate={{
        x: [initialX, initialX + Math.random() * 60 - 30],
        y: [initialY, initialY - 40 - Math.random() * 40],
        opacity: [0, 0.8, 0]
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: index * 0.1,
        ease: "easeInOut"
      }}
    />
  );
};

// Typing effect component
const TypingEffect = ({ text, isDark }: { text: string; isDark: boolean }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50 + Math.random() * 50);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <div className={cn(
      "font-mono text-sm",
      isDark ? "text-purple-200" : "text-purple-800"
    )}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </div>
  );
};

export function AIGenerationAnimation({ isDark, isGenerating }: AIGenerationAnimationProps) {
  const [dots, setDots] = useState('.')
  const [currentIcon, setCurrentIcon] = useState(0);
  const icons = [Sparkles, Wand2, Zap, Brain, Stars];
  const Icon = icons[currentIcon];

  // Animated dots for the "Generating..." text
  useEffect(() => {
    if (!isGenerating) return

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.')
    }, 400)

    const iconInterval = setInterval(() => {
      setCurrentIcon(prev => (prev + 1) % icons.length);
    }, 1500);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(iconInterval);
    }
  }, [isGenerating, icons.length])

  if (!isGenerating) return null

  // Generate random particles
  const particles = Array.from({ length: 30 }, (_, i) => (
    <Particle key={i} index={i} isDark={isDark} />
  ));

  // AI thinking messages
  const aiMessages = [
    "Analyzing your request...",
    "Generating creative ideas...",
    "Crafting the perfect response...",
    "Applying AI magic...",
    "Polishing the content..."
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center rounded-lg backdrop-blur-md overflow-hidden",
        isDark ? "bg-black/80" : "bg-white/80"
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className={cn(
            "absolute inset-0 opacity-20",
            isDark ? "bg-gradient-to-br from-purple-900 via-blue-800 to-indigo-900" :
                    "bg-gradient-to-br from-purple-400 via-blue-300 to-indigo-400"
          )}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />

        {/* Particles */}
        <div className="absolute inset-0 flex items-center justify-center">
          {particles}
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 z-10">
        {/* Main icon animation */}
        <motion.div
          className="relative"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Glowing background */}
          <motion.div
            className={cn(
              "absolute -inset-4 rounded-full blur-xl",
              isDark ? "bg-purple-600/20" : "bg-purple-400/30"
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Rotating ring */}
          <motion.div
            className={cn(
              "absolute -inset-2 rounded-full border-2 border-dashed",
              isDark ? "border-purple-500/40" : "border-purple-400/60"
            )}
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Icon with pulse effect */}
          <motion.div
            className="relative bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-full shadow-lg border-2 border-white/20"
            animate={{
              boxShadow: [
                isDark ? '0 0 10px 2px rgba(168, 85, 247, 0.4)' : '0 0 10px 2px rgba(168, 85, 247, 0.3)',
                isDark ? '0 0 20px 5px rgba(168, 85, 247, 0.6)' : '0 0 20px 5px rgba(168, 85, 247, 0.5)',
                isDark ? '0 0 10px 2px rgba(168, 85, 247, 0.4)' : '0 0 10px 2px rgba(168, 85, 247, 0.3)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIcon}
                initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Icon className="w-8 h-8 text-white" />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Text animations */}
        <div className="flex flex-col items-center text-center max-w-xs">
          <motion.h3
            className={cn(
              "text-lg font-bold mb-2",
              isDark ? "text-white" : "text-gray-800"
            )}
            animate={{
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Generating AI content{dots}
          </motion.h3>

          {/* Typing effect for AI messages */}
          <div className="h-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={dots} // Use dots as key to trigger animation
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <TypingEffect
                  text={aiMessages[Math.floor(Math.random() * aiMessages.length)]}
                  isDark={isDark}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <motion.div
            className="w-48 h-1.5 mt-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-inner"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600"
              initial={{ width: "0%", x: "-100%" }}
              animate={{
                width: "100%",
                x: "0%",
                background: [
                  "linear-gradient(90deg, rgb(168, 85, 247) 0%, rgb(99, 102, 241) 100%)",
                  "linear-gradient(90deg, rgb(236, 72, 153) 0%, rgb(239, 68, 68) 100%)",
                  "linear-gradient(90deg, rgb(16, 185, 129) 0%, rgb(59, 130, 246) 100%)",
                  "linear-gradient(90deg, rgb(168, 85, 247) 0%, rgb(99, 102, 241) 100%)"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

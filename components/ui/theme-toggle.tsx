"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = mounted && resolvedTheme === "dark"

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "relative flex w-[48px] h-6 px-[2px] rounded-full cursor-pointer transition-all duration-300",
        isDark 
          ? "bg-zinc-800/50 border border-zinc-700/50 shadow-lg shadow-black/10" 
          : "bg-zinc-100/80 border border-zinc-200/80 shadow-lg shadow-black/5",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      {/* Track */}
      <div className="relative w-full flex items-center">
        {/* Static Icons */}
        <div className="flex justify-between items-center w-full">
          <div className="w-4 h-4 flex items-center justify-center">
            <Moon className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
          </div>
          <div className="w-4 h-4 flex items-center justify-center">
            <Sun className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Sliding Thumb */}
        <motion.div
          layout
          initial={false}
          animate={{ x: isDark ? 0 : 24 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
          className={cn(
            "absolute top-[1px] left-[1px] flex items-center justify-center w-[20px] h-[20px] rounded-full",
            isDark 
              ? "bg-zinc-950 border border-zinc-800" 
              : "bg-white border border-zinc-200"
          )}
        >
          <motion.div
            initial={false}
            animate={{ 
              rotate: isDark ? 0 : 180,
              scale: [1, 0.9, 1]
            }}
            transition={{ 
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="flex items-center justify-center w-full h-full"
          >
            <div className="flex items-center justify-center w-4 h-4">
              {isDark ? (
                <Moon className="w-3.5 h-3.5 text-zinc-100" strokeWidth={1.5} />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.button>
  )
} 
'use client'

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { BackgroundPaths } from "@/components/ui/background-paths"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from "lucide-react"

export default function VerifyEmail() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    setMounted(true)
    const storedEmail = localStorage.getItem('signUpEmail')
    setEmail(storedEmail)
  }, [])

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('No email found. Please try signing up again.')
      return
    }

    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Verification email has been resent!')
    }
    setLoading(false)
  }

  return (
    <div className={cn(
      "relative w-full h-full min-h-screen transition-colors duration-500",
      isDark ? "bg-black" : "bg-zinc-50"
    )}>
      <BackgroundPaths />
      
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-[100]">
        <ThemeToggle className="shadow-lg" />
      </div>
      
      <div className="relative z-10 w-full h-full min-h-screen flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="relative group">
            <div className={cn(
              "absolute -inset-0.5 rounded-3xl opacity-50 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt blur-xl",
              isDark 
                ? "bg-gradient-to-r from-black/40 to-black/20"
                : "bg-gradient-to-r from-black/10 to-black/5"
            )}></div>
            
            <div className={cn(
              "relative backdrop-blur-2xl p-8 rounded-3xl border shadow-2xl transition-all duration-500",
              isDark 
                ? "bg-black/60 border-white/10" 
                : "bg-white/60 border-black/5"
            )}>
              <div className="text-center space-y-6">
                <h1 className={cn(
                  "text-3xl font-bold transition-colors duration-500",
                  isDark ? "text-white/90" : "text-black/90"
                )}>
                  Check Your Email
                </h1>
                
                <p className={cn(
                  "transition-colors duration-500",
                  isDark ? "text-white/60" : "text-black/60"
                )}>
                  We've sent a verification link to{" "}
                  <span className="font-medium">{email}</span>
                </p>

                <button
                  onClick={handleResendEmail}
                  disabled={loading}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2",
                    isDark 
                      ? "bg-white/10 hover:bg-white/20 text-white" 
                      : "bg-black/10 hover:bg-black/20 text-black",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Resend verification email"
                  )}
                </button>

                {message && (
                  <p className={cn(
                    "text-sm",
                    message.includes('error') || message.includes('No email')
                      ? "text-red-500"
                      : "text-green-500"
                  )}>
                    {message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 
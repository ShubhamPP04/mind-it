"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Check, Eye, EyeOff } from "lucide-react"
import { BackgroundPaths } from "@/components/ui/background-paths"
import { StarBorder } from "@/components/ui/star-border"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { signUp } from "@/app/auth/actions"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [mounted, setMounted] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsCreating(true)

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      setIsCreating(false)
      return
    }

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    
    try {
      const result = await signUp(formData)
      
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        // Store email in localStorage for the verify-email page
        localStorage.setItem('signUpEmail', email)
        router.push('/verify-email')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="relative w-full h-full min-h-screen bg-white dark:bg-black transition-colors duration-500">
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
          {/* Glass Card with gradient border */}
          <div className="relative group">
            {/* Gradient border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-400/30 to-zinc-300/20 dark:from-black/40 dark:to-black/20 rounded-3xl opacity-50 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-tilt blur-xl"></div>
            
            <div className="relative backdrop-blur-2xl bg-white/60 dark:bg-black/60 p-8 rounded-3xl border border-zinc-200/50 dark:border-white/10 shadow-2xl transition-colors duration-500">
              {/* Logo/Brand */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 1.5, bounce: 0.5 }}
                  className="text-zinc-900 dark:text-white text-2xl font-bold transition-colors duration-500"
                >
                  mind-it.
                </motion.div>
              </div>

              {/* Header */}
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white/90 transition-colors duration-500">
                  Create Account
                </h1>
                <p className="text-zinc-500 dark:text-white/40 transition-colors duration-500">Join us on this journey</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-600 dark:text-white/60 pl-1 transition-colors duration-500">Name</label>
                  <div className="relative group/input">
                    <input 
                      type="text"
                      name="name"
                      placeholder="Enter your name"
                      required
                      className="w-full px-4 py-3 bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 
                               dark:border-white/10 rounded-xl text-zinc-900 dark:text-white 
                               placeholder:text-zinc-400 dark:placeholder:text-white/20 
                               focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-white/20 
                               transition-all duration-300 group-hover/input:border-zinc-300 
                               dark:group-hover/input:border-white/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-600 dark:text-white/60 pl-1 transition-colors duration-500">Email</label>
                  <div className="relative group/input">
                    <input 
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 
                               dark:border-white/10 rounded-xl text-zinc-900 dark:text-white 
                               placeholder:text-zinc-400 dark:placeholder:text-white/20 
                               focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-white/20 
                               transition-all duration-300 group-hover/input:border-zinc-300 
                               dark:group-hover/input:border-white/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-600 dark:text-white/60 pl-1 transition-colors duration-500">Password</label>
                  <div className="relative group/input">
                    <input 
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="w-full px-4 py-3 bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 
                               dark:border-white/10 rounded-xl text-zinc-900 dark:text-white 
                               placeholder:text-zinc-400 dark:placeholder:text-white/20 
                               focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-white/20 
                               transition-all duration-300 group-hover/input:border-zinc-300 
                               dark:group-hover/input:border-white/20 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 
                               dark:text-white/40 dark:hover:text-white/60 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 cursor-pointer group/check" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                  <div className="relative">
                    <input 
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="peer sr-only" 
                    />
                    <div className="w-4 h-4 border-2 border-zinc-300 dark:border-white/20 rounded 
                                  bg-zinc-100/50 dark:bg-white/5 peer-checked:bg-zinc-300 
                                  dark:peer-checked:bg-white/20 peer-checked:border-transparent 
                                  transition-all duration-300 flex items-center justify-center">
                      {agreedToTerms && (
                        <Check className="w-3 h-3 text-white dark:text-black" strokeWidth={3} />
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-zinc-500 dark:text-white/40 group-hover/check:text-zinc-700 
                                 dark:group-hover/check:text-white/60 transition-colors">
                    I agree to the Terms of Service and Privacy Policy
                  </span>
                </div>

                {error && (
                  <div className={cn(
                    "text-sm text-red-500 mt-2 text-center",
                    isDark ? "text-red-400" : "text-red-600"
                  )}>
                    {error}
                  </div>
                )}
                {success && (
                  <div className={cn(
                    "text-sm text-green-500 mt-2 text-center",
                    isDark ? "text-green-400" : "text-green-600"
                  )}>
                    {success}
                  </div>
                )}

                <StarBorder 
                  type="submit"
                  className="w-full"
                  color={isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(161, 161, 170, 0.8)"}
                  speed="4s"
                  disabled={isCreating}
                >
                  {isCreating ? "Creating..." : "Create Account"}
                </StarBorder>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-zinc-500 dark:text-white/40 transition-colors duration-500">
                  Already have an account?{" "}
                  <button 
                    type="button"
                    onClick={() => window.location.href = '/signin'}
                    className="text-zinc-700 hover:text-zinc-900 dark:text-white/60 dark:hover:text-white/80 
                             transition-colors font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 
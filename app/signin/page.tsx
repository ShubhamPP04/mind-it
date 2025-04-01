"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { BackgroundPaths } from "@/components/ui/background-paths"
import { StarBorder } from "@/components/ui/star-border"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Check, Eye, EyeOff } from "lucide-react"
import { signIn } from "@/app/auth/actions"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = mounted ? resolvedTheme === "dark" : false
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Check if there's a remembered email
    const rememberedEmail = localStorage.getItem('remembered_email')
    if (rememberedEmail) {
      setRememberMe(true)
      // Auto-fill the email input
      const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
      if (emailInput) {
        emailInput.value = rememberedEmail
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      // Add remember me value to form data
      formData.append('remember_me', rememberMe.toString())
      
      const result = await signIn(formData)
      
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        // If remember me is checked, store the email
        if (rememberMe) {
          localStorage.setItem('remembered_email', formData.get('email') as string)
        } else {
          localStorage.removeItem('remembered_email')
        }
        router.push('/dashboard')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null
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
          {/* Glass Card with gradient border */}
          <div className="relative group">
            {/* Gradient border effect */}
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
              {/* Logo/Brand */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 1.5, bounce: 0.5 }}
                  className={cn(
                    "text-2xl font-bold transition-colors duration-500",
                    isDark ? "text-white" : "text-black"
                  )}
                >
                  mind-it.
                </motion.div>
              </div>

              {/* Header */}
              <div className="text-center space-y-2 mb-8">
                <h1 className={cn(
                  "text-3xl font-bold transition-colors duration-500",
                  isDark ? "text-white/90" : "text-black/90"
                )}>
                  Welcome Back
                </h1>
                <p className={cn(
                  "transition-colors duration-500",
                  isDark ? "text-white/40" : "text-black/40"
                )}>
                  Sign in to continue your journey
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className={cn(
                    "text-sm font-medium pl-1 transition-colors duration-500",
                    isDark ? "text-white/60" : "text-black/60"
                  )}>
                    Email
                  </label>
                  <div className="relative group/input">
                    <input 
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl transition-all duration-300",
                        isDark 
                          ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-white/20 group-hover/input:border-white/20" 
                          : "bg-black/5 border-black/10 text-black placeholder:text-black/20 focus:ring-black/20 group-hover/input:border-black/20",
                        "border focus:outline-none focus:ring-2"
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={cn(
                    "text-sm font-medium pl-1 transition-colors duration-500",
                    isDark ? "text-white/60" : "text-black/60"
                  )}>
                    Password
                  </label>
                  <div className="relative group/input">
                    <input 
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl transition-all duration-300 pr-12",
                        isDark 
                          ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-white/20 group-hover/input:border-white/20" 
                          : "bg-black/5 border-black/10 text-black placeholder:text-black/20 focus:ring-black/20 group-hover/input:border-black/20",
                        "border focus:outline-none focus:ring-2"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 transition-colors",
                        isDark 
                          ? "text-white/40 hover:text-white/60" 
                          : "text-black/40 hover:text-black/60"
                      )}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer group/check">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer sr-only" 
                        id="remember-me"
                      />
                      <div 
                        className={cn(
                          "w-4 h-4 border-2 rounded transition-all duration-300 flex items-center justify-center",
                          isDark 
                            ? "border-white/20 bg-white/5 peer-checked:bg-white/20" 
                            : "border-black/20 bg-black/5 peer-checked:bg-black/20",
                          "peer-checked:border-transparent hover:border-opacity-50"
                        )}
                      >
                        <motion.div
                          initial={false}
                          animate={{ 
                            scale: rememberMe ? 1 : 0,
                            opacity: rememberMe ? 1 : 0
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {rememberMe && (
                            <Check 
                              className={cn(
                                "w-3 h-3",
                                isDark ? "text-black" : "text-white"
                              )} 
                              strokeWidth={3}
                            />
                          )}
                        </motion.div>
                      </div>
                    </div>
                    <span className={cn(
                      "text-sm transition-colors duration-500 select-none",
                      isDark 
                        ? "text-white/40 group-hover/check:text-white/60" 
                        : "text-black/40 group-hover/check:text-black/60"
                    )}>
                      Remember me
                    </span>
                  </label>
                  <button 
                    type="button"
                    className={cn(
                      "text-sm transition-colors duration-500",
                      isDark 
                        ? "text-white/40 hover:text-white/60" 
                        : "text-black/40 hover:text-black/60"
                    )}
                  >
                    Forgot password?
                  </button>
                </div>

                <StarBorder 
                  type="submit"
                  className="w-full"
                  color={isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"}
                  speed="4s"
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </div>
                </StarBorder>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className={cn(
                  "transition-colors duration-500",
                  isDark ? "text-white/40" : "text-black/40"
                )}>
                  Don't have an account?{" "}
                  <button 
                    type="button"
                    onClick={() => window.location.href = '/signup'}
                    className={cn(
                      "font-medium transition-colors duration-500",
                      isDark 
                        ? "text-white/60 hover:text-white/80" 
                        : "text-black/60 hover:text-black/80"
                    )}
                  >
                    Sign up
                  </button>
                </p>
              </div>

              {/* Add this error message display */}
              {error && (
                <div className={cn(
                  "text-sm text-red-500 mt-2 text-center",
                  isDark ? "text-red-400" : "text-red-600"
                )}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 
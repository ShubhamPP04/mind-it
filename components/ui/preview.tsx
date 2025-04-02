"use client"

import { useEffect, useState, useRef } from "react"
import { motion, stagger, useAnimate, AnimatePresence, useScroll, useTransform } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Brain, Sparkles, MessageSquare, CheckCircle2, ArrowRight, Star, Shield, Lock, Award, Eye, CheckCircle } from "lucide-react"

import Floating, { FloatingElement } from "@/components/ui/parallax-floating"
import { StarBorder } from "@/components/ui/star-border"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { BackgroundPaths } from "@/components/ui/background-paths"
import { cn } from "@/lib/utils"

const exampleImages = [
  {
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    author: "Daria Shevtsova",
    title: "Woman in Black Tank Top",
  },
  {
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    title: "Landscape Mountain",
    author: "Bailey Zindel",
  },
  {
    url: "https://images.unsplash.com/photo-1682687982501-1e58ab814714?auto=format&fit=crop&w=800&q=80",
    author: "Unsplash",
    title: "Abstract Art",
  },
  {
    url: "https://images.unsplash.com/photo-1682687218147-9806132dc697?auto=format&fit=crop&w=800&q=80",
    author: "Unsplash",
    title: "Digital Art",
  },
  {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
    author: "Unsplash",
    title: "Nature Landscape",
  },
  {
    url: "https://images.unsplash.com/photo-1655635131711-f52f3fd15328?auto=format&fit=crop&w=800&q=80",
    author: "Unsplash",
    title: "Abstract Pattern",
  },
  {
    url: "https://images.unsplash.com/photo-1655635131711-f52f3fd15328?auto=format&fit=crop&w=800&q=80",
    author: "Unsplash",
    title: "Abstract Pattern",
  },
  {
    url: "https://images.unsplash.com/photo-1655635131711-f52f3fd15328?auto=format&fit=crop&w=800&q=80",
    author: "Unsplash",
    title: "Abstract Pattern",
  }
]

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Organization",
    description: "Our intelligent algorithms help structure your knowledge in ways that make retrieval intuitive and efficient"
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Conversational Interface",
    description: "Ask questions and get answers from your personal knowledge base through natural language interactions"
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Smart Memory",
    description: "Seamlessly store websites, documents, and notes with contextual connections that enhance recall"
  }
]

const privacyFeatures = [
  {
    icon: <Lock className="w-5 h-5" />,
    title: "End-to-End Encryption",
    description: "Your sensitive data is encrypted before leaving your device"
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Privacy Controls",
    description: "Granular permission settings for what data is used for AI training"
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Transparency",
    description: "Clear documentation on how your data is stored and processed"
  }
]

const testimonials = [
  {
    text: "Mind-It has revolutionized how I organize my research for academic papers.",
    author: "Alex Thompson",
    role: "Professor",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  {
    text: "The AI chat feature helps me find connections between my notes I never noticed before.",
    author: "Sarah Cheng",
    role: "Content Creator",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  },
  {
    text: "Finally, an app that helps me remember everything in one place.",
    author: "Michael Roberts",
    role: "Product Manager",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  }
]

const Preview = () => {
  const router = useRouter()
  const [scope, animate] = useAnimate()
  const [visibleSection, setVisibleSection] = useState("hero")
  const [mounted, setMounted] = useState(false)
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0)
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [1, 0.8, 0.8, 0])

  useEffect(() => {
    setMounted(true)
    
    // Only run animations after component is mounted and scope is available
    if (scope.current) {
      animate("img", { opacity: [0, 1] }, { duration: 0.5, delay: stagger(0.15) })
    }
    
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      
      if (scrollY < windowHeight * 0.5) {
        setVisibleSection("hero")
      } else if (scrollY < windowHeight * 1.5) {
        setVisibleSection("features")
      } else {
        setVisibleSection("testimonials")
      }
    }
    
    // Feature cycling
    const interval = setInterval(() => {
      setActiveFeatureIndex(prev => (prev + 1) % features.length)
    }, 3000)
    
    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearInterval(interval)
    }
  }, [animate, scope, mounted])

  if (!mounted) return null

  return (
    <div ref={scope} className="relative min-h-screen bg-white dark:bg-black transition-colors duration-500 overflow-x-hidden">
      <BackgroundPaths />
      
      {/* Floating colored orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-60 h-60 bg-purple-500/20 dark:bg-purple-700/20 rounded-full blur-3xl"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-blue-500/20 dark:bg-blue-700/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-3/4 w-40 h-40 bg-pink-500/20 dark:bg-pink-700/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* Hero Section */}
      <section ref={containerRef} className="relative z-10 min-h-screen flex items-center justify-center">
        <motion.div style={{ opacity }} className="absolute inset-0 pointer-events-none">
          <Floating sensitivity={-1} className="absolute inset-0 overflow-hidden">
            <FloatingElement depth={0.5} className="top-[8%] left-[11%]">
              <motion.img
                initial={{ opacity: 0 }}
                src={exampleImages[0].url}
                className="w-16 h-16 md:w-24 md:h-24 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-2xl shadow-lg"
              />
            </FloatingElement>
            <FloatingElement depth={1} className="top-[10%] left-[32%]">
              <motion.img
                initial={{ opacity: 0 }}
                src={exampleImages[1].url}
                className="w-20 h-20 md:w-28 md:h-28 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-2xl shadow-lg"
              />
            </FloatingElement>
            <FloatingElement depth={2} className="top-[2%] left-[53%]">
              <motion.img
                initial={{ opacity: 0 }}
                src={exampleImages[2].url}
                className="w-28 h-40 md:w-40 md:h-52 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-2xl shadow-lg"
              />
            </FloatingElement>
            <FloatingElement depth={1} className="top-[0%] left-[83%]">
              <motion.img
                initial={{ opacity: 0 }}
                src={exampleImages[3].url}
                className="w-24 h-24 md:w-32 md:h-32 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-2xl shadow-lg"
              />
            </FloatingElement>
            <FloatingElement depth={1} className="top-[40%] left-[2%]">
              <motion.img
                initial={{ opacity: 0 }}
                src={exampleImages[4].url}
                className="w-28 h-28 md:w-36 md:h-36 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-2xl shadow-lg"
              />
            </FloatingElement>
            <FloatingElement depth={2} className="top-[70%] left-[77%]">
              <motion.img
                initial={{ opacity: 0 }}
                src={exampleImages[7].url}
                className="w-28 h-28 md:w-36 md:h-48 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-2xl shadow-lg"
              />
            </FloatingElement>
            <FloatingElement depth={4} className="top-[73%] left-[15%]">
              <motion.img
                initial={{ opacity: 0 }}
                src={exampleImages[5].url}
                className="w-40 md:w-52 h-full object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-2xl shadow-lg"
              />
            </FloatingElement>
            <FloatingElement depth={1} className="top-[80%] left-[50%]">
              <motion.img
                initial={{ opacity: 0 }}
                src={exampleImages[6].url}
                className="w-24 h-24 md:w-32 md:h-32 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform rounded-2xl shadow-lg"
              />
            </FloatingElement>
          </Floating>
        </motion.div>
        
        <motion.div
          className="relative z-50 text-center flex flex-col space-y-8 max-w-4xl px-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.88, delay: 0.5 }}
        >
          <div className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-sm text-purple-700 dark:text-purple-300 font-medium mx-auto mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reimagine your digital memory</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 via-violet-600 to-indigo-700 dark:from-purple-400 dark:via-violet-300 dark:to-indigo-400">
            mind<span className="italic font-calendas">-it</span>.
          </h1>
          
          <p className="text-lg md:text-xl text-black/70 dark:text-white/70 max-w-2xl mx-auto">
            The intelligent knowledge management platform that transforms how you organize and access your digital memories.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <ShimmerButton 
              onClick={() => router.push("/signin")}
              className="relative z-50 overflow-hidden group"
              background="linear-gradient(45deg, rgba(124, 58, 237, 0.9), rgba(79, 70, 229, 0.9))"
              shimmerColor="rgba(255, 255, 255, 0.2)"
            >
              <span className="text-lg font-medium text-white flex items-center gap-2 relative z-10">
                Get Started 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </ShimmerButton>
            
            <button 
              onClick={() => {
                const featuresEl = document.getElementById("features")
                featuresEl?.scrollIntoView({ behavior: "smooth" })
              }}
              className="px-6 py-3 rounded-full border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition duration-300 group overflow-hidden relative"
            >
              <span className="relative z-10 group-hover:text-white dark:group-hover:text-black transition-colors duration-300">Learn More</span>
              <span className="absolute inset-0 w-0 bg-black dark:bg-white group-hover:w-full -z-10 transition-all duration-300"></span>
            </button>
          </div>
          
          <div className="pt-12 flex justify-center gap-8 flex-wrap">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">10x</span>
              <span className="text-sm text-black/60 dark:text-white/60">Faster Organization</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">AI</span>
              <span className="text-sm text-black/60 dark:text-white/60">Powered</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">Secure</span>
              <span className="text-sm text-black/60 dark:text-white/60">Data Controls</span>
            </div>
          </div>
        </motion.div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowRight className="w-6 h-6 text-black/40 dark:text-white/40 rotate-90" />
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="relative z-20 min-h-screen flex flex-col items-center justify-center py-24 px-6">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white dark:from-black to-transparent z-10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-20">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={visibleSection === "features" ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 text-sm text-indigo-700 dark:text-indigo-300 font-medium mx-auto mb-5">
              <Award className="w-3.5 h-3.5" />
              <span>Cutting-edge features</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              Rethink How You Organize Knowledge
            </h2>
            <p className="text-lg text-black/60 dark:text-white/60 max-w-2xl mx-auto">
              Mind-It combines AI assistance with a beautiful interface to help you capture, organize, and recall everything that matters.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className={cn(
                  "rounded-xl p-6 transition-all duration-500 border",
                  "dark:border-white/10 border-black/10",
                  "hover:shadow-xl relative overflow-hidden group",
                  activeFeatureIndex === index 
                    ? "border-purple-500/50 bg-purple-50/50 dark:bg-purple-900/10 transform scale-105" 
                    : "hover:border-purple-500/30 hover:bg-purple-50/30 dark:hover:bg-purple-900/5"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={visibleSection === "features" ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="absolute -right-12 -top-12 w-40 h-40 bg-purple-500/5 rounded-full blur-xl transform group-hover:scale-150 transition-transform duration-700"></div>
                <div className="p-3.5 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 inline-block mb-4 relative">
                  <div className="text-purple-600 dark:text-purple-400">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white mb-2">{feature.title}</h3>
                <p className="text-black/60 dark:text-white/60">{feature.description}</p>
                
                <div className="h-1 w-0 bg-gradient-to-r from-purple-500 to-indigo-500 mt-4 group-hover:w-1/2 transition-all duration-300 rounded-full"></div>
              </motion.div>
            ))}
          </div>
          
          {/* Privacy Section */}
          <motion.div 
            className="mt-24 pt-16 border-t border-black/10 dark:border-white/10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={visibleSection === "features" ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-black dark:text-white mb-4">Your Privacy Matters</h3>
            <p className="text-black/60 dark:text-white/60 max-w-2xl mx-auto mb-12">
              We believe in transparency and user control. That's why we've built Mind-It with privacy-focused features.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {privacyFeatures.map((feature, index) => (
                <div 
                  key={index}
                  className="flex gap-3 items-start px-5 py-4 rounded-lg bg-black/5 dark:bg-white/5"
                >
                  <div className="flex-shrink-0 mt-1 bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                    {feature.icon}
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-black dark:text-white">{feature.title}</h4>
                    <p className="text-sm text-black/60 dark:text-white/60">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <motion.div 
              className="mt-16 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={visibleSection === "features" ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <ShimmerButton 
                onClick={() => router.push("/signin")}
                className="relative z-50 overflow-hidden"
                background="linear-gradient(45deg, rgba(79, 70, 229, 0.9), rgba(124, 58, 237, 0.9))"
                shimmerColor="rgba(255, 255, 255, 0.2)"
              >
                <span className="text-lg font-medium text-white">
                  Start Organizing
                </span>
              </ShimmerButton>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center py-24 px-6">
        <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-white/80 dark:from-black/80 to-transparent z-10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-20">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={visibleSection === "testimonials" ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-sm text-green-700 dark:text-green-300 font-medium mx-auto mb-5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Trusted by thousands</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
              Trusted by Thinkers & Creators
            </h2>
            <p className="text-lg text-black/60 dark:text-white/60 max-w-2xl mx-auto">
              Join thousands who use Mind-It to organize their digital lives.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index} 
                className={cn(
                  "rounded-xl p-8 transition-all duration-300 group hover:-translate-y-1",
                  "bg-white/80 backdrop-blur-sm dark:bg-black/40", 
                  "border dark:border-white/10 border-black/10 hover:shadow-xl"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={visibleSection === "testimonials" ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="flex mb-5 justify-between items-start">
                  <div className="flex -space-x-2 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="text-3xl text-purple-300 dark:text-purple-600 font-serif">"</div>
                </div>
                <p className="text-black/80 dark:text-white/80 mb-6">
                  {testimonial.text}
                </p>
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-zinc-800"
                  />
                  <div>
                    <p className="font-medium text-black dark:text-white">{testimonial.author}</p>
                    <p className="text-sm text-black/60 dark:text-white/60">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            className="mt-16 py-12 px-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={visibleSection === "testimonials" ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-black dark:text-white mb-3">Ready to transform your digital memory?</h3>
            <p className="text-black/60 dark:text-white/60 max-w-2xl mx-auto mb-8">
              Join thousands of users who have already revolutionized how they store and retrieve information.
            </p>
            <ShimmerButton 
              onClick={() => router.push("/signin")}
              className="relative z-50 px-8"
              background="linear-gradient(45deg, rgba(124, 58, 237, 0.9), rgba(79, 70, 229, 0.9))"
              shimmerColor="rgba(255, 255, 255, 0.3)"
            >
              <span className="text-lg font-medium text-white">
                Get Started — It's Free
              </span>
            </ShimmerButton>
          </motion.div>
        </div>
      </section>
      
      {/* Footer Section */}
      <footer className="relative z-20 bg-white dark:bg-black border-t border-black/10 dark:border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-black dark:text-white font-calendas">
              mind<span className="italic">-it</span><span className="text-purple-600 dark:text-purple-400">.</span>
            </h3>
            <p className="text-sm text-black/60 dark:text-white/60 mt-2 max-w-xs">
              The intelligent knowledge management platform that transforms how you access your digital memories.
            </p>
            <p className="text-xs text-black/40 dark:text-white/40 mt-4">
              © {new Date().getFullYear()} Mind-It. All rights reserved.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-black dark:text-white mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="#features" 
                  className="text-black/70 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="text-black/70 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="text-black/70 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Integrations
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-black dark:text-white mb-3">Account</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/signin" 
                  className="text-black/70 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link 
                  href="/signup" 
                  className="text-black/70 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link 
                  href="#" 
                  className="text-black/70 dark:text-white/70 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

export { Preview } 
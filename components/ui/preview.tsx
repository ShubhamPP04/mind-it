"use client"

import { useEffect } from "react"
import { motion, stagger, useAnimate } from "framer-motion"
import { useRouter } from "next/navigation"

import Floating, { FloatingElement } from "@/components/ui/parallax-floating"
import { StarBorder } from "@/components/ui/star-border"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { BackgroundPaths } from "@/components/ui/background-paths"

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

const Preview = () => {
  const router = useRouter()
  const [scope, animate] = useAnimate()

  useEffect(() => {
    animate("img", { opacity: [0, 1] }, { duration: 0.5, delay: stagger(0.15) })
  }, [])

  return (
    <div
      className="relative w-full h-full min-h-screen bg-white dark:bg-black transition-colors duration-500"
      ref={scope}
    >
      <BackgroundPaths />
      
      <div className="relative z-10 w-full h-full min-h-screen flex items-center justify-center">
        <motion.div
          className="relative z-50 text-center items-center flex flex-col space-y-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.88, delay: 1.5 }}
        >
          <h1 className="text-5xl md:text-7xl text-black dark:text-white font-calendas italic">
            mind-it.
          </h1>
          <div className="relative z-50">
            <ShimmerButton 
              onClick={() => router.push("/signin")}
              className="cursor-pointer relative z-50"
              background="rgba(0, 0, 0, 0.9)"
              shimmerColor="rgba(255, 255, 255, 0.2)"
            >
              <span className="text-lg font-medium text-white">Go</span>
            </ShimmerButton>
          </div>
        </motion.div>

        <Floating sensitivity={-1} className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingElement depth={0.5} className="top-[8%] left-[11%]">
            <motion.img
              initial={{ opacity: 0 }}
              src={exampleImages[0].url}
              className="w-16 h-16 md:w-24 md:h-24 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
            />
          </FloatingElement>
          <FloatingElement depth={1} className="top-[10%] left-[32%]">
            <motion.img
              initial={{ opacity: 0 }}
              src={exampleImages[1].url}
              className="w-20 h-20 md:w-28 md:h-28 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
            />
          </FloatingElement>
          <FloatingElement depth={2} className="top-[2%] left-[53%]">
            <motion.img
              initial={{ opacity: 0 }}
              src={exampleImages[2].url}
              className="w-28 h-40 md:w-40 md:h-52 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
            />
          </FloatingElement>
          <FloatingElement depth={1} className="top-[0%] left-[83%]">
            <motion.img
              initial={{ opacity: 0 }}
              src={exampleImages[3].url}
              className="w-24 h-24 md:w-32 md:h-32 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
            />
          </FloatingElement>

          <FloatingElement depth={1} className="top-[40%] left-[2%]">
            <motion.img
              initial={{ opacity: 0 }}
              src={exampleImages[4].url}
              className="w-28 h-28 md:w-36 md:h-36 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
            />
          </FloatingElement>
          <FloatingElement depth={2} className="top-[70%] left-[77%]">
            <motion.img
              initial={{ opacity: 0 }}
              src={exampleImages[7].url}
              className="w-28 h-28 md:w-36 md:h-48 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
            />
          </FloatingElement>

          <FloatingElement depth={4} className="top-[73%] left-[15%]">
            <motion.img
              initial={{ opacity: 0 }}
              src={exampleImages[5].url}
              className="w-40 md:w-52 h-full object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
            />
          </FloatingElement>
          <FloatingElement depth={1} className="top-[80%] left-[50%]">
            <motion.img
              initial={{ opacity: 0 }}
              src={exampleImages[6].url}
              className="w-24 h-24 md:w-32 md:h-32 object-cover hover:scale-105 duration-200 cursor-pointer transition-transform"
            />
          </FloatingElement>
        </Floating>
      </div>
    </div>
  )
}

export { Preview } 
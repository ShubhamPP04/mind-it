"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative h-1 w-full grow overflow-hidden rounded-full",
          isDark ? "bg-white/10" : "bg-black/10"
        )}
      >
        <SliderPrimitive.Range
          className={cn(
            "absolute h-full",
            isDark ? "bg-white/40" : "bg-black/40"
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "block h-3 w-3 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
          isDark
            ? "bg-white border border-white/20 hover:bg-white/90"
            : "bg-black border border-black/20 hover:bg-black/90"
        )}
      />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

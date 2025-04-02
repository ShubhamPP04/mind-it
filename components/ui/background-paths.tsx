"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

// Enhanced FloatingPaths component with more dynamic animations
function FloatingPaths({ position }: { position: number }) {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDark = mounted && resolvedTheme === "dark";

    useEffect(() => {
        setMounted(true);
    }, []);

    const paths = Array.from({ length: 36 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        width: 0.8 + i * 0.03,
    }));

    // Don't render anything until mounted to prevent hydration mismatch
    if (!mounted) {
        return <div className="absolute inset-0 pointer-events-none" />;
    }

    return (
        <div className="absolute inset-0 pointer-events-none -z-20">
            <svg
                className={`w-full h-full ${isDark ? 'text-white/20' : 'text-black/10'}`}
                viewBox="0 0 696 316"
                fill="none"
                preserveAspectRatio="xMidYMid slice"
                suppressHydrationWarning
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: isDark ? [0.2, 0.4, 0.2] : [0.1, 0.2, 0.1],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 15 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}

// Floating particles component for additional visual interest
function FloatingParticles() {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDark = mounted && resolvedTheme === "dark";
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    if (!mounted) return null;
    
    // Generate random particles
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        animationClass: `animate-float-${(i % 5) + 1}`
    }));
    
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className={`absolute rounded-full ${particle.animationClass}`}
                    style={{
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        background: isDark 
                            ? `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`
                            : `rgba(0, 0, 0, ${0.05 + Math.random() * 0.1})`,
                        boxShadow: isDark
                            ? `0 0 ${particle.size * 2}px rgba(255, 255, 255, 0.2)`
                            : `0 0 ${particle.size * 2}px rgba(0, 0, 0, 0.1)`
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isDark ? 0.6 : 0.3 }}
                    transition={{ duration: 2 }}
                />
            ))}
        </div>
    );
}

// Gradient background orbs for a more vibrant look
function GradientOrbs() {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDark = mounted && resolvedTheme === "dark";
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    if (!mounted) return null;
    
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-30">
            {/* Top right orb */}
            <div 
                className="absolute -right-40 -top-40 w-96 h-96 rounded-full animate-pulse-slow animate-drift-1 opacity-40 blur-3xl"
                style={{
                    background: isDark 
                        ? 'radial-gradient(circle, rgba(138, 85, 255, 0.2) 0%, rgba(56, 19, 153, 0.05) 70%, rgba(0, 0, 0, 0) 100%)'
                        : 'radial-gradient(circle, rgba(138, 85, 255, 0.1) 0%, rgba(56, 19, 153, 0.03) 70%, rgba(255, 255, 255, 0) 100%)'
                }}
            />
            {/* Bottom left orb */}
            <div 
                className="absolute -left-20 bottom-0 w-80 h-80 rounded-full animate-pulse-slow animate-drift-2 opacity-40 blur-3xl"
                style={{
                    background: isDark 
                        ? 'radial-gradient(circle, rgba(80, 120, 255, 0.2) 0%, rgba(15, 43, 143, 0.05) 70%, rgba(0, 0, 0, 0) 100%)'
                        : 'radial-gradient(circle, rgba(80, 120, 255, 0.1) 0%, rgba(15, 43, 143, 0.03) 70%, rgba(255, 255, 255, 0) 100%)'
                }}
            />
        </div>
    );
}

export function BackgroundPaths({ className, isDark: propIsDark }: { className?: string, isDark?: boolean }) {
    return (
        <div className={className}>
            <GradientOrbs />
            <FloatingParticles />
            <FloatingPaths position={1} />
            <FloatingPaths position={2} />
        </div>
    );
} 
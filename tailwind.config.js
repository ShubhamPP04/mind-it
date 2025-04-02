// @ts-check
const defaultTheme = require("tailwindcss/defaultTheme")
const colors = require("tailwindcss/colors")
const { default: flattenColorPalette } = require("tailwindcss/lib/util/flattenColorPalette")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        calendas: ["Calendas", "serif"],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      keyframes: {
        tilt: {
          "0%, 50%, 100%": {
            transform: "rotate(0deg) scale(1)",
          },
          "25%": {
            transform: "rotate(0.5deg) scale(1.02)",
          },
          "75%": {
            transform: "rotate(-0.5deg) scale(0.98)",
          },
        },
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },
        meteors: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: 1 },
          "70%": { opacity: 1 },
          "100%": {
            transform: "rotate(215deg) translateX(-500px)",
            opacity: 0,
          },
        },
        // Animations for the orbs
        "drift-1": {
          "0%, 100%": { transform: "translate(0px, 0px)" },
          "25%": { transform: "translate(20px, 15px)" },
          "50%": { transform: "translate(-5px, 30px)" },
          "75%": { transform: "translate(-20px, 10px)" },
        },
        "drift-2": {
          "0%, 100%": { transform: "translate(0px, 0px)" },
          "25%": { transform: "translate(-15px, 20px)" },
          "50%": { transform: "translate(20px, 5px)" },
          "75%": { transform: "translate(5px, -15px)" },
        },
        "drift-3": {
          "0%, 100%": { transform: "translate(0px, 0px)" },
          "25%": { transform: "translate(10px, -20px)" },
          "50%": { transform: "translate(15px, 15px)" },
          "75%": { transform: "translate(-15px, 5px)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: 0.4, transform: "scale(1)" },
          "50%": { opacity: 0.7, transform: "scale(1.05)" },
        },
        // Animations for floating particles
        "float-1": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "25%": { transform: "translateY(-15px) translateX(10px)" },
          "50%": { transform: "translateY(-25px) translateX(-15px)" },
          "75%": { transform: "translateY(-10px) translateX(-10px)" },
        },
        "float-2": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "25%": { transform: "translateY(20px) translateX(-15px)" },
          "50%": { transform: "translateY(10px) translateX(10px)" },
          "75%": { transform: "translateY(-15px) translateX(15px)" },
        },
        "float-3": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "25%": { transform: "translateY(-25px) translateX(-10px)" },
          "50%": { transform: "translateY(15px) translateX(20px)" },
          "75%": { transform: "translateY(10px) translateX(-25px)" },
        },
        "float-4": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "25%": { transform: "translateY(15px) translateX(20px)" },
          "50%": { transform: "translateY(-20px) translateX(-10px)" },
          "75%": { transform: "translateY(-25px) translateX(5px)" },
        },
        "float-5": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "25%": { transform: "translateY(-10px) translateX(-20px)" },
          "50%": { transform: "translateY(20px) translateX(10px)" },
          "75%": { transform: "translateY(15px) translateX(-15px)" },
        },
      },
      animation: {
        tilt: "tilt 10s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        meteor: "meteors 5s linear infinite",
        // Animation definitions
        "drift-1": "drift-1 20s ease-in-out infinite",
        "drift-2": "drift-2 25s ease-in-out infinite",
        "drift-3": "drift-3 30s ease-in-out infinite",
        "pulse-slow": "pulse-slow 8s ease-in-out infinite",
        // Floating particles animations
        "float-1": "float-1 15s ease-in-out infinite",
        "float-2": "float-2 18s ease-in-out infinite",
        "float-3": "float-3 20s ease-in-out infinite",
        "float-4": "float-4 22s ease-in-out infinite",
        "float-5": "float-5 25s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

// This function adds CSS variables for each color in the Tailwind config
function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );
  
  addBase({
    ":root": newVars,
  });
} 
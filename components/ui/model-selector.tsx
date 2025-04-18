import { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { ChevronDown, Sparkles, Zap, Brain, Star, Bot, Cpu, Atom, Lightbulb, Settings } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

export type Model = {
  provider: 'gemini' | 'openrouter';
  name: string;
  displayName: string;
  description?: string;
};

const models: Model[] = [
  // Gemini models
  {
    provider: 'gemini',
    name: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    description: 'Latest multimodal model with next-gen features and improved capabilities'
  },
  // OpenRouter models
  {
    provider: 'openrouter',
    name: 'meta-llama/llama-4-scout:free',
    displayName: 'Llama 4 Scout',
    description: 'Smaller, faster Llama 4 model with excellent performance'
  },
  {
    provider: 'openrouter',
    name: 'meta-llama/llama-4-maverick:free',
    displayName: 'Llama 4 Maverick',
    description: 'High-performance open model with excellent reasoning capabilities'
  },
  {
    provider: 'openrouter',
    name: 'deepseek/deepseek-chat-v3-0324:free',
    displayName: 'DeepSeek V3 0324',
    description: '685B parameter MoE model with 131K context'
  },
  {
    provider: 'openrouter',
    name: 'mistralai/mistral-small-3.1-24b-instruct:free',
    displayName: 'Mistral Small 3.1 24B',
    description: '24B parameters with 128K context window'
  },
  {
    provider: 'openrouter',
    name: 'meta-llama/llama-3.3-70b-instruct:free',
    displayName: 'Llama 3.3 70B',
    description: 'Latest Llama model with 131K context'
  },
  {
    provider: 'openrouter',
    name: 'moonshotai/moonlight-16b-a3b-instruct:free',
    displayName: 'Moonlight 16B',
    description: 'Efficient 16B model with strong reasoning and instruction following'
  }
];

interface ModelSelectorProps {
  selectedModel: Model;
  onModelChange: (model: Model) => void;
  isDark?: boolean;
}

export function ModelSelector({ selectedModel, onModelChange, isDark, openRight = false }: ModelSelectorProps & { openRight?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Close dropdown when clicking outside
  useOnClickOutside(containerRef, () => setIsOpen(false));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-2 h-10 transition-all duration-200",
          isMobile
            ? "px-3 rounded-lg"
            : "px-4 rounded-lg min-w-[200px]",
          isDark
            ? "bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 border border-white/15 hover:border-white/25 text-white shadow-md hover:shadow-lg hover:from-zinc-800 hover:to-zinc-900"
            : "bg-gradient-to-br from-zinc-50/95 to-zinc-100/95 border border-black/15 hover:border-black/25 text-black shadow-md hover:shadow-lg hover:from-zinc-50 hover:to-zinc-100",
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center justify-center rounded-full", // Slightly larger icon container
            isMobile ? "w-5 h-5" : "w-6 h-6",
            selectedModel.provider === 'gemini'
              ? (isDark ? "bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/40 shadow-sm shadow-purple-500/20" : "bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 shadow-sm shadow-purple-500/10")
              : (isDark ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/40 shadow-sm shadow-blue-500/20" : "bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-sm shadow-blue-500/10")
          )}>
            {selectedModel.provider === 'gemini' ? <Sparkles className={cn(isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} /> : <Brain className={cn(isMobile ? "w-3 h-3" : "w-3.5 h-3.5")} />}
          </div>
          {isMobile ? (
            <span className="sr-only">{selectedModel.displayName}</span>
          ) : (
            <span className="truncate font-medium">{selectedModel.displayName}</span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
        >
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
            className={cn(
              "absolute mt-1.5 rounded-xl shadow-xl overflow-hidden z-50 backdrop-blur-sm", // Responsive dropdown
              isMobile
                ? "top-full right-0 w-[280px] max-w-[95vw]"
                : openRight
                  ? "top-full right-0 w-[320px]"
                  : "top-full left-0 w-[320px]",
              isDark
                ? "bg-black/95 border border-white/15 shadow-purple-500/10"
                : "bg-white/95 border border-black/15 shadow-purple-500/5"
            )}
          >
            <motion.div
              className="py-1"
              initial="closed"
              animate="open"
              variants={{
                open: {
                  transition: {
                    staggerChildren: 0.05
                  }
                },
                closed: {}
              }}
            >
              {/* Mobile header if on mobile */}
              {isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "px-4 py-3 text-sm font-medium border-b flex items-center justify-between",
                    isDark ? "text-white/90 border-white/15 bg-white/5" : "text-black/90 border-black/15 bg-black/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Select AI Model</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "p-1 rounded-md",
                      isDark ? "hover:bg-white/10" : "hover:bg-black/10"
                    )}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Gemini Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "px-4 py-2.5 text-xs font-medium border-b flex items-center gap-2", // More padding
                  isDark ? "text-white/80 border-white/15 bg-white/5" : "text-black/80 border-black/15 bg-black/5"
                )}
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30">
                  <Sparkles className="w-3 h-3" />
                </div>
                <span>Gemini Models</span>
              </motion.div>
              {models
                .filter(model => model.provider === 'gemini')
                .map((model) => (
                  <motion.button
                    key={`${model.provider}-${model.name}`}
                    variants={{
                      open: { opacity: 1, x: 0 },
                      closed: { opacity: 0, x: -20 }
                    }}
                    onClick={() => {
                      onModelChange(model);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left transition-all duration-200", // More vertical padding
                      isMobile ? "px-3 py-2" : "px-4 py-2.5",
                      isDark
                        ? "text-white hover:bg-white/10"
                        : "text-black hover:bg-black/10",
                      selectedModel.name === model.name && (
                        isDark
                          ? "bg-purple-500/20 border-l-2 border-l-purple-500"
                          : "bg-purple-500/10 border-l-2 border-l-purple-500"
                      )
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30">
                        <Sparkles className="w-2.5 h-2.5" />
                      </div>
                      <div className="font-medium">{model.displayName}</div>
                      {model.name.includes('gemini-2.0') && (
                        <div className="flex gap-1">
                          <span className={cn(
                            "px-1.5 py-0.5 text-[10px] rounded-full",
                            isDark ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                          )}>Latest</span>
                          <span className={cn(
                            "px-1.5 py-0.5 text-[10px] rounded-full",
                            isDark ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-green-500/10 text-green-600 border border-green-500/20"
                          )}>Default</span>
                        </div>
                      )}
                    </div>
                    {model.description && !isMobile && (
                      <div className={cn(
                        "text-xs mt-0.5 flex items-center gap-1",
                        isDark ? "text-white/60" : "text-black/60"
                      )}>
                        <Zap className="w-3 h-3 flex-shrink-0" />
                        {model.description}
                      </div>
                    )}
                  </motion.button>
                ))}

              {/* OpenRouter Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "px-4 py-2.5 text-xs font-medium border-b mt-1 flex items-center gap-2", // More padding
                  isDark ? "text-white/80 border-white/15 bg-white/5" : "text-black/80 border-black/15 bg-black/5"
                )}
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30">
                  <Brain className="w-3 h-3" />
                </div>
                <span>OpenRouter Models</span>
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 text-[10px] rounded-full",
                  isDark ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-green-500/10 text-green-600 border border-green-500/20"
                )}>Free</span>
              </motion.div>
              {models
                .filter(model => model.provider === 'openrouter')
                .map((model) => (
                  <motion.button
                    key={`${model.provider}-${model.name}`}
                    variants={{
                      open: { opacity: 1, x: 0 },
                      closed: { opacity: 0, x: -20 }
                    }}
                    onClick={() => {
                      onModelChange(model);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors duration-200",
                      isDark
                        ? "text-white hover:bg-white/10"
                        : "text-black hover:bg-black/10",
                      selectedModel.name === model.name && (
                        isDark
                          ? "bg-white/20"
                          : "bg-black/20"
                      )
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30">
                        {model.name.includes('gemini') ? <Sparkles className="w-2.5 h-2.5" /> :
                         model.name.includes('llama') ? <Cpu className="w-2.5 h-2.5" /> :
                         model.name.includes('mistral') ? <Atom className="w-2.5 h-2.5" /> :
                         model.name.includes('moonlight') ? <Lightbulb className="w-2.5 h-2.5" /> :
                         <Brain className="w-2.5 h-2.5" />}
                      </div>
                      <div className="font-medium">{model.displayName}</div>
                    </div>
                    {model.description && !isMobile && (
                      <div className={cn(
                        "text-xs mt-0.5 flex items-center gap-1",
                        isDark ? "text-white/60" : "text-black/60"
                      )}>
                        <Star className="w-3 h-3 flex-shrink-0" />
                        {model.description}
                      </div>
                    )}
                  </motion.button>
                ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
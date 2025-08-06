import { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { ChevronDown, Sparkles, Brain } from 'lucide-react';
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
    name: 'gemini-2.5-flash-preview-05-20',
    displayName: 'Gemini 2.5 Flash',
    description: 'Latest multimodal model with next-gen features and improved capabilities'
  },
  {
    provider: 'gemini',
    name: 'gemini-2.5-flash-lite',
    displayName: 'Gemini 2.5 Flash Lite',
    description: 'Plain text generation without formatting - optimized for clean, readable responses'
  },
  // OpenRouter models
  {
    provider: 'openrouter',
    name: 'z-ai/glm-4.5-air:free',
    displayName: 'GLM 4.5 Air',
    description: 'Z-AI GLM 4.5 Air model with free access'
  },
  {
    provider: 'openrouter',
    name: 'google/gemma-3n-e2b-it:free',
    displayName: 'Gemma 3N E2B IT',
    description: 'Google Gemma 3N model with enhanced capabilities'
  },
  {
    provider: 'openrouter',
    name: 'mistralai/mistral-small-3.2-24b-instruct:free',
    displayName: 'Mistral Small 3.2 24B',
    description: 'Mistral Small 3.2 24B parameter instruct model'
  },
  {
    provider: 'openrouter',
    name: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
    displayName: 'DeepSeek R1 Qwen3 8B',
    description: 'DeepSeek R1 model based on Qwen3 8B with enhanced reasoning'
  },
  {
    provider: 'openrouter',
    name: 'google/gemini-2.0-flash-exp:free',
    displayName: 'Gemini 2.0 Flash Exp',
    description: 'Google Gemini 2.0 Flash experimental model'
  },
  {
    provider: 'openrouter',
    name: 'mistralai/mistral-nemo:free',
    displayName: 'Mistral Nemo',
    description: 'Mistral Nemo model with free access'
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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "flex items-center justify-between gap-3 h-10 px-4 rounded-xl transition-all duration-200",
          isMobile ? "min-w-[120px]" : "min-w-[200px]",
          isDark
            ? "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 text-white"
            : "bg-white/80 border border-slate-200 hover:border-slate-300 text-slate-900"
        )}
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-5 h-5 rounded-md flex items-center justify-center",
            selectedModel.provider === 'gemini'
              ? "bg-purple-500/20 text-purple-400"
              : "bg-blue-500/20 text-blue-400"
          )}>
            {selectedModel.provider === 'gemini' ? (
              <Sparkles className="w-3 h-3" />
            ) : (
              <Brain className="w-3 h-3" />
            )}
          </div>
          
          <span className="font-medium text-sm">{selectedModel.displayName}</span>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute mt-2 rounded-lg overflow-hidden z-50 shadow-lg",
              isMobile
                ? "top-full right-0 w-[280px] max-h-[60vh]"
                : openRight
                  ? "top-full right-0 w-[320px] max-h-[70vh]"
                  : "top-full left-0 w-[320px] max-h-[70vh]",
              isDark
                ? "bg-slate-800 border border-slate-700"
                : "bg-white border border-slate-200"
            )}
          >
            <div className="py-1 overflow-y-auto">
              {/* Mobile header */}
              {isMobile && (
                <div className={cn(
                  "px-4 py-3 text-sm font-medium border-b flex items-center justify-between",
                  isDark ? "text-white border-slate-700" : "text-slate-900 border-slate-200"
                )}>
                  <span>Select Model</span>
                  <button onClick={() => setIsOpen(false)}>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Gemini Section */}
              <div className={cn(
                "px-4 py-2 text-xs font-medium border-b",
                isDark ? "text-slate-400 border-slate-700" : "text-slate-600 border-slate-200"
              )}>
                Gemini
              </div>
              {models
                .filter(model => model.provider === 'gemini')
                .map((model) => (
                  <button
                    key={`${model.provider}-${model.name}`}
                    onClick={() => {
                      onModelChange(model);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-100/50",
                      isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-100/50",
                      selectedModel.name === model.name && (
                        isDark ? "bg-slate-700" : "bg-slate-100"
                      )
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="font-medium">{model.displayName}</span>
                      {model.name.includes('gemini-2.5-flash-preview') && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-400">
                          Latest
                        </span>
                      )}
                    </div>
                  </button>
                ))}

              {/* OpenRouter Section */}
              <div className={cn(
                "px-4 py-2 text-xs font-medium border-b border-t",
                isDark ? "text-slate-400 border-slate-700" : "text-slate-600 border-slate-200"
              )}>
                OpenRouter
              </div>
              {models
                .filter(model => model.provider === 'openrouter')
                .map((model) => (
                  <button
                    key={`${model.provider}-${model.name}`}
                    onClick={() => {
                      onModelChange(model);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors",
                      isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-100/50",
                      selectedModel.name === model.name && (
                        isDark ? "bg-slate-700" : "bg-slate-100"
                      )
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-400" />
                      <span className="font-medium">{model.displayName}</span>
                    </div>
                  </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
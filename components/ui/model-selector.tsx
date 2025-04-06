import { useState } from 'react';
import { cn } from "@/lib/utils";
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

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
    name: 'meta-llama/llama-4-maverick:free',
    displayName: 'Llama 4 Maverick',
    description: 'High-performance open model with excellent reasoning capabilities'
  },
  {
    provider: 'openrouter',
    name: 'openrouter/quasar-alpha',
    displayName: 'Quasar Alpha',
    description: 'Newest experimental model with superior multimodal capabilities'
  },
  {
    provider: 'openrouter',
    name: 'google/gemini-pro:free',
    displayName: 'Gemini Pro',
    description: 'Most powerful Gemini model with 2M token context window'
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
  }
];

interface ModelSelectorProps {
  selectedModel: Model;
  onModelChange: (model: Model) => void;
  isDark?: boolean;
}

export function ModelSelector({ selectedModel, onModelChange, isDark }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-2 h-10 px-4 rounded-lg text-sm transition-all duration-200 min-w-[200px]",
          isDark
            ? "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
            : "bg-black/5 border border-black/10 hover:bg-black/10 text-black",
        )}
      >
        <span className="truncate">{selectedModel.displayName}</span>
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
            transition={{ duration: 0.15, type: "spring", stiffness: 200 }}
            className={cn(
              "absolute top-full left-0 mt-1 w-[300px] rounded-lg shadow-lg overflow-hidden z-50",
              isDark
                ? "bg-black/90 border border-white/10"
                : "bg-white/90 border border-black/10"
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
              {/* Gemini Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "px-3 py-2 text-xs font-medium border-b",
                  isDark ? "text-white/50 border-white/10" : "text-black/50 border-black/10"
                )}
              >
                Gemini
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
                    <div className="font-medium">{model.displayName}</div>
                    {model.description && (
                      <div className={cn(
                        "text-xs mt-0.5",
                        isDark ? "text-white/60" : "text-black/60"
                      )}>
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
                  "px-3 py-2 text-xs font-medium border-b mt-1",
                  isDark ? "text-white/50 border-white/10" : "text-black/50 border-black/10"
                )}
              >
                OpenRouter (Free)
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
                    <div className="font-medium">{model.displayName}</div>
                    {model.description && (
                      <div className={cn(
                        "text-xs mt-0.5",
                        isDark ? "text-white/60" : "text-black/60"
                      )}>
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
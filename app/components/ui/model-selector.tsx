import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

export type Model = {
  provider: string
  name: string
  displayName: string
}

interface ModelSelectorProps {
  selectedModel: Model
  onModelChange: (model: Model) => void
  isDark?: boolean
}

const models: Model[] = [
  // Gemini models
  {
    provider: 'gemini',
    name: 'gemini-2.5-flash-preview-05-20',
    displayName: 'Gemini 2.5 Flash'
  },
  // OpenRouter models
  {
    provider: 'openrouter',
    name: 'openai/gpt-oss-20b:free',
    displayName: 'GPT-OSS 20B'
  },
  {
    provider: 'openrouter',
    name: 'openrouter/optimus-alpha',
    displayName: 'Optimus Alpha'
  },
  {
    provider: 'openrouter',
    name: 'google/gemini-2.5-pro-exp-03-25:free',
    displayName: 'Gemini 2.5 Pro Exp'
  },
  {
    provider: 'openrouter',
    name: 'meta-llama/llama-4-scout:free',
    displayName: 'Llama 4 Scout'
  },
  {
    provider: 'openai',
    name: 'openai/gpt-3.5-turbo',
    displayName: 'GPT-3.5'
  },
  {
    provider: 'openrouter',
    name: 'moonshotai/moonlight-16b-a3b-instruct:free',
    displayName: 'Moonlight 16B'
  }
]

export function ModelSelector({ selectedModel, onModelChange, isDark = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm",
          isDark
            ? "border-white/10 hover:border-white/20 text-white/80"
            : "border-black/10 hover:border-black/20 text-black/80"
        )}
      >
        <span className="hidden sm:inline">Model:</span>
        <span className="font-medium">{selectedModel.displayName}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className={cn(
            "absolute left-0 right-0 sm:right-auto mt-1 p-1 rounded-lg border shadow-lg z-40",
            isDark
              ? "bg-black border-white/10"
              : "bg-white border-black/10"
          )}>
            {models.map((model) => (
              <button
                key={model.name}
                onClick={() => {
                  onModelChange(model)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full px-3 py-2 text-left rounded-md text-sm transition-colors",
                  isDark
                    ? "hover:bg-white/5 text-white/80"
                    : "hover:bg-black/5 text-black/80",
                  selectedModel.name === model.name && (
                    isDark ? "bg-white/10" : "bg-black/10"
                  )
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{model.displayName}</span>
                  {model.name === 'openai/gpt-oss-20b:free' && (
                    <span className={cn(
                      "px-1.5 py-0.5 text-[10px] rounded-full ml-2",
                      isDark ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-green-500/10 text-green-600 border border-green-500/20"
                    )}>Default</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
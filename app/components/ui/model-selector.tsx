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
  {
    provider: 'gemini',
    name: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0'
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
                {model.displayName}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
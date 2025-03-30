'use client'

import React, { useState } from 'react'
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Book, Plus, X, Edit2, Trash2, Bookmark, Briefcase, Code, FileText, Folder, Heart, Home, Inbox, Lightbulb, List, Music, Newspaper, Notebook, Pencil, Rocket, School, Settings, Shapes, Star, Sticker, Target, Terminal, Trophy, Check } from 'lucide-react'
import { AVAILABLE_ICONS } from '@/lib/constants'

interface Space {
  id: string
  name: string
  color: string
  icon: string
  user_id: string
}

interface SpacesSidebarProps {
  spaces: Space[]
  selectedSpace: Space | null
  onSpaceSelect: (space: Space | null) => void
  onCreateSpace: (name: string, icon: string) => void
  onEditSpace: (spaceId: string, newName: string, newIcon?: string) => void
  onDeleteSpace: (spaceId: string) => void
  isDark?: boolean
  className?: string
  isOpen?: boolean
}

export function SpacesSidebar({
  spaces,
  selectedSpace,
  onSpaceSelect,
  onCreateSpace,
  onEditSpace,
  onDeleteSpace,
  isDark = false,
  className,
  isOpen = false
}: SpacesSidebarProps) {
  const [showNewSpace, setShowNewSpace] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('book')
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const handleCreateSpace = () => {
    if (newSpaceName.trim()) {
      onCreateSpace(newSpaceName.trim(), selectedIcon)
      setNewSpaceName('')
      setSelectedIcon('book')
      setShowNewSpace(false)
    }
  }

  const handleEditSpace = () => {
    if (editingSpace && editingSpace.name.trim()) {
      onEditSpace(editingSpace.id, editingSpace.name, editingSpace.icon)
      setEditingSpace(null)
      setShowIconPicker(false)
    }
  }

  const iconMap = {
    book: Book,
    bookmark: Bookmark,
    briefcase: Briefcase,
    code: Code,
    'file-text': FileText,
    folder: Folder,
    heart: Heart,
    home: Home,
    inbox: Inbox,
    lightbulb: Lightbulb,
    list: List,
    music: Music,
    newspaper: Newspaper,
    notebook: Notebook,
    pencil: Pencil,
    rocket: Rocket,
    school: School,
    settings: Settings,
    shapes: Shapes,
    star: Star,
    sticker: Sticker,
    target: Target,
    terminal: Terminal,
    trophy: Trophy
  }

  const IconComponent = (iconName: string) => {
    const Icon = iconMap[iconName as keyof typeof iconMap] || Book
    return <Icon className="w-4 h-4" />
  }

  return (
    <motion.div
      initial={{ width: "0px" }}
      animate={{ width: isOpen ? "240px" : "0px" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "h-[calc(100vh-3.5rem)] mt-14 overflow-hidden border-r relative z-30",
        isDark 
          ? "bg-black/40 border-white/10 backdrop-blur-md" 
          : "bg-white/40 border-zinc-200/30 backdrop-blur-md",
        className
      )}
    >
      <div className="p-2 flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className={cn(
              "text-sm font-medium",
              isDark ? "text-white/70" : "text-zinc-600"
            )}>
              Spaces
            </h2>
            <span className={cn(
              "text-xs",
              isDark ? "text-white/40" : "text-black/40"
            )}>
              {spaces.length}
            </span>
          </div>
          <button
            onClick={() => {
              setShowNewSpace(true)
              setEditingSpace(null)
            }}
            className={cn(
              "p-1 rounded-md transition-colors",
              isDark 
                ? "text-white/60 hover:bg-white/10" 
                : "text-black/60 hover:bg-black/10"
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showNewSpace && (
          <div className={cn(
            "mb-2 p-1.5 rounded-md border",
            isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
          )}>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className={cn(
                  "shrink-0 p-1 rounded-md transition-colors",
                  isDark 
                    ? "text-white/60 hover:bg-white/10" 
                    : "text-black/60 hover:bg-black/10"
                )}
              >
                {IconComponent(selectedIcon)}
              </button>
              <input
                type="text"
                placeholder="New space"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSpaceName.trim()) {
                    handleCreateSpace()
                  }
                }}
                className={cn(
                  "min-w-0 flex-1 px-2 py-1 rounded-md border bg-transparent text-sm",
                  isDark 
                    ? "border-white/10 text-white placeholder:text-white/30" 
                    : "border-black/10 text-black placeholder:text-black/30"
                )}
                autoFocus
              />
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={handleCreateSpace}
                  disabled={!newSpaceName.trim()}
                  className={cn(
                    "p-1 rounded-md transition-colors",
                    isDark 
                      ? newSpaceName.trim() 
                        ? "text-white/60 hover:bg-white/10" 
                        : "text-white/20"
                      : newSpaceName.trim()
                        ? "text-black/60 hover:bg-black/10"
                        : "text-black/20"
                  )}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowNewSpace(false)
                    setNewSpaceName('')
                  }}
                  className={cn(
                    "p-1 rounded-md transition-colors",
                    isDark ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {showIconPicker && (
              <div className={cn(
                "mt-1.5 p-1.5 rounded-md border grid grid-cols-6 gap-1",
                isDark 
                  ? "bg-black/20 border-white/10" 
                  : "bg-white/20 border-black/10"
              )}>
                {AVAILABLE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => {
                      setSelectedIcon(icon)
                      setShowIconPicker(false)
                    }}
                    className={cn(
                      "p-1.5 rounded-md transition-colors",
                      isDark 
                        ? "hover:bg-white/10 text-white/60" 
                        : "hover:bg-black/10 text-black/60",
                      selectedIcon === icon && (isDark ? "bg-white/20" : "bg-black/20")
                    )}
                  >
                    {IconComponent(icon)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 space-y-0.5 overflow-auto">
          {spaces.map((space) => (
            <div key={space.id} className="group">
              {editingSpace?.id === space.id ? (
                <div className={cn(
                  "flex items-center gap-1.5 p-1.5 rounded-md",
                  isDark 
                    ? "bg-white/5" 
                    : "bg-black/5"
                )}>
                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className={cn(
                      "shrink-0 p-1 rounded-md transition-colors",
                      isDark 
                        ? "text-white/60 hover:bg-white/10" 
                        : "text-black/60 hover:bg-black/10"
                    )}
                  >
                    {IconComponent(editingSpace.icon)}
                  </button>
                  <input
                    type="text"
                    value={editingSpace.name}
                    onChange={(e) => setEditingSpace({ ...editingSpace, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && editingSpace.name.trim()) {
                        handleEditSpace()
                      }
                    }}
                    className={cn(
                      "min-w-0 flex-1 px-2 py-1 rounded-md border bg-transparent text-sm",
                      isDark 
                        ? "border-white/10 text-white" 
                        : "border-black/10 text-black"
                    )}
                    autoFocus
                  />
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={handleEditSpace}
                      disabled={!editingSpace.name.trim()}
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        isDark 
                          ? editingSpace.name.trim() 
                            ? "text-white/60 hover:bg-white/10" 
                            : "text-white/20"
                          : editingSpace.name.trim()
                            ? "text-black/60 hover:bg-black/10"
                            : "text-black/20"
                      )}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSpace(null)
                        setShowIconPicker(false)
                      }}
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        isDark ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60"
                      )}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onSpaceSelect(space)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                    selectedSpace?.id === space.id
                      ? isDark
                        ? "bg-white/10 text-white"
                        : "bg-black/10 text-black"
                      : isDark
                        ? "text-white/70 hover:bg-white/5"
                        : "text-black/70 hover:bg-black/5"
                  )}
                >
                  <div 
                    className={cn(
                      "p-1 rounded-md transition-colors",
                      selectedSpace?.id === space.id
                        ? isDark
                          ? "text-white"
                          : "text-black"
                        : isDark
                          ? "text-white/60"
                          : "text-black/60"
                    )}
                  >
                    {IconComponent(space.icon)}
                  </div>
                  <span className="truncate flex-1 text-left">{space.name}</span>
                  <div className={cn(
                    "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                    isDark ? "text-white/40" : "text-black/40"
                  )}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingSpace(space)
                      }}
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        isDark 
                          ? "hover:bg-white/10 hover:text-white" 
                          : "hover:bg-black/10 hover:text-black"
                      )}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSpace(space.id)
                      }}
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        isDark 
                          ? "hover:bg-white/10 hover:text-white" 
                          : "hover:bg-black/10 hover:text-black"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </button>
              )}
              {showIconPicker && editingSpace?.id === space.id && (
                <div className={cn(
                  "mt-1 mx-2 p-1.5 rounded-md border grid grid-cols-6 gap-1",
                  isDark 
                    ? "bg-black/20 border-white/10" 
                    : "bg-white/20 border-black/10"
                )}>
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => {
                        setEditingSpace({ ...editingSpace, icon })
                        setShowIconPicker(false)
                      }}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        isDark 
                          ? "hover:bg-white/10 text-white/60" 
                          : "hover:bg-black/10 text-black/60",
                        editingSpace.icon === icon && (isDark ? "bg-white/20" : "bg-black/20")
                      )}
                    >
                      {IconComponent(icon)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
} 
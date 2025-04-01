"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, Reorder, useDragControls } from 'framer-motion'
import { Edit2, PlusCircle, Trash2, GripVertical, GripHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AVAILABLE_ICONS } from '@/lib/icons'
import type { Space } from '@/lib/types'

export function SpacesSidebar({
  spaces,
  selectedSpace,
  onSpaceSelect,
  onCreateSpace,
  onEditSpace,
  onDeleteSpace,
  isDark,
  isOpen
}: {
  spaces: Space[]
  selectedSpace: Space | null
  onSpaceSelect: (space: Space | null) => void
  onCreateSpace: (name: string, icon: string) => void
  onEditSpace: (spaceId: string, name: string, icon?: string) => void
  onDeleteSpace: (spaceId: string) => void
  isDark: boolean
  isOpen: boolean
}) {
  const [isCreating, setIsCreating] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('hash')
  const [editingSpace, setEditingSpace] = useState<Space | null>(null)
  const [editedName, setEditedName] = useState('')
  const [editedIcon, setEditedIcon] = useState('')
  const [mounted, setMounted] = useState(false)
  const width = useMotionValue(240)
  const [isDragging, setIsDragging] = useState(false)
  const [orderedSpaces, setOrderedSpaces] = useState(spaces)
  const [draggedSpace, setDraggedSpace] = useState<string | null>(null)

  // Handle initial mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setOrderedSpaces(spaces)
  }, [spaces])

  const handleDragStart = (spaceId: string) => {
    setDraggedSpace(spaceId)
  }

  const handleDragEnd = () => {
    setDraggedSpace(null)
  }

  const handleSpaceClick = (space: Space) => {
    onSpaceSelect(space)
  }

  const handleEditClick = (e: React.MouseEvent, space: Space) => {
    e.stopPropagation()
    setEditingSpace(space)
    setEditedName(space.name)
    setEditedIcon(space.icon)
  }

  const handleDeleteClick = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this space?')) {
      onDeleteSpace(spaceId)
    }
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: isOpen ? width.get() : "0px" }}
      style={{ width: isOpen ? width : "0px" }}
      transition={{ duration: 0.2 }}
      className={cn(
        "h-screen border-r overflow-hidden flex flex-col relative z-[100]",
        isDark ? "border-white/10" : "border-black/5",
        !mounted && isOpen && "w-[240px]" // Prevent initial animation flash
      )}
    >
      {/* Drag Handle */}
      {isOpen && (
        <div
          onMouseDown={() => {}}
          onTouchStart={() => {}}
          className={cn(
            "absolute right-0 top-0 w-4 h-full cursor-col-resize hover:bg-gradient-to-r",
            isDark 
              ? "from-transparent via-white/5 to-white/10" 
              : "from-transparent via-black/5 to-black/10",
            isDragging && (isDark ? "bg-white/10" : "bg-black/10")
          )}
          style={{ touchAction: 'none' }}
        >
          <div className={cn(
            "absolute top-1/2 -translate-y-1/2 right-0 w-4 flex items-center justify-center",
            "opacity-0 hover:opacity-100 transition-opacity",
            isDragging && "opacity-100"
          )}>
            <GripVertical className={cn(
              "w-4 h-4",
              isDark ? "text-white/40" : "text-black/40"
            )} />
          </div>
        </div>
      )}

      {/* Spaces List */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 flex flex-col gap-1">
          <Reorder.Group 
            axis="y" 
            values={orderedSpaces} 
            onReorder={setOrderedSpaces}
            className="flex-1 space-y-1 list-none"
          >
            {orderedSpaces.map((space) => (
              <Reorder.Item
                key={space.id}
                value={space}
                dragListener={false}
                dragControls={useDragControls()}
                onDragStart={() => handleDragStart(space.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-1 rounded-md transition-colors",
                  isDark 
                    ? selectedSpace?.id === space.id
                      ? "bg-white/10 text-white"
                      : "hover:bg-white/5 text-white/60"
                    : selectedSpace?.id === space.id
                      ? "bg-black/10 text-black"
                      : "hover:bg-black/5 text-black/60",
                  draggedSpace === space.id && (
                    isDark ? "bg-white/20" : "bg-black/20"
                  )
                )}
              >
                <div 
                  className="flex-1 flex items-center gap-1 group"
                >
                  <div 
                    onClick={() => handleSpaceClick(space)}
                    className="flex-1 flex items-center gap-2 px-2 py-1.5 text-sm transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-center w-4 h-4">
                      {AVAILABLE_ICONS[space.icon]?.({
                        className: cn(
                          "w-4 h-4",
                          isDark 
                            ? selectedSpace?.id === space.id
                              ? "text-white"
                              : "text-white/60"
                            : selectedSpace?.id === space.id
                              ? "text-black"
                              : "text-black/60"
                        )
                      })}
                    </div>
                    <span className="truncate">{space.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 pr-2">
                    <motion.div
                      className={cn(
                        "p-1 rounded-md transition-colors cursor-grab active:cursor-grabbing touch-none",
                        isDark 
                          ? "hover:bg-white/10 hover:text-white" 
                          : "hover:bg-black/10 hover:text-black"
                      )}
                      onPointerDown={(e) => {
                        e.preventDefault()
                        handleDragStart(space.id)
                      }}
                    >
                      <GripHorizontal className="w-3 h-3" />
                    </motion.div>
                    <div
                      onClick={(e) => handleEditClick(e, space)}
                      className={cn(
                        "p-1 rounded-md transition-colors cursor-pointer",
                        isDark 
                          ? "hover:bg-white/10 hover:text-white" 
                          : "hover:bg-black/10 hover:text-black"
                      )}
                    >
                      <span className="sr-only">Edit {space.name}</span>
                      <Edit2 className="w-3 h-3" />
                    </div>
                    <div
                      onClick={(e) => handleDeleteClick(e, space.id)}
                      className={cn(
                        "p-1 rounded-md transition-colors cursor-pointer",
                        isDark 
                          ? "hover:bg-white/10 hover:text-white" 
                          : "hover:bg-black/10 hover:text-black"
                      )}
                    >
                      <span className="sr-only">Delete {space.name}</span>
                      <Trash2 className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </nav>
      </div>

      {/* New Space Button */}
      <div className="p-2 border-t" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}>
        <button
          type="button"
          onClick={() => {
            setIsCreating(true)
            setNewSpaceName('')
            setSelectedIcon('hash')
          }}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
            isDark 
              ? "hover:bg-white/5 text-white/60" 
              : "hover:bg-black/5 text-black/60"
          )}
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Space</span>
        </button>
      </div>

      {/* Create Space Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsCreating(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={cn(
                "relative w-full max-w-sm rounded-xl p-6 shadow-2xl",
                isDark 
                  ? "bg-black/80 border border-white/10" 
                  : "bg-white/90 border border-black/5"
              )}
            >
              <h2 className={cn(
                "text-xl font-semibold mb-4",
                isDark ? "text-white/90" : "text-black/90"
              )}>
                Create New Space
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isDark ? "text-white/60" : "text-black/60"
                  )}>
                    Space Name
                  </label>
                  <input
                    type="text"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    placeholder="Enter space name"
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      isDark 
                        ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                        : "bg-black/5 border-black/10 text-black placeholder:text-black/30"
                    )}
                  />
                </div>
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isDark ? "text-white/60" : "text-black/60"
                  )}>
                    Icon
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {Object.entries(AVAILABLE_ICONS).map(([key, Icon]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedIcon(key)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isDark
                            ? selectedIcon === key
                              ? "bg-white/20 text-white"
                              : "hover:bg-white/10 text-white/60"
                            : selectedIcon === key
                              ? "bg-black/20 text-black"
                              : "hover:bg-black/10 text-black/60"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className={cn(
                      "px-4 py-2 rounded-lg",
                      isDark 
                        ? "text-white/60 hover:text-white/90" 
                        : "text-black/60 hover:text-black/90"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (newSpaceName.trim()) {
                        onCreateSpace(newSpaceName.trim(), selectedIcon)
                        setIsCreating(false)
                      }
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg",
                      isDark
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-black/10 text-black hover:bg-black/20"
                    )}
                  >
                    Create Space
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Space Modal */}
      <AnimatePresence>
        {editingSpace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditingSpace(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={cn(
                "relative w-full max-w-sm rounded-xl p-6 shadow-2xl",
                isDark 
                  ? "bg-black/80 border border-white/10" 
                  : "bg-white/90 border border-black/5"
              )}
            >
              <h2 className={cn(
                "text-xl font-semibold mb-4",
                isDark ? "text-white/90" : "text-black/90"
              )}>
                Edit Space
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isDark ? "text-white/60" : "text-black/60"
                  )}>
                    Space Name
                  </label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter space name"
                    className={cn(
                      "w-full px-3 py-2 rounded-lg border",
                      isDark 
                        ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" 
                        : "bg-black/5 border-black/10 text-black placeholder:text-black/30"
                    )}
                  />
                </div>
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isDark ? "text-white/60" : "text-black/60"
                  )}>
                    Icon
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {Object.entries(AVAILABLE_ICONS).map(([key, Icon]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditedIcon(key)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isDark
                            ? editedIcon === key
                              ? "bg-white/20 text-white"
                              : "hover:bg-white/10 text-white/60"
                            : editedIcon === key
                              ? "bg-black/20 text-black"
                              : "hover:bg-black/10 text-black/60"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingSpace(null)}
                    className={cn(
                      "px-4 py-2 rounded-lg",
                      isDark 
                        ? "text-white/60 hover:text-white/90" 
                        : "text-black/60 hover:text-black/90"
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editedName.trim()) {
                        onEditSpace(editingSpace.id, editedName.trim(), editedIcon)
                        setEditingSpace(null)
                      }
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg",
                      isDark
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-black/10 text-black hover:bg-black/20"
                    )}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 
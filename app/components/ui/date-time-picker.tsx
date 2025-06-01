'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Calendar, Clock, ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronUp, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  isDark?: boolean
}

export function DateTimePicker({ value, onChange, isDark = false }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState<Date>(() => value ? new Date(value) : new Date())
  const [view, setView] = useState<'date' | 'time'>('date')
  const [isUpdating, setIsUpdating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInternalChangeRef = useRef(false)

  // Update the date state when the value prop changes (only for external changes)
  useEffect(() => {
    if (value && !isInternalChangeRef.current) {
      const newDate = new Date(value)
      // Only update if the date is actually different to avoid infinite loops
      const timeDiff = Math.abs(newDate.getTime() - date.getTime())
      if (timeDiff > 100) { // 100ms tolerance to avoid micro-differences
        console.log('External value prop changed:', value, 'Setting internal date to:', newDate.toLocaleString())
        setDate(newDate)
      }
    }
    // Reset the flag after processing
    isInternalChangeRef.current = false
  }, [value, date])

  // Close the picker when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Format date for the input value
  const formatDateForInput = useCallback((date: Date) => {
    return date.toISOString().slice(0, 16)
  }, [])

  // Format date for display
  const formatDateForDisplay = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }, [])

  // Handle date change with improved state management
  const handleDateChange = useCallback((newDate: Date) => {
    // Mark this as an internal change to prevent useEffect from overriding it
    isInternalChangeRef.current = true

    // Show updating state
    setIsUpdating(true)

    // Create a new Date object to ensure state updates properly
    const updatedDate = new Date(newDate.getTime())

    // Update the local state
    setDate(updatedDate)

    // Call the onChange callback with the formatted date
    onChange(formatDateForInput(updatedDate))

    // Log for debugging
    console.log('Internal date change:', updatedDate.toLocaleString(), 'Hours:', updatedDate.getHours(), 'Minutes:', updatedDate.getMinutes())

    // Clear updating state after a brief delay
    setTimeout(() => setIsUpdating(false), 200)
  }, [onChange, formatDateForInput])

  // Calendar utility functions
  const getDaysInMonth = useCallback((year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }, [])

  const getFirstDayOfMonth = useCallback((year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }, [])

  const generateCalendarDays = useCallback(() => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }, [date, getDaysInMonth, getFirstDayOfMonth])

  // Handle month navigation
  const handlePrevMonth = useCallback(() => {
    const newDate = new Date(date.getTime())
    newDate.setMonth(newDate.getMonth() - 1)
    handleDateChange(newDate)
  }, [date, handleDateChange])

  const handleNextMonth = useCallback(() => {
    const newDate = new Date(date.getTime())
    newDate.setMonth(newDate.getMonth() + 1)
    handleDateChange(newDate)
  }, [date, handleDateChange])

  // Handle day selection
  const handleDaySelect = useCallback((day: number) => {
    const newDate = new Date(date.getTime())
    newDate.setDate(day)
    handleDateChange(newDate)
    setView('time')
  }, [date, handleDateChange])

  // Improved time handling functions with precise increment/decrement
  const incrementHour = useCallback(() => {
    // Mark as internal change first
    isInternalChangeRef.current = true

    const newDate = new Date(date.getTime())
    const currentHour = newDate.getHours()
    const newHour = (currentHour + 1) % 24

    newDate.setHours(newHour, newDate.getMinutes(), 0, 0) // Reset seconds and milliseconds
    console.log('Hour incremented:', currentHour, '→', newHour, 'Full time:', newDate.toLocaleTimeString())
    handleDateChange(newDate)
  }, [date, handleDateChange])

  const decrementHour = useCallback(() => {
    // Mark as internal change first
    isInternalChangeRef.current = true

    const newDate = new Date(date.getTime())
    const currentHour = newDate.getHours()
    const newHour = (currentHour - 1 + 24) % 24

    newDate.setHours(newHour, newDate.getMinutes(), 0, 0) // Reset seconds and milliseconds
    console.log('Hour decremented:', currentHour, '→', newHour, 'Full time:', newDate.toLocaleTimeString())
    handleDateChange(newDate)
  }, [date, handleDateChange])

  const incrementMinute = useCallback(() => {
    // Mark as internal change first
    isInternalChangeRef.current = true

    const newDate = new Date(date.getTime())
    const currentMinute = newDate.getMinutes()
    const newMinute = (currentMinute + 1) % 60

    newDate.setMinutes(newMinute, 0, 0) // Reset seconds and milliseconds
    console.log('Minute incremented:', currentMinute, '→', newMinute, 'Full time:', newDate.toLocaleTimeString())
    handleDateChange(newDate)
  }, [date, handleDateChange])

  const decrementMinute = useCallback(() => {
    // Mark as internal change first
    isInternalChangeRef.current = true

    const newDate = new Date(date.getTime())
    const currentMinute = newDate.getMinutes()
    const newMinute = (currentMinute - 1 + 60) % 60

    newDate.setMinutes(newMinute, 0, 0) // Reset seconds and milliseconds
    console.log('Minute decremented:', currentMinute, '→', newMinute, 'Full time:', newDate.toLocaleTimeString())
    handleDateChange(newDate)
  }, [date, handleDateChange])

  // AM/PM toggle functions
  const toggleToAM = useCallback(() => {
    // Mark as internal change first
    isInternalChangeRef.current = true

    const newDate = new Date(date.getTime())
    const currentHour = newDate.getHours()

    if (currentHour >= 12) {
      const newHour = currentHour - 12
      newDate.setHours(newHour, newDate.getMinutes(), 0, 0) // Reset seconds and milliseconds
      console.log('Switched to AM:', currentHour, '→', newHour, 'Full time:', newDate.toLocaleTimeString())
      handleDateChange(newDate)
    }
  }, [date, handleDateChange])

  const toggleToPM = useCallback(() => {
    // Mark as internal change first
    isInternalChangeRef.current = true

    const newDate = new Date(date.getTime())
    const currentHour = newDate.getHours()

    if (currentHour < 12) {
      const newHour = currentHour + 12
      newDate.setHours(newHour, newDate.getMinutes(), 0, 0) // Reset seconds and milliseconds
      console.log('Switched to PM:', currentHour, '→', newHour, 'Full time:', newDate.toLocaleTimeString())
      handleDateChange(newDate)
    }
  }, [date, handleDateChange])

  // Quick date selections
  const setToTomorrow = useCallback(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    handleDateChange(tomorrow)
    setIsOpen(false)
  }, [handleDateChange])

  const setToNextWeek = useCallback(() => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setHours(9, 0, 0, 0)
    handleDateChange(nextWeek)
    setIsOpen(false)
  }, [handleDateChange])

  // Helper function to get 12-hour format display
  const getDisplayHour = useCallback(() => {
    const hour24 = date.getHours()
    const hour12 = hour24 % 12 || 12
    return hour12.toString().padStart(2, '0')
  }, [date])

  // Helper function to get AM/PM
  const getAmPm = useCallback(() => {
    return date.getHours() >= 12 ? 'PM' : 'AM'
  }, [date])

  // Helper function to get formatted minutes
  const getDisplayMinutes = useCallback(() => {
    return date.getMinutes().toString().padStart(2, '0')
  }, [date])

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={cn(
          "relative rounded-lg border overflow-hidden transition-colors cursor-pointer",
          isDark
            ? "border-white/10 hover:border-white/20"
            : "border-black/10 hover:border-black/20"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none",
          isDark ? "text-white/50" : "text-black/50"
        )}>
          <CalendarIcon className="w-4 h-4" />
        </div>

        <div className={cn(
          "w-full pl-10 pr-3 py-2.5 bg-transparent outline-none transition-colors",
          isDark
            ? "text-white"
            : "text-black"
        )}>
          {formatDateForDisplay(date)}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute z-50 mt-1 p-3 rounded-lg border shadow-lg w-64",
              isDark
                ? "bg-black border-white/10 shadow-black/50"
                : "bg-white border-black/10 shadow-black/5"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setView('date')}
                className={cn(
                  "px-2 py-1 rounded-md transition-colors text-sm",
                  view === 'date'
                    ? (isDark ? "bg-white/10 text-white" : "bg-black/10 text-black")
                    : (isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5")
                )}
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('time')}
                className={cn(
                  "px-2 py-1 rounded-md transition-colors text-sm",
                  view === 'time'
                    ? (isDark ? "bg-white/10 text-white" : "bg-black/10 text-black")
                    : (isDark ? "text-white/60 hover:bg-white/5" : "text-black/60 hover:bg-black/5")
                )}
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {view === 'date' ? (
                <motion.div
                  key="date-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={handlePrevMonth}
                      className={cn(
                        "p-1 rounded-full transition-colors",
                        isDark ? "hover:bg-white/10" : "hover:bg-black/10"
                      )}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className={cn(
                      "text-sm font-medium",
                      isDark ? "text-white" : "text-black"
                    )}>
                      {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                      onClick={handleNextMonth}
                      className={cn(
                        "p-1 rounded-full transition-colors",
                        isDark ? "hover:bg-white/10" : "hover:bg-black/10"
                      )}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <div
                        key={index}
                        className={cn(
                          "text-center text-xs font-medium py-1",
                          isDark ? "text-white/60" : "text-black/60"
                        )}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((day, index) => (
                      <div key={index} className="aspect-square">
                        {day !== null ? (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDaySelect(day)}
                            className={cn(
                              "w-full h-full flex items-center justify-center rounded-full text-sm transition-colors",
                              day === date.getDate()
                                ? (isDark ? "bg-white/20 text-white" : "bg-black/20 text-black")
                                : (isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/10 text-black/80")
                            )}
                          >
                            {day}
                          </motion.button>
                        ) : (
                          <div className="w-full h-full"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="time-view"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="py-4"
                >
                  <div className="flex flex-col items-center space-y-6">
                    {/* Digital time display */}
                    <motion.div
                      className="flex items-center justify-center gap-3"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Hour selector */}
                      <div className="flex flex-col items-center">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={incrementHour}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/10 text-black/80"
                          )}
                        >
                          <ChevronUp className="w-5 h-5" />
                        </motion.button>
                        <div className={cn(
                          "w-14 h-14 flex items-center justify-center rounded-lg text-2xl font-medium my-1 transition-all duration-200",
                          isUpdating
                            ? (isDark ? "bg-blue-500/20 text-blue-300 scale-105" : "bg-blue-100 text-blue-700 scale-105")
                            : (isDark ? "bg-white/10 text-white" : "bg-black/10 text-black")
                        )}>
                          {getDisplayHour()}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={decrementHour}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/10 text-black/80"
                          )}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </motion.button>
                      </div>

                      <span className={cn(
                        "text-3xl font-medium pb-1",
                        isDark ? "text-white/60" : "text-black/60"
                      )}>:</span>

                      {/* Minute selector */}
                      <div className="flex flex-col items-center">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={incrementMinute}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/10 text-black/80"
                          )}
                        >
                          <ChevronUp className="w-5 h-5" />
                        </motion.button>
                        <div className={cn(
                          "w-14 h-14 flex items-center justify-center rounded-lg text-2xl font-medium my-1 transition-all duration-200",
                          isUpdating
                            ? (isDark ? "bg-blue-500/20 text-blue-300 scale-105" : "bg-blue-100 text-blue-700 scale-105")
                            : (isDark ? "bg-white/10 text-white" : "bg-black/10 text-black")
                        )}>
                          {getDisplayMinutes()}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={decrementMinute}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/10 text-black/80"
                          )}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </motion.div>

                    {/* AM/PM selector */}
                    <motion.div
                      className="flex items-center gap-3 mt-2"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleToAM}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                          getAmPm() === 'AM'
                            ? (isDark ? "bg-white/20 text-white" : "bg-black/20 text-black")
                            : (isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-black/10 text-black/60")
                        )}
                      >
                        AM
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleToPM}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                          getAmPm() === 'PM'
                            ? (isDark ? "bg-white/20 text-white" : "bg-black/20 text-black")
                            : (isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-black/10 text-black/60")
                        )}
                      >
                        PM
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed">
              <div className="flex gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={setToTomorrow}
                  className={cn(
                    "px-2 py-1 rounded text-xs transition-colors",
                    isDark
                      ? "hover:bg-white/10 text-white/70"
                      : "hover:bg-black/10 text-black/70"
                  )}
                >
                  Tomorrow
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={setToNextWeek}
                  className={cn(
                    "px-2 py-1 rounded text-xs transition-colors",
                    isDark
                      ? "hover:bg-white/10 text-white/70"
                      : "hover:bg-black/10 text-black/70"
                  )}
                >
                  Next Week
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-colors",
                  isDark
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-black/10 hover:bg-black/20 text-black"
                )}
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Calendar, Clock, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
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
  const containerRef = useRef<HTMLDivElement>(null)

  // Update the date state when the value prop changes
  useEffect(() => {
    if (value) {
      setDate(new Date(value))
    }
  }, [value])

  // Close the picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Format date for the input value
  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16)
  }

  // Format date for display
  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Handle date change
  const handleDateChange = (newDate: Date) => {
    setDate(newDate)
    onChange(formatDateForInput(newDate))
  }

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week for first day of month
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)
    const currentDate = date.getDate()

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
  }

  // Handle month navigation
  const handlePrevMonth = () => {
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() - 1)
    setDate(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() + 1)
    setDate(newDate)
  }

  // Handle day selection
  const handleDaySelect = (day: number) => {
    const newDate = new Date(date)
    newDate.setDate(day)
    handleDateChange(newDate)
    setView('time')
  }

  // Handle time change
  const handleHourChange = (hour: number) => {
    const newDate = new Date(date)
    newDate.setHours(hour)
    handleDateChange(newDate)
  }

  const handleMinuteChange = (minute: number) => {
    const newDate = new Date(date)
    newDate.setMinutes(minute)
    handleDateChange(newDate)
  }

  // Quick date selections
  const setToTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    handleDateChange(tomorrow)
    setIsOpen(false)
  }

  const setToNextWeek = () => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setHours(9, 0, 0, 0)
    handleDateChange(nextWeek)
    setIsOpen(false)
  }

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
                          onClick={() => {
                            // Get current 24-hour format hour
                            const currentHour24 = date.getHours();
                            // Calculate if we're in AM or PM
                            const isPM = currentHour24 >= 12;
                            // Get current hour in 12-hour format
                            const currentHour12 = currentHour24 % 12 || 12;

                            // Calculate new hour in 12-hour format (increment by 1)
                            let newHour12 = currentHour12 + 1;
                            if (newHour12 > 12) newHour12 = 1;

                            // Convert back to 24-hour format
                            let newHour24;
                            if (isPM) {
                              newHour24 = newHour12 === 12 ? 12 : newHour12 + 12;
                            } else {
                              newHour24 = newHour12 === 12 ? 0 : newHour12;
                            }

                            handleHourChange(newHour24);
                          }}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/10 text-black/80"
                          )}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5L12 19M12 5L6 11M12 5L18 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.button>
                        <div className={cn(
                          "w-14 h-14 flex items-center justify-center rounded-lg text-2xl font-medium my-1",
                          isDark ? "bg-white/10 text-white" : "bg-black/10 text-black"
                        )}>
                          {/* Display hour in 12-hour format */}
                          {(date.getHours() % 12 || 12).toString().padStart(2, '0')}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            // Get current 24-hour format hour
                            const currentHour24 = date.getHours();
                            // Calculate if we're in AM or PM
                            const isPM = currentHour24 >= 12;
                            // Get current hour in 12-hour format
                            const currentHour12 = currentHour24 % 12 || 12;

                            // Calculate new hour in 12-hour format (decrement by 1)
                            let newHour12 = currentHour12 - 1;
                            if (newHour12 < 1) newHour12 = 12;

                            // Convert back to 24-hour format
                            let newHour24;
                            if (isPM) {
                              newHour24 = newHour12 === 12 ? 12 : newHour12 + 12;
                            } else {
                              newHour24 = newHour12 === 12 ? 0 : newHour12;
                            }

                            handleHourChange(newHour24);
                          }}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/10 text-black/80"
                          )}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 19L12 5M12 19L6 13M12 19L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
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
                          onClick={() => {
                            // Get current minutes
                            const currentMinutes = date.getMinutes();

                            // Increment by 1 minute
                            let newMinutes = (currentMinutes + 1) % 60;

                            handleMinuteChange(newMinutes);
                          }}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/10 text-black/80"
                          )}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5L12 19M12 5L6 11M12 5L18 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.button>
                        <div className={cn(
                          "w-14 h-14 flex items-center justify-center rounded-lg text-2xl font-medium my-1",
                          isDark ? "bg-white/10 text-white" : "bg-black/10 text-black"
                        )}>
                          {date.getMinutes().toString().padStart(2, '0')}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            // Get current minutes
                            const currentMinutes = date.getMinutes();

                            // Decrement by 1 minute
                            let newMinutes = (currentMinutes - 1 + 60) % 60;

                            handleMinuteChange(newMinutes);
                          }}
                          className={cn(
                            "p-2 rounded-full transition-colors",
                            isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/10 text-black/80"
                          )}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 19L12 5M12 19L6 13M12 19L18 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
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
                        onClick={() => {
                          const currentHour = date.getHours();
                          if (currentHour >= 12) {
                            // Switch from PM to AM (subtract 12 hours)
                            const newHour = currentHour - 12;
                            handleHourChange(newHour);
                          }
                        }}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                          date.getHours() < 12
                            ? (isDark ? "bg-white/20 text-white" : "bg-black/20 text-black")
                            : (isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-black/10 text-black/60")
                        )}
                      >
                        AM
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const currentHour = date.getHours();
                          if (currentHour < 12) {
                            // Switch from AM to PM (add 12 hours)
                            const newHour = currentHour + 12;
                            handleHourChange(newHour);
                          }
                        }}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                          date.getHours() >= 12
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

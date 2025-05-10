"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, SlidersHorizontal, Check, ChevronUp, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface SearchAndFilterProps {
  onSearch: (query: string) => void
  onFilter: (filters: FilterOptions) => void
  initialFilters?: FilterOptions
  isDark?: boolean
  className?: string
}

export interface FilterOptions {
  dateRange: 'all' | 'today' | 'week' | 'month'
  sortBy: 'newest' | 'oldest' | 'alphabetical'
  contentType?: 'all' | 'note' | 'website' | 'document'
}

export function SearchAndFilter({
  onSearch,
  onFilter,
  initialFilters,
  isDark = false,
  className,
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>(initialFilters || {
    dateRange: 'all',
    sortBy: 'newest'
  })

  // Update filters when initialFilters change (e.g., when switching tabs)
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters)
    }
  }, [initialFilters])
  const { resolvedTheme } = useTheme()
  const filterRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [activeFilterCount, setActiveFilterCount] = useState(0)

  // Count active filters (non-default values)
  useEffect(() => {
    let count = 0
    if (filters.dateRange !== 'all') count++
    if (filters.sortBy !== 'newest') count++
    setActiveFilterCount(count)
  }, [filters])

  // Handle outside click to close filter dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Focus search input when pressing / key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch(query)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    onSearch("")
    searchInputRef.current?.focus()
  }

  const handleResetFilters = () => {
    const defaultFilters: FilterOptions = {
      dateRange: 'all',
      sortBy: 'newest'
    }
    setFilters(defaultFilters)
    onFilter(defaultFilters)
  }

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value } as FilterOptions
    setFilters(newFilters)
    onFilter(newFilters)
  }

  const isActuallyDark = isDark || resolvedTheme === "dark"

  return (
    <div className={cn(
      "flex flex-col w-full max-w-2xl mx-auto gap-2",
      className
    )}>
      <div className="relative flex flex-col sm:flex-row gap-2">
        <div className={cn(
          "flex-1 flex items-center rounded-md border px-3 py-2 transition-all focus-within:ring-1 focus-within:ring-opacity-50 focus-within:border-emerald-600",
          isActuallyDark
            ? "bg-slate-800 border-slate-700 text-white/90 focus-within:ring-emerald-500/30"
            : "bg-white border-slate-200 text-slate-700 focus-within:ring-emerald-500/20"
        )}>
          <Search className="w-4 h-4 mr-2 opacity-60" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search... (Press / to focus)"
            className={cn(
              "bg-transparent flex-1 outline-none text-sm placeholder:opacity-50",
              isActuallyDark ? "placeholder:text-white/40" : "placeholder:text-slate-400"
            )}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "flex items-center justify-center gap-1.5 text-sm rounded-md px-3 py-2 transition-all border",
              isFilterOpen
                ? isActuallyDark
                  ? "bg-slate-700 border-slate-600"
                  : "bg-slate-100 border-slate-200"
                : isActuallyDark
                  ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                  : "bg-white border-slate-200 hover:bg-slate-50",
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className={cn(
                "inline-flex items-center justify-center rounded-full h-5 w-5 text-xs font-medium",
                isActuallyDark ? "bg-emerald-600 text-white" : "bg-emerald-600 text-white"
              )}>
                {activeFilterCount}
              </span>
            )}
            {isFilterOpen ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                ref={filterRef}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "absolute right-0 mt-1 z-50 rounded-md border p-3 w-64 md:w-72 overflow-hidden",
                  isActuallyDark
                    ? "bg-slate-800 border-slate-700 text-white/90 shadow-xl shadow-black/20"
                    : "bg-white border-slate-200 text-slate-800 shadow-lg shadow-slate-200/50",
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <h3 className="font-medium text-sm">Filter Options</h3>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={handleResetFilters}
                        className={cn(
                          "text-xs rounded px-1.5 py-0.5 transition-colors",
                          isActuallyDark
                            ? "text-emerald-400 hover:bg-slate-700"
                            : "text-emerald-600 hover:bg-slate-50"
                        )}
                      >
                        Reset all
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-medium text-xs uppercase flex items-center opacity-70 tracking-wide">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      Date Range
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: "All Time", value: "all" },
                        { label: "Today", value: "today" },
                        { label: "This Week", value: "week" },
                        { label: "This Month", value: "month" }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleFilterChange("dateRange", option.value)}
                          className={cn(
                            "px-2.5 py-1.5 text-xs rounded flex items-center justify-center transition-colors",
                            filters.dateRange === option.value
                              ? isActuallyDark
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-600 text-white"
                              : isActuallyDark
                                ? "bg-slate-700 hover:bg-slate-600"
                                : "bg-slate-100 hover:bg-slate-200"
                          )}
                        >
                          {filters.dateRange === option.value && (
                            <Check className="w-3 h-3 mr-1 flex-shrink-0" />
                          )}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-medium text-xs uppercase flex items-center opacity-70 tracking-wide">
                      <ArrowDownUp className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                      Sort By
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { label: "Newest First", value: "newest" },
                        { label: "Oldest First", value: "oldest" },
                        { label: "Alphabetically", value: "alphabetical" }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleFilterChange("sortBy", option.value)}
                          className={cn(
                            "px-2.5 py-1.5 text-xs rounded flex items-center transition-colors",
                            filters.sortBy === option.value
                              ? isActuallyDark
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-600 text-white"
                              : isActuallyDark
                                ? "bg-slate-700 hover:bg-slate-600"
                                : "bg-slate-100 hover:bg-slate-200"
                          )}
                        >
                          {filters.sortBy === option.value && (
                            <Check className="w-3 h-3 mr-1 flex-shrink-0" />
                          )}
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1.5 mt-2 border-t text-xs opacity-60 text-center">
                    <p>Press / to focus search</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Helper icons
function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
  )
}

function ArrowDownUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>
  )
}

SearchAndFilter.displayName = "SearchAndFilter"
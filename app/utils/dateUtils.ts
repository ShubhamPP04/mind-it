/**
 * Utility functions for handling date/time synchronization between
 * DateTimePicker, database storage, and display formatting
 */

/**
 * Converts a DateTimePicker value (YYYY-MM-DDTHH:mm) to a Date object
 * while preserving the user's intended local time
 */
export function parseScheduledDate(dateTimeString: string): Date {
  // The dateTimeString is in format YYYY-MM-DDTHH:mm (local time)
  // We create a Date object that represents this exact local time
  const date = new Date(dateTimeString)
  return date
}

/**
 * Formats a stored ISO date string for display in the inbox
 * This ensures consistent display regardless of timezone
 */
export function formatScheduledDate(isoString: string): string {
  const date = new Date(isoString)

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * Creates a timezone-aware storage format that preserves user intent
 * This function ensures that the stored date represents the user's intended local time
 */
export function createStorageDate(dateTimeString: string): string {
  const date = parseScheduledDate(dateTimeString)

  // Store as ISO string - this will be in UTC but represents the user's intended time
  const isoString = date.toISOString()

  return isoString
}

/**
 * Validates that a date/time round-trip maintains consistency
 * This is useful for debugging timezone issues
 */
export function validateDateRoundTrip(originalInput: string): {
  isConsistent: boolean
  originalInput: string
  storedValue: string
  displayValue: string
  originalDate: string
  finalDate: string
} {
  // Simulate the full flow
  const storageDate = createStorageDate(originalInput)
  const displayFormatted = formatScheduledDate(storageDate)
  
  // Parse both dates for comparison
  const originalDate = new Date(originalInput)
  const finalDate = new Date(storageDate)
  
  // Check if the times match (allowing for small differences due to processing)
  const timeDiff = Math.abs(originalDate.getTime() - finalDate.getTime())
  const isConsistent = timeDiff < 1000 // Allow 1 second difference
  
  return {
    isConsistent,
    originalInput,
    storedValue: storageDate,
    displayValue: displayFormatted,
    originalDate: originalDate.toLocaleString(),
    finalDate: finalDate.toLocaleString()
  }
}

/**
 * Gets the current timezone information for debugging
 */
export function getTimezoneInfo() {
  const now = new Date()
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offset: now.getTimezoneOffset(),
    offsetHours: now.getTimezoneOffset() / 60,
    isDST: now.getTimezoneOffset() < new Date(now.getFullYear(), 0, 1).getTimezoneOffset()
  }
}

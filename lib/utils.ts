import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { BusinessHours } from '@/types'

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

// Format phone number for tel: link
export function formatPhoneLink(phone: string): string {
  return phone.replace(/\D/g, '')
}

// Check if business is currently open
export function isBusinessOpen(hours: BusinessHours[]): { isOpen: boolean; nextChange: string } {
  const now = new Date()
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
  const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  const todayHours = hours.find(h => h.day === currentDay)

  if (!todayHours) {
    return { isOpen: false, nextChange: 'Closed today' }
  }

  const openTime = convertTo24Hour(todayHours.open)
  const closeTime = convertTo24Hour(todayHours.close)

  const isOpen = currentTime >= openTime && currentTime < closeTime

  if (isOpen) {
    return { isOpen: true, nextChange: `Closes at ${todayHours.close}` }
  } else if (currentTime < openTime) {
    return { isOpen: false, nextChange: `Opens at ${todayHours.open}` }
  } else {
    // Find next day's opening time
    const currentDayIndex = hours.findIndex(h => h.day === currentDay)
    const nextDay = hours[(currentDayIndex + 1) % hours.length]
    return { isOpen: false, nextChange: `Opens ${nextDay.day} at ${nextDay.open}` }
  }
}

// Convert 12-hour time to 24-hour format
function convertTo24Hour(time: string): string {
  const [timePart, period] = time.split(' ')
  let [hours, minutes] = timePart.split(':')

  if (period === 'PM' && hours !== '12') {
    hours = String(Number(hours) + 12)
  } else if (period === 'AM' && hours === '12') {
    hours = '00'
  }

  return `${hours.padStart(2, '0')}:${minutes}`
}

/**
 * Today's calendar date in Atlanta as an ISO string ('2026-11-14').
 *
 * Date-limited promotions run on Atlanta time, so their windows are evaluated
 * against this rather than the visitor's own timezone or UTC. Comparing ISO
 * date strings sidesteps daylight-saving offset maths entirely:
 * '2026-11-03' <= '2026-11-14' is true regardless of where the visitor is.
 */
export function easternDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Generate Google Maps URL
export function getGoogleMapsUrl(address: string, city: string, state: string, zip: string): string {
  const fullAddress = `${address}, ${city}, ${state} ${zip}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
}

// Generate directions URL
export function getDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

// Lazy load image helper
export function getImagePlaceholder(width: number, height: number): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='%23f5f2ed' width='${width}' height='${height}'/%3E%3C/svg%3E`
}

// Debounce function for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

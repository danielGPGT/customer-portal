import { format } from 'date-fns'

/**
 * ISO date-only regex (YYYY-MM-DD). Backend often returns dates without time.
 */
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Parses a date string for display as a calendar date.
 * - Date-only strings (YYYY-MM-DD) are parsed as local midnight so the displayed
 *   day matches what the user booked (avoids UTC-midnight showing as previous day).
 * - Full ISO datetimes are parsed normally (for timestamps we keep real moment).
 */
export function parseCalendarDate(
  dateString: string | null | undefined
): Date | null {
  if (dateString == null || dateString === '') return null
  const s = String(dateString).trim()
  if (!s) return null

  const dateOnly = s.slice(0, 10)
  if (DATE_ONLY_REGEX.test(dateOnly)) {
    const [y, m, d] = dateOnly.split('-').map(Number)
    // month is 0-indexed in Date constructor
    const local = new Date(y, m - 1, d)
    if (Number.isNaN(local.getTime())) return null
    return local
  }

  const d = new Date(dateString)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Formats a calendar date string for display (trip/event/booking dates).
 * Use this instead of format(new Date(date), ...) to avoid the "one day prior" bug
 * when the backend sends date-only values like "2025-03-15".
 */
export function formatCalendarDate(
  dateString: string | null | undefined,
  formatStr: string,
  fallback = ''
): string {
  const d = parseCalendarDate(dateString)
  if (!d) return fallback
  try {
    return format(d, formatStr)
  } catch {
    return fallback || String(dateString)
  }
}

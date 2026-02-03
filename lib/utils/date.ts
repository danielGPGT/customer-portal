import { format } from 'date-fns'

/**
 * ISO date-only regex (YYYY-MM-DD). Backend often returns dates without time.
 */
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Why does the "one day prior" bug happen by default?
 *
 * In JavaScript, an ISO date-only string like "2025-03-15" is defined by the spec
 * (ECMAScript / ISO 8601) to be interpreted as UTC midnight: 2025-03-15T00:00:00.000Z.
 * There is no concept of a "calendar date without timezone" in the Date object.
 *
 * When you format that for display (e.g. format(new Date("2025-03-15"), "MMM d, yyyy"))
 * or use toISOString().split('T')[0] for an <input type="date">, the engine converts
 * that UTC moment to the user's local time. In timezones behind UTC (e.g. US, UK in winter),
 * UTC midnight is still the previous calendar day locally, so you see "Mar 14, 2025"
 * or "2025-03-14" instead of the intended day.
 *
 * So we treat date-only strings as "calendar dates" by parsing YYYY-MM-DD as local
 * midnight (year, month-1, day) and use that for display and for <input type="date"> values.
 */

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

/**
 * Returns a YYYY-MM-DD string suitable for <input type="date"> value.
 * Uses calendar-date semantics so the shown day is correct in all timezones
 * (avoids UTC-midnight shifting the day when the backend stores date-only).
 */
export function toDateOnlyInputValue(
  dateString: string | null | undefined
): string {
  const d = parseCalendarDate(dateString)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

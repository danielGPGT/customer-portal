import { parsePhoneNumberFromString, type PhoneNumber } from 'libphonenumber-js'

/**
 * Characters allowed in the phone input (digits, +, spaces, dashes, parentheses).
 * Use to restrict input so only valid phone characters can be typed.
 */
export const PHONE_INPUT_REGEX = /^[\d+\s\-()]*$/

/**
 * Strip to only digits and leading + for validation.
 */
function cleanForParse(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const cleaned = trimmed.replace(/[^\d+]/g, '')
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`
}

/**
 * Check if a string is a valid phone number (with country code).
 * Returns the parsed PhoneNumber if valid, null otherwise.
 */
export function parsePhone(value: string): PhoneNumber | null {
  const cleaned = cleanForParse(value)
  if (!cleaned || cleaned === '+') return null
  const parsed = parsePhoneNumberFromString(cleaned)
  return parsed?.isValid() ? parsed : null
}

/**
 * Validate phone number. Returns true if empty or a valid international number.
 */
export function isValidPhone(value: string): boolean {
  if (!value || value.trim() === '') return true
  return parsePhone(value) !== null
}

/**
 * Format to E.164 (e.g. +447123456789) for APIs. Returns null if invalid or empty.
 */
export function toE164(value: string): string | null {
  const parsed = parsePhone(value)
  return parsed ? parsed.format('E.164') : null
}

/**
 * User-facing format (e.g. +44 7123 456789). Returns empty string if invalid or empty.
 */
export function formatPhoneDisplay(value: string): string {
  const parsed = parsePhone(value)
  return parsed ? parsed.formatInternational() : value.trim()
}

/**
 * Restrict input: only allow digits, +, spaces, dashes, parentheses.
 * Use in onChange to prevent invalid characters.
 */
export function restrictPhoneInput(value: string): string {
  return value.replace(/[^\d+\s\-()]/g, '')
}

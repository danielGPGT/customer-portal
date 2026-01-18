/**
 * Currency utility functions for formatting and displaying currency values
 * Supports all currencies used in the application
 * Integrates with CurrencyService for exchange rate conversions
 */

export type CurrencyCode = 
  | 'GBP' | 'USD' | 'EUR' | 'CAD' | 'AUD' 
  | 'AED' | 'BHD' | 'SGD' | 'NZD' | 'ZAR' 
  | 'MYR' | 'QAR' | 'SAR' | 'INR'

interface CurrencyInfo {
  symbol: string
  name: string
  code: string
  position: 'before' | 'after'
  decimalPlaces: number
}

/**
 * Currency information mapping
 * Matches the currencies from CurrencyService.getSupportedCurrencies()
 */
const CURRENCY_MAP: Record<CurrencyCode, CurrencyInfo> = {
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP', position: 'before', decimalPlaces: 2 },
  USD: { symbol: '$', name: 'US Dollar', code: 'USD', position: 'before', decimalPlaces: 2 },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR', position: 'before', decimalPlaces: 2 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', code: 'CAD', position: 'before', decimalPlaces: 2 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', code: 'AUD', position: 'before', decimalPlaces: 2 },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', code: 'AED', position: 'before', decimalPlaces: 2 },
  BHD: { symbol: '.د.ب', name: 'Bahraini Dinar', code: 'BHD', position: 'before', decimalPlaces: 3 },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', code: 'SGD', position: 'before', decimalPlaces: 2 },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', code: 'NZD', position: 'before', decimalPlaces: 2 },
  ZAR: { symbol: 'R', name: 'South African Rand', code: 'ZAR', position: 'before', decimalPlaces: 2 },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', code: 'MYR', position: 'before', decimalPlaces: 2 },
  QAR: { symbol: 'ر.ق', name: 'Qatari Riyal', code: 'QAR', position: 'before', decimalPlaces: 2 },
  SAR: { symbol: 'ر.س', name: 'Saudi Riyal', code: 'SAR', position: 'before', decimalPlaces: 2 },
  INR: { symbol: '₹', name: 'Indian Rupee', code: 'INR', position: 'before', decimalPlaces: 2 },
}

/**
 * Get currency symbol for a given currency code
 * @param currency - Currency code (defaults to 'GBP')
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: string | null | undefined): string {
  const code = (currency || 'GBP').toUpperCase() as CurrencyCode
  return CURRENCY_MAP[code]?.symbol || '£'
}

/**
 * Get full currency information
 * @param currency - Currency code (defaults to 'GBP')
 * @returns Currency information object
 */
export function getCurrencyInfo(currency: string | null | undefined): CurrencyInfo {
  const code = (currency || 'GBP').toUpperCase() as CurrencyCode
  return CURRENCY_MAP[code] || CURRENCY_MAP.GBP
}

/**
 * Format a number as currency
 * @param amount - Amount to format
 * @param currency - Currency code (defaults to 'GBP')
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string | null | undefined = 'GBP',
  options: {
    showSymbol?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    locale?: string
  } = {}
): string {
  const {
    showSymbol = true,
    minimumFractionDigits,
    maximumFractionDigits,
    locale = 'en-GB',
  } = options

  const currencyInfo = getCurrencyInfo(currency)
  const code = (currency || 'GBP').toUpperCase() as CurrencyCode

  // Use Intl.NumberFormat for proper currency formatting
  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: code,
    minimumFractionDigits: minimumFractionDigits ?? currencyInfo.decimalPlaces,
    maximumFractionDigits: maximumFractionDigits ?? currencyInfo.decimalPlaces,
  })

  if (showSymbol) {
    return formatter.format(amount)
  }

  // If not showing symbol, format as decimal and add symbol manually
  const formatted = formatter.format(amount)
  return `${currencyInfo.symbol}${formatted}`
}

/**
 * Format currency with custom symbol placement
 * @param amount - Amount to format
 * @param currency - Currency code (defaults to 'GBP')
 * @param options - Formatting options
 * @returns Formatted currency string with symbol
 */
export function formatCurrencyWithSymbol(
  amount: number,
  currency: string | null | undefined = 'GBP',
  options: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    locale?: string
  } = {}
): string {
  const {
    minimumFractionDigits,
    maximumFractionDigits,
    locale = 'en-GB',
  } = options

  const currencyInfo = getCurrencyInfo(currency)
  const code = (currency || 'GBP').toUpperCase() as CurrencyCode

  const formatter = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: minimumFractionDigits ?? currencyInfo.decimalPlaces,
    maximumFractionDigits: maximumFractionDigits ?? currencyInfo.decimalPlaces,
  })

  const formatted = formatter.format(amount)

  if (currencyInfo.position === 'before') {
    return `${currencyInfo.symbol}${formatted}`
  } else {
    return `${formatted} ${currencyInfo.symbol}`
  }
}

/**
 * Get currency name
 * @param currency - Currency code (defaults to 'GBP')
 * @returns Currency name
 */
export function getCurrencyName(currency: string | null | undefined): string {
  const code = (currency || 'GBP').toUpperCase() as CurrencyCode
  return CURRENCY_MAP[code]?.name || 'British Pound'
}

/**
 * Check if a currency code is valid
 * @param currency - Currency code to check
 * @returns True if valid, false otherwise
 */
export function isValidCurrency(currency: string | null | undefined): boolean {
  if (!currency) return false
  const code = currency.toUpperCase() as CurrencyCode
  return code in CURRENCY_MAP
}

/**
 * Get all supported currencies
 * @returns Array of currency codes
 */
export function getSupportedCurrencies(): CurrencyCode[] {
  return Object.keys(CURRENCY_MAP) as CurrencyCode[]
}

/**
 * Get client's preferred currency from preferences
 * Falls back to loyalty_settings currency if not set
 * @param client - Client object with preferences
 * @param defaultCurrency - Default currency (usually from loyalty_settings)
 * @returns Preferred currency code
 */
export function getClientPreferredCurrency(
  client: { preferences?: any } | null | undefined,
  defaultCurrency: string = 'GBP'
): CurrencyCode {
  if (!client?.preferences) {
    return (defaultCurrency.toUpperCase() || 'GBP') as CurrencyCode
  }

  // Check if preferences is a string (JSON) or already an object
  let prefs: any
  if (typeof client.preferences === 'string') {
    try {
      prefs = JSON.parse(client.preferences)
    } catch {
      return (defaultCurrency.toUpperCase() || 'GBP') as CurrencyCode
    }
  } else {
    prefs = client.preferences
  }

  const preferredCurrency = prefs?.preferred_currency || prefs?.currency
  if (preferredCurrency && isValidCurrency(preferredCurrency)) {
    return preferredCurrency.toUpperCase() as CurrencyCode
  }

  return (defaultCurrency.toUpperCase() || 'GBP') as CurrencyCode
}

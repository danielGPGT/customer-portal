/**
 * Currency conversion utilities for client preferences
 * Converts discount amounts from base currency (loyalty_settings) to client's preferred currency
 * Uses CurrencyService for exchange rate conversions
 */

import { CurrencyService } from '@/lib/currencyService'
import type { CurrencyCode } from './currency'
import { getClientPreferredCurrency, getCurrencySymbol, formatCurrencyWithSymbol } from './currency'

/**
 * Convert discount amount from base currency to client's preferred currency
 * @param amount - Amount in base currency (from loyalty_settings)
 * @param baseCurrency - Base currency from loyalty_settings
 * @param preferredCurrency - Client's preferred currency
 * @returns Converted amount and conversion info
 */
export async function convertDiscountToPreferredCurrency(
  amount: number,
  baseCurrency: string,
  preferredCurrency: string
): Promise<{
  originalAmount: number
  convertedAmount: number
  originalCurrency: string
  preferredCurrency: string
  rate: number
  adjustedRate: number
  formattedOriginal: string
  formattedConverted: string
}> {
  // If currencies match, no conversion needed
  if (baseCurrency.toUpperCase() === preferredCurrency.toUpperCase()) {
    const formatted = formatCurrencyWithSymbol(amount, baseCurrency)
    return {
      originalAmount: amount,
      convertedAmount: amount,
      originalCurrency: baseCurrency,
      preferredCurrency: preferredCurrency,
      rate: 1,
      adjustedRate: 1,
      formattedOriginal: formatted,
      formattedConverted: formatted,
    }
  }

  try {
    // Use CurrencyService to convert
    const conversion = await CurrencyService.convertCurrency(
      amount,
      baseCurrency,
      preferredCurrency
    )

    return {
      originalAmount: amount,
      convertedAmount: conversion.convertedAmount,
      originalCurrency: baseCurrency,
      preferredCurrency: preferredCurrency,
      rate: conversion.rate,
      adjustedRate: conversion.adjustedRate,
      formattedOriginal: formatCurrencyWithSymbol(amount, baseCurrency),
      formattedConverted: formatCurrencyWithSymbol(conversion.convertedAmount, preferredCurrency),
    }
  } catch (error) {
    console.error('Error converting currency:', error)
    // Fallback: return original amount if conversion fails
    const formatted = formatCurrencyWithSymbol(amount, baseCurrency)
    return {
      originalAmount: amount,
      convertedAmount: amount,
      originalCurrency: baseCurrency,
      preferredCurrency: preferredCurrency,
      rate: 1,
      adjustedRate: 1,
      formattedOriginal: formatted,
      formattedConverted: formatted,
    }
  }
}

/**
 * Get display currency for a component
 * Returns client's preferred currency if available, otherwise base currency
 * @param client - Client object
 * @param baseCurrency - Base currency from loyalty_settings
 * @returns Currency code to use for display
 */
export function getDisplayCurrency(
  client: { preferences?: any } | null | undefined,
  baseCurrency: string = 'GBP'
): CurrencyCode {
  return getClientPreferredCurrency(client, baseCurrency)
}

/**
 * Format discount amount showing both currencies if they differ
 * @param amount - Amount in base currency
 * @param baseCurrency - Base currency
 * @param preferredCurrency - Client's preferred currency
 * @param convertedAmount - Optional pre-converted amount
 * @returns Formatted string showing both currencies if different
 */
export function formatDiscountWithConversion(
  amount: number,
  baseCurrency: string,
  preferredCurrency: string,
  convertedAmount?: number
): string {
  if (baseCurrency.toUpperCase() === preferredCurrency.toUpperCase()) {
    return formatCurrencyWithSymbol(amount, baseCurrency)
  }

  const baseFormatted = formatCurrencyWithSymbol(amount, baseCurrency)
  const preferredFormatted = convertedAmount
    ? formatCurrencyWithSymbol(convertedAmount, preferredCurrency)
    : formatCurrencyWithSymbol(amount, preferredCurrency) // Fallback if no conversion

  // Show both currencies: "£100 (≈ $125)"
  return `${baseFormatted} (≈ ${preferredFormatted})`
}

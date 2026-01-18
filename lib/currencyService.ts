// Next.js environment variable (works in both client and server)
const EXCHANGE_RATE_API_KEY = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY 
  : process.env.EXCHANGE_RATE_API_KEY || process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
const EXCHANGE_RATE_API_BASE = 'https://v6.exchangerate-api.com/v6';

export interface ExchangeRate {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
  time_last_update_unix?: number;
  time_last_update_utc?: string;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  adjustedRate: number; // Rate with 2.5% spread
  amount: number;
  convertedAmount: number;
}

export class CurrencyService {
  private static cache: Map<string, { data: ExchangeRate; timestamp: number }> = new Map();
  private static CACHE_DURATION = 40 * 60 * 1000; // 40 minutes - conservative API usage

  /**
   * Fetch exchange rates from the API
   */
  static async fetchExchangeRates(baseCurrency: string = 'GBP'): Promise<ExchangeRate> {
    const cacheKey = `rates_${baseCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    // Check if we have valid cached data
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`💰 Using cached exchange rates for ${baseCurrency}`);
      return cached.data;
    }

    try {
      console.log(`💰 Fetching exchange rates for ${baseCurrency}...`);
      const response = await fetch(`${EXCHANGE_RATE_API_BASE}/${EXCHANGE_RATE_API_KEY}/latest/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates: ${response.status}`);
      }

      const data: ExchangeRate = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      console.log(`✅ Exchange rates fetched for ${baseCurrency}:`, data.conversion_rates);
      return data;
    } catch (error) {
      console.error('❌ Error fetching exchange rates:', error);
      throw error;
    }
  }

  /**
   * Convert amount from one currency to another with 2.5% spread
   * The spread is applied as a markup to cover exchange rate fluctuations
   */
  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<CurrencyConversion> {
    if (fromCurrency === toCurrency) {
      return {
        fromCurrency,
        toCurrency,
        rate: 1,
        adjustedRate: 1, // No spread needed for same currency
        amount,
        convertedAmount: amount
      };
    }

    try {
      const rates = await this.fetchExchangeRates(fromCurrency);
      const baseRate = rates.conversion_rates[toCurrency];
      
      if (!baseRate) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }

      // Apply 2.5% spread (multiply by 1.025 for markup)
      const adjustedRate = baseRate * 1.025;
      const convertedAmount = amount * adjustedRate;

      // Round rates to 3 decimal places
      const rateRounded = Math.round(baseRate * 1000) / 1000;
      const adjustedRateRounded = Math.round(adjustedRate * 1000) / 1000;

      return {
        fromCurrency,
        toCurrency,
        rate: rateRounded,
        adjustedRate: adjustedRateRounded,
        amount,
        convertedAmount
      };
    } catch (error) {
      console.error('❌ Error converting currency:', error);
      throw error;
    }
  }

  /**
   * Get supported currencies
   */
  static getSupportedCurrencies(): { code: string; name: string; symbol: string }[] {
    return [
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
      { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
      { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
      { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' },
      { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
      { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
      { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹' }
    ];
  }

  /**
   * Format currency amount with proper symbol
   */
  static formatCurrency(amount: number, currencyCode: string): string {
    const currency = this.getSupportedCurrencies().find(c => c.code === currencyCode);
    const symbol = currency?.symbol || currencyCode;
    
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Clear the cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
} 
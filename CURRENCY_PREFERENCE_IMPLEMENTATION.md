# Currency Preference Implementation Guide

## 🎯 Overview

This document outlines the implementation for allowing clients to view discount amounts in their preferred currency, even when bookings are in different currencies.

## 📋 Requirements

1. **Base Currency**: All points calculations use `loyalty_settings.currency` (base currency)
2. **Client Preference**: Clients can set a preferred currency in their profile preferences
3. **Display Currency**: Show discount amounts in client's preferred currency (converted from base)
4. **Booking Currency**: Bookings can be in any of the 14 supported currencies
5. **Conversion**: Use CurrencyService with 2.5% spread for conversions

## 🏗️ Architecture

### Data Flow

```
loyalty_settings.currency (Base) 
    ↓
Points Calculations (always in base currency)
    ↓
Discount Amount (in base currency)
    ↓
CurrencyService.convertCurrency()
    ↓
Display Amount (in client's preferred currency)
```

### Key Principles

1. **Calculations Always in Base Currency**
   - Points earned/spent calculated using `loyalty_settings.currency`
   - Point values always in base currency
   - Database stores amounts in base currency

2. **Display in Preferred Currency**
   - Convert discount amounts for display only
   - Use CurrencyService with 2.5% spread
   - Cache exchange rates (40 minutes)

3. **Fallback Behavior**
   - If conversion fails → show base currency
   - If no preference set → use base currency
   - If preferred currency invalid → use base currency

## 📊 Database Schema

### Current Schema

**`clients` table:**
- `preferences` (jsonb) - Can store `preferred_currency`

**`loyalty_settings` table:**
- `currency` (text) - Base currency for all calculations (default: 'GBP')

**`bookings` table:**
- `currency` (text) - Currency of the booking (one of 14 supported)

### Recommended Storage

Store preferred currency in `clients.preferences`:

```json
{
  "preferred_currency": "USD",
  "other_preferences": "..."
}
```

## 🔧 Implementation Steps

### Step 1: Update Currency Utility ✅

**File**: `lib/utils/currency.ts`

- ✅ Added `getClientPreferredCurrency()` function
- ✅ Supports reading from `clients.preferences.preferred_currency`
- ✅ Falls back to base currency if not set

### Step 2: Create Currency Conversion Utility ✅

**File**: `lib/utils/currency-conversion.ts`

- ✅ `convertDiscountToPreferredCurrency()` - Converts amounts
- ✅ `getDisplayCurrency()` - Gets currency for display
- ✅ `formatDiscountWithConversion()` - Formats with both currencies

### Step 3: Update CurrencyService for Next.js

**File**: `lib/currencyService.ts`

**Current Issue**: Uses `import.meta.env` (Vite-specific)

**Fix**: Update to use Next.js environment variables:

```typescript
// Change from:
const EXCHANGE_RATE_API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;

// To:
const EXCHANGE_RATE_API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
```

**Also**: Make it work server-side (currently client-side only)

### Step 4: Add Currency Preference to Profile

**File**: `app/(protected)/profile/preferences/page.tsx` (needs to be created)

**Features**:
- Dropdown to select preferred currency
- Show current preference
- Save to `clients.preferences.preferred_currency`
- Show preview of conversion

### Step 5: Update Components to Use Preferred Currency

**Components to Update**:

1. **Points Display Components**:
   - `components/points/points-balance-card.tsx`
   - `components/points/points-progress-card.tsx`
   - `components/points/redemption-calculator.tsx`
   - `components/points/points-calculator.tsx`

2. **Dashboard Components**:
   - `components/dashboard/earn-redeem-cards.tsx`
   - Dashboard page

3. **Points Pages**:
   - `app/(protected)/points/page.tsx`
   - `app/(protected)/points/earn/page.tsx`
   - `app/(protected)/points/redeem/page.tsx`

**Pattern**:
```typescript
// Get client's preferred currency
const preferredCurrency = getClientPreferredCurrency(client, settings.currency)

// Convert discount amount
const conversion = await convertDiscountToPreferredCurrency(
  discountAmount,
  settings.currency,
  preferredCurrency
)

// Display converted amount
{conversion.formattedConverted}
```

## 💻 Code Examples

### Example 1: Display Discount in Preferred Currency

```typescript
import { getClientPreferredCurrency } from '@/lib/utils/currency'
import { convertDiscountToPreferredCurrency } from '@/lib/utils/currency-conversion'

// In a server component
const { client, user } = await getClient()
const { data: settings } = await supabase
  .from('loyalty_settings')
  .select('currency, point_value')
  .eq('id', 1)
  .single()

const baseCurrency = settings?.currency || 'GBP'
const preferredCurrency = getClientPreferredCurrency(client, baseCurrency)

// Calculate discount in base currency
const discountAmount = availablePoints * settings.point_value

// Convert to preferred currency
const conversion = await convertDiscountToPreferredCurrency(
  discountAmount,
  baseCurrency,
  preferredCurrency
)

// Display
<div>
  <p>Available discount: {conversion.formattedConverted}</p>
  {baseCurrency !== preferredCurrency && (
    <p className="text-sm text-muted-foreground">
      ({conversion.formattedOriginal} in {baseCurrency})
    </p>
  )}
</div>
```

### Example 2: Client Component with Async Conversion

```typescript
'use client'

import { useEffect, useState } from 'react'
import { convertDiscountToPreferredCurrency } from '@/lib/utils/currency-conversion'

export function DiscountDisplay({ 
  amount, 
  baseCurrency, 
  preferredCurrency 
}: {
  amount: number
  baseCurrency: string
  preferredCurrency: string
}) {
  const [conversion, setConversion] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    convertDiscountToPreferredCurrency(amount, baseCurrency, preferredCurrency)
      .then(setConversion)
      .finally(() => setLoading(false))
  }, [amount, baseCurrency, preferredCurrency])

  if (loading) return <span>Loading...</span>

  return (
    <div>
      <span className="font-bold">{conversion.formattedConverted}</span>
      {baseCurrency !== preferredCurrency && (
        <span className="text-sm text-muted-foreground ml-2">
          ({conversion.formattedOriginal})
        </span>
      )}
    </div>
  )
}
```

## 🔄 Migration Strategy

### Phase 1: Infrastructure ✅
- [x] Update currency utility
- [x] Create conversion utility
- [ ] Update CurrencyService for Next.js
- [ ] Add environment variable for API key

### Phase 2: Profile Preferences
- [ ] Create preferences page
- [ ] Add currency selector
- [ ] Save preference to database
- [ ] Add validation

### Phase 3: Component Updates
- [ ] Update points balance displays
- [ ] Update redemption calculator
- [ ] Update dashboard
- [ ] Update points pages

### Phase 4: Testing
- [ ] Test with different currencies
- [ ] Test conversion accuracy
- [ ] Test fallback behavior
- [ ] Test with no preference set

## ⚙️ Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Exchange Rate API (for CurrencyService)
NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=your_api_key_here
```

### CurrencyService Updates Needed

1. **Change `import.meta.env` to `process.env`**
2. **Make it work server-side** (currently client-only)
3. **Add error handling for missing API key**

## 🎨 UI/UX Considerations

### Display Options

**Option A: Show Only Preferred Currency**
- Simple, clean
- May confuse if booking currency differs

**Option B: Show Both Currencies** (Recommended)
- "£100 (≈ $125)"
- Clear and transparent
- Shows both base and converted

**Option C: Toggle Between Currencies**
- More complex
- Better for power users

### Recommended: Option B

Show both currencies when they differ:
```
Available Discount: $125 USD
(£100 GBP at current exchange rate)
```

## 📝 Database Migration

### Add Currency Preference Support

No schema changes needed - use existing `preferences` jsonb field:

```sql
-- Example: Update client preference
UPDATE clients 
SET preferences = jsonb_set(
  COALESCE(preferences, '{}'::jsonb),
  '{preferred_currency}',
  '"USD"'
)
WHERE id = 'client-id';
```

### Query Preferred Currency

```sql
-- Get client with preferred currency
SELECT 
  *,
  preferences->>'preferred_currency' as preferred_currency
FROM clients
WHERE id = 'client-id';
```

## 🚨 Important Notes

### Exchange Rate Considerations

1. **2.5% Spread**: CurrencyService applies 2.5% markup
   - This protects against rate fluctuations
   - Client sees slightly less favorable rate

2. **Caching**: Rates cached for 40 minutes
   - Reduces API calls
   - May show slightly stale rates

3. **API Limits**: Monitor exchange rate API usage
   - Consider server-side caching
   - May need Redis/database cache

### Points Calculations

**CRITICAL**: Points are ALWAYS calculated in base currency:
- `points_per_pound` uses base currency
- Point values in base currency
- Only DISPLAY amounts are converted

### Error Handling

Always handle:
- API failures → show base currency
- Invalid currency → fallback to base
- Missing preference → use base currency
- Network errors → graceful degradation

## ✅ Best Practices

1. **Always Calculate in Base Currency**
   - Never convert points themselves
   - Only convert display amounts

2. **Show Both Currencies When Different**
   - Transparency is key
   - Helps users understand conversion

3. **Cache Aggressively**
   - Exchange rates don't change minute-to-minute
   - Reduce API calls

4. **Graceful Degradation**
   - If conversion fails, show base currency
   - Never break the UI

5. **Clear Labeling**
   - Always show which currency is displayed
   - Use "≈" for approximate conversions

## 🔗 Related Files

- `lib/utils/currency.ts` - Currency utilities
- `lib/utils/currency-conversion.ts` - Conversion utilities
- `lib/currencyService.ts` - Exchange rate service
- `lib/utils/get-client.ts` - Client data fetching
- `app/(protected)/profile/preferences/page.tsx` - Preferences page (to be created)

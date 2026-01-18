# Loyalty Settings - Currency Analysis & Improvements

## 📊 Current State

### Database Schema

**`loyalty_settings` table:**
- `currency` (text, default: 'GBP') - Single currency for loyalty program
- `points_per_pound` (numeric, default: 0.05) - Points earned per currency unit
- `point_value` (numeric, default: 1.00) - Value of 1 point in currency units

**`bookings` table:**
- `currency` (text, default: 'GBP') - Supports 14 currencies:
  - GBP, USD, EUR, CAD, AUD, AED, BHD, SGD, NZD, ZAR, MYR, QAR, SAR, INR

### Issues Identified

1. **Hardcoded Currency Symbols** ❌
   - Pattern `currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'` repeated in 18+ files
   - Only supports 3 currencies (GBP, USD, EUR) despite database supporting 14
   - Inconsistent implementation across components

2. **Inconsistent Currency Usage** ⚠️
   - Some components use `loyalty_settings.currency` (global setting)
   - Some components use `booking.currency` (per-booking currency)
   - No clear policy on which to use when

3. **Field Naming** ⚠️
   - `points_per_pound` is currency-agnostic but named for GBP
   - Should be `points_per_currency_unit` or similar

4. **No Currency Formatting Utility** ❌
   - Each component implements its own formatting
   - No consistent locale/formatting rules
   - Manual symbol placement

5. **Limited Currency Support in UI** ❌
   - Database supports 14 currencies
   - UI only displays 3 currency symbols
   - Missing symbols for: CAD, AUD, AED, BHD, SGD, NZD, ZAR, MYR, QAR, SAR, INR

---

## ✅ Improvements Made

### 1. Created Currency Utility (`lib/utils/currency.ts`)

**Features:**
- ✅ Supports all 14 currencies from database
- ✅ Centralized currency symbol mapping
- ✅ Proper currency formatting with `Intl.NumberFormat`
- ✅ Currency information (name, symbol, decimal places)
- ✅ Type-safe currency codes
- ✅ Helper functions for common operations

**Functions:**
- `getCurrencySymbol(currency)` - Get symbol for any currency
- `getCurrencyInfo(currency)` - Get full currency details
- `formatCurrency(amount, currency, options)` - Format with Intl API
- `formatCurrencyWithSymbol(amount, currency, options)` - Custom formatting
- `getCurrencyName(currency)` - Get human-readable name
- `isValidCurrency(currency)` - Validate currency code
- `getSupportedCurrencies()` - List all supported currencies

### 2. Updated Components

**Started migration:**
- ✅ `components/points/points-balance-card.tsx` - Now uses utility

**Remaining components to update** (18 files):
- `app/(protected)/points/earn/page.tsx`
- `app/(protected)/points/redeem/page.tsx`
- `app/(protected)/points/page.tsx`
- `app/(protected)/page.tsx`
- `components/points/points-calculator.tsx`
- `components/points/redemption-calculator.tsx`
- `components/points/points-progress-card.tsx`
- `components/points/enhanced-stats-grid.tsx`
- `components/points/earn-explainer-card.tsx`
- `components/points/redeem-explainer-card.tsx`
- `components/points/points-expiring-alert.tsx`
- `components/trips/trip-card.tsx`
- `components/trips/trip-details-header.tsx`
- `components/trips/payment-summary-section.tsx`
- `components/trips/payment-schedule-section.tsx`
- `components/trips/loyalty-points-section.tsx`
- `components/dashboard/earn-redeem-cards.tsx`
- `app/(protected)/trips/page.tsx`
- `app/(protected)/trips/[bookingId]/page.tsx`

---

## 🎯 Recommendations

### 1. Complete Currency Utility Migration

Replace all hardcoded currency symbol logic with the utility:

**Before:**
```typescript
const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
```

**After:**
```typescript
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency'
const currencySymbol = getCurrencySymbol(currency)
const formatted = formatCurrency(amount, currency)
```

### 2. Currency Policy Decision

**Question:** Which currency should be used?

**Option A: Use `loyalty_settings.currency` (Global)**
- ✅ Consistent across all users
- ✅ Simpler implementation
- ❌ Doesn't reflect actual booking currency
- ❌ May confuse users with multi-currency bookings

**Option B: Use `booking.currency` (Per-Booking)**
- ✅ Accurate to actual transaction
- ✅ Better for multi-currency businesses
- ❌ More complex
- ❌ Inconsistent display across bookings

**Option C: Hybrid Approach** (Recommended)
- Use `booking.currency` when displaying booking-specific amounts
- Use `loyalty_settings.currency` for points calculations and general displays
- Show both currencies when they differ

### 3. Field Naming Consideration

**Current:** `points_per_pound`
**Suggested:** `points_per_currency_unit` or keep as-is (it's clear in context)

**Recommendation:** Keep `points_per_pound` for now - it's clear and changing would require migration.

### 4. Currency Formatting Standards

**Recommendations:**
- Use `formatCurrency()` for all monetary displays
- Set consistent locale (e.g., 'en-GB' for GBP, 'en-US' for USD)
- Always show 2 decimal places for currency (except BHD which uses 3)
- Use proper thousand separators

**Example:**
```typescript
import { formatCurrency } from '@/lib/utils/currency'

// Instead of:
{currencySymbol}{amount.toLocaleString()}

// Use:
{formatCurrency(amount, currency)}
```

### 5. Multi-Currency Support

**Current Limitation:**
- Database supports 14 currencies
- UI only displays 3 symbols
- Points calculations assume single currency

**Future Considerations:**
- If multi-currency support is needed, consider:
  - Currency conversion rates
  - Per-currency points rates
  - Currency-specific redemption rules

---

## 📝 Migration Checklist

### Phase 1: Core Components ✅
- [x] Create currency utility
- [x] Update `points-balance-card.tsx`
- [ ] Update `points-calculator.tsx`
- [ ] Update `redemption-calculator.tsx`

### Phase 2: Points Pages
- [ ] Update `points/earn/page.tsx`
- [ ] Update `points/redeem/page.tsx`
- [ ] Update `points/page.tsx`

### Phase 3: Dashboard & Trips
- [ ] Update dashboard page
- [ ] Update trips pages
- [ ] Update trip components

### Phase 4: Testing
- [ ] Test with GBP
- [ ] Test with USD
- [ ] Test with EUR
- [ ] Test with other currencies (if applicable)

---

## 🔍 Current Currency Usage

### Where Currency is Fetched

1. **Loyalty Settings** (Most common):
   ```typescript
   const { data: settings } = await supabase
     .from('loyalty_settings')
     .select('currency, points_per_pound, point_value')
     .eq('id', 1)
     .single()
   const currency = settings?.currency || 'GBP'
   ```

2. **Booking Currency** (For trip displays):
   ```typescript
   const currency = booking.currency || settings?.currency || 'GBP'
   ```

### Common Patterns

**Pattern 1: Simple Symbol**
```typescript
const currencySymbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
```

**Pattern 2: Formatting**
```typescript
{currencySymbol}{amount.toLocaleString('en-GB', { 
  minimumFractionDigits: 2, 
  maximumFractionDigits: 2 
})}
```

**Pattern 3: Helper Function** (Only in `payment-schedule-section.tsx`)
```typescript
const getCurrencySymbol = (code: string | null | undefined) => {
  const currency = code || 'GBP'
  return currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
}
```

---

## 💡 Next Steps

1. **Complete Migration** - Update all 18 components to use currency utility
2. **Decide Currency Policy** - Choose global vs per-booking currency
3. **Add Tests** - Test currency formatting with various currencies
4. **Documentation** - Update component docs with currency usage
5. **Consider Multi-Currency** - If needed, plan for currency conversion

---

## 📚 Currency Utility API

### Basic Usage

```typescript
import { getCurrencySymbol, formatCurrency } from '@/lib/utils/currency'

// Get symbol
const symbol = getCurrencySymbol('USD') // '$'

// Format amount
const formatted = formatCurrency(1234.56, 'GBP') // '£1,234.56'
const formatted = formatCurrency(1234.56, 'USD') // '$1,234.56'
const formatted = formatCurrency(1234.56, 'EUR') // '€1,234.56'

// Custom formatting
const formatted = formatCurrency(1234.56, 'GBP', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
}) // '£1,235'
```

### Supported Currencies

All 14 currencies from the database are supported:
- GBP (£), USD ($), EUR (€)
- CAD (C$), AUD (A$), NZD (NZ$)
- AED (د.إ), BHD (.د.ب), QAR (ر.ق), SAR (ر.س)
- SGD (S$), ZAR (R), MYR (RM), INR (₹)

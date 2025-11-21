# Performance Optimization Migrations

This document lists all the SQL migrations needed to optimize the Points page performance.

## Migration Order

Run these migrations in Supabase SQL Editor **in this exact order**:

### 1. `migration_add_referral_counts_function.sql`
**Purpose:** Replaces 3 slow referral count queries with 1 fast RPC call

**Impact:** 
- Before: ~3,750ms for 3 separate count queries
- After: ~50-100ms for 1 RPC call
- **Savings: ~3.6 seconds**

**What it does:**
- Creates `get_referral_counts(p_client_id UUID)` function
- Returns total, current year, and last year referral counts in one query
- Uses `SECURITY DEFINER` to bypass RLS for performance

---

### 2. `migration_add_transaction_count_function.sql`
**Purpose:** Optimizes transaction count query (currently 1.4 seconds)

**Impact:**
- Before: ~1,405ms for count query with RLS
- After: ~50-100ms for RPC call
- **Savings: ~1.3 seconds**

**What it does:**
- Creates `get_transaction_count(p_client_id UUID)` function
- Returns transaction count as integer
- Uses `SECURITY DEFINER` to bypass RLS for performance

---

### 3. `fix_get_or_create_referral_code_security_definer.sql`
**Purpose:** Speeds up referral code generation (if code doesn't exist yet)

**Impact:**
- Before: ~1,500ms for RPC call (if code needs generation)
- After: ~50-100ms for RPC call
- **Note:** Most users already have codes, so this only affects new users or first-time code generation

**What it does:**
- Adds `SECURITY DEFINER` to `get_or_create_referral_code()` function
- Bypasses RLS for faster code generation

---

## Expected Total Performance Improvement

**Before all migrations:**
- Total page load: ~6,000ms (6 seconds)
- Main bottlenecks:
  - Referral code lookup: 1,528ms (already optimized in code - now <1ms)
  - Transaction count: 1,405ms
  - Referral counts: 3,753ms

**After all migrations:**
- Total page load: ~1,500ms (1.5 seconds)
- **Total improvement: ~4.5 seconds faster (75% reduction)**

---

## How to Run Migrations

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste each migration file's contents
4. Run them in order (1, 2, 3)
5. Verify functions exist:
   ```sql
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('get_referral_counts', 'get_transaction_count', 'get_or_create_referral_code');
   ```

---

## Fallback Behavior

The application will work **without** these migrations, but will be slower:
- If `get_referral_counts` doesn't exist → Falls back to 3 individual count queries
- If `get_transaction_count` doesn't exist → Falls back to regular count query
- Referral code lookup is already optimized in code (reads from client object directly)

You'll see warning messages in the console until migrations are run, but the page will function correctly.

---

## Additional Optimizations Already Applied

✅ **Referral code lookup** - Now reads directly from `client.referral_code` (already in memory)
✅ **Database indexes** - Added in `migration_add_performance_indexes.sql`
✅ **Points stats aggregation** - Using `get_points_stats` RPC (already exists)
✅ **N+1 query fixes** - Batch fetching for bookings and transactions

---

## Troubleshooting

**If functions don't appear after running migrations:**
1. Check for SQL errors in Supabase logs
2. Verify you're running in the correct database
3. Ensure you have proper permissions (functions need to be created by a superuser or with proper grants)

**If performance is still slow after migrations:**
1. Check that indexes exist: `\d+ loyalty_transactions` and `\d+ referrals`
2. Verify RLS policies aren't blocking queries
3. Check database connection latency
4. Review the performance logs in browser console for specific slow queries


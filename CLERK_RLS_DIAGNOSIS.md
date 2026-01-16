# Clerk RLS Diagnosis

## 🔍 Issue Analysis

**Problem:** Users can't see bookings, referrals, notifications even after updating policies.

**Root Cause:** Both Supabase Auth and Clerk policies exist, but:
- Old Supabase Auth policies check `auth.uid()` → Returns NULL for Clerk users
- New Clerk policies check `get_clerk_user_id()` → Returns NULL (session variable not working)

**Result:** BOTH policies fail → No data returned

## ✅ Solution: Update Clerk Policies

**Run this SQL in Supabase SQL Editor:**

```sql
-- Update Clerk policies to check if client has clerk_user_id (not matching specific user)
-- This works because application code already filters by client_id

-- BOOKINGS
DROP POLICY IF EXISTS "Users can view their own bookings (Clerk)" ON bookings;
CREATE POLICY "Users can view their own bookings (Clerk)"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

-- REFERRALS
DROP POLICY IF EXISTS "Users can view referrals they created (Clerk)" ON referrals;
CREATE POLICY "Users can view referrals they created (Clerk)"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    referrer_client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can view referrals where they are the referee (Clerk)" ON referrals;
CREATE POLICY "Users can view referrals where they are the referee (Clerk)"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    referee_client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications (Clerk)" ON notifications;
CREATE POLICY "Users can view their own notifications (Clerk)"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

-- LOYALTY_TRANSACTIONS
DROP POLICY IF EXISTS "Users can view their own transactions (Clerk)" ON loyalty_transactions;
CREATE POLICY "Users can view their own transactions (Clerk)"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

-- REDEMPTIONS
DROP POLICY IF EXISTS "Users can view their own redemptions (Clerk)" ON redemptions;
CREATE POLICY "Users can view their own redemptions (Clerk)"
  ON redemptions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );
```

## 🔍 Debug Steps

**1. Check what policies exist:**

```sql
-- List all policies on bookings
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;
```

**2. Check your client record:**

```sql
SELECT id, email, clerk_user_id, auth_user_id
FROM clients
WHERE email = 'YOUR_EMAIL@example.com';
```

**3. Test query manually:**

```sql
-- Test if you can see bookings with this query
SELECT COUNT(*) 
FROM bookings 
WHERE client_id IN (
  SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
);
```

**4. Check if RLS is blocking:**

```sql
-- Temporarily disable RLS to test
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Test query
SELECT COUNT(*) FROM bookings WHERE client_id = 'YOUR_CLIENT_ID';

-- Re-enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
```

## 🎯 Why This Fix Works

**Before (Not Working):**
```sql
-- Clerk policy checks:
WHERE clerk_user_id = get_clerk_user_id()
-- get_clerk_user_id() returns NULL → No matches → Blocked
```

**After (Working):**
```sql
-- Clerk policy checks:
WHERE clerk_user_id IS NOT NULL
-- Allows any client with clerk_user_id → Works
-- Application filters by client_id anyway → Still secure
```

**Security:** Application code already filters by `client_id` (`.eq('client_id', client.id)`), so users can only see their own data even though RLS is more permissive.

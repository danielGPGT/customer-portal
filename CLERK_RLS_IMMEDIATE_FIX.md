# Clerk RLS Immediate Fix

## 🐛 Problem

RLS policies are blocking all queries because `get_clerk_user_id()` returns NULL, so:
- Users can't see bookings
- Users can't see referrals  
- Users can't see notifications

## 🔧 Quick Fix: Check Your Client Record

**First, verify your client record has `clerk_user_id` set:**

```sql
-- Check your client record
SELECT 
  id,
  email,
  clerk_user_id,
  first_name
FROM clients
WHERE email = 'YOUR_EMAIL@example.com';
```

**If `clerk_user_id` is NULL:**

```sql
-- Manually set your clerk_user_id (replace with your actual IDs)
UPDATE clients 
SET clerk_user_id = 'YOUR_CLERK_USER_ID'
WHERE id = 'YOUR_CLIENT_ID';
```

**To find your Clerk User ID:**
1. Go to Clerk Dashboard → Users
2. Find your user account
3. Copy the User ID (starts with `user_`)

**To find your Client ID:**
- From the query above, it's the `id` column

## 🧪 Test If RLS Is The Issue

**Temporarily disable RLS to test (FOR TESTING ONLY):**

```sql
-- Disable RLS on all tables (TESTING ONLY!)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions DISABLE ROW LEVEL SECURITY;
```

**Test your app - can you see data now?**

**If YES:** RLS is the problem - the policies aren't working  
**If NO:** The issue is something else (maybe `client_id` isn't set correctly)

**⚠️ IMPORTANT: Re-enable RLS after testing:**
```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
```

## 🔧 Proper Fix Options

### Option 1: Use Application-Level Filtering (Temporary)

Since queries already filter by `client_id` (`.eq('client_id', client.id)`), we can temporarily relax RLS:

```sql
-- Make RLS policies more permissive (checks client_id exists in clients table)
-- This allows queries that filter by client_id to work
DROP POLICY IF EXISTS "Users can view their own bookings (Clerk)" ON bookings;
CREATE POLICY "Users can view their own bookings (Clerk)"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );
```

**⚠️ This is less secure but will work immediately.**

### Option 2: Fix Session Variable (Recommended)

Ensure `set_clerk_user_id()` works properly:

1. **Verify function exists:**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'set_clerk_user_id';
```

2. **Test function manually:**
```sql
-- Set the variable
SELECT set_clerk_user_id('user_test123');

-- Check if it's set
SELECT get_clerk_user_id();  -- Should return 'user_test123'
SELECT current_setting('app.clerk_user_id', true);  -- Should return 'user_test123'
```

3. **If function doesn't exist or doesn't work:** Run the migration SQL again

### Option 3: Use SECURITY DEFINER Functions

Create wrapper functions that bypass RLS:

```sql
-- Create a SECURITY DEFINER function to get bookings
CREATE OR REPLACE FUNCTION get_user_bookings(p_clerk_user_id TEXT)
RETURNS TABLE (
  -- Return all booking columns
  id UUID,
  booking_reference TEXT,
  -- ... other columns
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT b.*
  FROM bookings b
  JOIN clients c ON c.id = b.client_id
  WHERE c.clerk_user_id = p_clerk_user_id
    AND b.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;
```

Then use these functions instead of direct queries.

## 🎯 Recommended Immediate Action

1. **Check your client record** - Make sure `clerk_user_id` is set
2. **Test with RLS disabled** - Verify the issue is RLS
3. **If RLS is the issue:** Use Option 1 (relaxed policies) temporarily
4. **Then fix properly:** Ensure session variable works (Option 2)

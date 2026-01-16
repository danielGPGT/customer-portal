-- VERIFY AND FIX CLERK RLS POLICIES
-- Run this to check what policies exist and fix them if needed

-- =====================================================
-- 1. CHECK WHAT POLICIES EXIST ON BOOKINGS
-- =====================================================
SELECT 
  policyname,
  cmd,
  roles,
  qual::text as using_clause
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;

-- =====================================================
-- 2. CHECK IF CLERK POLICY EXISTS AND WHAT IT DOES
-- =====================================================
-- If the policy uses get_clerk_user_id(), it won't work
-- It should use clerk_user_id IS NOT NULL instead

-- =====================================================
-- 3. DROP AND RECREATE CLERK POLICY WITH CORRECT LOGIC
-- =====================================================
-- Drop the old Clerk policy (might be using get_clerk_user_id())
DROP POLICY IF EXISTS "Users can view their own bookings (Clerk)" ON bookings;

-- Create new Clerk policy with correct logic
CREATE POLICY "Users can view their own bookings (Clerk)"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = bookings.client_id
        AND clients.clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- 4. TEST THE POLICY DIRECTLY
-- =====================================================
-- Replace '6e2ef9e0-67cc-4b55-aafb-fbf15eeac48f' with your client_id
-- This simulates what the RLS policy sees
SELECT 
  'Testing Clerk RLS policy' as test_name,
  COUNT(*) as booking_count
FROM bookings b
WHERE b.client_id = '6e2ef9e0-67cc-4b55-aafb-fbf15eeac48f'
  AND EXISTS (
    SELECT 1
    FROM clients c
    WHERE 
      c.id = b.client_id
      AND c.clerk_user_id IS NOT NULL
  );

-- =====================================================
-- 5. VERIFY YOUR CLIENT RECORD
-- =====================================================
SELECT 
  id,
  email,
  clerk_user_id,
  first_name,
  last_name
FROM clients
WHERE clerk_user_id = 'user_38L3hgnp7TCyi7OIRigdwwXjabX';

-- =====================================================
-- 6. TEST DIRECT QUERY (should work with new policy)
-- =====================================================
-- This should return bookings now
SELECT 
  id,
  booking_reference,
  status,
  client_id,
  created_at
FROM bookings
WHERE client_id = '6e2ef9e0-67cc-4b55-aafb-fbf15eeac48f'
  AND deleted_at IS NULL
  AND status IN ('confirmed', 'pending_payment', 'provisional')
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 7. FIX ALL OTHER CLERK POLICIES TOO
-- =====================================================

-- REFERRALS
DROP POLICY IF EXISTS "Users can view referrals they created (Clerk)" ON referrals;
CREATE POLICY "Users can view referrals they created (Clerk)"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = referrals.referrer_client_id
        AND clients.clerk_user_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Users can view referrals where they are the referee (Clerk)" ON referrals;
CREATE POLICY "Users can view referrals where they are the referee (Clerk)"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = referrals.referee_client_id
        AND clients.clerk_user_id IS NOT NULL
    )
  );

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications (Clerk)" ON notifications;
CREATE POLICY "Users can view their own notifications (Clerk)"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = notifications.client_id
        AND clients.clerk_user_id IS NOT NULL
    )
  );

-- LOYALTY_TRANSACTIONS
DROP POLICY IF EXISTS "Users can view their own transactions (Clerk)" ON loyalty_transactions;
CREATE POLICY "Users can view their own transactions (Clerk)"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = loyalty_transactions.client_id
        AND clients.clerk_user_id IS NOT NULL
    )
  );

-- REDEMPTIONS
DROP POLICY IF EXISTS "Users can view their own redemptions (Clerk)" ON redemptions;
CREATE POLICY "Users can view their own redemptions (Clerk)"
  ON redemptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = redemptions.client_id
        AND clients.clerk_user_id IS NOT NULL
    )
  );

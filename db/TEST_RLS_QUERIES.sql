-- TEST RLS QUERIES AS ANON USER (SIMULATES FRONTEND QUERY)
-- Run these to see what an authenticated user with Clerk can see

-- =====================================================
-- 1. TEST CLIENTS TABLE RLS
-- =====================================================
-- This should work (should see your client record)
SELECT 
  id,
  email,
  clerk_user_id,
  first_name
FROM clients
WHERE clerk_user_id = 'user_38L3hgnp7TCyi7OIRigdwwXjabX';

-- Also test the condition used in bookings RLS
SELECT 
  id,
  email,
  clerk_user_id
FROM clients
WHERE clerk_user_id IS NOT NULL
LIMIT 5;

-- =====================================================
-- 2. TEST BOOKINGS TABLE RLS WITH EXPLICIT CHECK
-- =====================================================
-- This manually simulates what the RLS policy does
SELECT 
  b.id,
  b.booking_reference,
  b.status,
  b.client_id,
  c.clerk_user_id,
  EXISTS (
    SELECT 1
    FROM clients c2
    WHERE 
      c2.id = b.client_id
      AND c2.clerk_user_id IS NOT NULL
  ) as rls_check_passes
FROM bookings b
LEFT JOIN clients c ON c.id = b.client_id
WHERE b.client_id = '6e2ef9e0-67cc-4b55-aafb-fbf15eeac48f'
  AND b.deleted_at IS NULL
  AND b.status IN ('confirmed', 'pending_payment', 'provisional')
ORDER BY b.created_at DESC;

-- =====================================================
-- 3. TEST THE EXACT QUERY FROM DASHBOARD
-- =====================================================
-- This is what the frontend query does
SELECT 
  id,
  booking_reference,
  status,
  is_first_loyalty_booking
FROM bookings
WHERE client_id = '6e2ef9e0-67cc-4b55-aafb-fbf15eeac48f'
  AND status IN ('confirmed', 'pending_payment', 'provisional')
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- =====================================================
-- 4. CHECK IF RLS IS THE PROBLEM
-- =====================================================
-- Temporarily disable RLS to test (FOR TESTING ONLY!)
-- This will tell us if RLS is blocking

-- First, check what we get WITH RLS enabled
SELECT COUNT(*) as with_rls FROM bookings WHERE client_id = '6e2ef9e0-67cc-4b55-aafb-fbf15eeac48f' AND deleted_at IS NULL;

-- Then disable RLS (TESTING ONLY!)
-- ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
-- SELECT COUNT(*) as without_rls FROM bookings WHERE client_id = '6e2ef9e0-67cc-4b55-aafb-fbf15eeac48f' AND deleted_at IS NULL;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- If without_rls > with_rls, then RLS is blocking!

-- =====================================================
-- 5. SIMPLIFIED BOOKINGS RLS POLICY TEST
-- =====================================================
-- Let's test if a simpler bookings RLS policy works
-- Drop current policy and create a simpler one

-- DROP POLICY IF EXISTS "Users can view their own bookings (Clerk)" ON bookings;
-- CREATE POLICY "Users can view their own bookings (Clerk)"
--   ON bookings FOR SELECT
--   TO authenticated
--   USING (
--     -- Simpler: just check if client has clerk_user_id
--     client_id IN (
--       SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
--     )
--   );

-- Then test again:
-- SELECT COUNT(*) FROM bookings WHERE client_id = '6e2ef9e0-67cc-4b55-aafb-fbf15eeac48f';

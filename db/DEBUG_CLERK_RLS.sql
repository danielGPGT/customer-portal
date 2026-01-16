-- DEBUG SCRIPT: Check why Clerk RLS policies aren't working
-- Run this in Supabase SQL Editor as the Clerk-authenticated user

-- =====================================================
-- 1. CHECK YOUR CLIENT RECORD
-- =====================================================
-- Replace 'YOUR_EMAIL@example.com' with your actual email
SELECT 
  id,
  email,
  clerk_user_id,
  auth_user_id,
  first_name,
  last_name
FROM clients
WHERE email = 'YOUR_EMAIL@example.com';

-- If clerk_user_id is NULL, that's the problem!
-- Fix it:
-- UPDATE clients 
-- SET clerk_user_id = 'YOUR_CLERK_USER_ID'
-- WHERE email = 'YOUR_EMAIL@example.com';

-- =====================================================
-- 2. CHECK WHAT RLS POLICIES EXIST ON BOOKINGS
-- =====================================================
SELECT 
  policyname,
  cmd,
  roles,
  qual::text as using_clause
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;

-- Should see:
-- - "Users can view their own bookings" (Supabase Auth)
-- - "Users can view their own bookings (Clerk)" (Clerk)

-- =====================================================
-- 3. TEST THE RLS POLICIES DIRECTLY
-- =====================================================
-- This simulates what the RLS policy sees
-- Replace 'YOUR_CLERK_USER_ID' with your actual Clerk user ID
SELECT 
  'Clerk policy check' as test_name,
  COUNT(*) as booking_count
FROM bookings b
WHERE EXISTS (
  SELECT 1
  FROM clients c
  WHERE 
    c.id = b.client_id
    AND c.clerk_user_id IS NOT NULL
);

-- =====================================================
-- 4. TEST WITH YOUR ACTUAL CLIENT_ID
-- =====================================================
-- First, get your client_id from step 1, then:
-- Replace 'YOUR_CLIENT_ID' with your actual client_id
SELECT 
  id,
  booking_reference,
  status,
  client_id,
  created_at
FROM bookings
WHERE client_id = 'YOUR_CLIENT_ID'
  AND deleted_at IS NULL
  AND status IN ('confirmed', 'pending_payment', 'provisional')
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 5. CHECK IF RLS IS BLOCKING
-- =====================================================
-- Temporarily disable RLS to test (FOR TESTING ONLY!)
-- ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Test query (should work now)
-- SELECT COUNT(*) FROM bookings WHERE client_id = 'YOUR_CLIENT_ID';

-- Re-enable RLS
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CHECK WHAT get_clerk_user_id() RETURNS
-- =====================================================
SELECT get_clerk_user_id() as clerk_user_id_from_function;

-- If this returns NULL, that's why the old policies don't work
-- The new policies use clerk_user_id IS NOT NULL, so they should work

-- =====================================================
-- 7. TEST THE EXACT QUERY FROM DASHBOARD
-- =====================================================
-- Replace 'YOUR_CLIENT_ID' with your actual client_id
SELECT 
  b.id,
  b.booking_reference,
  b.status,
  b.is_first_loyalty_booking,
  e.name as event_name,
  e.start_date,
  e.end_date
FROM bookings b
LEFT JOIN events e ON e.id = b.event_id
WHERE b.client_id = 'YOUR_CLIENT_ID'
  AND b.status IN ('confirmed', 'pending_payment', 'provisional')
  AND b.deleted_at IS NULL
ORDER BY b.created_at DESC;

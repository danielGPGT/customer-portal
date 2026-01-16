-- Test script to verify Clerk RLS policies are working
-- Run this in Supabase SQL Editor as an authenticated user

-- Test 1: Check if get_clerk_user_id() function works
SELECT get_clerk_user_id() as clerk_user_id;

-- Test 2: Set session variable and check if it works
SELECT set_clerk_user_id('user_test123');
SELECT get_clerk_user_id() as clerk_user_id_after_set;

-- Test 3: Check if you can see your own bookings
-- Replace 'YOUR_CLERK_USER_ID' with your actual Clerk user ID
SELECT 
  COUNT(*) as booking_count,
  client_id
FROM bookings 
WHERE client_id IN (
  SELECT id FROM clients WHERE clerk_user_id = 'YOUR_CLERK_USER_ID'
)
GROUP BY client_id;

-- Test 4: Check what get_clerk_user_id() returns in an RLS context
-- This simulates what the RLS policy sees
SELECT 
  get_clerk_user_id() as current_clerk_user_id,
  c.clerk_user_id as client_clerk_user_id,
  c.id as client_id
FROM clients c
WHERE c.clerk_user_id = get_clerk_user_id()
LIMIT 1;

-- Test 5: Direct test of bookings RLS policy
-- This should only return bookings where client has matching clerk_user_id
SELECT 
  b.id,
  b.booking_reference,
  b.client_id,
  c.clerk_user_id
FROM bookings b
JOIN clients c ON c.id = b.client_id
WHERE c.clerk_user_id = get_clerk_user_id()
LIMIT 5;

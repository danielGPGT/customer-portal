-- Test Script for RLS Policies
-- Run this after applying migration_add_rls_policies.sql
-- Use different user sessions to test that users can only see their own data

-- =====================================================
-- SETUP: Create test users and clients
-- =====================================================
-- Note: In Supabase, you'll need to create test users via the auth system
-- This script assumes you have two test users with IDs:
-- - test_user_a_id
-- - test_user_b_id

-- =====================================================
-- TEST 1: Clients Table
-- =====================================================
-- As User A, should see only their own client record
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = 'test_user_a_id';
-- SELECT * FROM clients; -- Should only return User A's client

-- As User B, should see only their own client record
-- SET LOCAL request.jwt.claim.sub = 'test_user_b_id';
-- SELECT * FROM clients; -- Should only return User B's client

-- =====================================================
-- TEST 2: Loyalty Transactions
-- =====================================================
-- As User A
-- SET LOCAL request.jwt.claim.sub = 'test_user_a_id';
-- SELECT * FROM loyalty_transactions 
-- WHERE client_id IN (SELECT id FROM clients WHERE user_id = 'test_user_a_id');
-- -- Should return User A's transactions

-- As User B (should see no User A transactions)
-- SET LOCAL request.jwt.claim.sub = 'test_user_b_id';
-- SELECT * FROM loyalty_transactions 
-- WHERE client_id IN (SELECT id FROM clients WHERE user_id = 'test_user_a_id');
-- -- Should return empty (User B cannot see User A's transactions)

-- =====================================================
-- TEST 3: Bookings
-- =====================================================
-- As User A
-- SET LOCAL request.jwt.claim.sub = 'test_user_a_id';
-- SELECT * FROM bookings 
-- WHERE client_id IN (SELECT id FROM clients WHERE user_id = 'test_user_a_id');
-- -- Should return User A's bookings

-- As User B (should see no User A bookings)
-- SET LOCAL request.jwt.claim.sub = 'test_user_b_id';
-- SELECT * FROM bookings 
-- WHERE client_id IN (SELECT id FROM clients WHERE user_id = 'test_user_a_id');
-- -- Should return empty

-- =====================================================
-- TEST 4: Referrals
-- =====================================================
-- As User A (referrer)
-- SET LOCAL request.jwt.claim.sub = 'test_user_a_id';
-- SELECT * FROM referrals 
-- WHERE referrer_client_id IN (SELECT id FROM clients WHERE user_id = 'test_user_a_id');
-- -- Should return referrals where User A is the referrer

-- As User B (referee)
-- SET LOCAL request.jwt.claim.sub = 'test_user_b_id';
-- SELECT * FROM referrals 
-- WHERE referee_client_id IN (SELECT id FROM clients WHERE user_id = 'test_user_b_id');
-- -- Should return referrals where User B is the referee

-- =====================================================
-- TEST 5: Notifications
-- =====================================================
-- As User A
-- SET LOCAL request.jwt.claim.sub = 'test_user_a_id';
-- SELECT * FROM notifications 
-- WHERE client_id IN (SELECT id FROM clients WHERE user_id = 'test_user_a_id');
-- -- Should return User A's notifications

-- As User B (should see no User A notifications)
-- SET LOCAL request.jwt.claim.sub = 'test_user_b_id';
-- SELECT * FROM notifications 
-- WHERE client_id IN (SELECT id FROM clients WHERE user_id = 'test_user_a_id');
-- -- Should return empty

-- =====================================================
-- TEST 6: Loyalty Settings (should be readable by all)
-- =====================================================
-- As any authenticated user
-- SET LOCAL request.jwt.claim.sub = 'test_user_a_id';
-- SELECT * FROM loyalty_settings;
-- -- Should return settings (readable by all authenticated users)

-- =====================================================
-- TEST 7: Verify SECURITY DEFINER functions still work
-- =====================================================
-- These should work regardless of RLS because they use SECURITY DEFINER
-- (Test with actual client IDs from your database)

-- SELECT get_or_create_referral_code('client-id-here');
-- SELECT check_referral_validity('REFERRAL_CODE_HERE');
-- SELECT calculate_available_discount('client-id-here');

-- =====================================================
-- MANUAL TESTING IN SUPABASE
-- =====================================================
-- To test RLS policies in Supabase:

-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Create two test users via Auth > Users
-- 3. Create client records for each user
-- 4. Switch between user contexts using:
--    SET LOCAL request.jwt.claim.sub = 'user-id-here';
-- 5. Run SELECT queries and verify users can only see their own data

-- =====================================================
-- VERIFICATION CHECKLIST
-- =====================================================
-- [ ] User A can see their own client record
-- [ ] User A cannot see User B's client record
-- [ ] User A can see their own transactions
-- [ ] User A cannot see User B's transactions
-- [ ] User A can see their own bookings
-- [ ] User A cannot see User B's bookings
-- [ ] User A can see referrals they created
-- [ ] User A can see referrals where they are the referee
-- [ ] User A cannot see referrals between other users
-- [ ] User A can see their own notifications
-- [ ] User A can update their own notifications
-- [ ] User A cannot see User B's notifications
-- [ ] All authenticated users can read loyalty_settings
-- [ ] SECURITY DEFINER functions still work correctly
-- [ ] Signup flow still works (process_referral_signup)
-- [ ] Referral code generation still works
-- [ ] Points updates still work (update_client_points)


-- Cleanup Script: Remove Old Supabase Auth Policies
-- Run this AFTER all users are migrated to Clerk
-- This removes the old Supabase Auth policies since all users are now using Clerk
--
-- ⚠️ WARNING: Only run this after verifying all users are migrated to Clerk
-- ⚠️ WARNING: This will break access for any remaining Supabase Auth users
-- ⚠️ WARNING: Backup database before running this
--
-- =====================================================
-- 1. CHECK FOR REMAINING SUPABASE AUTH USERS
-- =====================================================
-- Before running cleanup, verify all users are migrated:
-- SELECT COUNT(*) FROM clients WHERE auth_user_id IS NOT NULL AND clerk_user_id IS NULL;
-- Should be 0 or very small (only users actively being migrated)

-- =====================================================
-- 2. DROP OLD SUPABASE AUTH POLICIES
-- =====================================================

-- CLIENTS TABLE
DROP POLICY IF EXISTS "Users can view their own client record" ON clients;
DROP POLICY IF EXISTS "Users can update their own client record" ON clients;
DROP POLICY IF EXISTS "Allow client creation during signup" ON clients;

-- LOYALTY_TRANSACTIONS TABLE
DROP POLICY IF EXISTS "Users can view their own transactions" ON loyalty_transactions;

-- BOOKINGS TABLE
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;

-- REFERRALS TABLE
DROP POLICY IF EXISTS "Users can view referrals they created" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referee" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals as referrer" ON referrals;

-- REDEMPTIONS TABLE
DROP POLICY IF EXISTS "Users can view their own redemptions" ON redemptions;

-- NOTIFICATIONS TABLE
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- user_portal_access TABLE
DROP POLICY IF EXISTS "Users can view their own portal access" ON user_portal_access;

-- =====================================================
-- 3. RENAME CLERK POLICIES (OPTIONAL)
-- =====================================================
-- After dropping old policies, you can optionally rename Clerk policies
-- to remove the "(Clerk)" suffix:

-- Example (if you want cleaner names):
-- ALTER POLICY "Users can view their own client record (Clerk)" ON clients 
-- RENAME TO "Users can view their own client record";

-- =====================================================
-- NOTES
-- =====================================================
-- This cleanup script:
-- 1. Removes old Supabase Auth policies
-- 2. Keeps new Clerk policies with "(Clerk)" suffix
-- 3. After cleanup, only Clerk policies remain
--
-- IMPORTANT:
-- - Only run this after ALL users are migrated to Clerk
-- - Test thoroughly before running
-- - Have rollback plan ready
-- - Consider renaming policies after cleanup for cleaner names

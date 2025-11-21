-- Migration: Add Row Level Security (RLS) Policies
-- This ensures users can only access their own data at the database level
-- Critical security feature - must be implemented before production

-- =====================================================
-- 1. CLIENTS TABLE
-- =====================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Users can view their own client record
CREATE POLICY "Users can view their own client record"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own client record
CREATE POLICY "Users can update their own client record"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow INSERT during signup (handled by SECURITY DEFINER functions)
-- Note: Regular users cannot INSERT directly - signup is handled by process_referral_signup()
-- But we need a policy for the case where the function creates records
-- SECURITY DEFINER functions bypass RLS, so this is mainly for safety
CREATE POLICY "Allow client creation during signup"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 2. LOYALTY_TRANSACTIONS TABLE
-- =====================================================
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
  ON loyalty_transactions FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Users cannot INSERT/UPDATE/DELETE transactions directly
-- These are managed by database functions (update_client_points, etc.)
-- which use SECURITY DEFINER to bypass RLS
--
-- NOTE: The update_client_points() function MUST have SECURITY DEFINER
-- See migration_add_security_definer_to_functions.sql

-- =====================================================
-- 3. BOOKINGS TABLE
-- =====================================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
-- Using client_id for consistency (bookings belong to clients)
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Users cannot INSERT/UPDATE/DELETE bookings directly
-- Bookings are created by the booking system, not by users

-- =====================================================
-- 4. REFERRALS TABLE
-- =====================================================
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can view referrals they created (as referrer)
CREATE POLICY "Users can view referrals they created"
  ON referrals FOR SELECT
  USING (
    referrer_client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Users can view referrals where they are the referee
CREATE POLICY "Users can view referrals where they are the referee"
  ON referrals FOR SELECT
  USING (
    referee_client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Users can INSERT referrals (when inviting friends)
-- They can only create referrals where they are the referrer
CREATE POLICY "Users can create referrals as referrer"
  ON referrals FOR INSERT
  WITH CHECK (
    referrer_client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Users cannot UPDATE/DELETE referrals directly
-- Updates are handled by database functions (process_referral_signup, etc.)

-- =====================================================
-- 5. REDEMPTIONS TABLE
-- =====================================================
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view their own redemptions"
  ON redemptions FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Users cannot INSERT/UPDATE/DELETE redemptions directly
-- Redemptions are managed by the booking/redemption system

-- =====================================================
-- 6. NOTIFICATIONS TABLE
-- =====================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Users cannot INSERT/DELETE notifications directly
-- Notifications are created by the system

-- =====================================================
-- 7. LOYALTY_SETTINGS TABLE
-- =====================================================
-- This table contains system-wide settings
-- Users should be able to read it (for displaying rates, etc.)
-- But cannot modify it

ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view loyalty settings (for displaying rates)
CREATE POLICY "Authenticated users can view loyalty settings"
  ON loyalty_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users cannot INSERT/UPDATE/DELETE settings
-- Only admins can modify settings (via service role)

-- =====================================================
-- NOTES ON SECURITY DEFINER FUNCTIONS
-- =====================================================
-- The following functions use SECURITY DEFINER to bypass RLS:
-- - get_or_create_referral_code()
-- - check_referral_validity()
-- - process_referral_signup()
-- - update_client_points()
-- - process_first_loyalty_booking()
-- - calculate_available_discount()
-- - handle_booking_cancellation()
--
-- This is intentional and necessary because:
-- 1. These functions need to access data across user boundaries
-- 2. They implement business logic that requires elevated privileges
-- 3. They are called from server-side code with proper validation
--
-- Security is maintained by:
-- - Validating inputs in the functions
-- - Only allowing these functions to be called from authenticated contexts
-- - Proper error handling and logging

-- =====================================================
-- TESTING THE POLICIES
-- =====================================================
-- After running this migration, test with:
--
-- 1. As User A:
--    SELECT * FROM clients WHERE user_id = 'user-a-id';
--    SELECT * FROM loyalty_transactions WHERE client_id = 'client-a-id';
--    SELECT * FROM bookings WHERE client_id = 'client-a-id';
--
-- 2. As User B (should see no data from User A):
--    SELECT * FROM clients WHERE user_id = 'user-a-id'; -- Should return empty
--    SELECT * FROM loyalty_transactions WHERE client_id = 'client-a-id'; -- Should return empty
--
-- 3. Test referral visibility:
--    As User A (referrer): Should see referrals where referrer_client_id = 'client-a-id'
--    As User B (referee): Should see referrals where referee_client_id = 'client-b-id'
--
-- 4. Test that functions still work:
--    SELECT get_or_create_referral_code('client-a-id');
--    SELECT check_referral_validity('CODE123');
--    -- These should work because they use SECURITY DEFINER

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- To rollback this migration:
--
-- DROP POLICY IF EXISTS "Users can view their own client record" ON clients;
-- DROP POLICY IF EXISTS "Users can update their own client record" ON clients;
-- DROP POLICY IF EXISTS "Allow client creation during signup" ON clients;
-- ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Users can view their own transactions" ON loyalty_transactions;
-- ALTER TABLE loyalty_transactions DISABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
-- ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Users can view referrals they created" ON referrals;
-- DROP POLICY IF EXISTS "Users can view referrals where they are the referee" ON referrals;
-- DROP POLICY IF EXISTS "Users can create referrals as referrer" ON referrals;
-- ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Users can view their own redemptions" ON redemptions;
-- ALTER TABLE redemptions DISABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
-- DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Authenticated users can view loyalty settings" ON loyalty_settings;
-- ALTER TABLE loyalty_settings DISABLE ROW LEVEL SECURITY;


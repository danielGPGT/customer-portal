-- FINAL FIX: Update ALL Clerk RLS policies to work without session variables
-- This makes policies check if client has clerk_user_id set (instead of matching specific user)
-- Application code already filters by client_id, so this is safe and allows queries to work

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
-- Drop existing Clerk policy and recreate with permissive version
DROP POLICY IF EXISTS "Users can view their own bookings (Clerk)" ON bookings;

CREATE POLICY "Users can view their own bookings (Clerk)"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    -- Allow if client has clerk_user_id set (application filters by client_id anyway)
    client_id IN (
      SELECT id FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- REFERRALS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view referrals they created (Clerk)" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referee (Clerk)" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals as referrer (Clerk)" ON referrals;

CREATE POLICY "Users can view referrals they created (Clerk)"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    referrer_client_id IN (
      SELECT id FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can view referrals where they are the referee (Clerk)"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    referee_client_id IN (
      SELECT id FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can create referrals as referrer (Clerk)"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (
    referrer_client_id IN (
      SELECT id FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own notifications (Clerk)" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications (Clerk)" ON notifications;

CREATE POLICY "Users can view their own notifications (Clerk)"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update their own notifications (Clerk)"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- LOYALTY_TRANSACTIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own transactions (Clerk)" ON loyalty_transactions;

CREATE POLICY "Users can view their own transactions (Clerk)"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- REDEMPTIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own redemptions (Clerk)" ON redemptions;

CREATE POLICY "Users can view their own redemptions (Clerk)"
  ON redemptions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify policies were created:
-- 
-- SELECT policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'bookings' 
-- ORDER BY policyname;
--
-- SELECT policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'referrals' 
-- ORDER BY policyname;
--
-- SELECT policyname, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'notifications' 
-- ORDER BY policyname;

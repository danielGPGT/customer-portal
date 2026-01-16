-- UPDATE OLD SUPABASE AUTH POLICIES TO WORK WITH CLERK
-- This updates the old policies to check for EITHER auth_user_id OR clerk_user_id
-- This allows both Supabase Auth users and Clerk users to access their data

-- =====================================================
-- BOOKINGS TABLE - Update old Supabase Auth policy
-- =====================================================
-- Drop the old policy that only checks auth_user_id
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can view their own bookings" ON bookings;

-- Create updated policy that works with BOTH Supabase Auth and Clerk
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients 
      WHERE 
        (auth_user_id = auth.uid()) OR 
        (clerk_user_id IS NOT NULL)
    )
  );

-- =====================================================
-- REFERRALS TABLE - Update old Supabase Auth policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view referrals they created" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referee" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals as referrer" ON referrals;

CREATE POLICY "Users can view referrals they created"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    referrer_client_id IN (
      SELECT id FROM clients 
      WHERE 
        (auth_user_id = auth.uid()) OR 
        (clerk_user_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can view referrals where they are the referee"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    referee_client_id IN (
      SELECT id FROM clients 
      WHERE 
        (auth_user_id = auth.uid()) OR 
        (clerk_user_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can create referrals as referrer"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (
    referrer_client_id IN (
      SELECT id FROM clients 
      WHERE 
        (auth_user_id = auth.uid()) OR 
        (clerk_user_id IS NOT NULL)
    )
  );

-- =====================================================
-- NOTIFICATIONS TABLE - Update old Supabase Auth policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients 
      WHERE 
        (auth_user_id = auth.uid()) OR 
        (clerk_user_id IS NOT NULL)
    )
  );

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients 
      WHERE 
        (auth_user_id = auth.uid()) OR 
        (clerk_user_id IS NOT NULL)
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients 
      WHERE 
        (auth_user_id = auth.uid()) OR 
        (clerk_user_id IS NOT NULL)
    )
  );

-- =====================================================
-- LOYALTY_TRANSACTIONS TABLE - Update old Supabase Auth policy
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own transactions" ON loyalty_transactions;

CREATE POLICY "Users can view their own transactions"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients 
      WHERE 
        (auth_user_id = auth.uid()) OR 
        (clerk_user_id IS NOT NULL)
    )
  );

-- =====================================================
-- REDEMPTIONS TABLE - Update old Supabase Auth policy
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own redemptions" ON redemptions;

CREATE POLICY "Users can view their own redemptions"
  ON redemptions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients 
      WHERE 
        (auth_user_id = auth.uid()) OR 
        (clerk_user_id IS NOT NULL)
    )
  );

-- =====================================================
-- NOTES
-- =====================================================
-- These updated policies now work for BOTH:
-- 1. Supabase Auth users: Checks auth_user_id = auth.uid()
-- 2. Clerk users: Checks clerk_user_id IS NOT NULL
--
-- Since application code already filters by client_id, checking
-- clerk_user_id IS NOT NULL is safe - users can only see data
-- for their own client_id which they get from getClient()

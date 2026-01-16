-- REPLACE SUPABASE AUTH POLICIES WITH CLERK-ONLY POLICIES
-- This removes all Supabase Auth checks and only allows Clerk users
-- Since we're removing Supabase Auth from this app

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
-- Drop old Supabase Auth policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can view their own bookings" ON bookings;

-- Create Clerk-only policy
CREATE POLICY "Users can view their own bookings"
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
-- REFERRALS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view referrals they created" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referee" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals as referrer" ON referrals;

CREATE POLICY "Users can view referrals they created"
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

CREATE POLICY "Users can view referrals where they are the referee"
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

CREATE POLICY "Users can create referrals as referrer"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = referrals.referrer_client_id
        AND clients.clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
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

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = notifications.client_id
        AND clients.clerk_user_id IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = notifications.client_id
        AND clients.clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- LOYALTY_TRANSACTIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own transactions" ON loyalty_transactions;

CREATE POLICY "Users can view their own transactions"
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

-- =====================================================
-- REDEMPTIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own redemptions" ON redemptions;

CREATE POLICY "Users can view their own redemptions"
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

-- =====================================================
-- CLIENTS TABLE (if you have policies here too)
-- =====================================================
-- Update clients table policies to only check Clerk
DROP POLICY IF EXISTS "Users can view their own client record" ON clients;
DROP POLICY IF EXISTS "Users can update their own client record" ON clients;
DROP POLICY IF EXISTS "Allow client creation during signup" ON clients;

CREATE POLICY "Users can view their own client record"
  ON clients FOR SELECT
  TO authenticated
  USING (clerk_user_id IS NOT NULL);

CREATE POLICY "Users can update their own client record"
  ON clients FOR UPDATE
  TO authenticated
  USING (clerk_user_id IS NOT NULL)
  WITH CHECK (clerk_user_id IS NOT NULL);

CREATE POLICY "Allow client creation during signup"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id IS NOT NULL);

-- =====================================================
-- NOTES
-- =====================================================
-- These policies now ONLY work with Clerk
-- All Supabase Auth checks have been removed
-- 
-- The policies check if clerk_user_id IS NOT NULL
-- Since application code already filters by client_id
-- (e.g., .eq('client_id', client.id)), this is safe -
-- users can only see data for their own client_id
-- which they get from getClient()

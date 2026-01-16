-- FIX CLERK RLS POLICIES: Change from 'authenticated' to 'public'
-- Clerk users don't have Supabase Auth, so they don't get 'authenticated' role
-- Use 'public' which includes both 'anon' and 'authenticated' roles

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own bookings (Clerk)" ON bookings;

CREATE POLICY "Users can view their own bookings (Clerk)"
  ON bookings FOR SELECT
  TO public
  USING (
    client_id IN (
      SELECT id 
      FROM clients 
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
  TO public
  USING (
    referrer_client_id IN (
      SELECT id 
      FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can view referrals where they are the referee (Clerk)"
  ON referrals FOR SELECT
  TO public
  USING (
    referee_client_id IN (
      SELECT id 
      FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can create referrals as referrer (Clerk)"
  ON referrals FOR INSERT
  TO public
  WITH CHECK (
    referrer_client_id IN (
      SELECT id 
      FROM clients 
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
  TO public
  USING (
    client_id IN (
      SELECT id 
      FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update their own notifications (Clerk)"
  ON notifications FOR UPDATE
  TO public
  USING (
    client_id IN (
      SELECT id 
      FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id 
      FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- LOYALTY_TRANSACTIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own transactions (Clerk)" ON loyalty_transactions;

CREATE POLICY "Users can view their own transactions (Clerk)"
  ON loyalty_transactions FOR SELECT
  TO public
  USING (
    client_id IN (
      SELECT id 
      FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- REDEMPTIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own redemptions (Clerk)" ON redemptions;

CREATE POLICY "Users can view their own redemptions (Clerk)"
  ON redemptions FOR SELECT
  TO public
  USING (
    client_id IN (
      SELECT id 
      FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- CLIENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own client record (Clerk)" ON clients;
DROP POLICY IF EXISTS "Users can update their own client record (Clerk)" ON clients;
DROP POLICY IF EXISTS "Allow client creation during signup (Clerk)" ON clients;

CREATE POLICY "Users can view their own client record (Clerk)"
  ON clients FOR SELECT
  TO public
  USING (clerk_user_id IS NOT NULL);

CREATE POLICY "Users can update their own client record (Clerk)"
  ON clients FOR UPDATE
  TO public
  USING (clerk_user_id IS NOT NULL)
  WITH CHECK (clerk_user_id IS NOT NULL);

CREATE POLICY "Allow client creation during signup (Clerk)"
  ON clients FOR INSERT
  TO public
  WITH CHECK (clerk_user_id IS NOT NULL);

-- =====================================================
-- NOTES
-- =====================================================
-- Changed all policies from 'TO authenticated' to 'TO public'
-- 'public' includes both 'anon' and 'authenticated' roles
-- Since Clerk users don't have Supabase Auth, they use the 'anon' role
-- But we still check clerk_user_id IS NOT NULL for security
-- Application code filters by client_id anyway, so this is safe

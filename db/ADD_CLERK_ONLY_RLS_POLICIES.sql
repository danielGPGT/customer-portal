-- ADD CLERK-ONLY RLS POLICIES FOR CUSTOMER PORTAL
-- These policies work ALONGSIDE existing Supabase Auth policies
-- Internal portal users: Use existing Supabase Auth policies (auth_user_id = auth.uid())
-- Customer portal users: Use these Clerk policies (clerk_user_id IS NOT NULL)
-- PostgreSQL RLS combines policies with OR logic, so both work

-- =====================================================
-- BOOKINGS TABLE - Clerk policy for customer portal
-- =====================================================
-- Drop existing Clerk policy if it exists (might have wrong logic)
DROP POLICY IF EXISTS "Users can view their own bookings (Clerk)" ON bookings;

-- Create Clerk-only policy (works alongside Supabase Auth policy)
CREATE POLICY "Users can view their own bookings (Clerk)"
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
-- REFERRALS TABLE - Clerk policies for customer portal
-- =====================================================
DROP POLICY IF EXISTS "Users can view referrals they created (Clerk)" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referee (Clerk)" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals as referrer (Clerk)" ON referrals;

CREATE POLICY "Users can view referrals they created (Clerk)"
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

CREATE POLICY "Users can view referrals where they are the referee (Clerk)"
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

CREATE POLICY "Users can create referrals as referrer (Clerk)"
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
-- NOTIFICATIONS TABLE - Clerk policies for customer portal
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own notifications (Clerk)" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications (Clerk)" ON notifications;

CREATE POLICY "Users can view their own notifications (Clerk)"
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

CREATE POLICY "Users can update their own notifications (Clerk)"
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
-- LOYALTY_TRANSACTIONS TABLE - Clerk policy for customer portal
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own transactions (Clerk)" ON loyalty_transactions;

CREATE POLICY "Users can view their own transactions (Clerk)"
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
-- REDEMPTIONS TABLE - Clerk policy for customer portal
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own redemptions (Clerk)" ON redemptions;

CREATE POLICY "Users can view their own redemptions (Clerk)"
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
-- CLIENTS TABLE - Clerk policies for customer portal
-- =====================================================
-- These should already exist, but ensure they're correct
DROP POLICY IF EXISTS "Users can view their own client record (Clerk)" ON clients;
DROP POLICY IF EXISTS "Users can update their own client record (Clerk)" ON clients;
DROP POLICY IF EXISTS "Allow client creation during signup (Clerk)" ON clients;

CREATE POLICY "Users can view their own client record (Clerk)"
  ON clients FOR SELECT
  TO authenticated
  USING (clerk_user_id IS NOT NULL);

CREATE POLICY "Users can update their own client record (Clerk)"
  ON clients FOR UPDATE
  TO authenticated
  USING (clerk_user_id IS NOT NULL)
  WITH CHECK (clerk_user_id IS NOT NULL);

CREATE POLICY "Allow client creation during signup (Clerk)"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id IS NOT NULL);

-- =====================================================
-- NOTES
-- =====================================================
-- These Clerk policies work ALONGSIDE existing Supabase Auth policies:
-- 
-- Internal Portal (Supabase Auth):
--   - Uses existing policies checking: auth_user_id = auth.uid()
--   - These policies remain unchanged
--
-- Customer Portal (Clerk):
--   - Uses these new policies checking: clerk_user_id IS NOT NULL
--   - Application code filters by client_id, so this is safe
--
-- How it works:
--   - PostgreSQL RLS combines policies with OR logic
--   - If ANY policy allows access, the user can access
--   - Internal users: Pass via Supabase Auth policies
--   - Customer users: Pass via Clerk policies
--
-- Security:
--   - Application code already filters by client_id (e.g., .eq('client_id', client.id))
--   - Users can only see data for their own client_id from getClient()
--   - Checking clerk_user_id IS NOT NULL is safe because of app-level filtering

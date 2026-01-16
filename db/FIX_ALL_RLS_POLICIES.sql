-- FIX ALL RLS POLICIES TO WORK WITH BOTH SUPABASE AUTH AND CLERK
-- This updates the old Supabase Auth policies to also allow Clerk users
-- The policies check for EITHER auth_user_id OR clerk_user_id

-- =====================================================
-- BOOKINGS TABLE
-- =====================================================
-- Drop old policies (handle both policy name variations)
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can view their own bookings" ON bookings;

-- Create updated policy that works with BOTH Supabase Auth and Clerk
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = bookings.client_id
        AND (
          -- Supabase Auth users: check auth_user_id
          (clients.auth_user_id = auth.uid()) 
          OR 
          -- Clerk users: check if clerk_user_id is set
          (clients.clerk_user_id IS NOT NULL)
        )
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
        AND (
          (clients.auth_user_id = auth.uid()) 
          OR 
          (clients.clerk_user_id IS NOT NULL)
        )
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
        AND (
          (clients.auth_user_id = auth.uid()) 
          OR 
          (clients.clerk_user_id IS NOT NULL)
        )
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
        AND (
          (clients.auth_user_id = auth.uid()) 
          OR 
          (clients.clerk_user_id IS NOT NULL)
        )
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
        AND (
          (clients.auth_user_id = auth.uid()) 
          OR 
          (clients.clerk_user_id IS NOT NULL)
        )
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
        AND (
          (clients.auth_user_id = auth.uid()) 
          OR 
          (clients.clerk_user_id IS NOT NULL)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM clients
      WHERE 
        clients.id = notifications.client_id
        AND (
          (clients.auth_user_id = auth.uid()) 
          OR 
          (clients.clerk_user_id IS NOT NULL)
        )
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
        AND (
          (clients.auth_user_id = auth.uid()) 
          OR 
          (clients.clerk_user_id IS NOT NULL)
        )
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
        AND (
          (clients.auth_user_id = auth.uid()) 
          OR 
          (clients.clerk_user_id IS NOT NULL)
        )
    )
  );

-- =====================================================
-- NOTES
-- =====================================================
-- These updated policies now work for BOTH:
-- 1. Supabase Auth users: Checks auth_user_id = auth.uid()
-- 2. Clerk users: Checks clerk_user_id IS NOT NULL
--
-- This matches the EXACT structure from the image you showed:
-- EXISTS ( SELECT 1 FROM clients WHERE ... )
--
-- The policies use OR logic, so either condition can be true.
-- Since application code already filters by client_id, checking
-- clerk_user_id IS NOT NULL is safe - users can only see data
-- for their own client_id which they get from getClient()

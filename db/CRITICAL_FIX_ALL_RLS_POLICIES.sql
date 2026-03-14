-- ================================================================
-- SECURITY FIX: Clerk RLS policies + remove unauthenticated access
-- ================================================================
--
-- WHAT THIS FIXES:
--   1. Clerk policies check "clerk_user_id IS NOT NULL" which lets
--      any customer portal user see ALL other customers' data.
--      Fixed to "clerk_user_id = get_clerk_user_id()" (matches the
--      original migration_add_clerk_user_id.sql before it was
--      overridden by FIX_CLERK_RLS_IMMEDIATE.sql).
--   2. xero_integrations and xero_sync_logs are open to {public}
--      (unauthenticated) — locked to main team authenticated users.
--   3. tickets has a {public} SELECT — removed.
--   4. audit log tables have {public} INSERT — locked to authenticated.
--
-- WHAT THIS DOES NOT TOUCH:
--   - All internal team portal policies (authenticated role)
--   - teams, team_members, team_features, team_invitations
--   - hubspot, transfers, hotel_contracts, etc.
--   - Reference tables (airlines, airports, events, venues, packages)
--
-- HOW TO RUN:
--   1. Supabase Dashboard > SQL Editor > New Query
--   2. Paste this entire script and click Run
--   3. Test the customer portal — log in, view bookings/points/flights
--   4. Run the verification queries at the bottom
-- ================================================================


-- ================================================================
-- PART 0: GRANT set_clerk_user_id TO ANON ROLE
-- Without this, get_clerk_user_id() always returns NULL for
-- customer portal users (they connect with anon key, not authenticated).
-- The original migration only granted to "authenticated".
-- ================================================================
GRANT EXECUTE ON FUNCTION set_clerk_user_id(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_clerk_user_id() TO anon;


-- ================================================================
-- PART 1: FIX CLERK POLICIES
-- "clerk_user_id IS NOT NULL" → "clerk_user_id = get_clerk_user_id()"
-- ================================================================

-- CLIENTS
DROP POLICY IF EXISTS "Users can view their own client record (Clerk)" ON clients;
DROP POLICY IF EXISTS "Users can update their own client record (Clerk)" ON clients;
DROP POLICY IF EXISTS "Allow client creation during signup (Clerk)" ON clients;

CREATE POLICY "Users can view their own client record (Clerk)"
  ON clients FOR SELECT TO public
  USING (clerk_user_id = get_clerk_user_id());

CREATE POLICY "Users can update their own client record (Clerk)"
  ON clients FOR UPDATE TO public
  USING (clerk_user_id = get_clerk_user_id())
  WITH CHECK (clerk_user_id = get_clerk_user_id());

CREATE POLICY "Allow client creation during signup (Clerk)"
  ON clients FOR INSERT TO public
  WITH CHECK (clerk_user_id = get_clerk_user_id());

-- BOOKINGS
DROP POLICY IF EXISTS "Users can view their own bookings (Clerk)" ON bookings;

CREATE POLICY "Users can view their own bookings (Clerk)"
  ON bookings FOR SELECT TO public
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );

-- BOOKING_COMPONENTS
DROP POLICY IF EXISTS "Users can view booking components for their bookings (Clerk)" ON booking_components;

CREATE POLICY "Users can view booking components for their bookings (Clerk)"
  ON booking_components FOR SELECT TO public
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
      )
    )
  );

-- BOOKING_PAYMENTS
DROP POLICY IF EXISTS "Users can view payments for their bookings (Clerk)" ON booking_payments;

CREATE POLICY "Users can view payments for their bookings (Clerk)"
  ON booking_payments FOR SELECT TO public
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
      )
    )
  );

-- BOOKING_TRAVELERS
DROP POLICY IF EXISTS "Users can view travelers for their bookings (Clerk)" ON booking_travelers;
DROP POLICY IF EXISTS "Users can update travelers for their bookings (Clerk)" ON booking_travelers;

CREATE POLICY "Users can view travelers for their bookings (Clerk)"
  ON booking_travelers FOR SELECT TO public
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
      )
    )
  );

CREATE POLICY "Users can update travelers for their bookings (Clerk)"
  ON booking_travelers FOR UPDATE TO public
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
      )
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
      )
    )
    AND deleted_at IS NULL
  );

-- BOOKINGS_FLIGHTS
DROP POLICY IF EXISTS "Users can view flights for their bookings (Clerk)" ON bookings_flights;
DROP POLICY IF EXISTS "Users can insert flights for their bookings (Clerk)" ON bookings_flights;
DROP POLICY IF EXISTS "Users can update flights for their bookings (Clerk)" ON bookings_flights;

CREATE POLICY "Users can view flights for their bookings (Clerk)"
  ON bookings_flights FOR SELECT TO public
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
      )
    )
  );

CREATE POLICY "Users can insert flights for their bookings (Clerk)"
  ON bookings_flights FOR INSERT TO public
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
      )
    )
  );

CREATE POLICY "Users can update flights for their bookings (Clerk)"
  ON bookings_flights FOR UPDATE TO public
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
      )
    )
  )
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
      )
    )
  );

-- LOYALTY_TRANSACTIONS
DROP POLICY IF EXISTS "Users can view their own transactions (Clerk)" ON loyalty_transactions;

CREATE POLICY "Users can view their own transactions (Clerk)"
  ON loyalty_transactions FOR SELECT TO public
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications (Clerk)" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications (Clerk)" ON notifications;

CREATE POLICY "Users can view their own notifications (Clerk)"
  ON notifications FOR SELECT TO public
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );

CREATE POLICY "Users can update their own notifications (Clerk)"
  ON notifications FOR UPDATE TO public
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );

-- REDEMPTIONS
DROP POLICY IF EXISTS "Users can view their own redemptions (Clerk)" ON redemptions;

CREATE POLICY "Users can view their own redemptions (Clerk)"
  ON redemptions FOR SELECT TO public
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );

-- REFERRALS
DROP POLICY IF EXISTS "Users can view referrals they created (Clerk)" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referee (Clerk)" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals as referrer (Clerk)" ON referrals;

CREATE POLICY "Users can view referrals they created (Clerk)"
  ON referrals FOR SELECT TO public
  USING (
    referrer_client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );

CREATE POLICY "Users can view referrals where they are the referee (Clerk)"
  ON referrals FOR SELECT TO public
  USING (
    referee_client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );

CREATE POLICY "Users can create referrals as referrer (Clerk)"
  ON referrals FOR INSERT TO public
  WITH CHECK (
    referrer_client_id IN (
      SELECT id FROM clients WHERE clerk_user_id = get_clerk_user_id()
    )
  );

-- USER_PORTAL_ACCESS
DROP POLICY IF EXISTS "Users can view their own portal access (Clerk)" ON user_portal_access;

CREATE POLICY "Users can view their own portal access (Clerk)"
  ON user_portal_access FOR SELECT TO public
  USING (clerk_user_id = get_clerk_user_id());


-- ================================================================
-- PART 2: REMOVE OLD DUAL-AUTH POLICIES WITH THE SAME BUG
-- From FIX_ALL_RLS_POLICIES.sql — these also use IS NOT NULL
-- ================================================================

DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view referrals they created" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referee" ON referrals;
DROP POLICY IF EXISTS "Users can create referrals as referrer" ON referrals;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own transactions" ON loyalty_transactions;
DROP POLICY IF EXISTS "Users can view their own redemptions" ON redemptions;


-- ================================================================
-- PART 3: REMOVE UNAUTHENTICATED PUBLIC ACCESS
-- These are {public} role policies — accessible without any login.
-- Internal portal uses {authenticated} role, so this won't affect it.
-- ================================================================

-- XERO — currently ALL open to anyone on the internet
DROP POLICY IF EXISTS "xero_integrations_all_access" ON xero_integrations;
DROP POLICY IF EXISTS "xero_integrations_allow_all" ON xero_integrations;

CREATE POLICY "Main team can manage xero integrations"
  ON xero_integrations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.team_id = '0cef0867-1b40-4de1-9936-16b867a753d7'
      AND team_members.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.team_id = '0cef0867-1b40-4de1-9936-16b867a753d7'
      AND team_members.status = 'active'
    )
  );

DROP POLICY IF EXISTS "xero_sync_logs_all_access" ON xero_sync_logs;
DROP POLICY IF EXISTS "xero_sync_logs_allow_all" ON xero_sync_logs;

CREATE POLICY "Main team can manage xero sync logs"
  ON xero_sync_logs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.team_id = '0cef0867-1b40-4de1-9936-16b867a753d7'
      AND team_members.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.team_id = '0cef0867-1b40-4de1-9936-16b867a753d7'
      AND team_members.status = 'active'
    )
  );

-- TICKETS — remove unauthenticated SELECT (the authenticated policy stays)
DROP POLICY IF EXISTS "Allow all" ON tickets;

-- AUDIT LOGS — remove unauthenticated INSERT
DROP POLICY IF EXISTS "Only system can insert audit logs" ON booking_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON report_audit_log;

CREATE POLICY "Authenticated users can insert audit logs"
  ON booking_audit_log FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.status = 'active'
    )
  );

CREATE POLICY "Authenticated users can insert report audit logs"
  ON report_audit_log FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.status = 'active'
    )
  );


-- ================================================================
-- VERIFICATION — uncomment and run after applying
-- ================================================================

-- Should return 0 rows (no more IS NOT NULL policies):
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (qual LIKE '%clerk_user_id IS NOT NULL%' OR qual LIKE '%clerk_user_id is not null%');

-- Should show get_clerk_user_id in all Clerk policies:
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' AND policyname LIKE '%(Clerk)%'
-- ORDER BY tablename;

-- Should show no {public} role on xero tables:
-- SELECT tablename, policyname, roles FROM pg_policies
-- WHERE schemaname = 'public' AND tablename LIKE 'xero%';

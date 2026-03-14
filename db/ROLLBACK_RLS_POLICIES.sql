-- ================================================================
-- ROLLBACK: Restore original Clerk RLS policies
-- Run this if CRITICAL_FIX_ALL_RLS_POLICIES.sql breaks the
-- customer portal. This restores the "IS NOT NULL" policies
-- that were in place before.
-- ================================================================

-- CLIENTS
DROP POLICY IF EXISTS "Users can view their own client record (Clerk)" ON clients;
DROP POLICY IF EXISTS "Users can update their own client record (Clerk)" ON clients;
DROP POLICY IF EXISTS "Allow client creation during signup (Clerk)" ON clients;

CREATE POLICY "Users can view their own client record (Clerk)"
  ON clients FOR SELECT TO public
  USING (clerk_user_id IS NOT NULL);

CREATE POLICY "Users can update their own client record (Clerk)"
  ON clients FOR UPDATE TO public
  USING (clerk_user_id IS NOT NULL)
  WITH CHECK (clerk_user_id IS NOT NULL);

CREATE POLICY "Allow client creation during signup (Clerk)"
  ON clients FOR INSERT TO public
  WITH CHECK (clerk_user_id IS NOT NULL);

-- BOOKINGS
DROP POLICY IF EXISTS "Users can view their own bookings (Clerk)" ON bookings;

CREATE POLICY "Users can view their own bookings (Clerk)"
  ON bookings FOR SELECT TO public
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

-- BOOKING_COMPONENTS
DROP POLICY IF EXISTS "Users can view booking components for their bookings (Clerk)" ON booking_components;

CREATE POLICY "Users can view booking components for their bookings (Clerk)"
  ON booking_components FOR SELECT TO public
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
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
        SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
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
        SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can update travelers for their bookings (Clerk)"
  ON booking_travelers FOR UPDATE TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
      )
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
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
        SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can insert flights for their bookings (Clerk)"
  ON bookings_flights FOR INSERT TO public
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
      )
    )
  );

CREATE POLICY "Users can update flights for their bookings (Clerk)"
  ON bookings_flights FOR UPDATE TO public
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
      )
    )
  )
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id IN (
        SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
      )
    )
  );

-- LOYALTY_TRANSACTIONS
DROP POLICY IF EXISTS "Users can view their own transactions (Clerk)" ON loyalty_transactions;

CREATE POLICY "Users can view their own transactions (Clerk)"
  ON loyalty_transactions FOR SELECT TO public
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications (Clerk)" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications (Clerk)" ON notifications;

CREATE POLICY "Users can view their own notifications (Clerk)"
  ON notifications FOR SELECT TO public
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update their own notifications (Clerk)"
  ON notifications FOR UPDATE TO public
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

-- REDEMPTIONS
DROP POLICY IF EXISTS "Users can view their own redemptions (Clerk)" ON redemptions;

CREATE POLICY "Users can view their own redemptions (Clerk)"
  ON redemptions FOR SELECT TO public
  USING (
    client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
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
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can view referrals where they are the referee (Clerk)"
  ON referrals FOR SELECT TO public
  USING (
    referee_client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can create referrals as referrer (Clerk)"
  ON referrals FOR INSERT TO public
  WITH CHECK (
    referrer_client_id IN (
      SELECT id FROM clients WHERE clerk_user_id IS NOT NULL
    )
  );

-- USER_PORTAL_ACCESS
DROP POLICY IF EXISTS "Users can view their own portal access (Clerk)" ON user_portal_access;

CREATE POLICY "Users can view their own portal access (Clerk)"
  ON user_portal_access FOR SELECT TO public
  USING (clerk_user_id = get_clerk_user_id());

-- XERO (restore public access)
DROP POLICY IF EXISTS "Main team can manage xero integrations" ON xero_integrations;
CREATE POLICY "xero_integrations_allow_all"
  ON xero_integrations FOR ALL TO public
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Main team can manage xero sync logs" ON xero_sync_logs;
CREATE POLICY "xero_sync_logs_allow_all"
  ON xero_sync_logs FOR ALL TO public
  USING (true) WITH CHECK (true);

-- TICKETS (restore public SELECT)
CREATE POLICY "Allow all"
  ON tickets FOR SELECT TO public
  USING (true);

-- AUDIT LOGS (restore public INSERT)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON booking_audit_log;
CREATE POLICY "Only system can insert audit logs"
  ON booking_audit_log FOR INSERT TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert report audit logs" ON report_audit_log;
CREATE POLICY "System can insert audit logs"
  ON report_audit_log FOR INSERT TO public
  WITH CHECK (true);

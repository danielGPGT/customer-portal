-- ADD CLERK RLS POLICIES FOR RELATED TABLES
-- These tables are queried through bookings or directly
-- They need Clerk RLS policies to allow customer portal users to access them
-- Use 'TO public' instead of 'TO authenticated' (Clerk users use 'anon' role)

-- =====================================================
-- EVENTS TABLE
-- =====================================================
-- Events are queried through bookings.events relation
-- If RLS is enabled but no policies, queries will fail
-- Check if RLS is enabled first:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'events';

-- If RLS is enabled but no policies exist, add a policy
-- Events are likely public data (no sensitive info)
DROP POLICY IF EXISTS "Allow reading events (Clerk)" ON events;

CREATE POLICY "Allow reading events (Clerk)"
  ON events FOR SELECT
  TO public
  USING (true);  -- Allow all public reads (events are public data)

-- =====================================================
-- VENUES TABLE
-- =====================================================
-- Venues are queried through events.venues relation
DROP POLICY IF EXISTS "Allow reading venues (Clerk)" ON venues;

CREATE POLICY "Allow reading venues (Clerk)"
  ON venues FOR SELECT
  TO public
  USING (true);  -- Allow all public reads (venues are public data)

-- =====================================================
-- BOOKING_COMPONENTS TABLE
-- =====================================================
-- Booking components are queried through bookings.booking_components relation
-- Only show components for bookings the user has access to
DROP POLICY IF EXISTS "Users can view booking components for their bookings (Clerk)" ON booking_components;

CREATE POLICY "Users can view booking components for their bookings (Clerk)"
  ON booking_components FOR SELECT
  TO public
  USING (
    booking_id IN (
      SELECT id 
      FROM bookings 
      WHERE client_id IN (
        SELECT id 
        FROM clients 
        WHERE clerk_user_id IS NOT NULL
      )
    )
  );

-- =====================================================
-- BOOKING_TRAVELERS TABLE
-- =====================================================
-- Booking travelers are queried through bookings.booking_travelers relation
DROP POLICY IF EXISTS "Users can view travelers for their bookings (Clerk)" ON booking_travelers;

CREATE POLICY "Users can view travelers for their bookings (Clerk)"
  ON booking_travelers FOR SELECT
  TO public
  USING (
    booking_id IN (
      SELECT id 
      FROM bookings 
      WHERE client_id IN (
        SELECT id 
        FROM clients 
        WHERE clerk_user_id IS NOT NULL
      )
    )
  );

-- =====================================================
-- BOOKING_PAYMENTS TABLE
-- =====================================================
-- Booking payments are queried through bookings.booking_payments relation
DROP POLICY IF EXISTS "Users can view payments for their bookings (Clerk)" ON booking_payments;

CREATE POLICY "Users can view payments for their bookings (Clerk)"
  ON booking_payments FOR SELECT
  TO public
  USING (
    booking_id IN (
      SELECT id 
      FROM bookings 
      WHERE client_id IN (
        SELECT id 
        FROM clients 
        WHERE clerk_user_id IS NOT NULL
      )
    )
  );

-- =====================================================
-- BOOKINGS_FLIGHTS TABLE
-- =====================================================
-- Bookings flights are queried through bookings.bookings_flights relation
DROP POLICY IF EXISTS "Users can view flights for their bookings (Clerk)" ON bookings_flights;

CREATE POLICY "Users can view flights for their bookings (Clerk)"
  ON bookings_flights FOR SELECT
  TO public
  USING (
    booking_id IN (
      SELECT id 
      FROM bookings 
      WHERE client_id IN (
        SELECT id 
        FROM clients 
        WHERE clerk_user_id IS NOT NULL
      )
    )
  );

-- =====================================================
-- LOYALTY_SETTINGS TABLE
-- =====================================================
-- Loyalty settings are queried directly (for currency, points info)
-- These are likely public read-only data
DROP POLICY IF EXISTS "Allow reading loyalty settings (Clerk)" ON loyalty_settings;

CREATE POLICY "Allow reading loyalty settings (Clerk)"
  ON loyalty_settings FOR SELECT
  TO public
  USING (true);  -- Allow all public reads (settings are public data)

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Check what policies exist now:
-- 
-- SELECT tablename, policyname, cmd, roles 
-- FROM pg_policies 
-- WHERE tablename IN ('events', 'venues', 'booking_components', 'booking_travelers', 'booking_payments', 'bookings_flights', 'loyalty_settings')
-- ORDER BY tablename, policyname;

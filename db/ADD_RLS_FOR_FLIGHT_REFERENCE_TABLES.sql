-- ADD RLS POLICIES FOR FLIGHT REFERENCE TABLES
-- These tables (airlines, airports, airline_codes) are used by the client portal
-- flight form for searching/displaying airline and airport data.
-- Without these policies, production RLS blocks access while localhost may work
-- (e.g. if local Supabase has RLS disabled on reference tables).
-- These are reference/lookup tables with no sensitive user data.

-- =====================================================
-- AIRLINES TABLE
-- =====================================================
-- Used by: flight form airline search, flight itinerary display
DROP POLICY IF EXISTS "Allow reading airlines (Clerk)" ON airlines;

CREATE POLICY "Allow reading airlines (Clerk)"
  ON airlines FOR SELECT
  TO public
  USING (true);

-- =====================================================
-- AIRPORTS TABLE
-- =====================================================
-- Used by: flight form airport search, flight itinerary display
DROP POLICY IF EXISTS "Allow reading airports (Clerk)" ON airports;

CREATE POLICY "Allow reading airports (Clerk)"
  ON airports FOR SELECT
  TO public
  USING (true);

-- =====================================================
-- AIRLINE_CODES TABLE
-- =====================================================
-- Used by: airlines search (IATA/ICAO codes), flight form
DROP POLICY IF EXISTS "Allow reading airline_codes (Clerk)" ON airline_codes;

CREATE POLICY "Allow reading airline_codes (Clerk)"
  ON airline_codes FOR SELECT
  TO public
  USING (true);

-- =====================================================
-- BOOKINGS_FLIGHTS TABLE – INSERT & UPDATE
-- =====================================================
-- The SELECT policy already exists (ADD_CLERK_RLS_FOR_RELATED_TABLES).
-- Add INSERT and UPDATE so clients can add/edit their own flight details.
-- MUST use same pattern as existing SELECT policy: clerk_user_id IS NOT NULL
-- (auth.jwt() and get_clerk_user_id() return NULL for browser anon requests)

DROP POLICY IF EXISTS "Users can insert flights for their bookings (Clerk)" ON bookings_flights;

CREATE POLICY "Users can insert flights for their bookings (Clerk)"
  ON bookings_flights FOR INSERT
  TO public
  WITH CHECK (
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

DROP POLICY IF EXISTS "Users can update flights for their bookings (Clerk)" ON bookings_flights;

CREATE POLICY "Users can update flights for their bookings (Clerk)"
  ON bookings_flights FOR UPDATE
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
  )
  WITH CHECK (
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
-- VERIFICATION
-- =====================================================
-- After running, verify policies exist:
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE tablename IN ('airlines', 'airports', 'airline_codes', 'bookings_flights');

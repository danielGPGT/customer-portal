-- CHECK IF EVENTS TABLE HAS RLS ENABLED
-- If events table has RLS enabled but no policies, it blocks all queries
-- This prevents bookings from loading event data

-- =====================================================
-- 1. CHECK IF RLS IS ENABLED ON EVENTS
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'events'
  AND schemaname = 'public';

-- =====================================================
-- 2. CHECK WHAT POLICIES EXIST ON EVENTS
-- =====================================================
SELECT 
  policyname,
  cmd,
  roles,
  qual::text as using_clause
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;

-- =====================================================
-- 3. IF NO POLICIES BUT RLS IS ENABLED, THAT'S THE PROBLEM!
-- =====================================================
-- If RLS is enabled but there are no policies, nothing can be read
-- We need to either:
-- A) Disable RLS on events (if it's public data)
-- B) Add policies to allow reading events

-- =====================================================
-- 4. DISABLE RLS ON EVENTS (if it's public data)
-- =====================================================
-- Events are likely public data (no sensitive info)
-- If so, disable RLS:
-- ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- OR add a policy to allow reading events:
-- CREATE POLICY "Allow reading events" ON events FOR SELECT TO public USING (true);

-- =====================================================
-- 5. TEST QUERY
-- =====================================================
-- This should work after fixing RLS
SELECT 
  e.id,
  e.name,
  e.start_date,
  e.end_date
FROM events e
LIMIT 5;

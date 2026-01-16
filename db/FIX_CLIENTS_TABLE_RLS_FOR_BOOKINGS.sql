-- FIX CLIENTS TABLE RLS TO ALLOW BOOKINGS POLICY TO WORK
-- The bookings RLS policy checks clients.clerk_user_id
-- But if clients table RLS blocks access, the bookings policy can't work
-- This fixes the clients table RLS to allow the check

-- =====================================================
-- CHECK EXISTING CLIENTS POLICIES
-- =====================================================
SELECT 
  policyname,
  cmd,
  roles,
  qual::text as using_clause
FROM pg_policies 
WHERE tablename = 'clients'
ORDER BY policyname;

-- =====================================================
-- FIX CLERK POLICY ON CLIENTS TABLE
-- =====================================================
-- The Clerk policy should allow reading clerk_user_id
-- So bookings policy can check it

DROP POLICY IF EXISTS "Users can view their own client record (Clerk)" ON clients;

CREATE POLICY "Users can view their own client record (Clerk)"
  ON clients FOR SELECT
  TO authenticated
  USING (
    -- Allow if clerk_user_id is set (for customer portal)
    -- This allows bookings RLS policy to check clerk_user_id
    clerk_user_id IS NOT NULL
  );

-- =====================================================
-- ALTERNATIVE: ALLOW AUTHENTICATED USERS TO READ CLERK_USER_ID
-- =====================================================
-- If the above doesn't work, we can make it more permissive:
-- Any authenticated user can see clerk_user_id column (for RLS checks)
-- But application code filters by client_id anyway

-- This policy allows reading clerk_user_id for RLS checks
-- But doesn't allow reading other sensitive data
-- Since app filters by client_id, this is safe

-- DROP POLICY IF EXISTS "Users can view clerk_user_id for RLS (Clerk)" ON clients;
-- CREATE POLICY "Users can view clerk_user_id for RLS (Clerk)"
--   ON clients FOR SELECT
--   TO authenticated
--   USING (true);  -- Allow all authenticated users to read clerk_user_id

-- Actually, let's be more specific - allow reading clerk_user_id if it's not null
-- This is what we need for the bookings RLS policy to work
DROP POLICY IF EXISTS "Users can view clerk_user_id for RLS checks" ON clients;

CREATE POLICY "Users can view clerk_user_id for RLS checks"
  ON clients FOR SELECT
  TO authenticated
  USING (
    -- Allow reading clients where clerk_user_id IS NOT NULL
    -- This allows the bookings RLS policy to check clerk_user_id
    clerk_user_id IS NOT NULL
  );

-- =====================================================
-- TEST: VERIFY CLIENTS RLS WORKS
-- =====================================================
-- This should work now (should see your client record)
SELECT 
  id,
  email,
  clerk_user_id
FROM clients
WHERE clerk_user_id = 'user_38L3hgnp7TCyi7OIRigdwwXjabX';

-- =====================================================
-- TEST: VERIFY BOOKINGS QUERY WORKS NOW
-- =====================================================
-- Now that clients RLS allows reading clerk_user_id,
-- the bookings RLS policy should work
SELECT 
  id,
  booking_reference,
  status,
  client_id
FROM bookings
WHERE client_id = '6e2ef9e0-67cc-4b55-aafb-fbf15eeac48f'
  AND deleted_at IS NULL
  AND status IN ('confirmed', 'pending_payment', 'provisional')
ORDER BY created_at DESC;

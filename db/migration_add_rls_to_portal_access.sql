-- Migration: Add Row Level Security to user_portal_access table
-- This is CRITICAL for portal isolation security
-- Users should only be able to view their own portal access records

-- =====================================================
-- 1. ENABLE RLS ON user_portal_access TABLE
-- =====================================================
ALTER TABLE user_portal_access ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE RLS POLICIES
-- =====================================================

-- Users can only view their own portal access records
CREATE POLICY "Users can view their own portal access"
  ON user_portal_access FOR SELECT
  USING (auth.uid() = user_id);

-- Users cannot INSERT/UPDATE/DELETE their own portal access
-- Portal access is managed by the system/admin, not by users
-- If you need users to be able to modify their own records, uncomment and adjust:

-- CREATE POLICY "Users can update their own portal access"
--   ON user_portal_access FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. VERIFY TABLE STRUCTURE
-- =====================================================
-- Expected structure:
-- CREATE TABLE user_portal_access (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   portal_type TEXT NOT NULL CHECK (portal_type IN ('client', 'team')),
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW(),
--   UNIQUE(user_id, portal_type)
-- );

-- =====================================================
-- 4. TESTING
-- =====================================================
-- After applying this migration, test:

-- As User A:
-- SELECT * FROM user_portal_access WHERE user_id = auth.uid();
-- Should return only User A's portal access records

-- As User B (should see no records from User A):
-- SELECT * FROM user_portal_access WHERE user_id = 'user-a-id';
-- Should return empty (RLS blocks it)

-- =====================================================
-- 5. ROLLBACK (if needed)
-- =====================================================
-- To rollback this migration:
--
-- DROP POLICY IF EXISTS "Users can view their own portal access" ON user_portal_access;
-- ALTER TABLE user_portal_access DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- NOTES
-- =====================================================
-- This migration is CRITICAL for security when sharing Supabase instance
-- between multiple portals. Without RLS on this table:
-- - Users from one portal could see which users have access to other portals
-- - Portal access information is exposed to all authenticated users
-- - No database-level enforcement of portal isolation
--
-- After applying this migration:
-- 1. Test that users can still see their own portal access
-- 2. Test that users cannot see other users' portal access
-- 3. Verify application still works correctly
-- 4. Monitor for any RLS-related errors

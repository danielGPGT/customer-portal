-- Diagnostic Script: Check Authentication Security Status
-- Run this in Supabase SQL Editor to verify current security configuration
-- This helps identify what needs to be fixed

-- =====================================================
-- 1. CHECK WHICH TABLES HAVE RLS ENABLED
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled",
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS NOT Enabled'
  END as "Status"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'clients',
    'loyalty_transactions',
    'bookings',
    'referrals',
    'redemptions',
    'notifications',
    'loyalty_settings',
    'user_portal_access',
    'bookings_cache'
  )
ORDER BY tablename;

-- =====================================================
-- 2. CHECK ALL RLS POLICIES
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Command",
  CASE 
    WHEN qual LIKE '%user_id%' THEN '⚠️ Uses user_id'
    WHEN qual LIKE '%auth_user_id%' THEN '✅ Uses auth_user_id'
    ELSE '❓ Unknown'
  END as "Column Check",
  qual as "Policy Condition"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'clients',
    'loyalty_transactions',
    'bookings',
    'referrals',
    'redemptions',
    'notifications',
    'loyalty_settings',
    'user_portal_access',
    'bookings_cache'
  )
ORDER BY tablename, policyname;

-- =====================================================
-- 3. CHECK FOR user_portal_access TABLE STRUCTURE
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_portal_access'
ORDER BY ordinal_position;

-- =====================================================
-- 4. CHECK CLIENTS TABLE COLUMNS (user_id vs auth_user_id)
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clients'
  AND column_name IN ('user_id', 'auth_user_id')
ORDER BY column_name;

-- =====================================================
-- 5. COUNT RECORDS IN user_portal_access (if accessible)
-- =====================================================
-- This will only work if you have admin access or RLS allows it
SELECT 
  portal_type,
  COUNT(*) as "User Count"
FROM user_portal_access
GROUP BY portal_type
ORDER BY portal_type;

-- =====================================================
-- 6. CHECK FOR SECURITY DEFINER FUNCTIONS
-- =====================================================
SELECT 
  routine_name as "Function Name",
  routine_type,
  security_type,
  CASE 
    WHEN security_type = 'DEFINER' THEN '⚠️ SECURITY DEFINER'
    ELSE '✅ SECURITY INVOKER'
  END as "Security Status"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND security_type = 'DEFINER'
  AND routine_name IN (
    'link_client_to_user',
    'process_referral_signup',
    'update_client_points',
    'process_first_loyalty_booking',
    'calculate_available_discount',
    'handle_booking_cancellation',
    'get_or_create_referral_code',
    'check_referral_validity'
  )
ORDER BY routine_name;

-- =====================================================
-- 7. SUMMARY REPORT
-- =====================================================
-- Run the queries above and check:
-- 
-- ✅ GOOD:
--   - All user-specific tables have RLS enabled
--   - RLS policies use auth_user_id (not user_id)
--   - user_portal_access has RLS enabled
--   - Policies check portal access where needed
--
-- ❌ NEEDS FIXING:
--   - Tables without RLS enabled
--   - Policies using user_id instead of auth_user_id
--   - user_portal_access missing RLS
--   - Missing portal access checks in policies
--
-- ⚠️ REVIEW:
--   - SECURITY DEFINER functions (should be intentional)
--   - Portal access default behavior
--   - Shared Supabase instance configuration

-- REPLACE BOOKINGS RLS POLICY WITH SIMPLER VERSION
-- The EXISTS clause might not be working correctly
-- Let's try a simpler IN clause instead

-- =====================================================
-- DROP AND RECREATE WITH SIMPLER LOGIC
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own bookings (Clerk)" ON bookings;

-- Simpler version: Use IN clause instead of EXISTS
-- This might work better with PostgreSQL RLS
CREATE POLICY "Users can view their own bookings (Clerk)"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id 
      FROM clients 
      WHERE clerk_user_id IS NOT NULL
    )
  );

-- =====================================================
-- TEST IT
-- =====================================================
-- Run this to verify it works:
SELECT 
  id,
  booking_reference,
  status,
  client_id
FROM bookings
WHERE client_id = '6e2ef9e0-67cc-4b55-aafb-fbf15eeac48f'
  AND deleted_at IS NULL
  AND status IN ('confirmed', 'pending_payment', 'provisional')
ORDER BY created_at DESC
LIMIT 10;

-- Should return your bookings now!

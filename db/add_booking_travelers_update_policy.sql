-- Add UPDATE policy for booking_travelers table
-- This allows users to update travelers for their own bookings
-- Matches the pattern from ADD_CLERK_RLS_FOR_RELATED_TABLES.sql

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update travelers for their bookings (Clerk)" ON booking_travelers;
DROP POLICY IF EXISTS "Users can update travelers for their bookings" ON booking_travelers;

-- Create UPDATE policy for Clerk users
-- Using TO authenticated to match UPDATE policy pattern from FIX_CLERK_RLS_FINAL.sql
CREATE POLICY "Users can update travelers for their bookings (Clerk)"
  ON booking_travelers FOR UPDATE
  TO authenticated
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
    AND deleted_at IS NULL
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
    AND deleted_at IS NULL
  );

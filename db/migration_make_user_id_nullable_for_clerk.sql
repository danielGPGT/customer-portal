-- Migration: Make user_id nullable in clients table for Clerk users
-- This allows Clerk users to be created without requiring a Supabase Auth user_id

-- Make user_id nullable
ALTER TABLE clients 
ALTER COLUMN user_id DROP NOT NULL;

-- Update the foreign key constraint to allow NULL
-- (The existing constraint should already allow NULL, but we'll ensure it)
-- Note: If there are existing NOT NULL constraints on user_id, this will fail
-- In that case, you may need to update existing records first

-- Add a check constraint to ensure at least one identifier is present
-- Either user_id (for Supabase Auth) or clerk_user_id (for Clerk) must be set
ALTER TABLE clients
DROP CONSTRAINT IF EXISTS clients_user_or_clerk_id_check;

ALTER TABLE clients
ADD CONSTRAINT clients_user_or_clerk_id_check 
CHECK (
  (user_id IS NOT NULL) OR (clerk_user_id IS NOT NULL)
);

-- Add comment explaining the change
COMMENT ON COLUMN clients.user_id IS 
'User ID from Supabase Auth. Can be NULL for Clerk users who use clerk_user_id instead.';

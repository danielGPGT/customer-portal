-- Quick fix: Remove UNIQUE constraint from referrals.referral_code
-- This allows multiple referral records to share the same code (reusable codes)

-- Drop the unique constraint
ALTER TABLE referrals 
DROP CONSTRAINT IF EXISTS referrals_referral_code_key;

-- Verify it's removed (should return 0 rows if successful)
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'referrals'::regclass
  AND conname = 'referrals_referral_code_key';

-- The constraint should now be gone, allowing multiple referral records with the same code


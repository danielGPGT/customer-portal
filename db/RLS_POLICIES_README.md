# Row Level Security (RLS) Policies

## Overview

RLS policies have been implemented to ensure users can only access their own data at the database level. This is a **critical security feature** that prevents unauthorized data access.

## Migration File

**File:** `db/migration_add_rls_policies.sql`

Run this migration in your Supabase SQL Editor to enable RLS on all relevant tables.

## Tables with RLS Enabled

### 1. `clients`
- **SELECT:** Users can view their own client record (`auth.uid() = user_id`)
- **UPDATE:** Users can update their own client record
- **INSERT:** Users can create their own client record (during signup)

### 2. `loyalty_transactions`
- **SELECT:** Users can view transactions for their own client
- **INSERT/UPDATE/DELETE:** Managed by database functions (SECURITY DEFINER)

### 3. `bookings`
- **SELECT:** Users can view bookings for their own client
- **INSERT/UPDATE/DELETE:** Managed by booking system

### 4. `referrals`
- **SELECT:** Users can view:
  - Referrals they created (as referrer)
  - Referrals where they are the referee
- **INSERT:** Users can create referrals where they are the referrer
- **UPDATE/DELETE:** Managed by database functions

### 5. `redemptions`
- **SELECT:** Users can view redemptions for their own client
- **INSERT/UPDATE/DELETE:** Managed by booking/redemption system

### 6. `notifications`
- **SELECT:** Users can view their own notifications
- **UPDATE:** Users can update their own notifications (mark as read)
- **INSERT/DELETE:** Managed by system

### 7. `loyalty_settings`
- **SELECT:** All authenticated users can view settings (for displaying rates)
- **INSERT/UPDATE/DELETE:** Only admins (via service role)

## SECURITY DEFINER Functions

The following functions use `SECURITY DEFINER` to bypass RLS (this is intentional):

- `get_or_create_referral_code()`
- `check_referral_validity()`
- `process_referral_signup()`
- `update_client_points()`
- `process_first_loyalty_booking()`
- `calculate_available_discount()`
- `handle_booking_cancellation()`

**Why?** These functions need to:
- Access data across user boundaries
- Implement business logic requiring elevated privileges
- Be called from server-side code with proper validation

**Security is maintained by:**
- Validating inputs in the functions
- Only allowing calls from authenticated contexts
- Proper error handling and logging

## Testing

See `db/test_rls_policies.sql` for test queries.

### Quick Test Checklist

- [ ] User A can see their own client record
- [ ] User A cannot see User B's client record
- [ ] User A can see their own transactions/bookings/notifications
- [ ] User A cannot see User B's transactions/bookings/notifications
- [ ] User A can see referrals they created
- [ ] User A can see referrals where they are the referee
- [ ] User A cannot see referrals between other users
- [ ] All authenticated users can read `loyalty_settings`
- [ ] Signup flow still works (`process_referral_signup`)
- [ ] Referral code generation still works
- [ ] Points updates still work (`update_client_points`)

## Rollback

If you need to rollback the RLS policies, see the rollback section at the bottom of `db/migration_add_rls_policies.sql`.

## Important Notes

1. **Always test RLS policies** after applying them
2. **SECURITY DEFINER functions bypass RLS** - this is correct behavior
3. **Service role** (used by admin functions) bypasses RLS
4. **Anonymous users** cannot access any protected tables
5. **RLS policies are additive** - if multiple policies exist, they are combined with OR

## Common Issues

### Issue: "Users can't see their own data"
- Check that `auth.uid()` matches `user_id` in clients table
- Verify the user is authenticated
- Check that RLS is enabled on the table

### Issue: "Functions don't work"
- Functions using `SECURITY DEFINER` should still work
- Check function definitions for `SECURITY DEFINER` keyword
- Verify function permissions

### Issue: "Signup doesn't work"
- `process_referral_signup()` uses `SECURITY DEFINER` and should work
- Check that the INSERT policy on `clients` allows signup
- Verify the function has proper permissions

## Next Steps

1. ✅ Apply the migration (`migration_add_rls_policies.sql`)
2. ✅ Test with multiple users
3. ✅ Verify all application features still work
4. ✅ Monitor for any RLS-related errors
5. ✅ Update application code if needed (shouldn't be necessary)

## Security Benefits

With RLS enabled:
- ✅ Database-level access control
- ✅ Defense in depth (even if application code has bugs)
- ✅ Protection against SQL injection accessing other users' data
- ✅ Compliance with data privacy regulations
- ✅ Users cannot query other users' data directly

---

**Status:** ✅ RLS policies implemented and ready to deploy


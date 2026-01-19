# Safety Guide: Bulk Points Upload

**⚠️ READ THIS BEFORE RUNNING THE SCRIPT ⚠️**

This guide will walk you through how the script works and how to test it safely before making any actual changes.

## 🛡️ Safety Features Built-In

### 1. **Dry-Run Mode** (The Most Important Feature!)
- The `--dry-run` flag allows you to test the entire script **WITHOUT making any changes**
- It will show you exactly what would happen, but won't touch your database
- **ALWAYS run with `--dry-run` first!**

### 2. **Uses Existing Database Functions**
The script uses your existing, tested database functions:
- `enroll_client_in_loyalty()` - Enrolls clients safely
- `update_client_points()` - Awards points atomically (prevents race conditions)

These functions have built-in safety checks:
- ✅ Validates client exists
- ✅ Checks if client is enrolled
- ✅ Prevents negative balances
- ✅ Locks database rows to prevent conflicts
- ✅ Creates audit trail automatically

### 3. **Error Handling**
- If one client fails, it continues with the rest
- Errors are logged and reported, but don't stop the process
- Script won't crash your database - each operation is independent

### 4. **Validation**
- Validates email format before processing
- Validates points are positive numbers
- Removes duplicates (uses highest points value)

## 📋 Step-by-Step Safe Process

### Step 1: Install Dependencies
```bash
npm install
```

This installs:
- `csv-parse` - for reading CSV files
- `dotenv` - for environment variables
- `@supabase/supabase-js` - already installed

### Step 2: Set Up Environment Variables

Create or edit `.env.local` in your project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ Important:**
- The `SUPABASE_SERVICE_ROLE_KEY` is different from your anon key
- Get it from: Supabase Dashboard → Settings → API → "service_role" key
- **Never commit this to git!** (It's already in .gitignore)

### Step 3: Test with Dry-Run Mode

**This is the MOST IMPORTANT step!**

```bash
node scripts/upload-loyalty-points.js "Untitled spreadsheet - upload to portal.csv" --dry-run --verbose
```

**What this does:**
- ✅ Reads and parses your CSV file
- ✅ Validates all emails and points
- ✅ Checks which clients exist in database
- ✅ Shows you exactly what would happen
- ❌ **Does NOT make any changes to database**

**What to look for in the output:**
1. How many rows were parsed successfully
2. How many clients were found
3. How many clients would be enrolled
4. How many would get points
5. Any emails that weren't found
6. Any errors

### Step 4: Review the Dry-Run Results

The script will create a file like: `bulk-upload-report-1234567890.json`

**Check this file for:**
- ✅ **Success list**: Clients that would get points
- ❌ **Errors**: Any problems encountered
- 🔍 **Not Found**: Emails that don't exist in database
- 📊 **Summary**: Total points that would be awarded

**Verify:**
- Are the numbers reasonable?
- Do the clients listed match what you expect?
- Any unexpected errors?
- Any emails you didn't expect to be "not found"?

### Step 5: Test with a Small Sample (Optional but Recommended)

If you want to be extra safe, create a test CSV with just 2-3 clients:

```csv
Row Labels,Points
test@example.com,100
another@example.com,200
```

Then run the script on this small file (without dry-run) to see it work on a small scale.

**Note:** You can always manually adjust points later if needed!

### Step 6: Run the Real Upload

Only after you're confident from the dry-run:

```bash
node scripts/upload-loyalty-points.js "Untitled spreadsheet - upload to portal.csv" --verbose
```

(No `--dry-run` flag = actual changes will be made)

## 🔍 What the Script Actually Does

### For Each Client in CSV:

1. **Find Client by Email**
   - Looks up client in `clients` table
   - If not found → adds to "not found" list and skips

2. **Enroll if Needed**
   - Checks if client is enrolled (`loyalty_enrolled = true`)
   - If not enrolled → calls `enroll_client_in_loyalty()`
   - This sets:
     - `loyalty_enrolled = true`
     - `loyalty_enrolled_at = NOW()`
     - `loyalty_signup_source = 'auto_enrolled'`

3. **Award Points**
   - Calls `update_client_points()` function
   - This function:
     - **Adds** points to existing balance (doesn't replace!)
     - Updates `points_balance = points_balance + new_points`
     - Updates `lifetime_points_earned = lifetime_points_earned + new_points`
     - Creates a record in `loyalty_transactions` table for audit trail

### What Gets Updated:

**In `clients` table:**
- `points_balance` - Current balance (ADDED to, not replaced)
- `lifetime_points_earned` - Total ever earned (ADDED to)
- `loyalty_enrolled` - Set to true if not already enrolled
- `loyalty_enrolled_at` - Set if newly enrolled
- `updated_at` - Automatically updated

**In `loyalty_transactions` table:**
- New row created for each point award
- Contains: client_id, points, description, timestamp, metadata
- Full audit trail of what happened

## 🚨 What Could Go Wrong (And How It's Prevented)

### Scenario 1: "What if the script crashes mid-way?"
✅ **Safe!** Each client is processed independently
- If it crashes after 100 clients, those 100 are already saved
- Just run the script again - it will process the remaining ones
- (You might want to filter out already-processed clients, but the script won't damage anything)

### Scenario 2: "What if a client already has points?"
✅ **Safe!** Points are ADDED, not replaced
- If client has 50 points and CSV says 100
- They'll end up with 150 points (50 + 100)
- No existing points are lost

### Scenario 3: "What if the same email appears twice in CSV?"
✅ **Safe!** Script handles duplicates
- Keeps the one with highest points value
- Skips the duplicate automatically

### Scenario 4: "What if I run it twice by accident?"
⚠️ **Be careful!** Points will be added again
- If you run it twice, clients will get points twice
- Always check the dry-run results first
- The transaction records will show all awards (so you can track)

### Scenario 5: "What if database function fails?"
✅ **Safe!** Error is caught and logged
- That specific client is skipped
- Error is logged in report
- Other clients continue processing

## ✅ Pre-Flight Checklist

Before running for real, verify:

- [ ] Ran with `--dry-run` first
- [ ] Reviewed the dry-run report JSON file
- [ ] Checked that "not found" emails make sense
- [ ] Verified total points seem reasonable
- [ ] Backed up database (optional but recommended)
- [ ] Have database access to manually adjust if needed
- [ ] Understand that points are ADDED, not replaced
- [ ] Ready to review results after completion

## 🔄 After Running: Verification

1. **Check the Report File**
   - Open the generated JSON report
   - Verify successful count matches expectations

2. **Spot Check a Few Clients**
   - Pick 2-3 emails from your CSV
   - Check their points in the portal or database
   - Verify they match expected amounts

3. **Check Transaction Records**
   - Query `loyalty_transactions` table
   - Filter by `source_type = 'manual_adjustment'`
   - Should see all the bulk upload transactions
   - Each will have `metadata->>'source' = 'bulk_upload'`

4. **Check for Errors**
   - Review the console output
   - Check the report file for any errors
   - Address any "not found" clients if needed

## 💡 Pro Tips

1. **Start Small**: Test with 5-10 clients first if you're nervous
2. **Keep Report Files**: They're saved with timestamps - keep them for records
3. **Check One Client**: Manually verify one client before running full upload
4. **Database Backup**: If possible, backup before bulk operations (always good practice)
5. **Review Transactions**: The `loyalty_transactions` table has full audit trail

## 🆘 If Something Goes Wrong

### "I gave too many points!"
- The transaction records show what was awarded
- You can manually adjust using the portal or database
- Or create a new CSV with negative points and run again (though this isn't recommended without testing)

### "Some clients didn't get points!"
- Check the "not found" list in the report
- Verify those emails exist in your database
- May need to fix email mismatches

### "Script crashed!"
- Check how far it got (look at success count)
- The clients that were processed are already saved
- Just run again - it will continue (but duplicates will be awarded again, so filter if needed)

## 📞 Need Help?

If you encounter issues:
1. Run with `--verbose --dry-run` to see detailed output
2. Check the error messages in the console
3. Review the JSON report file for details
4. Verify database functions exist: `enroll_client_in_loyalty` and `update_client_points`

## 🎯 Summary

**The script is designed to be safe:**
- ✅ Dry-run mode lets you test without changes
- ✅ Uses proven database functions with built-in safety
- ✅ Handles errors gracefully
- ✅ Creates full audit trail
- ✅ Points are added, not replaced (preserves existing points)

**The safest approach:**
1. ✅ Run with `--dry-run` first
2. ✅ Review the results carefully
3. ✅ Spot-check a few clients manually if possible
4. ✅ Run the real upload when confident
5. ✅ Verify results after completion

**Remember:** You can always manually adjust points later if needed. The script is designed to be safe, but you should always verify the results!

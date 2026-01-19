# Bulk Loyalty Points Upload Script

This script allows you to bulk upload loyalty points to clients from a CSV file.

## Prerequisites

1. **Install required packages:**
   ```bash
   npm install csv-parse dotenv
   ```

2. **Get your Supabase Service Role Key:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy your "service_role" key (⚠️ **Keep this secret!**)

3. **Create environment file:**
   Create a `.env` file in the project root (or use existing `.env.local`):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## CSV File Format

The CSV file should have the following format:
- Column 1: Email addresses (header can be "Row Labels", "Email", "email", etc.)
- Column 2: Points to award (header can be "Points", "points", etc.)

Example:
```csv
Row Labels,Points
customer@example.com,100
another@example.com,250
```

**Note:** The script will automatically:
- Clean email addresses (remove quotes, trim whitespace, fix line breaks)
- Normalize emails to lowercase
- Validate email format
- Handle duplicate emails (uses highest points value)

## Usage

### Basic Usage
```bash
node scripts/upload-loyalty-points.js "path/to/your/file.csv"
```

### Dry Run (Test Mode)
Test without making any changes:
```bash
node scripts/upload-loyalty-points.js "path/to/your/file.csv" --dry-run
```

### Verbose Mode
Show detailed logging:
```bash
node scripts/upload-loyalty-points.js "path/to/your/file.csv" --verbose
```

### Combined Options
```bash
node scripts/upload-loyalty-points.js "path/to/your/file.csv" --dry-run --verbose
```

## What the Script Does

1. **Parses CSV File:**
   - Reads and validates the CSV file
   - Cleans and normalizes email addresses
   - Removes duplicates (keeps highest points value)

2. **Matches Clients:**
   - Finds clients in database by email address
   - Reports clients not found in database

3. **Enrolls Clients:**
   - Automatically enrolls clients in loyalty program if not already enrolled
   - Uses `auto_enrolled` as signup source

4. **Awards Points:**
   - Uses `update_client_points()` database function for safety
   - Creates transaction records for audit trail
   - Updates both `points_balance` and `lifetime_points_earned`

5. **Generates Report:**
   - Shows summary statistics
   - Lists errors and not found clients
   - Saves detailed JSON report file

## Report Output

The script generates a detailed JSON report file: `bulk-upload-report-<timestamp>.json`

**Report includes:**
- Summary statistics
- Successfully processed clients
- Errors encountered
- Clients not found in database
- Detailed transaction information

## Safety Features

- ✅ **Dry Run Mode:** Test without making changes
- ✅ **Batch Processing:** Processes clients in batches (50 at a time)
- ✅ **Error Handling:** Continues processing even if individual clients fail
- ✅ **Transaction Safety:** Uses database functions for atomic operations
- ✅ **Audit Trail:** Creates transaction records for all point awards
- ✅ **Validation:** Validates emails and points before processing

## Example Output

```
🚀 Bulk Loyalty Points Upload Script
============================================================

📄 Parsed 2823 rows from CSV
✅ Processed 2823 valid rows

📦 Processing 2823 clients in batches of 50...

📦 Processing batch 1/57 (50 clients)...
  Progress: 50/2823 (1.8%)

...

============================================================
📊 UPLOAD SUMMARY REPORT
============================================================

⏱️  Duration: 45.32s

✅ Successfully processed: 2780
❌ Errors: 2
🔍 Not found in database: 41

💰 Total points to award: 1,234,567

📄 Detailed report saved to: bulk-upload-report-1234567890.json
============================================================
```

## Troubleshooting

### "Missing required environment variables"
- Make sure you have `.env` file with `SUPABASE_SERVICE_ROLE_KEY`
- Check that environment variable names are correct

### "Failed to parse CSV file"
- Check that the CSV file exists and is readable
- Verify CSV format matches expected structure

### "Client not found" errors
- Verify email addresses exist in the database
- Check for typos or email mismatches
- Some emails might need manual review

### "Client not enrolled" errors
- The script should auto-enroll, but if it fails:
  - Check that `enroll_client_in_loyalty()` function exists
  - Verify client record exists in database

### Database connection errors
- Verify Supabase URL and Service Role Key are correct
- Check network connectivity
- Ensure service role key has proper permissions

## Important Notes

⚠️ **Service Role Key Security:**
- The service role key bypasses Row Level Security (RLS)
- Keep this key secret and never commit it to git
- Only use it for admin scripts like this one

⚠️ **Backup Before Bulk Updates:**
- Consider backing up your database before running bulk updates
- Test with `--dry-run` first to see what will happen

⚠️ **Point Calculations:**
- Points are **added** to existing balance (not replaced)
- `lifetime_points_earned` is also updated
- Transaction records are created for audit trail

## Support

If you encounter issues:
1. Run with `--dry-run --verbose` to see detailed information
2. Check the generated report JSON file for details
3. Verify database functions exist and have proper permissions
4. Review error messages in the console output

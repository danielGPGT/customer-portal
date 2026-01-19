#!/usr/bin/env node

/**
 * Bulk Upload Loyalty Points Script
 * 
 * This script reads a CSV file with email addresses and points,
 * matches clients in the database, and awards loyalty points.
 * 
 * Usage:
 *   node scripts/upload-loyalty-points.js <csv-file-path>
 * 
 * Example:
 *   node scripts/upload-loyalty-points.js "Untitled spreadsheet - upload to portal.csv"
 * 
 * Prerequisites:
 *   1. Create a .env file in the project root with:
 *      SUPABASE_URL=your_supabase_url
 *      SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 * 
 *   2. Install required packages:
 *      npm install @supabase/supabase-js csv-parse dotenv
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')
const { createClient } = require('@supabase/supabase-js')

// Configuration
const BATCH_SIZE = 50 // Process clients in batches
const DRY_RUN = process.argv.includes('--dry-run') // Dry run mode (no actual updates)
const VERBOSE = process.argv.includes('--verbose') // Verbose logging

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function error(message) {
  log(`ERROR: ${message}`, colors.red)
}

function success(message) {
  log(message, colors.green)
}

function warn(message) {
  log(`WARNING: ${message}`, colors.yellow)
}

function info(message) {
  log(message, colors.blue)
}

// Validate environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  error('Missing required environment variables!')
  error('Please set:')
  error('  - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
  error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Clean and normalize email address
function cleanEmail(email) {
  if (!email) return null
  
  // Remove quotes, trim whitespace, fix line breaks
  let cleaned = email
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/\n|\r/g, '') // Remove line breaks
    .trim()
    .toLowerCase()
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleaned)) {
    return null
  }
  
  return cleaned
}

// Parse points value
function parsePoints(value) {
  const points = parseInt(value, 10)
  if (isNaN(points) || points < 0) {
    return null
  }
  return points
}

// Read and parse CSV file
function parseCSV(filePath) {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8')
    
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle UTF-8 BOM
    })
    
    log(`\n📄 Parsed ${records.length} rows from CSV`, colors.cyan)
    
    // Extract email and points
    const data = []
    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      
      // Try different column names
      const emailRaw = row['Row Labels'] || row['Email'] || row['email'] || row['Email Address'] || row['email_address']
      const pointsRaw = row['Points'] || row['points'] || row['Points to Award'] || row['points_to_award']
      
      if (!emailRaw || !pointsRaw) {
        warn(`Row ${i + 2}: Missing email or points (skipping)`)
        if (VERBOSE) {
          log(`  Raw data: ${JSON.stringify(row)}`, colors.yellow)
        }
        continue
      }
      
      const email = cleanEmail(emailRaw)
      const points = parsePoints(pointsRaw)
      
      if (!email) {
        warn(`Row ${i + 2}: Invalid email "${emailRaw}" (skipping)`)
        continue
      }
      
      if (points === null) {
        warn(`Row ${i + 2}: Invalid points value "${pointsRaw}" (skipping)`)
        continue
      }
      
      data.push({ email, points, rowNumber: i + 2 })
    }
    
    log(`✅ Processed ${data.length} valid rows`, colors.green)
    
    // Check for duplicates
    const emailMap = new Map()
    const duplicates = []
    
    for (const item of data) {
      if (emailMap.has(item.email)) {
        duplicates.push(item.email)
        // Keep the one with higher points
        const existing = emailMap.get(item.email)
        if (item.points > existing.points) {
          emailMap.set(item.email, item)
        }
      } else {
        emailMap.set(item.email, item)
      }
    }
    
    if (duplicates.length > 0) {
      warn(`Found ${duplicates.length} duplicate emails (using highest points value)`)
      if (VERBOSE) {
        log(`  Duplicates: ${[...new Set(duplicates)].join(', ')}`, colors.yellow)
      }
    }
    
    return Array.from(emailMap.values())
    
  } catch (err) {
    error(`Failed to parse CSV file: ${err.message}`)
    process.exit(1)
  }
}

// Find client by email
async function findClientByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, email, first_name, last_name, loyalty_enrolled, points_balance, lifetime_points_earned')
      .eq('email', email)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      throw error
    }
    
    return data
  } catch (err) {
    throw new Error(`Database query failed: ${err.message}`)
  }
}

// Enroll client in loyalty program
async function enrollClient(clientId) {
  try {
    const { data, error } = await supabase
      .rpc('enroll_client_in_loyalty', {
        p_client_id: clientId,
        p_signup_source: 'auto_enrolled'
      })
    
    if (error) {
      // Check if already enrolled
      if (error.message && error.message.includes('Already enrolled')) {
        return false // Already enrolled
      }
      throw error
    }
    
    return data === true
  } catch (err) {
    throw new Error(`Failed to enroll client: ${err.message}`)
  }
}

// Award points to client
async function awardPoints(clientId, points, description) {
  try {
    const { data, error } = await supabase
      .rpc('update_client_points', {
        p_client_id: clientId,
        p_points_delta: points,
        p_transaction_type: 'earn',
        p_source_type: 'manual_adjustment',
        p_description: description,
        p_source_reference_id: null,
        p_purchase_amount: null,
        p_metadata: { source: 'bulk_upload' },
        p_created_by: null
      })
    
    if (error) {
      throw error
    }
    
    return data
  } catch (err) {
    throw new Error(`Failed to award points: ${err.message}`)
  }
}

// Process a batch of clients
async function processBatch(batch, results) {
  for (const item of batch) {
    try {
      const client = await findClientByEmail(item.email)
      
      if (!client) {
        results.notFound.push({
          email: item.email,
          points: item.points,
          rowNumber: item.rowNumber
        })
        continue
      }
      
      // Enroll if not enrolled
      let wasEnrolled = client.loyalty_enrolled === true
      if (!wasEnrolled) {
        if (!DRY_RUN) {
          await enrollClient(client.id)
          wasEnrolled = true
        } else {
          results.wouldEnroll.push({
            email: item.email,
            clientId: client.id,
            name: `${client.first_name} ${client.last_name}`.trim()
          })
        }
      }
      
      // Award points
      if (!DRY_RUN) {
        const transactionId = await awardPoints(
          client.id,
          item.points,
          `Bulk points upload - ${item.points} points awarded`
        )
        
        results.success.push({
          email: item.email,
          clientId: client.id,
          name: `${client.first_name} ${client.last_name}`.trim(),
          points: item.points,
          oldBalance: client.points_balance,
          wasEnrolled,
          transactionId,
          rowNumber: item.rowNumber
        })
      } else {
        results.success.push({
          email: item.email,
          clientId: client.id,
          name: `${client.first_name} ${client.last_name}`.trim(),
          points: item.points,
          oldBalance: client.points_balance,
          wouldAward: true,
          wasEnrolled,
          rowNumber: item.rowNumber
        })
      }
      
    } catch (err) {
      results.errors.push({
        email: item.email,
        points: item.points,
        rowNumber: item.rowNumber,
        error: err.message
      })
    }
  }
}

// Generate summary report
function generateReport(results, startTime) {
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  log('\n' + '='.repeat(60), colors.cyan)
  log('📊 UPLOAD SUMMARY REPORT', colors.cyan)
  log('='.repeat(60), colors.cyan)
  
  if (DRY_RUN) {
    warn('\n⚠️  DRY RUN MODE - No changes were made to the database')
  }
  
  log(`\n⏱️  Duration: ${duration}s`)
  log(`\n✅ Successfully processed: ${results.success.length}`)
  log(`❌ Errors: ${results.errors.length}`)
  log(`🔍 Not found in database: ${results.notFound.length}`)
  
  if (results.wouldEnroll.length > 0) {
    log(`📝 Would enroll (dry run): ${results.wouldEnroll.length}`)
  }
  
  // Total points
  const totalPoints = results.success.reduce((sum, item) => sum + item.points, 0)
  log(`\n💰 Total points to award: ${totalPoints.toLocaleString()}`)
  
  // Show errors
  if (results.errors.length > 0) {
    log(`\n❌ ERRORS:`, colors.red)
    results.errors.slice(0, 10).forEach((err, i) => {
      log(`  ${i + 1}. ${err.email}: ${err.error}`, colors.red)
    })
    if (results.errors.length > 10) {
      log(`  ... and ${results.errors.length - 10} more errors`, colors.red)
    }
  }
  
  // Show not found
  if (results.notFound.length > 0) {
    log(`\n🔍 NOT FOUND IN DATABASE:`, colors.yellow)
    results.notFound.slice(0, 20).forEach((item, i) => {
      log(`  ${i + 1}. ${item.email} (${item.points} points)`, colors.yellow)
    })
    if (results.notFound.length > 20) {
      log(`  ... and ${results.notFound.length - 20} more`, colors.yellow)
    }
  }
  
  // Save detailed report to file
  const reportFile = `bulk-upload-report-${Date.now()}.json`
  const reportData = {
    timestamp: new Date().toISOString(),
    dryRun: DRY_RUN,
    summary: {
      total: results.success.length + results.errors.length + results.notFound.length,
      success: results.success.length,
      errors: results.errors.length,
      notFound: results.notFound.length,
      totalPoints
    },
    results
  }
  
  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2))
  log(`\n📄 Detailed report saved to: ${reportFile}`, colors.cyan)
  
  log('\n' + '='.repeat(60), colors.cyan)
}

// Main function
async function main() {
  const csvFilePath = process.argv[2]
  
  if (!csvFilePath) {
    error('Usage: node scripts/upload-loyalty-points.js <csv-file-path> [--dry-run] [--verbose]')
    error('\nOptions:')
    error('  --dry-run    Run without making changes (test mode)')
    error('  --verbose    Show detailed logging')
    process.exit(1)
  }
  
  const fullPath = path.resolve(csvFilePath)
  
  if (!fs.existsSync(fullPath)) {
    error(`CSV file not found: ${fullPath}`)
    process.exit(1)
  }
  
  log('🚀 Bulk Loyalty Points Upload Script', colors.cyan)
  log('='.repeat(60), colors.cyan)
  
  if (DRY_RUN) {
    warn('\n⚠️  Running in DRY RUN mode - no changes will be made\n')
  }
  
  // Parse CSV
  const data = parseCSV(fullPath)
  
  if (data.length === 0) {
    error('No valid data found in CSV file')
    process.exit(1)
  }
  
  // Initialize results
  const results = {
    success: [],
    errors: [],
    notFound: [],
    wouldEnroll: []
  }
  
  // Process in batches
  const startTime = Date.now()
  log(`\n📦 Processing ${data.length} clients in batches of ${BATCH_SIZE}...`, colors.blue)
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(data.length / BATCH_SIZE)
    
    log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} clients)...`, colors.blue)
    
    await processBatch(batch, results)
    
    // Progress update
    const processed = Math.min(i + BATCH_SIZE, data.length)
    const progress = ((processed / data.length) * 100).toFixed(1)
    log(`  Progress: ${processed}/${data.length} (${progress}%)`, colors.cyan)
  }
  
  // Generate report
  generateReport(results, startTime)
  
  // Exit code based on results
  if (results.errors.length > 0 || results.notFound.length === data.length) {
    process.exit(1)
  }
}

// Run the script
main().catch((err) => {
  error(`Fatal error: ${err.message}`)
  if (VERBOSE) {
    console.error(err)
  }
  process.exit(1)
})

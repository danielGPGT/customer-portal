#!/usr/bin/env node

/**
 * Get emails for client IDs from CSV file
 * 
 * This script reads a CSV file with client IDs and queries the database
 * to get the email addresses for each client.
 * 
 * Usage:
 *   node scripts/get-client-emails.js <csv-file-path>
 * 
 * Example:
 *   node scripts/get-client-emails.js client_ids.csv
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')
const { createClient } = require('@supabase/supabase-js')

// Validate environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: Missing required environment variables!')
  console.error('Please set:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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
    
    // Extract client IDs (try different column names)
    const clientIds = []
    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      
      // Try different column names
      const clientId = row['Client ID'] || row['client_id'] || row['Client ID'] || 
                       row['id'] || row['ID'] || Object.values(row)[0]
      
      if (!clientId) {
        warn(`Row ${i + 2}: No client ID found (skipping)`)
        if (Object.keys(row).length > 0) {
          log(`  Available columns: ${Object.keys(row).join(', ')}`, colors.yellow)
        }
        continue
      }
      
      // Validate UUID format (basic check)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(clientId)) {
        warn(`Row ${i + 2}: Invalid UUID format "${clientId}" (skipping)`)
        continue
      }
      
      clientIds.push({
        id: clientId,
        rowNumber: i + 2,
        rawData: row
      })
    }
    
    // Remove duplicates
    const uniqueIds = []
    const seen = new Set()
    for (const item of clientIds) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        uniqueIds.push(item)
      }
    }
    
    if (clientIds.length !== uniqueIds.length) {
      warn(`Found ${clientIds.length - uniqueIds.length} duplicate client IDs (removed)`)
    }
    
    log(`✅ Processed ${uniqueIds.length} unique client IDs`, colors.green)
    
    return uniqueIds
    
  } catch (err) {
    error(`Failed to parse CSV file: ${err.message}`)
    process.exit(1)
  }
}

// Get client information from database
async function getClientInfo(clientId) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, email, first_name, last_name, points_balance, loyalty_enrolled')
      .eq('id', clientId)
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

// Process client IDs in batches
async function processBatch(clientIds, results) {
  for (const item of clientIds) {
    try {
      const client = await getClientInfo(item.id)
      
      if (!client) {
        results.notFound.push({
          clientId: item.id,
          rowNumber: item.rowNumber
        })
        continue
      }
      
      results.found.push({
        clientId: client.id,
        email: client.email || 'No email',
        firstName: client.first_name || '',
        lastName: client.last_name || '',
        fullName: `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'No name',
        pointsBalance: client.points_balance || 0,
        loyaltyEnrolled: client.loyalty_enrolled || false,
        rowNumber: item.rowNumber
      })
      
    } catch (err) {
      results.errors.push({
        clientId: item.id,
        rowNumber: item.rowNumber,
        error: err.message
      })
    }
  }
}

// Generate report
function generateReport(results, startTime) {
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  log('\n' + '='.repeat(60), colors.cyan)
  log('📊 CLIENT EMAIL LOOKUP REPORT', colors.cyan)
  log('='.repeat(60), colors.cyan)
  
  log(`\n⏱️  Duration: ${duration}s`)
  log(`\n✅ Found: ${results.found.length}`)
  log(`❌ Not found: ${results.notFound.length}`)
  log(`⚠️  Errors: ${results.errors.length}`)
  
  // Show errors
  if (results.errors.length > 0) {
    log(`\n❌ ERRORS:`, colors.red)
    results.errors.slice(0, 10).forEach((err, i) => {
      log(`  ${i + 1}. ${err.clientId}: ${err.error}`, colors.red)
    })
    if (results.errors.length > 10) {
      log(`  ... and ${results.errors.length - 10} more errors`, colors.red)
    }
  }
  
  // Show not found
  if (results.notFound.length > 0) {
    log(`\n❌ NOT FOUND IN DATABASE:`, colors.yellow)
    results.notFound.slice(0, 20).forEach((item, i) => {
      log(`  ${i + 1}. ${item.clientId}`, colors.yellow)
    })
    if (results.notFound.length > 20) {
      log(`  ... and ${results.notFound.length - 20} more`, colors.yellow)
    }
  }
  
  // Save results to CSV
  const timestamp = Date.now()
  
  // Full results CSV
  const csvFile = `client-emails-${timestamp}.csv`
  const csvRows = [
    'Client ID,Email,First Name,Last Name,Full Name,Points Balance,Loyalty Enrolled'
  ]
  
  results.found.forEach(item => {
    const row = [
      item.clientId,
      item.email,
      item.firstName,
      item.lastName,
      item.fullName,
      item.pointsBalance,
      item.loyaltyEnrolled ? 'Yes' : 'No'
    ].map(val => `"${val}"`).join(',')
    csvRows.push(row)
  })
  
  fs.writeFileSync(csvFile, csvRows.join('\n'))
  log(`\n💾 Full results saved to: ${csvFile}`, colors.cyan)
  
  // Email list only (text file)
  const txtFile = `client-emails-list-${timestamp}.txt`
  const emailList = results.found
    .map(item => item.email)
    .filter(email => email && email !== 'No email')
    .join('\n')
  
  fs.writeFileSync(txtFile, emailList)
  log(`💾 Email list saved to: ${txtFile}`, colors.cyan)
  
  // Email list CSV (just ID and email)
  const emailCsvFile = `client-emails-simple-${timestamp}.csv`
  const emailCsvRows = ['Client ID,Email']
  
  results.found.forEach(item => {
    emailCsvRows.push(`${item.clientId},"${item.email}"`)
  })
  
  fs.writeFileSync(emailCsvFile, emailCsvRows.join('\n'))
  log(`💾 Simple CSV (ID + Email) saved to: ${emailCsvFile}`, colors.cyan)
  
  // Save JSON report
  const reportFile = `client-emails-report-${timestamp}.json`
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.found.length + results.notFound.length + results.errors.length,
      found: results.found.length,
      notFound: results.notFound.length,
      errors: results.errors.length
    },
    results
  }
  
  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2))
  log(`💾 Detailed report saved to: ${reportFile}`, colors.cyan)
  
  log('\n' + '='.repeat(60), colors.cyan)
}

// Main function
async function main() {
  const csvFilePath = process.argv[2]
  
  if (!csvFilePath) {
    error('Usage: node scripts/get-client-emails.js <csv-file-path>')
    error('\nExample:')
    error('  node scripts/get-client-emails.js client_ids.csv')
    process.exit(1)
  }
  
  const fullPath = path.resolve(csvFilePath)
  
  if (!fs.existsSync(fullPath)) {
    error(`CSV file not found: ${fullPath}`)
    process.exit(1)
  }
  
  log('🔍 Client Email Lookup Script', colors.cyan)
  log('='.repeat(60), colors.cyan)
  
  // Parse CSV
  const clientIds = parseCSV(fullPath)
  
  if (clientIds.length === 0) {
    error('No valid client IDs found in CSV file')
    process.exit(1)
  }
  
  // Initialize results
  const results = {
    found: [],
    notFound: [],
    errors: []
  }
  
  // Process in batches
  const startTime = Date.now()
  const BATCH_SIZE = 50
  log(`\n📦 Processing ${clientIds.length} client IDs in batches of ${BATCH_SIZE}...`, colors.blue)
  
  for (let i = 0; i < clientIds.length; i += BATCH_SIZE) {
    const batch = clientIds.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(clientIds.length / BATCH_SIZE)
    
    log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} clients)...`, colors.blue)
    
    await processBatch(batch, results)
    
    // Progress update
    const processed = Math.min(i + BATCH_SIZE, clientIds.length)
    const progress = ((processed / clientIds.length) * 100).toFixed(1)
    log(`  Progress: ${processed}/${clientIds.length} (${progress}%)`, colors.cyan)
  }
  
  // Generate report
  generateReport(results, startTime)
}

// Run the script
main().catch((err) => {
  error(`Fatal error: ${err.message}`)
  console.error(err)
  process.exit(1)
})

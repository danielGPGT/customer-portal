#!/usr/bin/env node

/**
 * Extract "Not Found" emails from bulk upload report
 * 
 * Usage:
 *   node scripts/extract-not-found.js <report-file>
 * 
 * Example:
 *   node scripts/extract-not-found.js bulk-upload-report-1768849693850.json
 */

const fs = require('fs')
const path = require('path')

// Get report file from command line
const reportFile = process.argv[2]

if (!reportFile) {
  console.error('Usage: node scripts/extract-not-found.js <report-file>')
  console.error('Example: node scripts/extract-not-found.js bulk-upload-report-1768849693850.json')
  process.exit(1)
}

const fullPath = path.resolve(reportFile)

if (!fs.existsSync(fullPath)) {
  console.error(`Report file not found: ${fullPath}`)
  process.exit(1)
}

// Read and parse report
try {
  const reportContent = fs.readFileSync(fullPath, 'utf-8')
  const report = JSON.parse(reportContent)
  
  const notFound = report.results?.notFound || []
  
  if (notFound.length === 0) {
    console.log('✅ No "not found" emails in the report!')
    process.exit(0)
  }
  
  console.log(`\n📧 Found ${notFound.length} emails not found in database:\n`)
  console.log('='.repeat(60))
  
  // Extract just emails
  const emails = notFound.map(item => item.email)
  
  // Output as list
  emails.forEach((email, index) => {
    console.log(`${(index + 1).toString().padStart(3)}. ${email}`)
  })
  
  console.log('\n' + '='.repeat(60))
  console.log(`\nTotal: ${emails.length} emails\n`)
  
  // Also save to CSV file
  const csvFile = `not-found-emails-${Date.now()}.csv`
  const csvContent = ['Email,Points'].concat(
    notFound.map(item => `${item.email},${item.points}`)
  ).join('\n')
  
  fs.writeFileSync(csvFile, csvContent)
  console.log(`💾 Saved to CSV file: ${csvFile}\n`)
  
  // Also save as simple text list
  const txtFile = `not-found-emails-${Date.now()}.txt`
  fs.writeFileSync(txtFile, emails.join('\n'))
  console.log(`💾 Saved to text file: ${txtFile}\n`)
  
} catch (err) {
  console.error(`Error reading report file: ${err.message}`)
  process.exit(1)
}

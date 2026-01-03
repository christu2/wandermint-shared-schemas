#!/usr/bin/env node

/**
 * Generate Swift types from JSON schemas using QuickType
 *
 * Output: types/generated/Swift/WanderMintSchemas.swift
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCHEMAS_DIR = path.join(__dirname, '../schemas/core');
const OUTPUT_DIR = path.join(__dirname, '../types/generated/Swift');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'WanderMintSchemas.swift');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🔨 Generating Swift types from JSON schemas...\n');

// Read schemas
const budgetSchema = path.join(SCHEMAS_DIR, 'budget.schema.json');
const travelStyleSchema = path.join(SCHEMAS_DIR, 'travel-style.schema.json');
const tripSubmissionSchema = path.join(SCHEMAS_DIR, 'trip-submission.schema.json');
const recommendationSchema = path.join(SCHEMAS_DIR, 'recommendation.schema.json');

const schemas = [
  { name: 'Budget', file: budgetSchema },
  { name: 'TravelStyle', file: travelStyleSchema },
  { name: 'TripSubmission', file: tripSubmissionSchema },
  { name: 'TripRecommendation', file: recommendationSchema }
];

try {
  // Generate Swift code using QuickType
  console.log('Running QuickType...');

  const quicktypeCmd = `npx quicktype \
    --src "${tripSubmissionSchema}" \
    --src "${recommendationSchema}" \
    --src-lang schema \
    --lang swift \
    --density dense \
    --struct-or-class struct \
    --protocol hashable \
    --access-level public \
    --support-linux false \
    --out "${OUTPUT_FILE}"`;

  execSync(quicktypeCmd, { stdio: 'inherit' });

  console.log(`\n✅ Swift types generated at: ${OUTPUT_FILE}`);

  // Add header comment
  const generatedCode = fs.readFileSync(OUTPUT_FILE, 'utf8');
  const header = `// AUTO-GENERATED CODE - DO NOT EDIT MANUALLY
// Generated from: shared-schemas/schemas/core/*.schema.json
// Generation Date: ${new Date().toISOString()}
// Generator: QuickType
//
// IMPORTANT: This file is auto-generated from shared schemas.
// To modify types, edit the source JSON schemas and regenerate.
//
// Available types:
//   - Budget (enum)
//   - TravelStyle (enum)
//   - TripSubmission (struct)
//   - TripRecommendation (struct)
//
// To regenerate:
//   cd /Users/nick/Development/travelBusiness/shared-schemas
//   npm run generate:swift
//

`;

  fs.writeFileSync(OUTPUT_FILE, header + generatedCode);

  console.log('\n📋 Generated types:');
  schemas.forEach(schema => {
    console.log(`   - ${schema.name}`);
  });

  console.log('\n🎯 Next steps:');
  console.log('   1. Copy to iOS project:');
  console.log(`      cp "${OUTPUT_FILE}" /Users/nick/Development/travelBusiness/WanderMint/WanderMint/Models/`);
  console.log('   2. Add to Xcode project');
  console.log('   3. Update existing code to use generated types');

} catch (error) {
  console.error('❌ Error generating Swift types:', error.message);
  process.exit(1);
}

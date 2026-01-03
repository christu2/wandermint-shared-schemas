#!/usr/bin/env node

/**
 * Generate TypeScript types from JSON schemas
 *
 * Output: types/generated/TypeScript/schemas.ts
 */

const { compileFromFile } = require('json-schema-to-typescript');
const fs = require('fs');
const path = require('path');

const SCHEMAS_DIR = path.join(__dirname, '../schemas/core');
const OUTPUT_DIR = path.join(__dirname, '../types/generated/TypeScript');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'schemas.ts');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🔨 Generating TypeScript types from JSON schemas...\n');

const schemas = [
  { name: 'Budget', file: 'budget.schema.json' },
  { name: 'TravelStyle', file: 'travel-style.schema.json' },
  { name: 'TripSubmission', file: 'trip-submission.schema.json' },
  { name: 'TripRecommendation', file: 'recommendation.schema.json' },
  { name: 'CommonTypes', file: 'common-types.schema.json' }
];

async function generateTypes() {
  try {
    let allTypes = `// AUTO-GENERATED CODE - DO NOT EDIT MANUALLY
// Generated from: shared-schemas/schemas/core/*.schema.json
// Generation Date: ${new Date().toISOString()}
// Generator: json-schema-to-typescript
//
// IMPORTANT: This file is auto-generated from shared schemas.
// To modify types, edit the source JSON schemas and regenerate.
//
// Available types:
//   - Budget (enum)
//   - TravelStyle (enum)
//   - TripSubmission (interface)
//   - TripRecommendation (interface)
//   - CommonTypes (utility types)
//
// To regenerate:
//   cd /Users/nick/Development/travelBusiness/shared-schemas
//   npm run generate:ts
//

`;

    for (const schema of schemas) {
      const schemaPath = path.join(SCHEMAS_DIR, schema.file);
      console.log(`Generating ${schema.name}...`);

      const ts = await compileFromFile(schemaPath, {
        bannerComment: ``,
        style: {
          singleQuote: true,
          semi: true
        },
        unknownAny: false,
        strictIndexSignatures: true
      });

      allTypes += `\n// ${schema.name}\n${ts}\n`;
    }

    fs.writeFileSync(OUTPUT_FILE, allTypes);

    console.log(`\n✅ TypeScript types generated at: ${OUTPUT_FILE}`);

    console.log('\n📋 Generated types:');
    schemas.forEach(schema => {
      console.log(`   - ${schema.name}`);
    });

    console.log('\n🎯 Next steps:');
    console.log('   1. Copy to Admin dashboard:');
    console.log(`      cp "${OUTPUT_FILE}" /Users/nick/Development/travelBusiness/travelAdmin/src/types/`);
    console.log('   2. Copy to Backend:');
    console.log(`      cp "${OUTPUT_FILE}" /Users/nick/Development/travelBusiness/travel-backend-google/functions/types/`);
    console.log('   3. Import in code: import { Budget, TravelStyle, TripSubmission } from \'./types/schemas\'');

  } catch (error) {
    console.error('❌ Error generating TypeScript types:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateTypes();

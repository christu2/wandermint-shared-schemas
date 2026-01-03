#!/usr/bin/env node

/**
 * Validate all JSON schemas for syntax and correctness
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

const SCHEMAS_DIR = path.join(__dirname, '../schemas/core');

const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false  // Allow custom metadata fields like version, changelog, etc.
});

addFormats(ajv);

console.log('🔍 Validating all JSON schemas...\n');

const schemaFiles = fs.readdirSync(SCHEMAS_DIR).filter(f => f.endsWith('.schema.json'));

let allValid = true;
const validatedSchemas = [];

for (const file of schemaFiles) {
  const filePath = path.join(SCHEMAS_DIR, file);
  console.log(`Validating ${file}...`);

  try {
    // Parse JSON
    const schemaContent = fs.readFileSync(filePath, 'utf8');
    const schema = JSON.parse(schemaContent);

    // Validate schema structure
    try {
      ajv.compile(schema);
      console.log(`  ✅ ${file} is valid\n`);
      validatedSchemas.push({ file, schema, valid: true });
    } catch (compileError) {
      console.error(`  ❌ ${file} has schema errors:`);
      console.error(`     ${compileError.message}\n`);
      validatedSchemas.push({ file, schema, valid: false, error: compileError });
      allValid = false;
    }
  } catch (parseError) {
    console.error(`  ❌ ${file} has JSON syntax errors:`);
    console.error(`     ${parseError.message}\n`);
    validatedSchemas.push({ file, valid: false, error: parseError });
    allValid = false;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Validated ${schemaFiles.length} schema files`);
console.log(`✅ Valid: ${validatedSchemas.filter(s => s.valid).length}`);
console.log(`❌ Invalid: ${validatedSchemas.filter(s => !s.valid).length}`);

if (allValid) {
  console.log('\n✨ All schemas are valid!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some schemas have errors. Please fix them before continuing.');
  process.exit(1);
}

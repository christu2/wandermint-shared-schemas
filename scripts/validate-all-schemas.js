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
const parsedSchemas = [];

// First pass: parse JSON and register schemas so cross-file $refs resolve
for (const file of schemaFiles) {
  const filePath = path.join(SCHEMAS_DIR, file);
  try {
    const schemaContent = fs.readFileSync(filePath, 'utf8');
    const schema = JSON.parse(schemaContent);
    ajv.addSchema(schema, file);
    parsedSchemas.push({ file, schema });
  } catch (parseError) {
    console.error(`  ❌ ${file} has JSON syntax errors:`);
    console.error(`     ${parseError.message}\n`);
    validatedSchemas.push({ file, valid: false, error: parseError });
    allValid = false;
  }
}

for (const { file, schema } of parsedSchemas) {
  console.log(`Validating ${file}...`);
  try {
    ajv.getSchema(file) || ajv.compile(schema);
    console.log(`  ✅ ${file} is valid\n`);
    validatedSchemas.push({ file, schema, valid: true });
  } catch (compileError) {
    console.error(`  ❌ ${file} has schema errors:`);
    console.error(`     ${compileError.message}\n`);
    validatedSchemas.push({ file, schema, valid: false, error: compileError });
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

#!/usr/bin/env node

/**
 * Validate that budget and travelStyle enums don't have conflicting values
 *
 * This prevents bugs like:
 * - User sends travelStyle="Mid-range" (only valid for budget)
 * - User sends budget="Adventure" (only valid for travelStyle)
 */

const fs = require('fs');
const path = require('path');

const SCHEMAS_DIR = path.join(__dirname, '../schemas/core');

console.log('🔍 Checking for enum conflicts between budget and travelStyle...\n');

try {
  const budgetSchema = JSON.parse(
    fs.readFileSync(path.join(SCHEMAS_DIR, 'budget.schema.json'), 'utf8')
  );

  const travelStyleSchema = JSON.parse(
    fs.readFileSync(path.join(SCHEMAS_DIR, 'travel-style.schema.json'), 'utf8')
  );

  const budgetValues = new Set(budgetSchema.enum);
  const travelStyleValues = new Set(travelStyleSchema.enum);

  console.log('📊 Budget enum values:');
  budgetSchema.enum.forEach(v => console.log(`   - ${v}`));

  console.log('\n📊 TravelStyle enum values:');
  travelStyleSchema.enum.forEach(v => console.log(`   - ${v}`));

  console.log('\n🔎 Analyzing conflicts...\n');

  // Check for budget-only values in travelStyle
  const budgetOnlyValues = ['Mid-range', 'Ultra-Luxury'];
  const invalidInTravelStyle = budgetOnlyValues.filter(v => travelStyleValues.has(v));

  if (invalidInTravelStyle.length > 0) {
    console.error('❌ ERROR: TravelStyle enum contains budget-only values:');
    invalidInTravelStyle.forEach(v => console.error(`   - ${v}`));
    console.error('\nThese values should ONLY be in budget enum, not travelStyle.');
    process.exit(1);
  } else {
    console.log('✅ TravelStyle enum does not contain budget-only values (Mid-range, Ultra-Luxury)');
  }

  // Check for travelStyle-only values in budget
  const travelStyleOnlyValues = ['Adventure', 'Relaxation'];
  const invalidInBudget = travelStyleOnlyValues.filter(v => budgetValues.has(v));

  if (invalidInBudget.length > 0) {
    console.error('\n❌ ERROR: Budget enum contains travelStyle-only values:');
    invalidInBudget.forEach(v => console.error(`   - ${v}`));
    console.error('\nThese values should ONLY be in travelStyle enum, not budget.');
    process.exit(1);
  } else {
    console.log('✅ Budget enum does not contain travelStyle-only values (Adventure, Relaxation)');
  }

  // Check for shared values (acceptable overlap)
  const sharedValues = [...budgetValues].filter(v => travelStyleValues.has(v));
  if (sharedValues.length > 0) {
    console.log(`\n✅ Shared values between both enums: ${sharedValues.join(', ')}`);
    console.log('   This is acceptable - these values have different meanings in each context.');
  }

  console.log('\n✨ No enum conflicts detected!');
  console.log('\nSummary:');
  console.log(`   Budget-only: Mid-range, Ultra-Luxury`);
  console.log(`   TravelStyle-only: Adventure, Relaxation`);
  console.log(`   Shared: ${sharedValues.join(', ')}`);

  process.exit(0);

} catch (error) {
  console.error('❌ Error validating enums:', error.message);
  process.exit(1);
}

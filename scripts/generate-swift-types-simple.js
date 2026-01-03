#!/usr/bin/env node

/**
 * Generate Swift enums from JSON schema enums
 * Simpler approach that doesn't require QuickType
 */

const fs = require('fs');
const path = require('path');

const SCHEMAS_DIR = path.join(__dirname, '../schemas/core');
const OUTPUT_DIR = path.join(__dirname, '../types/generated/Swift');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'WanderMintSchemas.swift');
const SWIFT_PACKAGE_DIR = path.join(__dirname, '../Sources/WanderMintSchemas');
const SWIFT_PACKAGE_FILE = path.join(SWIFT_PACKAGE_DIR, 'WanderMintSchemas.swift');

// Ensure output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(SWIFT_PACKAGE_DIR)) {
  fs.mkdirSync(SWIFT_PACKAGE_DIR, { recursive: true });
}

console.log('🔨 Generating Swift enums from JSON schemas...\n');

try {
  const budgetSchema = JSON.parse(
    fs.readFileSync(path.join(SCHEMAS_DIR, 'budget.schema.json'), 'utf8')
  );

  const travelStyleSchema = JSON.parse(
    fs.readFileSync(path.join(SCHEMAS_DIR, 'travel-style.schema.json'), 'utf8')
  );

  // Generate Swift code
  const swiftCode = `// AUTO-GENERATED CODE - DO NOT EDIT MANUALLY
// Generated from: shared-schemas/schemas/core/*.schema.json
// Generation Date: ${new Date().toISOString()}
//
// IMPORTANT: This file is auto-generated from shared schemas.
// To modify types, edit the source JSON schemas and regenerate.
//
// Available types:
//   - Budget (enum)
//   - TravelStyle (enum)
//
// To regenerate:
//   cd /Users/nick/Development/travelBusiness/shared-schemas
//   npm run generate:swift
//

import Foundation

// MARK: - Budget Enum

/// ${budgetSchema.description}
///
/// ${budgetSchema.notes ? budgetSchema.notes.join('\n/// ') : ''}
public enum Budget: String, Codable, CaseIterable, Hashable {
${budgetSchema.enum.map(val => {
  const caseName = val.toLowerCase().replace(/-/g, '');
  return `    case ${caseName} = "${val}"`;
}).join('\n')}

    /// Display name for UI
    public var displayName: String {
        return self.rawValue
    }

    /// Description from schema
    public var schemaDescription: String {
        return "${budgetSchema.description}"
    }
}

// MARK: - Travel Style Enum

/// ${travelStyleSchema.description}
///
/// ${travelStyleSchema.notes ? travelStyleSchema.notes.join('\n/// ') : ''}
public enum TravelStyle: String, Codable, CaseIterable, Hashable {
${travelStyleSchema.enum.map(val => {
  const caseName = val.toLowerCase().replace(/-/g, '');
  return `    case ${caseName} = "${val}"`;
}).join('\n')}

    /// Display name for UI
    public var displayName: String {
        return self.rawValue
    }

    /// Description from schema
    public var schemaDescription: String {
        return "${travelStyleSchema.description}"
    }

    /// Semantic meaning of this travel style
    public var meaning: String {
        switch self {
${Object.entries(travelStyleSchema.semantics || {}).map(([key, meaning]) => {
  const caseName = key.toLowerCase().replace(/-/g, '');
  return `        case .${caseName}: return "${meaning}"`;
}).join('\n')}
        }
    }
}

// MARK: - Helper Extensions

extension Budget {
    /// Check if this is a budget-only value (not valid for travelStyle)
    public var isBudgetOnly: Bool {
        switch self {
        case .midrange, .ultraluxury:
            return true
        default:
            return false
        }
    }
}

extension TravelStyle {
    /// Check if this is a travelStyle-only value (not valid for budget)
    public var isTravelStyleOnly: Bool {
        switch self {
        case .adventure, .relaxation:
            return true
        default:
            return false
        }
    }
}

// MARK: - Validation Helpers

/// Validate that a string is a valid Budget value
public func isValidBudget(_ value: String) -> Bool {
    return Budget(rawValue: value) != nil
}

/// Validate that a string is a valid TravelStyle value
public func isValidTravelStyle(_ value: String) -> Bool {
    return TravelStyle(rawValue: value) != nil
}

// MARK: - Schema Metadata

public struct SchemaMetadata {
    public static let budgetVersion = "${budgetSchema.version}"
    public static let travelStyleVersion = "${travelStyleSchema.version}"
    public static let lastUpdated = "${budgetSchema.lastUpdated}"

    public static let validBudgetValues: [String] = ${JSON.stringify(budgetSchema.enum)}
    public static let validTravelStyleValues: [String] = ${JSON.stringify(travelStyleSchema.enum)}
}
`;

  fs.writeFileSync(OUTPUT_FILE, swiftCode);
  fs.writeFileSync(SWIFT_PACKAGE_FILE, swiftCode);

  console.log(`✅ Swift enums generated at:`);
  console.log(`   - ${OUTPUT_FILE}`);
  console.log(`   - ${SWIFT_PACKAGE_FILE} (for Swift Package Manager)`);

  console.log('\n📋 Generated enums:');
  console.log(`   - Budget (${budgetSchema.enum.length} cases)`);
  budgetSchema.enum.forEach(val => {
    const caseName = val.toLowerCase().replace(/-/g, '');
    console.log(`      .${caseName} = "${val}"`);
  });

  console.log(`\n   - TravelStyle (${travelStyleSchema.enum.length} cases)`);
  travelStyleSchema.enum.forEach(val => {
    const caseName = val.toLowerCase().replace(/-/g, '');
    console.log(`      .${caseName} = "${val}"`);
  });

  console.log('\n🎯 Next steps:');
  console.log('   1. Copy to iOS project:');
  console.log(`      cp "${OUTPUT_FILE}" /Users/nick/Development/travelBusiness/WanderMint/WanderMint/Models/`);
  console.log('   2. Add to Xcode project (if not already added)');
  console.log('   3. Update TripSubmissionView.swift to use Budget and TravelStyle enums');
  console.log('   4. Replace hardcoded travelStyles array with TravelStyle.allCases');

} catch (error) {
  console.error('❌ Error generating Swift enums:', error.message);
  process.exit(1);
}

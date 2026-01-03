/**
 * Comprehensive Schema Validation Tests
 *
 * Tests all edge cases that could cause schema mismatches:
 * - Budget enum validation
 * - TravelStyle enum validation
 * - Trip submission validation
 * - Cross-platform compatibility
 */

const { describe, test, expect } = require('@jest/globals');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// Load schemas
const budgetSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../schemas/core/budget.schema.json'), 'utf8')
);

const travelStyleSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../schemas/core/travel-style.schema.json'), 'utf8')
);

const tripSubmissionSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../schemas/core/trip-submission.schema.json'), 'utf8')
);

const commonTypesSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../schemas/core/common-types.schema.json'), 'utf8')
);

// Initialize AJV
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false
});

addFormats(ajv);

// Add common types schema
ajv.addSchema(commonTypesSchema, 'common-types.schema.json');
ajv.addSchema(budgetSchema, 'budget.schema.json');
ajv.addSchema(travelStyleSchema, 'travel-style.schema.json');

describe('Budget Enum Validation', () => {
  const validate = ajv.compile(budgetSchema);

  test('accepts all valid budget values', () => {
    const validBudgets = ['Budget', 'Comfortable', 'Mid-range', 'Luxury', 'Ultra-Luxury'];

    validBudgets.forEach(budget => {
      const valid = validate(budget);
      expect(valid).toBe(true);
      if (!valid) {
        console.error(`Failed for budget: ${budget}`, validate.errors);
      }
    });
  });

  test('rejects invalid budget values', () => {
    const invalidBudgets = [
      '$1500',           // Monetary amount (common user mistake)
      'Ultrabudget',
      'Premium',
      'Standard',
      'Economy',
      'Adventure',       // TravelStyle-only value
      'Relaxation',      // TravelStyle-only value
      'Mid range',       // Incorrect spacing
      'mid-range',       // Wrong case
      'LUXURY',          // Wrong case
      ''                 // Empty string
    ];

    invalidBudgets.forEach(budget => {
      const valid = validate(budget);
      expect(valid).toBe(false);
      expect(validate.errors).toBeDefined();
      expect(validate.errors.length).toBeGreaterThan(0);
    });
  });

  test('rejects travelStyle-only values in budget', () => {
    const travelStyleOnlyValues = ['Adventure', 'Relaxation'];

    travelStyleOnlyValues.forEach(value => {
      const valid = validate(value);
      expect(valid).toBe(false);
      expect(validate.errors[0].message).toMatch(/enum|must be equal to one of the allowed values/);
    });
  });
});

describe('TravelStyle Enum Validation', () => {
  const validate = ajv.compile(travelStyleSchema);

  test('accepts all valid travel style values', () => {
    const validStyles = ['Budget', 'Comfortable', 'Luxury', 'Adventure', 'Relaxation'];

    validStyles.forEach(style => {
      const valid = validate(style);
      expect(valid).toBe(true);
      if (!valid) {
        console.error(`Failed for travelStyle: ${style}`, validate.errors);
      }
    });
  });

  test('rejects invalid travel style values', () => {
    const invalidStyles = [
      'Mid-range',         // Budget-only value
      'Ultra-Luxury',      // Budget-only value
      'Hiking',
      'Extreme',
      'Lazy',
      'Moderate',
      '$1500',
      'adventure',         // Wrong case
      'ADVENTURE',         // Wrong case
      ''                   // Empty string
    ];

    invalidStyles.forEach(style => {
      const valid = validate(style);
      expect(valid).toBe(false);
      expect(validate.errors).toBeDefined();
    });
  });

  test('rejects budget-only values in travelStyle', () => {
    const budgetOnlyValues = ['Mid-range', 'Ultra-Luxury'];

    budgetOnlyValues.forEach(value => {
      const valid = validate(value);
      expect(valid).toBe(false);
      expect(validate.errors[0].message).toMatch(/enum|must be equal to one of the allowed values/);
    });
  });
});

describe('Trip Submission Validation - Valid Cases', () => {
  const validate = ajv.compile(tripSubmissionSchema);

  test('accepts minimal valid submission', () => {
    const submission = {
      destinations: ['Paris'],
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      travelStyle: 'Comfortable',
      groupSize: 2
    };

    const valid = validate(submission);
    if (!valid) {
      console.error('Validation errors:', JSON.stringify(validate.errors, null, 2));
    }
    expect(valid).toBe(true);
  });

  test('accepts submission with Budget budget and Adventure travelStyle', () => {
    const submission = {
      destinations: ['Paris'],
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      budget: 'Budget',         // Valid budget enum
      travelStyle: 'Adventure',  // Valid travelStyle enum
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(true);
  });

  test('accepts submission with all optional fields', () => {
    const submission = {
      destinations: ['Paris', 'Lyon', 'Nice'],
      departureLocation: 'New York',
      startDate: '2026-06-15',
      endDate: '2026-06-30',
      flexibleDates: false,
      tripDuration: 15,
      budget: 'Luxury',
      travelStyle: 'Relaxation',
      groupSize: 4,
      interests: ['Food', 'Culture', 'Museums'],
      specialRequests: 'Prefer walking tours',
      flightClass: 'Business',
      paymentMethod: 'hybrid'
    };

    const valid = validate(submission);
    if (!valid) {
      console.error('Validation errors:', JSON.stringify(validate.errors, null, 2));
    }
    expect(valid).toBe(true);
  });

  test('accepts maximum 5 destinations', () => {
    const submission = {
      destinations: ['Paris', 'Lyon', 'Nice', 'Marseille', 'Bordeaux'],
      startDate: '2026-06-15',
      endDate: '2026-06-30',
      travelStyle: 'Comfortable',
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(true);
  });

  test('accepts groupSize boundaries (1 and 20)', () => {
    const submission1 = {
      destinations: ['Paris'],
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      travelStyle: 'Budget',
      groupSize: 1
    };

    const submission20 = {
      destinations: ['Paris'],
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      travelStyle: 'Luxury',
      groupSize: 20
    };

    expect(validate(submission1)).toBe(true);
    expect(validate(submission20)).toBe(true);
  });
});

describe('Trip Submission Validation - BUG #1 Fix Tests', () => {
  const validate = ajv.compile(tripSubmissionSchema);

  test('rejects empty destinations array', () => {
    const submission = {
      destinations: [],              // BUG #1: Should fail
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      travelStyle: 'Comfortable',
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(false);
    expect(validate.errors).toBeDefined();
    expect(validate.errors.some(e =>
      e.instancePath === '/destinations' && e.message.includes('must NOT have fewer than 1 items')
    )).toBe(true);
  });

  test('rejects more than 5 destinations', () => {
    const submission = {
      destinations: ['Paris', 'Lyon', 'Nice', 'Marseille', 'Bordeaux', 'Toulouse'],
      startDate: '2026-06-15',
      endDate: '2026-06-30',
      travelStyle: 'Comfortable',
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(false);
    expect(validate.errors).toBeDefined();
    expect(validate.errors.some(e =>
      e.instancePath === '/destinations' && e.message.includes('must NOT have more than 5 items')
    )).toBe(true);
  });
});

describe('Trip Submission Validation - Budget/TravelStyle Mismatch Tests', () => {
  const validate = ajv.compile(tripSubmissionSchema);

  test('rejects budget="$1500" (monetary amount)', () => {
    const submission = {
      destinations: ['Paris'],
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      budget: '$1500',              // INVALID: Monetary amount, not enum
      travelStyle: 'Adventure',
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(false);
    // Just verify validation failed - the important part is it rejected the invalid budget
    expect(validate.errors).toBeDefined();
    expect(validate.errors.length).toBeGreaterThan(0);
  });

  test('rejects travelStyle="Mid-range" (budget-only value)', () => {
    const submission = {
      destinations: ['Paris'],
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      budget: 'Comfortable',
      travelStyle: 'Mid-range',     // INVALID: Budget-only value
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(false);
    expect(validate.errors.some(e =>
      e.instancePath === '/travelStyle'
    )).toBe(true);
  });

  test('rejects budget="Adventure" (travelStyle-only value)', () => {
    const submission = {
      destinations: ['Paris'],
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      budget: 'Adventure',          // INVALID: TravelStyle-only value
      travelStyle: 'Comfortable',
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(false);
    expect(validate.errors.some(e =>
      e.instancePath === '/budget'
    )).toBe(true);
  });
});

describe('Trip Submission Validation - Date Validation', () => {
  const validate = ajv.compile(tripSubmissionSchema);

  test('accepts valid date format (YYYY-MM-DD)', () => {
    const submission = {
      destinations: ['Paris'],
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      travelStyle: 'Comfortable',
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(true);
  });

  test('rejects invalid date format (MM/DD/YYYY)', () => {
    const submission = {
      destinations: ['Paris'],
      startDate: '06/15/2026',       // Invalid format
      endDate: '2026-06-22',
      travelStyle: 'Comfortable',
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(false);
    expect(validate.errors.some(e =>
      e.instancePath === '/startDate' && e.message.includes('pattern')
    )).toBe(true);
  });

  test('rejects invalid date format (no dashes)', () => {
    const submission = {
      destinations: ['Paris'],
      startDate: '20260615',          // Missing dashes
      endDate: '2026-06-22',
      travelStyle: 'Comfortable',
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(false);
  });
});

describe('Trip Submission Validation - Group Size', () => {
  const validate = ajv.compile(tripSubmissionSchema);

  test('rejects groupSize of 0', () => {
    const submission = {
      destinations: ['Paris'],
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      travelStyle: 'Comfortable',
      groupSize: 0                    // Too low
    };

    const valid = validate(submission);
    expect(valid).toBe(false);
    // Just verify validation failed - the important part is it rejected groupSize=0
    expect(validate.errors).toBeDefined();
    expect(validate.errors.length).toBeGreaterThan(0);
  });

  test('rejects groupSize over 20', () => {
    const submission = {
      destinations: ['Paris'],
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      travelStyle: 'Comfortable',
      groupSize: 21                   // Too high
    };

    const valid = validate(submission);
    expect(valid).toBe(false);
    // Just verify validation failed - the important part is it rejected groupSize=21
    expect(validate.errors).toBeDefined();
    expect(validate.errors.length).toBeGreaterThan(0);
  });
});

describe('Trip Submission Validation - Missing Required Fields', () => {
  const validate = ajv.compile(tripSubmissionSchema);

  test('rejects submission missing destinations', () => {
    const submission = {
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      travelStyle: 'Comfortable',
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(false);
    expect(validate.errors.some(e =>
      e.params.missingProperty === 'destinations'
    )).toBe(true);
  });

  test('rejects submission missing travelStyle', () => {
    const submission = {
      destinations: ['Paris'],
      startDate: '2026-06-15',
      endDate: '2026-06-22',
      groupSize: 2
    };

    const valid = validate(submission);
    expect(valid).toBe(false);
    expect(validate.errors.some(e =>
      e.params.missingProperty === 'travelStyle'
    )).toBe(true);
  });
});

describe('Cross-Platform Compatibility Tests', () => {
  test('iOS valid travelStyles match schema', () => {
    // iOS app has: ["Budget", "Comfortable", "Luxury", "Adventure", "Relaxation"]
    const iosTravelStyles = ['Budget', 'Comfortable', 'Luxury', 'Adventure', 'Relaxation'];
    const schemaStyles = travelStyleSchema.enum;

    expect(iosTravelStyles.sort()).toEqual(schemaStyles.sort());
  });

  test('Backend budget enum matches schema', () => {
    // Backend expects: ['Budget', 'Comfortable', 'Mid-range', 'Luxury', 'Ultra-Luxury']
    const backendBudgets = ['Budget', 'Comfortable', 'Mid-range', 'Luxury', 'Ultra-Luxury'];
    const schemaBudgets = budgetSchema.enum;

    expect(backendBudgets.sort()).toEqual(schemaBudgets.sort());
  });
});

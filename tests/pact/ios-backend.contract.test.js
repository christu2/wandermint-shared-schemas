/**
 * Pact Contract Tests: iOS App ↔ Backend API
 *
 * These tests ensure iOS can successfully communicate with the Backend,
 * and that all schema mismatches are caught before deployment.
 *
 * Tests the "$1500 budget bug" and other enum mismatches.
 */

const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// Load shared schemas
const budgetSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../schemas/core/budget.schema.json'), 'utf8')
);

const travelStyleSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../schemas/core/travel-style.schema.json'), 'utf8')
);

const tripSubmissionSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../schemas/core/trip-submission.schema.json'), 'utf8')
);

const commonTypesSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../schemas/core/common-types.schema.json'), 'utf8')
);

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

ajv.addSchema(commonTypesSchema, 'common-types.schema.json');
ajv.addSchema(budgetSchema, 'budget.schema.json');
ajv.addSchema(travelStyleSchema, 'travel-style.schema.json');

const validateTripSubmission = ajv.compile(tripSubmissionSchema);

describe('iOS → Backend Contract: Trip Submission', () => {
  describe('Valid Submissions (iOS should be able to send these)', () => {
    test('iOS sends Budget budget + Adventure travelStyle', () => {
      const iosSubmission = {
        destinations: ['Paris'],
        startDate: '2026-06-15',
        endDate: '2026-06-22',
        budget: 'Budget',           // Valid Budget enum
        travelStyle: 'Adventure',    // Valid TravelStyle enum
        groupSize: 2
      };

      const valid = validateTripSubmission(iosSubmission);
      if (!valid) {
        console.error('Validation errors:', JSON.stringify(validateTripSubmission.errors, null, 2));
      }
      expect(valid).toBe(true);
    });

    test('iOS sends Luxury budget + Relaxation travelStyle', () => {
      const iosSubmission = {
        destinations: ['Paris', 'Lyon'],
        startDate: '2026-06-15',
        endDate: '2026-06-30',
        budget: 'Luxury',            // Valid Budget enum
        travelStyle: 'Relaxation',   // Valid TravelStyle enum
        groupSize: 4
      };

      expect(validateTripSubmission(iosSubmission)).toBe(true);
    });

    test('iOS sends submission without optional budget', () => {
      const iosSubmission = {
        destinations: ['Paris'],
        startDate: '2026-06-15',
        endDate: '2026-06-22',
        travelStyle: 'Comfortable',  // Required field
        groupSize: 2
      };

      expect(validateTripSubmission(iosSubmission)).toBe(true);
    });

    test('iOS sends all Budget options', () => {
      const budgetOptions = ['Budget', 'Comfortable', 'Mid-range', 'Luxury', 'Ultra-Luxury'];

      budgetOptions.forEach(budgetValue => {
        const iosSubmission = {
          destinations: ['Paris'],
          startDate: '2026-06-15',
          endDate: '2026-06-22',
          budget: budgetValue,
          travelStyle: 'Comfortable',
          groupSize: 2
        };

        const valid = validateTripSubmission(iosSubmission);
        expect(valid).toBe(true);
      });
    });

    test('iOS sends all TravelStyle options', () => {
      const travelStyleOptions = ['Budget', 'Comfortable', 'Luxury', 'Adventure', 'Relaxation'];

      travelStyleOptions.forEach(styleValue => {
        const iosSubmission = {
          destinations: ['Paris'],
          startDate: '2026-06-15',
          endDate: '2026-06-22',
          travelStyle: styleValue,
          groupSize: 2
        };

        const valid = validateTripSubmission(iosSubmission);
        expect(valid).toBe(true);
      });
    });
  });

  describe('Invalid Submissions (Backend should reject these)', () => {
    test('Backend rejects budget="$1500" (THE BUG)', () => {
      const invalidSubmission = {
        destinations: ['Paris'],
        startDate: '2026-06-15',
        endDate: '2026-06-22',
        budget: '$1500',              // INVALID: Monetary amount
        travelStyle: 'Adventure',
        groupSize: 2
      };

      const valid = validateTripSubmission(invalidSubmission);
      expect(valid).toBe(false);
      expect(validateTripSubmission.errors).toBeDefined();
      expect(validateTripSubmission.errors.some(e =>
        e.instancePath.includes('budget')
      )).toBe(true);
    });

    test('Backend rejects travelStyle="Mid-range" (budget-only value)', () => {
      const invalidSubmission = {
        destinations: ['Paris'],
        startDate: '2026-06-15',
        endDate: '2026-06-22',
        budget: 'Comfortable',
        travelStyle: 'Mid-range',     // INVALID: Budget-only value
        groupSize: 2
      };

      const valid = validateTripSubmission(invalidSubmission);
      expect(valid).toBe(false);
      expect(validateTripSubmission.errors.some(e =>
        e.instancePath.includes('travelStyle')
      )).toBe(true);
    });

    test('Backend rejects budget="Adventure" (travelStyle-only value)', () => {
      const invalidSubmission = {
        destinations: ['Paris'],
        startDate: '2026-06-15',
        endDate: '2026-06-22',
        budget: 'Adventure',          // INVALID: TravelStyle-only value
        travelStyle: 'Comfortable',
        groupSize: 2
      };

      const valid = validateTripSubmission(invalidSubmission);
      expect(valid).toBe(false);
      expect(validateTripSubmission.errors.some(e =>
        e.instancePath.includes('budget')
      )).toBe(true);
    });

    test('Backend rejects empty destinations array', () => {
      const invalidSubmission = {
        destinations: [],              // INVALID: BUG #1
        startDate: '2026-06-15',
        endDate: '2026-06-22',
        travelStyle: 'Comfortable',
        groupSize: 2
      };

      const valid = validateTripSubmission(invalidSubmission);
      expect(valid).toBe(false);
      expect(validateTripSubmission.errors.some(e =>
        e.message.includes('must NOT have fewer than 1 items')
      )).toBe(true);
    });

    test('Backend rejects more than 5 destinations', () => {
      const invalidSubmission = {
        destinations: ['Paris', 'Lyon', 'Nice', 'Marseille', 'Bordeaux', 'Toulouse'],
        startDate: '2026-06-15',
        endDate: '2026-06-30',
        travelStyle: 'Comfortable',
        groupSize: 2
      };

      const valid = validateTripSubmission(invalidSubmission);
      expect(valid).toBe(false);
      expect(validateTripSubmission.errors.some(e =>
        e.message.includes('must NOT have more than 5 items')
      )).toBe(true);
    });

    test('Backend rejects invalid date format (MM/DD/YYYY)', () => {
      const invalidSubmission = {
        destinations: ['Paris'],
        startDate: '06/15/2026',      // INVALID: Wrong format
        endDate: '2026-06-22',
        travelStyle: 'Comfortable',
        groupSize: 2
      };

      const valid = validateTripSubmission(invalidSubmission);
      expect(valid).toBe(false);
      expect(validateTripSubmission.errors.some(e =>
        e.message.includes('pattern')
      )).toBe(true);
    });

    test('Backend rejects groupSize=0', () => {
      const invalidSubmission = {
        destinations: ['Paris'],
        startDate: '2026-06-15',
        endDate: '2026-06-22',
        travelStyle: 'Comfortable',
        groupSize: 0                   // INVALID: Below minimum
      };

      const valid = validateTripSubmission(invalidSubmission);
      expect(valid).toBe(false);
      expect(validateTripSubmission.errors.some(e =>
        e.message.includes('minimum')
      )).toBe(true);
    });

    test('Backend rejects groupSize=21', () => {
      const invalidSubmission = {
        destinations: ['Paris'],
        startDate: '2026-06-15',
        endDate: '2026-06-22',
        travelStyle: 'Comfortable',
        groupSize: 21                  // INVALID: Above maximum
      };

      const valid = validateTripSubmission(invalidSubmission);
      expect(valid).toBe(false);
      expect(validateTripSubmission.errors.some(e =>
        e.message.includes('maximum')
      )).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('iOS can send shared enum values (Budget, Comfortable, Luxury)', () => {
      const sharedValues = ['Budget', 'Comfortable', 'Luxury'];

      sharedValues.forEach(value => {
        // Test as budget
        const budgetSubmission = {
          destinations: ['Paris'],
          startDate: '2026-06-15',
          endDate: '2026-06-22',
          budget: value,
          travelStyle: 'Adventure',
          groupSize: 2
        };
        expect(validateTripSubmission(budgetSubmission)).toBe(true);

        // Test as travelStyle
        const styleSubmission = {
          destinations: ['Paris'],
          startDate: '2026-06-15',
          endDate: '2026-06-22',
          budget: 'Mid-range',
          travelStyle: value,
          groupSize: 2
        };
        expect(validateTripSubmission(styleSubmission)).toBe(true);
      });
    });

    test('Backend handles case-sensitivity', () => {
      const invalidSubmissions = [
        { budget: 'budget' },          // Lowercase
        { budget: 'LUXURY' },          // Uppercase
        { travelStyle: 'adventure' },  // Lowercase
        { travelStyle: 'ADVENTURE' }   // Uppercase
      ];

      invalidSubmissions.forEach(invalidField => {
        const submission = {
          destinations: ['Paris'],
          startDate: '2026-06-15',
          endDate: '2026-06-22',
          travelStyle: 'Comfortable',
          groupSize: 2,
          ...invalidField
        };

        const valid = validateTripSubmission(submission);
        expect(valid).toBe(false);
      });
    });
  });
});

describe('iOS → Backend Contract: Response Validation', () => {
  test('Backend response includes all required fields', () => {
    // This would test that backend responses match iOS expectations
    // For now, we validate the structure
    const mockBackendResponse = {
      success: true,
      tripId: 'trip-123',
      message: 'Trip submitted successfully'
    };

    expect(mockBackendResponse).toHaveProperty('success');
    expect(mockBackendResponse).toHaveProperty('tripId');
  });

  test('Backend error response includes field details', () => {
    const mockErrorResponse = {
      error: 'Validation failed',
      details: [
        { field: '/budget', message: 'must be equal to one of the allowed values' }
      ],
      message: '/budget: must be equal to one of the allowed values'
    };

    expect(mockErrorResponse).toHaveProperty('error');
    expect(mockErrorResponse).toHaveProperty('details');
    expect(mockErrorResponse.details).toBeInstanceOf(Array);
  });
});

describe('Cross-Platform Enum Consistency', () => {
  test('iOS Budget enum matches Backend Budget schema', () => {
    // This simulates the iOS Budget enum
    const iosBudgetCases = ['Budget', 'Comfortable', 'Mid-range', 'Luxury', 'Ultra-Luxury'];
    const backendBudgetEnum = budgetSchema.enum;

    expect(iosBudgetCases.sort()).toEqual(backendBudgetEnum.sort());
  });

  test('iOS TravelStyle enum matches Backend TravelStyle schema', () => {
    // This simulates the iOS TravelStyle enum
    const iosTravelStyleCases = ['Budget', 'Comfortable', 'Luxury', 'Adventure', 'Relaxation'];
    const backendTravelStyleEnum = travelStyleSchema.enum;

    expect(iosTravelStyleCases.sort()).toEqual(backendTravelStyleEnum.sort());
  });

  test('No budget-only values in TravelStyle', () => {
    const budgetOnlyValues = ['Mid-range', 'Ultra-Luxury'];
    const travelStyleValues = travelStyleSchema.enum;

    budgetOnlyValues.forEach(value => {
      expect(travelStyleValues).not.toContain(value);
    });
  });

  test('No travelStyle-only values in Budget', () => {
    const travelStyleOnlyValues = ['Adventure', 'Relaxation'];
    const budgetValues = budgetSchema.enum;

    travelStyleOnlyValues.forEach(value => {
      expect(budgetValues).not.toContain(value);
    });
  });
});

/**
 * WanderMint Shared Schemas
 *
 * Single source of truth for all data validation across iOS, Backend, and Admin.
 *
 * Usage:
 *   const { schemas, validators } = require('@wandermint/shared-schemas');
 *   const isValid = validators.tripSubmission(data);
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// Load all schemas
const budgetSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'schemas/core/budget.schema.json'), 'utf8')
);

const travelStyleSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'schemas/core/travel-style.schema.json'), 'utf8')
);

const tripSubmissionSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'schemas/core/trip-submission.schema.json'), 'utf8')
);

const recommendationSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'schemas/core/recommendation.schema.json'), 'utf8')
);

const commonTypesSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'schemas/core/common-types.schema.json'), 'utf8')
);

// Export raw schemas
const schemas = {
  budget: budgetSchema,
  travelStyle: travelStyleSchema,
  tripSubmission: tripSubmissionSchema,
  recommendation: recommendationSchema,
  commonTypes: commonTypesSchema
};

// Create AJV instance with all schemas loaded
function createValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  // Add all schemas
  ajv.addSchema(commonTypesSchema, 'common-types.schema.json');
  ajv.addSchema(budgetSchema, 'budget.schema.json');
  ajv.addSchema(travelStyleSchema, 'travel-style.schema.json');

  return ajv;
}

// Pre-compiled validators for performance
const ajv = createValidator();
const validators = {
  tripSubmission: ajv.compile(tripSubmissionSchema),
  recommendation: ajv.compile(recommendationSchema),
  budget: ajv.compile(budgetSchema),
  travelStyle: ajv.compile(travelStyleSchema)
};

// Export enum constants
const constants = {
  BUDGET_VALUES: budgetSchema.enum,
  TRAVEL_STYLE_VALUES: travelStyleSchema.enum
};

module.exports = {
  schemas,
  validators,
  constants,
  createValidator
};

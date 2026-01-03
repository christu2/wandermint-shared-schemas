# WanderMint Shared Schemas

**Single Source of Truth** for all data contracts across iOS App, Backend API, and Admin Dashboard.

## 🎯 Purpose

Prevent schema mismatches like:
- iOS sending `budget: "$1500"` when backend expects enum `['Budget', 'Comfortable', 'Mid-range', 'Luxury', 'Ultra-Luxury']`
- Admin sending `travelStyle: "Hiking"` when backend expects `['Budget', 'Comfortable', 'Luxury', 'Adventure', 'Relaxation']`

## 📦 What's Included

### 1. **Core Schemas** (`schemas/core/`)
- `budget.schema.json` - Budget level enum (Budget, Comfortable, Mid-range, Luxury, Ultra-Luxury)
- `travel-style.schema.json` - Travel style enum (Budget, Comfortable, Luxury, Adventure, Relaxation)
- `trip-submission.schema.json` - Complete trip submission schema
- `recommendation.schema.json` - Trip recommendation response schema
- `common-types.schema.json` - Shared types (dates, currency, etc.)

### 2. **Generated Types** (`types/generated/`)
- **Swift/** - Auto-generated Swift enums for iOS (compile-time type safety)
- **TypeScript/** - Auto-generated TS types for Admin dashboard
- **Node.js/** - TypeScript definitions for Backend

### 3. **Contract Tests** (`tests/`)
- **pact/** - Pact contract tests (iOS↔Backend, Admin↔Backend)
- **contract-tests/** - Schema validation tests
- **fixtures/** - Test data fixtures

### 4. **Mock Server** (`mocks/`)
- Prism-based mock API server for integration testing
- Validates requests/responses against schemas

### 5. **CI/CD Scripts** (`ci-cd/`)
- `validate-schemas.sh` - Validate all schema files
- `generate-types.sh` - Regenerate types for all platforms
- `run-contract-tests.sh` - Execute full contract test suite

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Validate all schemas
npm run validate

# Generate types for all platforms
npm run generate:all

# Run contract tests
npm run test:contracts

# Start mock server
npm run mock:server
```

## 📝 Schema Versioning

All schemas follow semantic versioning:
- **Major** (1.x.x): Breaking changes (remove fields, change types)
- **Minor** (x.1.x): New fields (backwards compatible)
- **Patch** (x.x.1): Documentation, examples

Each schema includes:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-02",
  "changelog": [...]
}
```

## 🔄 Workflow

### Adding a New Enum Value

1. **Update schema**: Edit `schemas/core/budget.schema.json`
2. **Validate**: `npm run validate`
3. **Generate types**: `npm run generate:all`
4. **Run tests**: `npm test`
5. **Sync to platforms**: `npm run sync`
6. **Commit**: All changes (schema + generated types)

### Before Every Deploy

```bash
npm run ci:validate  # Validates schemas + runs all tests
npm run ci:generate  # Ensures generated types are up-to-date
```

## 📊 Contract Testing

### iOS ↔ Backend
- Tests that iOS can only send valid budget/travelStyle values
- Tests that Backend accepts all iOS-generated values
- Tests that Backend responses match iOS expectations

### Admin ↔ Backend
- Tests that Admin sends valid recommendation data
- Tests that Admin UI displays all backend enum values
- Tests that form validation matches backend schemas

## 🔍 Finding Schema Mismatches

Run the enum conflict checker:
```bash
npm run validate:enums
```

This checks:
- ✅ Budget enum doesn't contain travel-style-only values
- ✅ TravelStyle enum doesn't contain budget-only values
- ✅ iOS travelStyles array matches schema
- ✅ Admin dropdown options match schema

## 📂 Directory Structure

```
shared-schemas/
├── schemas/core/           # Source of truth
├── types/generated/        # Auto-generated (don't edit manually)
├── tests/                  # Contract & validation tests
├── mocks/                  # Mock server & fixtures
├── ci-cd/                  # CI/CD automation
└── scripts/                # Type generation scripts
```

## 🛠️ Development

### Running Tests Locally

```bash
# All tests
npm test

# Contract tests only
npm run test:pact

# Watch mode
npm run test:watch
```

### Debugging Type Generation

```bash
# Generate Swift types with verbose output
DEBUG=* npm run generate:swift

# Generate TypeScript types
npm run generate:ts
```

## 🚨 Common Issues

### "Schema validation failed"
- Check that enum values match between iOS/Admin/Backend
- Run `npm run validate:enums`

### "Generated types out of date"
- Run `npm run generate:all`
- Commit the updated generated files

### "Contract test failed"
- Check Pact error details
- Ensure mock server is running: `npm run mock:server`

## 📞 Support

For schema changes or questions, see:
- `schemas/core/README.md` - Schema documentation
- `tests/pact/README.md` - Contract testing guide
- Main project: `/Users/nick/Development/travelBusiness/`

---

**Version**: 1.0.0
**Last Updated**: January 2, 2026
**Maintained By**: WanderMint Team

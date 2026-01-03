# NPM & Swift Package Workflow Guide

Complete guide for using `@wandermint/shared-schemas` as an NPM package (Backend/Admin) and Swift Package (iOS).

---

## Overview

**Repository**: https://github.com/christu2/wandermint-shared-schemas

**Packages:**
- **NPM**: `@wandermint/shared-schemas` (for Backend & Admin)
- **Swift Package**: `wandermint-shared-schemas` (for iOS)

---

## Backend & Admin: NPM Package

### Installation

```bash
# In Backend repo (travel-backend-google/functions):
cd functions
npm install @wandermint/shared-schemas

# In Admin repo (travelAdmin):
npm install @wandermint/shared-schemas
```

### Usage

```javascript
// Import schemas and validators
const { schemas, validators, constants } = require('@wandermint/shared-schemas');

// Validate trip submission
const tripData = {
  destinations: ['Paris'],
  budget: 'Budget',
  travelStyle: 'Adventure',
  groupSize: 2
};

const isValid = validators.tripSubmission(tripData);
if (!isValid) {
  console.error('Validation errors:', validators.tripSubmission.errors);
}

// Access enum constants
console.log('Valid budgets:', constants.BUDGET_VALUES);
// ['Budget', 'Comfortable', 'Mid-range', 'Luxury', 'Ultra-Luxury']

// Access raw schemas
const budgetSchema = schemas.budget;
```

### Updating to New Version

```bash
# Check current version
npm list @wandermint/shared-schemas

# Update to latest
npm update @wandermint/shared-schemas

# Or install specific version
npm install @wandermint/shared-schemas@1.1.0

# Commit the updated package-lock.json
git add package.json package-lock.json
git commit -m "Update shared-schemas to v1.1.0"
```

---

## iOS: Swift Package Manager

### Initial Setup in Xcode

1. **Open your iOS project** (`WanderMint.xcodeproj`)

2. **Add Package Dependency:**
   - File → Add Package Dependencies...
   - Enter URL: `https://github.com/christu2/wandermint-shared-schemas`
   - **Dependency Rule**: Select "Up to Next Major Version"
   - **Version**: `1.0.0` (or latest)
   - Click "Add Package"

3. **Select Package Product:**
   - Check ✅ **WanderMintSchemas**
   - Target: **WanderMint**
   - Click "Add Package"

4. **Verify Installation:**
   - In Project Navigator, you should see "Package Dependencies"
   - Under it: "wandermint-shared-schemas"

### Usage in Swift

```swift
import WanderMintSchemas

// Use Budget enum
@State private var budget: Budget? = nil

// Display all budget options
ForEach(Budget.allCases, id: \.self) { budgetOption in
    Text(budgetOption.displayName)
}

// Send to API (converts to raw string)
let submission = TripSubmission(
    budget: budget?.rawValue,
    travelStyle: travelStyle?.rawValue
)

// Access schema metadata
print("Budget version:", SchemaMetadata.budgetVersion)
print("Valid values:", SchemaMetadata.validBudgetValues)
```

### Updating to New Version

**Method 1: Xcode UI**

1. File → Packages → Update to Latest Package Versions
2. Xcode will fetch the latest version matching your dependency rule
3. Build and test

**Method 2: Manual Version Change**

1. Select project in Navigator
2. Go to "Package Dependencies" tab
3. Select `wandermint-shared-schemas`
4. Change version to specific version (e.g., `1.1.0`)
5. Click outside to trigger update
6. Xcode will resolve and download

**Method 3: Package.resolved File**

```bash
# Remove resolved versions (forces update)
rm -rf WanderMint.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved

# Xcode will re-resolve on next build
```

### Version Pinning (Recommended)

In Xcode Package Dependencies:
- **Dependency Rule**: "Up to Next Major Version"
- **Version**: `1.0.0`
- **Result**: Will auto-update to `1.x.x` but not `2.0.0`

This ensures you get bug fixes and new features without breaking changes.

---

## Publishing New Versions

### For Maintainers

When you make changes to schemas:

**1. Update Schemas**

```bash
cd /Users/nick/Development/travelBusiness/shared-schemas

# Edit schemas
vim schemas/core/budget.schema.json

# Regenerate types
npm run generate:all

# Run tests
npm test
```

**2. Bump Version**

```bash
# For bug fixes (1.0.0 → 1.0.1)
npm version patch

# For new features (1.0.0 → 1.1.0)
npm version minor

# For breaking changes (1.0.0 → 2.0.0)
npm version major
```

This automatically:
- Updates `package.json` version
- Creates a git commit
- Creates a git tag

**3. Push to GitHub**

```bash
git push --follow-tags
```

This triggers:
- GitHub Actions (runs contract tests)
- Swift Package Manager sees the new tag
- NPM package can be published

**4. Publish to NPM**

```bash
npm publish
```

**5. Notify Teams**

```
@team New shared-schemas version v1.1.0 released!

Changes:
- Added "Premium" budget tier
- Fixed validation for group sizes

To update:
- Backend/Admin: npm install @wandermint/shared-schemas@1.1.0
- iOS: File → Packages → Update to Latest
```

---

## Workflow Examples

### Example 1: Adding New Budget Tier

**Scenario**: Add "Backpacker" budget tier

```bash
# 1. Update schema
cd shared-schemas
vim schemas/core/budget.schema.json
# Add "Backpacker" to enum array

# 2. Regenerate types
npm run generate:all

# 3. Run tests
npm test
# ❌ Tests fail - need to update test data

# 4. Update tests
vim tests/schema-validation.test.js
# Add "Backpacker" to test cases

# 5. Run tests again
npm test
# ✅ All pass

# 6. Bump version (minor - new feature)
npm version minor
# → v1.1.0

# 7. Push
git push --follow-tags

# 8. Publish to NPM
npm publish

# 9. Update Backend
cd ../travel-backend-google/functions
npm install @wandermint/shared-schemas@1.1.0
git add package.json package-lock.json
git commit -m "Update schemas - add Backpacker budget tier"
git push

# 10. Update Admin
cd ../../travelAdmin
npm install @wandermint/shared-schemas@1.1.0
git commit -am "Update schemas - add Backpacker budget tier"
git push

# 11. Update iOS
# Open Xcode
# File → Packages → Update to Latest Package Versions
# Build and test
# Commit: "Update schemas - add Backpacker budget tier"
```

### Example 2: Breaking Change (Remove Enum Value)

**Scenario**: Remove "Mid-range" budget tier (breaking change!)

```bash
# 1. Decide on major version bump (1.1.0 → 2.0.0)
cd shared-schemas

# 2. Update schema
vim schemas/core/budget.schema.json
# Remove "Mid-range" from enum

# 3. Regenerate types
npm run generate:all

# 4. Update ALL tests
npm test
# Fix failing tests

# 5. Bump MAJOR version
npm version major
# → v2.0.0

# 6. Create migration guide
cat > MIGRATION_v2.md <<EOF
# Migration Guide: v1.x → v2.0

## Breaking Changes

- **Removed**: \`Budget.Mid-range\`
- **Replacement**: Use \`Budget.Comfortable\` instead

## Code Changes Required

### iOS
\`\`\`swift
// Before
budget = .midrange

// After
budget = .comfortable
\`\`\`

### Backend
\`\`\`javascript
// Before
budget: 'Mid-range'

// After
budget: 'Comfortable'
\`\`\`
EOF

# 7. Commit migration guide
git add MIGRATION_v2.md
git commit -m "Add migration guide for v2.0"
git push --follow-tags

# 8. Publish to NPM
npm publish

# 9. Update each platform carefully
# - Read migration guide
# - Update code
# - Test thoroughly
# - Deploy
```

---

## Semantic Versioning Rules

Follow [Semantic Versioning](https://semver.org/):

**MAJOR.MINOR.PATCH** (e.g., `2.1.3`)

### MAJOR (Breaking Changes)

**When to bump:** Changes that break existing code

Examples:
- Remove enum value
- Change enum value names
- Remove required field
- Change field type

**Version bump:** `1.0.0` → `2.0.0`

### MINOR (New Features)

**When to bump:** Backward-compatible new features

Examples:
- Add new enum value
- Add new optional field
- Add new schema

**Version bump:** `1.0.0` → `1.1.0`

### PATCH (Bug Fixes)

**When to bump:** Backward-compatible bug fixes

Examples:
- Fix typo in description
- Fix validation regex
- Update documentation

**Version bump:** `1.0.0` → `1.0.1`

---

## Contract Testing Integration

### Backend Contract Tests

```javascript
// functions/tests/contract-validation.test.js
const { validators } = require('@wandermint/shared-schemas');

describe('Backend accepts valid iOS submissions', () => {
  test('Valid budget + travelStyle', () => {
    const submission = {
      destinations: ['Paris'],
      budget: 'Budget',
      travelStyle: 'Adventure',
      groupSize: 2
    };

    expect(validators.tripSubmission(submission)).toBe(true);
  });
});
```

### GitHub Actions Workflow

```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests

on:
  pull_request:
    paths:
      - 'package.json'      # Catch schema version changes
      - 'package-lock.json'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
```

This ensures:
- ✅ Any PR that updates schemas runs contract tests
- ✅ Breaking changes are caught before merge
- ✅ All platforms stay in sync

---

## Troubleshooting

### NPM: "Cannot find module '@wandermint/shared-schemas'"

**Problem:** Package not installed

**Solution:**
```bash
npm install @wandermint/shared-schemas
```

### NPM: "Version X.Y.Z not found"

**Problem:** Version not published yet

**Solution:**
```bash
# Check available versions
npm view @wandermint/shared-schemas versions

# Install latest
npm install @wandermint/shared-schemas@latest
```

### Swift: "No such module 'WanderMintSchemas'"

**Problem:** Package not added to Xcode project

**Solution:**
1. File → Add Package Dependencies...
2. Add `https://github.com/christu2/wandermint-shared-schemas`
3. Ensure target is selected

### Swift: Package update not working

**Problem:** Xcode caching old version

**Solution:**
```bash
# Clear package cache
rm -rf ~/Library/Caches/org.swift.swiftpm
rm -rf WanderMint.xcodeproj/project.xcworkspace/xcshareddata/swiftpm

# Reopen Xcode
open WanderMint.xcodeproj
```

### Contract Tests Failing After Update

**Problem:** Code not updated for new schema version

**Solution:**
1. Check version: `npm list @wandermint/shared-schemas`
2. Read CHANGELOG.md for breaking changes
3. Update code to match new schemas
4. Run tests: `npm test`

---

## Best Practices

### 1. Version Pinning

**Backend/Admin package.json:**
```json
{
  "dependencies": {
    "@wandermint/shared-schemas": "^1.0.0"
  }
}
```

`^1.0.0` means: "1.x.x" (auto-update minor/patch, not major)

**iOS Package Dependencies:**
- Rule: "Up to Next Major Version"
- Ensures automatic bug fixes, prevents breaking changes

### 2. Update Strategy

**Option A: Stay on Latest (Recommended)**
- Automatically get bug fixes and new features
- Occasionally update code when minor versions add features
- Only blocked by major versions (breaking changes)

**Option B: Conservative (Pin Exact Version)**
- Manually update when ready
- Full control over when changes happen
- More work to stay up-to-date

**Recommendation:** Use Option A with good CI/CD testing

### 3. Communication

When publishing new versions:

1. **Update CHANGELOG.md** with all changes
2. **Tag releases** on GitHub with release notes
3. **Notify team** via Slack/email
4. **Document breaking changes** in MIGRATION.md
5. **Update dependent repos** within 1 week

### 4. Testing Before Release

```bash
# Run full test suite
npm run ci:validate

# Verify type generation
npm run generate:all
git diff types/generated/
# Should show no unexpected changes

# Test in all platforms locally before publishing
```

---

## Summary

### Quick Reference

**Install Package:**
```bash
# Backend/Admin
npm install @wandermint/shared-schemas

# iOS
File → Add Package Dependencies →
https://github.com/christu2/wandermint-shared-schemas
```

**Update Package:**
```bash
# Backend/Admin
npm update @wandermint/shared-schemas

# iOS
File → Packages → Update to Latest
```

**Publish New Version:**
```bash
npm version [patch|minor|major]
git push --follow-tags
npm publish
```

**Check Current Version:**
```bash
# Backend/Admin
npm list @wandermint/shared-schemas

# iOS
Xcode → Package Dependencies tab
```

---

**Questions?** Check the [main README](./README.md) or [Contract Testing Guide](./CONTRACT_TESTING_GUIDE.md)

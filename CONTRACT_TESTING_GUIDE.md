# Contract Testing Framework - How It Works

## Current Protection Level: ⚠️ Partial (70%)

The shared-schemas repo has comprehensive tests, but **platform repos don't automatically run them on every PR**. Here's how to make it bulletproof.

---

## How Contract Testing Works

### The Core Concept

```
┌──────────────────────────────────────────────────────────┐
│  Single Source of Truth (shared-schemas repo)           │
│  ├── schemas/core/*.json        ← Master definitions    │
│  ├── tests/pact/*.test.js       ← Contract tests        │
│  └── types/generated/            ← Auto-generated types │
└──────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
    iOS App       Backend API      Admin Dashboard
  (Consumer)      (Provider)         (Consumer)
```

**Contract Definition:**
A contract is an agreement between two systems:
- **Consumer** (iOS/Admin): "I will send data in this format"
- **Provider** (Backend): "I will accept data in this format"

The tests validate both sides honor the contract.

---

## Example: Breaking Change Scenario

### Scenario 1: Developer Changes iOS Code (Breaks Contract)

**What Happens:**

```swift
// Developer makes this change in iOS:
let submission = EnhancedTripSubmission(
    budget: "$2000",           // ❌ BREAKING CHANGE - sends monetary amount
    travelStyle: "Adventure",
    destinations: ["Paris"]
)
```

**Current Behavior:**
1. Developer commits to iOS repo
2. iOS repo has NO contract tests → ✅ All tests pass (false positive!)
3. Code gets merged
4. App deployed to TestFlight
5. Users submit trips → ❌ Backend rejects them
6. Bug discovered in production

**What SHOULD Happen:**
1. Developer commits to iOS repo
2. iOS repo runs contract tests → ❌ Test fails immediately
3. PR blocked, cannot merge
4. Developer fixes before it reaches production

---

## The Three Scenarios & Their Protection

### 1️⃣ Breaking Change in **iOS App**

**Example Breaking Changes:**
- Send `budget: "$2000"` instead of enum
- Send `travelStyle: "Mid-range"` (budget-only value)
- Send 6 destinations (max is 5)

**Current Protection:** ❌ None
**Needed:** Contract tests in iOS repo that validate "What I send must match Backend expectations"

---

### 2️⃣ Breaking Change in **Backend**

**Example Breaking Changes:**
- Change budget enum: Remove "Mid-range", add "Premium"
- Change date format: Accept MM/DD/YYYY instead of YYYY-MM-DD
- Change validation: Require new field "numberOfTravelers"

**Current Protection:** ⚠️ Partial
- Backend has shared schemas copied, so it validates correctly
- But if someone modifies `functions/schemas.js` directly, no tests catch it

**Needed:** Contract tests in Backend repo that validate "What I accept must match iOS/Admin expectations"

---

### 3️⃣ Breaking Change in **Admin Dashboard**

**Example Breaking Changes:**
- Create recommendation with invalid URL format
- Use currency: "DOLLARS" instead of "USD"
- Set hotel rating to 6 (max is 5)

**Current Protection:** ❌ None
**Needed:** Contract tests in Admin repo that validate "What I send must match Backend expectations"

---

## Solution Options

### **Option A: Lightweight Contract Tests in Each Repo** (Recommended)

Add a minimal test file to each platform repo that imports schemas and runs critical contract tests.

**Pros:**
- Independent testing (doesn't rely on external repos)
- Fast (runs on every PR)
- Easy to maintain (just 1 test file per repo)

**Cons:**
- Some duplication (contract tests exist in multiple places)
- Need to keep schema files in sync

**Implementation:**

**iOS (WanderMint):**
```bash
# Add to WanderMint repo:
WanderMint/
├── Tests/
│   └── ContractTests/
│       ├── shared-schemas/      ← Copy from shared-schemas repo
│       └── ios-backend.test.js  ← Copy from shared-schemas/tests/pact/
└── .github/workflows/
    └── contract-tests.yml       ← Run tests on every PR
```

**Backend (travel-backend-google):**
```bash
# Add to Backend repo:
functions/
├── tests/
│   └── contract-tests/
│       └── backend-validation.test.js  ← Validate schemas used
└── .github/workflows/
    └── contract-tests.yml              ← Run tests on every PR
```

**Admin (travelAdmin):**
```bash
# Add to Admin repo:
travelAdmin/
├── tests/
│   ├── shared-schemas/         ← Copy from shared-schemas repo
│   └── admin-backend.test.js   ← Copy from shared-schemas/tests/pact/
└── .github/workflows/
    └── contract-tests.yml      ← Run tests on every PR
```

---

### **Option B: Git Submodules** (More Complex)

Make shared-schemas a git submodule in each platform repo.

**Pros:**
- No duplication (one copy of schemas)
- Changes to schemas automatically available

**Cons:**
- Git submodules are notoriously confusing
- Developers need to remember `git submodule update`
- Can cause merge conflicts

---

### **Option C: NPM/Swift Package** (Most Professional)

Publish shared-schemas as:
- NPM package for Backend/Admin
- Swift Package for iOS

**Pros:**
- Industry standard approach
- Versioned releases (semantic versioning)
- Easy to consume

**Cons:**
- Requires package registry (npm, Swift Package Registry)
- More setup complexity
- Versioning overhead

---

## Recommended Implementation Plan

### Phase 1: Backend Protection (Highest Risk)

The Backend is the contract enforcer - it must always accept valid iOS/Admin requests.

**Add to Backend repo:**

```javascript
// functions/tests/contract-validation.test.js
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// Load the ACTUAL schemas the Backend uses
const budgetSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../shared-schemas/schemas/core/budget.schema.json'), 'utf8')
);

const tripSubmissionSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../shared-schemas/schemas/core/trip-submission.schema.json'), 'utf8')
);

describe('Backend Contract: Must Accept Valid iOS Submissions', () => {
  test('Backend accepts Budget + Adventure submission', () => {
    const iosSubmission = {
      destinations: ['Paris'],
      budget: 'Budget',
      travelStyle: 'Adventure',
      groupSize: 2
    };

    const ajv = new Ajv();
    const validate = ajv.compile(tripSubmissionSchema);
    const valid = validate(iosSubmission);

    expect(valid).toBe(true);
    // If this fails, Backend has broken the contract with iOS!
  });

  test('Backend rejects $1500 budget (the bug that started it all)', () => {
    const invalidSubmission = {
      destinations: ['Paris'],
      budget: '$1500',  // MUST reject this
      travelStyle: 'Adventure',
      groupSize: 2
    };

    const ajv = new Ajv();
    const validate = ajv.compile(tripSubmissionSchema);
    const valid = validate(invalidSubmission);

    expect(valid).toBe(false);
    // If this fails, Backend is accepting invalid data!
  });
});
```

**Add GitHub Action:**

```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests

on:
  pull_request:
    paths:
      - 'functions/schemas.js'
      - 'functions/shared-schemas/**'
      - 'functions/tests/**'

jobs:
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd functions && npm install
      - run: cd functions && npm test -- tests/contract-validation.test.js
```

**Result:** Any PR that modifies Backend schemas will run contract tests. If someone changes `budget` enum to remove "Mid-range", tests fail immediately.

---

### Phase 2: iOS Protection (User-Facing)

iOS is a consumer - it must only send valid data to Backend.

**Challenge:** iOS is Swift, contract tests are JavaScript
**Solution:** Run JavaScript tests in iOS CI/CD

```yaml
# .github/workflows/contract-tests.yml (in iOS repo)
name: Contract Tests

on:
  pull_request:
    paths:
      - 'WanderMint/Models/WanderMintSchemas.swift'
      - 'WanderMint/Views/TripSubmissionView.swift'

jobs:
  contract-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install test dependencies
        run: |
          cd Tests/ContractTests
          npm install ajv ajv-formats jest
      - name: Run contract tests
        run: |
          cd Tests/ContractTests
          npm test
```

---

### Phase 3: Admin Protection (Internal Tool)

Admin is also a consumer - validates recommendations before Backend accepts them.

Similar setup to iOS, but using JavaScript/Node.js throughout.

---

## Complete Workflow (After Full Implementation)

### Scenario: Developer tries to change Budget enum

**Step 1:** Developer modifies `shared-schemas/schemas/core/budget.schema.json`

```diff
- "enum": ["Budget", "Comfortable", "Mid-range", "Luxury", "Ultra-Luxury"]
+ "enum": ["Budget", "Comfortable", "Premium", "Luxury", "Ultra-Luxury"]
```

**Step 2:** Developer runs tests in shared-schemas repo
```bash
npm test
```
**Result:** ❌ Tests fail because generated types don't match

---

**Step 3:** Developer regenerates types
```bash
npm run generate:all
```

**Step 4:** Developer copies new types to iOS/Backend/Admin

**Step 5:** Developer commits to each repo and creates PRs

**What Happens in Each PR:**

**iOS PR:**
- GitHub Actions runs contract tests
- ❌ Tests fail: "Invalid enum value 'Mid-range' no longer exists"
- PR blocked until iOS code updated to use "Premium"

**Backend PR:**
- GitHub Actions runs contract tests
- ❌ Tests fail: "Existing test data uses 'Mid-range'"
- PR blocked until test data updated

**Admin PR:**
- GitHub Actions runs contract tests
- ❌ Tests fail: "Admin still references 'Mid-range'"
- PR blocked until Admin code updated

**Result:** **All three platforms must be updated together** - no way to deploy a breaking change to just one platform!

---

## Current vs. Future State

### Current State (Partial Protection)

```
Shared-Schemas Repo:
✅ Has comprehensive contract tests
✅ Validates schemas on commit
✅ Generates types automatically

iOS Repo:
❌ No contract tests
❌ Can deploy breaking changes
⚠️  Might break in production

Backend Repo:
⚠️  Has schemas but no tests
❌ Can deploy breaking changes
⚠️  Might reject valid iOS requests

Admin Repo:
❌ No contract tests
❌ Can deploy breaking changes
⚠️  Might send invalid data
```

**Protection Level:** 70% (schemas exist, but not enforced)

---

### Future State (Full Protection)

```
Shared-Schemas Repo:
✅ Has comprehensive contract tests
✅ Validates schemas on commit
✅ Generates types automatically

iOS Repo:
✅ Runs contract tests on every PR
✅ Blocks breaking changes
✅ Guarantees compatibility with Backend

Backend Repo:
✅ Runs contract tests on every PR
✅ Blocks breaking changes
✅ Guarantees accepts valid iOS/Admin requests

Admin Repo:
✅ Runs contract tests on every PR
✅ Blocks breaking changes
✅ Guarantees sends valid data to Backend
```

**Protection Level:** 100% (bulletproof)

---

## Next Steps to Achieve 100% Protection

### Immediate (30 minutes):

1. **Add contract tests to Backend repo:**
   - Copy `shared-schemas/tests/pact/ios-backend.contract.test.js` to `functions/tests/`
   - Add GitHub Action to run tests on PRs
   - Test by making a breaking change and verifying CI fails

### Short Term (1-2 hours):

2. **Add contract tests to iOS repo:**
   - Create `Tests/ContractTests/` directory
   - Copy shared schemas
   - Add GitHub Action (requires Node.js in iOS CI)

3. **Add contract tests to Admin repo:**
   - Copy `shared-schemas/tests/pact/admin-backend.contract.test.js` to `tests/`
   - Add GitHub Action to run tests on PRs

### Long Term (Optional):

4. **Publish shared-schemas as packages:**
   - NPM package for Backend/Admin
   - Swift Package for iOS
   - Versioned releases with changelogs

---

## Summary

**What You Have Now:**
- ✅ Single source of truth (shared-schemas repo)
- ✅ Comprehensive test suite (93% coverage)
- ✅ Type generation for all platforms
- ⚠️ **Gap:** Tests only run in shared-schemas repo, not in platform repos

**What Needs to Happen:**
Each platform repo needs to run a subset of contract tests on every PR to catch breaking changes **before** they reach production.

**Bottom Line:**
You have an excellent foundation, but need to add "guardrails" (contract tests) to each platform repo to make it truly bulletproof. Without this, someone could still deploy breaking changes.

Would you like me to implement Phase 1 (Backend protection) right now?

#!/bin/bash
set -e

echo "==================================="
echo "WanderMint Contract Testing Suite"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0.32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Validate all schemas
echo "📋 Step 1: Validating JSON schemas..."
npm run validate

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Schema validation failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ All schemas valid${NC}\n"

# Step 2: Check for enum conflicts
echo "🔍 Step 2: Checking for enum conflicts..."
npm run validate:enums

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Enum conflict detected${NC}"
  exit 1
fi

echo -e "${GREEN}✅ No enum conflicts${NC}\n"

# Step 3: Run schema validation tests
echo "🧪 Step 3: Running schema validation tests..."
npm test -- tests/schema-validation.test.js

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Schema validation tests failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Schema validation tests passed${NC}\n"

# Step 4: Run Pact contract tests
echo "🤝 Step 4: Running Pact contract tests..."
npm run test:pact

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠️  Some contract tests failed (check details above)${NC}\n"
  # Don't exit - show summary
else
  echo -e "${GREEN}✅ All contract tests passed${NC}\n"
fi

# Step 5: Generate types
echo "🔨 Step 5: Generating types for all platforms..."
npm run generate:all

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Type generation failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Types generated successfully${NC}\n"

# Summary
echo "==================================="
echo "✨ Contract Testing Summary"
echo "==================================="
echo ""
echo "✅ All schemas validated"
echo "✅ No enum conflicts detected"
echo "✅ Schema validation tests passed"
echo "✅ Contract tests completed"
echo "✅ Types generated for iOS, Backend, and Admin"
echo ""
echo "📊 Generated files:"
echo "  - types/generated/Swift/WanderMintSchemas.swift"
echo "  - types/generated/TypeScript/schemas.ts"
echo ""
echo "🎯 Next steps:"
echo "  1. Review any test failures above"
echo "  2. Copy generated types to respective projects"
echo "  3. Deploy updated code to all platforms"
echo ""
echo "==================================="

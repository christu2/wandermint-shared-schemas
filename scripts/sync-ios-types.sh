#!/bin/bash
# Sync generated Swift types to iOS app
# Run this after generating new types: npm run generate:swift

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_SCHEMAS_ROOT="$(dirname "$SCRIPT_DIR")"
IOS_PROJECT_ROOT="/Users/nick/Development/travelBusiness/WanderMint"

SWIFT_TYPES="$SHARED_SCHEMAS_ROOT/types/generated/Swift/WanderMintSchemas.swift"
IOS_MODELS="$IOS_PROJECT_ROOT/WanderMint/Models/WanderMintSchemas.swift"

echo "🔄 Syncing Swift types to iOS app..."
echo ""
echo "Source: $SWIFT_TYPES"
echo "Target: $IOS_MODELS"
echo ""

# Check source exists
if [ ! -f "$SWIFT_TYPES" ]; then
    echo "❌ Error: Swift types not found at $SWIFT_TYPES"
    echo "Run 'npm run generate:swift' first"
    exit 1
fi

# Check iOS project exists
if [ ! -d "$IOS_PROJECT_ROOT" ]; then
    echo "❌ Error: iOS project not found at $IOS_PROJECT_ROOT"
    exit 1
fi

# Copy file
cp "$SWIFT_TYPES" "$IOS_MODELS"

echo "✅ Swift types synced successfully!"
echo ""
echo "Next steps:"
echo "  1. cd $IOS_PROJECT_ROOT"
echo "  2. Build in Xcode to verify no errors"
echo "  3. Run contract tests to verify compatibility"
echo ""

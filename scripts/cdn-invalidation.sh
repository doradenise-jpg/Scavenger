#!/bin/bash
set -e

DISTRIBUTION_ID="${DISTRIBUTION_ID:-E1234567890ABC}"
PATHS="${1:-/*}"

echo "Invalidating CloudFront distribution: $DISTRIBUTION_ID"
echo "Paths: $PATHS"

# Create invalidation
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths $PATHS \
  --query 'Invalidation.Id' \
  --output text)

echo "Invalidation created: $INVALIDATION_ID"

# Wait for invalidation to complete
echo "Waiting for invalidation to complete..."
aws cloudfront wait invalidation-completed \
  --distribution-id "$DISTRIBUTION_ID" \
  --id "$INVALIDATION_ID"

echo "Invalidation complete!"

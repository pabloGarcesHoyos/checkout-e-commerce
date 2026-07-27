#!/usr/bin/env bash
# Rebuilds the frontend for production and publishes it to S3 + CloudFront.
#
# The production build bakes VITE_* variables into the JS bundle at build time
# (Vite has no runtime env support in a static build). If the real payment
# gateway variables aren't set, paymentGateway.ts silently falls back to a
# placeholder host that doesn't resolve — this happened once already (see
# README "Known limitations"). This script refuses to build if they're
# missing instead of failing silently.
#
# Reads frontend/.env.production.local if present (gitignored, holds the real
# values — see README Deployment section for what to put in it). You can also
# export the same variables in your shell before running this script instead.
set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"
S3_BUCKET="checkout-frontend-963094588518"
CLOUDFRONT_DISTRIBUTION_ID="E3UNATSVE2B4SV"

cd "$FRONTEND_DIR"

if [ -f .env.production.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production.local
  set +a
fi

REQUIRED_VARS=(VITE_API_BASE_URL VITE_PAYMENT_GATEWAY_BASE_URL VITE_PAYMENT_GATEWAY_PUBLIC_KEY)
missing=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "ERROR: missing required env vars for a real production build: ${missing[*]}" >&2
  echo "Set them in frontend/.env.production.local (gitignored) or export them before running this script." >&2
  exit 1
fi

echo "Building with:"
echo "  VITE_API_BASE_URL=$VITE_API_BASE_URL"
echo "  VITE_PAYMENT_GATEWAY_BASE_URL=$VITE_PAYMENT_GATEWAY_BASE_URL"
echo "  VITE_PAYMENT_GATEWAY_PUBLIC_KEY=${VITE_PAYMENT_GATEWAY_PUBLIC_KEY:0:12}... (truncated)"

rm -rf dist
npx vite build

if grep -rq "sandbox.payment-gateway.example" dist/assets/*.js; then
  echo "ERROR: the built bundle still contains the placeholder gateway URL — build did not pick up the real env vars." >&2
  exit 1
fi

aws s3 sync dist/ "s3://${S3_BUCKET}/" --delete
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --query "Invalidation.Id" --output text)

echo "Invalidation $INVALIDATION_ID created, waiting for it to complete..."
aws cloudfront wait invalidation-completed \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --id "$INVALIDATION_ID"

echo "Done. Frontend live at https://d1n0zu6ihia3uo.cloudfront.net"

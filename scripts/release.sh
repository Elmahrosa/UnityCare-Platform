#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh v1.0.0"
  exit 1
fi

# Validate semver format
if ! [[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must match vMAJOR.MINOR.PATCH"
  exit 1
fi

# Ensure we're on main and clean
BRANCH=$(git branch --show-current)
if [[ "$BRANCH" != "main" ]]; then
  echo "Error: Must be on main branch. Current: $BRANCH"
  exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Working tree has uncommitted changes"
  git status --porcelain
  exit 1
fi

# Pull latest
git pull origin main

# Run full test suite before release
echo "Running backend tests..."
cd backend && python -m pytest tests/ -v --tb=short && cd ..
echo "Running frontend tests..."
cd frontend && npm test -- --passWithNoTests && cd ..
echo "Running frontend build..."
cd frontend && npm run build && cd ..
echo "Running audit verifier..."
node audit/verify.js --summary-only

echo "All checks passed. Creating tag $VERSION..."
git tag -a "$VERSION" -m "Release $VERSION"
git push origin "$VERSION"

echo "✅ Release $VERSION tagged and pushed. GitHub Actions will create the release."

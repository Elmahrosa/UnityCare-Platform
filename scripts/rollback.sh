#!/usr/bin/env bash
set -euo pipefail

# UnityCare Platform — Emergency Rollback Script
# Usage: ./scripts/rollback.sh [target-tag]
# If no tag specified, rolls back to the previous release tag.

PREV_TAG="${1:-}"

if [[ -z "$PREV_TAG" ]]; then
  # Find the second-most-recent tag
  PREV_TAG=$(git tag --sort=-version:refname | head -2 | tail -1)
fi

if [[ -z "$PREV_TAG" ]]; then
  echo "ERROR: No previous tag found to rollback to."
  exit 1
fi

echo "╔══════════════════════════════════════════════════════╗"
echo "║  UNITYCARE PLATFORM — EMERGENCY ROLLBACK             ║"
echo "║  Target: $PREV_TAG"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "THIS WILL:"
echo "  1. Reset local main to $PREV_TAG"
echo "  2. Force-push to origin/main"
echo "  3. Trigger Railway redeploy of $PREV_TAG"
echo ""
read -p "Type ROLLBACK to confirm: " CONFIRM

if [[ "$CONFIRM" != "ROLLBACK" ]]; then
  echo "Aborted."
  exit 0
fi

# Create a rollback audit event
ROLLBACK_EVENT=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "event_type": "ROLLBACK",
  "actor": "$(whoami)",
  "target_tag": "$PREV_TAG",
  "reason": "manual_emergency_rollback",
  "previous_head": "$(git rev-parse HEAD)"
}
EOF
)

echo "$ROLLBACK_EVENT" >> rollback_audit.log

git checkout main
git reset --hard "$PREV_TAG"
git push origin main --force

echo ""
echo "✅ Rollback complete. Railway will redeploy $PREV_TAG."
echo "   Rollback event logged to rollback_audit.log"

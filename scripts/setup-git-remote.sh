#!/usr/bin/env bash
# Sets the origin remote URL to use the GITHUB_PAT secret for authenticated pushes.
# Run this once per Replit session before pushing:
#   bash scripts/setup-git-remote.sh

set -euo pipefail

if [ -z "${GITHUB_PAT:-}" ]; then
  echo "ERROR: GITHUB_PAT secret is not set."
  echo "Add it in the Replit Secrets tab and re-run this script."
  exit 1
fi

REPO="github.com/zentaker/REACT-NATIVE-ParkChatApp"
AUTHED_URL="https://${GITHUB_PAT}@${REPO}"

git remote set-url origin "$AUTHED_URL"
echo "Remote 'origin' updated to use GITHUB_PAT."
echo "You can now run: git push origin main"

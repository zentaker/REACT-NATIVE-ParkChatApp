#!/bin/bash
set -e

if [ -f package.json ]; then
  npm install --no-audit --no-fund --silent
fi

if [ -z "${GITHUB_PAT:-}" ]; then
  echo "GITHUB_PAT is not set — skipping GitHub sync. Add it in the Replit Secrets tab to enable automatic pushes."
  exit 0
fi

REPO="github.com/zentaker/REACT-NATIVE-ParkChatApp"
AUTHED_URL="https://${GITHUB_PAT}@${REPO}"

git remote set-url origin "$AUTHED_URL"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "Pushing branch '${CURRENT_BRANCH}' to GitHub..."
git push origin "${CURRENT_BRANCH}" --force 2>&1
echo "GitHub sync complete."

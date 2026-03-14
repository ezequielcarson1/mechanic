#!/bin/bash
# Upload local server/mechanic.db to the Railway deployment.
#
# Prerequisites:
#   1. Railway CLI installed:  npm install -g @railway/cli
#   2. Logged in:              railway login
#   3. Railway service set up with a Volume mounted at /data
#   4. DB_PATH env var set in Railway to /data/mechanic.db
#
# What this script does:
#   1. Commits the current server/mechanic.db to git (bakes it into the Docker image)
#   2. Sets FORCE_DB_SEED=1 on the Railway service (entrypoint will overwrite the volume DB)
#   3. Pushes to git → triggers Railway redeploy with the new image + seed flag
#   4. Waits for the deploy to finish
#   5. Unsets FORCE_DB_SEED so future deploys keep the live DB

set -e

# ── Config ────────────────────────────────────────────────────────────────────
# Override these with env vars if your Railway service/project names differ.
RAILWAY_SERVICE="${RAILWAY_SERVICE:-Backend Server}"
# ──────────────────────────────────────────────────────────────────────────────

echo "🚂 Railway DB upload starting..."

# Verify railway CLI is available
if ! command -v railway &> /dev/null; then
  echo "❌ Railway CLI not found. Install it with: npm install -g @railway/cli"
  exit 1
fi

# Verify there's something to upload
if [ ! -f "server/mechanic.db" ]; then
  echo "❌ server/mechanic.db not found. Run from the repo root."
  exit 1
fi

echo "📦 [1/4] Committing server/mechanic.db to git..."
git add server/mechanic.db
if git diff --cached --quiet; then
  echo "   No DB changes to commit — using current HEAD."
else
  git commit -m "chore: sync mechanic.db for Railway deploy"
fi

echo "🔧 [2/4] Setting FORCE_DB_SEED=1 on Railway service '$RAILWAY_SERVICE'..."
railway variables set FORCE_DB_SEED=1 --service "$RAILWAY_SERVICE"

echo "🚀 [3/4] Pushing to git (triggers Railway redeploy)..."
git push

echo "⏳ [4/4] Waiting for Railway deploy to complete..."
railway up --service "$RAILWAY_SERVICE" --detach 2>/dev/null || true
# Give Railway a moment to start the deploy, then wait
sleep 5
railway status --service "$RAILWAY_SERVICE" 2>/dev/null || echo "   (Check Railway dashboard for deploy status)"

echo "🧹 Unsetting FORCE_DB_SEED so future deploys keep the live DB..."
railway variables delete FORCE_DB_SEED --service "$RAILWAY_SERVICE" 2>/dev/null || \
  railway variables set FORCE_DB_SEED=0 --service "$RAILWAY_SERVICE"

echo ""
echo "✅ Done! Railway will use your local mechanic.db on next boot."
echo "   Future deploys will preserve the live DB (no FORCE_DB_SEED set)."

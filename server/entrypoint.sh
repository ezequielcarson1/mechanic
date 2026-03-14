#!/bin/sh
# Entrypoint for Railway (and any volume-backed deployment).
#
# DB_PATH       – set this in Railway to the volume path, e.g. /data/mechanic.db
# FORCE_DB_SEED – set to "1" to overwrite the volume DB with the image's seed DB
#
# Behaviour:
#   1. If DB_PATH is not set → start normally (uses /app/mechanic.db in-image, dev mode)
#   2. If DB_PATH is set and the file already exists and FORCE_DB_SEED != "1" → keep it (persistence)
#   3. If DB_PATH is set and the file is missing OR FORCE_DB_SEED=1 → copy seed DB from image

SEED_DB="/app/mechanic.db"

if [ -n "$DB_PATH" ]; then
  DB_DIR=$(dirname "$DB_PATH")
  mkdir -p "$DB_DIR"

  if [ "$FORCE_DB_SEED" = "1" ]; then
    echo "🗄️  FORCE_DB_SEED=1 — overwriting $DB_PATH with seed DB from image..."
    cp "$SEED_DB" "$DB_PATH"
    echo "✅ Seed DB copied to $DB_PATH"
  elif [ ! -f "$DB_PATH" ]; then
    echo "🗄️  No DB found at $DB_PATH — seeding from image..."
    cp "$SEED_DB" "$DB_PATH"
    echo "✅ Seed DB copied to $DB_PATH"
  else
    echo "✅ Using existing DB at $DB_PATH"
  fi
else
  echo "ℹ️  DB_PATH not set — using in-image DB at $SEED_DB"
fi

exec node index.js

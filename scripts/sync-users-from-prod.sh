#!/bin/bash
set -e

PROD_DB="/tmp/mechanic-prod.db"
LOCAL_DB="$(dirname "$0")/../server/mechanic.db"

RAILWAY_API_HOST="mechanic-production-e8ce.up.railway.app"
DB_BACKUP_TOKEN="66c6d0a7e6c5281de0a587c995fedd7b1fa5460241198a1dfe576ab50d2da365"

echo "📥 Fetching production DB from Railway..."

HTTP_STATUS=$(curl -s -w "%{http_code}" -o "$PROD_DB" \
  "https://${RAILWAY_API_HOST}/api/admin/db-backup?token=${DB_BACKUP_TOKEN}")

if [ "$HTTP_STATUS" != "200" ] || [ ! -s "$PROD_DB" ]; then
  echo "❌  Could not download production DB (HTTP $HTTP_STATUS) — skipping user sync."
  rm -f "$PROD_DB"
  exit 0
fi

echo "✅ Production DB downloaded ($(wc -c < "$PROD_DB" | tr -d ' ') bytes)."

echo "🔄 Merging users, addresses, vehicles and mechanic profiles into local DB..."

sqlite3 "$LOCAL_DB" << EOF
ATTACH DATABASE '$PROD_DB' AS prod;

-- Users (skip local seed accounts: admin-1 and mech-1)
-- Explicit columns to handle schema differences between prod and local
INSERT OR REPLACE INTO users (id, email, name, surname, phone, dob, profileImage, role, isOnline)
  SELECT id, email, name, surname, phone, dob, profileImage, role, isOnline
  FROM prod.users
  WHERE id NOT IN ('admin-1', 'mech-1');

-- Addresses
INSERT OR REPLACE INTO user_addresses
  SELECT * FROM prod.user_addresses
  WHERE userId NOT IN ('admin-1', 'mech-1');

-- Vehicles
INSERT OR REPLACE INTO user_vehicles
  SELECT * FROM prod.user_vehicles
  WHERE userId NOT IN ('admin-1', 'mech-1');

-- Mechanic professional info (skip bot mechanic mech-1)
INSERT OR REPLACE INTO mechanic_details
  SELECT * FROM prod.mechanic_details
  WHERE userId NOT IN ('admin-1', 'mech-1');

-- Mechanic availability (skip bot mechanic mech-1)
INSERT OR REPLACE INTO mechanic_availability
  SELECT * FROM prod.mechanic_availability
  WHERE userId NOT IN ('admin-1', 'mech-1');

DETACH DATABASE prod;
EOF

rm "$PROD_DB"
echo "✅ Production users synced into local DB."

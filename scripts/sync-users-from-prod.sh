#!/bin/bash
set -e

REMOTE_USER="usuarioifx1"
REMOTE_HOST="minikube"
REMOTE_DB_PATH="/tmp/hostpath-provisioner/mechanic/db-pvc/mechanic.db"
PROD_DB="/tmp/mechanic-prod.db"
LOCAL_DB="$(dirname "$0")/../server/mechanic.db"

echo "📥 Fetching production DB from Minikube (via SSH → $REMOTE_HOST)..."

# Copy directly from the minikube container's PVC hostpath — no kubectl needed
ssh $REMOTE_USER@$REMOTE_HOST \
  "docker exec minikube cat $REMOTE_DB_PATH" > "$PROD_DB" 2>/dev/null

if [ ! -s "$PROD_DB" ]; then
  echo "❌  Could not read production DB — skipping user sync."
  rm -f "$PROD_DB"
  exit 0
fi

echo "✅ Production DB downloaded ($(wc -c < $PROD_DB | tr -d ' ') bytes)."

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

---
description: Compress and backup the Mechanic project (excluding node_modules and other heavy/generated folders)
---

# Mechanic Project Backup Workflow

This workflow creates a timestamped `.tar.gz` archive of all important source files in the Mechanic project, excluding large auto-generated directories that can be restored via `npm install` or build commands.

## Excluded Folders
- `node_modules/` (root and nested, e.g. `server/node_modules`)
- `.git/` (version control history — large and recoverable)
- `.expo/` (Expo cache — auto-regenerated)
- `admin-portal/node_modules/` (if present)
- `admin-portal/.next/` (Next.js build output)
- `admin-portal/out/` (Next.js static export)
- `admin-portal/dist/` (build output)
- `assets/` (images, fonts, and other static media)
- `.DS_Store` files

## Steps

1. Open a terminal and navigate to the **project** directory:
```bash
cd /Users/ezequielcarson/Downloads/Mechanic
```

// turbo
2. Run the backup command (creates a timestamped archive on your Desktop):
```bash
tar \
  --exclude='./node_modules' \
  --exclude='./server/node_modules' \
  --exclude='./admin-portal/node_modules' \
  --exclude='./admin-portal/.next' \
  --exclude='./admin-portal/out' \
  --exclude='./admin-portal/dist' \
  --exclude='./.git' \
  --exclude='./.expo' \
  --exclude='./.DS_Store' \
  --exclude='./assets' \
  -czf "$HOME/Downloads/Mechanic_backup_$(date +%Y-%m-%d_%H-%M-%S).tar.gz" \
  .
```

3. Verify the archive was created successfully:
```bash
ls -lh ~/Desktop/Mechanic_backup_*.tar.gz | tail -1
```

4. *(Optional)* To inspect the contents of the archive without extracting:
```bash
tar -tzf $(ls -t ~/Desktop/Mechanic_backup_*.tar.gz | head -1) | head -50
```

## Restoring from Backup

To restore the project from a backup archive:

```bash
# Navigate to where you want to restore
cd /Users/ezequielcarson/Downloads

# Extract the archive (replace filename with your actual backup file)
tar -xzf ~/Desktop/Mechanic_backup_YYYY-MM-DD_HH-MM-SS.tar.gz

# Reinstall dependencies after restoring
cd Mechanic && npm install
cd server && npm install
cd ../admin-portal && npm install
```

## Tips
- Run this backup **before** making large or risky changes to the codebase.
- Backups are saved to your Desktop with a timestamp so you can keep multiple versions.
- You can move old backups to an external drive or cloud storage (iCloud, Google Drive, etc.) for extra safety.

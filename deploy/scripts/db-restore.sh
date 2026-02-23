#!/usr/bin/env bash
set -euo pipefail

# ─── Dualis Finance — Database Restore Script ───
# Usage: ./deploy/scripts/db-restore.sh <backup-file.dump>
# Requires: DATABASE_URL env variable, pg_restore

BACKUP_FILE="${1:-}"

# ── Validate ──
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.dump>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

if ! command -v pg_restore &> /dev/null; then
  echo "ERROR: pg_restore is not installed"
  exit 1
fi

# ── Safety check ──
echo "WARNING: This will DESTROY all existing data in the database."
echo "Backup file: $BACKUP_FILE"
echo ""

# Extra safety for production
if [ "${NODE_ENV:-}" = "production" ]; then
  echo "*** PRODUCTION ENVIRONMENT DETECTED ***"
  echo "Type 'RESTORE-PRODUCTION' to confirm:"
  read -r CONFIRM
  if [ "$CONFIRM" != "RESTORE-PRODUCTION" ]; then
    echo "Aborted."
    exit 1
  fi
else
  echo "Type 'RESTORE' to confirm:"
  read -r CONFIRM
  if [ "$CONFIRM" != "RESTORE" ]; then
    echo "Aborted."
    exit 1
  fi
fi

# ── Restore ──
echo "[$(date -Iseconds)] Starting restore from: $BACKUP_FILE"
pg_restore --clean --if-exists -d "$DATABASE_URL" "$BACKUP_FILE"

echo "[$(date -Iseconds)] Restore complete."

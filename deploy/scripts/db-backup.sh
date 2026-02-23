#!/usr/bin/env bash
set -euo pipefail

# ─── Dualis Finance — Database Backup Script ───
# Usage: ./deploy/scripts/db-backup.sh
# Requires: DATABASE_URL env variable, pg_dump

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_COUNT=7
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
FILENAME="dualis-backup-${TIMESTAMP}.dump"

# ── Validate ──
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

if ! command -v pg_dump &> /dev/null; then
  echo "ERROR: pg_dump is not installed"
  exit 1
fi

# ── Create backup directory ──
mkdir -p "$BACKUP_DIR"

# ── Run backup ──
echo "[$(date -Iseconds)] Starting backup..."
pg_dump "$DATABASE_URL" -Fc -f "${BACKUP_DIR}/${FILENAME}"

FILESIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date -Iseconds)] Backup complete: ${FILENAME} (${FILESIZE})"

# ── Retention: keep only last N backups ──
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/dualis-backup-*.dump 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$RETENTION_COUNT" ]; then
  DELETE_COUNT=$((BACKUP_COUNT - RETENTION_COUNT))
  echo "[$(date -Iseconds)] Cleaning up ${DELETE_COUNT} old backup(s)..."
  ls -1t "${BACKUP_DIR}"/dualis-backup-*.dump | tail -n "$DELETE_COUNT" | xargs rm -f
fi

echo "[$(date -Iseconds)] Done. ${BACKUP_COUNT} backup(s) in ${BACKUP_DIR}"

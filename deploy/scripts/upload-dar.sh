#!/usr/bin/env bash
set -euo pipefail

# ── Dualis Finance — DAR Upload to Canton Devnet ──────────────────────────────
# Builds the DAML project and uploads the .dar to the participant node.
#
# Usage:
#   ./deploy/scripts/upload-dar.sh                    # build + upload
#   ./deploy/scripts/upload-dar.sh --skip-build       # upload only (existing .dar)
#   ./deploy/scripts/upload-dar.sh --verify-only      # just check packages
#
# Prerequisites:
#   - DAML SDK 3.4.11 installed (~/.daml/bin/daml)
#   - sshpass installed (brew install sshpass)
#   - SSH access to the devnet server
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DAML_DIR="$PROJECT_ROOT/packages/canton/daml"
DAR_FILE="$DAML_DIR/.daml/dist/dualis-finance-2.0.0.dar"

# Server config
SERVER="84.32.223.16"
SSH_USER="root"
PARTICIPANT_IP="172.18.0.5"
JSON_API_PORT="7575"
REMOTE_DAR="/tmp/dualis-finance-2.0.0.dar"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[+]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[-]${NC} $1"; exit 1; }

SKIP_BUILD=0
VERIFY_ONLY=0

for arg in "$@"; do
  case $arg in
    --skip-build)  SKIP_BUILD=1 ;;
    --verify-only) VERIFY_ONLY=1 ;;
  esac
done

# ── Verify only mode ──────────────────────────────────────────────────────────
if [ "$VERIFY_ONLY" -eq 1 ]; then
  info "Checking packages on participant..."
  ssh "$SSH_USER@$SERVER" "curl -sf http://$PARTICIPANT_IP:$JSON_API_PORT/v2/packages" | \
    python3 -c "
import json, sys
data = json.load(sys.stdin)
ids = data.get('packageIds', [])
print(f'Total packages: {len(ids)}')
"
  info "Checking users/parties..."
  ssh "$SSH_USER@$SERVER" "curl -sf http://$PARTICIPANT_IP:$JSON_API_PORT/v2/users" | \
    python3 -c "
import json, sys
data = json.load(sys.stdin)
for u in data.get('users', []):
    print(f'  user={u[\"id\"]}  party={u.get(\"primaryParty\", \"N/A\")}')
"
  exit 0
fi

# ── Step 1: Build DAR ────────────────────────────────────────────────────────
if [ "$SKIP_BUILD" -eq 0 ]; then
  info "Building DAML project (SDK 3.4.11, target LF 2.1)..."
  cd "$DAML_DIR"
  rm -rf .daml/dist
  ~/.daml/bin/daml build --no-legacy-assistant-warning 2>&1 | tail -3
  [ -f "$DAR_FILE" ] || error "DAR not found at $DAR_FILE"
  info "DAR built: $(ls -lh "$DAR_FILE" | awk '{print $5}')"
else
  [ -f "$DAR_FILE" ] || error "DAR not found at $DAR_FILE (use without --skip-build)"
  info "Skipping build, using existing DAR"
fi

# ── Step 2: Copy DAR to server ───────────────────────────────────────────────
info "Copying DAR to $SERVER..."
scp "$DAR_FILE" "$SSH_USER@$SERVER:$REMOTE_DAR"
info "DAR copied to $SERVER:$REMOTE_DAR"

# ── Step 3: Upload DAR to participant ────────────────────────────────────────
info "Uploading DAR to participant (JSON API v2)..."
RESPONSE=$(ssh "$SSH_USER@$SERVER" "curl -sf -o /dev/null -w '%{http_code}' \
  -X POST 'http://$PARTICIPANT_IP:$JSON_API_PORT/v2/packages' \
  -H 'Content-Type: application/octet-stream' \
  --data-binary @$REMOTE_DAR")

if [ "$RESPONSE" = "200" ]; then
  info "DAR uploaded successfully (HTTP $RESPONSE)"
else
  error "DAR upload failed (HTTP $RESPONSE)"
fi

# ── Step 4: Verify ───────────────────────────────────────────────────────────
info "Verifying packages..."
PACKAGE_COUNT=$(ssh "$SSH_USER@$SERVER" "curl -sf http://$PARTICIPANT_IP:$JSON_API_PORT/v2/packages" | \
  python3 -c "import json,sys; print(len(json.load(sys.stdin).get('packageIds',[])))")
info "Total packages on participant: $PACKAGE_COUNT"

# Cleanup
ssh "$SSH_USER@$SERVER" "rm -f $REMOTE_DAR"
info "Done. DAR deployed to devnet participant."

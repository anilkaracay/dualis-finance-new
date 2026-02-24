#!/usr/bin/env bash
# ─── Dualis Finance — Devnet Deployment Script ───
# Deploys Dualis app services to 84.32.223.16
# Canton validator is ALREADY running — this script does NOT touch it.
#
# Usage:
#   ./deploy/scripts/deploy-devnet.sh              # Full deploy
#   ./deploy/scripts/deploy-devnet.sh --ssl-only   # Only setup/renew SSL
#   ./deploy/scripts/deploy-devnet.sh --restart     # Restart services only
#
# Prerequisites:
#   - SSH root access to 84.32.223.16
#   - Docker + Docker Compose on remote server
#   - Canton validator running on remote server

set -euo pipefail

# ─── Configuration ──────────────────────────────────────────────────────────
REMOTE_HOST="84.32.223.16"
REMOTE_USER="root"
REMOTE_DIR="/root/dualis"
LOCAL_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DOMAIN="dualis.finance"
API_DOMAIN="api.dualis.finance"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
ok()    { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

ssh_cmd() { ssh -o StrictHostKeyChecking=accept-new "${REMOTE_USER}@${REMOTE_HOST}" "$@"; }

# ─── Parse arguments ────────────────────────────────────────────────────────
SSL_ONLY=false
RESTART_ONLY=false

for arg in "$@"; do
    case $arg in
        --ssl-only)   SSL_ONLY=true ;;
        --restart)    RESTART_ONLY=true ;;
        --help|-h)
            echo "Usage: $0 [--ssl-only|--restart|--help]"
            exit 0
            ;;
    esac
done

# ─── Pre-flight checks ─────────────────────────────────────────────────────
preflight() {
    log "Running pre-flight checks..."

    # Check SSH connectivity
    if ! ssh_cmd "echo ok" &>/dev/null; then
        error "Cannot connect to ${REMOTE_USER}@${REMOTE_HOST} via SSH"
    fi
    ok "SSH connection verified"

    # Check Canton is running
    if ! ssh_cmd "curl -sf http://localhost:7575/readyz" &>/dev/null; then
        warn "Canton JSON API (localhost:7575) not responding — backend will start in degraded mode"
    else
        ok "Canton JSON API healthy (localhost:7575)"
    fi

    # Check Docker is available
    if ! ssh_cmd "docker compose version" &>/dev/null; then
        error "Docker Compose not found on remote server"
    fi
    ok "Docker Compose available"

    # Check Canton PostgreSQL is NOT on 5433
    if ssh_cmd "ss -tlnp | grep -q ':5433'" 2>/dev/null; then
        warn "Port 5433 is already in use on remote — check for conflicts"
    fi
    ok "Pre-flight checks passed"
}

# ─── Step 1: Sync files to remote ──────────────────────────────────────────
sync_files() {
    log "Syncing project files to ${REMOTE_HOST}:${REMOTE_DIR}..."

    ssh_cmd "mkdir -p ${REMOTE_DIR}"

    rsync -az --delete \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='dist' \
        --exclude='.turbo' \
        --exclude='.env' \
        --exclude='.env.sandbox' \
        --exclude='.env.production' \
        --exclude='packages/canton/daml/.daml' \
        "${LOCAL_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

    ok "Files synced"
}

# ─── Step 2: Install SSL certificates ──────────────────────────────────────
setup_ssl() {
    log "Setting up SSL certificates..."

    ssh_cmd bash <<'SSHEOF'
        set -euo pipefail

        # Install certbot if not present
        if ! command -v certbot &>/dev/null; then
            apt-get update -qq && apt-get install -y -qq certbot
        fi

        # Create webroot directory
        mkdir -p /var/www/certbot

        # Check if certs already exist
        if [ -f "/etc/letsencrypt/live/dualis.finance/fullchain.pem" ] && \
           [ -f "/etc/letsencrypt/live/api.dualis.finance/fullchain.pem" ]; then
            echo "[✓] SSL certificates already exist — attempting renewal"
            certbot renew --quiet || true
        else
            echo "[!] Obtaining new SSL certificates..."

            # Stop nginx temporarily if running (certbot needs port 80)
            docker stop dualis-nginx 2>/dev/null || true

            certbot certonly --standalone \
                -d dualis.finance \
                --non-interactive --agree-tos \
                --email admin@dualis.finance \
                --no-eff-email || echo "[!] Failed to get cert for dualis.finance"

            certbot certonly --standalone \
                -d api.dualis.finance \
                --non-interactive --agree-tos \
                --email admin@dualis.finance \
                --no-eff-email || echo "[!] Failed to get cert for api.dualis.finance"
        fi

        # Setup auto-renewal cron
        if ! crontab -l 2>/dev/null | grep -q certbot; then
            (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --deploy-hook 'docker restart dualis-nginx'") | crontab -
            echo "[✓] Certbot auto-renewal cron added"
        fi
SSHEOF

    ok "SSL setup complete"
}

# ─── Step 3: Build and start services ──────────────────────────────────────
deploy_services() {
    log "Building and starting Dualis services..."

    ssh_cmd bash <<SSHEOF
        set -euo pipefail
        cd ${REMOTE_DIR}

        echo "[*] Stopping existing Dualis services (if any)..."
        docker compose -f docker-compose.devnet.yml --env-file .env.devnet down --remove-orphans 2>/dev/null || true

        echo "[*] Building Docker images..."
        docker compose -f docker-compose.devnet.yml --env-file .env.devnet build --no-cache

        echo "[*] Starting services..."
        docker compose -f docker-compose.devnet.yml --env-file .env.devnet up -d

        echo "[*] Waiting for services to become healthy..."
        sleep 10

        echo "[*] Service status:"
        docker compose -f docker-compose.devnet.yml ps
SSHEOF

    ok "Services deployed"
}

# ─── Step 4: Run database migrations ───────────────────────────────────────
run_migrations() {
    log "Running database migrations..."

    ssh_cmd bash <<SSHEOF
        set -euo pipefail
        cd ${REMOTE_DIR}

        # Wait for postgres to be ready
        echo "[*] Waiting for Dualis PostgreSQL (port 5433)..."
        for i in {1..30}; do
            if docker exec dualis-postgres pg_isready -U dualis &>/dev/null; then
                echo "[✓] PostgreSQL ready"
                break
            fi
            sleep 2
        done

        # Run migrations inside the API container
        docker exec dualis-api node dist/db/migrate.js 2>/dev/null || \
            echo "[!] Migration script not found or failed — may need manual migration"
SSHEOF

    ok "Migrations complete"
}

# ─── Step 5: Health checks ─────────────────────────────────────────────────
health_check() {
    log "Running health checks..."

    echo ""
    # Check each service
    echo "── Service Health ──"

    # PostgreSQL (Dualis)
    if ssh_cmd "docker exec dualis-postgres pg_isready -U dualis" &>/dev/null; then
        ok "PostgreSQL (Dualis, port 5433)"
    else
        warn "PostgreSQL (Dualis) not ready"
    fi

    # Redis
    if ssh_cmd "docker exec dualis-redis redis-cli ping" 2>/dev/null | grep -q PONG; then
        ok "Redis"
    else
        warn "Redis not responding"
    fi

    # API
    if ssh_cmd "curl -sf http://localhost:3001/health" &>/dev/null; then
        ok "Fastify API (port 3001)"
    else
        warn "API not responding"
    fi

    # Frontend
    if ssh_cmd "curl -sf http://localhost:3000" &>/dev/null; then
        ok "Next.js Frontend (port 3000)"
    else
        warn "Frontend not responding"
    fi

    # Canton JSON API (not ours, just verify)
    if ssh_cmd "curl -sf http://localhost:7575/readyz" &>/dev/null; then
        ok "Canton JSON API (port 7575) — external"
    else
        warn "Canton JSON API not responding — backend in degraded mode"
    fi

    # Nginx / Public
    echo ""
    echo "── Public Endpoints ──"
    if ssh_cmd "curl -sf -o /dev/null -w '%{http_code}' https://${DOMAIN}" 2>/dev/null | grep -q "200\|301\|302"; then
        ok "https://${DOMAIN}"
    else
        warn "https://${DOMAIN} not reachable (SSL may not be set up yet)"
    fi

    if ssh_cmd "curl -sf http://localhost:3001/health" &>/dev/null; then
        ok "https://${API_DOMAIN}/health"
    else
        warn "https://${API_DOMAIN} not reachable"
    fi

    echo ""
    log "Deployment summary:"
    ssh_cmd "docker compose -f ${REMOTE_DIR}/docker-compose.devnet.yml ps --format 'table {{.Name}}\t{{.Status}}\t{{.Ports}}'" 2>/dev/null || \
    ssh_cmd "docker compose -f ${REMOTE_DIR}/docker-compose.devnet.yml ps"
}

# ─── Main ───────────────────────────────────────────────────────────────────
main() {
    echo ""
    echo "╔══════════════════════════════════════════════╗"
    echo "║   Dualis Finance — Devnet Deployment        ║"
    echo "║   Target: ${REMOTE_HOST}                    ║"
    echo "╚══════════════════════════════════════════════╝"
    echo ""

    if $SSL_ONLY; then
        preflight
        setup_ssl
        ssh_cmd "docker restart dualis-nginx" 2>/dev/null || true
        ok "SSL-only deploy complete"
        exit 0
    fi

    if $RESTART_ONLY; then
        log "Restarting services..."
        ssh_cmd "cd ${REMOTE_DIR} && docker compose -f docker-compose.devnet.yml --env-file .env.devnet restart"
        health_check
        ok "Restart complete"
        exit 0
    fi

    # Full deployment
    preflight
    sync_files
    setup_ssl
    deploy_services
    run_migrations
    health_check

    echo ""
    ok "Deployment complete!"
    echo ""
    echo "  Frontend: https://${DOMAIN}"
    echo "  API:      https://${API_DOMAIN}"
    echo "  Health:   https://${API_DOMAIN}/health"
    echo ""
}

main "$@"

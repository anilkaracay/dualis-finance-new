#!/usr/bin/env bash
set -euo pipefail

# ─── Dualis Finance — Post-Deploy Health Check ───
# Usage: ./deploy/scripts/health-check.sh [URL]

BASE_URL="${1:-https://api.dualis.finance}"
MAX_RETRIES=10
RETRY_DELAY=10
PASSED=true

echo "Health check target: $BASE_URL"
echo ""

# ── /health (liveness) ──
echo -n "  /health        — "
for i in $(seq 1 "$MAX_RETRIES"); do
  START=$(date +%s%N)
  HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "${BASE_URL}/health" 2>/dev/null || echo "000")
  END=$(date +%s%N)
  LATENCY=$(( (END - START) / 1000000 ))

  if [ "$HTTP_CODE" = "200" ]; then
    echo "${LATENCY}ms"
    break
  fi

  if [ "$i" = "$MAX_RETRIES" ]; then
    echo "FAILED (HTTP $HTTP_CODE after $MAX_RETRIES attempts)"
    PASSED=false
  else
    sleep "$RETRY_DELAY"
  fi
done

# ── /health/ready (readiness) ──
echo -n "  /health/ready  — "
START=$(date +%s%N)
RESPONSE=$(curl -sf "${BASE_URL}/health/ready" 2>/dev/null || echo '{}')
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "${BASE_URL}/health/ready" 2>/dev/null || echo "000")
END=$(date +%s%N)
LATENCY=$(( (END - START) / 1000000 ))

if [ "$HTTP_CODE" = "200" ]; then
  # Try to extract dependency latencies
  PG_LATENCY=$(echo "$RESPONSE" | grep -o '"postgres":{[^}]*"latency":[0-9]*' | grep -o '[0-9]*$' || echo "?")
  REDIS_LATENCY=$(echo "$RESPONSE" | grep -o '"redis":{[^}]*"latency":[0-9]*' | grep -o '[0-9]*$' || echo "?")
  echo "${LATENCY}ms (postgres: ${PG_LATENCY}ms, redis: ${REDIS_LATENCY}ms)"
elif [ "$HTTP_CODE" = "503" ]; then
  echo "FAILED — 503 Service Unavailable"
  PASSED=false
else
  echo "FAILED (HTTP $HTTP_CODE)"
  PASSED=false
fi

echo ""

if [ "$PASSED" = true ]; then
  echo "All health checks passed."
  exit 0
else
  echo "Some health checks FAILED."
  exit 1
fi

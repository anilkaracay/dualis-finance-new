#!/usr/bin/env bash
# ============================================================================
# DUALIS FINANCE — Internal Security Test Script
# ============================================================================
# Scans the codebase for common security issues.
# Run from the repository root: ./scripts/security-test.sh
#
# Exit codes:
#   0 — All checks passed
#   1 — One or more checks failed
# ============================================================================

set -euo pipefail

# ─── Colors ─────────────────────────────────────────────────────────────────

RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

# ─── Counters ───────────────────────────────────────────────────────────────

PASS=0
WARN=0
FAIL=0

# ─── Helpers ────────────────────────────────────────────────────────────────

pass() {
  PASS=$((PASS + 1))
  echo -e "  ${GREEN}PASS${RESET}  $1"
}

warn() {
  WARN=$((WARN + 1))
  echo -e "  ${YELLOW}WARN${RESET}  $1"
}

fail() {
  FAIL=$((FAIL + 1))
  echo -e "  ${RED}FAIL${RESET}  $1"
}

header() {
  echo ""
  echo -e "${BOLD}${BLUE}[$1]${RESET} $2"
  echo "────────────────────────────────────────────────────────────"
}

# ─── Resolve repo root ─────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

echo ""
echo -e "${BOLD}Dualis Finance — Security Test Suite${RESET}"
echo "Repository: $REPO_ROOT"
echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 1: npm audit
# ═══════════════════════════════════════════════════════════════════════════

header "1/7" "Dependency vulnerability audit (pnpm audit)"

if command -v pnpm &> /dev/null; then
  AUDIT_OUTPUT=$(pnpm audit --audit-level high 2>&1 || true)
  if echo "$AUDIT_OUTPUT" | grep -qi "found 0 vulnerabilities\|no known vulnerabilities"; then
    pass "No high/critical vulnerabilities found in dependencies."
  elif echo "$AUDIT_OUTPUT" | grep -qi "critical\|high"; then
    fail "High or critical vulnerabilities found in dependencies."
    echo "$AUDIT_OUTPUT" | grep -iE "critical|high" | head -10
  else
    pass "No high/critical vulnerabilities detected."
  fi
else
  warn "pnpm not found. Skipping dependency audit."
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 2: Hardcoded secrets
# ═══════════════════════════════════════════════════════════════════════════

header "2/7" "Hardcoded secrets scan"

# Search for potential hardcoded secrets in TypeScript files
# Exclude: test files, type definitions, node_modules, dist, .daml
SECRET_PATTERNS='(password|secret|apikey|api_key|private_key|access_token|auth_token)\s*[:=]\s*["\x27][^"\x27]{8,}'

SECRET_HITS=$(grep -rniE "$SECRET_PATTERNS" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=.daml \
  --exclude-dir=__tests__ \
  --exclude="*.test.ts" \
  --exclude="*.test.tsx" \
  --exclude="*.spec.ts" \
  --exclude="*.d.ts" \
  packages/ 2>/dev/null || true)

if [ -z "$SECRET_HITS" ]; then
  pass "No hardcoded secrets found in source files."
else
  # Filter out false positives (type annotations, schema definitions, env references)
  REAL_HITS=$(echo "$SECRET_HITS" | grep -viE '(process\.env|z\.string|z\.object|type |interface |schema|config\.|\.env|example|placeholder|dummy|test|mock)' || true)
  if [ -z "$REAL_HITS" ]; then
    pass "No hardcoded secrets found (filtered false positives)."
  else
    fail "Potential hardcoded secrets detected:"
    echo "$REAL_HITS" | head -10
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 3: Debug endpoints
# ═══════════════════════════════════════════════════════════════════════════

header "3/7" "Debug endpoint scan"

DEBUG_HITS=$(grep -rniE '(\/debug|\/dev\/|\/test\/|\/internal\/|console\.log\(.*password|console\.log\(.*secret|console\.log\(.*token)' \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=__tests__ \
  --exclude="*.test.ts" \
  --exclude="*.test.tsx" \
  --exclude="*.spec.ts" \
  packages/api/src/routes/ 2>/dev/null || true)

if [ -z "$DEBUG_HITS" ]; then
  pass "No debug endpoints or sensitive console.log statements found in routes."
else
  fail "Potential debug endpoints or sensitive logging detected:"
  echo "$DEBUG_HITS" | head -10
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 4: SELECT * usage
# ═══════════════════════════════════════════════════════════════════════════

header "4/7" "SELECT * usage scan"

SELECT_STAR_HITS=$(grep -rniE 'SELECT\s+\*\s+FROM' \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=__tests__ \
  --exclude="*.test.ts" \
  --exclude="*.test.tsx" \
  --exclude="*.spec.ts" \
  --exclude="*.d.ts" \
  packages/ 2>/dev/null || true)

if [ -z "$SELECT_STAR_HITS" ]; then
  pass "No SELECT * queries found."
else
  warn "SELECT * usage detected (may expose unnecessary columns):"
  echo "$SELECT_STAR_HITS" | head -10
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 5: Raw SQL / SQL injection risk
# ═══════════════════════════════════════════════════════════════════════════

header "5/7" "Raw SQL / SQL injection risk scan"

# Look for raw SQL string concatenation (not parameterized)
RAW_SQL_HITS=$(grep -rniE '(sql`|\.raw\(|\.execute\(.*\+|\.query\(.*\+|`SELECT.*\$\{|`INSERT.*\$\{|`UPDATE.*\$\{|`DELETE.*\$\{)' \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=__tests__ \
  --exclude="*.test.ts" \
  --exclude="*.test.tsx" \
  --exclude="*.spec.ts" \
  --exclude="*.d.ts" \
  packages/ 2>/dev/null || true)

if [ -z "$RAW_SQL_HITS" ]; then
  pass "No raw SQL concatenation detected. Drizzle ORM parameterization in use."
else
  # sql` is Drizzle's tagged template (safe), so filter those
  UNSAFE_HITS=$(echo "$RAW_SQL_HITS" | grep -viE '(sql`|drizzle|\.raw\(\s*sql)' || true)
  if [ -z "$UNSAFE_HITS" ]; then
    pass "SQL usage is via Drizzle tagged templates (parameterized)."
  else
    fail "Potential raw SQL injection risk detected:"
    echo "$UNSAFE_HITS" | head -10
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 6: dangerouslySetInnerHTML
# ═══════════════════════════════════════════════════════════════════════════

header "6/7" "dangerouslySetInnerHTML scan (XSS risk)"

DANGEROUS_HTML_HITS=$(grep -rniE 'dangerouslySetInnerHTML' \
  --include="*.ts" --include="*.tsx" --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  packages/frontend/ 2>/dev/null || true)

if [ -z "$DANGEROUS_HTML_HITS" ]; then
  pass "No dangerouslySetInnerHTML usage found in frontend."
else
  fail "dangerouslySetInnerHTML detected (XSS risk):"
  echo "$DANGEROUS_HTML_HITS" | head -10
fi

# ═══════════════════════════════════════════════════════════════════════════
# CHECK 7: CORS wildcard
# ═══════════════════════════════════════════════════════════════════════════

header "7/7" "CORS wildcard origin scan"

CORS_WILDCARD_HITS=$(grep -rniE "(origin:\s*['\"]?\*['\"]?|cors\(\s*\{[^}]*origin\s*:\s*true)" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=__tests__ \
  --exclude="*.test.ts" \
  packages/ 2>/dev/null || true)

if [ -z "$CORS_WILDCARD_HITS" ]; then
  pass "No CORS wildcard origin ('*') configuration found."
else
  warn "CORS wildcard or permissive origin detected:"
  echo "$CORS_WILDCARD_HITS" | head -10
fi

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${BOLD}Security Test Summary${RESET}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "  ${GREEN}PASS${RESET}: $PASS"
echo -e "  ${YELLOW}WARN${RESET}: $WARN"
echo -e "  ${RED}FAIL${RESET}: $FAIL"
echo ""

TOTAL=$((PASS + WARN + FAIL))
if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}${BOLD}RESULT: FAILED${RESET} — $FAIL check(s) require immediate attention."
  echo ""
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "${YELLOW}${BOLD}RESULT: PASSED WITH WARNINGS${RESET} — $WARN item(s) should be reviewed."
  echo ""
  exit 0
else
  echo -e "${GREEN}${BOLD}RESULT: ALL CHECKS PASSED${RESET}"
  echo ""
  exit 0
fi

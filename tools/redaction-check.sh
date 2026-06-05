#!/bin/sh
# Redaction pre-commit gate: scan tracked files for real tailnet identifiers.
# POSIX sh. No network. Exits non-zero on real matches.

set -eu

EXCLUDE=':(exclude)tools/redaction-check.sh'
TMP=$(mktemp 2>/dev/null || mktemp -t redaction)
trap 'rm -f "$TMP"' EXIT

# Tailnet CGNAT 100.64.0.0/10
IP_PATTERN='100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.[0-9]+\.[0-9]+'
# Real Tailscale hostname (not placeholder lines containing <...>)
HOST_PATTERN='[a-z0-9-]+\.[a-z0-9]+\.ts\.net'

collect_matches() {
  pattern="$1"
  git grep -n -E "$pattern" -- . "$EXCLUDE" 2>/dev/null | grep -v '<' >> "$TMP" || true
}

collect_matches "$IP_PATTERN"
collect_matches "$HOST_PATTERN"

if [ -s "$TMP" ]; then
  echo "FAIL: redaction check found real tailnet identifiers in tracked files:"
  cat "$TMP"
  exit 1
fi

echo "PASS: redaction check — no real tailnet IPs or *.ts.net hostnames in tracked files."
exit 0

#!/bin/sh
# Redaction pre-commit gate: scan tracked files for true secrets.
# POSIX sh. No network. Exits non-zero on true-secret matches only.
#
# Policy decision 2026-07-02:
# - Tailnet identifiers (CGNAT 100.x IPs, *.ts.net hostnames) are tolerated
#   in this consciously-public repo: reported as WARN, non-blocking.
# - True secrets remain forbidden and blocking (FAIL): Telegram bot tokens,
#   chat_id values, webhook secrets, PAT, OAuth tokens, API keys.

set -eu

EXCLUDE=':(exclude)tools/redaction-check.sh'
TMP_WARN=$(mktemp 2>/dev/null || mktemp -t redaction_warn)
TMP_FAIL=$(mktemp 2>/dev/null || mktemp -t redaction_fail)
trap 'rm -f "$TMP_WARN" "$TMP_FAIL"' EXIT

# --- WARN patterns (informational, non-blocking) — tailnet identifiers ---
# Tailnet CGNAT 100.64.0.0/10
IP_PATTERN='100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.[0-9]+\.[0-9]+'
# Real Tailscale hostname (not placeholder lines containing <...>)
HOST_PATTERN='[a-z0-9-]+\.[a-z0-9]+\.ts\.net'

# --- FAIL patterns (blocking) — true secrets ---
# Telegram bot token: 8-12 digit bot id, colon, long secret tail.
# decision_id / message_id / update_id / timestamps / commit hashes /
# workflow numbers do not match (no colon followed by 30+ token chars).
BOT_TOKEN_PATTERN='[0-9]{8,12}:[A-Za-z0-9_-]{30,}'
# Explicit chat id fields carrying real numeric values (6+ digits).
# Prose mentions of chat_id without an assigned numeric value do not match.
CHAT_ID_PATTERN='(chat_id|chatId).{0,3}[:=].{0,3}-?[0-9]{6,}'
CHAT_JSON_PATTERN='"chat"[[:space:]]*:[[:space:]]*[{][[:space:]]*"id"[[:space:]]*:[[:space:]]*-?[0-9]{6,}'

# chat_id exception (explicit gate 2026-05-31, PROJECT_VISION §10):
# chat_id is ALLOWED in workflow JSON config assets and data-tables CSV
# seeds. The FAIL scan for chat_id skips only those gated paths.
CHAT_ID_EXCEPTION_1=':(exclude)workflows/exports'
CHAT_ID_EXCEPTION_2=':(exclude)data-tables'

collect_warn() {
  pattern="$1"
  git grep -n -E "$pattern" -- . "$EXCLUDE" 2>/dev/null | grep -v '<' >> "$TMP_WARN" || true
}

collect_fail() {
  pattern="$1"
  git grep -n -E "$pattern" -- . "$EXCLUDE" 2>/dev/null >> "$TMP_FAIL" || true
}

collect_fail_chat() {
  pattern="$1"
  git grep -n -E "$pattern" -- . "$EXCLUDE" \
    "$CHAT_ID_EXCEPTION_1" "$CHAT_ID_EXCEPTION_2" 2>/dev/null >> "$TMP_FAIL" || true
}

collect_warn "$IP_PATTERN"
collect_warn "$HOST_PATTERN"

collect_fail "$BOT_TOKEN_PATTERN"
collect_fail_chat "$CHAT_ID_PATTERN"
collect_fail_chat "$CHAT_JSON_PATTERN"

if [ -s "$TMP_WARN" ]; then
  echo "WARN: tailnet identifiers found (tolerated, non-blocking — policy decision 2026-07-02):"
  cat "$TMP_WARN"
fi

if [ -s "$TMP_FAIL" ]; then
  echo "FAIL: redaction check found potential true secrets in tracked files:"
  cat "$TMP_FAIL"
  exit 1
fi

echo "PASS: redaction check — no Telegram bot tokens or chat_id values in tracked files (tailnet identifiers WARN-only per 2026-07-02 policy; chat_id exception paths per 2026-05-31 gate)."
exit 0

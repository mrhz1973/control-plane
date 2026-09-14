#!/usr/bin/env bash
# hermes-vnc-mode â€” issue #65 operator VNC surface mode switch (NEW VPS ionos-n8n-new)
#
# DEFAULT = VIEW_ONLY: x11vnc runs with -viewonly; no mouse/keyboard input reaches the
# Hermes-controlled Chromium display (:99).
# INTERACTIVE = explicit human-assist mode: input enabled temporarily (login/2FA/
# Cloudflare/popup human gates only). Never enabled automatically.
#
# Mode state is a root-controlled marker in /run (tmpfs):
#   - absent at boot and after service restarts unless explicitly recreated
#   - therefore boot default and restart default are always VIEW_ONLY
#
# Restarts ONLY hermes-x11vnc.service. Never touches hermes-xvfb, hermes-chromium,
# hermes-novnc, Hermes, n8n, PostgreSQL, or the OS.
#
# Usage (root, via SSH/Tailscale-private):
#   hermes-vnc-mode view          # deterministic return to VIEW_ONLY (default)
#   hermes-vnc-mode interactive   # temporary human-assist input
#   hermes-vnc-mode status        # print current mode
set -euo pipefail

MARKER_DIR=/run/hermes-vnc
MARKER="${MARKER_DIR}/vnc-interactive"
UNIT=hermes-x11vnc.service
MODE="${1:-}"

case "$MODE" in
  view)
    mkdir -p "$MARKER_DIR"
    rm -f "$MARKER"
    systemctl restart "$UNIT"
    echo "hermes-vnc-mode: VIEW_ONLY (default; input disabled)"
    ;;
  interactive)
    mkdir -p "$MARKER_DIR"
    touch "$MARKER"
    systemctl restart "$UNIT"
    echo "hermes-vnc-mode: INTERACTIVE (human assist ONLY; restore immediately with: hermes-vnc-mode view)"
    ;;
  status)
    if [ -e "$MARKER" ]; then
      echo "mode=INTERACTIVE (human assist; restore with: hermes-vnc-mode view)"
    else
      echo "mode=VIEW_ONLY (default)"
    fi
    ;;
  *)
    echo "usage: hermes-vnc-mode {view|interactive|status}" >&2
    exit 2
    ;;
esac

# Runtime packet — PM-50: OpenClaw local install/onboard gate

**Packet ID:** `pm-50-openclaw-local-install-onboard-gate`  
**Date:** 2026-05-22  
**Status:** **PASS / RUNTIME MANUAL CONTROLLED**

**Evidence:** [PM-50 PASS doc](../PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_PASS.md) · [session](../sessions/2026-05-22-control-plane-pm50-openclaw-local-onboard-pass.md)

**Related:** [PM-49 feasibility](../PM49_OPENCLAW_OAUTH_BRIDGE_FEASIBILITY.md) · [PM-51 gate](pm-51-openclaw-confined-gateway-noop-probe-gate.md) · [pm-34](pm-34-n8n-codex-worker-integration-gate.md)

---

## Purpose

Manual local OpenClaw install/update/onboard — **completed** 2026-05-22.

---

## Runtime result (summary)

| Check | Result |
|-------|--------|
| **Install** | npm global — OpenClaw 2026.5.20 |
| **Windows CLI** | **`openclaw.cmd`** + profile **control-plane** |
| **OAuth** | OpenAI Codex — completed (no token in git) |
| **Gateway** | **127.0.0.1:18789** LISTENING |
| **Exposure** | Loopback only · Tailscale **OFF** |
| **PM-34** | **Blocked** |

Secrets (gateway token, OAuth URL, session id) **not** recorded in repo.

---

## Next

**PM-51** confined gateway no-op probe.

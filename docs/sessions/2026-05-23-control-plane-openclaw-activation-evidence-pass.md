# OpenClaw activation evidence — liveness pass

**Date:** 2026-05-23  
**Status:** **PASS / LIVENESS ONLY** — strict_pass artifact **NOT** produced  
**Classification:** `liveness_pass`  
**Source:** in-memory sanitized evidence from activation step 2 (no raw stdout, no tokens, no auth)

---

## Sanitized fields

| Field | Value |
|-------|--------|
| **openclaw_version** | OpenClaw 2026.5.20 (e510042) |
| **profile** | `control-plane` |
| **gateway_binding** | `127.0.0.1:18789` |
| **health** | 200, `ok=true`, `status=live` |
| **tailscale_exposure** | `false` |
| **sessions_count** | `0` |
| **channels_configured** | none |
| **n8n_local_listener_5678** | `true` |
| **n8n_tunnel_processes** | none |
| **git_head** | `bf2c252` — docs: record PM-48 strict marker fail |
| **repo_clean** | `true` |

---

## Boundary

| Rule | State |
|------|--------|
| **n8n_ready** | `false` |
| **pm34_unblocked** | `false` |
| **workflow 40** | **ACTIVE** — untouched |
| **workflow 41** | **BACKUP OFF** — untouched |
| **real worker** | not enabled |
| **docs/artifacts/openclaw/** | not created |
| **raw output** | not captured, not committed |

---

## Next

Activation step **4/5**: workflow `40` plan-file preview only.

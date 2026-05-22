# Runtime packet — PM-51: OpenClaw confined gateway no-op probe gate

**Packet ID:** `pm-51-openclaw-confined-gateway-noop-probe-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM-50 PASS](../PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_PASS.md) · [PM-51 doc](../PM51_OPENCLAW_CONFINED_GATEWAY_NOOP_PROBE_GATE.md) · [pm-34](pm-34-n8n-codex-worker-integration-gate.md)

---

## Purpose

Future **safe no-op** probe through OpenClaw gateway/browser-control on loopback only.

---

## Preconditions

| # | Requirement |
|---|-------------|
| 1 | **PM-50** PASS — gateway operational |
| 2 | Gateway running in **separate** PowerShell (`openclaw.cmd --profile control-plane gateway`) |
| 3 | **Loopback only** — no external exposure |
| 4 | **No** daemon · **no** worker · **no** n8n |

---

## Allowed (future)

- `status` / help / local no-op commands only
- Model or status listing **if** output contains no secrets

---

## Forbidden

| Item | Rule |
|------|------|
| **n8n** | No UI/API/runtime |
| **Workflow 40 / 41** | No edits |
| **Repo shell / GitHub PAT** | No |
| **Telegram** | No |
| **OpenRouter / Gemini** | No |
| **LAN / Tailscale / Funnel** | No |
| **Secrets in output** | No token · OAuth URL · session id |
| **Daemon / service install** | No |

---

## Future PASS criteria

| # | Criterion |
|---|-----------|
| 1 | Gateway reachable on **127.0.0.1** locally |
| 2 | No-op or status succeeds |
| 3 | No secrets exposed or committed |
| 4 | No filesystem/repo mutation |
| 5 | No n8n/worker touch |

---

## Future FAIL criteria

Asks for API key · external provider fallback · GitHub/Telegram token · shell/repo actions · external exposure · secret leak.

**PM-34:** remains **blocked** regardless of PASS.

---

## Not executed

This packet does **not** run OpenClaw in the prep task.

# PM-20 — n8n bridge packet prepared

**Date:** 2026-05-22  
**Repo:** mrhz1973/control-plane  
**Status:** **PREPARED / NOT EXECUTED**

## Deliverables

| Item | Path |
|------|------|
| Overview | [PM20_N8N_BRIDGE_PACKET.md](../PM20_N8N_BRIDGE_PACKET.md) |
| Runtime packet | [pm-20-n8n-classifier-bridge-gate-packet.md](../runtime-packets/pm-20-n8n-classifier-bridge-gate-packet.md) |
| Flow sample | [pm20-n8n-bridge-flow.sample.json](../examples/pm20-n8n-bridge-flow.sample.json) |
| Telegram templates | [pm20-telegram-gate-message.sample.md](../examples/pm20-telegram-gate-message.sample.md) |

## Baselines

| PM | State |
|----|--------|
| **PM-15** | **PASS** — new `40` smoke (`c0ea042`, `#6708`) |
| **PM-17** | **PASS** — classifier dry-run (mock) |
| **PM-19** | **PASS** — bridge dry-run (`dry_run_pass`) |
| **PM-18** | **PENDING** — Codex CLI not in PATH |
| **PM-16** export | **PENDING** — non-blocking |

## Posture

| Item | State |
|------|--------|
| **n8n** | **Not touched** |
| **Workflow `40`** | **Not touched** — Published |
| **GIS / DEV / ALINA** | **Not touched** |
| **Provider API / Codex runtime** | **Not used** |
| **C1** | **PARTIAL** — unchanged |
| **Runtime PASS** | **Not claimed** — packet only |

## Next (pick one per session)

1. **PM-21** — n8n bridge runtime candidate (inactive import + Manual Trigger), **or**
2. **Codex CLI** local install/config (unblock PM-18)

**Not both** in the same session.

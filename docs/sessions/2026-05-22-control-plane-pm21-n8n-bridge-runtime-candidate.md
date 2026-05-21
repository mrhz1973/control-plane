# PM-21 — n8n bridge runtime candidate prepared

**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

## Deliverables

| Item | Path |
|------|------|
| **Build script** | `tools/build-ready-import-42-bridge-candidate.mjs` |
| **Import bundle** | `workflows/exports/READY_IMPORT_42-classifier-bridge-candidate.json` |
| **Doc** | [PM21_N8N_BRIDGE_RUNTIME_CANDIDATE.md](../PM21_N8N_BRIDGE_RUNTIME_CANDIDATE.md) |
| **Packet** | [pm-21-n8n-bridge-runtime-candidate-import-gate.md](../runtime-packets/pm-21-n8n-bridge-runtime-candidate-import-gate.md) |

## Build

| Field | Value |
|-------|--------|
| **Base** | `READY_IMPORT_40-control-plane-active-with-credentials.json` (**not modified**) |
| **PM21 nodes added** | 4 (classifier → bridge → format → Telegram) |
| **active** | `false` |
| **Credentials** | Real ids copied from `40` import |

## Posture

| Item | State |
|------|--------|
| **n8n** | **Not touched** |
| **Production `40`** | **Not touched** |
| **Runtime** | **Not executed** |
| **PM-20** | PREPARED baseline |
| **PM-18** | **PENDING** |
| **PM-16 export** | **PENDING** — non-blocking |
| **GIS / DEV / ALINA** | **Not touched** |

## Next

Import **`42` inactive** in n8n → one Manual Trigger / plan smoke → verify PM-21 Telegram summary.

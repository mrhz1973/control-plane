# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — ingress socket observer prep → **PASS** (metadata-only, zero-provider) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `TRANCHE02_EVENT02_STOP_HTTP_WALL_TIMEOUT / EVENT02_WALL_OFFLINE_DIAG_E / INGRESS_SOCKET_OBSERVER_READY` |
| **GATE CORRENTE** | **CLOSED** — provider calls unauthorized until the next authorized live event |
| **NEXT** | One bounded D-0025-W **tranche02 live event with observer active before trigger** + bounded post-wall grace period. Bounds: **GLM Δ≤1 · LiteLLM Δ≤1 · retry=0 · fallback=0 · Codex=0 · Qwen=0 · Cursor auto-dispatch=0**. Observer: `tools/observe-litellm-primary-network.mjs` (tcpdump text metadata-only, dynamic IPs, bounded). Do not execute in the prep pass. Node 6112 json-shape finding remains out of scope. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof 6104/6106/6107 · 6106 `2>&1 \|\| true` · 6109/6110 canonical · versionId `dcf124b9-0cb3-428b-8a09-a6afda8d2083` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **10** `/v1/responses` calls |
| **NEW BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **0/10 used** · LiteLLM **0/10 used** · retry/event **0** · fallback/event **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Observer contract (for the next live event)

- Start observer **before** trigger: `node tools/observe-litellm-primary-network.mjs --duration-ms <window+grace> --out-file /tmp/obs.ndjson` on the VPS host (root).
- Correlate NDJSON events (`N8N_TO_LITELLM` / `LITELLM_TO_EXTERNAL` / `CONNECTION_CLOSE`) with the live window; a post-wall `LITELLM_TO_EXTERNAL` persistence or its absence resolves Event02's open E-classification into A vs B/C/D.
- Metadata-only: ports/flags/classes/timestamps; never payload/headers/external IPs.

## Boundaries

- Tranche 02 remains unconsumed; the observer itself performs zero provider calls.
- No restarts of n8n/LiteLLM were performed during prep; none are planned for the live event.
- 6106 exit normalization remains proven live; do not regress it.
- Node 6112 secondary json-shape finding remains out of scope unless separately authorized.
- Keep helper / CASE B / schema / normalizer / LiteLLM config / network unchanged for the live event; observer is additive host tooling only.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Observer prep evidence: `reports/architecture/d0025_litellm_ingress_socket_observer_prep.md`
- Event02 wall offline diagnosis: `reports/architecture/d0025_tranche02_event02_http_wall_timeout_offline_diagnosis.md`
- Event 02 live evidence: `reports/architecture/d0025_glm_tranche02_live_event02.md`
- Budget authorization: `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`
- Issue **#31** — OPEN

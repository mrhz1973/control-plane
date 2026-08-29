# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — tranche02 event 03 → **PASS: valid Execution Packet obtained** (`EP-D-0025-W-GLM-LIVE-001` · `READY_FOR_GATE`) |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `EVENT03_PASS_VALID_EXECUTION_PACKET` — first live end-to-end PASS (HTTP 200 in ~97 s, cycle `PASS`, packet census/deterministic completion/schema PASS, policy **GATE**) |
| **GATE CORRENTE** | **CLOSED** — restored after event; no provider calls authorized |
| **NEXT** | Advance the packet's canonical execution path under its own constraints (policy GATE: no auto Cursor dispatch; human-gate respected). Bounded follow-ups recorded: (1) child-row hang accounting — `287888` stuck-`running` with purged data (3rd recurrence, canonical parent result NOT blocked this time); (2) observer IPv6 coverage gap — upstream `api.z.ai` is IPv6-only so `LITELLM_TO_EXTERNAL` needs an ip6 filter for future dispatch verification. Issue **#31** remains OPEN until acceptance is truly complete. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof 6104/6106/6107 · 6106 `2>&1 \|\| true` · 6109/6110 canonical · versionId `dcf124b9-0cb3-428b-8a09-a6afda8d2083` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **11** `/v1/responses` calls |
| **BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **1/10 used** · LiteLLM **1/10 used** · retry **0** · fallback **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Event 03 evidence anchors

- Observer (metadata-only, tcpdump text): N8N→LITELLM SYN/PSH `23:07:03.891Z` · LiteLLM `POST /v1/responses 200` `23:08:40.916Z` (~97 s, inside 115 s wall) · clean FIN pair; no wall timeout event.
- Cycle result: `n8n-litellm-primary-cycle-result-v1` · ok=true · `PASS` · http 200 · response_gate PASS.
- Packet: `docs/packets/EP-D-0025-W-GLM-LIVE-001.json` (sha256 head `9f517517c669f61a`) · 6 steps · planner requested=glm · used=glm · fallback_used=false · cursor_dispatch_allowed=false.
- GLM counted conservatively as consumed (gateway 200 under zai alias; IPv6 dispatch invisible to IPv4 observer — coverage gap, not evidence of absence).

## Boundaries

- Do NOT auto-dispatch Cursor from the packet — policy decision is GATE.
- Tranche 02 remaining: 9 GLM / 9 LiteLLM; further live events require fresh arm-first authorization.
- Child-row hang (`287888`) and 6112 json-shape remain recorded-only items unless separately authorized.
- Keep helper / CASE B / schema / normalizer / LiteLLM config / network unchanged.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Event 03 report: `reports/architecture/d0025_glm_tranche02_live_event03_with_network_observer.md`
- Rolling live-001 ledger: `reports/architecture/d0025_primary_remote_glm_live_001.md` (Attempt 19)
- Observer prep: `reports/architecture/d0025_litellm_ingress_socket_observer_prep.md`
- Observer tool (repo canonical): `tools/observe-litellm-primary-network.mjs`
- Budget authorization: `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`
- Issue **#31** — OPEN

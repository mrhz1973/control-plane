# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — WF61 HTTP-node hang root-caused; GPT-Web hang-proof transport artifacts authored |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `PROVIDER_CONFIG_WIRED / FULLRESPONSE_UNWRAP_LIVE_PROVEN / SOURCE_COMPLETION_CASE_B_OFFLINE_PASS / WF61_HANG_HTTP_NODE_NOT_RETURNED / HANGPROOF_HTTP_BRIDGE_ARTIFACTS_AUTHORED / GLM_BUDGET_EXHAUSTED` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for offline hang-proof bridge apply only** — provider calls 0; runtime gate remains CLOSED; GLM budget remains exhausted |
| **NEXT** | Apply `D0025_W_WF61_HANGPROOF_HTTP_BRIDGE` offline: add bounded Node one-shot HTTP bridge and verbatim WF61 transport patch (6104/6106/6107 only); validate with local mock HTTP, keep WF61 inactive and runtime gate CLOSED. After PASS, a separate human budget gate is required before any GLM live retry. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · 13 nodes |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE** | preserved · **10** `/v1/responses` calls to date |
| **EXPANDED PLANNER BUDGET** | GLM **10/10** · Codex **1/10 used** |

## Boundaries

- Do not authorize or execute any additional GLM call under the current 10-call budget.
- Offline bridge apply may not arm runtime gate or trigger WF40/WF61 planning.
- GPT-Web workflow artifact is authoritative: only nodes 6104/6106/6107 may change; topology remains 13 nodes and 6109/6110 semantics remain intact.
- New helper uses Node built-ins only, exact existing request body, `Connection: close`, independent wall timeout 115s, response-body idle timeout 15s after headers, max body 8 MiB, and one terminal JSON line.
- Keep CASE B / schema / normalizer / LiteLLM config unchanged.
- Do not activate WF60 / mutate OpenClaw / V4 Qwen work.

## Puntatori

- Code artifact: `docs/runtime/PATCH_D0025_W_WF61_HANGPROOF_HTTP_BRIDGE.gpt-web.json`
- WF61 artifact: `workflows/patches/d0025-w-wf61-hangproof-http-bridge.gpt-web.json`
- Hang diagnosis: `reports/architecture/d0025_wf61_post_http200_hang_offline_diagnosis.md`
- Final live report: `reports/architecture/d0025_glm_final_live_resume_after_case_b.md`
- CASE B report: `reports/architecture/d0025_packet_source_completion_case_b.md`
- Issue **#31** — OPEN

# D-0025-W — GLM live resume after fullResponse unwrap

**Block ID:** `D0025_W_GLM_LIVE_RESUME_AFTER_FULLRESPONSE_UNWRAP`  
**Starting HEAD:** `f30cc6b91bed64f419feeb812b29b23da8d784aa`  
**Canonical task:** `D-0025-W-GLM-LIVE-001`  
**Status:** **STOP** — single authorized provider event completed; gate CLOSED

## Precheck (provider_calls=0)

| Check | Result |
|---|---|
| origin/main exact | PASS |
| WF40 active / WF61 inactive | PASS |
| node 6107 unwrap present | PASS |
| template/live 6107 equivalent | PASS |
| gate CLOSED | PASS |
| LiteLLM readiness DNS/TCP/`/health/readiness`/`root_default` | PASS |
| LiteLLM Δ during precheck | **0** (count **6**) |

## Trigger hygiene

| Event | Result |
|---|---|
| Trigger 12 `7d3c551` | Consumed by WF40 `285486` under `REMOTE_PLANNER_GATE_CLOSED` (window not yet armed) · provider Δ **0** |
| Re-arm then Trigger 13 `bc94de8` | First seen with gate armed + WF61 active |

## Live attempt (maxima: 1/1/1)

| Field | Value |
|---|---|
| WF40 / WF61 | `285530` / `285531` |
| LiteLLM Δ | **1** → total **7** |
| GLM Δ | **1** → budget **7/10** |
| HTTP | **200** |
| classification | `PACKET_SCHEMA_INVALID` |
| reason | Missing required field: `final_report_contract` |
| unwrap evidence | `body_shape` top-level keys are Responses fields (`object`,`status`,`output`,`usage`,`error`,…) not n8n wrapper |
| sse_census | present · `data_event_count=0` (JSON framing) |
| has_packet | false (schema reject) |
| cursor_dispatch_allowed | false |
| retry / fallback / qwen / codex | 0 |
| gate final / WF61 final | CLOSED / inactive |
| normalizer mutated | false |
| raw model content persisted | false |
| secrets exposed | false |

## NEXT

Offline remediate GLM Execution Packet emission/validation for required `final_report_contract`. Do not undo unwrap. Do not live-retry in the same pass.

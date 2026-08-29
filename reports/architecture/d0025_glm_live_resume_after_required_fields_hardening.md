# D-0025-W — GLM live resume after required/empty-field hardening

**Block ID:** `D0025_W_GLM_LIVE_RESUME_AFTER_REQUIRED_FIELDS_HARDENING`  
**Starting HEAD:** `86aa18f32c8e066809386dec8db9998a0df806b0`  
**Trigger:** `6cd2d2310b6233ead2470159ef2e10d9b439822e`  
**Canonical task:** `D-0025-W-GLM-LIVE-001`  
**Status:** **STOP** — single authorized provider event; gate CLOSED

## Precheck (provider_calls=0)

| Check | Result |
|---|---|
| origin/main exact | PASS |
| unwrap + both planner hardenings present | PASS |
| WF40 active / WF61 inactive / gate CLOSED | PASS |
| LiteLLM readiness | PASS · Δ **0** (count **8**) |
| Arm-first then trigger 15 | PASS |

## Live attempt

| Field | Value |
|---|---|
| WF40 / WF61 | `286080` / `286081` |
| LiteLLM Δ | **1** → total **9** |
| GLM Δ | **1** → budget **9/10** |
| HTTP | **200** |
| classification | `PACKET_SCHEMA_INVALID` |
| first remaining required field | **`allowed_paths`** |
| reason | Missing required field: `allowed_paths` |
| has_packet | false |
| cursor_dispatch_allowed | false |
| retry / fallback / qwen / codex | 0 |
| gate final / WF61 final | CLOSED / inactive |
| schema / unwrap / hardenings / normalizer mutated | false |
| raw model content persisted | false |
| secrets exposed | false |

## Finding

Required/empty-field instruction hardening did not clear live GLM omission of required `allowed_paths` (same finding as Attempt 14).

## NEXT

Offline CASE A beyond instruction-only remediation for persistent missing `allowed_paths`. No live retry until authorized.

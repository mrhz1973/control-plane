# D-0025-W — GLM live resume after packet hardening

**Block ID:** `D0025_W_GLM_LIVE_RESUME_AFTER_PACKET_HARDENING`  
**Starting HEAD:** `085254af5ee7803f170aa4a256cea56b751a2637`  
**Trigger:** `c3ea49249e6988a777fce4817407524bb9b38f22`  
**Canonical task:** `D-0025-W-GLM-LIVE-001`  
**Status:** **STOP** — single authorized provider event; gate CLOSED

## Precheck (provider_calls=0)

| Check | Result |
|---|---|
| origin/main exact | PASS |
| unwrap + planner hardening present | PASS |
| WF40 active / WF61 inactive / gate CLOSED | PASS |
| LiteLLM readiness | PASS · Δ **0** (count **7**) |
| Arm-first then trigger 14 | PASS |

## Live attempt

| Field | Value |
|---|---|
| WF40 / WF61 | `286045` / `286046` |
| LiteLLM Δ | **1** → total **8** |
| GLM Δ | **1** → budget **8/10** |
| HTTP | **200** |
| classification | `PACKET_SCHEMA_INVALID` |
| first remaining required field | **`allowed_paths`** |
| reason | Missing required field: `allowed_paths` |
| has_packet | false |
| cursor_dispatch_allowed | false |
| retry / fallback / qwen / codex | 0 |
| gate final / WF61 final | CLOSED / inactive |
| schema / unwrap / normalizer mutated | false |
| raw model content persisted | false |
| secrets exposed | false |

## Finding

`final_report_contract` is no longer the reported missing field. Schema now fails on the next required field: `allowed_paths`.

## NEXT

Offline planner/instruction remediation so all `execution-packet-v1` required fields (starting with `allowed_paths`) are emitted. No live retry until authorized.

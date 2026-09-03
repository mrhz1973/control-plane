# V4 — Qwen local 6-profile router Control Plane integration

**BLOCK-ID:** `V4_QWEN_LOCAL_6_PROFILE_ROUTER_CONTROL_PLANE_INTEGRATION`  
**RUN_NONCE:** `QWEN_6_PROFILE_ROUTER_INTEGRATION_20260903_01`  
**Classification:** `QWEN_LOCAL_6_PROFILE_ROUTER_CONTROL_PLANE_INTEGRATION_PASS`  
**Base:** `0b4e7c6997c2fefda974cf9baa4a6eb097f4dfb2`

## Verdict

Control Plane ACTIVE contracts now bind the authoritative six-profile MultiModel
router at `http://127.0.0.1:8080`. Automatic routing uses exact `profile_id`
values. Scope v2 digests fail closed on mismatch. No real Qwen generation,
OpenCode execution, Telegram approval, provider call, or D-0025 arm occurred.

## Six-profile catalog (verified via GET `/v1/models`)

| # | profile_id | role(s) |
|---|---|---|
| 1 | `qwen38-opus-q3-daily-16k` | DAILY / QUALITY (startup default) |
| 2 | `qwen38-opus-q3-agent-24k` | QUALITY_AGENT_24K |
| 3 | `qwen38-dcfr-iq3-fast-16k` | FAST |
| 4 | `qwen38-dcfr-iq3-agent-24k` | FAST_AGENT / MCP / BLENDER_FAST |
| 5 | `qwen38-original-ar-16k` | REFERENCE |
| 6 | `qwen38-uncensored-ar-16k` | MANUAL_UNCENSORED / USER_OVERRIDE |

Catalog count observed: **6/6**.

## Role → profile mapping (`qwen38-rtx3060-2026-09-03`)

- DAILY / QUALITY → `qwen38-opus-q3-daily-16k`
- QUALITY_AGENT_24K → `qwen38-opus-q3-agent-24k`
- FAST → `qwen38-dcfr-iq3-fast-16k`
- FAST_AGENT / MCP / BLENDER_FAST → `qwen38-dcfr-iq3-agent-24k`
- REFERENCE → `qwen38-original-ar-16k`
- MANUAL_UNCENSORED → `qwen38-uncensored-ar-16k`

## Uncensored retention

- `keep_in_selector = true`
- `selection = explicit_user_choice`
- `auto_route_sensitive_topics = false`
- `delete_without_explicit_user_authorization = false`
- Benchmark “RETIRED” means only: do not auto-select for sensitive topics

## Router architecture

```text
Qwen MultiModel 16K.lnk
  -> Start-Qwen-MultiModel-16K.ps1
  -> qwen_runtime_router.py :8080
  -> normal llama.cpp :18080
  OR DCFR sidecars :18200 / :18210
```

Control Plane selects PROFILE. Router selects/manages backend.
No competing Control Plane llama-server command reconstruction.

## Model / runtime identities (attestation only)

| Asset | Identity |
|---|---|
| OPUS GGUF | `…/Qwen3.8-27B-Opus-Distill-v2-Q3_K_M.gguf` · SHA256 `abca69f6…f74e0b` |
| Normal llama.cpp | `C:\Users\mrhz\llama.cpp-dflash2\build-cuda\bin\llama-server.exe` · build **10499** · commit **1deefcca3** |
| DCFR GGUF | `…/Qwen3.8-27B-UD-IQ3_XXS.gguf` · SHA256 `c0b7c303…74f3eee` |
| DCFR runtime | `…\dcfr\…\llama-server.exe` · `0.2.0-dev` build 4 · commit `c060ca974c77-dcfr` · SHA256 `fb26db55…1d631d` |

## DFlash2 semantics

- DFlash2 **profiles** = RETIRED
- `llama.cpp-dflash2` directory = still the normal production runtime (**PRESERVED**)
- Scope v2 forbids `dflash_required`

## Preserved router production fixes (do not regress)

A. stream resume / `/v1/stream` / `/v1/streams/lookup` / WinError 10053/10054 quiet handling  
B. HTTP/1.1 chunked + final zero chunk + keep-alive + `[DONE]` + clean EOF  
C. DCFR same-chat model identity rewrite to requested profile ID  
D. DCFR picker `/props` `ui:false` → `ui:true`

This Control Plane block does not modify the Qwen router implementation; targeted
CP tests cover catalog/scope/bindings only.

## Migrated ACTIVE Control Plane surfaces

- `configs/resources/qwen-local-model-policy.json`
- `configs/resources/qwen-local-runtime.json`
- `docs/foundation/QWEN_LOCAL_ROLE_ROUTING_POLICY.md`
- `docs/contracts/qwen-execution-scope-v2.md` (new)
- `docs/contracts/qwen-local-session-manager-v1.md`
- `docs/contracts/opencode-execution-adapter-v1.md`
- `docs/contracts/opencode-execution-dispatch-v1.md`
- `docs/contracts/qwen-local-adapter-v1.md`
- `docs/contracts/v4-windows-local-execution-endpoint-v1.md` + request schema
- `docs/contracts/v4-wf40-live-execution-sidecar-source-v1.md`
- `tools/qwen-local-runtime-v1.mjs`
- `tools/qwen-execution-scope-v2.mjs` (new)
- `tools/qwen-local-session-manager-v1.mjs`
- `tools/collect-qwen-local-resource-status-v1.mjs` (router_assessment)
- `tools/build-v4-wf40-live-execution-sidecars-v1.mjs`
- `tools/opencode-execution-adapter-v1.mjs`
- `tools/dispatch-opencode-execution-v1.mjs`
- `tools/apply-v4-wf40-live-seam-v1.py`
- `tools/qwen-local-adapter-v1.mjs` / `tools/llama-cpp-json-client-v1.mjs`
- targeted tests under `tests/qwen-local-*`, sidecars, adapters, endpoint

## Scope v2

Canonical serialization (key order is part of digest):

```json
{
  "scope_version": "qwen-execution-scope-v2",
  "execution_harness": "opencode",
  "model": "qwen_local",
  "profile_id": "qwen38-dcfr-iq3-agent-24k",
  "role": "FAST_AGENT",
  "canonical_endpoint": "http://127.0.0.1:8080",
  "single_generation_guard_required": true,
  "max_opencode_executions": 1,
  "max_qwen_generation_calls": 1,
  "retry": 0,
  "fallback": 0
}
```

`scope_digest` =
`5261290cbdda414de0a6bd5ffd79e939f805eefde3fe2e39a8f490c5a2e02261`

Register-pending remains exactly **8** keys; `route_id=opencode+qwen_local`.

## Resource-status semantics

Collector returns `router_assessment` with:

- canonical endpoint `:8080`
- production catalog validity
- selected profile_id / role
- readiness class among `QWEN_READY_IDLE` / `QWEN_NOT_RUNNING_SAFE_TO_START` / `BUSY` / `UNCERTAIN`
- router_worker_ready boolean

Occupancy producer remains the verified manager/worker topology classifier on `:8080`.

## Targeted tests (no generation)

- `tests/qwen-local-6-profile-router/run.mjs` — **25/25**
- `tests/qwen-local-llama-cpp-transport/run.mjs` — **9/9**
- `tests/qwen-local-session-manager/run.mjs` — **14/14**
- `tests/qwen-local-resource-status-overlay/run.mjs` — **14/14**
- `tests/v4-wf40-live-execution-sidecars/run.mjs` — **27/27**
- `tests/opencode-execution-adapter/run.mjs` — **23/23**
- `tests/opencode-execution-dispatch/run.mjs` — **ALL_PASS**
- `tests/n8n-v4-execution-adapter-router-bridge/run.mjs` — **17/17**
- `tests/v4-windows-local-execution-endpoint/run.mjs` — **65/65**

## Side-effect counters

| Counter | Delta |
|---|---|
| provider calls | 0 |
| register-pending calls | 0 |
| Telegram messages | 0 |
| execution endpoint calls | 0 |
| OpenCode executions | 0 |
| Qwen generations | 0 |

## Production safety (read-only)

| Check | Result |
|---|---|
| D-0025 | CLOSED (`enabled=false`, `provider_calls_authorized_per_event=0`) |
| WF61 | inactive |
| WF40 | active · 83 nodes · `activeVersionId=a609ad90-7eb4-4495-9ec5-c4413165cea1` |
| Prod DB | PostgreSQL **16.15** · `DB_TYPE=postgresdb` |
| n8n health | **200** |
| ACTIVE runtime authorization | **0** |
| Database migration | none |
| Model deletion/move/rename | none |

## NEXT

`V4_WF40_FIRST_LIVE_AUTHORIZED_EXECUTION_PROOF_POST_POSTGRES_RETRY`

Required executor:

- `profile_id=qwen38-dcfr-iq3-agent-24k`
- `role=FAST_AGENT`
- `endpoint=http://127.0.0.1:8080`
- `scope_version=qwen-execution-scope-v2`
- dynamic WF40-derived pending/auth/execution IDs

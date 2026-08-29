# D-0025-W — WF61 post-HTTP200 hang offline diagnosis

**Block ID:** `D0025_W_WF61_POST_HTTP200_HANG_OFFLINE_DIAGNOSIS`  
**Starting HEAD:** `c61952509c1e765a524ebdb7a203fbc8328c97c5`  
**Target executions:** WF40 `286309` · WF61 `286310`  
**Status:** **PASS** — root cause identified offline  
**Primary classification:** `WF61_HANG_HTTP_NODE_NOT_RETURNED`

## Precheck (provider_calls=0)

| Check | Result |
|---|---|
| origin/main exact | PASS (`c619525…`) |
| workspace clean | PASS |
| CURRENT_FRONTIER coherent | PASS |
| runtime gate CLOSED | PASS |
| WF61 inactive (`workflow_entity.active=0`) | PASS |
| LiteLLM count unchanged | PASS (**10**) |

## Evidence availability (now)

| Artifact | Availability |
|---|---|
| `execution_entity` id **286310** | **PURGED** (`SELECT` → null; ID gap `286309` → `286311`) |
| `execution_data` for **286310** | **PURGED** |
| Parent `286309` entity | present · `success` · `09:58:02.013` → `09:59:10.583` |
| Contemporaneous live-pass extract (same day) | retained in prior report / extract JSON · `data_len=3308` · `status=running` · no cycle result |

## Timeline (sanitized)

| Time (UTC) | Event |
|---|---|
| `09:58:02.013` | WF40 `286309` started |
| `09:58:03.545` | WF61 `286310` started (contemporaneous) |
| `09:59:10.506` | LiteLLM `POST /v1/responses` → **HTTP 200** (client `172.18.0.2:48460`) |
| `09:59:10.583` | WF40 `286309` stopped **success** (aligned with LiteLLM completion) |
| `~10:05` | Watch timeout still saw WF61 `status=running` / `stoppedAt=null` |
| `10:05+` | Multiple n8n `SIGTERM` / restarts during restore |
| `10:09:04` | Current n8n container `StartedAt` after restore restarts |
| later | Execution `286310` row purged from DB |

LiteLLM container id unchanged throughout (`edbb0398…`); LiteLLM Δ this diagnosis = **0**.

## Last recoverable stage

**HTTP Request node `d0025-6106-4006-8006-000000000006` did not return.**

Contemporaneous mid-hang `execution_data` (~3.3 KiB) showed:

- no `Capture HTTP body + status` completion markers;
- no `response_b64` / `sse_census` / `http_status`;
- no `Execute Command - canonical finalize`;
- no `Return canonical cycle result` / `n8n-litellm-primary-cycle-result-v1`;
- no `packet_census` / `deterministic_completion`.

Therefore nodes **6107 → 6110 never started**. Hang is **not** Capture, IF, Finalize, Return, or CASE B.

## Timeout / config boundary

| Node | Config | Observation |
|---|---|---|
| **6106** HTTP Request | `options.timeout=120000` (120s); `fullResponse=true`; `responseFormat=text`; `neverError=true` | LiteLLM completed at ~T+67s from WF61 start, but WF61 remained `running` past **7 minutes** — configured timeout did **not** produce a terminal execution before restore |
| **6109** Finalize Execute Command | **no** timeout option | not reached |
| n8n env | no `EXECUTION_TIMEOUT` / HTTP-related timeout vars observed | process restarts were restore-driven SIGTERM only |

## CASE B offline exclusivity

| Check | Result |
|---|---|
| CASE B finalize + census on ~3 MiB padded mock JSON | completes in **~1.7s** · PASS · `provider_calls=0` |
| `case-b-source-completion.run.mjs` | **11/11 PASS** |

CASE B helper/census **cannot** explain the live hang (path never reached).

## n8n / LiteLLM log summary (sanitized)

- LiteLLM: clean `POST /v1/responses` **200** at `09:59:10.506Z` for the 10th request.
- n8n window logs: repeated `Received SIGTERM` / task-runner shutdown — correlated with **restore restarts**, not an independent OOM line.
- No recoverable offline evidence of Execute Command child still alive after purge.
- No workflow-engine exception text tied to `286310` remains after purge.

## Primary classification

`WF61_HANG_HTTP_NODE_NOT_RETURNED`

Hang locus: **node 6106** (HTTP Request - LiteLLM primary one-shot) — LiteLLM finished HTTP 200, but the n8n HTTP node never handed control to Capture/Finalize.

Secondary (non-primary) effects after the hang:

- restore restarts left a zombie `running` row then purged `286310`;
- packet census/completion unavailable because finalize never ran.

## Exact next bounded remediation (GPT-Web workflow authorship)

**Do not implement in this pass** (workflow change required).

Required GPT-Web artifact should bound node **6106** so a completed LiteLLM HTTP 200 cannot leave WF61 non-terminal, for example by authoring one of:

1. enforceable hard timeout / abort that **always** emits to Capture (including timeout/error path) within ≤120s wall clock; and/or  
2. HTTP client settings that cannot stall after upstream response completion under `fullResponse` + `responseFormat=text`; and/or  
3. an explicit fail-closed branch if HTTP node exceeds wall budget without `statusCode`.

Also consider adding an explicit timeout on **6109** (defense-in-depth; not the root cause here).

No schema/normalizer/CASE B/LiteLLM provider-config change is indicated by this diagnosis.

## Counters

| Metric | Value |
|---|---|
| provider_calls | **0** |
| LiteLLM Δ | **0** (total remains **10**) |
| GLM Δ | **0** (budget remains **10/10**) |
| gate | **CLOSED** |
| WF61 | **inactive** |
| workflows/** mutated | **false** |
| tools/** mutated | **false** |

## Output line

`PASS — WF61 POST-HTTP200 HANG ROOT CAUSE IDENTIFIED OFFLINE / WF61_HANG_HTTP_NODE_NOT_RETURNED`

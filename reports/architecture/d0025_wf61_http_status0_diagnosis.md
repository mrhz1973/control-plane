# D-0025-W — WF61 HTTP status-0 diagnosis

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_WF61_HTTP_STATUS0_DIAGNOSE_AND_CONDITIONAL_RESUME`  
**Date:** 2026-08-29  
**Standing authorization:** `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`  
**AUTO-VIA release:** `github:issue/31#issuecomment-5458375723`  
**Starting HEAD:** `0ce82f8afd535ef7b96472ac8d30a1cf119dccde`  
**Status:** **DIAGNOSIS CASE 1 (TRANSPORT HEALTHY / NONPERSISTENT EVENT)** → Phase B entered

---

## Deterministic diagnostics (0 provider inference; `/v1/responses` never called diagnostically)

| # | Check | Result |
|---|---|---|
| 1 | n8n container identity | `root-n8n-1` · image `docker.n8n.io/n8nio/n8n` · running |
| 2 | `litellm-primary` DNS from n8n exec context | **OK** → `172.18.0.3` |
| 3 | TCP 4000 from n8n container | **connected** |
| 4 | `/health/readiness` from n8n container | **200** `{"status":"healthy"}` |
| 5 | LiteLLM container | running · same id since 14:01Z · `restarts=0` |
| 6 | Docker network membership (read-only) | n8n `root_default` 172.18.0.2 · litellm `root_default` 172.18.0.3 — **same private network** |
| 7 | WF61 HTTP node vs canonical template | **exactly equal** (`POST http://litellm-primary:4000/v1/responses`, timeout 120000, neverError, fullResponse) |
| 8 | n8n logs transport errors in retry-5 window | none (no ECONNREFUSED/ETIMEDOUT/ENOTFOUND lines) |

## Retry-5 root cause (deterministic, from parent 284881 rundata)

- `Execute Workflow - WF61 primary remote planner` executionTime = **120632 ms** ≈ the HTTP node's canonical `timeout: 120000`.
- LiteLLM access log for retry-5 window: **no** `POST /v1/responses` completion logged; retry-4 POST (21:37:19Z) completed in ~**76 s** of GLM upstream latency.
- Conclusion: the single one-shot POST exceeded the canonical 120 s client timeout before any response — a **nonpersistent upstream-latency event** (client timeout → `http_status=0`), not a DNS/TCP/topology/workflow defect. Rundata for child `284882` was pruned (stuck `running`), so the parent timing + LiteLLM logs are the authoritative evidence.

## Decision

**CASE 1** — no workflow/config mutation required; transport healthy; proceed directly to bounded resume (trigger 6).

## Phase B outcome (see live report)

- Trigger `48c7c7c` · WF40 `284952` · WF61 `284953` · LiteLLM delta **1** (POST 200 at 22:44:47Z) · GLM attempt consumed (budget **2/10**) · terminal classification **`SSE_NO_COMPLETED_RESPONSE`** — "No response.completed terminal event found" · gate CLOSED · WF61 inactive.

## Output line

`DIAGNOSIS PASS — TRANSPORT HEALTHY; retry-5 status-0 = nonpersistent client-timeout upstream-latency event; Phase B terminal: SSE_NO_COMPLETED_RESPONSE`

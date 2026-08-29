# D-0025-W — Tranche02 Event02 HTTP_WALL_TIMEOUT offline diagnosis

**Block ID:** `D0025_W_TRANCHE02_EVENT02_HTTP_WALL_TIMEOUT_OFFLINE_DIAGNOSIS`  
**Starting HEAD / expected origin/main:** `4668b209587cac8ebd3ffac1f5f3a3e476ba41d2`  
**Event under diagnosis:** `D0025_W_GLM_TRANCHE02_LIVE_EVENT_02`  
**Status:** **PASS** — offline, zero provider calls  
**Primary classification:** `EVIDENCE_INSUFFICIENT` (**E**)

---

## Safety (provider_calls Δ = 0)

| Check | Result |
|---|---|
| Runtime gate | **CLOSED** (`enabled=false`, `provider_calls_authorized_per_event=0`) |
| Tranche 02 auth | GLM **0/10** · LiteLLM **0/10** (unchanged) |
| Historical LiteLLM `/v1/responses` count | **10** before and after this diagnosis |
| POST `/v1/responses` / GLM / Codex / Qwen | **not performed** |
| Gate arm / WF40 / WF61 trigger / live retry | **not performed** |
| Workflow / helper / schema / LiteLLM / network mutations | **none** |

---

## Event window correlation

| Artifact | Value |
|---|---|
| WF40 | **287008** · `error` · `2026-08-29 15:48:02.011Z` → `15:49:59.141Z` |
| WF61 | **287009** · `error` · `2026-08-29 15:48:03.527Z` → `15:49:59.134Z` |
| Event window | ~**15:48:03Z → 15:49:59Z** (+ post-window inspected through diagnosis ~16:12Z) |
| Bridge terminal (exec data) | `transport_classification=HTTP_WALL_TIMEOUT` · `elapsed_ms=115003` · `http_status=0` · `body_bytes=0` |
| Socket errno markers in 287009 data | **no** `ECONN*` / `ETIMEDOUT` / `ENOTFOUND` |
| Secondary 6112 | observed (`A 'json' property isn't an object`) — **out of scope** (recorded only) |

---

## Comparison to prior status-0 diagnosis

Prior report: `reports/architecture/d0025_wf61_http_status0_diagnosis.md`

| Check | Prior (retry-5) | This pass (Event02) |
|---|---|---|
| DNS `litellm-primary` from n8n | OK → `172.18.0.3` | OK → `172.18.0.3` |
| TCP 4000 | connected | connected |
| GET `/health/readiness` | 200 | 200 · ~15 ms |
| Same Docker network | `root_default` | `root_default` (n8n `172.18.0.2`, litellm `172.18.0.3`) |
| LiteLLM `/v1/responses` access in window | none | none |
| Prior narrative conclusion | nonpersistent upstream latency vs 120s client wall | **not reused as B** — this task requires deterministic receipt/dispatch evidence |

---

## Current non-provider connectivity (n8n exec context)

Probes run via `docker exec root-n8n-1` with Node.js (same container as Execute Command `child_process.exec`; no separate runner container present).

| Probe | Result |
|---|---|
| DNS | **OK** `172.18.0.3` |
| TCP 4000 | **OK** |
| GET `/health/readiness` | **200** `{"status":"healthy","db":"Not connected"}` · ~15 ms |
| Docker network | shared `root_default` |
| Containers | `root-n8n-1` running · restarts **0**; `litellm-primary` running · restarts **0** · started `2026-08-28T14:01:10Z` |
| Node 6106 live | `executeCommand` · one-shot helper present · exit norm present · URL decodes to `http://litellm-primary:4000/v1/responses` · wall/idle flags present |

**Not classification A as a proven persistent connectivity/runtime-context failure** — current path is healthy and matches the prior healthy transport baseline. Event-time connectivity cannot be proven failed from available logs.

---

## LiteLLM logs (sanitized)

Access-log shape (uvicorn):  
`INFO: 172.18.0.2:<port> - "POST /v1/responses HTTP/1.1" <status> …`  
→ status present ⇒ **written at request completion**, not request-start.

| Observation | Result |
|---|---|
| `/v1/responses` mentions all-time | **10** (unchanged) |
| Last `/v1/responses` completion | `2026-08-29T09:59:10.506Z` · **200** (hours before Event02) |
| Log lines in `15:45Z–16:05Z` | **0** |
| Log lines `2026-08-29T15:4*` / `15:5*` | **0** |
| Keyword hits (disconnect/cancel/499/upstream/timeout/GLM/ERROR) after last responses access | **0** |
| Post-`15:49:59Z` `/v1/responses` completion | **none** |
| Next LiteLLM log after 09:59 | only diagnosis readiness: `2026-08-29T16:12:05Z` `GET /health/readiness` **200** from `172.18.0.2` |
| LiteLLM listening sockets at diagnosis | `:4000` LISTEN only · **no** established client sockets |
| Provider dispatch markers for Event02 | **not seen** |
| Client disconnect markers for Event02 | **not seen** |

Deterministic implication of Δ0 / no access line: **no completion was logged** for Event02. Because access logs are completion-timed, Δ0 alone does **not** prove the request never arrived. Absence of any post-timeout completion hours later also does **not** by itself prove non-arrival (abort-without-access-log remains possible and unobservable here).

---

## Helper wall semantics (read-only code)

Source: `tools/post-litellm-primary-one-shot.mjs` (not modified).

| Fact | Value |
|---|---|
| Default / configured wall | **115000** ms |
| Event02 terminal elapsed | **115003** ms |
| On wall | `settleFail("HTTP_WALL_TIMEOUT")` → `destroyAll()` destroys response + request sockets |
| Agent | `agent: false` |
| Connection | `Connection: close` |
| Idle timer | armed only **after** response headers; Event02 never armed it (`http_status=0`, `body_bytes=0`) |

Therefore: client destroyed the socket at wall without having received headers. LiteLLM/upstream **may** continue work after client close in general HTTP proxy designs; this pass has **no** completion or disconnect log proving that path for Event02.

---

## Classification decision (exactly one)

### Chosen: **E — `EVIDENCE_INSUFFICIENT`**

| Class | Why accepted/rejected |
|---|---|
| **A** `TRANSPORT_CONNECTIVITY_FAILURE` | **Rejected.** Current DNS/TCP/readiness/network/runtime-context probes pass; 6106 runs in the probed n8n namespace; no event-time ECONN/ETIMEDOUT/ENOTFOUND. Cannot deterministically prove the Event02 request failed to reach LiteLLM for connectivity reasons. |
| **B** `LITELLM_RECEIVED_UPSTREAM_EXCEEDED_CLIENT_WALL` | **Rejected.** No deterministic request-receipt or provider-dispatch evidence in the Event02 window. Prior “upstream latency” narrative is insufficient under this task’s evidence rule. |
| **C** `LITELLM_RECEIVED_PRE_PROVIDER_STALL` | **Rejected.** No receipt evidence and no pre-provider stall markers. |
| **D** `CLIENT_ABORT_WITH_POST_TIMEOUT_COMPLETION` | **Rejected.** `post_timeout_completion_seen=false` (historical count remains 10; no post-`15:49:59Z` `/v1/responses` access line). |
| **E** `EVIDENCE_INSUFFICIENT` | **Accepted.** Available evidence cannot safely distinguish “never reached LiteLLM” vs “reached but never completed/logged” vs “aborted without access log” given completion-only access logging and zero Event02 LiteLLM markers. |

---

## Persisted fields

| Field | Value |
|---|---|
| `result_cursor` | `PASS_EVIDENCE_INSUFFICIENT` |
| `classification` | `EVIDENCE_INSUFFICIENT` |
| `event02_wf40` | `287008` |
| `event02_wf61` | `287009` |
| `dns_current` | OK → `172.18.0.3` |
| `tcp_4000_current` | OK |
| `readiness_current` | 200 |
| `docker_network_current` | shared `root_default` |
| `litellm_request_seen` | **false** (no Event02 ingress/completion marker) |
| `provider_dispatch_seen` | **false** |
| `post_timeout_completion_seen` | **false** |
| `client_disconnect_seen` | **false** |
| `helper_wall_ms` | `115000` |
| `provider_calls_delta` | `0` |
| `tranche_02_glm_used` | `0/10` |
| `tranche_02_litellm_used` | `0/10` |
| `gate_closed_final` | `true` |
| `WF61_final` | inactive |
| `NEXT` | smallest additional **zero-provider** diagnostic: add LiteLLM **request-start and/or incomplete-request/disconnect** observability (no `/v1/responses` spend) so the next `HTTP_WALL_TIMEOUT` can be classified A vs B/C/D deterministically |

**Do not execute NEXT in this pass.**

---

## Output line

`PASS — E / PROVIDER_CALLS_DELTA=0 / TRANCHE02=0/10`

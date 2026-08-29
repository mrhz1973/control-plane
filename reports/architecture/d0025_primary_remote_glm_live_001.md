# D-0025-W — primary remote GLM live planning cycle (001)

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_SSE_OUTPUT_ITEM_DONE_NORMALIZATION_FIX_AND_RESUME`  
**Date:** 2026-08-28 / 2026-08-29  
**Release evidence:** issue #31 comment `5458616370` · standing authorization  
**Standing authorization:** `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`  
**Status:** **STOP (attempt 13 / unwrap resume)** — fullResponse unwrap live-proven · HTTP **200** · `PACKET_SCHEMA_INVALID` (`final_report_contract`) · gate CLOSED

---

## Attempt history

| # | Trigger | Outcome | Blocker | Fix applied |
|---|---|---|---|---|
| 1 | `8765362` | STOP | GIS Read/Write hard-fail | WF40 GIS ReadWrite nonblocking |
| 2 | `5ccb8c9` | STOP | GIS Telegram missing binary | WF40 GIS Telegram nonblocking |
| 3 | `7d19504` | STOP | WF61 `$input.first()` in per-item | item-access fix |
| 4 (retry 3) | `fdbbd48` | STOP | array return in per-item | return-shape fix |
| 5 (retry 4) | `617f633` | STOP | `FINALIZE_FAILED` after HTTP 200 | finalize observability fix (Phase A) |
| 6 (retry 5) | `c06b8be` | STOP | `LITELLM_HTTP_FAILURE` http_status=0 · LiteLLM delta 0 | **status-0 diagnosis: nonpersistent upstream-latency client timeout** |
| 7 (retry 6) | `48c7c7c` | STOP | `SSE_NO_COMPLETED_RESPONSE` (HTTP 200) | SSE `output_item.done` reconstruction (Phase A this pass) |
| 8 (retry 7) | `9b40ff2` | **STOP** | `LITELLM_HTTP_FAILURE` HTTP 429 · ZAI 5-hour usage limit (reset 2026-08-29 09:12:41) | **quota wait / no workflow mutation** |
| 9 (post-quota) | `34ba537` | **STOP** | `SSE_NO_COMPLETED_RESPONSE` HTTP 200 · no completed / no output_item.done | **no mutation this block** |
| 10 (capture) | `4894310` | **STOP** | `LITELLM_HTTP_FAILURE` http_status=0 · LiteLLM Δ0 · `sse_census=null` | **capture applied; census not reached** |
| 11 (s0+capture) | `f506227` | **CAPTURE PASS** | HTTP 200 · `SSE_NO_COMPLETED_RESPONSE` · sanitized `sse_census` present (0 data events) | **census persisted; no normalizer change** |
| 12 (body_shape) | `42aba26` | **CAPTURE PASS** | HTTP 200 · `body_shape`=`JSON_OBJECT` keys `data|headers|statusCode|statusMessage` | **n8n fullResponse wrapper identified** |
| 13 (unwrap resume) | `bc94de8` | **STOP** | HTTP 200 · unwrap proved · `PACKET_SCHEMA_INVALID` missing `final_report_contract` | **offline packet-schema remediation (no normalizer change this pass)** |

---

## Phase A — finalize observability apply

| Metric | Value |
|---|---|
| Artifact | `workflows/patches/d0025-w-wf61-finalize-failure-observability-fix.gpt-web.json` |
| Template commit | `de8c3b92e21bccf496198c4caeb81e0dfdf93e24` |
| Live WF61 pre versionId | `c9c97f71-d934-4efd-b423-7aaaec11f86c` |
| Live WF61 post-apply versionId | `d0f88e31-4756-471a-9544-1bcfc40a52b2` |
| Node changed | only `d0025-6109-4009-8009-000000000009` command (`2>&1 \|\| true`) |
| Graph equivalence | **PASS** except node 6109 command |
| Provider/inference during apply | **0** |
| Report | `reports/architecture/d0025_wf61_finalize_failure_observability_fix_apply.md` |

---

## Phase B — Attempt 6 (RETRY_5)

| Metric | Value |
|---|---|
| `final_gate_closed` | **true** |
| New WF61 executions | **1** (`284882`) |
| LiteLLM request delta | **0** (total remains **1**) |
| GLM provider-attempt delta | **0** (budget remains **1/10**) |
| HTTP status (cycle result) | **0** |
| Cycle classification | `LITELLM_HTTP_FAILURE` |
| Sanitized reason | `Single LiteLLM HTTP attempt did not return 2xx; retry is forbidden` |
| retry / fallback / qwen / codex / cursor_dispatch | **0** |
| `credential_mutations` / `network_mutations` / `teamviewer_mutations` | **0** |
| `secret_exposure` | **false** |

### Execution

1. Temp GLM gate armed; WF61 temporarily activated; offline adapter **REMOTE_DISPATCH_READY**.
2. Trigger `c06b8be967c9e7dbbd3bcc4c2727d01f5787c4c0` (`Retry trigger 5: 2026-08-29 — WF61 finalize failure observability fix applied; execute same task D-0025-W-GLM-LIVE-001.`).
3. Natural WF40 `284881` observed SHA `c06b8be…`, adapter live **REMOTE_DISPATCH_READY**, dispatched WF61 `284882`.

### STOP finding (precise)

Parent `Execute Workflow - WF61 primary remote planner` returned:

```json
{
  "schema": "n8n-litellm-primary-cycle-result-v1",
  "ok": false,
  "classification": "LITELLM_HTTP_FAILURE",
  "task_id": "D-0025-W-GLM-LIVE-001",
  "http_status": 0,
  "reason": "Single LiteLLM HTTP attempt did not return 2xx; retry is forbidden",
  "cursor_dispatch_allowed": false
}
```

LiteLLM container logs show **no** new `POST /v1/responses` in the window (total still 1). Failure is **before/at HTTP transport** to `litellm-primary` (status 0), not a finalize/response-gate/schema/policy classification. Observability shell fix was therefore not exercised on a finalize JSON body this pass.

Runtime restored: gate CLOSED · WF61 inactive. No retry / no second provider call.

---

## Attempt 7 (RETRY_6 — after status-0 diagnosis CASE 1)

**Diagnosis (see `reports/architecture/d0025_wf61_http_status0_diagnosis.md`):** transport fully healthy (DNS/TCP/readiness/network/template equivalence all PASS); retry-5 status-0 was a **nonpersistent upstream-latency client timeout** (`Execute Workflow` node time 120632 ms ≈ canonical 120 s timeout; retry-4 GLM latency ~76 s). No mutation required → CASE 1 → resume.

| Metric | Value |
|---|---|
| Trigger | `48c7c7c8b7a932ec53509a8cd77f715cdf5d2800` (`Retry trigger 6: 2026-08-29 — private LiteLLM transport diagnosed healthy; …`) |
| WF40 / WF61 | `284952` / `284953` |
| Adapter (offline + live) | **REMOTE_DISPATCH_READY** · `preferred=glm` |
| LiteLLM request delta | **1** (`POST /v1/responses` 200 at 22:44:47Z; total **2**) |
| GLM provider-attempt delta | **1** (budget **2/10**) |
| HTTP status | **200** |
| Terminal classification | **`SSE_NO_COMPLETED_RESPONSE`** |
| Sanitized reason | **`No response.completed terminal event found`** |
| Gate / WF61 final | **CLOSED** / **inactive** |
| retry / fallback / qwen / codex / cursor_dispatch | **0** |
| `credential_mutations` / `network_mutations` / `teamviewer_mutations` | **0** |
| `secret_exposure` | **false** |

Classification emitted by the canonical finalize runner (observability fix working): the GLM response normalization/gate found **no `response.completed` terminal event** in the SSE stream — i.e. the failure is now precisely localized to **SSE response normalization / terminal-event handling**, not transport, not HTTP, not packet/schema/policy (not reached).

---

## Attempt 8 (RETRY_7 — after SSE output_item.done normalization)

Phase A applied `docs/runtime/PATCH_D0025_W_SSE_OUTPUT_ITEM_DONE_NORMALIZATION.gpt-web.json`. Offline suite **18/18 PASS** (including both targeted SSE cases). Code commit `a8b051f`.

| Metric | Value |
|---|---|
| Trigger | `9b40ff25ca97d09bca393c9294095c272e6330c4` |
| WF40 / WF61 | `285015` / `285016` |
| Adapter | **REMOTE_DISPATCH_READY** |
| LiteLLM request delta | **1** (total **3**; `POST /v1/responses` **429**) |
| GLM provider-attempt delta | **1** (LiteLLM forwarded `planner-glm-pilot`; ZAI returned usage-limit) |
| HTTP status | **429** |
| Terminal classification | **`LITELLM_HTTP_FAILURE`** |
| Sanitized reason | Single LiteLLM HTTP attempt did not return 2xx; retry is forbidden. ZAI 5-hour usage limit; reset **2026-08-29 09:12:41**. |
| SSE normalization / response gate / schema / policy | **NOT_REACHED** |
| Gate / WF61 final | **CLOSED** / **inactive** |
| GLM budget | **3/10** |

The SSE reconstruction was **not exercised live** because the one-shot HTTP node did not return 2xx.

---

## Attempt 9 (post-quota-release bounded resume)

**Block:** `D0025_W_GLM_LIVE_RESUME_POST_QUOTA_RESET`
**operator_quota_release_reported:** true

| Metric | Value |
|---|---|
| Trigger | `34ba537fe9e46906026ac1699debe8424fe70b18` |
| WF40 / WF61 | `285346` / `285347` |
| Adapter | **REMOTE_DISPATCH_READY** · preferred=glm · fallback=[] |
| LiteLLM request delta | **1** (total **4**; `POST /v1/responses` **200**) |
| GLM provider-attempt delta | **1** |
| HTTP status | **200** |
| Terminal classification | **`SSE_NO_COMPLETED_RESPONSE`** |
| Sanitized reason | No `response.completed` terminal event found and no `response.output_item.done` items were available |
| SSE normalization | **FAIL** (updated normalizer path exercised; reconstructed completed response **not** possible) |
| Response gate / schema / policy | **NOT_REACHED** |
| Execution Packet generated | **false** |
| Gate / WF61 final | **CLOSED** / **inactive** |
| retry / fallback / qwen / codex / cursor_dispatch | **0** |
| GLM budget | **4/10** |
| `credential_mutations` / `network_mutations` / `teamviewer_mutations` / `workflow_mutations` | **0** |
| `secret_exposure` | **false** |

Quota gate cleared (HTTP 200). Failure is again localized to **SSE terminal-event content**: the live stream contained neither `response.completed` nor usable `response.output_item.done` items for the already-applied reconstruction path.

---

## Attempt 10 (SSE structural-capture apply + bounded resume)

**Block:** `D0025_W_WF61_SSE_STRUCTURAL_CAPTURE_AND_RESUME`
**Artifact:** `workflows/patches/d0025-w-wf61-sse-structural-capture.gpt-web.json`

### Apply phase (provider_calls=0)

| Metric | Value |
|---|---|
| Template + live WF61 | only nodes **6107** / **6110** jsCode changed as authored |
| Node count / IDs / connections / HTTP / prepare-finalize | **unchanged** |
| Live versionId post-apply | `6286b441-2b6d-45e2-85fc-ebf9f33a0c62` |
| Gate during apply | **CLOSED** |
| LiteLLM total after apply | **4** (delta **0**) |

### Live capture resume

| Metric | Value |
|---|---|
| Trigger | `489431086b2524378b69d554852d20a0af362e17` |
| WF40 / WF61 | `285395` / `285396` |
| Adapter | **REMOTE_DISPATCH_READY** |
| LiteLLM request delta | **0** (total remains **4**) |
| GLM provider-attempt delta | **0** |
| HTTP status | **0** |
| Terminal classification | **`LITELLM_HTTP_FAILURE`** |
| Sanitized reason | Single LiteLLM HTTP attempt did not return 2xx; retry is forbidden |
| `sse_census` | **null** (HTTP Capture path not reached with 2xx body) |
| Gate / WF61 final | **CLOSED** / **inactive** · capture jsCode **still present** |
| retry / fallback / qwen / codex / cursor_dispatch | **0** |
| secret_exposure | **false** |

Capture code is live on inactive WF61, but this one-shot resume failed at transport (status 0) before any SSE body could be censused. No second provider call.

---

## Attempt 11 (status-0 preflight PASS + capture resume)

**Block:** `D0025_W_STATUS0_PREFLIGHT_AND_SSE_CAPTURE_RESUME`

### Transport preflight (provider_calls=0)

| Check | Result |
|---|---|
| litellm-primary running | PASS · restarts=0 |
| DNS from n8n | PASS → `172.18.0.3` |
| TCP :4000 | PASS |
| `/health/readiness` | PASS HTTP 200 `healthy` |
| shared `root_default` | PASS |
| LiteLLM `/v1/responses` delta during preflight | **0** |
| Pre-trigger readiness recheck | PASS HTTP 200 |

### Live capture resume

| Metric | Value |
|---|---|
| Trigger | `f50622768fbfc0eb90c6d52bbc4e3c8d65a9571b` |
| WF40 / WF61 | `285414` / `285415` |
| Adapter | **REMOTE_DISPATCH_READY** |
| LiteLLM request delta | **1** (total **5**; POST **200**) |
| GLM provider-attempt delta | **1** |
| HTTP status | **200** |
| Terminal classification | **`SSE_NO_COMPLETED_RESPONSE`** |
| `sse_census` | **present** (schema `sse-structural-census-v1`) |
| Gate / WF61 final | **CLOSED** / **inactive** · capture jsCode retained |
| retry / fallback / qwen / codex / cursor_dispatch | **0** |
| GLM budget | **5/10** |
| raw_model_content_persisted / secret_exposure | **false** / **false** |

### Sanitized sse_census

```json
{
  "schema": "sse-structural-census-v1",
  "data_event_count": 0,
  "done_marker_count": 0,
  "parse_error_count": 0,
  "event_labels": [],
  "event_types": [],
  "first_event_types": [],
  "last_event_types": [],
  "top_level_key_sets": [],
  "selected_field_shapes": []
}
```

Structural finding: Capture ran on an HTTP 200 body, but found **zero** `data:` SSE lines / event labels / typed events. Canonical finalize still reports no `response.completed` and no `output_item.done`. Offline remediation must start from this empty-SSE-line census (likely non-`data:` body shape after n8n HTTP capture), without inventing terminal semantics here.

---

## Attempt 12 (body-shape capture apply + resume)

**Block:** `D0025_W_WF61_BODY_SHAPE_CAPTURE_AND_RESUME`
**Artifact:** `workflows/patches/d0025-w-wf61-body-shape-capture.gpt-web.json`

### Apply + transport preflight (provider_calls=0)

| Check | Result |
|---|---|
| only 6107/6110 jsCode changed | PASS |
| 13 nodes / connections / HTTP / prepare-finalize | unchanged |
| gate CLOSED / WF61 inactive during apply | PASS |
| DNS/TCP/readiness/`root_default` | PASS |
| LiteLLM Δ during apply+preflight | **0** |

### Live resume

| Metric | Value |
|---|---|
| Trigger | `42aba26e1c04c4f4aad8db50462ec1eb2f64b99f` |
| WF40 / WF61 | `285449` / `285450` |
| LiteLLM Δ | **1** (total **6**; POST **200**) |
| GLM Δ | **1** |
| classification | `SSE_NO_COMPLETED_RESPONSE` |
| `sse_census` | present · `data_event_count=0` |
| `body_shape` | present |
| Gate / WF61 final | **CLOSED** / **inactive** |
| retry/fallback/qwen/codex/cursor | **0** |
| GLM budget | **6/10** |
| raw/model content persisted | **false** |

### Sanitized body_shape

```json
{
  "schema": "http-body-structural-census-v1",
  "framing": "JSON_OBJECT",
  "top_level_keys": ["data", "headers", "statusCode", "statusMessage"],
  "selected_field_shapes": [],
  "first_array_item_keys": [],
  "nested_key_sets": []
}
```

Structural finding: Capture is stringifying the **n8n HTTP fullResponse wrapper** (`data`/`headers`/`statusCode`/`statusMessage`), not the LiteLLM payload inside `data`. That explains empty `sse_census` and normalizer `SSE_NO_COMPLETED_RESPONSE` on a JSON wrapper object. Normalizer untouched in this pass.

---

## Attempt 13 (live resume after fullResponse unwrap)

**Block:** `D0025_W_GLM_LIVE_RESUME_AFTER_FULLRESPONSE_UNWRAP`
**Trigger:** `bc94de8f119a4eaa4b8d021d49b78f30c8f28426` (retry trigger 13; trigger 12 `7d3c551` was Data-Table-consumed under `REMOTE_PLANNER_GATE_CLOSED` with provider Δ0)

### Precheck / arm

| Check | Result |
|---|---|
| origin/main start | `f30cc6b…` |
| unwrap on live 6107 + template/live equiv | PASS |
| transport readiness (no `/v1/responses`) | PASS |
| arm-first then push trigger 13 | PASS |
| LiteLLM before | **6** |

### Live result

| Metric | Value |
|---|---|
| WF40 / WF61 | `285530` / `285531` |
| LiteLLM Δ | **1** (total **7**; POST **200**) |
| GLM Δ | **1** (budget **7/10**) |
| HTTP status | **200** |
| Terminal classification | **`PACKET_SCHEMA_INVALID`** |
| Reason (sanitized) | `Missing required field: final_report_contract` |
| `body_shape.framing` | `JSON_OBJECT` (inner Responses keys — unwrap proved) |
| `body_shape.top_level_keys` | includes `object|status|output|usage|error|…` (not n8n wrapper) |
| `sse_census.data_event_count` | 0 (JSON object path) |
| Gate / WF61 final | **CLOSED** / **inactive** |
| retry/fallback/qwen/codex/cursor | **0** |
| normalizer mutated | **false** |
| raw_model_content_persisted / secrets | **false** / **false** |

### Structural finding

n8n fullResponse `data` unwrap is live-proven: Capture/finalize now see the LiteLLM Responses JSON body. Canonical normalize progressed past prior `SSE_NO_COMPLETED_RESPONSE`. Cycle stopped at Execution Packet schema gate (`final_report_contract` missing). No second provider call; no normalizer patch in this pass.

---

## NEXT_GATE

Offline remediation for `PACKET_SCHEMA_INVALID` / missing `final_report_contract` on the GLM primary-remote packet path. Keep unwrap. Do not reopen gate until that remediation is authorized.

---

## Output line

`STOP — PACKET_SCHEMA_INVALID (missing final_report_contract); PROVIDER_CALLS_DELTA=1; GATE_CLOSED=true`

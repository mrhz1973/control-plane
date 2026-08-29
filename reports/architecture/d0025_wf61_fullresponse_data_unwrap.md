# D-0025-W — WF61 n8n fullResponse data unwrap (offline apply)

**Block ID:** `D0025_W_WF61_FULLRESPONSE_DATA_UNWRAP_APPLY`  
**Starting HEAD:** `ed42a36b9533788f94d64a0eddc6c7e2c930a5c7`  
**Artifact:** `workflows/patches/d0025-w-wf61-fullresponse-data-unwrap.gpt-web.json`  
**Status:** **PASS** — offline apply + validation only (no live resume)

## Precheck

| Check | Result |
|---|---|
| origin/main == expected | PASS (`ed42a36…`) |
| WF40 active | PASS |
| WF61 inactive | PASS |
| remote runtime gate CLOSED | PASS (`enabled=false`, `provider_calls_authorized_per_event=0`) |
| live expected_current snippet on 6107 | PASS (exact match once) |
| template/live pre-apply drift on 6107 | expected (template applied first locally; live still had old snippet) |

## Exact apply

| Field | Value |
|---|---|
| Changed node | `d0025-6107-4007-8007-000000000007` Capture HTTP body + status |
| Operation | `replace_exact_snippet` (verbatim GPT-Web) |
| Topology mutations | **0** (13 nodes, IDs/names/types/connections/settings preserved) |
| HTTP Request / prepare / finalize | unchanged |
| Live versionId post-import | `e50fe07e-eda0-408f-a717-216852015e0d` |
| Template ↔ live 6107 jsCode | equivalent after apply |
| WF61 final | inactive |
| Gate final | CLOSED |

### Required semantics (authored)

- `resp.body` keeps first priority if present
- only an object owning **all** of `data`, `headers`, `statusCode`, `statusMessage` is treated as the n8n fullResponse wrapper
- for that wrapper: selected body = `resp.data`
- generic objects that merely contain `data` are **not** unwrapped
- non-wrapper objects remain unchanged
- `sse_census` / `body_shape` / `response_b64` operate on the selected body after unwrap

## Offline validation

| Case | Result |
|---|---|
| 1 wrapper + `data` string → body = data | PASS |
| 2 wrapper + `data` object → serialize inner, not wrapper | PASS |
| 3 object with `body` → body first priority | PASS |
| 4 `data` missing a wrapper key → no unwrap | PASS |
| 5 plain canonical Responses object → no unwrap | PASS |
| 6 generic `{data,…}` → no unwrap | PASS |
| 7 census/body_shape use selected `raw` after unwrap | PASS |
| `git diff --check` | PASS |

## Counters (this pass)

| Metric | Value |
|---|---|
| provider_calls | **0** |
| litellm_requests (Δ) | **0** (log count remains **6**) |
| glm_calls | **0** |
| workflow topology mutations | **0** |
| raw model content persisted | **false** |
| secrets exposed | **false** |
| normalizer file mutated | **false** (`tools/normalize-litellm-responses-body.mjs` untouched) |

## NEXT (frontier only — not executed here)

One bounded live resume of `D-0025-W-GLM-LIVE-001` using the corrected inner-body path.

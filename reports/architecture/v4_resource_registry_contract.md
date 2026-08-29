# V4 - RESOURCE_REGISTRY contract

**Block ID:** `V4_RESOURCE_REGISTRY_CONTRACT`  
**Starting HEAD:** `9496f471ad1ae97e022ea5e511cfec5d797016d1`  
**Final HEAD:** `1ee35423cf2bea858fa10ff59364fdf3641b79a8`  
**Category:** FOUNDATION / ADDITIVE / OFFLINE  
**Provider calls:** 0  
**Ollama calls:** 0  
**LiteLLM calls:** 0  
**n8n mutations:** 0  
**workflow mutations:** 0  
**execution-packet mutations:** 0  
**planner-selection mutations:** 0  
**D-0025-W mutations:** 0  
**secret exposure:** false

## Files created

| Path | Role |
|---|---|
| `docs/contracts/resource-registry-v1.schema.json` | Canonical JSON Schema (draft 2020-12) |
| `configs/resources/registry.json` | Canonical static registry snapshot |
| `tools/validate-resource-registry-v1.mjs` | Offline validator + compatible_resources semantics |
| `tests/resource-registry-validator/run.mjs` | Targeted fixture runner (7 cases) |
| `tests/resource-registry-validator/fixtures/*` | PASS/FAIL fixtures |

## Resource IDs

`cursor`, `opencode`, `grok_bot`, `qwen_local`, `glm`, `codex`, `composer`

## Exact static fields (per resource)

| Field | Constraint |
|---|---|
| `resource_type` | `harness` \| `model` \| `agent` |
| `execution_location` | `local` \| `cloud` \| `hybrid` \| `remote` |
| `roles` | non-empty unique array from planner / implementation_harness / implementation_model / routing_arbiter / reviewer / classifier |
| `capabilities` | unique tags from fixed vocabulary (filesystem, terminal, code_edit, planning, classification, routing_arbitration, code_generation, review, persistent_agent, browser) |
| `compatible_resources` | unique resource IDs; no self-ref; every ref must exist |
| `requires_network` | boolean |

No availability, quota, reset, reserve, timestamps, credentials, or dashboard percentages.

## Compatibility rules

- Schema: `uniqueItems` on roles / capabilities / compatible_resources; `additionalProperties: false` on entries.
- Semantic (validator): reject self-reference; reject unknown compatible IDs.
- Committed edges (evidence/design-bounded):
  - `qwen_local` <-> `opencode` (local model + local harness)
  - `composer` -> `cursor` and `cursor` includes `composer`
  - `glm` -> `cursor` (PROJECT_VISION Cursor harness + GLM path)
  - `codex` / `grok_bot`: no unverified harness edges

## Separation from RESOURCE_STATUS

| Contract | Answers |
|---|---|
| **RESOURCE_REGISTRY** | What CAN this resource do? (static) |
| **RESOURCE_STATUS** | Can I use it NOW? quota/reset/cost/freshness (dynamic) |

This pass does **not** modify `resource-status-v1` or `configs/resources/status.fail-closed.json`.

## Qwen logical resource

`qwen_local` is registered as a logical local model:

- roles: planner, routing_arbiter, reviewer, classifier, implementation_model
- capabilities: planning, classification, routing_arbitration, code_generation, review
- `requires_network: false` (inference itself)
- **no** hard-coded `qwen3:14b` / `OLLAMA_MODEL` identity

Exact Ollama model binding remains deferred to a later `QWEN_LOCAL_ADAPTER`/config block.

## Existing Ollama transport

Repository evidence (`tools/classifier-wrapper-v1.mjs`): Ollama HTTP `/api/generate`, `OLLAMA_BASE_URL` / `OLLAMA_MODEL` configurable, default wrapper model `qwen3:14b`.

This pass **reuses that transport later** - does **not** duplicate it, does **not** call Ollama, does **not** enable Qwen.

## Validation results

`node tests/resource-registry-validator/run.mjs` -> **7/7 PASS**

| Case | Result |
|---|---|
| canonical `registry.json` | PASS |
| unknown `resource_type` | FAIL closed |
| unknown role | FAIL closed |
| duplicate capability | FAIL closed |
| nonexistent compatible ref | FAIL closed |
| self-compatible ref | FAIL closed |
| qwen_local without hard-coded Ollama model name | PASS |

JSON syntax OK. `git diff --check` clean.

## Preserve (unchanged)

RESOURCE_STATUS, execution-packet, planner-routing / selection, WF40/WF61, workflows, n8n, LiteLLM, OpenClaw, CURRENT_FRONTIER D-0025, backlog, GLM gate.

Not created: QWEN_LOCAL_ADAPTER, EXECUTION_ROUTER, REVIEW_ROUTER, Telegram/n8n V4 integration.

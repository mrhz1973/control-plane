# D-0025-W — WF61 finalize failure observability fix apply

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_WF61_FINALIZE_FAILURE_OBSERVABILITY_FIX` (Phase A of FIX_AND_RESUME)  
**Date:** 2026-08-28  
**Standing authorization:** `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`  
**GPT-Web artifact:** `workflows/patches/d0025-w-wf61-finalize-failure-observability-fix.gpt-web.json`  
**Source template:** `workflows/61-litellm-primary-remote-planner.template.json`  
**Status:** **PASS** — node 6109 command updated · WF61 INACTIVE · gate CLOSED · provider delta 0 during apply

| Metric | Value |
|---|---|
| Mutations | **only** node `d0025-6109-4009-8009-000000000009` `command` |
| `provider_calls` during apply | **0** |
| `inference` during apply | **0** |
| LiteLLM total after apply | **1** (unchanged) |
| GLM attempts after apply | **1** (unchanged) |
| `credential_mutations` | **0** |
| `network_mutations` | **0** |
| `teamviewer_mutations` | **0** |
| `secret_exposure` | **false** |

---

## Precheck

| Check | Result |
|---|---|
| `origin/main` start | `63d88ee926cce1fb1436b86babd825c295524c42` |
| Runtime gate | CLOSED |
| Live WF61 pre | inactive · 13 nodes · versionId `c9c97f71-d934-4efd-b423-7aaaec11f86c` |
| Node 6109 current command | exact match to artifact `expected_current_command` |
| LiteLLM `/v1/responses` total | **1** |

## Apply

- Template command → `...finalize --consumer-b64 '…' --response-b64 '…' 2>&1 || true`
- Commit: `de8c3b92e21bccf496198c4caeb81e0dfdf93e24`
- Live import inactive (no publish during apply) · versionId `d0f88e31-4756-471a-9544-1bcfc40a52b2`
- Graph equivalence: **PASS** except node 6109 command
- Runner args unchanged; only shell stdout/stderr merge + nonzero exit normalize

## Phase B note

Bounded resume executed immediately after apply in the same pass (see live report attempt retry 5).

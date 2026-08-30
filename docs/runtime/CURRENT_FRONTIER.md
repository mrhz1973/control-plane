# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | New n8n-facing V4 routing bridge corrective pass reached target **23/23 PASS** and three V4 regressions PASS, then STOPPED only on a pre-existing stale WF61 structural regression assertion. The bridge deliverable remains preserved locally and uncommitted. |
| **BLOCCO ATTIVO** | `WF61_STRUCTURAL_REGRESSION_BASELINE_RECONCILIATION_OFFLINE_ONE_PASS` |
| **STATO BLOCCO** | `BRIDGE_TARGET_23_OF_23_PASS / V4_REGRESSIONS_PASS / WF61_BASELINE_DRIFT_INDEPENDENTLY_VERIFIED / D0025_REMAINS_CLOSED / GATE_CLOSED` |
| **GATE CORRENTE** | **CLOSED** · offline regression-maintenance only · no live OpenCode/Qwen/provider/n8n execution or workflow mutation authorized. |
| **NEXT** | `WF61_STRUCTURAL_REGRESSION_BASELINE_RECONCILIATION_OFFLINE_ONE_PASS` — update only the stale `tests/litellm-primary-cycle/run.mjs` WF61 structural assertion to the already-canonical post-`00f0132` executeCommand transport shape; run that suite once and STOP on any failure. Do not mutate WF61 or reopen D-0025. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved · canonical node 6106 transport is `executeCommand` hang-proof form |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **SINGLE-GENERATION GUARD** | **PROVEN LIVE** · upstream max-one boundary preserved |
| **EXECUTION ADAPTER v1** | **IMPLEMENTED (offline-proven)** · auth mandatory · occupancy fail-closed · guard mandatory |
| **ADAPTER ROUTING BRIDGE v1** | **IMPLEMENTED** · truthful `execution_performed` · dispatch gate preserved |
| **ADAPTER REGISTRY v1** | **IMPLEMENTED** · validated exact-route registry · no fallback |

## Latest bridge STOP

Report:
`reports/architecture/v4_n8n_execution_routing_bridge_correction_regression_stop_operator_relay.md`

Bridge pass evidence remains `operator-relayed` because Cursor stopped before commit/push. The unrelated WF61 regression-baseline drift is independently verified from canonical Git history.

Reported bridge status before regression STOP:

- local/origin HEAD at start: `3508b7158d4047a82f6cb7c8580fac9ae5242211`;
- preservation stash retained: `v4-n8n-routing-bridge-correction-preserve`;
- target bridge suite: **23/23 PASS**;
- adapter-registry: **19/19 PASS**;
- adapter-router: **15/15 PASS**;
- execution-router: **12/12 PASS**;
- litellm-primary-cycle: **17/18 FAIL** only at stale WF61 structural assertion;
- all live/runtime counters zero.

## Independently verified baseline drift

- `tests/litellm-primary-cycle/run.mjs` still requires exactly one `n8n-nodes-base.httpRequest@4.2` node for the LiteLLM transport.
- Commit `00f01325eaf2f218d0dc3578ec1eed278cbd4403` deliberately resynced canonical/live WF61 node 6106 to `n8n-nodes-base.executeCommand` with `post-litellm-primary-one-shot.mjs` and `2>&1 || true` hang-proof transport semantics.
- The structural test predates that resync (`11017d1ac662c4ccddb351b476690ee72ba62582`).
- Therefore the failing regression baseline is stale and unrelated to the V4 bridge changes.

## D-0025 ownership rule

D-0025 remains **CLOSED/completed**. This maintenance does not reopen issue #31, provider budgets, runtime gate, planner workstream, or live WF61 execution. Only the stale offline structural test may be reconciled to the already-canonical template.

## One-pass regression maintenance

- Preserve the current dirty bridge workspace/stash.
- Sync to remote canonical docs without restoring stale runtime docs.
- Modify only `tests/litellm-primary-cycle/run.mjs` unless a directly adjacent test fixture is strictly necessary.
- Replace obsolete `httpRequest@4.2` structural expectations with exact checks for the canonical executeCommand transport helper and its bounded/hang-proof properties.
- Do not change `workflows/61-litellm-primary-remote-planner.template.json`.
- Run `node tests/litellm-primary-cycle/run.mjs` exactly once.
- Any failure => STOP, no second edit/test loop.
- PASS => commit/push only the regression-baseline reconciliation + canonical evidence; bridge deliverable remains preserved for the immediately following bounded commit/push resume block.

## Boundaries

- No live OpenCode/Qwen/provider/n8n execution.
- No workflow mutation.
- No WF40/WF61/WF60/OpenClaw/LiteLLM/D-0025 runtime/network/secret/Qwen-parameter mutation.
- No BugBot.
- Grok Bot remains routing_arbiter only.

## Puntatori

- Latest STOP: `reports/architecture/v4_n8n_execution_routing_bridge_correction_regression_stop_operator_relay.md`
- Canonical WF61 template: `workflows/61-litellm-primary-remote-planner.template.json`
- Stale regression suite: `tests/litellm-primary-cycle/run.mjs`
- WF61 canonical resync commit: `00f01325eaf2f218d0dc3578ec1eed278cbd4403`
- Bridge registry: `tools/v4-execution-adapter-registry-v1.mjs`
- Existing execution router: `tools/evaluate-execution-route.mjs`

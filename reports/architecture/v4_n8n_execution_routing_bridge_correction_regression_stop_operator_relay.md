# V4 — n8n execution routing bridge correction — regression STOP

**Task:** `V4_N8N_EXECUTION_ROUTING_BRIDGE_CORRECTION_ONE_PASS`  
**Evidence class:** `operator-relayed for the uncommitted bridge pass; regression-baseline drift independently repo-verified by GPT Web`  
**Result:** `STOP_REGRESSION_LITELLM_PRIMARY_CYCLE_WF61_STRUCTURAL_FAIL`  
**Reported local/origin HEAD at STOP:** `3508b7158d4047a82f6cb7c8580fac9ae5242211`  
**Commit/push:** none  
**Preservation stash:** `v4-n8n-routing-bridge-correction-preserve` retained

## Bridge corrective result before regression STOP

Reported by Cursor/operator:

- workspace reconciliation: PASS;
- production bridge fix applied: top-level `ok` now propagates `p.ok === true`;
- unsupported-route fixture corrected to isolate `cursor+composer` by making `opencode` / `qwen_local` unavailable in that synthetic case;
- target suite: **23/23 PASS**;
- regressions run once each:
  - execution-adapter-registry: **19/19 PASS**;
  - execution-adapter-router: **15/15 PASS**;
  - execution-router: **12/12 PASS**;
  - litellm-primary-cycle: **17/18 FAIL**;
- no edit/rerun after failure;
- no commit/push.

## Exact regression blocker

`wf61-structural-pass — expected 1 HTTP node, found 0`

The failing assertion is in `tests/litellm-primary-cycle/run.mjs::validateWf61()` and requires exactly one `n8n-nodes-base.httpRequest` node at `http://litellm-primary:4000/v1/responses` with typeVersion `4.2`.

## Independent repo verification

GPT Web independently verified the baseline drift on canonical Git history:

1. Current `tests/litellm-primary-cycle/run.mjs` still asserts one `httpRequest@4.2` node and inspects its URL/body/auth fields.
2. Canonical WF61 was deliberately resynced by commit `00f01325eaf2f218d0dc3578ec1eed278cbd4403` (`d0025: resync live WF61 canonical hang-proof after 6106 drift`) so node 6106 is `n8n-nodes-base.executeCommand`, not `httpRequest`; that commit records live/template equivalence with 6106 executeCommand and preserves `2>&1 || true` hang-proof transport semantics.
3. The litellm-primary-cycle structural test predates that resync; commit `11017d1ac662c4ccddb351b476690ee72ba62582` still reported the older suite passing before the later WF61 transport-type resync.

Therefore the 17/18 regression failure is **pre-existing structural-test drift**, independent of the new V4 n8n routing bridge.

## Ownership / closure rule

D-0025 remains **CLOSED** as a completed workstream and issue; this maintenance does **not** reopen D-0025, provider/runtime gates, or live planning. The stale regression belongs to historical WF61/D-0025 artifact maintenance only.

The correct follow-up is a bounded **offline regression-baseline reconciliation** that updates the stale structural assertion to the already-canonical post-`00f0132` WF61 executeCommand transport shape. It must not mutate WF61, LiteLLM, n8n, provider runtime, credentials, or live state.

## Required reconciliation semantics

The structural test should verify the canonical current transport rather than restore the obsolete HTTP Request node. At minimum, the test must require exactly one node named `HTTP Request - LiteLLM primary one-shot` with:

- type `n8n-nodes-base.executeCommand`;
- typeVersion `1`;
- command invoking `tools/post-litellm-primary-one-shot.mjs`;
- encoded URL targeting `http://litellm-primary:4000/v1/responses` through the helper contract;
- `request_body_b64` input;
- bounded wall/body-idle/body-size options;
- `2>&1 || true` hang-proof normalization;
- no credential/secret material;
- no public network target.

The test may preserve the existing prepare/finalize, Qwen-deferred, no-Telegram, no-executeWorkflow, node-type/version and no-secret checks.

## Reported counters

```yaml
qwen_generation_calls: 0
qwen_session_manager_calls: 0
opencode_execution_count: 0
adapter_run_calls: 0
provider_calls: 0
n8n_execution_calls: 0
workflow_mutations: 0
network_mutations: 0
secret_exposure: false
```

## Next

`WF61_STRUCTURAL_REGRESSION_BASELINE_RECONCILIATION_OFFLINE_ONE_PASS`

After that baseline is green, resume the preserved uncommitted bridge deliverable in a separate one-pass commit/push block without rerunning design work.

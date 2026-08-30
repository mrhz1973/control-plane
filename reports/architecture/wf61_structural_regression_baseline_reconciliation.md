# WF61 structural regression baseline reconciliation (offline)

**Block:** `WF61_STRUCTURAL_REGRESSION_BASELINE_RECONCILIATION_OFFLINE_ONE_PASS`
**Date:** 2026-08-30 · **Result:** PASS

## Summary

Reconciled the stale `wf61-structural-pass` assertion in
`tests/litellm-primary-cycle/run.mjs` with the canonical post-`00f0132` WF61
template. D-0025 remains **CLOSED**. No workflow mutation. No provider/model
calls. No bridge work restored or committed in this pass.

## Stale expectation (removed)

The structural test previously required exactly one:

```text
n8n-nodes-base.httpRequest@4.2
url = http://litellm-primary:4000/v1/responses
```

That shape predates the hang-proof live resync.

## Canonical transport (now asserted)

From `workflows/61-litellm-primary-remote-planner.template.json` after
`00f01325eaf2f218d0dc3578ec1eed278cbd4403`:

```text
name:        HTTP Request - LiteLLM primary one-shot
type:        n8n-nodes-base.executeCommand
typeVersion: 1
```

Command must include:

- `post-litellm-primary-one-shot.mjs`
- url-b64 `aHR0cDovL2xpdGVsbG0tcHJpbWFyeTo0MDAwL3YxL3Jlc3BvbnNlcw==`
  (= `http://litellm-primary:4000/v1/responses`)
- `request_body_b64`
- `--wall-timeout-ms 115000`
- `--body-idle-timeout-ms 15000`
- `--max-body-bytes 8388608`
- `2>&1 || true`

Also required: zero `httpRequest` nodes; credentialless transport;
no bearer/API-key/secret literals; no public HTTP(S) provider target;
prepare/finalize Execute Command checks preserved; QWEN_DEFERRED preserved;
Telegram / executeWorkflow prohibitions preserved; fail-closed / no-retry
semantics preserved; allowed type/version set matches the 13-node template
(no `httpRequest@4.2`).

## Proof

```text
node tests/litellm-primary-cycle/run.mjs  ->  18/18 PASS (once)
```

## Unchanged

- `workflows/**` — zero diff
- `tools/run-litellm-primary-cycle.mjs` — unchanged
- D-0025 — closed (not reopened)
- Bridge preservation stashes kept:
  - `v4-n8n-routing-bridge-fixed-preserve`
  - `v4-n8n-routing-bridge-correction-preserve`

## Pass counters

```yaml
provider_calls: 0
glm_calls: 0
codex_calls: 0
qwen_generation_calls: 0
n8n_execution_calls: 0
workflow_mutations: 0
network_mutations: 0
credential_mutations: 0
secret_exposure: false
```

## NEXT

`V4_N8N_EXECUTION_ROUTING_BRIDGE_COMMIT_RESUME_ONE_PASS`

# V4 — n8n execution routing bridge integration offline — operator-relayed STOP

**Task:** `V4_N8N_EXECUTION_ROUTING_BRIDGE_INTEGRATION_OFFLINE`  
**Evidence class:** `operator-relayed / not independently verified from pushed Cursor commit`  
**Result:** `STOP_TARGET_SUITE_3_OF_23_FAILED`  
**Reported HEAD:** `42202d9ece9bfd2ed7d86bac317e8c2e38d342eb`  
**Commit/push:** none  
**Workspace:** dirty only with this block's new uncommitted files

## Target result

- Target suite: **20/23 PASS**
- Regressions: **not run** because one-pass rule stopped immediately after target failure.
- Live/runtime counters: all zero.

## Failure diagnosis supplied by Cursor/operator

### 1. Production defect — bridge `ok` propagation

Affected checks:

- `routed-result-propagated`
- `no-fallback-adapter-run-never-invoked`

In the new uncommitted `tools/n8n-v4-execution-routing-bridge-v1.mjs`, `base()` hardcodes `ok: false` and drops a successful `p.ok === true`. The routed classification, route_id, implementer and model were reported correct; only top-level `ok` remained false.

Required minimal semantics:

```js
ok: p.ok === true
```

This is a production result-contract/accounting defect, analogous to the earlier dropped `execution_performed` partial-field defect.

### 2. Test fixture defect — unsupported route isolation

Affected check:

- `unsupported-route-adapter-not-registered`

The test RESOURCE_STATUS fixture made both `cursor+composer` and `opencode+qwen_local` available. The canonical EXECUTION_ROUTER correctly preferred the free local route via `LOWER_COST`, so the test expectation of `cursor+composer` was invalid.

Required fixture correction: mark `opencode` / `qwen_local` unavailable for that synthetic case so the intended cursor lane is isolated, matching existing execution-router fixture semantics.

## What already passed

Reported PASS coverage includes malformed/not-PASS cycle results, GATE/BLOCKED/malformed policy, missing/invalid route request, no synthesized technical requirements, malformed RESOURCE_STATUS, adapter metadata resolution for `opencode+qwen_local`, invalid-registry fail-closed, zero adapter runs, `dispatch_prepared=false`, `execution_performed=false`, no Qwen/session/provider/network imports, CLI single-JSON fail-closed behavior, and no secret-like persistence.

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

## Determined remediation

Next block: `V4_N8N_EXECUTION_ROUTING_BRIDGE_CORRECTION_ONE_PASS`.

Scope is limited to:

1. preserve the current dirty bridge block;
2. sync canonical remote docs;
3. apply the one-line production `ok` propagation fix;
4. correct only the unsupported-route fixture so local free route is unavailable in that scenario;
5. run target once, then regressions once only if target passes;
6. any failure => STOP, no further edit/test cycle;
7. PASS => commit/push the full bridge deliverable and advance to `V4_WF40_EXECUTION_ROUTING_PATCH_AUTHORING`.

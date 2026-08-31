# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_RUNTIME_AUTHORIZATION_PROVENANCE_HARDENING_VALIDATION_ORDER_CORRECTION
result_cursor: PASS
starting_head: 84a30b9ded82ce01760f34d94b33616cb951143d
final_head: pending_commit

category: DELICATO
runtime_mutations: 3
workflow_mutations: 0
network_mutations: 1
tailscale_mutations: 1
service_mutations: 1
execution_route_contained_during_dev: true
execution_route_restored_after_pass: true
http_execution_endpoint_requests: 0
opencode_cli_calls: 0
qwen_generation_calls: 0
provider_calls: 0
secret_exposure: false
wf40_node_count_unchanged: 66
wf61_active: false
d0025_gate_closed: true
live_execution: 0
bugbot_invoked: true
bugbot_result: PASS_NO_FINDINGS

target_suite: tests/v4-windows-local-execution-endpoint/run.mjs
target_result: 48/48 PASS

regressions:
  - opencode-execution-adapter: 23/23 PASS
  - opencode-single-generation-guard: 16/16 PASS
  - v4-local-runtime-readonly-contribution: 29/29 PASS
  - v4-local-runtime-readonly-private-endpoint: 22/22 PASS

corrective_lineage:
  initial_hardening: server-side registry + endpoint integration + P1-P17 tests
  stop_46_of_48:
    P7: test expected AUTHORIZATION_ROUTE_MISMATCH for invalid registry route_id; registry v1 const-pins route → corrected to AUTHORIZATION_REGISTRY_INVALID
    P10: in-memory spentAuth/authBinding intercepted before registry → second request got AUTHORIZATION_ID_REUSED instead of AUTHORIZATION_ALREADY_SPENT
  corrections_applied:
    P7: test expectation + contract note (route mismatch unreachable in v1)
    P10: inspectAuthorization + admission order registry-before-binding
    registry_isolation: per-test re-seed for replay/occupancy/concurrency after prior spends

runtime_apply:
  empty_registry: "%LOCALAPPDATA%\\control-plane\\v4-runtime-authorization-registry-v1.json"
  scheduled_task: ControlPlane-V4-LocalExecutionEndpoint updated with --authorization-registry
  listener: 127.0.0.1:18791 exactly one
  readonly_18790: unchanged
  tailscale_routes:
    root: 127.0.0.1:18789 preserved
    readonly: 127.0.0.1:18790 preserved
    execution: /v4/execution/opencode-local -> 127.0.0.1:18791 restored
  funnel: absent

artifacts:
  - reports/architecture/v4_runtime_authorization_provenance_hardening.md
  - tools/v4-runtime-authorization-provenance-registry-v1.mjs
  - docs/contracts/v4-runtime-authorization-provenance-registry-v1.md
  - docs/contracts/v4-runtime-authorization-provenance-registry-v1.schema.json
  - tools/serve-v4-windows-local-execution-endpoint-v1.mjs
  - tests/v4-windows-local-execution-endpoint/run.mjs
  - docs/contracts/v4-windows-local-execution-endpoint-v1.md
  - docs/foundation/PROMPT_SEQUENCING_GATE.md

architecture_report: reports/architecture/v4_runtime_authorization_provenance_hardening.md
NEXT: V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF
```

# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_RUNTIME_AUTHORIZATION_PROVENANCE_GAP_DISCOVERY
result_cursor: PASS
starting_head: 159bcb162d2df6a99cbd955efb6b109dae408af0
final_head: 61816daf9605df7e682e0d34d5460255d457ef05

category: DOCS_ONLY_ARCHITECTURE_DISCOVERY
runtime_mutations: 0
workflow_mutations: 0
network_mutations: 0
tailscale_mutations: 0
service_mutations: 0
http_execution_endpoint_requests: 0
opencode_cli_calls: 0
qwen_generation_calls: 0
provider_calls: 0
secret_exposure: false
wf40_node_count_unchanged: 66
wf61_active: false
d0025_gate_closed: true
live_execution: 0
bugbot_invoked: false

verdict: AUTHORIZATION_PROVENANCE_GAP_CONFIRMED

key_findings:
  shape_validation_owners:
    - tools/opencode-execution-adapter-v1.mjs validateRuntimeAuthorization()
    - docs/contracts/v4-windows-local-execution-endpoint-v1.request.schema.json
  provenance_validation_owners: NONE
  issuance_artifacts: docs/runtime/AUTH_V4_*.operator.json (audit-only, no code path validates them)
  spend_validation: endpoint in-memory binding only (post-admission, non-durable)
  consequence: AUTHORIZATION_REJECTED unreachable via HTTP by construction; schema-valid synthesized auth reaches guard/runner
  recommended_minimal_boundary: server-side issued-authorization registry (user-local, outside Git, fail-closed on unknown id; ACTIVE->SPENT server-side; ledger seed)
  vps_unauthorized_proof: BLOCKED UNTIL PROVENANCE HARDENING PASS

artifacts:
  - reports/architecture/v4_runtime_authorization_provenance_gap_discovery.md

architecture_report: reports/architecture/v4_runtime_authorization_provenance_gap_discovery.md
NEXT: V4_RUNTIME_AUTHORIZATION_PROVENANCE_HARDENING
```

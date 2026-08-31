# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_WINDOWS_LOCAL_RUNTIME_RUNNER_TRANSPORT_DISCOVERY
result_cursor: PASS
starting_head: 3f5398de0e91707d5dfea3f7899af4384940473a
final_head: TO_BE_VERIFIED_AFTER_PUSH

category: DOCS_ONLY_DISCOVERY
runtime_mutations: 0
workflow_mutations: 0
network_mutations: 0
tailscale_mutations: 0
service_mutations: 0
opencode_cli_calls: 0
qwen_generation_calls: 0
provider_calls: 0
process_mutations: 0
secret_exposure: false
wf40_node_count_unchanged: 66
wf61_active: false
d0025_gate_closed: true

read_set:
  - tools/opencode-execution-adapter-v1.mjs
  - tools/opencode-single-generation-guard-v1.mjs
  - tools/qwen-local-session-manager-v1.mjs
  - tools/produce-v4-local-runtime-readonly-contribution-v1.mjs
  - docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md
  - docs/contracts/v4-local-runtime-readonly-contribution-adapter-v1.md
  - docs/contracts/n8n-v4-execution-adapter-router-bridge-v1.md
  - reports/architecture/v4_opencode_execution_adapter_v1.md
  - reports/architecture/v4_local_runtime_readonly_private_endpoint_implementation.md

key_findings:
  occupancy_classifier_owner: tools/produce-v4-local-runtime-readonly-contribution-v1.mjs (classifyQwenSharedRuntime, pure)
  occupancy_classifier_duplicated: false
  missing_callbacks: getOccupancy, runOpenCode
  guardStart_new_wiring_required: false (production default startSingleGenerationGuard already wired in adapter)
  getOccupancy_owner: windows_local_execution_service (in-process, execution-time)
  runOpenCode_owner: windows_local_execution_service (in-process, single opencode spawn)
  trust_boundary: tailscale_private_https_vps_to_windows_loopback
  existing_readonly_endpoint_reuse: rejected_keep_separate (GET-only no-body observation transport)
  replay_strategy: single_use_spend_plus_execution_id_idempotency
  concurrency_strategy: single_flight_fail_closed_reject

architecture_report: reports/architecture/v4_windows_local_runtime_runner_transport_discovery.md
NEXT: V4_GPT_WEB_EXECUTION_ENDPOINT_CONTRACT_AUTHORING (v4-windows-local-execution-endpoint-v1)
```

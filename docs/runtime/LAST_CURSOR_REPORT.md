# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE_BUGBOT_CORRECTION
result_cursor: PASS
starting_head: 096f16bece0601a5c0390427962c992134b71a7c
dispatch_base_head: d50f0a917810013d80e0cef0cbc11fdec14f086c
final_head: pending_commit

category: SECURITY_RUNTIME_INTEGRATION (corrective pass over STOP 096f16b)
bugbot_corrections: 4
bugbot_result: PASS_NO_FINDINGS

real_telegram_bot_api_calls: 0
telegram_messages: 0
runtime_mutations: 0
workflow_mutations: 0
network_mutations: 0
tailscale_mutations: 0
scheduled_task_mutations: 0
service_mutations: 0
production_pending_store_mutations: 0
production_issuance_config_mutations: 0
production_registry_mutations: 0
production_spend_ledger_mutations: 0
n8n_mutations: 0
http_execution_endpoint_requests: 0
wf40_executions: 0
wf61_executions: 0
opencode_cli_calls: 0
qwen_generation_calls: 0
provider_calls: 0
authorization_issuance: 0
authorization_spends_production: 0
active_production_issuance: 0
secret_exposure: false
wf40_node_count_unchanged: 71
wf61_active: false
d0025_gate_closed: true
live_execution: 0
live_issuance: 0

target_suites:
  - tests/v4-runtime-authorization-issuance/run.mjs: 43/43 PASS (36 original + 7 regression A-G)
  - tests/v4-windows-local-execution-endpoint/run.mjs: 61/61 PASS
  - tests/v4-runtime-authorization-durable-spend-ledger/run.mjs: 13/13 PASS

regressions:
  - opencode-execution-adapter: 23/23 PASS
  - opencode-single-generation-guard: 16/16 PASS
  - v4-local-runtime-readonly-contribution: 29/29 PASS
  - v4-local-runtime-readonly-private-endpoint: 22/22 PASS

git_diff_check: PASS

corrections:
  - finding1: service CLI arg parser argv typo fixed (--issuance-config acquired)
  - finding2: pending-store CLI arg parser argv typo fixed (--pending-store acquired)
  - finding3: validatePendingStoreObject rewritten state-specific; EXPIRED validates without receipt; PENDING/APPROVED/REJECTED/ISSUED receipt rules unchanged
  - finding4: CLI decision_count now reads result.store.decisions.length
  - latent: isMain guards anchored to full filename (serve tool no longer triggers module CLI)

invariants_preserved:
  - direct Telegram verification (chat_id + from.id from update only)
  - HTTP_ISSUE_ENDPOINT_ABSENT
  - N8N_APPROVAL_ATTESTATION_FORBIDDEN
  - pending store state machine + immutable bindings
  - provenance issueActiveEntry bounded; provenance CLI validation-only
  - spend ledger writes 0 on issuance path

artifacts:
  - reports/architecture/v4_runtime_authorization_issuance_path_implementation_offline.md
  - tools/v4-runtime-authorization-issuance-v1.mjs
  - tools/serve-v4-runtime-authorization-issuance-v1.mjs
  - tests/v4-runtime-authorization-issuance/run.mjs
  - tools/v4-runtime-authorization-provenance-registry-v1.mjs (bounded issueActiveEntry)

previous_stop_preserved: 096f16bece0601a5c0390427962c992134b71a7c

architecture_report: reports/architecture/v4_runtime_authorization_issuance_path_implementation_offline.md
NEXT: V4_RUNTIME_AUTHORIZATION_ISSUANCE_PRIVATE_SERVICE_PERSISTENCE_PRECHECK
```

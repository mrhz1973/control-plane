# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: WF61_STRUCTURAL_REGRESSION_BASELINE_RECONCILIATION_OFFLINE_ONE_PASS
result_cursor: PASS_WF61_STRUCTURAL_BASELINE_RECONCILED
starting_head: 65dfa07c96cb6dbb6be1aafe7b46aaed0df9577d
final_head: <stamped post-commit>

stale_test_path: tests/litellm-primary-cycle/run.mjs
canonical_wf61_template_path: workflows/61-litellm-primary-remote-planner.template.json
canonical_resync_commit: 00f01325eaf2f218d0dc3578ec1eed278cbd4403
old_expected_transport: n8n-nodes-base.httpRequest@4.2
canonical_transport: n8n-nodes-base.executeCommand@1 (HTTP Request - LiteLLM primary one-shot)
workflow_modified: false
d0025_reopened: false

target_tests: PASS_18_OF_18

bridge_fixed_stash_present: true
bridge_old_backup_stash_present: true

provider_calls: 0
qwen_generation_calls: 0
n8n_execution_calls: 0
workflow_mutations: 0
secret_exposure: false

architecture_report: reports/architecture/wf61_structural_regression_baseline_reconciliation.md
NEXT: V4_N8N_EXECUTION_ROUTING_BRIDGE_COMMIT_RESUME_ONE_PASS
```

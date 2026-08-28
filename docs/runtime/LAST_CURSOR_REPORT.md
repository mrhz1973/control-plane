# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0025-W_WF40_PARENT_WIRING_EXACT_READONLY_PREFLIGHT
result_cursor: PASS_D0025_WF40_PARENT_WIRING_AUTHORING_INPUT_READY
reported_via: cursor_direct_persistence
independent_verification: cursor_vps_wf40_export_readonly
report_persistence_commit: 80e7e5c71ab9c23fda9ead1cf8632ff3400a31f8
classification: WF40_PARENT_WIRING_EXACT_AUTHORING_INPUT_READY

repo_head_observed_at_task: d9eb71b924bfa9b5ebdd873c93269a2bc7ab6f4d
workspace_at_start: clean
operator_gate_ref: github:issue/31#5453568468
issue_31_state: OPEN

WF40_LIVE:
  id: 9ZMj2ACTKyDVhCue
  active: true
  versionId: 86ed5569-ce2b-49bb-9f3b-30f4e7fa918b
  updatedAt: 2026-08-27T07:49:35.000Z
  node_count: 35

V1_MODELS: not_called_this_pass
litellm_readiness: 200_healthy

SEAM_NODES:
  plan_stub: 429cde10-b360-4396-9f57-ffeac563d2fe
  github_fetch: 52e94e9c-986f-4f93-bac3-2c20ec4a60a1
  detect_plans: cf34f974-d471-4983-814c-a942ce2f27bb
  if_plan_detected: 528577ea-6424-4779-8d07-51f8502dc084
  pm21_classifier: 666f9ed5-5236-42d1-b4ef-afe59e9d2a8a
  pm21_bridge: 5ee80b07-4260-40df-9c25-251a7e212de6

INSERTION_EDGE:
  after_node: Code - PM21 bridge result
  after_node_id: 5ee80b07-4260-40df-9c25-251a7e212de6
  current_downstream: Code - PM21 format Telegram bridge summary

CANONICAL_INPUTS_BUILDABLE: false
GPT_WEB_AUTHORING_REQUIRED: true

CONSUMER_DIRECT_EXISTING: [source_backlog_ref, source_backlog_commit, repository, risk_hint]
CONSUMER_MUST_NOT_INFER: [planner_requested]
ROUTING_MUST_NOT_INFER: [preferred]
ROUTING_DETERMINISTIC_DERIVABLE: [schema, fallback, fallback_policy]

WF61_EXECUTE_FEASIBLE:
  workflow_id: d0025-6100-4001-8001-000000000061
  passthrough_compatible: true

PRESERVATION:
  wf40_unchanged: true
  wf60_unchanged: true
  wf61_unchanged: true
  wf61_executions: 0

BUDGET_THIS_PASS:
  workflow_mutations: 0
  provider_calls: 0
  inference: 0
  wf61_executions: 0

SECRET_VALUE_DISPLAYED: false

NEXT_GATE: GPT_WEB_WF40_PARENT_WIRING_EXACT_PATCH_AUTHORING

REPORT: reports/architecture/d0025_wf40_parent_wiring_exact_readonly_preflight.md
```

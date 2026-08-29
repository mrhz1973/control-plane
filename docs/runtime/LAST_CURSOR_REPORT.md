# LAST CURSOR REPORT - control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non e LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D0025_W_PACKET_FINAL_REPORT_CONTRACT_HARDENING
result_cursor: PASS_PACKET_FINAL_REPORT_CONTRACT_HARDENING_APPLIED_OFFLINE
reported_via: cursor_direct_persistence
starting_head: 6e6beebee26b4ff1f2aac5fb71f263c109b2b15e
final_head: 9f47164e824b1af20d70b86dda0ddfe5bb04d8cf

apply_phase: PASS
mutations:
  - tools/build-openclaw-responses-request.mjs (PLANNER_INSTRUCTIONS +2 lines)
  - docs/contracts/openclaw-execution-packet-consumer-v1.md (§3 +2 lines)
new_instruction_lines_once_each: true
schema_unchanged: true
final_report_contract_required_const: true
no_autofill: true
provider_calls: 0
tests:
  openclaw-request-builder: PASS (15/15)
  llm-gateway-request-shape: PASS (4/4)
  llm-gateway-portability: PASS (19/19)
  execution-packet-validator: PASS (5/5)
  execution-packet-policy-gate: PASS (15/15)
git_diff_check: PASS
gate_closed_final: true
live_resume: NOT_EXECUTED
normalizer_mutated: false
workflow_mutated: false
raw_model_content_persisted: false
secrets_exposed: false

NEXT: one bounded live resume of D-0025-W-GLM-LIVE-001; max one LiteLLM/GLM attempt; retry=0; fallback=0
```

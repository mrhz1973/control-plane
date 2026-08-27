# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0022-W
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 95443be5b6ba82bafa61b4a222ecebf7a7378c71
workspace_at_start: clean
issue: 28

evaluator: tools/evaluate-planner-selection.mjs
policy_contract: docs/contracts/planner-selection-evaluator-v1.md
input_schema: docs/contracts/planner-routing-input-v1.schema.json
parent_policy: docs/contracts/planner-routing-policy-v1.md

d0022_tests:
  runner: tests/planner-selection-evaluator/run.mjs
  passed: 17
  failed: 0
  total: 17
  exit_code: 0

notes:
  - PROCEED means planner selection only; not inference/OpenClaw/Cursor authorization
  - high-risk preferred unavailable/unknown does not auto-fallback
  - equivalent_or_gate does not invent equivalence attestation
  - Ajv strictTypes=false only to compile GPT-Web allOf/contains schema as authored

network_access: false
provider_model_request_count: 0
credential_access: 0
telegram_used: false
cursor_dispatch_executed: false
openclaw_mutation: false
n8n_mutation: false
vps_mutation: false
dependency_manager_created: false
packages_installed: false
d0016_phase_b_executed: false

d0017_regression: {passed: 5, failed: 0, total: 5, exit_code: 0}
d0018_regression: {passed: 15, failed: 0, total: 15, exit_code: 0}
d0019_regression: {passed: 15, failed: 0, total: 15, exit_code: 0}
d0020_regression: {ok: true, classification: PASS, exit_code: 0}
d0021_regression: {passed: 15, failed: 0, total: 15, exit_code: 0}

NEXT_GATE_CLASSIFICATION: D0022_W_COMPLETE
```

## Evidence boundary

Implemented GPT-Web planner selection evaluator verbatim with schema-validated routing input. D-0022 17/17 PASS; regressions D-0017→D-0021 PASS. No network/provider/runtime/credential/Telegram/Cursor dispatch. D-0016-W Phase B not executed. PROCEED is routing-only.

## Completion persistence invariant

Per i task Cursor successivi, il report finale non deve restare soltanto nella chat Cursor.

Prima di dichiarare il task completamente chiuso, Cursor deve persistere in GitHub un aggiornamento docs-only di questo file con almeno:

- `task_ref` esatto;
- risultato `PASS|BLOCKED|FAILED`;
- evidence deterministica necessaria al gate/NEXT;
- HEAD/workspace osservati quando pertinenti;
- eventuali mutazioni runtime effettuate;
- `NEXT_GATE_CLASSIFICATION` o blocker esatto;
- nessun secret/token.

La persistenza del report è evidence bookkeeping recuperabile e non amplia lo scope runtime del task.

Se `agg` trova un `LAST_CURSOR_REPORT` che non corrisponde al pass Cursor atteso, deve classificare **`EVIDENCE_NOT_PERSISTED`**, non concludere che il task non sia stato eseguito.

## History

La cronologia precedente del rolling report resta recuperabile nella Git history. Il file corrente privilegia il LATEST necessario a `agg` e al resume lean.

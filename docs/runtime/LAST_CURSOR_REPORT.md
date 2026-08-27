# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0023-W
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 37fe07a9ee6b55e8fa587934093ab07ac4839f5a
workspace_at_start: clean
issue: 29
issue_30_runtime: STAGED_GLM_CODEX_ONLY_QWEN_DEFERRED

adapter: tools/build-llm-gateway-request.mjs
contracts:
  - docs/contracts/llm-gateway-portability-v1.md
  - docs/contracts/llm-gateway-profile-v1.schema.json
  - docs/contracts/llm-gateway-comparison-spike-v1.md

litellm_template: configs/litellm/control-plane-spike.template.yaml
comparison_matrix: reports/architecture/openclaw_vs_litellm_spike_matrix.md

d0023_tests:
  runner: tests/llm-gateway-portability/run.mjs
  passed: 18
  failed: 0
  total: 18
  exit_code: 0

key_results:
  - LiteLLM explicit alias binding PROVEN_OFFLINE (qwen/glm/codex test aliases)
  - OpenClaw legacy -> PLANNER_BINDING_UNVERIFIED / request_ready=false
  - GLM coding endpoint explicit in template: https://api.z.ai/api/coding/paas/v4
  - Codex OAuth placeholder without Platform API-key fallback
  - Qwen 3.8 37B semantic target; no 27B; no download
  - no RUNTIME_PROVEN claims
  - D-0024 not executed; GLM+Codex budget untouched (0/2); Qwen runtime deferred

network_access: false
provider_model_request_count: 0
credential_access: 0
telegram_used: false
cursor_dispatch_executed: false
openclaw_mutation: false
n8n_mutation: false
vps_mutation: false
litellm_install_or_start: false
d0016_phase_b_executed: false
dependency_manager_created: false
packages_installed: false

d0017_regression: {passed: 5, failed: 0, total: 5, exit_code: 0}
d0018_regression: {passed: 15, failed: 0, total: 15, exit_code: 0}
d0019_regression: {passed: 15, failed: 0, total: 15, exit_code: 0}
d0020_regression: {ok: true, classification: PASS, exit_code: 0}
d0021_regression: {passed: 15, failed: 0, total: 15, exit_code: 0}
d0022_regression: {passed: 17, failed: 0, total: 17, exit_code: 0}

NEXT_GATE_CLASSIFICATION: D0023_W_COMPLETE__D0024_GLM_CODEX_STAGED_READY_FOR_RUNTIME_PREREQUISITES__QWEN_DEFERRED
```

## Evidence boundary

Offline/config OpenClaw vs LiteLLM spike complete: portability adapter, sanitized LiteLLM template, and comparison matrix. No install/start/HTTP/provider/credential access. D-0024 runtime pilot not executed. OpenClaw and D-0016-W Phase B authorization unchanged.

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

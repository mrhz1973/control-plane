# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0013-Z_ZAI_SUPPORT_ESCALATION_PACKET_PREP
result_cursor: PASS_SUPPORT_PACKET_PREPARED_NOT_SUBMITTED
reported_via: cursor_direct_persistence
independent_verification: cursor_documental_only
report_persistence_commit: pending_this_commit

repo_head_observed_at_task: 7dfa08b03556b5074702487c29248407d4193398
workspace_at_start: clean
active_work: github:issue/8
operator_gate: support escalation packet preparation authorized in-band 2026-08-27 (draft only, no external submission)

packet_path: docs/runtime/ISSUE_8_ZAI_SUPPORT_ESCALATION_DRAFT.md
packet_status: SUPPORT_ESCALATION_PACKET_PREPARED
external_submission: false
zai_contacted: false

packet_includes:
  - vps_ionos_environment_and_openclaw_versions
  - coding_plan_global_endpoint
  - local_config_pass_without_credential_values
  - authenticated_vps_http500_glm53_and_glm51
  - cross_host_windows_success_glm51
  - unauthenticated_egress_diagnostic_dns_tcp_tls_401
  - eset_tls_caveat
  - root_cause_as_hypothesis_application_layer_ip_risk_control_suspect
  - precise_questions_for_zai_support

provider_model_request_count: 0
authenticated_requests: 0
network_mutations: false
config_auth_runtime_mutations: false
secret_exposed: false
secret_logged: false
secret_persisted: false

NEXT_RECOMMENDED_GATE: AWAITING_EXTERNAL_SUBMISSION_GATE — operator reviews draft and submits to Z.AI Support through official channel; no further probes without new authorization
```

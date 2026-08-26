# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0008-Z_ZAI_CREDENTIAL_IDENTITY_DIAGNOSTIC
result_cursor: PASS_READ_ONLY_DIAGNOSTIC
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: c81579ccca2a174cc4e9c2de229834cef62f6eac
workspace_at_start: clean
active_work: github:issue/8
operator_evidence_ref: github:issue/8#issuecomment-5430877624

diagnostic_type: read_only_credential_identity
goal: determine which Z.AI dashboard API Key ID corresponds to stored OpenClaw auth profile zai:manual
authorization_scope: identity extraction and local comparison only; not provider/model authorization

ZAI_MANUAL_KEY_ID_MATCH: CANNOT_SAFELY_DETERMINE

ZAI_DOCUMENTED_KEY_STRUCTURE: "{32-hex-id}.{16-alnum-secret}"
ZAI_EXPECTED_FULL_KEY_LENGTH_CLASS: approximately_49_chars_when_complete

STORE_RESOLVED:
  path: /root/.openclaw/state/openclaw.sqlite
  table: auth_profile_stores
  store_key: shared
  profile_id: zai:manual
  provider: zai
  auth_type: api_key
  profile_present: true

STORED_CREDENTIAL_FORMAT_ANALYSIS:
  key_length: 5
  contains_dot: false
  matches_id_dot_secret: false
  matches_id_only_32hex: false
  charset_class: ascii_printable_digits_and_punctuation_only
  unique_char_count: 4
  secret_store_entries_row_count: 0
  env_fallback_keys_checked: ZAI_API_KEY UNSET; GLM_API_KEY UNSET; BIGMODEL_API_KEY UNSET
  alternate_agent_store_profile: missing
  openclaw_models_status_label_length: 16
  openclaw_cli_list_confirms: "zai:manual [zai/api_key]"

EXTRACTED_API_KEY_ID:
  extractable: false
  reason: stored profile.key is not in documented Z.AI id.secret format and is far shorter than a valid full key

OPERATOR_DASHBOARD_KEYS_AVAILABLE_FOR_MATCH:
  cursor_key:
    name: Cursor
    created: 2026-07-01
    last_used: 2026-08-19
    sanitized_32hex_key_id_supplied: false
  control_plane_key:
    name: Control Plane
    created: 2026-08-26
    last_used_ui: Not used
    sanitized_32hex_key_id_supplied: false

COMPARISON_OUTCOME:
  cursor_key_id_compare: not_performed_missing_extracted_id_and_missing_dashboard_id
  control_plane_key_id_compare: not_performed_missing_extracted_id_and_missing_dashboard_id
  neither_known_key_ruled_out: false
  interpretation: cannot map zai:manual to Cursor vs Control Plane dashboard keys without a valid extracted API Key ID and without sanitized dashboard Key ID values in-band

MATERIAL_FINDING:
  stored_openclaw_zai_manual_credential_does_not_match_documented_zai_api_key_format
  prior_four_surface_http500_probes_likely_used_nonconforming_short_stored_value_as_bearer
  this materially weakens provider_only_upstream_failure_as_sole_explanation

provider_model_request_count: 0
credential_mutation: false
config_mutation: false
profile_mutation: false
runtime_mutation: false
network_mutation: false

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
SECRET_VALUE_HASHED: false
SECRET_VALUE_MEASURED: false
AUTHORIZATION_DATA_EXPOSED: false

NEXT_RECOMMENDED_GATE: real human gate to re-enter or repair zai:manual with a full documented-format Z.AI key before any further provider/model request or provider-side support escalation
```

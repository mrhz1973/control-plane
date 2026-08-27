# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0016-W_PHASE_A_WINDOWS_OPENCLAW_HTTP_PLANNER_SURFACE_READONLY
result_cursor: PASS_HTTP_PLANNER_SURFACE_DISABLED
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_readonly_openclaw_windows
report_persistence_commit: 6f0ba2fbd5ffc79c520fa24b59f53ec853719959

repo_head_observed_at_task: a221686c41b5b7ef9a7f252014544b0ee59018ee
workspace_at_start: clean
repo_sync: fast_forward_ok
origin_main_after_sync: a221686c41b5b7ef9a7f252014544b0ee59018ee
operator_gate_ref: github:issue/22
active_work: github:issue/22

HOST:
  surface: home_windows_openclaw
  openclaw_identifiable: true
  openclaw_path: C:\Users\mrhz\AppData\Roaming\npm\openclaw.cmd

OPENCLAW_VERSION:
  version: "2026.5.20"
  build: e510042

GATEWAY_STATUS_SANITIZED:
  service: Scheduled Task (missing)
  config_cli: ~\.openclaw\openclaw.json
  config_service: ~\.openclaw\openclaw.json
  bind_reported: loopback (127.0.0.1)
  port_reported: 18789
  probe_target: ws://127.0.0.1:18789
  connectivity_probe: failed
  connectivity_error: ECONNREFUSED 127.0.0.1:18789
  gateway_listening_at_inspection: false
  restart_performed: false

GATEWAY_CONFIG_SANITIZED:
  gateway.mode: local
  gateway.bind: loopback
  gateway.port: 18789
  gateway.auth.mode: token
  gateway.auth.token_value_read: false
  gateway.http: null
  gateway.http.endpoints: unset
  gateway.http.endpoints.responses.enabled: unset_path_not_found
  gateway.http.endpoints.chatCompletions.enabled: unset_path_not_found
  gateway.tailscale.mode: serve
  gateway.tailscale.resetOnExit: true

HTTP_PLANNER_SURFACE_CLASSIFICATION: HTTP_PLANNER_SURFACE_DISABLED
classification_basis: both responses.enabled and chatCompletions.enabled are unset/absent; gateway.http is null; OpenClaw docs default is disabled
autonomous_enablement: false

LOCAL_HEALTH:
  url: http://127.0.0.1:18789/health
  result: connection_refused
  http_status: null
  note: consistent with gateway not listening; no restart attempted

TAILSCALE:
  serve_status_human: "https://asusdesktop.tailc01234.ts.net (tailnet only) -> / proxy http://127.0.0.1:18789"
  serve_private_tailnet_only: true
  funnel_public_exposure: false
  funnel_status_note: CLI shows same private serve proxy; human status marked tailnet only; no public Funnel claimed

INVARIANTS:
  windows_fallback_only: preserved
  vps_canonical_primary: preserved
  gateway_bind_loopback: true
  gateway_auth_mode_token: true
  tailscale_serve_private: true
  funnel_disabled_or_non_public: true
  openclaw_config_mutation: false
  openclaw_restart: false
  zai_mutation: false
  n8n_mutation: false
  vps_mutation: false
  pm34_l5_endurance_permanent_schedule: unchanged

PROVIDER_BOUNDARY:
  called_v1_responses: false
  called_v1_chat_completions: false
  called_v1_models: false
  inference_performed: false
  provider_model_inference_request_count: 0

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
SECRET_VALUE_HASHED_OR_MEASURED: false

NEXT_REAL_GATE: D0016_W_PHASE_B_EXPLICIT_HTTP_PLANNER_SURFACE_ENABLE_GATE
next_gate_note: enabling gateway.http.endpoints.responses and/or chatCompletions requires explicit operator authorization; also gateway process was not listening at Phase A inspection (Scheduled Task missing / ECONNREFUSED) and must not be restarted in this pass
```

# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0014-W_WINDOWS_OPENCLAW_PRIVATE_FALLBACK_BROKER
result_cursor: PASS
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 33904f4049f5c097de941f8e24731102e84e8680
workspace_at_start: clean
execution_packet: docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_EXECUTION_PACKET.yaml
execution_packet_revision: 1
operator_gate_ref: github:issue/20#issuecomment-5431799606

planner_requested: codex
planner_used: glm
planner_fallback_used: true
implementation_rounds: 1

WINDOWS_OPENCLAW_VERSION: 2026.5.20
WINDOWS_OPENCLAW_PATH: C:\Users\mrhz\AppData\Roaming\npm\openclaw
WINDOWS_CONFIG_PATH: ~/.openclaw/openclaw.json

TOPOLOGY: loopback_plus_tailscale_serve
GATEWAY_BIND: loopback
GATEWAY_PORT: 18789
TAILSCALE_MODE: serve
TAILSCALE_SERVE_TARGET: http://127.0.0.1:18789
TAILNET_HOSTNAME: asusdesktop.tailc01234.ts.net
TAILNET_IPV4: 100.110.35.23
VPS_TAILNET_HOSTNAME: ubuntu
VPS_TAILNET_IPV4: 100.114.7.53

PRE_CHANGE_STATE:
  gateway_tailscale_mode: off
  tailscale_serve_target: http://127.0.0.1:8765
  rollback_local_snapshot: ~/.openclaw/openclaw.json.rollback-d0014-w

POST_CHANGE_STATE:
  gateway_running: true
  local_listen: 127.0.0.1:18789
  local_gateway_health: OK
  tailscale_serve_enabled: true
  funnel_enabled: false
  direct_tailnet_tcp_18789: closed_or_refused

PRIVATE_REACHABILITY_FROM_VPS:
  https_root_http_code: 200
  https_health_http_code: 200
  wss_connect: ok
  wss_connect_ms: 225

provider_model_request_count: 0
zai_provider_model_requests: 0
credential_mutation: false
vps_openclaw_mutation: false
config_mutation: true
profile_mutation: false
runtime_mutation: true
network_mutation: true
network_mutation_scope: tailnet_private_serve_only

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
SECRET_VALUE_HASHED: false
SECRET_VALUE_MEASURED: false
AUTHORIZATION_DATA_EXPOSED: false

N8N_WORKFLOW_MUTATION: false
WINDOWS_PROMOTED_TO_PRIMARY: false

NEXT_REAL_GATE: production wiring, Windows gateway OS service hardening, or scope expansion requires new explicit authorization
```

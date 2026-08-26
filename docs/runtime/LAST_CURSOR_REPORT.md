# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0015-W_WINDOWS_FALLBACK_HARDENING_N8N_ROUTING_NON_CREDENTIAL_STAGE
result_cursor: PASS_NON_CREDENTIAL_STAGE_COMPLETE
next_gate: BLOCKED_N8N_OPENCLAW_CREDENTIAL_BINDING_REQUIRED
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: 233a4b8fa296e2a94bde60b9c917ee2083ac327a

repo_head_observed_at_task: a7629e46c9d64d52248d6823ac142562852bedbf
workspace_at_start: clean
operator_gate_ref: github:issue/21#issuecomment-5431911525
prior_transport_pass: github:issue/20 D-0014-W

AUTOSTART_MECHANISM:
  primary: "Startup folder -> OpenClaw-Gateway-Autostart.cmd"
  startup_path: "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\OpenClaw-Gateway-Autostart.cmd"
  script_path: "%USERPROFILE%\\.openclaw\\gateway-autostart.cmd"
  idempotent_rule: skip_start_when_port_18789_listen_count_gt_0
  openclaw_gateway_install_schtasks: failed_access_denied
  user_logon_schtasks: failed
  autostart_start_verified: true
  autostart_skip_when_running_verified: true
  log_path: "%LOCALAPPDATA%\\OpenClaw\\gateway-autostart.log"

WINDOWS_GATEWAY_STATE:
  openclaw_version: 2026.5.20
  bind: loopback
  port: 18789
  listen: 127.0.0.1:18789
  tailscale_mode: serve
  tailscale_serve_target: http://127.0.0.1:18789
  tailnet_hostname: asusdesktop.tailc01234.ts.net
  gateway_auth_mode: token
  funnel_enabled: false
  local_health_http_code: 200

N8N_CONTAINER_REACHABILITY:
  container: root-n8n-1
  probe_method: node_fetch
  fallback_health_url: https://asusdesktop.tailc01234.ts.net/health
  health_http_code: 200
  root_http_code: 200
  direct_tailnet_tcp_18789: not_required_closed

N8N_BINDING_DISCOVERY_METADATA_ONLY:
  credentials_total: 2
  matching_openclaw_gateway_credentials: 0
  credential_names_types:
    - {name: "CONTROL PLANE - Telegram Bot", type: telegramApi}
    - {name: "GitHub account", type: githubApi}
  container_env_openclaw_gateway: none
  safe_existing_auth_binding_for_authenticated_openclaw_api: false

WORKFLOW_TARGET_DISCOVERY:
  gpt_web_artifact: workflows/60-openclaw-broker-fallback-resolver.template.json
  live_n8n_workflow_present: false
  insertion_point: executeWorkflowTrigger node "When Executed by Another Workflow"
  parent_integration_pattern: parent workflow adds Execute Workflow node calling WF60 after import/publish
  health_nodes_auth: none
  authenticated_api_wiring: requires new gateway token credential or env binding not present

provider_model_request_count: 0
credential_mutation: false
gateway_auth_mode_mutation: false
vps_openclaw_mutation: false
n8n_workflow_logic_authored_by_cursor: false
public_exposure: false

SECRET_VALUE_DISPLAYED: false
SECRET_VALUE_LOGGED: false
SECRET_VALUE_PERSISTED: false
SECRET_VALUE_HASHED: false
SECRET_VALUE_MEASURED: false
AUTHORIZATION_DATA_EXPOSED: false

STOP_REASON_FOR_NEXT_STAGE: authenticated n8n-to-OpenClaw invocation requires creating/copying a gateway token credential or changing auth mode; no safe existing binding found
```

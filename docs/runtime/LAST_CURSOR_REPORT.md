# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: D-0012-Z_ZAI_UNAUTHENTICATED_EGRESS_PATH_DIAGNOSTIC
result_cursor: PASS_READ_ONLY_DIAGNOSTIC
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: pending_this_commit

repo_head_observed_at_task: b550d707a41fc72863b9de121c1cccf48fae592a
workspace_at_start: clean
active_work: github:issue/8
operator_gate: bounded unauthenticated egress/network-path diagnostic authorized in-band 2026-08-26 (VPS IONOS vs Windows, api.z.ai, no auth headers, no provider/model invocation)

diagnostic_type: unauthenticated_egress_network_path_comparison
targets: api.z.ai (DNS, TCP/TLS, unauthenticated HTTPS only)
authenticated_requests: 0
provider_model_invocations: 0
retry: 0
fallback: 0
config_auth_runtime_network_mutations: false

VPS_IONOS:
  host_identity: ubuntu.tailc01234.ts.net
  timestamp_utc: 2026-08-26T22:01:36Z
  dns_A: [47.245.163.4, 47.245.170.100]
  dns_AAAA: present (Aliyun GA CNAME chain)
  public_egress_ip: 217.160.71.145
  tcp_443: reachable
  tls_sni: api.z.ai
  tls_cert_subject: CN=*.z.ai
  tls_cert_issuer: Sectigo Public Server Authentication CA DV R36
  tls_verify: pass
  unauth_GET_root: http_301 remote_ip=47.245.170.100 tls_ok http2
  unauth_HEAD_coding_prefix: http_401 (expected without Authorization)

WINDOWS_PC:
  host_identity: ASUSDESKTOP
  timestamp_utc: 2026-08-26T22:01:35Z
  dns_A: [47.245.163.4, 47.245.170.100]
  public_egress_ip: 95.249.154.241
  tcp_443: reachable
  tls_sni: api.z.ai
  tls_cert_subject: CN=*.z.ai
  tls_cert_issuer: ESET SSL Filter CA (local SSL inspection — not direct server cert)
  unauth_GET_root: redirect_handling_error (non-blocking for path comparison)
  unauth_HEAD_coding_prefix: http_401 (expected without Authorization)

COMPARISON:
  dns_resolution: SAME A records on both hosts
  tcp_tls_path: FUNCTIONAL on both hosts (VPS reaches real Sectigo cert; Windows path intercepted locally by ESET)
  unauth_coding_prefix_reachability: BOTH return HTTP 401 — endpoint path is reachable from VPS; network path is NOT blocked at transport layer
  egress_ip: DIFFERENT — VPS datacenter 217.160.71.145 vs Windows residential 95.249.154.241
  authenticated_chat_completions_prior: VPS HTTP 500 (glm-5.1 and glm-5.3); Windows SUCCESS (glm-5.1 with same key family)

INTERPRETATION_BOUNDARY:
  transport_and_unauthenticated_path: NOT the failure layer (VPS can reach api.z.ai and receive expected 401 on coding prefix)
  failure_likely_at_application_layer: authenticated request handling, plausibly keyed on datacenter egress IP or account/key+IP risk control
  windows_tls_comparison_caveat: ESET local SSL inspection prevents direct TLS cert comparison on Windows; unauthenticated HTTP status comparison remains valid
  no_remediation_applied: true

provider_model_request_count: 0
secret_exposed: false
secret_logged: false
secret_persisted: false

NEXT_RECOMMENDED_GATE: real human gate — escalate to Z.AI support with sanitized cross-host evidence (datacenter IP 217.160.71.145 gets HTTP 500 on authenticated chat/completions while residential IP succeeds; unauthenticated path works from both) OR authorize a separate bounded test from a different egress on VPS (e.g. Tailscale exit node) if desired; no further probes without new authorization
```

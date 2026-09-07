# CURRENT VPS STATE

Updated after `V4_VPS_GOI_COLD_START_BOOT_PERSISTENCE_V1` on 2026-09-07.

```text
VPS_STATE
OLD_HOST=ionos-n8n
OLD_IP=217.160.71.145
OLD_ROLE=LIVE
OLD_TAILSCALE_IP=100.114.7.53
OLD_TAILSCALE_NAME=ubuntu
OLD_MAGICDNS=ubuntu.tailc01234.ts.net

NEW_HOST=ionos-n8n-new
NEW_IP=31.70.139.73
NEW_ROLE=PREP
NEW_OS_HOSTNAME=ubuntu
NEW_TAILSCALE_HOSTNAME=ionos-n8n-new
NEW_TAILSCALE_IP=100.99.54.93
NEW_TAILSCALE_IPV6=fd7a:115c:a1e0::6a3a:365f
NEW_TAILSCALE_JOIN=PASS
NEW_MAGICDNS=ionos-n8n-new.tailc01234.ts.net
NEW_PRIMARY_ROUTES=NONE
NEW_EXIT_NODE_OPTION=FALSE
NEW_SERVE_CONFIG=NONE
NEW_FUNNEL_CONFIG=NONE
TAILSCALE_POST_JOIN_VERIFY=PASS

MIGRATED_VALIDATED=15
PRESENT_NOT_VALIDATED=14
MISSING=0
PROJECT_DECISIONS_PENDING=1
ROLLUP_COUNTS_STATUS=UNRECONCILED_F03_DO_NOT_USE_FOR_FINAL_ACCEPTANCE

GOI_HANDOFF=INGESTED_AS_IS_INCOMPLETE
GOI_NEW_READONLY_RECONCILIATION=PASS_WITH_BLOCKERS
GOI_OLD_PARITY_PROBE=PASS
GOI_OLD_FINAL_NONSECRET_INSPECT=PASS_WITH_ACTIONABLE_DELTA
GOI_NEW_FINAL_PARITY_VERIFY=PASS_WITH_ACTIONABLE_DELTA
GOI_NEW_PARITY_COPY_CONFIG_RENDER=PASS
GOI_POST_RENDER_PREACTIVATION_VERIFY=PASS_WITH_SCOPE_LIMITATION
GOI_PARITY_FILES_AND_STATE=STAGED_VALIDATED
GOI_NEW_IDENTITY_CONFIG=PARTIALLY_RENDERED_VALIDATED
GOI_ACTIVE_OLD_IDENTITY_REFS=NONE_IN_EFFECTIVE_GIS_HTML
GOI_SERVICES=GRAPHHOPPER_ORS_NGINX_DFLIGHT_GIS_NAV_RUNTIME_ACTIVE_ENABLED
GOI_SYSTEMD_ENABLEMENT=PASS
GOI_COLD_START=PASS
GOI_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
HOST_REBOOT_EXECUTED=NO
GOI_LISTENER_TOPOLOGY_AFTER_COLD_START=PASS
GOI_FUNCTIONAL_REGRESSION=PASS
GOI_PUBLIC_EXPOSURE=NONE
GOI_GRAPHHOPPER_FUNCTIONAL_QUALIFICATION=PASS
GOI_GRAPHHOPPER_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
GOI_ORS_FUNCTIONAL_QUALIFICATION=PASS
GOI_ORS_RUNTIME=ACTIVE_NOT_ENABLED
GOI_ORS_BIND=127.0.0.1:8020
GOI_ORS_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
GOI_ORS_CORS_REMEDIATION=PASS
GOI_ORS_GIS_ORIGIN=NEW_IDENTITY
GOI_ORS_READY_FOR_NGINX_PRIVATE_CHAIN=YES
NEW_TLS_ISSUANCE_ATTEMPT=RECOVERED_QUALIFIED
NEW_TLS_HELPER_INACTIVE_NGINX_SEMANTICS=PASS
NEW_TLS_IDENTITY=QUALIFIED
NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION=PASS
VPS_CONSUMER_REGISTRY_COVERAGE=PASS
CODEX_VPS_EVIDENCE_AUDIT=F01_F02_CONFIGURATION_GAPS_CLOSED
F01_NGINX_VHOST=EFFECTIVELY_INCLUDED_SYNTAX_VALID
F01_NGINX_INCLUDE_REMEDIATION=PASS
NGINX_RUNTIME=ACTIVE_NOT_ENABLED
NGINX_FUNCTIONAL_QUALIFICATION=PASS
NGINX_BIND=100.99.54.93:443
NGINX_PUBLIC_EXPOSURE=NONE
GOI_HTTPS_ORS_CHAIN=PASS
GOI_HTTPS_TLS_HOSTNAME_VERIFY=PASS
GOI_HTTPS_CORS_NEW_GIS=PASS
GOI_NGINX_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
GOI_DFLIGHT_PERMISSION_REMEDIATION=PASS
DFLIGHT_CONFIG_ACCESS=GOI_DFLIGHT_USER_READABLE
DFLIGHT_CSRF_ACCESS=GOI_DFLIGHT_USER_READABLE
DFLIGHT_RUNTIME=ACTIVE_NOT_ENABLED
DFLIGHT_BIND=100.99.54.93:8010
DFLIGHT_PUBLIC_EXPOSURE=NONE
GOI_DFLIGHT_FUNCTIONAL_QUALIFICATION=PASS
DFLIGHT_STATUS_SMOKE=PASS
DFLIGHT_LKG_READ=PASS
DFLIGHT_GIS_NEW_ORIGIN=PASS
DFLIGHT_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
F02_GIS_ENDPOINTS=NEW_IDENTITY_RETARGETED
F02_GIS_ENDPOINT_REMEDIATION=PASS
F02_GRAPHHOPPER_DESTINATION=http://100.99.54.93:8989
F02_ORS_DESTINATION=https://ionos-n8n-new.tailc01234.ts.net
F02_DFLIGHT_DESTINATION=http://100.99.54.93:8010
GOI_GIS_FUNCTIONAL_QUALIFICATION=PASS
GIS_RUNTIME=ACTIVE_NOT_ENABLED
GIS_BIND=100.99.54.93:8000
GIS_PUBLIC_EXPOSURE=NONE
GIS_SERVED_ARTIFACT_MATCH=PASS
GIS_NEW_ENDPOINTS=PASS
GIS_BROWSER_ORS_CHAIN=PASS
GIS_BROWSER_DFLIGHT_CHAIN=PASS
GIS_BROWSER_GRAPHHOPPER_CHAIN=PASS
GIS_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
GOI_NAV_FUNCTIONAL_QUALIFICATION=PASS
NAV_RUNTIME=ACTIVE_NOT_ENABLED
NAV_BIND=100.99.54.93:5000
NAV_PUBLIC_EXPOSURE=NONE
NAV_APPLICATION_SMOKE=PASS
NAV_FUNCTIONAL_PROXY_SMOKE=NOT_AVAILABLE_CANONICALLY
NAV_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
F01_F02_CONFIGURATION_GAPS=CLOSED
REMAINING_GOI_ACTIVATION_CLEARANCE=READY_FOR_NEXT_BOUNDED_SLICE
DEV_METHOD_HANDOFF=INGESTED_MIGRATED_VALIDATED
SCHEMA_ENGINE_HANDOFF=INGESTED_MIGRATED_VALIDATED
SCHEMA_ENGINE_FUNCTIONAL_QUALIFICATION=PASS
SCHEMA_ENGINE_HOST_TREE=PASS
SCHEMA_ENGINE_CONTAINER_BIND=PASS
SCHEMA_ENGINE_RESOLVER=PASS
SCHEMA_ENGINE_AJV_VERSION=8.20.0
SCHEMA_ENGINE_AJV_FORMATS_VERSION=3.0.1
SCHEMA_ENGINE_VALID_FIXTURE=PASS
SCHEMA_ENGINE_INVALID_FIXTURE=FAIL_CLOSED_MISSING_REQUIRED_FIELD
SCHEMA_ENGINE_NETWORK_RUNTIME=NONE
SCHEMA_ENGINE_RESTART_PERSISTENCE=STRUCTURALLY_PROVEN_BY_SHARED_BIND
SCHEMA_ENGINE_MIGRATION_STATUS=MIGRATED_VALIDATED
SCHEMA_ENGINE_F03_ROW_PROMOTED_ROLLUP_FROZEN=YES
OPENCLAW_HANDOFF=INGESTED_KEEP_STAGED_PENDING
CROSS_PROJECT_PREJOIN_RECONCILIATION=CLEARED
TAILSCALE_UNIQUE_IDENTITY_JOIN=PASS
TAILSCALE_DNSNAME_ROUTES_SERVE_VERIFY=PASS

PROJECT_PRIMARY_ORCHESTRATOR_CHAT=OPENCLAW42
VPS_MIGRATION_CHAT=TEMPORARY_SPECIALIST_UNTIL_MIGRATION_COMPLETE
CURSOR_EXECUTOR=SINGLE_EXECUTOR_FOR_REMAINING_VPS_WORK
SECOND_SCHEMA_CHAT=ABANDONED_NO_LIVE_WORK_PERFORMED
SCHEMA_ENGINE_EXECUTION=FOLDED_INTO_VPS_CURSOR_WORKSTREAM
VPS_HANDOFF_TARGET_AFTER_COMPLETION=OPENCLAW42
VPS_CHAT_CLOSE_CONDITION=MIGRATION_COMPLETE_AND_HANDOFF_RECORDED

SHARED_INFRA_GATES=GOI_ACTIVATION,SCHEMA_ENGINE_VALIDATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=CURSOR_ACTIVE_NGINX_TLS_RENEWAL
```

## Current proven state

OLD remains live production and unchanged.

NEW currently has:
- PostgreSQL 16.15 healthy and unpublished;
- n8n 2.33.3 loopback-only, health 200, execution-capable/published `0/0`;
- LiteLLM 1.98.0 running unpublished;
- Hermes/browser stack qualified and private;
- unique Tailscale identity `ionos-n8n-new` / `100.99.54.93` / `ionos-n8n-new.tailc01234.ts.net` with no routes, exit-node, Serve or Funnel;
- NEW TLS identity qualified;
- GraphHopper functional qualification PASS on `100.99.54.93:8989`, admin `127.0.0.1:8990`, enabled with cold-start persistence PASS;
- ORS loopback functional qualification PASS on `127.0.0.1:8020`, CORS GIS origin retargeted to `http://100.99.54.93:8000`, enabled with cold-start persistence PASS;
- D-Flight private functional qualification PASS on `100.99.54.93:8010`, enabled with cold-start persistence PASS;
- GIS private functional qualification PASS on `100.99.54.93:8000`, enabled with cold-start persistence PASS;
- Nav private functional qualification PASS on `100.99.54.93:5000`, enabled with cold-start persistence PASS;
- nginx private-chain functional qualification PASS on `100.99.54.93:443` only (HTTPS→ORS, hostname-verified TLS), enabled with cold-start persistence PASS; no public `:80`/`:443`;
- F02 GIS HTML retargeted to NEW GraphHopper/ORS/D-Flight identities; GIS now serving that artifact privately;
- schema-engine isolated Ajv tree functionally qualified and `MIGRATED_VALIDATED` (F03 aggregate rollup still frozen).

## F01/F02 evidence correction

`V4_VPS_GOI_F01_F02_READONLY_EVIDENCE_V1` completed read-only and corrected two assumptions:

1. **F01 nginx — `STAGED_NOT_INCLUDED`.** `/etc/nginx/nginx.conf` includes `conf.d/*.conf` and `sites-enabled/*`, both empty on NEW. `/etc/nginx/sites-available/goi-ors-gateway` contains the intended NEW Tailscale bind, NEW MagicDNS, NEW TLS paths and loopback ORS upstream, but is not in the effective nginx include graph. Prior `nginx -t PASS` therefore validated the empty include set, not the GOI vhost.

2. **F02 GIS — `ACTIVE_OLD_ENDPOINT_FOUND`.** The effective GIS runtime is a static `python3 -m http.server` serving `coordinate_converter Claude.html`. That served HTML still contains effective OLD destinations, including GraphHopper `http://100.114.7.53:8989`, ORS `https://ubuntu.tailc01234.ts.net`, and an adjacent D-Flight override on OLD Tailscale identity. No NEW identity strings were present in the served HTML.

The earlier aggregate claim `GOI_ACTIVE_OLD_IDENTITY_REFS=NONE` must not be used beyond the narrower config surfaces actually inspected before this evidence pass.

## NEW TLS qualification

`V4_VPS_NEW_TLS_RECOVERY_V1` remains valid:
- NEW SAN exact;
- OLD SAN absent;
- cert/key match and modes PASS;
- renewal helper inactive-nginx semantics PASS;
- active-nginx renewal/persistence remains pending.

## Counts caveat — F03

The historical rollup `15/14/0/1` is preserved but is not currently reproducible directly from the aggregate PROJECT registry rows. It must be reconciled by a dedicated denominator/mapping pass before full-parity sign-off; do not silently replace it with row counts and do not use it alone for cutover acceptance. The schema-engine **row** is now `MIGRATED_VALIDATED`; that promotion does **not** update the frozen F03 rollup.

## Project orchestration model

- **OpenClaw 42 chat** remains the primary project/orchestration chat.
- **This VPS migration chat** is temporary and closes after migration completion and final handoff.
- **Cursor** is the single executor for remaining VPS work.
- The OpenClaw application/runtime on the VPS remains staged/inactive with `KEEP_STAGED_PENDING` unless separately authorized.

## Remaining blockers before human cutover

1. Qualify active-nginx TLS renewal on NEW (GOI cold-start persistence and schema-engine done; TLS renewal row still pending; F03 rollup frozen).
2. Parallel OLD↔NEW validation, including F03 count denominator, OLD public `:80` requiredness and OLD TLS renewal/rollback health.
3. Human cutover gate.

Production n8n publication/cutover and OLD decommission remain separately gated.

Evidence anchors:
- #68
- `reports/architecture/v4_vps_goi_cold_start_boot_persistence_v1.md`
- `reports/architecture/v4_vps_schema_engine_new_functional_qualification_v1.md`
- `reports/architecture/v4_vps_goi_nav_private_functional_qualification_v1.md`
- `reports/architecture/v4_vps_goi_gis_private_functional_qualification_v1.md`
- `reports/architecture/v4_vps_goi_dflight_private_functional_qualification_retry1_v1.md`
- `reports/architecture/v4_vps_goi_dflight_config_permission_remediation_v1.md`
- `reports/architecture/v4_vps_goi_nginx_private_chain_functional_qualification_v1.md`
- `reports/architecture/v4_vps_goi_ors_cors_new_gis_remediation_v1.md`
- `reports/architecture/v4_vps_goi_ors_loopback_functional_qualification_v1.md`
- `reports/architecture/v4_vps_goi_f02_gis_endpoint_remediation_v1.md`
- `reports/architecture/v4_vps_goi_f01_nginx_include_remediation_v1.md`
- `reports/architecture/v4_vps_codex_independent_evidence_audit_v1.md`
- `reports/architecture/v4_vps_cross_project_consumer_mini_audit_v1.md`
- `reports/architecture/v4_vps_goi_graphhopper_activation_v1.md`
- `reports/architecture/v4_vps_new_tls_recovery_v1.md`

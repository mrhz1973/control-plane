# Project VPS registry

Current projection after authorized production cutover PASS. NEW is LIVE with the exact frozen four-workflow publication map; OLD n8n is stopped and OLD PostgreSQL/GOI/LiteLLM remain intact as rollback standby. Rollback retention is open with no automatic expiry; decommission remains unauthorized.

| Project / component | OLD footprint | NEW state | Shared dependencies | Migration status | Evidence / next |
|---|---|---|---|---|---|
| Control Plane core — PostgreSQL | Docker PostgreSQL 16.15 | healthy, unpublished | Docker/common boot | MIGRATED_VALIDATED | #68 prep-copy report |
| Control Plane core — n8n | stopped writer; PostgreSQL/publication retained for rollback | live loopback `127.0.0.1:5678`, health 200, exact 4-workflow map, capable/published 4/4 | rollback retention / future exit gate | MIGRATED_VALIDATED | cutover PASS; OLD retained |
| Control Plane core — LiteLLM | unpublished Docker service | running unpublished | secret-safe auth binds | MIGRATED_VALIDATED | #68 |
| Hermes/browser | Hermes 0.21 + Chromium/CDP/Xvfb/x11vnc/noVNC; OLD process-level, NEW `hermes-*.service` | qualified; auth persistence, recall, short soak, post-soak PASS | loopback-only browser ports | MIGRATED_VALIDATED | #67 |
| GOI GraphHopper | OLD live TS app + loopback admin | runtime active enabled; app `100.99.54.93:8989`, admin `127.0.0.1:8990`; canonical hiking `/route` 200; cold-start PASS | Tailscale IP | MIGRATED_VALIDATED | F03 reconciled |
| GOI ORS gateway | OLD live loopback `127.0.0.1:8020`; tree `/opt/goi-ors-gateway` | runtime active enabled; loopback `127.0.0.1:8020`; CORS GIS origin `http://100.99.54.93:8000`; status 200 ready/PRESENT; cold-start PASS | nginx/TLS/Tailscale | MIGRATED_VALIDATED | F03 reconciled |
| GOI GIS / cursor-coordinate-converter | OLD TS `:8000`; WD `/root/local-files/handoff-runtime/cursor-coordinate-converter` | runtime active enabled; bind `100.99.54.93:8000`; F02 HTML served; browser Origin PASS vs GH/ORS/D-Flight; cold-start PASS | Tailscale IP, local-files, GraphHopper/ORS/D-Flight | MIGRATED_VALIDATED | F03 reconciled |
| GOI Navionics / Planet-Clone | OLD TS `:5000`; WD `/root/local-files/handoff-runtime/Planet-Clone` | runtime active enabled; bind `100.99.54.93:5000`; GET `/status` 200 `tokens_ok=true`; cold-start PASS | Tailscale IP, local-files | MIGRATED_VALIDATED | F03 reconciled |
| GOI D-Flight | OLD TS `:8010`; `/opt/goi-dflight-helper` + `/var/lib/goi-dflight` | runtime active enabled; bind `100.99.54.93:8010`; GET `/status` READY, current canonical refresh 816 features; NEW Origin CORS PASS; cold-start PASS | Tailscale, GIS client | MIGRATED_VALIDATED | F03 reconciled |
| GOI TLS renewal | OLD timer live; cert files `/etc/goi-ors/tls`; oneshot observed failed on OLD | active-nginx renewal PASS: unit run with nginx live, reload proven, weekly timer enabled, live cert = installed leaf, SAN NEW only | NEW MagicDNS/TLS identity | MIGRATED_VALIDATED | F03 reconciled; OLD retained for rollback |
| nginx GOI vhost | OLD live TS `:443` + public default `:80` | runtime active enabled; bind `100.99.54.93:443` ssl only; HTTPS `/ors/status` 200 ready/PRESENT; no public `:80`/`:443`; cold-start PASS | Tailscale/TLS/ORS | MIGRATED_VALIDATED | F03 reconciled |
| Control Plane checkout bind | `/root/local-files/handoff-runtime/control-plane` mounted read-only into n8n; LiteLLM config from this tree | present on NEW; same bind shape | n8n, LiteLLM, local-files | MIGRATED_VALIDATED | keep unpublished |
| `/srv/cp-verifier-inbox` | n8n bind; owner `cpinbox` | present on NEW; same bind | n8n | MIGRATED_VALIDATED | empty inbox; no extra daemon |
| `/root/local-files` | n8n `/files` bind; contains handoff-runtime | present on NEW | n8n, LiteLLM, GOI GIS/Nav | MIGRATED_VALIDATED | umbrella persistent application root |
| dev-method | tree `/root/local-files/handoff-runtime/dev-method` | copied/validated | local-files | MIGRATED_VALIDATED | reference-only |
| schema-engine | tree `/root/local-files/handoff-runtime/schema-engine` | isolated Ajv 8.20.0 + ajv-formats 3.0.1; validator valid PASS / invalid FAIL_CLOSED; bind `/files` persistent | n8n/control-plane only | MIGRATED_VALIDATED | non-network; F03 reconciled |
| OpenClaw app/node | preserved fallback trees | copied/staged, inactive, no listener | future fallback transport only | MIGRATED_VALIDATED | `KEEP_STAGED_PENDING` role satisfied; do not activate |
| `n8n-compose.service` | OLD n8n stopped by cutover; PostgreSQL retained | enabled/active; restarted through canonical boundary after restore | n8n core | MIGRATED_VALIDATED | cutover PASS; rollback retention open |
| GOI service users | OLD live service accounts | NEW nologin accounts present | shared Linux identity | MIGRATED_VALIDATED | no further identity mutation required |
| Tailscale node identity | OLD `ubuntu` / `100.114.7.53` | unique `ionos-n8n-new` / `100.99.54.93`; exact NEW MagicDNS, private reachability, no routes/exit-node/Serve/Funnel | all TS-bound GOI services | MIGRATED_VALIDATED | parallel validation PASS |
| historical OLD Docker volumes | OLD leftovers `root_n8n_postgres_data`, `_retry006`, `_seqresync_prod`; OLD `_quarantine` under local-files | not copied; no current container/compose consumer | none | OBSOLETE_CONFIRMED_NOT_REQUIRED | retain until decommission gate; no deletion in this task |

## Latest proof

```text
NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION=PASS
VPS_PARALLEL_VALIDATION=PASS
F03_ACCOUNTING_RECONCILIATION=PASS_32_2_AFTER_CODEX_RECOUNT
F04_OLD_PUBLIC_80_REQUIREDNESS=NON_REQUIRED_OBSOLETE_DEFAULT
F05_OLD_TLS_CURRENT_HTTPS_HEALTH=PASS
F05_OLD_TLS_RENEWAL_HEALTH=PERSISTENT_DEGRADED_HELPER_MISSING_203_EXEC
F05_OLD_ROLLBACK_TLS_PRACTICABLE=YES
NEW_CORE_RESTART_PERSISTENCE=PASS
GOI_GRAPHHOPPER_FUNCTIONAL_QUALIFICATION=PASS
GOI_GRAPHHOPPER_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
VPS_CONSUMER_REGISTRY_COVERAGE=PASS
F01_NGINX_VHOST=EFFECTIVELY_INCLUDED_SYNTAX_VALID
F01_NGINX_INCLUDE_REMEDIATION=PASS
NGINX_RUNTIME=ACTIVE_ENABLED
NGINX_FUNCTIONAL_QUALIFICATION=PASS
NGINX_BIND=100.99.54.93:443
NGINX_PUBLIC_EXPOSURE=NONE
GOI_HTTPS_ORS_CHAIN=PASS
GOI_NGINX_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
GOI_DFLIGHT_PERMISSION_REMEDIATION=PASS
DFLIGHT_CONFIG_ACCESS=GOI_DFLIGHT_USER_READABLE
DFLIGHT_FUNCTIONAL_QUALIFICATION=PASS
DFLIGHT_RUNTIME=ACTIVE_ENABLED
DFLIGHT_BIND=100.99.54.93:8010
DFLIGHT_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
F02_GIS_ENDPOINTS=NEW_IDENTITY_RETARGETED
F02_GIS_ENDPOINT_REMEDIATION=PASS
GOI_GIS_FUNCTIONAL_QUALIFICATION=PASS
GIS_RUNTIME=ACTIVE_ENABLED
GIS_BIND=100.99.54.93:8000
GIS_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
GOI_NAV_FUNCTIONAL_QUALIFICATION=PASS
NAV_RUNTIME=ACTIVE_ENABLED
NAV_BIND=100.99.54.93:5000
NAV_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
F01_F02_CONFIGURATION_GAPS=CLOSED
GOI_ORS_FUNCTIONAL_QUALIFICATION=PASS
GOI_ORS_RUNTIME=ACTIVE_ENABLED
GOI_ORS_BIND=127.0.0.1:8020
GOI_ORS_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
GOI_ORS_CORS_REMEDIATION=PASS
GOI_ORS_GIS_ORIGIN=NEW_IDENTITY
GOI_ORS_READY_FOR_NGINX_PRIVATE_CHAIN=YES
GOI_SYSTEMD_ENABLEMENT=PASS
GOI_COLD_START=PASS
GOI_BOOT_PERSISTENCE=PASS_ENABLED_AND_COLD_START
HOST_REBOOT_EXECUTED=NO
GOI_LISTENER_TOPOLOGY_AFTER_COLD_START=PASS
GOI_FUNCTIONAL_REGRESSION=PASS
SCHEMA_ENGINE_FUNCTIONAL_QUALIFICATION=PASS
SCHEMA_ENGINE_MIGRATION_STATUS=MIGRATED_VALIDATED
F03_CENSUS_DENOMINATOR=34
F03_MIGRATED_VALIDATED=32
F03_PRESENT_NOT_VALIDATED=0
F03_MISSING=0
F03_OBSOLETE_CONFIRMED_NOT_REQUIRED=2
ROLLUP_COUNTS_STATUS=RECONCILED_AFTER_CODEX_RECOUNT_32_2
CUTOVER=PASS
NEW_ROLE=LIVE
OLD_ROLE=ROLLBACK_STANDBY_FROZEN
ROLLBACK_RETENTION=ENTERED
ROLLBACK_RETENTION_AUTO_EXPIRY=NONE
```

Canonical evidence:
- `reports/architecture/v4_vps_post_cutover_evidence_reconciliation_a01_f03_v1.md`
- `reports/architecture/v4_vps_parallel_old_new_validation_f03_f04_f05_v1.md`
- `reports/architecture/v4_vps_active_nginx_tls_renewal_qualification_v1.md`
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
- `reports/architecture/v4_vps_goi_f01_f02_readonly_evidence_v1.md`
- `reports/architecture/v4_vps_codex_independent_evidence_audit_v1.md`
- `reports/architecture/v4_vps_goi_graphhopper_activation_v1.md`
- `reports/architecture/v4_vps_new_tls_recovery_v1.md`

F03 census is reconciled; GOI rows and Tailscale identity are `MIGRATED_VALIDATED`. OpenClaw remains intentionally staged under its qualified `KEEP_STAGED_PENDING` role. Historical volumes are classified obsolete-confirmed but retained.

Current next: HUMAN CUTOVER GATE — final OLD write freeze, proven DB/state sync, fresh publication map, authorized NEW publication/routing, rollback retention.

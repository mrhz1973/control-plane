# Project VPS registry

Current projection after GOI cold-start boot persistence PASS. GOI stack active/enabled; TLS renewal row pending; schema-engine MIGRATED_VALIDATED; F03 rollup frozen.

| Project / component | OLD footprint | NEW state | Shared dependencies | Migration status | Evidence / next |
|---|---|---|---|---|---|
| Control Plane core — PostgreSQL | Docker PostgreSQL 16.15 | healthy, unpublished | Docker/common boot | MIGRATED_VALIDATED | #68 prep-copy report |
| Control Plane core — n8n | loopback `127.0.0.1:5678`, production OLD | isolated replica, health 200, capable/published 0/0 | cutover / workflow publication | MIGRATED_VALIDATED | activation later |
| Control Plane core — LiteLLM | unpublished Docker service | running unpublished | secret-safe auth binds | MIGRATED_VALIDATED | #68 |
| Hermes/browser | Hermes 0.21 + Chromium/CDP/Xvfb/x11vnc/noVNC; OLD process-level, NEW `hermes-*.service` | qualified; auth persistence, recall, short soak, post-soak PASS | loopback-only browser ports | MIGRATED_VALIDATED | #67 |
| GOI GraphHopper | OLD live TS app + loopback admin | runtime active enabled; app `100.99.54.93:8989`, admin `127.0.0.1:8990`; canonical hiking `/route` 200; cold-start PASS | Tailscale IP | MIGRATED_VALIDATED | F03 rollup frozen |
| GOI ORS gateway | OLD live loopback `127.0.0.1:8020`; tree `/opt/goi-ors-gateway` | runtime active enabled; loopback `127.0.0.1:8020`; CORS GIS origin `http://100.99.54.93:8000`; status 200 ready/PRESENT; cold-start PASS | nginx/TLS/Tailscale | MIGRATED_VALIDATED | F03 rollup frozen |
| GOI GIS / cursor-coordinate-converter | OLD TS `:8000`; WD `/root/local-files/handoff-runtime/cursor-coordinate-converter` | runtime active enabled; bind `100.99.54.93:8000`; F02 HTML served; browser Origin PASS vs GH/ORS/D-Flight; cold-start PASS | Tailscale IP, local-files, GraphHopper/ORS/D-Flight | MIGRATED_VALIDATED | F03 rollup frozen |
| GOI Navionics / Planet-Clone | OLD TS `:5000`; WD `/root/local-files/handoff-runtime/Planet-Clone` | runtime active enabled; bind `100.99.54.93:5000`; GET `/status` 200 `tokens_ok=true`; cold-start PASS | Tailscale IP, local-files | MIGRATED_VALIDATED | F03 rollup frozen |
| GOI D-Flight | OLD TS `:8010`; `/opt/goi-dflight-helper` + `/var/lib/goi-dflight` | runtime active enabled; bind `100.99.54.93:8010`; GET `/status` READY LKG 841 features; NEW Origin CORS PASS; cold-start PASS | Tailscale, GIS client | MIGRATED_VALIDATED | F03 rollup frozen |
| GOI TLS renewal | OLD timer live; cert files `/etc/goi-ors/tls`; oneshot observed failed on OLD | NEW cert SAN qualified; helper handles inactive nginx; NEW timer inactive | NEW MagicDNS/TLS identity | PRESENT_NOT_VALIDATED | active-nginx renewal/persistence proof later; OLD health checked in parallel validation |
| nginx GOI vhost | OLD live TS `:443` + public default `:80` | runtime active enabled; bind `100.99.54.93:443` ssl only; HTTPS `/ors/status` 200 ready/PRESENT; no public `:80`/`:443`; cold-start PASS | Tailscale/TLS/ORS | MIGRATED_VALIDATED | F03 rollup frozen |
| Control Plane checkout bind | `/root/local-files/handoff-runtime/control-plane` mounted read-only into n8n; LiteLLM config from this tree | present on NEW; same bind shape | n8n, LiteLLM, local-files | MIGRATED_VALIDATED | keep unpublished |
| `/srv/cp-verifier-inbox` | n8n bind; owner `cpinbox` | present on NEW; same bind | n8n | MIGRATED_VALIDATED | empty inbox; no extra daemon |
| `/root/local-files` | n8n `/files` bind; contains handoff-runtime | present on NEW | n8n, LiteLLM, GOI GIS/Nav | MIGRATED_VALIDATED | umbrella persistent application root |
| dev-method | tree `/root/local-files/handoff-runtime/dev-method` | copied/validated | local-files | MIGRATED_VALIDATED | reference-only |
| schema-engine | tree `/root/local-files/handoff-runtime/schema-engine` | isolated Ajv 8.20.0 + ajv-formats 3.0.1; validator valid PASS / invalid FAIL_CLOSED; bind `/files` persistent | n8n/control-plane only | MIGRATED_VALIDATED | non-network; F03 rollup frozen |
| OpenClaw app/node | preserved fallback trees | copied/staged, inactive | future fallback transport only | PRESENT_NOT_VALIDATED | `KEEP_STAGED_PENDING`; final disposition later |
| `n8n-compose.service` | enabled OLD boot persistence | installed/enabled for isolated NEW stack | n8n core | MIGRATED_VALIDATED | reboot-level persistence not yet used as full-parity acceptance |
| GOI service users | OLD live service accounts | NEW nologin accounts present | shared Linux identity | MIGRATED_VALIDATED | no further identity mutation required |
| Tailscale node identity | OLD `ubuntu` / `100.114.7.53` | unique `ionos-n8n-new` / `100.99.54.93`; exact NEW MagicDNS proven; no routes/exit-node/Serve/Funnel | all TS-bound GOI services | PRESENT_NOT_VALIDATED | identity/static PASS; component reachability/restart persistence pending |
| historical OLD Docker volumes | OLD leftovers `root_n8n_postgres_data`, `_retry006`, `_seqresync_prod`; OLD `_quarantine` under local-files | not copied | none unless proven needed | OBSOLETE_NEEDS_HUMAN_DECISION | decide before decommission |

## Latest proof

```text
NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION=PASS
GOI_GRAPHHOPPER_FUNCTIONAL_QUALIFICATION=PASS
GOI_GRAPHHOPPER_BOOT_PERSISTENCE=PENDING
VPS_CONSUMER_REGISTRY_COVERAGE=PASS
F01_NGINX_VHOST=EFFECTIVELY_INCLUDED_SYNTAX_VALID
F01_NGINX_INCLUDE_REMEDIATION=PASS
NGINX_RUNTIME=ACTIVE_NOT_ENABLED
NGINX_FUNCTIONAL_QUALIFICATION=PASS
NGINX_BIND=100.99.54.93:443
NGINX_PUBLIC_EXPOSURE=NONE
GOI_HTTPS_ORS_CHAIN=PASS
GOI_NGINX_BOOT_PERSISTENCE=PENDING
GOI_DFLIGHT_PERMISSION_REMEDIATION=PASS
DFLIGHT_CONFIG_ACCESS=GOI_DFLIGHT_USER_READABLE
DFLIGHT_FUNCTIONAL_QUALIFICATION=PASS
DFLIGHT_RUNTIME=ACTIVE_NOT_ENABLED
DFLIGHT_BIND=100.99.54.93:8010
DFLIGHT_BOOT_PERSISTENCE=PENDING
F02_GIS_ENDPOINTS=NEW_IDENTITY_RETARGETED
F02_GIS_ENDPOINT_REMEDIATION=PASS
GOI_GIS_FUNCTIONAL_QUALIFICATION=PASS
GIS_RUNTIME=ACTIVE_NOT_ENABLED
GIS_BIND=100.99.54.93:8000
GIS_BOOT_PERSISTENCE=PENDING
GOI_NAV_FUNCTIONAL_QUALIFICATION=PASS
NAV_RUNTIME=ACTIVE_NOT_ENABLED
NAV_BIND=100.99.54.93:5000
NAV_BOOT_PERSISTENCE=PENDING
F01_F02_CONFIGURATION_GAPS=CLOSED
GOI_ORS_FUNCTIONAL_QUALIFICATION=PASS
GOI_ORS_RUNTIME=ACTIVE_NOT_ENABLED
GOI_ORS_BIND=127.0.0.1:8020
GOI_ORS_BOOT_PERSISTENCE=PENDING
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
ROLLUP_COUNTS_STATUS=UNRECONCILED_F03_DO_NOT_USE_FOR_FINAL_ACCEPTANCE
CUTOVER=NOT_AUTHORIZED
```

Canonical evidence:
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

GOI rows GraphHopper/ORS/GIS/Nav/D-Flight/nginx-vhost are `MIGRATED_VALIDATED` (functional + enabled + cold-start proof; canonical acceptance B). TLS renewal row remains `PRESENT_NOT_VALIDATED` until active-nginx renewal proof. Frozen F03 rollup unchanged.

Current next: active-nginx TLS renewal → parallel validation → human cutover.

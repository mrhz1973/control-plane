# Project VPS registry

Current projection after F01 nginx include remediation PASS. nginx remains inactive. F02 GIS OLD endpoints remain. GraphHopper functional PASS (boot persistence pending).

| Project / component | OLD footprint | NEW state | Shared dependencies | Migration status | Evidence / next |
|---|---|---|---|---|---|
| Control Plane core — PostgreSQL | Docker PostgreSQL 16.15 | healthy, unpublished | Docker/common boot | MIGRATED_VALIDATED | #68 prep-copy report |
| Control Plane core — n8n | loopback `127.0.0.1:5678`, production OLD | isolated replica, health 200, capable/published 0/0 | cutover / workflow publication | MIGRATED_VALIDATED | activation later |
| Control Plane core — LiteLLM | unpublished Docker service | running unpublished | secret-safe auth binds | MIGRATED_VALIDATED | #68 |
| Hermes/browser | Hermes 0.21 + Chromium/CDP/Xvfb/x11vnc/noVNC; OLD process-level, NEW `hermes-*.service` | qualified; auth persistence, recall, short soak, post-soak PASS | loopback-only browser ports | MIGRATED_VALIDATED | #67 |
| GOI GraphHopper | OLD live TS app + loopback admin | runtime active not enabled; app `100.99.54.93:8989`, admin `127.0.0.1:8990`; canonical hiking `/route` 200 | Tailscale IP | PRESENT_NOT_VALIDATED | functional PASS; restart-persistence pending |
| GOI ORS gateway | OLD live loopback `127.0.0.1:8020`; tree `/opt/goi-ors-gateway` | parity artifacts staged; `LoadCredential` wiring verified; unit disabled/inactive | nginx/TLS/Tailscale | PRESENT_NOT_VALIDATED | controlled loopback qualification after F01/F02 remediation sequence |
| GOI GIS / cursor-coordinate-converter | OLD TS `:8000`; WD `/root/local-files/handoff-runtime/cursor-coordinate-converter` | unit disabled/inactive; effective served HTML still targets OLD GraphHopper `100.114.7.53:8989`, OLD ORS MagicDNS, and adjacent OLD D-Flight override | Tailscale IP, local-files, GraphHopper/ORS/D-Flight | PRESENT_NOT_VALIDATED | **F02 remediation required before activation** |
| GOI Navionics / Planet-Clone | OLD TS `:5000`; WD `/root/local-files/handoff-runtime/Planet-Clone` | copied; dynamic TS bind + parity override loaded; disabled/inactive | Tailscale IP, local-files | PRESENT_NOT_VALIDATED | qualify on NEW TS IP after prerequisite remediation |
| GOI D-Flight | OLD TS `:8010`; `/opt/goi-dflight-helper` + `/var/lib/goi-dflight` | service config/state verified for NEW TS bind/origin; unit disabled/inactive; GIS client still has adjacent OLD D-Flight override | Tailscale, GIS client | PRESENT_NOT_VALIDATED | client retarget + controlled runtime/private reachability qualification |
| GOI TLS renewal | OLD timer live; cert files `/etc/goi-ors/tls`; oneshot observed failed on OLD | NEW cert SAN qualified; helper handles inactive nginx; NEW timer inactive | NEW MagicDNS/TLS identity | PRESENT_NOT_VALIDATED | active-nginx renewal/persistence proof later; OLD health checked in parallel validation |
| nginx GOI vhost | OLD live TS `:443` + public default `:80` | `sites-enabled/goi-ors-gateway` symlink → `sites-available/goi-ors-gateway`; `nginx -t` PASS with vhost in effective graph; nginx disabled/inactive; no `:443` listener | Tailscale/TLS/ORS | PRESENT_NOT_VALIDATED | F01 include PASS; functional/activation pending; not `MIGRATED_VALIDATED` |
| Control Plane checkout bind | `/root/local-files/handoff-runtime/control-plane` mounted read-only into n8n; LiteLLM config from this tree | present on NEW; same bind shape | n8n, LiteLLM, local-files | MIGRATED_VALIDATED | keep unpublished |
| `/srv/cp-verifier-inbox` | n8n bind; owner `cpinbox` | present on NEW; same bind | n8n | MIGRATED_VALIDATED | empty inbox; no extra daemon |
| `/root/local-files` | n8n `/files` bind; contains handoff-runtime | present on NEW | n8n, LiteLLM, GOI GIS/Nav | MIGRATED_VALIDATED | umbrella persistent application root |
| dev-method | tree `/root/local-files/handoff-runtime/dev-method` | copied/validated | local-files | MIGRATED_VALIDATED | reference-only |
| schema-engine | tree `/root/local-files/handoff-runtime/schema-engine` | copied/manifests match; resolver smoke pending | n8n/control-plane only | PRESENT_NOT_VALIDATED | resolver smoke on NEW |
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
NGINX_RUNTIME=INACTIVE
NGINX_FUNCTIONAL_QUALIFICATION=PENDING
F02_GIS_ENDPOINTS=ACTIVE_OLD_ENDPOINT_FOUND
ROLLUP_COUNTS_STATUS=UNRECONCILED_F03_DO_NOT_USE_FOR_FINAL_ACCEPTANCE
CUTOVER=NOT_AUTHORIZED
```

Canonical evidence:
- `reports/architecture/v4_vps_goi_f01_nginx_include_remediation_v1.md`
- `reports/architecture/v4_vps_goi_f01_f02_readonly_evidence_v1.md`
- `reports/architecture/v4_vps_codex_independent_evidence_audit_v1.md`
- `reports/architecture/v4_vps_goi_graphhopper_activation_v1.md`
- `reports/architecture/v4_vps_new_tls_recovery_v1.md`

Registry rows remain `PRESENT_NOT_VALIDATED` until component-specific functional validation and required persistence proofs complete.

Current next: F01 nginx include remediation → F02 GIS effective OLD endpoint remediation → remaining GOI private qualification → schema-engine → persistence/parallel validation → human cutover.

# Project VPS registry

Current projection after read-only cross-project consumer mini-audit. GraphHopper functional PASS (boot persistence pending). Other GOI/nginx units remain inactive.

| Project / component | OLD footprint | NEW state | Shared dependencies | Migration status | Evidence / next |
|---|---|---|---|---|---|
| Control Plane core — PostgreSQL | Docker PostgreSQL 16.15 | healthy, unpublished | Docker/common boot | MIGRATED_VALIDATED | #68 prep-copy report |
| Control Plane core — n8n | loopback `127.0.0.1:5678`, production OLD | isolated replica, health 200, capable/published 0/0 | cutover / workflow publication | MIGRATED_VALIDATED | activation later |
| Control Plane core — LiteLLM | unpublished Docker service | running unpublished | secret-safe auth binds | MIGRATED_VALIDATED | #68 |
| Hermes/browser | Hermes 0.21 + Chromium/CDP/Xvfb/x11vnc/noVNC; OLD is process-level (no hermes systemd); NEW uses `hermes-*.service` | qualified; auth persistence, recall, short soak, post-soak PASS | loopback-only browser ports | MIGRATED_VALIDATED | #67 |
| GOI GraphHopper | OLD live TS app + loopback admin | runtime active not enabled; app `100.99.54.93:8989`, admin `127.0.0.1:8990`; canonical hiking `/route` 200 | Tailscale IP | PRESENT_NOT_VALIDATED | functional qualification PASS; restart-persistence pending; not `MIGRATED_VALIDATED` |
| GOI ORS gateway | OLD live loopback `127.0.0.1:8020`; tree `/opt/goi-ors-gateway` | parity artifacts staged; systemd `LoadCredential` wiring verified; unit disabled/inactive | nginx/TLS/Tailscale | PRESENT_NOT_VALIDATED | controlled loopback runtime qualification |
| GOI GIS / cursor-coordinate-converter | OLD TS `:8000`; WD `/root/local-files/handoff-runtime/cursor-coordinate-converter` | copied; dynamic TS bind unit; disabled/inactive | Tailscale IP, local-files | PRESENT_NOT_VALIDATED | qualify on NEW TS IP |
| GOI Navionics / Planet-Clone | OLD TS `:5000`; WD `/root/local-files/handoff-runtime/Planet-Clone` | copied; dynamic TS bind + parity override loaded; disabled/inactive | Tailscale IP, local-files | PRESENT_NOT_VALIDATED | qualify on NEW TS IP |
| GOI D-Flight | OLD TS `:8010`; `/opt/goi-dflight-helper` + `/var/lib/goi-dflight` | state/ownership validated; config verified on NEW `100.99.54.93` bind/origin; unit disabled/inactive | Tailscale | PRESENT_NOT_VALIDATED | controlled runtime/private reachability qualification |
| GOI TLS renewal | OLD timer live; cert files `/etc/goi-ors/tls`; oneshot currently `failed` on OLD | NEW cert SAN qualified; helper handles inactive nginx; timer still inactive | NEW MagicDNS/TLS identity | PRESENT_NOT_VALIDATED | initial TLS qualification PASS; active-nginx renewal/persistence proof remains later |
| nginx GOI vhost | OLD live TS `:443` + public default `:80` | rendered to `100.99.54.93:443` + `ionos-n8n-new.tailc01234.ts.net`; `nginx -t` PASS; nginx disabled/inactive; NEW `sites-enabled` empty while inactive | Tailscale/TLS | PRESENT_NOT_VALIDATED | controlled activation after component runtime prerequisites |
| Control Plane checkout bind | `/root/local-files/handoff-runtime/control-plane` mounted read-only into n8n; LiteLLM config from this tree | present on NEW; same bind shape | n8n, LiteLLM, local-files | MIGRATED_VALIDATED | keep unpublished; not a separate network service |
| `/srv/cp-verifier-inbox` | n8n bind; owner `cpinbox` | present on NEW; same bind | n8n | MIGRATED_VALIDATED | empty inbox; no extra daemon |
| `/root/local-files` | n8n `/files` bind; contains handoff-runtime (GIS/Nav/schema/dev-method/control-plane) | present on NEW | n8n, LiteLLM, GOI GIS/Nav | MIGRATED_VALIDATED | umbrella persistent application root |
| dev-method | tree `/root/local-files/handoff-runtime/dev-method` | copied/validated | local-files | MIGRATED_VALIDATED | no Tailscale dependency |
| schema-engine | tree `/root/local-files/handoff-runtime/schema-engine` | copied/manifests match; resolver smoke pending | n8n/control-plane only | PRESENT_NOT_VALIDATED | resolver smoke on NEW |
| OpenClaw app/node | preserved fallback trees | copied/staged, inactive | future fallback transport only | PRESENT_NOT_VALIDATED | `KEEP_STAGED_PENDING`; final disposition later |
| `n8n-compose.service` | enabled OLD boot persistence | installed/enabled for isolated NEW stack | n8n core | MIGRATED_VALIDATED | #68 |
| GOI service users | OLD live service accounts | NEW nologin accounts present | shared Linux identity | MIGRATED_VALIDATED | no further identity mutation required now |
| Tailscale node identity | OLD `ubuntu` / `100.114.7.53` | unique `ionos-n8n-new` / `100.99.54.93`; exact NEW MagicDNS proven; no routes/exit-node/Serve/Funnel | all TS-bound GOI services | PRESENT_NOT_VALIDATED | identity/static PASS; private component reachability/restart persistence pending |
| historical OLD Docker volumes | OLD leftovers `root_n8n_postgres_data`, `_retry006`, `_seqresync_prod`; also OLD `_quarantine` under local-files | not copied | none unless proven needed | OBSOLETE_NEEDS_HUMAN_DECISION | decide before decommission |

## Latest qualified shared prerequisite

```text
NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION=PASS
NEW_TLS_SAN=ionos-n8n-new.tailc01234.ts.net
OLD_TLS_SAN_PRESENT=NO
CERT_KEY_MATCH=PASS
NGINX_SYNTAX=PASS
GOI_GRAPHHOPPER_FUNCTIONAL_QUALIFICATION=PASS
GOI_GRAPHHOPPER_BOOT_PERSISTENCE=PENDING
GOI_SERVICES=GRAPHHOPPER_RUNTIME_ACTIVE_NOT_ENABLED
VPS_CONSUMER_REGISTRY_COVERAGE=PASS
CUTOVER=NOT_AUTHORIZED
```

Canonical GraphHopper evidence: `reports/architecture/v4_vps_goi_graphhopper_activation_v1.md`. TLS evidence: `reports/architecture/v4_vps_new_tls_recovery_v1.md`. Consumer mini-audit: `reports/architecture/v4_vps_cross_project_consumer_mini_audit_v1.md`.

Registry rows remain `PRESENT_NOT_VALIDATED` until their component-specific functional and required persistence proofs complete.

Current next: remaining GOI private slices → schema-engine qualification → restart-persistence/parallel OLD↔NEW validation → human cutover.

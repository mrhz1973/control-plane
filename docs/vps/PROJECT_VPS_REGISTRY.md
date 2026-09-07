# Project VPS registry

Current projection after prep-copy PASS, bounded project handoff ingestion, successful NEW Tailscale join/post-join verification, live GOI OLD↔NEW parity reconciliation, NEW-only GOI parity/config render PASS, and post-render pre-activation verification PASS.

| Project / component | OLD footprint | NEW state | Shared dependencies | Migration status | Evidence / next |
|---|---|---|---|---|---|
| Control Plane core — PostgreSQL | Docker PostgreSQL 16.15 | healthy, unpublished | Docker/common boot | MIGRATED_VALIDATED | #68 prep-copy report |
| Control Plane core — n8n | loopback `127.0.0.1:5678`, production OLD | isolated replica, health 200, capable/published 0/0 | cutover / workflow publication | MIGRATED_VALIDATED | activation later |
| Control Plane core — LiteLLM | unpublished Docker service | running unpublished | secret-safe auth binds | MIGRATED_VALIDATED | #68 |
| Hermes/browser | Hermes 0.21 + Chromium/CDP/Xvfb/x11vnc/noVNC | qualified; auth persistence, recall, short soak, post-soak PASS | loopback-only browser ports | MIGRATED_VALIDATED | #67 |
| GOI GraphHopper | OLD live TS app + loopback admin | tree/JDK/cache copied; NEW-specific generated config rendered and verified: app `100.99.54.93:8989`, admin `127.0.0.1:8990`; unit disabled/inactive | Tailscale IP, activation | PRESENT_NOT_VALIDATED | controlled runtime qualification after NEW TLS |
| GOI ORS gateway | OLD live loopback runtime | parity artifacts staged; systemd `LoadCredential` wiring verified; unit disabled/inactive | nginx/TLS/Tailscale | PRESENT_NOT_VALIDATED | controlled loopback runtime qualification after NEW TLS |
| GOI GIS | OLD TS `:8000` | copied; dynamic TS bind unit; disabled/inactive | Tailscale IP | PRESENT_NOT_VALIDATED | qualify on NEW TS IP |
| GOI Navionics / Planet-Clone | OLD TS `:5000` | copied; dynamic TS bind + parity override loaded; disabled/inactive | Tailscale IP | PRESENT_NOT_VALIDATED | qualify on NEW TS IP |
| GOI D-Flight | OLD TS `:8010` with persistent LKG/state | state/ownership validated; config verified on NEW `100.99.54.93` bind/origin; unit disabled/inactive | Tailscale | PRESENT_NOT_VALIDATED | controlled runtime/private reachability qualification |
| GOI TLS renewal | OLD MagicDNS cert/helper/timer | helper explicitly targets NEW MagicDNS; service static/inactive, timer disabled/inactive; staged cert still OLD identity | NEW MagicDNS/TLS identity | PRESENT_NOT_VALIDATED | issue/qualify NEW Tailscale cert now |
| nginx GOI vhost | OLD live TS `:443` | rendered to `100.99.54.93:443` + `ionos-n8n-new.tailc01234.ts.net`; readiness drop-in loaded; `nginx -t` PASS; nginx disabled/inactive | Tailscale/TLS | PRESENT_NOT_VALIDATED | NEW TLS issuance, then controlled activation |
| dev-method | tree-only method/reference handoff | copied/validated | none | MIGRATED_VALIDATED | no Tailscale dependency |
| schema-engine | isolated Ajv dependency | copied/manifests match; resolver smoke pending | n8n/control-plane only | PRESENT_NOT_VALIDATED | resolver smoke on NEW |
| OpenClaw app/node | preserved fallback trees | copied/staged, inactive | future fallback transport only | PRESENT_NOT_VALIDATED | `KEEP_STAGED_PENDING`; final disposition later |
| `n8n-compose.service` | enabled OLD boot persistence | installed/enabled for isolated NEW stack | n8n core | MIGRATED_VALIDATED | #68 |
| GOI service users | OLD live service accounts | NEW nologin accounts present | shared Linux identity | MIGRATED_VALIDATED | no further identity mutation required now |
| Tailscale node identity | OLD `ubuntu` / `100.114.7.53` | unique `ionos-n8n-new` / `100.99.54.93`; exact NEW MagicDNS proven; no routes/exit-node/Serve/Funnel | all TS-bound GOI services | PRESENT_NOT_VALIDATED | identity/static PASS; component private reachability/restart persistence pending |
| historical OLD Docker volumes | OLD-only leftovers | not copied | none unless proven needed | OBSOLETE_NEEDS_HUMAN_DECISION | decide before decommission |

## GOI latest pre-activation result

```text
GOI_NEW_PARITY_COPY_CONFIG_RENDER=PASS
GOI_POST_RENDER_PREACTIVATION_VERIFY=PASS
GOI_PARITY_FILES_AND_STATE=STAGED_VALIDATED
GOI_NEW_IDENTITY_CONFIG=RENDERED_VALIDATED
GOI_ACTIVE_OLD_IDENTITY_REFS=NONE
NGINX_SYNTAX=PASS
GOI_SERVICES=NOT_ACTIVATED
NEW_TLS_IDENTITY=NOT_YET_ISSUED
```

Canonical evidence: `reports/architecture/vps_goi_post_render_preactivation_verify_2026-09-07.md`.

All checked active NEW GOI configuration targets the NEW Tailscale identity. Systemd/drop-in wiring, D-Flight state/permissions, GraphHopper generated bind, readiness helper and nginx syntax have passed pre-activation verification. The only expected identity mismatch now is the staged TLS certificate, which still belongs to OLD and must be replaced with a NEW Tailscale certificate before nginx activation.

## Registry rule

A row moves to `MIGRATED_VALIDATED` only after component-specific functional validation and any required restart-persistence proof. Staged/configured/preflight state alone remains `PRESENT_NOT_VALIDATED`.

Current next: NEW Tailscale TLS issuance/qualification → controlled GOI runtime qualification → remaining component validation → parallel OLD↔NEW → human cutover.

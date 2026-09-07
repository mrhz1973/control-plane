# Project VPS registry

Current projection after prep-copy PASS, bounded project handoff ingestion, successful NEW Tailscale join/post-join verification, live GOI OLD↔NEW parity reconciliation, and NEW-only GOI parity/config render PASS.

| Project / component | OLD footprint | NEW state | Shared dependencies | Migration status | Evidence / next |
|---|---|---|---|---|---|
| Control Plane core — PostgreSQL | Docker PostgreSQL 16.15 | healthy, unpublished | Docker/common boot | MIGRATED_VALIDATED | #68 prep-copy report |
| Control Plane core — n8n | loopback `127.0.0.1:5678`, production OLD | isolated replica, health 200, capable/published 0/0 | cutover / workflow publication | MIGRATED_VALIDATED | activation later |
| Control Plane core — LiteLLM | unpublished Docker service | running unpublished | secret-safe auth binds | MIGRATED_VALIDATED | #68 |
| Hermes/browser | Hermes 0.21 + Chromium/CDP/Xvfb/x11vnc/noVNC | qualified; auth persistence, recall, short soak, post-soak PASS | loopback-only browser ports | MIGRATED_VALIDATED | #67 |
| GOI GraphHopper | OLD live TS app + loopback admin | tree/JDK/cache copied; NEW-specific generated config rendered: app `100.99.54.93:8989`, admin `127.0.0.1:8990`; unit still disabled/inactive | Tailscale IP, activation | PRESENT_NOT_VALIDATED | post-render pre-activation checks, then controlled runtime qualification |
| GOI ORS gateway | OLD live loopback runtime | required parity artifacts staged; unit disabled/inactive | nginx/TLS/Tailscale | PRESENT_NOT_VALIDATED | validate systemd wiring and loopback runtime during controlled qualification |
| GOI GIS | OLD TS `:8000` | copied; dynamic TS bind unit; disabled/inactive | Tailscale IP | PRESENT_NOT_VALIDATED | qualify on NEW TS IP |
| GOI Navionics / Planet-Clone | OLD TS `:5000` | copied; dynamic TS bind + parity override staged; disabled/inactive | Tailscale IP | PRESENT_NOT_VALIDATED | qualify on NEW TS IP |
| GOI D-Flight | OLD TS `:8010` with persistent LKG/state | parity state staged; config rendered to NEW `100.99.54.93` bind/origin; unit disabled/inactive | Tailscale | PRESENT_NOT_VALIDATED | validate runtime and private reachability |
| GOI TLS renewal | OLD MagicDNS cert/helper/timer | helper rendered to explicit NEW MagicDNS; timer/service not activated; NEW cert not yet issued | NEW MagicDNS/TLS identity | PRESENT_NOT_VALIDATED | issue/qualify NEW Tailscale cert and renewal semantics |
| nginx GOI vhost | OLD live TS `:443` | vhost rendered to `100.99.54.93:443` + `ionos-n8n-new.tailc01234.ts.net`; readiness drop-in staged; nginx disabled/inactive | Tailscale/TLS | PRESENT_NOT_VALIDATED | `nginx -t`, TLS qualification, then controlled activation |
| dev-method | tree-only method/reference handoff | copied/validated | none | MIGRATED_VALIDATED | no Tailscale dependency |
| schema-engine | isolated Ajv dependency | copied/manifests match; resolver smoke pending | n8n/control-plane only | PRESENT_NOT_VALIDATED | resolver smoke on NEW |
| OpenClaw app/node | preserved fallback trees | copied/staged, inactive | future fallback transport only | PRESENT_NOT_VALIDATED | `KEEP_STAGED_PENDING`; final disposition later |
| `n8n-compose.service` | enabled OLD boot persistence | installed/enabled for isolated NEW stack | n8n core | MIGRATED_VALIDATED | #68 |
| GOI service users | OLD live service accounts | NEW nologin accounts present | shared Linux identity | MIGRATED_VALIDATED | no further identity mutation required now |
| Tailscale node identity | OLD `ubuntu` / `100.114.7.53` | unique `ionos-n8n-new` / `100.99.54.93`; exact NEW MagicDNS proven; no routes/exit-node/Serve/Funnel | all TS-bound GOI services | PRESENT_NOT_VALIDATED | identity/static PASS; component private reachability/restart persistence pending |
| historical OLD Docker volumes | OLD-only leftovers | not copied | none unless proven needed | OBSOLETE_NEEDS_HUMAN_DECISION | decide before decommission |

## GOI latest parity/config result

```text
GOI_NEW_PARITY_COPY_CONFIG_RENDER=PASS
GOI_PARITY_FILES_AND_STATE=STAGED_VALIDATED
GOI_NEW_IDENTITY_CONFIG=RENDERED_VALIDATED
GOI_ACTIVE_OLD_IDENTITY_REFS=NONE
GOI_SERVICES=NOT_ACTIVATED
NEW_TLS_IDENTITY=NOT_YET_ISSUED
```

All active checked NEW GOI configuration now targets the NEW Tailscale identity. GraphHopper render was executed without starting the service and produced the intended NEW app bind while preserving loopback admin. All GOI/nginx units remain disabled/inactive and no GOI listener is open.

## Registry rule

A row moves to `MIGRATED_VALIDATED` only after component-specific functional validation and any required restart-persistence proof. Staged/configured state alone remains `PRESENT_NOT_VALIDATED`.

Current next: post-render pre-activation checks → NEW TLS issuance/renewal qualification → controlled GOI runtime qualification → remaining component validation → parallel OLD↔NEW → human cutover.

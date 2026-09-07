# Project VPS registry

Current projection after prep-copy PASS. Detailed evidence remains in #68 and `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`.

| Project / component | OLD footprint | NEW state | Shared dependencies | Migration status | Evidence / next |
|---|---|---|---|---|---|
| Control Plane core — PostgreSQL | Docker PostgreSQL 16.15 | healthy, unpublished | Docker/common boot | MIGRATED_VALIDATED | #68 prep-copy report |
| Control Plane core — n8n | loopback `127.0.0.1:5678`, production OLD | isolated replica, health 200, capable/published 0/0 | cutover / workflow publication | MIGRATED_VALIDATED | activation later |
| Control Plane core — LiteLLM | unpublished Docker service | running unpublished | secret-safe auth binds | MIGRATED_VALIDATED | #68 |
| Hermes/browser | Hermes 0.21 + Chromium/CDP/Xvfb/x11vnc/noVNC | qualified; auth persistence, recall, short soak, post-soak PASS | loopback-only browser ports | MIGRATED_VALIDATED | #67 |
| GOI GraphHopper | `/opt/goi-graphhopper`, JDK/cache, TS `:8989`, loopback `:8990` | tree copied; unit disabled/inactive | Tailscale IP, activation | PRESENT_NOT_VALIDATED | specialist GOI handoff required |
| GOI ORS gateway | `/opt/goi-ors-gateway`, loopback `:8020` | copied; unit disabled/inactive | nginx/TLS/Tailscale | PRESENT_NOT_VALIDATED | specialist GOI handoff required |
| GOI GIS / cursor-coordinate-converter | handoff tree, TS `:8000` | tree copied; unit disabled | Tailscale IP | PRESENT_NOT_VALIDATED | specialist project handoff required |
| GOI Navionics / Planet-Clone | handoff tree + runtime, TS `:5000` | copied; unit disabled | Tailscale IP | PRESENT_NOT_VALIDATED | specialist project handoff required |
| GOI D-Flight | `/opt/goi-dflight-helper`, config, LoadCredential | copied secret-safe; unit disabled | Tailscale / component activation | PRESENT_NOT_VALIDATED | specialist GOI handoff required |
| GOI TLS renewal | OLD MagicDNS cert + renew timer | OLD material archived; timer disabled | NEW MagicDNS/TLS identity | PRESENT_NOT_VALIDATED | Control Plane shared infra + GOI input |
| nginx GOI vhost | OLD active on TS IP | nginx installed inactive; vhost staged only | Tailscale/TLS | PRESENT_NOT_VALIDATED | Control Plane owns activation |
| dev-method | handoff runtime tree | copied/manifests match | none known shared | PRESENT_NOT_VALIDATED | specialist confirmation |
| schema-engine | handoff runtime tree | copied/manifests match | none known shared | PRESENT_NOT_VALIDATED | specialist confirmation |
| OpenClaw app/node | `/opt/openclaw-app`, `/opt/openclaw-node`, no listener/unit | trees copied; not activated | decision only | PRESENT_NOT_VALIDATED | activate-or-archive decision |
| `n8n-compose.service` | enabled OLD boot persistence | installed/enabled for isolated NEW stack | n8n core | MIGRATED_VALIDATED | #68 |
| service users `graphhopper/goi-ors/goi-dflight` | OLD service accounts | NEW nologin accounts created name-based | shared Linux identity | MIGRATED_VALIDATED | #68 |
| Tailscale node identity | OLD `ubuntu.tailc01234.ts.net`, `100.114.7.53` | package present, NeedsLogin | all TS-bound GOI services | MISSING | unique NEW hostname + join |
| historical OLD Docker volumes | OLD-only leftovers | not copied | none unless proven needed | OBSOLETE_NEEDS_HUMAN_DECISION | decide before decommission |

## Registry rule

A project row moves to `MIGRATED_VALIDATED` only after component-specific validation and any required restart-persistence proof. Copying/staging alone is `PRESENT_NOT_VALIDATED`.

Specialist projects must return `PROJECT_VPS_HANDOFF` using `PROJECT_VPS_HANDOFF_STANDARD.md`; Control Plane ingests only that bounded handoff plus its evidence pointer.
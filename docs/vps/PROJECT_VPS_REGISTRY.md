# Project VPS registry

Current projection after prep-copy PASS. Detailed prep evidence remains in #68 and `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`.

GOI specialist handoff was ingested on 2026-09-07 at `reports/architecture/vps_goi_project_handoff_2026-09-07.md`. The handoff confirms the major GOI payloads are staged but does **not** promote them beyond `PRESENT_NOT_VALIDATED`; environment-specific Tailscale/MagicDNS/TLS/bind validation remains pending.

| Project / component | OLD footprint | NEW state | Shared dependencies | Migration status | Evidence / next |
|---|---|---|---|---|---|
| Control Plane core — PostgreSQL | Docker PostgreSQL 16.15 | healthy, unpublished | Docker/common boot | MIGRATED_VALIDATED | #68 prep-copy report |
| Control Plane core — n8n | loopback `127.0.0.1:5678`, production OLD | isolated replica, health 200, capable/published 0/0 | cutover / workflow publication | MIGRATED_VALIDATED | activation later |
| Control Plane core — LiteLLM | unpublished Docker service | running unpublished | secret-safe auth binds | MIGRATED_VALIDATED | #68 |
| Hermes/browser | Hermes 0.21 + Chromium/CDP/Xvfb/x11vnc/noVNC | qualified; auth persistence, recall, short soak, post-soak PASS | loopback-only browser ports | MIGRATED_VALIDATED | #67 |
| GOI GraphHopper | `/opt/goi-graphhopper`, JDK/cache, TS `:8989`, loopback `:8990` | tree copied; unit disabled/inactive | Tailscale IP, activation | PRESENT_NOT_VALIDATED | GOI handoff ingested; verify/adapt effective NEW TS bind before activation |
| GOI ORS gateway | `/opt/goi-ors-gateway`, loopback `:8020` | copied; unit disabled/inactive | nginx/TLS/Tailscale | PRESENT_NOT_VALIDATED | GOI handoff ingested; verify ORS credential path/drop-in on NEW, then qualify loopback runtime |
| GOI GIS / cursor-coordinate-converter | handoff tree, TS `:8000` | tree copied; unit disabled | Tailscale IP | PRESENT_NOT_VALIDATED | GOI handoff ingested; resolve OLD GraphHopper/ORS endpoint transition after NEW identity exists |
| GOI Navionics / Planet-Clone | handoff tree + runtime, TS `:5000` | copied; unit disabled | Tailscale IP | PRESENT_NOT_VALIDATED | GOI handoff ingested; verify systemd override/runtime parity, then qualify on NEW TS IP |
| GOI D-Flight | `/opt/goi-dflight-helper`, config, LoadCredential | copied secret-safe; unit disabled | Tailscale / component activation | PRESENT_NOT_VALIDATED | GOI handoff ingested; verify CSRF PEM/LKG state and replace OLD bind/origin identity before activation |
| GOI TLS renewal | OLD MagicDNS cert + renew timer | OLD material archived; timer disabled | NEW MagicDNS/TLS identity | PRESENT_NOT_VALIDATED | GOI handoff ingested; issue NEW identity cert and qualify renewal only after hostname/MagicDNS are final |
| nginx GOI vhost | OLD active on TS IP | nginx installed inactive; vhost staged only | Tailscale/TLS | PRESENT_NOT_VALIDATED | GOI handoff ingested; render/rebind with NEW TS IP + NEW MagicDNS before enablement |
| dev-method | handoff runtime tree | copied/manifests match | none known shared | PRESENT_NOT_VALIDATED | specialist confirmation |
| schema-engine | handoff runtime tree | copied/manifests match | none known shared | PRESENT_NOT_VALIDATED | specialist confirmation |
| OpenClaw app/node | `/opt/openclaw-app`, `/opt/openclaw-node`, no listener/unit | trees copied; not activated | decision only | PRESENT_NOT_VALIDATED | activate-or-archive decision |
| `n8n-compose.service` | enabled OLD boot persistence | installed/enabled for isolated NEW stack | n8n core | MIGRATED_VALIDATED | #68 |
| service users `graphhopper/goi-ors/goi-dflight` | OLD service accounts | NEW nologin accounts created name-based | shared Linux identity | MIGRATED_VALIDATED | #68; UID/GID collision state must still be read-only checked before further identity changes |
| Tailscale node identity | OLD `ubuntu.tailc01234.ts.net`, `100.114.7.53` | package present, NeedsLogin | all TS-bound GOI services | MISSING | unique NEW hostname + join; GOI bind/ACL requirements now ingested |
| historical OLD Docker volumes | OLD-only leftovers | not copied | none unless proven needed | OBSOLETE_NEEDS_HUMAN_DECISION | decide before decommission |

## GOI handoff constraints now ingested

- Tailscale-only GOI ports: `443,5000,8000,8010,8989`.
- Loopback-only GOI ports: `8020,8990`.
- No GOI activation may reuse OLD `100.114.7.53` or OLD MagicDNS identity silently.
- `goi-wait-tailscale-ip`, D-Flight config, GraphHopper bind, GOI nginx rendering and GIS endpoint references must be reconciled to the NEW identity before activation.
- Project-local presence checks still required on NEW include ORS credential/drop-in, ORS renewal helper, D-Flight CSRF public PEM/LKG state, Planet-Clone systemd override and nginx Tailscale-readiness drop-in. These are `UNKNOWN`, not classified `MISSING`, until read-only verification.

## Registry rule

A project row moves to `MIGRATED_VALIDATED` only after component-specific validation and any required restart-persistence proof. Copying/staging alone is `PRESENT_NOT_VALIDATED`.

Specialist projects must return `PROJECT_VPS_HANDOFF` using `PROJECT_VPS_HANDOFF_STANDARD.md`; Control Plane ingests only that bounded handoff plus its evidence pointer.

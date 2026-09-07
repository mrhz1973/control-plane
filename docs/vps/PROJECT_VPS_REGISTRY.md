# Project VPS registry

Current projection after prep-copy PASS and bounded project handoff ingestion. Detailed prep evidence remains in #68 and `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`.

Ingested specialist/project handoffs:
- GOI: `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- dev-method: `reports/architecture/vps_dev_method_handoff_2026-09-07.md`
- schema-engine: `reports/architecture/vps_schema_engine_handoff_2026-09-07.md`
- OpenClaw: `reports/architecture/vps_openclaw_handoff_2026-09-07.md`

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
| dev-method | tree-only method/reference handoff | OLD tree copied with matching manifest; no runtime/listener/boot role | none | MIGRATED_VALIDATED | `vps_dev_method_handoff_2026-09-07.md`; no Tailscale join dependency |
| schema-engine | isolated Ajv/ajv-formats dependency under handoff-runtime, consumed by n8n validator | tree copied/manifests match; NEW live resolver smoke not re-proven | n8n bind + control-plane validator only | PRESENT_NOT_VALIDATED | `vps_schema_engine_handoff_2026-09-07.md`; no Tailscale join dependency |
| OpenClaw app/node | `/opt/openclaw-app`, `/opt/openclaw-node`, no listener/unit in latest census | trees copied; not activated | future fallback transport only if separately authorized | PRESENT_NOT_VALIDATED | `vps_openclaw_handoff_2026-09-07.md`; disposition recommendation `KEEP_STAGED_PENDING`; no current join blocker |
| `n8n-compose.service` | enabled OLD boot persistence | installed/enabled for isolated NEW stack | n8n core | MIGRATED_VALIDATED | #68 |
| service users `graphhopper/goi-ors/goi-dflight` | OLD service accounts | NEW nologin accounts created name-based | shared Linux identity | MIGRATED_VALIDATED | #68; UID/GID collision state must still be read-only checked before further identity changes |
| Tailscale node identity | OLD `ubuntu.tailc01234.ts.net`, `100.114.7.53` | package present, NeedsLogin | all TS-bound GOI services | MISSING | all known pre-join project network requirements ingested; join with unique NEW hostname next |
| historical OLD Docker volumes | OLD-only leftovers | not copied | none unless proven needed | OBSOLETE_NEEDS_HUMAN_DECISION | decide before decommission |

## Pre-join reconciliation result

All currently known project families with VPS footprints have now supplied or received a bounded handoff sufficient to classify **pre-join shared-network dependencies**:

- GOI has real Tailscale/MagicDNS/nginx/TLS dependencies and its OLD-IP/domain references are recorded for post-join reconciliation.
- dev-method has no runtime/network role and is migrated/validated as a reference tree.
- schema-engine is a local n8n/control-plane dependency only; it remains unvalidated on NEW but does not depend on Tailscale/nginx/TLS/DNS.
- OpenClaw remains staged as preserved fallback/existing broker; current OLD/NEW staged footprint has no listener/unit, so no pre-join collision exists. Any future activation is a separate gate.

Therefore no unresolved specialist-project requirement prevents assigning a **unique NEW Tailscale identity**. This does not authorize GOI activation, TLS issuance, DNS/public routing, n8n publication or cutover.

## GOI handoff constraints now ingested

- Tailscale-only GOI ports: `443,5000,8000,8010,8989`.
- Loopback-only GOI ports: `8020,8990`.
- No GOI activation may reuse OLD `100.114.7.53` or OLD MagicDNS identity silently.
- `goi-wait-tailscale-ip`, D-Flight config, GraphHopper bind, GOI nginx rendering and GIS endpoint references must be reconciled to the NEW identity before activation.
- Project-local presence checks still required on NEW include ORS credential/drop-in, ORS renewal helper, D-Flight CSRF public PEM/LKG state, Planet-Clone systemd override and nginx Tailscale-readiness drop-in. These are `UNKNOWN`, not classified `MISSING`, until read-only verification.

## Registry rule

A project row moves to `MIGRATED_VALIDATED` only after component-specific validation and any required restart-persistence proof. Copying/staging alone is `PRESENT_NOT_VALIDATED`.

Specialist projects must return `PROJECT_VPS_HANDOFF` using `PROJECT_VPS_HANDOFF_STANDARD.md`; Control Plane ingests only that bounded handoff plus its evidence pointer.

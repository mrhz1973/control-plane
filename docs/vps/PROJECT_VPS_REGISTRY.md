# Project VPS registry

Current projection after prep-copy PASS, bounded project handoff ingestion, and successful NEW Tailscale join. Detailed prep evidence remains in #68 and `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`.

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
| GOI GraphHopper | `/opt/goi-graphhopper`, JDK/cache, TS `:8989`, loopback `:8990` | tree copied; unit disabled/inactive | Tailscale IP, activation | PRESENT_NOT_VALIDATED | reconcile effective bind from OLD `100.114.7.53` to NEW `100.99.54.93` after DNSName verify |
| GOI ORS gateway | `/opt/goi-ors-gateway`, loopback `:8020` | copied; unit disabled/inactive | nginx/TLS/Tailscale | PRESENT_NOT_VALIDATED | verify ORS credential path/drop-in on NEW, then qualify loopback runtime |
| GOI GIS / cursor-coordinate-converter | handoff tree, TS `:8000` | tree copied; unit disabled | Tailscale IP | PRESENT_NOT_VALIDATED | resolve OLD GraphHopper/ORS endpoint transition using NEW Tailscale identity |
| GOI Navionics / Planet-Clone | handoff tree + runtime, TS `:5000` | copied; unit disabled | Tailscale IP | PRESENT_NOT_VALIDATED | verify systemd override/runtime parity, then qualify on NEW TS IP |
| GOI D-Flight | `/opt/goi-dflight-helper`, config, LoadCredential | copied secret-safe; unit disabled | Tailscale / component activation | PRESENT_NOT_VALIDATED | verify CSRF PEM/LKG state and replace OLD bind/origin identity |
| GOI TLS renewal | OLD MagicDNS cert + renew timer | OLD material archived; timer disabled | NEW MagicDNS/TLS identity | PRESENT_NOT_VALIDATED | verify NEW DNSName, issue NEW identity cert, then qualify renewal |
| nginx GOI vhost | OLD active on TS IP | nginx installed inactive; vhost staged only | Tailscale/TLS | PRESENT_NOT_VALIDATED | render/rebind with NEW `100.99.54.93` + verified NEW MagicDNS before enablement |
| dev-method | tree-only method/reference handoff | OLD tree copied with matching manifest; no runtime/listener/boot role | none | MIGRATED_VALIDATED | no Tailscale dependency |
| schema-engine | isolated Ajv/ajv-formats dependency under handoff-runtime, consumed by n8n validator | tree copied/manifests match; NEW live resolver smoke not re-proven | n8n bind + control-plane validator only | PRESENT_NOT_VALIDATED | resolver smoke on NEW |
| OpenClaw app/node | `/opt/openclaw-app`, `/opt/openclaw-node`, no listener/unit in latest census | trees copied; not activated | future fallback transport only if separately authorized | PRESENT_NOT_VALIDATED | disposition `KEEP_STAGED_PENDING`; no current join blocker |
| `n8n-compose.service` | enabled OLD boot persistence | installed/enabled for isolated NEW stack | n8n core | MIGRATED_VALIDATED | #68 |
| service users `graphhopper/goi-ors/goi-dflight` | OLD service accounts | NEW nologin accounts created name-based | shared Linux identity | MIGRATED_VALIDATED | #68; UID/GID collision state still read-only check before further identity changes |
| Tailscale node identity | OLD `ubuntu.tailc01234.ts.net`, `100.114.7.53` | joined as unique `ionos-n8n-new`, TS IPv4 `100.99.54.93`; OS hostname remains `ubuntu` | all TS-bound GOI services | PRESENT_NOT_VALIDATED | join PASS; verify Self.DNSName/MagicDNS + ACL/routes + Serve/Funnel before promotion |
| historical OLD Docker volumes | OLD-only leftovers | not copied | none unless proven needed | OBSOLETE_NEEDS_HUMAN_DECISION | decide before decommission |

## Tailscale join result

The previous single `MISSING` row is now present:

```text
NEW_TAILSCALE_HOSTNAME=ionos-n8n-new
NEW_TAILSCALE_IP=100.99.54.93
OLD_TAILSCALE_HOSTNAME=ubuntu
OLD_TAILSCALE_IP=100.114.7.53
IDENTITY_COLLISION=NO
OS_HOSTNAME_NEW=ubuntu
```

The row remains `PRESENT_NOT_VALIDATED`, not `MIGRATED_VALIDATED`, until read-only confirmation of the NEW DNSName/MagicDNS and effective ACL/routes/Serve/Funnel state.

## GOI handoff constraints now actionable

- Tailscale-only GOI ports: `443,5000,8000,8010,8989`.
- Loopback-only GOI ports: `8020,8990`.
- No GOI activation may reuse OLD `100.114.7.53` or OLD MagicDNS identity.
- `goi-wait-tailscale-ip`, D-Flight config, GraphHopper bind, GOI nginx rendering and GIS endpoint references must now be reconciled against NEW `100.99.54.93` plus the verified NEW DNSName.
- Project-local presence checks still required on NEW include ORS credential/drop-in, ORS renewal helper, D-Flight CSRF public PEM/LKG state, Planet-Clone systemd override and nginx Tailscale-readiness drop-in. These remain `UNKNOWN`, not `MISSING`, until read-only verification.

## Registry rule

A project row moves to `MIGRATED_VALIDATED` only after component-specific validation and any required restart-persistence proof. Copying/staging or mere presence alone is `PRESENT_NOT_VALIDATED`.

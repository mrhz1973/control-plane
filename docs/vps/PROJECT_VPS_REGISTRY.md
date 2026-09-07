# Project VPS registry

Current projection after prep-copy PASS, bounded project handoff ingestion, successful NEW Tailscale join, and post-join read-only identity/network-state verification. Detailed prep evidence remains in #68 and `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`.

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
| GOI GraphHopper | `/opt/goi-graphhopper`, JDK/cache, TS `:8989`, loopback `:8990` | tree copied; unit disabled/inactive | Tailscale IP, activation | PRESENT_NOT_VALIDATED | reconcile effective bind from OLD `100.114.7.53` to NEW `100.99.54.93` |
| GOI ORS gateway | `/opt/goi-ors-gateway`, loopback `:8020` | copied; unit disabled/inactive | nginx/TLS/Tailscale | PRESENT_NOT_VALIDATED | verify ORS credential path/drop-in on NEW, then qualify loopback runtime |
| GOI GIS / cursor-coordinate-converter | handoff tree, TS `:8000` | tree copied; unit disabled | Tailscale IP | PRESENT_NOT_VALIDATED | resolve OLD GraphHopper/ORS endpoint transition using NEW `100.99.54.93` / `ionos-n8n-new.tailc01234.ts.net` |
| GOI Navionics / Planet-Clone | handoff tree + runtime, TS `:5000` | copied; unit disabled | Tailscale IP | PRESENT_NOT_VALIDATED | verify systemd override/runtime parity, then qualify on NEW TS IP |
| GOI D-Flight | `/opt/goi-dflight-helper`, config, LoadCredential | copied secret-safe; unit disabled | Tailscale / component activation | PRESENT_NOT_VALIDATED | verify CSRF PEM/LKG state and replace OLD bind/origin identity |
| GOI TLS renewal | OLD MagicDNS cert + renew timer | OLD material archived; timer disabled | NEW MagicDNS/TLS identity | PRESENT_NOT_VALIDATED | NEW DNSName verified; issue NEW cert for `ionos-n8n-new.tailc01234.ts.net`, then qualify renewal |
| nginx GOI vhost | OLD active on TS IP | nginx installed inactive; vhost staged only | Tailscale/TLS | PRESENT_NOT_VALIDATED | render/rebind with NEW `100.99.54.93` + `ionos-n8n-new.tailc01234.ts.net` before enablement |
| dev-method | tree-only method/reference handoff | OLD tree copied with matching manifest; no runtime/listener/boot role | none | MIGRATED_VALIDATED | no Tailscale dependency |
| schema-engine | isolated Ajv/ajv-formats dependency under handoff-runtime, consumed by n8n validator | tree copied/manifests match; NEW live resolver smoke not re-proven | n8n bind + control-plane validator only | PRESENT_NOT_VALIDATED | resolver smoke on NEW |
| OpenClaw app/node | `/opt/openclaw-app`, `/opt/openclaw-node`, no listener/unit in latest census | trees copied; not activated | future fallback transport only if separately authorized | PRESENT_NOT_VALIDATED | disposition `KEEP_STAGED_PENDING`; no current join blocker |
| `n8n-compose.service` | enabled OLD boot persistence | installed/enabled for isolated NEW stack | n8n core | MIGRATED_VALIDATED | #68 |
| service users `graphhopper/goi-ors/goi-dflight` | OLD service accounts | NEW nologin accounts created name-based | shared Linux identity | MIGRATED_VALIDATED | #68; UID/GID collision state still read-only check before further identity changes |
| Tailscale node identity | OLD `ubuntu.tailc01234.ts.net`, `100.114.7.53` | joined as unique `ionos-n8n-new`, TS IPv4 `100.99.54.93`, MagicDNS `ionos-n8n-new.tailc01234.ts.net`; no routes/exit-node/Serve/Funnel; OS hostname remains `ubuntu` | all TS-bound GOI services | PRESENT_NOT_VALIDATED | identity + static post-join config PASS; keep conservative until private reachability/restart persistence is proven during GOI/shared qualification |
| historical OLD Docker volumes | OLD-only leftovers | not copied | none unless proven needed | OBSOLETE_NEEDS_HUMAN_DECISION | decide before decommission |

## Tailscale post-join result

```text
OLD_TAILSCALE_HOSTNAME=ubuntu
OLD_TAILSCALE_IP=100.114.7.53
OLD_MAGICDNS=ubuntu.tailc01234.ts.net
NEW_TAILSCALE_HOSTNAME=ionos-n8n-new
NEW_TAILSCALE_IP=100.99.54.93
NEW_TAILSCALE_IPV6=fd7a:115c:a1e0::6a3a:365f
NEW_MAGICDNS=ionos-n8n-new.tailc01234.ts.net
NEW_PRIMARY_ROUTES=NONE
NEW_EXIT_NODE_OPTION=FALSE
NEW_SERVE_CONFIG=NONE
NEW_FUNNEL_CONFIG=NONE
IDENTITY_COLLISION=NO
OS_HOSTNAME_NEW=ubuntu
```

The Tailscale admin UI independently corroborated OLD and NEW simultaneously connected under distinct identities/IPs.

The row remains `PRESENT_NOT_VALIDATED`, not `MIGRATED_VALIDATED`, because component-level private reachability and restart persistence are still pending. The identity/join/DNSName/static-config portion itself is verified PASS.

## GOI handoff constraints now actionable

- Tailscale-only GOI ports: `443,5000,8000,8010,8989`.
- Loopback-only GOI ports: `8020,8990`.
- No GOI activation may reuse OLD `100.114.7.53` or OLD `ubuntu.tailc01234.ts.net`.
- `goi-wait-tailscale-ip`, D-Flight config, GraphHopper bind, GOI nginx rendering and GIS endpoint references must now be reconciled against NEW `100.99.54.93` and `ionos-n8n-new.tailc01234.ts.net`.
- Project-local presence checks still required on NEW include ORS credential/drop-in, ORS renewal helper, D-Flight CSRF public PEM/LKG state, Planet-Clone systemd override and nginx Tailscale-readiness drop-in. These remain `UNKNOWN`, not `MISSING`, until read-only verification.

## Registry rule

A project row moves to `MIGRATED_VALIDATED` only after component-specific validation and any required restart-persistence proof. Copying/staging or mere presence alone is `PRESENT_NOT_VALIDATED`.

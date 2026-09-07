# Project VPS registry

Current projection after prep-copy PASS, bounded project handoff ingestion, successful NEW Tailscale join/post-join verification, and live NEW GOI read-only reconciliation. Detailed evidence remains in #68 and the architecture reports referenced below.

Ingested specialist/project handoffs:
- GOI: `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- GOI NEW live probe: `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`
- dev-method: `reports/architecture/vps_dev_method_handoff_2026-09-07.md`
- schema-engine: `reports/architecture/vps_schema_engine_handoff_2026-09-07.md`
- OpenClaw: `reports/architecture/vps_openclaw_handoff_2026-09-07.md`

| Project / component | OLD footprint | NEW state | Shared dependencies | Migration status | Evidence / next |
|---|---|---|---|---|---|
| Control Plane core — PostgreSQL | Docker PostgreSQL 16.15 | healthy, unpublished | Docker/common boot | MIGRATED_VALIDATED | #68 prep-copy report |
| Control Plane core — n8n | loopback `127.0.0.1:5678`, production OLD | isolated replica, health 200, capable/published 0/0 | cutover / workflow publication | MIGRATED_VALIDATED | activation later |
| Control Plane core — LiteLLM | unpublished Docker service | running unpublished | secret-safe auth binds | MIGRATED_VALIDATED | #68 |
| Hermes/browser | Hermes 0.21 + Chromium/CDP/Xvfb/x11vnc/noVNC | qualified; auth persistence, recall, short soak, post-soak PASS | loopback-only browser ports | MIGRATED_VALIDATED | #67 |
| GOI GraphHopper | `/opt/goi-graphhopper`, JDK/cache, TS `:8989`, loopback `:8990` | tree copied; unit disabled/inactive; runtime config expected at `/run/goi-graphhopper/config.yml` | Tailscale IP, activation | PRESENT_NOT_VALIDATED | determine effective OLD bind/runtime-config generation, then render NEW identity |
| GOI ORS gateway | `/opt/goi-ors-gateway`, loopback `:8020` | copied; unit disabled/inactive; live NEW lacks `/etc/systemd/ors-credentials/ORS_API_KEY` and credential drop-in | nginx/TLS/Tailscale + project credential | PRESENT_NOT_VALIDATED | read-only OLD parity decides copy/reconstruct requirement; never expose credential value |
| GOI GIS / cursor-coordinate-converter | handoff tree, TS `:8000` | tree copied; unit disabled; effective unit dynamically binds `tailscale ip -4` | Tailscale IP | PRESENT_NOT_VALIDATED | dynamic bind already NEW-compatible; endpoint dependencies still require OLD→NEW reconciliation |
| GOI Navionics / Planet-Clone | handoff tree + runtime, TS `:5000` | copied; unit disabled; dynamically binds `tailscale ip -4`; expected override path absent on NEW | Tailscale IP | PRESENT_NOT_VALIDATED | OLD parity for override path, then qualify on NEW TS IP |
| GOI D-Flight | `/opt/goi-dflight-helper`, config, LoadCredential | copied secret-safe; unit disabled; CSRF public PEM present; `/var/lib/goi-dflight` absent; config still binds OLD `100.114.7.53` and OLD GIS origin | Tailscale / component activation | PRESENT_NOT_VALIDATED | confirm OLD state/LKG + D-Flight credential metadata, then render NEW bind/origin |
| GOI TLS renewal | OLD MagicDNS cert + renew timer | OLD material archived; renewal helper present; service static/inactive, timer disabled/inactive | NEW MagicDNS/TLS identity | PRESENT_NOT_VALIDATED | issue NEW cert for `ionos-n8n-new.tailc01234.ts.net`, then qualify helper/renewal semantics |
| nginx GOI vhost | OLD active on TS IP | nginx disabled/inactive; vhost staged and still references OLD `100.114.7.53` + `ubuntu.tailc01234.ts.net`; readiness drop-in absent on NEW | Tailscale/TLS | PRESENT_NOT_VALIDATED | OLD parity for drop-in, then render NEW `100.99.54.93` + NEW MagicDNS before enablement |
| dev-method | tree-only method/reference handoff | OLD tree copied with matching manifest; no runtime/listener/boot role | none | MIGRATED_VALIDATED | no Tailscale dependency |
| schema-engine | isolated Ajv/ajv-formats dependency under handoff-runtime, consumed by n8n validator | tree copied/manifests match; NEW live resolver smoke not re-proven | n8n bind + control-plane validator only | PRESENT_NOT_VALIDATED | resolver smoke on NEW |
| OpenClaw app/node | `/opt/openclaw-app`, `/opt/openclaw-node`, no listener/unit in latest census | trees copied; not activated | future fallback transport only if separately authorized | PRESENT_NOT_VALIDATED | disposition `KEEP_STAGED_PENDING`; no current join blocker |
| `n8n-compose.service` | enabled OLD boot persistence | installed/enabled for isolated NEW stack | n8n core | MIGRATED_VALIDATED | #68 |
| service users `graphhopper/goi-ors/goi-dflight` | OLD service accounts | NEW nologin accounts live-verified: graphhopper `970/970`, goi-dflight `971/971`, goi-ors `972/972` | shared Linux identity | MIGRATED_VALIDATED | numeric NEW values now captured; compare OLD only if mutation/parity dependency requires it |
| Tailscale node identity | OLD `ubuntu.tailc01234.ts.net`, `100.114.7.53` | joined as unique `ionos-n8n-new`, TS IPv4 `100.99.54.93`, MagicDNS `ionos-n8n-new.tailc01234.ts.net`; no routes/exit-node/Serve/Funnel; OS hostname remains `ubuntu` | all TS-bound GOI services | PRESENT_NOT_VALIDATED | identity + static post-join config PASS; private component reachability/restart persistence still pending |
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

## GOI NEW live reconciliation result

The following previous `UNKNOWN` items are now proven **absent on NEW**:

- `/etc/systemd/ors-credentials/ORS_API_KEY`
- `/etc/systemd/system/goi-ors-gateway.service.d/credential.conf`
- `/etc/systemd/system/goi-nav-proxy.service.d/override.conf`
- `/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf`
- `/var/lib/goi-dflight`

They are path-level absences and do not add component-level `MISSING` rows. OLD live parity must classify each one before any copy/reconstruction.

Present and live-verified on NEW:

- `/usr/local/sbin/goi-ors-renew-cert`
- `/etc/goi-dflight/csrf-public.pem`
- GOI service accounts and numeric uid/gid values above
- all GOI units remain disabled/inactive
- no GOI listeners on `443,5000,8000,8010,8020,8989,8990`

Confirmed stale identity references on NEW:

- D-Flight host/origin still OLD `100.114.7.53`
- `goi-wait-tailscale-ip` still expects OLD `100.114.7.53`
- GOI nginx vhost still binds OLD `100.114.7.53:443` and OLD MagicDNS

The D-Flight unit references credential files under `/etc/systemd/dflight-credentials/`; prep-copy reported them copied secret-safe, but explicit live metadata confirmation is still pending.

## Registry rule

A project row moves to `MIGRATED_VALIDATED` only after component-specific validation and any required restart-persistence proof. Copying/staging or mere presence alone is `PRESENT_NOT_VALIDATED`.

Current next: read-only OLD parity probe → classify NEW-absent paths → bounded NEW-specific GOI config delta → TLS → controlled GOI qualification.

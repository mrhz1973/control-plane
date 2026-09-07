# Project VPS registry

Current projection after prep-copy PASS, bounded project handoff ingestion, successful NEW Tailscale join/post-join verification, live NEW GOI reconciliation, and live OLD GOI parity probe. Detailed evidence remains in #68 and the architecture reports referenced below.

Ingested specialist/project handoffs/evidence:
- GOI: `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- GOI NEW live probe: `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`
- GOI OLD live parity: `reports/architecture/vps_goi_old_parity_probe_2026-09-07.md`
- dev-method: `reports/architecture/vps_dev_method_handoff_2026-09-07.md`
- schema-engine: `reports/architecture/vps_schema_engine_handoff_2026-09-07.md`
- OpenClaw: `reports/architecture/vps_openclaw_handoff_2026-09-07.md`

| Project / component | OLD footprint | NEW state | Shared dependencies | Migration status | Evidence / next |
|---|---|---|---|---|---|
| Control Plane core — PostgreSQL | Docker PostgreSQL 16.15 | healthy, unpublished | Docker/common boot | MIGRATED_VALIDATED | #68 prep-copy report |
| Control Plane core — n8n | loopback `127.0.0.1:5678`, production OLD | isolated replica, health 200, capable/published 0/0 | cutover / workflow publication | MIGRATED_VALIDATED | activation later |
| Control Plane core — LiteLLM | unpublished Docker service | running unpublished | secret-safe auth binds | MIGRATED_VALIDATED | #68 |
| Hermes/browser | Hermes 0.21 + Chromium/CDP/Xvfb/x11vnc/noVNC | qualified; auth persistence, recall, short soak, post-soak PASS | loopback-only browser ports | MIGRATED_VALIDATED | #67 |
| GOI GraphHopper | OLD live `100.114.7.53:8989`, admin `127.0.0.1:8990`; generated `/run/goi-graphhopper/config.yml` binds OLD TS IP | tree/JDK/cache copied; unit disabled/inactive; generated NEW-specific bind not yet rendered | Tailscale IP, activation | PRESENT_NOT_VALIDATED | reconstruct runtime bind for NEW `100.99.54.93`; no byte-copy of OLD generated runtime |
| GOI ORS gateway | OLD live `127.0.0.1:8020`; ORS secret + credential drop-in present and active | tree copied; unit disabled/inactive; secret and drop-in absent | nginx/TLS/Tailscale + project credential | PRESENT_NOT_VALIDATED | `COPY_REQUIRED_SECRET_SAFE` ORS key + `COPY_REQUIRED` drop-in; verify metadata/hash after copy |
| GOI GIS / cursor-coordinate-converter | OLD live `100.114.7.53:8000` | tree copied; unit disabled; unit dynamically binds `tailscale ip -4` | Tailscale IP | PRESENT_NOT_VALIDATED | primary bind is NEW-compatible dynamically; endpoint refs still reconcile before qualification |
| GOI Navionics / Planet-Clone | OLD live `100.114.7.53:5000`; override drop-in active | copied; unit disabled; base unit dynamic TS bind; OLD override absent on NEW | Tailscale IP | PRESENT_NOT_VALIDATED | bounded non-secret inspect of OLD override, then copy or reconstruct as appropriate |
| GOI D-Flight | OLD live `100.114.7.53:8010`; credentials + CSRF PEM + current/previous LKG state present | helper/config copied; unit disabled; credentials prep-copy claimed but live parity not rechecked; CSRF PEM owner mismatch; `/var/lib/goi-dflight` absent; config stale OLD bind/origin | Tailscale / component activation | PRESENT_NOT_VALIDATED | verify NEW credential hashes; copy LKG state; verify CSRF hash then fix ownership; render NEW bind/origin |
| GOI TLS renewal | OLD MagicDNS cert + renew timer/helper | OLD material archived; renewal helper present; service static/inactive, timer disabled/inactive | NEW MagicDNS/TLS identity | PRESENT_NOT_VALIDATED | inspect helper semantics; issue NEW cert for `ionos-n8n-new.tailc01234.ts.net`, then qualify renewal |
| nginx GOI vhost | OLD live `100.114.7.53:443`, server_name `ubuntu.tailc01234.ts.net`; readiness drop-in active | nginx disabled/inactive; staged vhost stale OLD identity; readiness drop-in absent | Tailscale/TLS | PRESENT_NOT_VALIDATED | copy readiness drop-in; render NEW `100.99.54.93` + NEW MagicDNS; validate before enablement |
| dev-method | tree-only method/reference handoff | OLD tree copied with matching manifest; no runtime/listener/boot role | none | MIGRATED_VALIDATED | no Tailscale dependency |
| schema-engine | isolated Ajv/ajv-formats dependency under handoff-runtime, consumed by n8n validator | tree copied/manifests match; NEW live resolver smoke not re-proven | n8n bind + control-plane validator only | PRESENT_NOT_VALIDATED | resolver smoke on NEW |
| OpenClaw app/node | `/opt/openclaw-app`, `/opt/openclaw-node`, no listener/unit in latest census | trees copied; not activated | future fallback transport only if separately authorized | PRESENT_NOT_VALIDATED | disposition `KEEP_STAGED_PENDING`; no current join blocker |
| `n8n-compose.service` | enabled OLD boot persistence | installed/enabled for isolated NEW stack | n8n core | MIGRATED_VALIDATED | #68 |
| service users `graphhopper/goi-ors/goi-dflight` | OLD live service accounts | NEW nologin accounts live-verified: graphhopper `970/970`, goi-dflight `971/971`, goi-ors `972/972` | shared Linux identity | MIGRATED_VALIDATED | no numeric-parity mutation unless component evidence requires it |
| Tailscale node identity | OLD `ubuntu.tailc01234.ts.net`, `100.114.7.53` | unique `ionos-n8n-new`, `100.99.54.93`, MagicDNS `ionos-n8n-new.tailc01234.ts.net`; no routes/exit-node/Serve/Funnel | all TS-bound GOI services | PRESENT_NOT_VALIDATED | identity/static PASS; private component reachability/restart persistence pending |
| historical OLD Docker volumes | OLD-only leftovers | not copied | none unless proven needed | OBSOLETE_NEEDS_HUMAN_DECISION | decide before decommission |

## GOI parity classification

The OLD live probe proved that every prior NEW-path absence was a real OLD live artifact, not an implicit obsolete artifact.

```text
COPY_REQUIRED_SECRET_SAFE=/etc/systemd/ors-credentials/ORS_API_KEY
COPY_REQUIRED=/etc/systemd/system/goi-ors-gateway.service.d/credential.conf,/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf
COPY_REQUIRED_STATE_SAFE=/var/lib/goi-dflight
VERIFY_NEW_PARITY_BEFORE_COPY=/etc/systemd/dflight-credentials/dflight_username,/etc/systemd/dflight-credentials/dflight_password
VERIFY_HASH_THEN_FIX_NEW_OWNERSHIP=/etc/goi-dflight/csrf-public.pem
INSPECT_NONSECRET_THEN_COPY_OR_RECONSTRUCT=/etc/systemd/system/goi-nav-proxy.service.d/override.conf
RECONSTRUCT_NEW_SPECIFIC=D-Flight bind/origin,goi-wait-tailscale-ip,nginx listen/server_name/TLS,GraphHopper generated bind,remaining OLD endpoint refs
```

OLD D-Flight state is not optional cache by assumption: `current`, `previous`, metadata and state files are present under the live service account and must be preserved before NEW qualification.

## Registry rule

A project row moves to `MIGRATED_VALIDATED` only after component-specific validation and any required restart-persistence proof. Copying/staging or mere presence alone is `PRESENT_NOT_VALIDATED`.

Current next: final read-only parity (Nav override + NEW D-Flight credential/PEM hashes + render/helper semantics) → bounded NEW-only parity/config delta → syntax/ownership checks → TLS → controlled GOI qualification.

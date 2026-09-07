# CURRENT VPS STATE

Updated after successful NEW Tailscale join, post-join identity/static-state verification, and live NEW GOI read-only identity/config reconciliation on 2026-09-07.

```text
VPS_STATE
OLD_HOST=ionos-n8n
OLD_IP=217.160.71.145
OLD_ROLE=LIVE
OLD_TAILSCALE_IP=100.114.7.53
OLD_TAILSCALE_NAME=ubuntu
OLD_MAGICDNS=ubuntu.tailc01234.ts.net

NEW_HOST=ionos-n8n-new
NEW_IP=31.70.139.73
NEW_ROLE=PREP
NEW_OS_HOSTNAME=ubuntu
NEW_TAILSCALE_HOSTNAME=ionos-n8n-new
NEW_TAILSCALE_IP=100.99.54.93
NEW_TAILSCALE_IPV6=fd7a:115c:a1e0::6a3a:365f
NEW_TAILSCALE_JOIN=PASS
NEW_MAGICDNS=ionos-n8n-new.tailc01234.ts.net
NEW_PRIMARY_ROUTES=NONE
NEW_EXIT_NODE_OPTION=FALSE
NEW_SERVE_CONFIG=NONE
NEW_FUNNEL_CONFIG=NONE
TAILSCALE_POST_JOIN_VERIFY=PASS

MIGRATED_VALIDATED=15
PRESENT_NOT_VALIDATED=14
MISSING=0
PROJECT_DECISIONS_PENDING=1

GOI_HANDOFF=INGESTED_AS_IS_INCOMPLETE
GOI_NEW_READONLY_RECONCILIATION=PASS_WITH_BLOCKERS
GOI_NEW_CONFIRMED_ABSENT_PATHS=5
DEV_METHOD_HANDOFF=INGESTED_MIGRATED_VALIDATED
SCHEMA_ENGINE_HANDOFF=INGESTED_PRESENT_NOT_VALIDATED_NON_NETWORK
OPENCLAW_HANDOFF=INGESTED_KEEP_STAGED_PENDING
CROSS_PROJECT_PREJOIN_RECONCILIATION=CLEARED
TAILSCALE_UNIQUE_IDENTITY_JOIN=PASS
TAILSCALE_DNSNAME_ROUTES_SERVE_VERIFY=PASS
SHARED_INFRA_GATES=GOI_OLD_PARITY_PROBE,GOI_NEW_CONFIG_DELTA,NEW_MAGICDNS_TLS,GOI_ACTIVATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=GOI_OLD_PARITY_PROBE_READ_ONLY
```

## Current proven state

OLD remains live production and unchanged.

NEW currently has:
- PostgreSQL 16.15 healthy, unpublished
- n8n 2.33.3 loopback-only, health 200, execution-capable/published `0/0`
- LiteLLM 1.98.0 running unpublished
- Hermes 0.21.0 + Chromium/CDP/Xvfb/x11vnc/noVNC qualified
- Hermes ChatGPT Web auth/session persistence, long-chat recall, 30-minute short soak and post-soak round-trip PASS
- GOI GraphHopper/ORS/D-Flight/GIS/Nav trees copied and staged with units disabled/inactive
- nginx installed but disabled/inactive; GOI vhost staged only
- OLD GOI TLS material archived on NEW but not valid as NEW serving identity
- OpenClaw trees copied and intentionally kept staged/inactive
- dev-method copied and classified as non-runtime reference tree
- schema-engine copied as an isolated n8n/control-plane dependency; NEW resolver smoke still pending
- `n8n-compose.service` present and validated for the isolated NEW stack
- Tailscale joined successfully as unique node `ionos-n8n-new` with IPv4 `100.99.54.93`
- exact NEW MagicDNS/DNSName verified as `ionos-n8n-new.tailc01234.ts.net`
- no advertised primary routes, no exit-node role, no Serve configuration, and no Funnel configuration
- all GOI/shared activation units remain disabled/inactive and no GOI listener is currently open on NEW

## Tailscale post-join evidence

Operator evidence from NEW:

```text
DNSName=ionos-n8n-new.tailc01234.ts.net.
HostName=ionos-n8n-new
TailscaleIPs=100.99.54.93,fd7a:115c:a1e0::6a3a:365f
PrimaryRoutes=
ExitNodeOption=False
No serve config
No serve config
```

The Tailscale admin UI screenshot independently corroborates both Linux nodes simultaneously connected with distinct identities/IPs:
- NEW `ionos-n8n-new` → `100.99.54.93`
- OLD `ubuntu` → `100.114.7.53`

Identity collision is therefore cleared. The Linux OS hostname remains `ubuntu`; no OS-hostname mutation was performed or authorized.

## NEW GOI read-only reconciliation

Canonical evidence: `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`.

Live NEW evidence confirms:

### Safe inactive state
- `goi-graphhopper.service`: disabled/inactive
- `goi-ors-gateway.service`: disabled/inactive
- `goi-dflight-helper.service`: disabled/inactive
- `goi-gis-app.service`: disabled/inactive
- `goi-nav-proxy.service`: disabled/inactive
- `goi-tailscale-ready.service`: disabled/inactive
- `goi-ors-cert-renew.service`: static/inactive
- `goi-ors-cert-renew.timer`: disabled/inactive
- `nginx.service`: disabled/inactive
- no listeners on `443,5000,8000,8010,8020,8989,8990`

### Present on NEW
- `/usr/local/sbin/goi-ors-renew-cert`
- `/etc/goi-dflight/csrf-public.pem`
- service accounts `graphhopper` uid/gid `970/970`, `goi-dflight` `971/971`, `goi-ors` `972/972`

### Confirmed absent on NEW
- `/etc/systemd/ors-credentials/ORS_API_KEY`
- `/etc/systemd/system/goi-ors-gateway.service.d/credential.conf`
- `/etc/systemd/system/goi-nav-proxy.service.d/override.conf`
- `/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf`
- `/var/lib/goi-dflight`

These five are no longer `UNKNOWN` on NEW. They are path-level absences, not new component-level `MISSING` rows; OLD live parity must determine whether each is required, obsolete/not-needed, or should be reconstructed/copied.

### Stale OLD identity still embedded on NEW
- D-Flight bind: `100.114.7.53:8010`
- D-Flight GIS origin allowlist: `http://100.114.7.53:8000`
- `goi-wait-tailscale-ip`: expects `100.114.7.53`
- nginx GOI vhost: `listen 100.114.7.53:443 ssl`
- nginx GOI vhost: `server_name ubuntu.tailc01234.ts.net`

GIS and Nav proxy units already derive the current Tailscale IP dynamically at runtime, so their primary bind command is not hard-coded to OLD.

D-Flight effective unit references credential paths `/etc/systemd/dflight-credentials/dflight_username` and `/etc/systemd/dflight-credentials/dflight_password`; prep-copy reported those credential files copied secret-safe, but live metadata parity still needs explicit confirmation in the next probe.

## Remaining hard blockers

1. Perform read-only OLD parity probe for the five NEW-absent paths, D-Flight credential metadata, and relevant OLD unit/drop-in state; never print credential values.
2. Classify each path as COPY_REQUIRED, RECONSTRUCT_NEW_SPECIFIC, NOT_REQUIRED/OBSOLETE, or already-equivalent.
3. Prepare/apply bounded NEW-only GOI config delta replacing OLD identity references with `100.99.54.93` / `ionos-n8n-new.tailc01234.ts.net` only after OLD parity is explicit.
4. Issue and qualify NEW TLS identity/renewal for `ionos-n8n-new.tailc01234.ts.net`.
5. Enable and qualify GOI services against the NEW Tailscale identity; prove component reachability and restart persistence.
6. Validate schema-engine resolver on NEW and remaining `PRESENT_NOT_VALIDATED` rows.
7. Parallel OLD↔NEW validation.
8. Human cutover gate.
9. Production n8n publication on NEW only in the later explicit cutover phase.
10. OpenClaw final activate-or-archive decision remains later; current safe disposition is staged/inactive.

Evidence anchors:
- #68
- `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`
- `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`
- `reports/architecture/vps_dev_method_handoff_2026-09-07.md`
- `reports/architecture/vps_schema_engine_handoff_2026-09-07.md`
- `reports/architecture/vps_openclaw_handoff_2026-09-07.md`
- #67 Hermes qualification comments

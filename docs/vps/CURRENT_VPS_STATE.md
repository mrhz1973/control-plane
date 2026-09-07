# CURRENT VPS STATE

Updated after successful NEW Tailscale join, post-join identity/static-state verification, live NEW GOI read-only reconciliation, and live OLD GOI parity probe on 2026-09-07.

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
GOI_OLD_PARITY_PROBE=PASS
GOI_NEW_CONFIRMED_ABSENT_PATHS=5
GOI_COPY_REQUIRED_SECRET_SAFE=ORS_API_KEY
GOI_COPY_REQUIRED=ORS_CREDENTIAL_DROPIN,NGINX_TAILSCALE_READY_DROPIN
GOI_COPY_REQUIRED_STATE_SAFE=DFLIGHT_LKG_STATE
GOI_VERIFY_NEW_PARITY=DFLIGHT_CREDENTIALS,DFLIGHT_CSRF_PEM
GOI_INSPECT_BEFORE_COPY=NAV_PROXY_OVERRIDE
DEV_METHOD_HANDOFF=INGESTED_MIGRATED_VALIDATED
SCHEMA_ENGINE_HANDOFF=INGESTED_PRESENT_NOT_VALIDATED_NON_NETWORK
OPENCLAW_HANDOFF=INGESTED_KEEP_STAGED_PENDING
CROSS_PROJECT_PREJOIN_RECONCILIATION=CLEARED
TAILSCALE_UNIQUE_IDENTITY_JOIN=PASS
TAILSCALE_DNSNAME_ROUTES_SERVE_VERIFY=PASS
SHARED_INFRA_GATES=GOI_FINAL_READONLY_PARITY,GOI_NEW_CONFIG_DELTA,NEW_MAGICDNS_TLS,GOI_ACTIVATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=GOI_FINAL_READONLY_PARITY
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

## Tailscale identity

```text
OLD=ubuntu / 100.114.7.53 / ubuntu.tailc01234.ts.net
NEW=ionos-n8n-new / 100.99.54.93 / ionos-n8n-new.tailc01234.ts.net
IDENTITY_COLLISION=NO
```

## NEW GOI read-only reconciliation

Canonical evidence: `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`.

Confirmed absent on NEW:
- `/etc/systemd/ors-credentials/ORS_API_KEY`
- `/etc/systemd/system/goi-ors-gateway.service.d/credential.conf`
- `/etc/systemd/system/goi-nav-proxy.service.d/override.conf`
- `/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf`
- `/var/lib/goi-dflight`

Confirmed stale OLD identity on NEW staged config:
- D-Flight bind/origin uses `100.114.7.53`
- readiness helper expects `100.114.7.53`
- nginx vhost binds `100.114.7.53:443` and names `ubuntu.tailc01234.ts.net`

## OLD GOI parity probe

Canonical evidence: `reports/architecture/vps_goi_old_parity_probe_2026-09-07.md`.

All five NEW-absent paths are present on OLD live. Classification:

### COPY_REQUIRED_SECRET_SAFE
- `/etc/systemd/ors-credentials/ORS_API_KEY`

### COPY_REQUIRED
- `/etc/systemd/system/goi-ors-gateway.service.d/credential.conf`
- `/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf`

### COPY_REQUIRED_STATE_SAFE
- `/var/lib/goi-dflight` current/previous LKG + metadata/state

### VERIFY_NEW_PARITY_BEFORE_COPY
- `/etc/systemd/dflight-credentials/dflight_username`
- `/etc/systemd/dflight-credentials/dflight_password`

### VERIFY_HASH_THEN_FIX_NEW_OWNERSHIP
- `/etc/goi-dflight/csrf-public.pem`
  - OLD: mode 640 owner `root:goi-dflight`, size 451
  - NEW: mode 640 owner `root:root`, size 451

### INSPECT_NONSECRET_THEN_COPY_OR_RECONSTRUCT
- `/etc/systemd/system/goi-nav-proxy.service.d/override.conf`

### RECONSTRUCT_NEW_SPECIFIC
- D-Flight bind/origin
- `goi-wait-tailscale-ip` expected IP
- nginx listen/server_name/TLS identity
- GraphHopper generated runtime bind
- any remaining client endpoint references to OLD IP/MagicDNS

OLD live listeners and units match the expected GOI production topology and remain untouched.

## Remaining hard blockers

1. Final bounded read-only parity: inspect the OLD Nav proxy override non-secret content; verify NEW D-Flight credential metadata/hashes and CSRF PEM hash; inspect helper/render semantics needed for NEW-specific config.
2. Perform bounded NEW-only parity copy/config render while keeping all GOI/nginx units disabled/inactive.
3. Validate file ownership/permissions, systemd config, nginx config, and generated GraphHopper/D-Flight config before any activation.
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
- `reports/architecture/vps_goi_old_parity_probe_2026-09-07.md`
- `reports/architecture/vps_dev_method_handoff_2026-09-07.md`
- `reports/architecture/vps_schema_engine_handoff_2026-09-07.md`
- `reports/architecture/vps_openclaw_handoff_2026-09-07.md`
- #67 Hermes qualification comments

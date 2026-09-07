# CURRENT VPS STATE

Updated after successful NEW Tailscale join, post-join identity/static-state verification, live NEW GOI read-only reconciliation, live OLD GOI parity probe, OLD final non-secret GOI inspect, and NEW final parity verification on 2026-09-07.

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
GOI_OLD_FINAL_NONSECRET_INSPECT=PASS_WITH_ACTIONABLE_DELTA
GOI_NEW_FINAL_PARITY_VERIFY=PASS_WITH_ACTIONABLE_DELTA
GOI_SECRET_COPY_AUTHORIZED_BY_OPERATOR=YES
GOI_DFLIGHT_CREDENTIAL_PARITY=PASS_NO_RECOPY_REQUIRED
GOI_CSRF_PEM=RECOPY_OLD_EXACT_AND_FIX_OWNERSHIP
GOI_COPY_REQUIRED_SECRET_SAFE=ORS_API_KEY
GOI_COPY_REQUIRED=ORS_CREDENTIAL_DROPIN,NGINX_TAILSCALE_READY_DROPIN,NAV_PROXY_OVERRIDE
GOI_COPY_REQUIRED_STATE_SAFE=DFLIGHT_LKG_STATE
GOI_TLS_RENEW_HELPER=RECONSTRUCT_NEW_SPECIFIC
GOI_GRAPHHOPPER_RENDER_PREFLIGHT=RECONSTRUCT_NEW_SPECIFIC
DEV_METHOD_HANDOFF=INGESTED_MIGRATED_VALIDATED
SCHEMA_ENGINE_HANDOFF=INGESTED_PRESENT_NOT_VALIDATED_NON_NETWORK
OPENCLAW_HANDOFF=INGESTED_KEEP_STAGED_PENDING
CROSS_PROJECT_PREJOIN_RECONCILIATION=CLEARED
TAILSCALE_UNIQUE_IDENTITY_JOIN=PASS
TAILSCALE_DNSNAME_ROUTES_SERVE_VERIFY=PASS
SHARED_INFRA_GATES=GOI_NEW_PARITY_COPY_CONFIG_RENDER,NEW_MAGICDNS_TLS,GOI_ACTIVATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=GOI_NEW_PARITY_COPY_CONFIG_RENDER
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

## NEW final GOI parity verification

Canonical evidence: `reports/architecture/vps_goi_new_final_parity_verify_2026-09-07.md`.

Resolved facts:
- NEW D-Flight username/password credential hashes match OLD exactly; do not recopy them.
- NEW CSRF PEM has the expected size/mode but ownership is `root:root` instead of OLD `root:goi-dflight`; exact content parity was not proven because OLD hash was not captured. Safe action is to transfer the OLD PEM directly and install it with OLD-equivalent ownership/mode.
- four required parent directories for missing drop-ins/credential are absent and must be created on NEW.
- active GraphHopper NEW `render-config.sh` and `preflight.sh` still fail closed unless Tailscale IP is OLD `100.114.7.53`; bounded NEW-specific adaptation to `100.99.54.93` is required.
- all GOI/nginx units remain disabled/inactive and no GOI listener is open.

## Operator secret-copy authorization

Operator explicitly authorized copying passwords/secrets required for migration. This permits direct OLD→NEW secret transfer. It does **not** permit secret values in chat/GitHub/evidence: only paths, metadata and hashes may be recorded.

## Bounded NEW-only parity delta

### Direct secret-safe/state-safe transfer required
- `/etc/systemd/ors-credentials/ORS_API_KEY`
- `/etc/systemd/system/goi-ors-gateway.service.d/credential.conf`
- `/etc/systemd/system/nginx.service.d/goi-tailscale-ready.conf`
- `/etc/systemd/system/goi-nav-proxy.service.d/override.conf`
- `/var/lib/goi-dflight`
- `/etc/goi-dflight/csrf-public.pem` exact OLD copy, then `root:goi-dflight` mode `640`

### Already equivalent — no recopy
- `/etc/systemd/dflight-credentials/dflight_username`
- `/etc/systemd/dflight-credentials/dflight_password`

### Reconstruct NEW-specific identity
- D-Flight host/origin: `100.99.54.93`
- readiness helper expected IP: `100.99.54.93`
- nginx listen: `100.99.54.93:443`
- nginx server_name: `ionos-n8n-new.tailc01234.ts.net`
- GraphHopper render/preflight allowed TS IP: `100.99.54.93`
- TLS renewal helper domain: explicit `ionos-n8n-new.tailc01234.ts.net`; do not derive from OS hostname `ubuntu`

All GOI/nginx services must remain disabled/inactive during this delta.

## Remaining hard blockers

1. Execute bounded NEW-only parity copy/config render, secret-safe, with no service activation.
2. Validate hashes/ownership/permissions, systemd config, rendered GraphHopper/D-Flight config and inactive-state safety.
3. Issue and qualify NEW TLS identity/renewal for `ionos-n8n-new.tailc01234.ts.net`.
4. Controlled GOI activation/qualification against NEW Tailscale identity; prove private reachability and restart persistence.
5. Validate schema-engine resolver on NEW and remaining `PRESENT_NOT_VALIDATED` rows.
6. Parallel OLD↔NEW validation.
7. Human cutover gate.
8. Production n8n publication on NEW only in the later explicit cutover phase.
9. OpenClaw final activate-or-archive decision remains later; current safe disposition is staged/inactive.

Evidence anchors:
- #68
- `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`
- `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`
- `reports/architecture/vps_goi_old_parity_probe_2026-09-07.md`
- `reports/architecture/vps_goi_old_final_nonsecret_inspect_2026-09-07.md`
- `reports/architecture/vps_goi_new_final_parity_verify_2026-09-07.md`
- `reports/architecture/vps_dev_method_handoff_2026-09-07.md`
- `reports/architecture/vps_schema_engine_handoff_2026-09-07.md`
- `reports/architecture/vps_openclaw_handoff_2026-09-07.md`
- #67 Hermes qualification comments

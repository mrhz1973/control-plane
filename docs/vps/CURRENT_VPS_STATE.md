# CURRENT VPS STATE

Updated after successful NEW Tailscale join and post-join read-only identity/network-state verification on 2026-09-07, following prep-copy PASS, Hermes qualification, GOI handoff ingestion, and cross-project pre-join reconciliation.

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
DEV_METHOD_HANDOFF=INGESTED_MIGRATED_VALIDATED
SCHEMA_ENGINE_HANDOFF=INGESTED_PRESENT_NOT_VALIDATED_NON_NETWORK
OPENCLAW_HANDOFF=INGESTED_KEEP_STAGED_PENDING
CROSS_PROJECT_PREJOIN_RECONCILIATION=CLEARED
TAILSCALE_UNIQUE_IDENTITY_JOIN=PASS
TAILSCALE_DNSNAME_ROUTES_SERVE_VERIFY=PASS
SHARED_INFRA_GATES=GOI_IDENTITY_CONFIG_RECONCILIATION,NEW_MAGICDNS_TLS,GOI_ACTIVATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=GOI_IDENTITY_CONFIG_RECONCILIATION_READ_ONLY
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

## Tailscale post-join evidence

Operator executed on NEW `31.70.139.73` and returned:

```text
DNSName=ionos-n8n-new.tailc01234.ts.net.
HostName=ionos-n8n-new
TailscaleIPs=100.99.54.93,fd7a:115c:a1e0::6a3a:365f
PrimaryRoutes=
ExitNodeOption=False
No serve config
No serve config
```

The trailing dot on `Self.DNSName` is normalized in canonical state as `ionos-n8n-new.tailc01234.ts.net`.

The Tailscale admin UI screenshot additionally corroborates that both Linux nodes are simultaneously connected with distinct identities/IPs:
- NEW `ionos-n8n-new` → `100.99.54.93`
- OLD `ubuntu` → `100.114.7.53`

This proves the NEW node has a distinct Tailscale identity and there is no MagicDNS/node-name collision with OLD. The Linux OS hostname remains `ubuntu`; no OS-hostname mutation was performed or authorized.

The Tailscale row remains conservatively `PRESENT_NOT_VALIDATED` until component-level private reachability/restart persistence is proven during the GOI/shared-infrastructure qualification; identity and static post-join configuration verification are PASS.

## Cross-project pre-join reconciliation

- **GOI:** network/TLS/bind requirements ingested; exact NEW Tailscale IPv4 and MagicDNS are now known, so environment-specific config reconciliation can proceed read-only-first.
- **dev-method:** no runtime/listener/credentials; `MIGRATED_VALIDATED`.
- **schema-engine:** local n8n/control-plane dependency only; no Tailscale/nginx/TLS/DNS dependence; resolver smoke pending.
- **OpenClaw:** staged preserved fallback, no current unit/listener; future activation separately gated.

## Remaining hard blockers

1. Read-only reconcile GOI OLD-IP/domain-dependent readiness/config/client references against NEW `100.99.54.93` and `ionos-n8n-new.tailc01234.ts.net`; verify all project-local UNKNOWN files/drop-ins without exposing secrets.
2. Prepare/apply bounded NEW-specific GOI config changes only after the reconciliation delta is explicit and collision-free.
3. Issue and qualify NEW TLS identity/renewal for `ionos-n8n-new.tailc01234.ts.net`.
4. Enable and qualify GOI services against the NEW Tailscale identity; prove component reachability and restart persistence.
5. Validate schema-engine resolver on NEW and remaining `PRESENT_NOT_VALIDATED` rows.
6. Parallel OLD↔NEW validation.
7. Human cutover gate.
8. Production n8n publication on NEW only in the later explicit cutover phase.
9. OpenClaw final activate-or-archive decision remains later; current safe disposition is staged/inactive.

Evidence anchors:
- #68
- `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`
- `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- `reports/architecture/vps_dev_method_handoff_2026-09-07.md`
- `reports/architecture/vps_schema_engine_handoff_2026-09-07.md`
- `reports/architecture/vps_openclaw_handoff_2026-09-07.md`
- #67 Hermes qualification comments

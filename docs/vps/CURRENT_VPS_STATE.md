# CURRENT VPS STATE

Updated after successful NEW Tailscale join, GOI OLD↔NEW parity reconciliation, and NEW-only parity/config render PASS on 2026-09-07.

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
GOI_NEW_PARITY_COPY_CONFIG_RENDER=PASS
GOI_PARITY_FILES_AND_STATE=STAGED_VALIDATED
GOI_NEW_IDENTITY_CONFIG=RENDERED_VALIDATED
GOI_ACTIVE_OLD_IDENTITY_REFS=NONE
GOI_SERVICES=NOT_ACTIVATED
NEW_TLS_IDENTITY=NOT_YET_ISSUED
DEV_METHOD_HANDOFF=INGESTED_MIGRATED_VALIDATED
SCHEMA_ENGINE_HANDOFF=INGESTED_PRESENT_NOT_VALIDATED_NON_NETWORK
OPENCLAW_HANDOFF=INGESTED_KEEP_STAGED_PENDING
CROSS_PROJECT_PREJOIN_RECONCILIATION=CLEARED
TAILSCALE_UNIQUE_IDENTITY_JOIN=PASS
TAILSCALE_DNSNAME_ROUTES_SERVE_VERIFY=PASS
SHARED_INFRA_GATES=GOI_POST_RENDER_PREACTIVATION_VERIFY,NEW_MAGICDNS_TLS,GOI_ACTIVATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=GOI_POST_RENDER_PREACTIVATION_VERIFY
```

## Current proven state

OLD remains live production and unchanged.

NEW currently has:
- PostgreSQL 16.15 healthy, unpublished;
- n8n 2.33.3 loopback-only, health 200, execution-capable/published `0/0`;
- LiteLLM 1.98.0 running unpublished;
- Hermes 0.21.0 + Chromium/CDP/Xvfb/x11vnc/noVNC qualified;
- Tailscale unique identity `ionos-n8n-new`, IPv4 `100.99.54.93`, exact MagicDNS `ionos-n8n-new.tailc01234.ts.net`;
- no Tailscale routes, exit-node role, Serve or Funnel;
- GOI GraphHopper/ORS/D-Flight/GIS/Nav parity artifacts/state staged on NEW;
- GOI NEW-specific identity configuration rendered to `100.99.54.93` / `ionos-n8n-new.tailc01234.ts.net`;
- GraphHopper generated config rendered with app bind `100.99.54.93` and admin bind `127.0.0.1`;
- checked active GOI config contains no OLD Tailscale IP or OLD MagicDNS reference;
- all GOI/nginx units still disabled/inactive;
- no GOI listener open;
- nginx installed but not activated;
- NEW TLS serving identity not yet issued/qualified;
- OpenClaw staged/inactive;
- schema-engine resolver smoke still pending.

## Latest GOI NEW parity/config pass

Operator-run pass on NEW completed:

```text
SAFETY_ASSERTIONS=PASS
OLD_TRANSFER=PASS
SOURCE_VALIDATION=PASS
PARITY_FILES_INSTALLED=PASS
NEW_IDENTITY_RENDER=PASS
DFLIGHT_TOML=PASS
SYNTAX_AND_DAEMON_RELOAD=PASS
SECRET_AND_STATE_PARITY=PASS
GRAPHHOPPER_RENDER=PASS
ACTIVE_OLD_IDENTITY_REFS=NONE
GOI_NEW_PARITY_COPY_CONFIG_RENDER=PASS
SERVICES_STARTED=NO
OLD_CHANGED=NO
```

A NEW local pre-change backup was created at `/root/goi-new-prep-backup-20260907T014506Z`.

No GOI/nginx activation, DNS/public routing change, cutover, OLD shutdown, or OLD decommission action occurred.

## Remaining hard blockers

1. Post-render pre-activation verification: systemd dependency/load wiring, nginx syntax/render, GraphHopper/D-Flight bind checks, readiness helper semantics, and inactive-state safety.
2. Issue and qualify NEW Tailscale TLS identity for `ionos-n8n-new.tailc01234.ts.net` and validate renewal helper/timer behavior without public cutover.
3. Controlled GOI service activation/qualification on NEW private Tailscale identity; prove private reachability and restart persistence.
4. Validate schema-engine resolver on NEW and remaining `PRESENT_NOT_VALIDATED` rows.
5. Parallel OLD↔NEW validation.
6. Human cutover gate.
7. Production n8n publication on NEW only in explicit cutover phase.
8. OpenClaw final activate-or-archive decision remains later; current safe disposition is staged/inactive.

Evidence anchors:
- #68 comment recording GOI NEW parity/config PASS
- `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`
- `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`
- `reports/architecture/vps_goi_old_parity_probe_2026-09-07.md`
- `reports/architecture/vps_goi_old_final_nonsecret_inspect_2026-09-07.md`
- `reports/architecture/vps_goi_new_final_parity_verify_2026-09-07.md`
- #67 Hermes qualification comments

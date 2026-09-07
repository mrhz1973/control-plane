# CURRENT VPS STATE

Updated after successful NEW Tailscale join, GOI OLD↔NEW parity reconciliation, NEW-only parity/config render PASS, and GOI post-render pre-activation verification PASS on 2026-09-07.

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
GOI_POST_RENDER_PREACTIVATION_VERIFY=PASS
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
SHARED_INFRA_GATES=NEW_MAGICDNS_TLS,GOI_ACTIVATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION
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
- ORS, Nav proxy and nginx systemd drop-ins are loaded as expected;
- D-Flight persistent state and ownership/modes are validated;
- readiness helper expects NEW Tailscale IP;
- nginx vhost is rendered to NEW TS IP/MagicDNS and `nginx -t` passes;
- all GOI/nginx units still disabled/inactive;
- no GOI listener open;
- staged TLS certificate is still the OLD identity and must be replaced by a NEW Tailscale certificate;
- renewal helper explicitly targets NEW MagicDNS, while renew timer remains disabled/inactive;
- OpenClaw staged/inactive;
- schema-engine resolver smoke still pending.

## Latest GOI post-render pre-activation pass

Canonical evidence: `reports/architecture/vps_goi_post_render_preactivation_verify_2026-09-07.md`.

Operator-run live verification on NEW completed:

```text
TS_IP=100.99.54.93
SYSTEMD_DROPINS=LOADED
ORS_LOADCREDENTIAL=WIRED
DFLIGHT_NEW_BIND_ORIGIN=PASS
DFLIGHT_STATE_PERMISSIONS=PASS
TAILSCALE_READINESS_NEW_IP=PASS
GRAPHHOPPER_RENDERED_BIND=PASS
NGINX_NEW_RENDER=PASS
NGINX_SYNTAX=PASS
CURRENT_STAGED_TLS_IDENTITY=OLD
RENEW_HELPER_NEW_IDENTITY=PASS
GOI_LISTENERS=NONE
GOI_POST_RENDER_PREACTIVATION_VERIFY=PASS
TLS_ISSUANCE_PERFORMED=NO
```

No GOI/nginx activation, DNS/public routing change, cutover, OLD shutdown, or OLD decommission action occurred.

## Remaining hard blockers

1. Issue and qualify NEW Tailscale TLS identity for `ionos-n8n-new.tailc01234.ts.net`; confirm SAN, dates, permissions, nginx syntax and renewal helper semantics while GOI/nginx remain inactive.
2. Controlled GOI service activation/qualification on NEW private Tailscale identity; prove private reachability and restart persistence.
3. Validate schema-engine resolver on NEW and remaining `PRESENT_NOT_VALIDATED` rows.
4. Parallel OLD↔NEW validation.
5. Human cutover gate.
6. Production n8n publication on NEW only in explicit cutover phase.
7. OpenClaw final activate-or-archive decision remains later; current safe disposition is staged/inactive.

Evidence anchors:
- #68
- `reports/architecture/vps_goi_post_render_preactivation_verify_2026-09-07.md`
- `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`
- `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`
- `reports/architecture/vps_goi_old_parity_probe_2026-09-07.md`
- `reports/architecture/vps_goi_old_final_nonsecret_inspect_2026-09-07.md`
- `reports/architecture/vps_goi_new_final_parity_verify_2026-09-07.md`
- #67 Hermes qualification comments

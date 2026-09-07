# CURRENT VPS STATE

Updated after successful NEW Tailscale join, GOI OLD↔NEW parity reconciliation, NEW-only parity/config render PASS, GOI post-render pre-activation verification PASS, and the first NEW TLS issuance attempt on 2026-09-07.

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
NEW_TLS_ISSUANCE_ATTEMPT=PARTIAL_CERT_WRITTEN_QUALIFICATION_INTERRUPTED
NEW_TLS_HELPER_BLOCKER=NGINX_RELOAD_WHILE_INACTIVE
NEW_TLS_IDENTITY=VERIFY_REQUIRED_BEFORE_PROMOTION
DEV_METHOD_HANDOFF=INGESTED_MIGRATED_VALIDATED
SCHEMA_ENGINE_HANDOFF=INGESTED_PRESENT_NOT_VALIDATED_NON_NETWORK
OPENCLAW_HANDOFF=INGESTED_KEEP_STAGED_PENDING
CROSS_PROJECT_PREJOIN_RECONCILIATION=CLEARED
TAILSCALE_UNIQUE_IDENTITY_JOIN=PASS
TAILSCALE_DNSNAME_ROUTES_SERVE_VERIFY=PASS
SHARED_INFRA_GATES=NEW_MAGICDNS_TLS_RECOVERY_VERIFY,GOI_ACTIVATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=CURSOR_TLS_RECOVERY_VERIFY_THEN_GOI_QUALIFICATION
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
- no GOI listener open before the TLS attempt;
- renewal helper explicitly targets NEW MagicDNS.

## Latest TLS issuance attempt

Operator ran the NEW TLS issuance helper on NEW. Observed output:

```text
SAFETY_ASSERTIONS=PASS
TLS_BACKUP=/root/goi-tls-pre-new-20260907T015513Z
RENEW_HELPER_TARGET=PASS
Wrote public cert to temporary cert path
Wrote private key to temporary key path
nginx configuration syntax test successful
nginx.service is not active, cannot reload
```

Interpretation:
- Tailscale certificate/key generation succeeded;
- helper execution proceeded through `nginx -t`;
- helper then attempted to reload inactive nginx and returned non-zero, which terminated the `set -e` SSH shell before the outer qualification checks ran;
- because the helper installs cert/key before its nginx syntax/reload phase, the NEW certificate material is likely installed, but identity/SAN, permissions, cert-key match and final inactive-state safety are **not yet canonically qualified**;
- this is a helper semantics issue for PREP state, not evidence of a certificate issuance failure.

Required recovery is first read-only verification of the installed cert/key. If the NEW certificate is correct, adapt the NEW-only renewal helper so inactive nginx is a successful no-reload case and active nginx is reloaded only after `nginx -t` passes. Then re-run qualification without activating GOI/nginx accidentally.

## Remaining hard blockers

1. Cursor recovery/verification of NEW TLS material and NEW-only renewal-helper inactive-nginx semantics.
2. Complete NEW TLS qualification: SAN/dates, permissions, cert-key match, nginx syntax, helper exit=0 while nginx remains inactive.
3. Controlled GOI service activation/qualification on NEW private Tailscale identity; prove private reachability and restart persistence.
4. Consume concurrent schema-engine validation from its separate worker; do not duplicate that work.
5. Parallel OLD↔NEW validation.
6. Human cutover gate.
7. Production n8n publication on NEW only in explicit cutover phase.
8. OpenClaw final activate-or-archive decision remains later; current safe disposition is staged/inactive.

Evidence anchors:
- #68
- `reports/architecture/vps_goi_post_render_preactivation_verify_2026-09-07.md`
- `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`
- `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`
- `reports/architecture/vps_goi_old_parity_probe_2026-09-07.md`
- `reports/architecture/vps_goi_old_final_nonsecret_inspect_2026-09-07.md`
- `reports/architecture/vps_goi_new_final_parity_verify_2026-09-07.md`

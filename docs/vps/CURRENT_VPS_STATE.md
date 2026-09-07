# CURRENT VPS STATE

Updated after NEW GraphHopper functional qualification (no boot enable) on 2026-09-07.

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
GOI_SERVICES=GRAPHHOPPER_RUNTIME_ACTIVE_NOT_ENABLED
GOI_GRAPHHOPPER_FUNCTIONAL_QUALIFICATION=PASS
GOI_GRAPHHOPPER_BOOT_PERSISTENCE=PENDING
NEW_TLS_ISSUANCE_ATTEMPT=RECOVERED_QUALIFIED
NEW_TLS_HELPER_INACTIVE_NGINX_SEMANTICS=PASS
NEW_TLS_IDENTITY=QUALIFIED
NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION=PASS
DEV_METHOD_HANDOFF=INGESTED_MIGRATED_VALIDATED
SCHEMA_ENGINE_HANDOFF=INGESTED_PRESENT_NOT_VALIDATED_NON_NETWORK
OPENCLAW_HANDOFF=INGESTED_KEEP_STAGED_PENDING
CROSS_PROJECT_PREJOIN_RECONCILIATION=CLEARED
VPS_CONSUMER_REGISTRY_COVERAGE=PASS
TAILSCALE_UNIQUE_IDENTITY_JOIN=PASS
TAILSCALE_DNSNAME_ROUTES_SERVE_VERIFY=PASS

PROJECT_PRIMARY_ORCHESTRATOR_CHAT=OPENCLAW42
VPS_MIGRATION_CHAT=TEMPORARY_SPECIALIST_UNTIL_MIGRATION_COMPLETE
CURSOR_EXECUTOR=SINGLE_EXECUTOR_FOR_REMAINING_VPS_WORK
SECOND_SCHEMA_CHAT=ABANDONED_NO_LIVE_WORK_PERFORMED
SCHEMA_ENGINE_EXECUTION=FOLDED_INTO_VPS_CURSOR_WORKSTREAM
VPS_HANDOFF_TARGET_AFTER_COMPLETION=OPENCLAW42
VPS_CHAT_CLOSE_CONDITION=MIGRATION_COMPLETE_AND_HANDOFF_RECORDED

SHARED_INFRA_GATES=GOI_ACTIVATION,SCHEMA_ENGINE_VALIDATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=CURSOR_REMAINING_GOI_SLICES_THEN_SCHEMA_ENGINE_QUALIFICATION
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
- ORS, Nav proxy and nginx systemd drop-ins loaded as expected;
- D-Flight persistent state and ownership/modes validated;
- readiness helper expects NEW Tailscale IP;
- nginx vhost rendered to NEW TS IP/MagicDNS and `nginx -t` passes;
- nginx, ORS, GIS, Nav and D-Flight still disabled/inactive;
- GraphHopper + tailscale-ready running disabled (not enabled at boot);
- GraphHopper listeners: TS app `100.99.54.93:8989`, admin `127.0.0.1:8990`;
- canonical hiking `/route` smoke HTTP 200 with positive distance;
- GraphHopper not promoted to `MIGRATED_VALIDATED` (restart-persistence pending);
- renewal helper explicitly targets NEW MagicDNS;
- cross-project consumer mini-audit: every necessary OLD consumer is represented in the registries (documentary bind/path rows added; no runtime change).

## NEW TLS qualification

`V4_VPS_NEW_TLS_RECOVERY_V1` completed:

- installed certificate SAN is exactly `ionos-n8n-new.tailc01234.ts.net`;
- OLD `ubuntu.tailc01234.ts.net` SAN is absent;
- certificate/private-key match, ownership and modes passed;
- renewal helper is fail-closed for issuance/install/config-test/required-reload failures;
- helper skips reload and exits `0` when nginx is inactive;
- `nginx -t` passed while nginx and all GOI services remained inactive;
- no GOI listener was opened;
- `NEW_TAILSCALE_TLS_ISSUANCE_QUALIFICATION=PASS`.

## Project orchestration model

The original project model is restored and must remain simple:

- **OpenClaw 42 chat is the primary project/orchestration chat.** It remains the place where the overall project is coordinated before and after this migration.
- **This VPS migration chat is temporary and specialist-only.** It exists only to finish OLD→NEW migration safely and will be closed after migration completion and final handoff.
- **Cursor is the single execution engine for the remaining VPS work**: SSH, bounded fixes, validation, evidence and GitHub updates.
- The proposed second schema-engine chat is abandoned; it performed no live smoke and no schema-engine promotion. Schema-engine is folded into the same Cursor VPS workstream.
- At meaningful checkpoints and at completion, this VPS chat produces a compact handoff/update for the operator to relay to OpenClaw 42.
- Do not confuse the **OpenClaw 42 chat/orchestrator** with the **OpenClaw application/runtime** on the VPS. The application/runtime remains staged/inactive with `KEEP_STAGED_PENDING` and is not activated by this migration work unless separately authorized.

## Remaining hard blockers

1. Remaining GOI service activation/qualification on NEW (ORS/GIS/Nav/D-Flight/nginx); GraphHopper functional PASS, restart-persistence still pending.
2. Validate schema-engine resolver/smoke on NEW in the same Cursor workstream; promote only on real PASS evidence.
3. Parallel OLD↔NEW validation.
4. Human cutover gate.
5. Production n8n publication on NEW only in explicit cutover phase.
6. OpenClaw application/runtime final activate-or-archive decision remains later; current safe disposition is staged/inactive.

## Completion rule for this chat

This VPS migration chat is complete only after the migration reaches its authorized terminal point, canonical evidence is written, and a final concise handoff is produced for OpenClaw 42. It is not a new permanent orchestration layer.

Evidence anchors:
- #68
- `reports/architecture/v4_vps_cross_project_consumer_mini_audit_v1.md`
- `reports/architecture/v4_vps_goi_graphhopper_activation_v1.md`
- `reports/architecture/v4_vps_new_tls_recovery_v1.md`
- `reports/architecture/vps_goi_post_render_preactivation_verify_2026-09-07.md`
- `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`
- `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- `reports/architecture/vps_goi_new_readonly_identity_reconciliation_2026-09-07.md`
- `reports/architecture/vps_goi_old_parity_probe_2026-09-07.md`
- `reports/architecture/vps_goi_old_final_nonsecret_inspect_2026-09-07.md`
- `reports/architecture/vps_goi_new_final_parity_verify_2026-09-07.md`

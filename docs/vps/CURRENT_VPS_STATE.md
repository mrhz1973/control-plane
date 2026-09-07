# CURRENT VPS STATE

Updated after `V4_REPLACEMENT_8GB_FULL_SERVICE_PARITY_PREP_COPY_V1` PASS, Hermes short qualification PASS, GOI specialist VPS handoff ingestion, and dispatch of remaining cross-project prechecks on 2026-09-07.

```text
VPS_STATE
OLD_HOST=ionos-n8n
OLD_IP=217.160.71.145
OLD_ROLE=LIVE

NEW_HOST=ionos-n8n-new
NEW_IP=31.70.139.73
NEW_ROLE=PREP

MIGRATED_VALIDATED=14
PRESENT_NOT_VALIDATED=14
MISSING=1
PROJECT_DECISIONS_PENDING=1

GOI_HANDOFF=INGESTED_AS_IS_INCOMPLETE
CROSS_PROJECT_HANDOFFS=DEV_METHOD_DISPATCHED,SCHEMA_ENGINE_DISPATCHED,OPENCLAW_DISPATCHED
SHARED_INFRA_GATES=CROSS_PROJECT_HANDOFF_RECONCILIATION,TAILSCALE_UNIQUE_HOSTNAME_JOIN,MAGICDNS_TLS,GOI_IDENTITY_CONFIG_RECONCILIATION,GOI_ACTIVATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=INGEST_DEV_METHOD_SCHEMA_ENGINE_OPENCLAW_HANDOFFS
```

## Current proven state

OLD remains live production and unchanged by the prep-copy pass and specialist handoff coordination.

NEW currently has:
- PostgreSQL 16.15 healthy, unpublished
- n8n 2.33.3 loopback-only, health 200, execution-capable/published `0/0`
- LiteLLM 1.98.0 running unpublished
- Hermes 0.21.0 + Chromium/CDP/Xvfb/x11vnc/noVNC qualified
- Hermes ChatGPT Web auth/session persistence, long-chat recall, 30-minute short soak and post-soak round-trip PASS
- GOI GraphHopper/ORS/D-Flight/GIS/Nav trees copied and staged with units disabled/inactive
- nginx installed but disabled/inactive; GOI vhost staged only
- OLD GOI TLS material archived on NEW but not valid as NEW serving identity
- OpenClaw trees copied but not activated
- dev-method/schema-engine copied
- `n8n-compose.service` present and validated for the isolated NEW stack

## GOI handoff ingestion

The specialist GOI handoff is canonicalized at `reports/architecture/vps_goi_project_handoff_2026-09-07.md`.

It confirms:
- GOI tailnet ports intended on NEW: `443,5000,8000,8010,8989`;
- GOI loopback-only ports: `8020,8990`;
- OLD Tailscale IP/MagicDNS identity is embedded in documented GOI readiness/config/client dependencies and must not be activated unchanged on NEW;
- `goi-wait-tailscale-ip`, D-Flight config, GraphHopper effective bind, GOI nginx rendering and GIS GraphHopper/ORS endpoint transition require reconciliation after NEW identity exists;
- several small project-local files/drop-ins/cache states remain `UNKNOWN` pending read-only NEW verification, not classified `MISSING`.

The handoff has `AS_IS_COMPLETE=NO`, `NEW_VALIDATED=NO`, `RESTART_PERSISTENCE=NOT_TESTED`; therefore GOI rows remain `PRESENT_NOT_VALIDATED`.

## Cross-project join gate

The migration law requires cross-project bind/port/shared-infrastructure requirements to be collected before joining NEW to Tailscale. GOI is ingested, but the remaining specialist confirmations were not yet present, so Tailscale join is deliberately deferred until these bounded handoffs return:

- dev-method: `mrhz1973/dev-method#1`
- schema-engine: `mrhz1973/control-plane#70`
- OpenClaw: `mrhz1973/control-plane#71`

No duplicate specialist dispatch existed when these tasks were created.

## Remaining hard blockers

1. Ingest dev-method, schema-engine and OpenClaw specialist handoffs and reconcile any shared-resource collisions.
2. Tailscale join on NEW with a unique hostname only after cross-project requirements are known; current OS hostname `ubuntu` must not collide with OLD MagicDNS identity.
3. Record NEW Tailscale IPv4/MagicDNS and issue the NEW TLS identity/certificate.
4. Reconcile GOI OLD-IP/domain-dependent readiness/config/client endpoints plus ACL/routes against the NEW identity.
5. Enable and qualify GOI services against the NEW Tailscale IP; prove restart persistence.
6. Parallel OLD↔NEW validation.
7. Human cutover gate.
8. OpenClaw activate-or-archive disposition must be resolved from its specialist handoff.
9. Production n8n publication on NEW only in the later explicit cutover phase.

Evidence anchors:
- #68
- `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`
- `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- `mrhz1973/dev-method#1`
- #70
- #71
- #67 Hermes qualification comments

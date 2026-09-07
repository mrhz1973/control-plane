# CURRENT VPS STATE

Updated after `V4_REPLACEMENT_8GB_FULL_SERVICE_PARITY_PREP_COPY_V1` PASS, Hermes short qualification PASS, GOI handoff ingestion, and bounded pre-join reconciliation for dev-method/schema-engine/OpenClaw on 2026-09-07.

```text
VPS_STATE
OLD_HOST=ionos-n8n
OLD_IP=217.160.71.145
OLD_ROLE=LIVE

NEW_HOST=ionos-n8n-new
NEW_IP=31.70.139.73
NEW_ROLE=PREP

MIGRATED_VALIDATED=15
PRESENT_NOT_VALIDATED=13
MISSING=1
PROJECT_DECISIONS_PENDING=1

GOI_HANDOFF=INGESTED_AS_IS_INCOMPLETE
DEV_METHOD_HANDOFF=INGESTED_MIGRATED_VALIDATED
SCHEMA_ENGINE_HANDOFF=INGESTED_PRESENT_NOT_VALIDATED_NON_NETWORK
OPENCLAW_HANDOFF=INGESTED_KEEP_STAGED_PENDING
CROSS_PROJECT_PREJOIN_RECONCILIATION=CLEARED
PROPOSED_NEW_TAILSCALE_HOSTNAME=ionos-n8n-new
SHARED_INFRA_GATES=TAILSCALE_UNIQUE_HOSTNAME_JOIN,MAGICDNS_TLS,GOI_IDENTITY_CONFIG_RECONCILIATION,GOI_ACTIVATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=TAILSCALE_JOIN_NEW_HOSTNAME_IONOS_N8N_NEW
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

## Cross-project pre-join reconciliation

The required project dependency collection is complete enough to proceed to a unique NEW Tailscale identity:

- **GOI:** network/TLS/bind requirements ingested. It intentionally waits for the NEW Tailscale IPv4/MagicDNS before config reconciliation and activation.
- **dev-method:** repository role is method/reference only, with no runtime/listener/credentials; OLD tree was copied to NEW with matching manifest. Promoted to `MIGRATED_VALIDATED` for VPS parity.
- **schema-engine:** isolated Ajv/ajv-formats dependency consumed by n8n/control-plane through the shared handoff bind. No Tailscale/nginx/TLS/DNS dependence. Remains `PRESENT_NOT_VALIDATED` until NEW resolver/validator smoke.
- **OpenClaw:** Foundation preserves it as fallback/existing broker. Latest OLD census showed no unit/listener/boot persistence; NEW copy remains staged. Disposition recommendation is `KEEP_STAGED_PENDING`. Future activation is separately gated and does not block Tailscale join.

No additional specialist-project port, bind, MagicDNS, nginx, TLS or Tailscale requirement remains unknown in a way that blocks assigning a unique NEW node identity.

## Tailscale identity decision

Control Plane selects **`ionos-n8n-new`** as the NEW Tailscale hostname because it matches the canonical NEW host alias and is distinct from OLD `ubuntu.tailc01234.ts.net`.

The join must pass the hostname explicitly. This does **not** authorize OS-hostname mutation, GOI listener activation, nginx enablement, TLS issuance, DNS/public routing, n8n publication or cutover.

After join, record the NEW Tailscale IPv4 and MagicDNS name before changing any GOI environment-specific config.

## Remaining hard blockers

1. Join NEW to Tailscale with explicit unique hostname `ionos-n8n-new`; login/manual auth may be required.
2. Record NEW Tailscale IPv4/MagicDNS.
3. Reconcile GOI OLD-IP/domain-dependent readiness/config/client endpoints and ACL/routes against the NEW identity.
4. Issue and qualify NEW TLS identity/renewal.
5. Enable and qualify GOI services against the NEW Tailscale IP; prove restart persistence.
6. Validate schema-engine resolver on NEW and other remaining `PRESENT_NOT_VALIDATED` rows.
7. Parallel OLD↔NEW validation.
8. Human cutover gate.
9. Production n8n publication on NEW only in the later explicit cutover phase.
10. OpenClaw final activate-or-archive decision remains a later project decision; current safe disposition is staged/inactive.

Evidence anchors:
- #68
- `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`
- `reports/architecture/vps_goi_project_handoff_2026-09-07.md`
- `reports/architecture/vps_dev_method_handoff_2026-09-07.md`
- `reports/architecture/vps_schema_engine_handoff_2026-09-07.md`
- `reports/architecture/vps_openclaw_handoff_2026-09-07.md`
- `mrhz1973/dev-method#1`
- #70
- #71
- #67 Hermes qualification comments

# CURRENT VPS STATE

Updated after `V4_REPLACEMENT_8GB_FULL_SERVICE_PARITY_PREP_COPY_V1` PASS and Hermes short qualification PASS.

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

SHARED_INFRA_GATES=TAILSCALE_UNIQUE_HOSTNAME_JOIN,MAGICDNS_TLS,GOI_ACTIVATION,PARALLEL_VALIDATION,HUMAN_CUTOVER
CUTOVER=NOT_AUTHORIZED
OLD_DECOMMISSION_ELIGIBLE=NO
NEXT=TAILSCALE_UNIQUE_HOSTNAME_JOIN_ON_NEW
```

## Current proven state

OLD remains live production and unchanged by the prep-copy pass.

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

## Remaining hard blockers

1. Tailscale join on NEW with a unique hostname; current OS hostname `ubuntu` collides with OLD MagicDNS identity.
2. NEW MagicDNS/TLS identity and certificate issuance.
3. Enable and qualify GOI services against the NEW Tailscale IP.
4. Parallel OLD↔NEW validation.
5. Human cutover gate.
6. OpenClaw activate-or-archive decision.
7. Production n8n publication on NEW only in the later explicit cutover phase.

Evidence anchors:
- #68
- `reports/architecture/v4_replacement_8gb_full_service_parity_prep_copy_v1.md`
- #67 Hermes qualification comments

# VPS — canonical operating area

This directory is the canonical control-plane surface for VPS topology, migration state, project ownership and decommission gating.

## Read order for VPS work

For `agg vps` / `aggio vps` / `vai vps`, read only:

1. `CURRENT_VPS_STATE.md`
2. `PROJECT_VPS_REGISTRY.md`
3. `SHARED_INFRASTRUCTURE_REGISTRY.md`
4. active migration issue (`#68` or successor)
5. only the project handoff/evidence required by the current blocker

Do not broad-scan historical reports unless a concrete conflict requires them.

## Canonical files

- `CURRENT_VPS_STATE.md` — compact OLD/NEW live topology and migration state
- `MIGRATION_OPERATING_LAW.md` — migration/cutover/rollback/decommission rules
- `PROJECT_VPS_HANDOFF_STANDARD.md` — mandatory format for specialist projects
- `PROJECT_VPS_REGISTRY.md` — project/component VPS footprint and migration status
- `SHARED_INFRASTRUCTURE_REGISTRY.md` — one owner for Tailscale/nginx/TLS/DNS/ports/users/shared namespaces
- `DECOMMISSION_CHECKLIST.md` — hard eligibility checklist before OLD deletion

## Authority

`docs/runtime/CURRENT_FRONTIER.md` remains the repository-wide LIVE STATE authority. These VPS files are the canonical VPS-specific projection and must not contradict it. If a conflict exists, CURRENT_FRONTIER wins for live state and the VPS docs must be reconciled.

## Migration law

`OLD LIVE → NEW PREP → FULL REPLICA → PARALLEL VALIDATION → HUMAN CUTOVER GATE → SHORT ROLLBACK WINDOW → DECOMMISSION`

No project-specific agent may silently mutate shared Tailscale/nginx/DNS/TLS/public-routing state. Specialist projects describe requirements and migrate their local component scope; Control Plane owns shared infrastructure and final cutover.
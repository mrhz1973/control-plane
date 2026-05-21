# PM-22–PM-25 promotion readiness batch (docs-only)

**Date:** 2026-05-22  
**Status:** **Prepared** — **no** runtime execution

## Created

| PM | Packet | Status |
|----|--------|--------|
| **PM-22** | [pm-22-promote-42-to-40-bridge-gate.md](../runtime-packets/pm-22-promote-42-to-40-bridge-gate.md) | PREPARED / NOT EXECUTED |
| **PM-23** | [pm-23-post-promotion-smoke-gate.md](../runtime-packets/pm-23-post-promotion-smoke-gate.md) | PREPARED / NOT EXECUTED |
| **PM-24** | [pm-24-rollback-recovery-gate.md](../runtime-packets/pm-24-rollback-recovery-gate.md) | PREPARED / NOT EXECUTED |
| **PM-25** | [pm-25-fast-track-runtime-operator-checklist.md](../runtime-packets/pm-25-fast-track-runtime-operator-checklist.md) | PREPARED / NOT EXECUTED |

## Baselines

| Item | State |
|------|--------|
| **Production `40`** | Published; PM-15 PASS — **not modified** by this batch |
| **Candidate `42`** | PM-21C PASS — **not promoted** |
| **PM-18** | **PENDING** |
| **PM-16 export** | **PENDING** — non-blocking |

## Posture

| Item | State |
|------|--------|
| **n8n** | **Not touched** by Cursor |
| **Promotion** | **Not executed** |
| **C1** | **PARTIAL** — unchanged |

## Next runtime

Execute **one window:** [PM-25 checklist](../runtime-packets/pm-25-fast-track-runtime-operator-checklist.md) → PM-22 → PM-23 → PM-24 only on failure.

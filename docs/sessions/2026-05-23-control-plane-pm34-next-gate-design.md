# Control Plane — PM-34 next gate design after OpenClaw preview

**Date:** 2026-05-23  
**Status:** **DESIGN ONLY / NO RUNTIME**

**Related:** [strict_pass contract](2026-05-23-control-plane-strict-pass-artifact-contract-design.md) · [dual-sequence reconciliation](2026-05-23-control-plane-openclaw-dual-sequence-reconciliation.md) · [pm-34 packet](../runtime-packets/pm-34-n8n-codex-worker-integration-gate.md)

---

## Context

OpenClaw preview/boundary work is reconciled at `0eafafc` and later boundary commits. Workflow **40** mock-worker preview **PASS** does **not** authorize real-worker execution.

The **next actual gate** must be a **separate** step from preview commits — not an extension of the same plan-file smoke.

---

## Future choices (design only — not executed)

| Option | Description |
|--------|-------------|
| **A** | **strict_pass dry-run** using mock-worker plus sanitized artifact |
| **B** | Real-worker minimal no-op execution with artifact |
| **C** | Stabilize / no new gate |

**Recommended (safest):** **A** — tests the [strict_pass contract](2026-05-23-control-plane-strict-pass-artifact-contract-design.md) without enabling Codex or a real worker.

**Why A:** validates artifact shape, forbidden-path checks, and sanitized commit path while `worker_type=mock-worker` and `dry_run_pass` behavior remain unchanged in n8n.

**Why not B yet:** real-worker no-op still crosses an activation boundary; requires explicit human gate after A passes.

**Why not C alone:** contract exists but no proof the artifact pipeline works end-to-end.

---

## Explicit negatives (this design task)

| Item | State |
|------|--------|
| OpenClaw run | **not now** |
| Codex | **not now** |
| n8n edit / import / export | **not now** |
| workflow **40** / **41** edit | **not now** |
| `pm34_unblocked` | **no change** (remains **false**) |
| `n8n_ready` | **no change** (remains **false**) |

---

## Next step after this doc

One gated task: **strict_pass dry-run** (mock-worker + artifact commit) with operator approval — **not** automatic real-worker execution.

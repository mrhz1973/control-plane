# Control Plane — strict_pass dry-run readiness checklist

**Date:** 2026-05-23  
**Status:** **CHECKLIST ONLY / NO RUNTIME**

**Related:** [dry-run package](2026-05-23-control-plane-strict-pass-dry-run-package.md) · [strict_pass contract](2026-05-23-control-plane-strict-pass-artifact-contract-design.md) · [fixture](../examples/strict-pass-artifact-v1.example.json)

---

## Before any strict_pass dry-run execution

| # | Check | Pass? |
|---|--------|-------|
| 1 | Local repo **clean** (`git status` empty) | ☐ |
| 2 | Branch **`main`** | ☐ |
| 3 | GitHub **`main` aligned** (0/0 ahead/behind after fetch) | ☐ |
| 4 | [strict_pass contract](2026-05-23-control-plane-strict-pass-artifact-contract-design.md) on `main` | ☐ |
| 5 | [dry-run package](2026-05-23-control-plane-strict-pass-dry-run-package.md) on `main` | ☐ |
| 6 | [artifact fixture](../examples/strict-pass-artifact-v1.example.json) present | ☐ |
| 7 | **No** `docs/plans/**` trigger created yet for this dry-run | ☐ |
| 8 | Workflow **40** untouched | ☐ |
| 9 | Workflow **41** untouched | ☐ |
| 10 | n8n UI **not** touched | ☐ |
| 11 | OpenClaw **not** running (unless separate explicit gate) | ☐ |
| 12 | Codex **not** invoked | ☐ |
| 13 | Operator **approval** obtained before any runtime trigger | ☐ |

---

## Invariants (unchanged until explicit later gate)

- `pm34_unblocked` = **false**
- `n8n_ready` = **false**
- `strict_pass_candidate` = **false** until a completed dry-run artifact proves otherwise

---

Runtime gate still required.

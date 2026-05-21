# Runtime packet — PM-30: Codex CLI local setup gate

**Packet ID:** `pm-30-codex-cli-local-setup-gate`  
**Date:** 2026-05-22  
**Status:** **PASS / CLI AVAILABLE / WORKER NOT ENABLED** (2026-05-22)

**Related:** [PM-18 feasibility](../PM18_CODEX_OAUTH_FEASIBILITY_DRY_RUN.md) · [PM-28 decision](../decision-packets/pm-28-next-track-decision.md) · [PM-29 snapshot](../PM29_POST_PROMOTION_SNAPSHOT.md) · [pm29 session](../sessions/2026-05-22-control-plane-pm29-snapshot-decision-b-then-c.md)

---

## Purpose

Move **PM-18** from **PENDING** by verifying or installing **Codex CLI** on the **local machine** only.

Does **not** enable automatic Codex worker in n8n.

---

## Preconditions

| Gate | State |
|------|--------|
| **PM-22/23** | PASS |
| **PM-28** | **B then C** decided |
| **PM-29** | PASS **or** PENDING (non-blocking) |
| **Production `40`** | Unchanged — classifier bridge ACTIVE |

---

## Future steps (separate runtime task)

| Step | Action |
|------|--------|
| 1 | Check `codex` in PATH |
| 2 | If missing, install via official/user-chosen local method |
| 3 | Run read-only `version` / `--help` only |
| 4 | **No** prompt execution |
| 5 | **No** OAuth token dump to git |
| 6 | Update PM-18 feasibility output |

---

## STOP conditions

| Condition | Action |
|-----------|--------|
| Token printed to logs | Stop |
| OAuth secret committed | **Forbidden** |
| Provider API key requested in repo | **Forbidden** |
| n8n UI / API workflow edit | **Forbidden** |
| Workflow **`40`** / **`41`** touched | **Forbidden** |
| GIS / DEV / Alina | **Forbidden** |

---

## Future PASS criteria

| # | Criterion |
|---|-----------|
| 1 | Codex CLI found in PATH |
| 2 | Version/help checked read-only |
| 3 | No secrets committed |
| 4 | PM-18 → **CLI AVAILABLE / NOT WORKER ENABLED** |

---

## Runtime result (2026-05-22)

| Check | Result |
|-------|--------|
| Install | `npm.cmd install -g @openai/codex` |
| Version | `codex-cli 0.133.0` |
| Login | **Not** run |
| Worker | **Not** enabled |

**Evidence:** [PM-30 session](../sessions/2026-05-22-control-plane-pm30-codex-cli-local-setup.md) · [output sample](../examples/pm30-codex-cli-local-setup-output.sample.json)

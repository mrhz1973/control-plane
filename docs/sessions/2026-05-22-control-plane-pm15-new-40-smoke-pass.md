# PM-15 new 40 smoke — PASS

**Date:** 2026-05-22  
**Repo:** mrhz1973/control-plane  
**Mode:** docs-only record — **no** n8n UI, **no** GIS/DEV/Alina.

## Production workflow

| Field | Value |
|-------|--------|
| **Workflow** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` |
| **State** | **Published** / ACTIVE |
| **Other CP workflows** | `01` / `20` / `30` **OFF** |
| **Candidates** | No `41`/`42` in use |

## Trigger

| Field | Value |
|-------|--------|
| **Commit** | `c0ea042` — `test: trigger PM-15 smoke for new 40 workflow` |
| **Plan file** | `docs/plans/2026-05-21_2330_pm15-new-40-smoke.plan.md` |
| **Ready-import baseline** | `1f62ebd` — real n8n credential ids in `READY_IMPORT_40-control-plane-active-with-credentials.json` |

## n8n execution

| Field | Value |
|-------|--------|
| **Execution** | `#6708` |
| **Time** | 2026-05-22 00:28:02 |
| **Result** | **Succeeded** in 1.709s |

## Telegram evidence (PASS)

| # | Check | Result |
|---|-------|--------|
| 1 | Scheduled poll commit notification | **PASS** — repo `mrhz1973/control-plane`, new `c0ea042`, previous `1f62ebd`, message `test: trigger PM-15 smoke for new 40 workflow` |
| 2 | `plan_detected` | **PASS** — plan `docs/plans/2026-05-21_2330_pm15-new-40-smoke.plan.md`, commit `c0ea042`, status added, +22 / -0 |
| 3 | Gate D plan file attachment | **PASS** — plan `.md` file sent for same commit |
| 4 | Duplicate spam | **PASS** (observed) — no evident duplicate Telegram for same SHA |

## Not observed / open

| Item | Note |
|------|------|
| **`latest-control-plane-handoff.md`** | **Not observed** in this smoke — **not** recorded as PASS here |
| **GIS handoff branch** | Not exercised in this smoke |
| **Full PM-15 regression matrix** | Partial — commit + plan path only |

## Posture

| Item | State |
|------|--------|
| **C1** | **PARTIAL** (D-C1-A) — **not** strict PASS |
| **v5 / webhook** | **Off** / not configured |
| **Provider API / Codex / Ollama** | **No** runtime |
| **GIS / DEV / ALINA LAVORO** | **Not touched** |

## Next

- Re-export current production **`40`** from n8n as redacted import-safe snapshot
- **PM-17** — Ollama classifier dry-run (separate gate)

Packet: [pm-15-post-promotion-regression-gate.md](../runtime-packets/pm-15-post-promotion-regression-gate.md)

# Runtime packet — PM-15: post-promotion regression gate

**Packet ID:** `pm-15-post-promotion-regression-gate`
**Date:** 2026-05-21
**Status:** **Prepared** — runtime smoke **not executed** by this packet alone.

**Related:** [pm-14 promotion packet](pm-14-promote-41-to-40-gate.md) · [PM-12 PASS](../sessions/2026-05-21-control-plane-41-handoff-file-runtime-pass.md) · [PLAN_WATCHER_GATE_C.md](../PLAN_WATCHER_GATE_C.md) · [HANDOFF_N8N_GATE.md](../HANDOFF_N8N_GATE.md) · [RUNTIME_GATES.md](../RUNTIME_GATES.md) · [MVP_STATUS.md](../MVP_STATUS.md)

---

## Objective

After PM-14 promotion `41` → `40`, verify that the new production workflow

```text
40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE
```

preserves all prior **PM-06 / PM-09 / PM-12** behavior with no spam, no regression, and no scope creep.

---

## Prerequisite

- PM-14 promotion steps 1–7 **PASS** ([pm-14 packet](pm-14-promote-41-to-40-gate.md))
- Exactly **one** active workflow named `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE`
- Old `40` present as `BACKUP OFF`
- ALINA LAVORO untouched · GIS/DEV untouched

---

## Regression checks (fast smoke)

| # | Check | Expected | Reference |
|---|-------|----------|-----------|
| 1 | **Commit notify** — push a docs commit to a watched CONTROL PLANE branch | Telegram message with new SHA in ≤ ~1–5 min | [MVP_STATUS.md](../MVP_STATUS.md) |
| 2 | **Dedupe** — observe 2 polling cycles after that commit | **No** duplicate Telegram for same SHA | [PM-02 dedupe](../POST_MVP_BACKLOG.md#pm-02--multirepo-watcher-promotion) |
| 3 | **`plan_detected`** — push a `docs/plans/YYYY-MM-DD_HHMM_*.plan.md` | Telegram `plan_detected` short text | [PLAN_WATCHER_GATE_C.md](../PLAN_WATCHER_GATE_C.md) |
| 4 | **Plan `.md` file attachment** (Gate D file) | Telegram document `*.plan.md` attached | [Gate D file PASS](../sessions/2026-05-21-control-plane-40-gate-d-file-attachment-pass.md) |
| 5 | **`latest-control-plane-handoff.md`** (PM-11/12 branch) | Telegram short text + document `latest-control-plane-handoff.md` | [PM-12 PASS](../sessions/2026-05-21-control-plane-41-handoff-file-runtime-pass.md) |
| 6 | **GIS handoff** — push a watched commit to GIS repo | Telegram safe-text + `latest-gis-handoff.md` attachment | [HANDOFF_N8N_GATE.md](../HANDOFF_N8N_GATE.md) |
| 7 | **GIS dedupe** — same GIS SHA on next poll | **No** duplicate Telegram | [PM-02](../POST_MVP_BACKLOG.md#pm-02--multirepo-watcher-promotion) |
| 8 | **List integrity** — `30` / `20` / `01` still **OFF** | No new active workflows | [N8N_WORKFLOW_NAMING.md](../N8N_WORKFLOW_NAMING.md) |
| 9 | **ALINA LAVORO** untouched | Folder/workflows unchanged | [POST_MVP_BACKLOG.md](../POST_MVP_BACKLOG.md) |
| 10 | **C1 posture** | Remains **PARTIAL** (D-C1-A) — **not** relabeled to strict PASS | [MVP_STATUS.md](../MVP_STATUS.md) |

**Timing:** smoke should finish in &lt; ~10 minutes total. Do **not** run all 10 checks in parallel — sequence per commit/poll to keep evidence readable.

---

## STOP criteria (revert promotion)

| Condition | Action |
|-----------|--------|
| Duplicate Telegram for same SHA | Deactivate new `40`; reactivate `BACKUP OFF`; debug dedupe |
| Telegram spam (≥ 3 messages for one commit) | Deactivate new `40`; rollback |
| Commit notify missing on watched push | Deactivate new `40`; rollback |
| `plan_detected` missing on plan push | Deactivate new `40`; rollback |
| Handoff file empty / 0 bytes / wrong path | Deactivate new `40`; rollback |
| GIS path broken | Deactivate new `40`; rollback |
| Credentials empty / Authorization Bearer leaked in logs | Stop; rotate token; rollback |
| `30` / `20` / `01` re-enabled | Disable; restore OFF posture |
| ALINA LAVORO / DEV touched | Stop; revert that change |

---

## PASS criteria

| Item | Required |
|------|----------|
| Checks **1–9 PASS** | **Yes** |
| **C1 stays PARTIAL** | **Yes** |
| New `40` is the **sole** active CONTROL PLANE workflow | **Yes** |
| Backup `40` available for rollback | **Yes** |
| No new secrets in git | **Yes** |
| ALINA LAVORO / GIS / DEV untouched | **Yes** |

---

## Deliverables after PASS (separate docs session)

- `docs/sessions/<date>-control-plane-pm15-post-promotion-regression-pass.md`
- Update `MVP_STATUS.md` runtime table only if names changed
- Update `WORKFLOW_EXPORT_STATUS.md` PM-15 entry
- Re-export new `40` only if its node graph diverged from PM-13 redacted export

---

## Out of scope

- v5 / webhook reopen
- Strict C1 &lt;30s
- Implementer auto-send (PM-10 runtime)
- Provider API / Codex / Ollama (PM-16+)
- ALINA LAVORO / GIS / DEV

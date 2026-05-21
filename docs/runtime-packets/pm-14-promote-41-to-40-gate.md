# Runtime packet — PM-14: promotion `41` → `40` gate

**Packet ID:** `pm-14-promote-41-to-40-gate`
**Date:** 2026-05-21
**Status:** **Prepared** — promotion **not authorized** by this packet alone.

**Related:** [PM-12 runtime PASS](../sessions/2026-05-21-control-plane-41-handoff-file-runtime-pass.md) · [PM-13 export commit session](../sessions/2026-05-21-control-plane-41-redacted-export-commit.md) · [pm-13 packet](pm-13-candidate-41-redacted-export-gate.md) · [pm-15 regression packet](pm-15-post-promotion-regression-gate.md) · [N8N_WORKFLOW_NAMING.md](../N8N_WORKFLOW_NAMING.md) · [RUNTIME_GATES.md](../RUNTIME_GATES.md) · [WORKFLOW_EXPORT_STATUS.md](../WORKFLOW_EXPORT_STATUS.md)

---

## Objective

Promote tested candidate

```text
41 - CP v4 multirepo + plan handoff file - CANDIDATE
```

to production role

```text
40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE
```

without losing the current production `40` (kept as backup, OFF) and without enabling a second active schedule.

---

## Prerequisites

| Gate | State |
|------|--------|
| **PM-12 runtime PASS** | **PASS** — [session](../sessions/2026-05-21-control-plane-41-handoff-file-runtime-pass.md) (Gates A–F) |
| **PM-13 redacted export committed** | **PASS** — `workflows/exports/2026-05-21_41-plan-handoff-file-candidate.redacted.json` ([session](../sessions/2026-05-21-control-plane-41-redacted-export-commit.md)) |
| **C1 posture** | **PARTIAL** (D-C1-A) — promotion **does not** relabel C1 |
| **v5 / webhook** | **Off** — not reopened by this packet |
| **GIS / DEV / ALINA LAVORO** | **Out of scope** — not touched |
| **Provider API / Codex OAuth / Ollama** | **Off** — not part of promotion |

**If export reflects pre-PM-12 snapshot** (no `latest-control-plane-handoff.md` nodes in committed JSON), re-export current `41` from n8n UI → re-redact → commit before Gate I. Otherwise rebuild record will not match promoted runtime.

---

## Runtime targets (exact)

| Field | Value |
|-------|--------|
| **Old production (current)** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` — **ACTIVE** |
| **Candidate** | `41 - CP v4 multirepo + plan handoff file - CANDIDATE` — **inactive** |
| **New production (after promotion)** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` (re-using ID `40` from renamed `41`) |
| **Backup of old `40`** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF` — **inactive** |
| **Out of CONTROL PLANE list** | `30`, `20`, `01` — remain **OFF** |
| **ALINA LAVORO** | **Not touched** |

---

## Future runtime action (one session, n8n UI only — **not done here**)

| Step | Action | Verify |
|------|--------|--------|
| 1 | Open n8n UI (CONTROL PLANE) — confirm 4 workflows in list | `40` ACTIVE, `41` inactive, `30`/`20`/`01` OFF |
| 2 | Confirm `40` still **ACTIVE** and `41` still **inactive** | Two distinct workflows visible |
| 3 | **Deactivate** old `40` schedule (toggle off) | Active = 0 workflows for ~few seconds |
| 4 | **Rename** old `40` → `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF` | Backup name visible |
| 5 | **Rename** `41` → `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` | Two workflows with prefix `40 - ...` (BACKUP OFF + ACTIVE pending) |
| 6 | **Activate** schedule on new `40` (formerly `41`) | Exactly **one** active workflow |
| 7 | Verify final list | `40` ACTIVE · `40 BACKUP OFF` · `30` / `20` / `01` OFF · ALINA untouched |
| 8 | Trigger PM-15 regression smoke ([pm-15 packet](pm-15-post-promotion-regression-gate.md)) | All regression PASS |

**No** runtime is executed in this packet — this is a runbook for the explicit promotion session.

---

## STOP criteria (abort promotion immediately)

| Condition | Action |
|-----------|--------|
| Two workflows active simultaneously | Deactivate the older one first; revert to step 3 |
| `41` activated **before** step 5 rename | Deactivate, restart from step 3 |
| Old `40` **deleted** instead of renamed/disabled | Stop — backup must remain for rollback |
| Telegram spam (multiple notifications per commit) | Deactivate new `40`; reactivate backup `40`; investigate |
| Empty credentials on new `40` (Telegram / GitHub / Data Table) | Stop; bind in UI before reactivating |
| Webhook URL leaked / Authorization Bearer exposed | Stop; rotate token; do **not** commit |
| Schedule not 1 min on new `40` | Stop; align to existing posture |
| ALINA LAVORO / GIS / DEV touched | Stop; revert |

---

## PASS criteria (promotion accepted)

| Item | Required |
|------|----------|
| Exactly **one** active workflow with name `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` | **Yes** |
| Old `40` exists as `40 - ... - BACKUP OFF` (or archived) — **not deleted** | **Yes** |
| New `40` contains plan handoff-file branch (PM-11/12) | **Yes** |
| `30` / `20` / `01` remain **OFF** | **Yes** |
| ALINA LAVORO untouched | **Yes** |
| v5 / webhook still **off** | **Yes** |
| Telegram commit notify works (PM-15 smoke) | **Yes** |
| `plan_detected` works (PM-15 smoke) | **Yes** |
| `latest-gis-handoff.md` file attachment works (PM-15 smoke) | **Yes** |
| `latest-control-plane-handoff.md` file attachment works (PM-15 smoke) | **Yes** |
| Dedupe works — no double Telegram for same SHA | **Yes** |
| **C1 stays PARTIAL** (not relabeled) | **Yes** |

---

## Post-promotion deliverables (separate session)

| Doc | Trigger |
|-----|---------|
| `docs/sessions/<date>-control-plane-pm14-promotion-41-to-40.md` | After steps 1–7 PASS |
| Updated `WORKFLOW_EXPORT_STATUS.md` PM-14 entry | After step 7 |
| Re-export new `40` → commit redacted under new dated filename | Only if runtime diverges from PM-13 export |
| `MVP_STATUS.md` runtime row refresh | If active workflow definition materially changed |

---

## Out of scope

- Activating v5 / GitHub webhook
- Strict C1 &lt;30s reopen (PM-01)
- Implementer auto-send (PM-10 runtime)
- Provider API key / Codex OAuth / Ollama (PM-16, PM-17, PM-18, PM-19)
- ALINA LAVORO, GIS, DEV
- Any `git add .` or runtime change from Cursor

---

## Reference — final 4-workflow list after promotion

| ID / Name | State |
|-----------|--------|
| `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` (ex-`41`) | **ACTIVE** |
| `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF` (ex-current `40`) | inactive |
| `30 - CP handoff manual Telegram v1` | OFF |
| `20 - CP v5 push webhook` | OFF |
| `01 - CP v4 single-repo polling - LEGACY OFF` | OFF |

If backup `40` is later archived, total list returns to 4 workflows (current convention).

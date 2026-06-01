# Session — Wf47 Schedule Trigger node-id fix (Phase 1b)

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-01  
**Type:** minimal deterministic template fix. **No runtime by Cursor.**

---

## 1. Purpose

Fix duplicate n8n **node id** in `workflows/wf-telegram-inbound-polling-getupdates.template.json` so import of **47 - Wf** is deterministic before Phase 2 schedule runtime gate.

## 2. Blocker discovered

Phase 1 commit `c51e8a6` added **Schedule Trigger - TEST ONLY DISABLED** with id `wf000012-0012-4012-8012-000000000012`, which was **already used** by **NOTE - offset store Data Table**. Duplicate ids break repeatable n8n import.

## 3. Compact plan used

1. Phase 1b minimal id fix only — no runtime.
2. Blocker: duplicate n8n node id.
3. Change **only** Schedule Trigger id → `wf000018-0018-4018-8018-000000000018`.
4. Sticky note **NOTE - offset store Data Table** keeps `wf000012-0012-4012-8012-000000000012`.
5. No name/parameter/position/disabled/active/connection/Data Table/credential changes (connections are name-based).
6. No n8n import/activation/schedule run.
7. No Telegram Trigger, webhook, production table, 48/49, PM-34, wf40/41/42, secrets.
8. Phase 2 runtime remains manual/user-attested.

## 4. Files read

- `docs/foundation/PROJECT_VISION.md`
- `docs/runtime/CURRENT_FRONTIER.md`
- `docs/runtime/LAST_CURSOR_REPORT.md`
- `workflows/wf-telegram-inbound-polling-getupdates.template.json`
- `docs/sessions/2026-06-01-control-plane-wf47-schedule-trigger-template-ready.md`

## 5. Files changed

- `workflows/wf-telegram-inbound-polling-getupdates.template.json` — Schedule Trigger id only.
- `docs/runtime/CURRENT_FRONTIER.md` — Phase 1b state.
- `docs/sessions/2026-06-01-control-plane-wf47-schedule-trigger-id-fix.md` — this file.

## 6. Exact id change

| Node | Before | After |
|------|--------|-------|
| **Schedule Trigger - TEST ONLY DISABLED** | `wf000012-0012-4012-8012-000000000012` | `wf000018-0018-4018-8018-000000000018` |
| **NOTE - offset store Data Table** | `wf000012-0012-4012-8012-000000000012` | **unchanged** |

## 7. Implementation summary

Single-field change on Schedule Trigger node `id`. Verified: all node ids unique; `disabled: true` on schedule; `active: false` on workflow.

## 8. No-runtime confirmation

Cursor did **not** run n8n, import, activate workflow, activate schedule, or poll Telegram.

## 9. Forbidden actions NOT performed

- No n8n/import/schedule/Telegram runtime; no Data Table mutation; no PM-34; no wf40/41/42; no 48/49 templates; no secrets.

## 10. Validation commands

See final report (node uniqueness scripts + `git diff --check`).

## 11. Commit / remote hash

- Task commit (`workflow: fix Wf47 schedule trigger node id`): `9d56f144c6f4152156d17d46504e584e24a6ed9b`
- Rolling report commits: `a3ceadd6c798757c6260134a369743a64983c0cf`, `1c0c1085e4805616b1822b450d262ecb0ea0235b`
- Remote hash (`origin/main` HEAD): `1c0c1085e4805616b1822b450d262ecb0ea0235b`

## 12. Phase 1b hygiene closure (2026-06-01)

- Template on `origin/main` already fixed; **no workflow re-edit** in hygiene pass.
- `LAST_CURSOR_REPORT.md` LATEST: `task_ref: wf47-schedule-trigger-id-fix`, `real_task_commit: 9d56f14` (not `c51e8a6`).
- Verified: `git merge-base --is-ancestor 9d56f14 HEAD` — id-fix commit in `main` chain.
- Runtime Phase 2 may proceed only after operator reimport + explicit runtime gate.

## 13. Final status

**PASS** — Phase 1b closed. Unique node ids on `main`; report aligned with `9d56f14`. Ready for Phase 2 reimport (user-attested).

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

- Commit 1 (`workflow: fix Wf47 schedule trigger node id`): `__COMMIT_1__`
- Commit 2 (`docs: update rolling Cursor report`): `__COMMIT_2__`
- Remote hash: `__REMOTE_HASH__`

## 12. Final status

**PASS** — unique node ids ready for Phase 2 reimport.

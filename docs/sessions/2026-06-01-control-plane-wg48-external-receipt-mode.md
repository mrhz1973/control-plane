# Session — Wg48 external receipt mode (47→48 live handoff support)

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-01  
**Type:** workflow-template + docs. **No runtime by Cursor.**

---

## 1. Purpose

Add minimum **versioned handoff support** so **48 - Wg** can consume a **sanitized receipt copied from 47 - Wf** for the first live manual gate: 47 → manual receipt → 48.

## 2. Discovery from live gate

- **47 - Wf** live `getUpdates` produced a valid accepted sanitized receipt — **PASS ATTESTATO UTENTE** (not re-tested in this task).
- **48 - Wg** *Build sanitized inbound test input* only simulated Wf47 via internal fixtures; **live 47→48 handoff was not possible**.
- Fix: `scenario=external_receipt` + `manual_receipt_json` on 48 - Wg. **Not** a new PREP chain — concrete blocker fix.

## 3. Files read

- `docs/foundation/PROJECT_VISION.md`
- `docs/runtime/CURRENT_FRONTIER.md`
- `docs/runtime/LAST_CURSOR_REPORT.md`
- `docs/workflow-wf-telegram-inbound-polling-getupdates.md`
- `docs/workflow-wg-telegram-inbound-decision-state-correlation.md`
- `docs/workflow-wf47-wg-operationalization-plan.md`
- `workflows/wg-telegram-inbound-decision-state-correlation.template.json`
- `workflows/wf-telegram-inbound-polling-getupdates.template.json` (read-only)
- `docs/sessions/2026-05-31-control-plane-wf47-wg-wh-final-manual-runtime-rehearsal-pass.md`

## 4. Files changed

- `workflows/wg-telegram-inbound-decision-state-correlation.template.json` — `external_receipt`, `manual_receipt_json`, updated Build node.
- `docs/workflow-wg-telegram-inbound-decision-state-correlation.md` — §5bis external receipt mode + operator flow.
- `docs/workflow-wf47-wg-operationalization-plan.md` — §4bis live discovery + next gate.
- `docs/runtime/CURRENT_FRONTIER.md` — state + next gate.
- `docs/runtime/LAST_CURSOR_REPORT.md` — LATEST updated.
- `docs/sessions/2026-06-01-control-plane-wg48-external-receipt-mode.md` — this file.

## 5. Implementation summary

- **Set Wg test scenario:** added `manual_receipt_json` (string, default `{}`).
- **Build sanitized inbound test input:** if `scenario === external_receipt'`, parse/validate pasted Wf47 receipt (`inspect_status`, `decision_id`, `selected_option`, `update_id`, `test_only===true`); map to `response_kind` for downstream *Correlate inbound to decision state*; invalid/missing → deterministic `missing_or_invalid_external_receipt`.
- **Fixture scenarios** unchanged: `valid_close`, `duplicate`, `unknown`, `stale_closed`, `note_only`, `malformed`.

## 6. No-runtime confirmation

Cursor did **not** run n8n, import workflows, activate schedules, touch Telegram runtime, or mutate Data Tables.

## 7. Forbidden actions NOT performed

- No n8n / import / schedule / Telegram Trigger / public webhook by Cursor.
- No production `control_plane_state` or production Data Table mutation.
- No PM-34 unlock; no workflow 40/41/42 mutation.
- `workflows/wf-telegram-inbound-polling-getupdates.template.json` and `wh-*` **not** modified.
- No `data-tables/**` changes; no secrets; no tokenized URLs; chat_id policy unchanged.

## 8. Validation commands

```bash
git diff --check
git status --short
git diff --stat
git diff -- workflows/wg-telegram-inbound-decision-state-correlation.template.json docs/workflow-wg-telegram-inbound-decision-state-correlation.md docs/workflow-wf47-wg-operationalization-plan.md docs/runtime/CURRENT_FRONTIER.md docs/runtime/LAST_CURSOR_REPORT.md docs/sessions/2026-06-01-control-plane-wg48-external-receipt-mode.md
```

## 9. Commit / remote hash

- Task commit (`workflow: add Wg external receipt mode`): `18c9dd0f9e0e922877a4d3dd567ff50f9af5f544`
- Remote hash after push: see final report (`git ls-remote origin main`)

## 10. Final status

**PASS** — template + docs ready. **Next runtime gate (user):** reimport only 48 - Wg, `external_receipt` + receipt from 47 - Wf, manual run, inactive/off.

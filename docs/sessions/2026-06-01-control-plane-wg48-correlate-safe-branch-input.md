# Session — Wg48 correlate safe branch input (Phase 1c)

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-01  
**Type:** minimal template blocker fix. **No runtime by Cursor.**

---

## 1. Purpose

Fix runtime blocker in **48 - Wg** before Phase 2 controlled **47→48** handoff gate: **Correlate inbound to decision state** must not eagerly dereference nodes on the unexecuted branch.

## 2. Blocker discovered

n8n throws **Referenced node is unexecuted** when `$('Node').all()` targets a node that did not run in the current execution. Eager reads of both **Normalize Wf47 callable receipt** and **Build sanitized inbound test input** broke callable and manual paths respectively.

## 3. Compact plan used

1. Phase 1c minimal blocker fix only — not runtime.  
2. Blocker: eager dereference of unexecuted branch node in Wg48 correlation.  
3. Only **Correlate inbound to decision state** code changes.  
4. No other Wg48 node, id, position, connection, or trigger changes.  
5. **47 - Wf** template untouched.  
6. Both paths tolerate the other branch being unexecuted.  
7. `active:false` unchanged on both templates.  
8. No runtime, import, secrets, 49, PM-34, wf40/41/42.  
9. Phase 2 runtime remains user-attested later.

## 4. Files read

- `docs/foundation/PROJECT_VISION.md`, `docs/runtime/CURRENT_FRONTIER.md`, `docs/runtime/LAST_CURSOR_REPORT.md`
- `workflows/wg-telegram-inbound-decision-state-correlation.template.json`
- `workflows/wf-telegram-inbound-polling-getupdates.template.json` (read-only validation)
- `docs/sessions/2026-06-01-control-plane-wf47-wg-controlled-handoff-template.md`

## 5. Files changed

- `workflows/wg-telegram-inbound-decision-state-correlation.template.json` — Correlate node `jsCode` only.
- `docs/runtime/CURRENT_FRONTIER.md` — Phase 1c state.
- `docs/sessions/2026-06-01-control-plane-wg48-correlate-safe-branch-input.md` — this file.

## 6. Exact code behavior changed

Replaced eager:

```javascript
const callableRows = $('Normalize Wf47 callable receipt').all();
const manualRows = $('Build sanitized inbound test input').all();
```

With try/catch-safe:

```javascript
let callableRows = [];
try { callableRows = $('Normalize Wf47 callable receipt').all(); } catch (e) { callableRows = []; }

let manualRows = [];
try { manualRows = $('Build sanitized inbound test input').all(); } catch (e) { manualRows = []; }

const inb = (callableRows.length ? callableRows[0].json : manualRows[0].json);
```

Downstream correlation logic unchanged.

## 7. Scope confirmation

Only **Correlate inbound to decision state** `parameters.jsCode` changed in the Wg48 template.

## 8. Path tolerance

Manual **external_receipt** / fixture path and callable **47→48** path are intended to work when the other branch’s source node did not execute.

## 9. No-runtime confirmation

Cursor did not run n8n, import, activate workflows/schedule, or mutate Data Tables.

## 10. Forbidden actions NOT performed

No Telegram Trigger, webhook, production table, `control_plane_state`, 49, PM-34, wf40/41/42, secrets, Wf47 template edits, tokenized URLs.

## 11. Validation

See final report (`JSON OK`, unique ids, `active:false`, correlate try/catch check, `git diff --check`).

## 12. Commit / remote hash

- Task commit (`workflow: fix Wg48 safe branch input`): `177f973f65947cbb6f65d7e988a08520a1f5b21c`
- Remote: `git ls-remote origin main` after push.

## 13. Final status

**PASS** — Wg48 safe branch dereference fixed in template. Phase 2 controlled handoff runtime remains **BLOCKED** until user gate.

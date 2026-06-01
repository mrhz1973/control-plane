# Session — Wf47→Wg48 controlled handoff template (Phase 1)

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-01  
**Type:** workflow template + docs. **No runtime by Cursor.** **Not a PREP task.**

---

## 1. Purpose

Phase 1 versioned implementation of a **controlled test-only 47 → 48 handoff** to remove manual copy/paste after **47 - Wf** schedule **PASS ATTESTATO UTENTE**.

## 2. Reason

Manual `external_receipt` paste proved 47→48; schedule PASS proved accept-once on 47. Next concrete step is template-level handoff wiring, not another PREP chain.

## 3. Compact plan used

1. Phase 1 template/docs only — no runtime.  
2. Value: remove manual copy/paste between 47 and 48.  
3. Wf47/Wg48 remain `active:false`, test-only.  
4. 49 / 40–42 untouched.  
5. No schedule activation, Telegram Trigger, webhook, production table, `control_plane_state`, PM-34, secrets.  
6. Handoff explicitly gated (`enable_wg48_handoff`, default false).  
7. Phase 2 runtime user-attested later.  
8. Wg48 callable path bypasses **Set Wg test scenario**.  
9. Wf47 Execute Workflow uses `CONFIGURE_48_WORKFLOW_REFERENCE_IN_N8N_UI` — no hardcoded 48 id.  
10. `enable_wg48_handoff=false` → IF false branch → **Inspect** only (Execute Workflow never runs).

## 4. Additional constraints

- **48 callable path** does not rely on **Set Wg test scenario**.  
- **47 Execute Workflow** does not hardcode concrete 48 workflow id.  
- **`enable_wg48_handoff=false`** short-circuits before Execute Workflow node.

## 5. Files read

- `docs/foundation/PROJECT_VISION.md`, `docs/runtime/CURRENT_FRONTIER.md`, `docs/runtime/LAST_CURSOR_REPORT.md`
- `docs/workflow-wf-telegram-inbound-polling-getupdates.md`, `docs/workflow-wg-telegram-inbound-decision-state-correlation.md`, `docs/workflow-wf47-wg-operationalization-plan.md`
- `workflows/wf-telegram-inbound-polling-getupdates.template.json`, `workflows/wg-telegram-inbound-decision-state-correlation.template.json`
- `docs/sessions/2026-06-01-control-plane-wf47-limited-schedule-runtime-pass.md`, `docs/sessions/2026-06-01-control-plane-wf47-wg-live-manual-handoff-pass.md`

## 6. Files changed

- `workflows/wf-telegram-inbound-polling-getupdates.template.json` — `enable_wg48_handoff`, IF gate, Execute Workflow placeholder.  
- `workflows/wg-telegram-inbound-decision-state-correlation.template.json` — callable trigger + normalize adapter; dual-source Correlate.  
- `docs/workflow-wf-telegram-inbound-polling-getupdates.md` — §10bis handoff.  
- `docs/workflow-wg-telegram-inbound-decision-state-correlation.md` — §5ter callable path.  
- `docs/workflow-wf47-wg-operationalization-plan.md` — §4sexies + next gate.  
- `docs/runtime/CURRENT_FRONTIER.md` — IMPLEMENTATION READY / runtime BLOCKED.

## 7. Implementation summary

**Wf47:** `Set Wf47 UI config` adds `enable_wg48_handoff: false`. After **Build sanitized polling receipt**, **IF Wg48 handoff enabled and accepted** (handoff true **and** `inspect_status: accepted`) → **Execute Workflow** with `workflowId: CONFIGURE_48_WORKFLOW_REFERENCE_IN_N8N_UI`; else → **Inspect polling result** only.

**Wg48:** **When Executed by Another Workflow** → **Normalize Wf47 callable receipt** → **Data Table - Load wg decision state** → **Correlate inbound to decision state** (same downstream as manual path). Manual + `external_receipt` path unchanged.

## 8. No-runtime confirmation

Cursor did not run n8n, import, activate workflows/schedule, Telegram runtime, or mutate Data Tables.

## 9. Forbidden actions NOT performed

No 49, PM-34, wf40/41/42, secrets, `data-tables/**`, production automation, Telegram Trigger, public webhook.

## 10. Validation commands

See final report (JSON parse, unique ids, active:false, handoff/callable checks, `git diff --check`).

## 11. Commit / remote hash

- Task commit (`workflow: add Wf47 Wg controlled handoff`): `771d03087d46ec5e3247ad7f97922b2cd8b03aad`
- Rolling report commit: see post-push `git ls-remote origin main`

## 12. Final status

**PASS** — Phase 1 controlled 47→48 handoff template **IMPLEMENTATION READY**. Phase 2 runtime **BLOCKED** until reimport + gate + manual 48 reference wiring.

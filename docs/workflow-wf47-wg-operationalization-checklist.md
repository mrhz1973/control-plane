# Wf47 → Wg operationalization — minimum readiness pointer

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wf47-wg-operationalization-checklist.md`  
**Canonical plan:** [workflow-wf47-wg-operationalization-plan.md](workflow-wf47-wg-operationalization-plan.md)  
**Status:** **PREP PASS** — pointer only. **Not activation. No runtime.**

This file is **not** a governance document. Governance lives in `PROJECT_VISION.md` (§7.9 anti-burocrazia / momentum) and in the **canonical plan**. This is only the **minimum readiness check** before the **one bounded final manual runtime rehearsal** described in the plan §4.

---

## Minimum readiness before final manual rehearsal

- [ ] Canonical plan read: `docs/workflow-wf47-wg-operationalization-plan.md` (bounded path = 1 import/reimport rehearsal + max 2 repeat manual runs, then advance or BLOCKED).
- [ ] Wf47 / Wg / Wh manual validations are **PASS** (see `docs/runtime/CURRENT_FRONTIER.md`).
- [ ] wf47 (47) / wg (48) / wh (49) templates exist on `main`, `active: false`, Manual Trigger only — `workflows/`.
- [ ] Test-only tables only: `wf47_polling_state_test`, `wg_decision_state_test` (NOT `control_plane_state`); CSV seeds in `data-tables/` per `docs/foundation/DATA_TABLE_CSV_CONVENTION.md`.
- [ ] Telegram credential **name** in n8n only (`CONTROL PLANE - Telegram Bot`); **no token in Git**. chat_id allowed only in config assets per PROJECT_VISION §10 gate 2026-05-31.
- [ ] No schedule / Telegram Trigger / public webhook; no mutation of workflow 40/41/42; PM-34 stays **BLOCKED**.

---

## Next gate

**One bounded Wf47/Wg/Wh final manual runtime rehearsal, test-only and inactive/off** (canonical plan §4): import/reimport rehearsal plus up to 2 repeat manual runs. After that, advance to the next real operational gate or mark BLOCKED with a concrete blocker. No optional scenario (`note_only` / `malformed` / `stale_closed`) testing unless a named risk appears. Non-deterministic test evidence is not PASS.

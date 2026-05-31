# Wf47 → Wg operationalization — increment 2 config checklist

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/workflow-wf47-wg-operationalization-checklist.md`  
**Parent plan:** [workflow-wf47-wg-operationalization-plan.md](workflow-wf47-wg-operationalization-plan.md) — **increment 2**  
**Status:** **PREP PASS** — no-runtime checklist only. **Not activation.**

Use this checklist to confirm Git and documentation readiness **before** increment 3 (manual inactive/off import rehearsal in n8n UI). Checking boxes here does **not** require opening n8n.

---

## Baseline (must remain true)

| Validation | State |
|------------|--------|
| Wf47 Data Table manual validation | **PASS** |
| Wg inbound Decision Packet state correlation manual validation | **PASS** |
| Wh combined inbound decision flow manual validation | **PASS** |
| Wf47 → Wg operationalization plan | **PREP PASS** |
| Telegram inbound operational automation | **NOT RUN / NOT ACTIVE** |
| PM-34 | **BLOCCATO** |

---

## Checklist — repository assets present

- [ ] `docs/workflow-wf-telegram-inbound-polling-getupdates.md` (Wf / Wf47 runbook)
- [ ] `docs/workflow-wg-telegram-inbound-decision-state-correlation.md` (Wg runbook)
- [ ] `docs/workflow-wh-wf47-wg-combined-inbound-decision-flow.md` (Wh runbook, manual PASS)
- [ ] `docs/workflow-wf47-wg-operationalization-plan.md` (increment order + blockers)
- [ ] `docs/foundation/DATA_TABLE_CSV_CONVENTION.md`
- [ ] `data-tables/wf47_polling_state_test.csv` (seed; do not edit in increment 2)
- [ ] `data-tables/wg_decision_state_test.csv` (seed; do not edit in increment 2)
- [ ] `data-tables/README.md`
- [ ] `docs/runtime/CURRENT_FRONTIER.md` reflects Wf47/Wg/Wh PASS and plan PREP PASS

---

## Checklist — workflow templates present (not modified in increment 2)

Confirm templates exist on `main` and were **not** changed by the increment 2 docs task:

- [ ] `workflows/wf-telegram-inbound-polling-getupdates.template.json` — workflow **47**, `active: false`, Manual Trigger only
- [ ] `workflows/wg-telegram-inbound-decision-state-correlation.template.json` — workflow **48**, `active: false`, Manual Trigger only
- [ ] `workflows/wh-wf47-wg-combined-inbound-decision-flow.template.json` — workflow **49**, `active: false`, Manual Trigger only

**Intent:** wf47 / wg / wh remain **manual / inactive / off** until a later user-attested gate explicitly records otherwise.

---

## Checklist — test Data Tables only

- [ ] Polling state table name: `wf47_polling_state_test` only (not `control_plane_state`)
- [ ] Decision state table name: `wg_decision_state_test` only (not `control_plane_state`)
- [ ] CSV seed convention understood: import/reset via n8n Data Tables → Import CSV from `data-tables/` when runtime gate allows
- [ ] No production Data Table usage in templates or runbooks for this path

---

## Checklist — credentials and secrets policy

- [ ] Telegram bot credential **name** in n8n only: `CONTROL PLANE - Telegram Bot` (per frontier asset block); **no** token in Git
- [ ] **chat_id** policy: allowed only in configuration assets per **PROJECT_VISION §10** gate 2026-05-31 (workflow JSON / CSV seeds); token still **forbidden**
- [ ] Redaction rules reviewed: `workflows/README.md`, `docs/WORKFLOW_EXPORT_STATUS.md` — no credential id/content, webhook/auth URL, API key, OAuth, PAT, chain-of-thought, tokenized URLs in commits
- [ ] No secrets added by increment 2 docs task

---

## Checklist — hard boundaries

- [ ] No mutation of workflow **40**, **41**, or **42** (production / MVP paths)
- [ ] No `control_plane_state` for Wf47/Wg/Wh test path
- [ ] PM-34 remains **BLOCCATO** — no unlock in docs or config
- [ ] No **Schedule Trigger** on inbound path (planning or templates)
- [ ] No **Telegram Trigger** on inbound path (We live blocked on HTTPS webhook)
- [ ] No **public webhook** / operational webhook URL in Git

---

## Checklist — fallback

- [ ] If template/table mapping is ambiguous: **stop**; do not activate workflows
- [ ] Fallback documented: manual Telegram / ChatGPT gate (human reads reply; no automated correlation)
- [ ] Test-table reset path: CSV reimport for `wf47_polling_state_test` / `wg_decision_state_test` only (future runtime gates)

---

## PASS criteria — increment 2 (this checklist PREP)

| Criterion | Required |
|-----------|----------|
| Checklist document complete | Yes |
| No runtime executed by Cursor | Yes |
| `workflows/**` untouched by increment 2 task | Yes |
| `data-tables/**` untouched by increment 2 task | Yes |
| No secrets in commit | Yes |
| Next gate identified | Increment **3** — user-attested manual inactive/off import rehearsal |

**Increment 2 PREP PASS** means the checklist exists and frontier is updated. **User review** of each box may happen offline; **increment 3** is the first gate that requires n8n UI.

---

## BLOCKED criteria — increment 2

- Missing required docs or template paths listed above
- Ambiguity about which table or workflow number applies to Wf47/Wg/Wh
- Any step that **requires** n8n UI, import, or execution to complete increment **2** (that is increment **3**, not 2)
- Any request to schedule, activate workflows, or use production `control_plane_state` under the guise of “checklist completion”

---

## Next gate

**Next gate: increment 3 manual inactive/off import rehearsal of wf47/wg/wh in n8n UI, one gate at a time, user-attested, no schedule, no production Data Table, no PM-34.**

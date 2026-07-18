# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è uno stato compatto, non un archivio storico. Evidenza completa in `docs/sessions/`, Git history, `LAST_CURSOR_REPORT.md` e `LAST_HANDOFF_VERIFY.md`.

Ultimo aggiornamento: 2026-07-18 — D-0065-W docs record D-0062/D-0063/D-0064 + workflow-authoring boundary + repository-based Cursor routing; Gate E `OPERATOR_DECISION_PENDING`.

---

## Stato operativo attuale

- Foundation completa. **PROJECT_VISION v2.19:** GPT-B owns n8n workflow authoring; Cursor is repository/code implementer; Cursor routing is repository/path/branch/task (color labels non-canonical).
- Workflow **40/42 attivi** e invariati; workflow **41 off**.
- **PM-34 BLOCKED**.
- **`n8n_ready=false`**.
- **`l5_activation_authorized=false`**.
- Gate E full: **NOT_CLAIMED** / `OPERATOR_DECISION_PENDING`.
- Nessun loop operativo permanente dichiarato.
- Nessuna autorizzazione permanente di Schedule wf47.

## D-0065-W — governance + evidence reconciliation (docs-only)

- Decision provenance: `direct_operator_message`.
- Task: record D-0062/D-0063/D-0064 operator-attested runtime evidence; canonize GPT-B/Cursor n8n authoring boundary; remove color-based Cursor routing from canonical instructions.
- Cursor did **not** author or modify any workflow; `workflows/**` untouched.
- Cursor did **not** independently verify n8n runtime.
- Evidence session: `docs/sessions/2026-07-18-control-plane-d-0062-e-d-0065-w-wf47-wf48-runtime-pass-and-workflow-authoring-boundary.md`.

## D-0062-E — fresh callable wf47 → official wf48

```yaml
result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_FRESH_CALLABLE_WF47_TO_OFFICIAL_WF48
decision_id: D-0062-T4
selected_option: "4"
update_id: 986228609
wf45_telegram_send_ok: true
wf45_message_id: 1213
wf45_http_status: 200
wf45_classifier_validated: false
wf45_open_action: insert
wf45_fan_out_items_in: 1
wf47_inspect_status: accepted
wf48_inspect_status: closed
wf48_prior_status: open
wf48_state_persisted: true
store_final: closed
open_count_after: 0
```

**Limitation:** `update_id` **986228609** is numerically equal to the `update_id` previously recorded for **D-0060-T5**. Do **not** claim globally unique / non-reused update_id, or freshness proven solely by update_id. Allowed freshness claim: new decision `D-0062-T4`, new wf45 open/send, newly exercised callable wf47→official wf48 path.

## D-0063-E — bounded scheduled wf47 → official wf48

Initial scheduled run (no PASS):

```yaml
inspect_status: blocked
block_reason: allowed_chat_not_configured
allowed_chat_configured: false
open_decision_ids_count: 1
```

Published wf47 lacked usable `allowed_chat_id`; guard failed closed; configuration corrected from a previous successful execution; no additional Telegram option message required for the successful run.

Successful scheduled pickup + official wf48 via Execute Workflow:

```yaml
result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_SCHEDULED_WF47_TO_OFFICIAL_WF48
decision_id: D-0063-T4
selected_option: "4"
update_id: 986228610
wf47_inspect_status: accepted
wf48_inspect_status: closed
wf48_prior_status: open
wf48_state_persisted: true
```

Later scheduled scan (not a second PASS / not a second close):

```yaml
inspect_status: blocked
block_reason: no_parseable_decision_response
open_decision_ids_count: 0
last_handled_update_id: 986228610
```

## D-0064-E — official wf48 callable publication dependency

- wf47 could not be published while Execute Workflow referenced an unpublished official wf48.
- Direct operator decision: publish official wf48 as a **triggerless callable sub-workflow** so wf47 can call it.
- No autonomous Schedule on wf48; no Telegram Trigger; no public webhook; no autonomous trigger.
- Do **not** describe wf48 as autonomous permanent automation.

## Teardown evidence boundary

```yaml
teardown_instruction_issued: true
teardown_final_state_independently_verified: false
teardown_final_runtime_state: NOT_VERIFIED_IN_SUPPLIED_EVIDENCE
```

Instructed after D-0063: disable wf47 Schedule; restore `enable_wg48_handoff=false`; stop recurring wf47 executions; no additional Telegram; wf48 may remain published only as triggerless callable. Final teardown state **not** independently verified in supplied evidence — do not infer completion from conversational continuation.

## Prior arcs (compact)

- **D-0060-W / D-0061-W:** official wf48 options 4/5 manual `external_receipt` PASS; collapse fan-out canonized. Session: `docs/sessions/2026-07-18-control-plane-d-0060-w-d-0061-w-wf48-official-options-4-5-runtime-pass.md`.
- **D-0059-W:** repository parser 1–5 canonization. Session: `docs/sessions/2026-07-18-control-plane-d-0059-w-wf48-parser-1-5-canonization.md`.

## Inbound / decision-store asset state

| Asset | Current state |
|---|---|
| **45 / Wd** | D-0062 fresh open/send (`D-0062-T4`, `message_id=1213`); prior scope-limited history; **not** permanent end-to-end automation. |
| **46 / We** | `DEPRECATED_AS_PRIMARY_PATH`; retained inactive webhook fallback; We live PASS=false. |
| **47 / Wf** | D-0062 manual callable PASS; D-0063 bounded scheduled pickup PASS; permanent Schedule **not** authorized; safe default `enable_wg48_handoff=false`; final teardown state **not** independently verified from supplied evidence. |
| **48 / Wg** | Official callable close PASS (D-0062/D-0063); published as triggerless callable dependency (D-0064); **no** autonomous trigger claim; parser 1–5 + collapse canonized. |
| **49 / Wh** | Rehearsal PASS history; inactive. |
| **decision-store** | `D-0062-T4` closed; `D-0063-T4` closed; observed final `open_count=0`. |

## Claim boundaries

**Claimed:** D-0062 fresh callable path; D-0063 bounded scheduled path; option 4 correlated/persisted; official wf48 callable path worked; `allowed_chat` fail-closed then corrected; fixtures closed; observed `open_count=0`; GPT-B owns n8n authoring; Cursor prohibited from independent workflow authoring; Cursor routing repository-based.

**Not claimed:** globally unique / non-reused D-0062 `update_id`; permanent polling loop; permanent wf47 Schedule; Gate E full; L5; `l5_activation_authorized=true`; `n8n_ready=true`; PM-34 unlocked; complete DP→implementation→verification automation; Telegram Trigger; public webhook; autonomous wf48; independently verified final teardown; independent n8n verification by Cursor.

## Active blockers and next gate

- **PM-34:** `BLOCKED`.
- **L5:** `l5_activation_authorized=false`.
- **Gate E:** `OPERATOR_DECISION_PENDING` / full **NOT_CLAIMED**.
- Permanent Schedule authorization: **no**.
- Teardown final state: **NOT_VERIFIED_IN_SUPPLIED_EVIDENCE**.
- Next real gate: dedicated Decision Packet (e.g. independently verify teardown / Gate E / L5) — **not** auto-started.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook.
- NO PM-34 unlock.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO permanent Schedule activation without a separate authorized gate.
- NO L5 or Gate E full PASS declaration without dedicated decision and evidence.
- NO Cursor autonomous n8n workflow authoring.
- NO color-based Cursor routing in canonical instructions.

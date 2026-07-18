# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è uno stato compatto, non un archivio storico. Evidenza completa in `docs/sessions/`, Git history, `LAST_CURSOR_REPORT.md` e `LAST_HANDOFF_VERIFY.md`.

Ultimo aggiornamento: 2026-07-18 — D-0067-W persist D-0066-E teardown verification closure; Gate E `OPERATOR_DECISION_PENDING`.

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

## D-0067-W / D-0066-E — teardown verification closure

- **D-0066-E** selected_option `"3"` · `decision_provenance=direct_operator_message` · `mandate=operator_runtime_inventory_plus_cursor_verify_only`.
- Operator completed read-only n8n inspection (`inspection_timestamp_utc=2026-07-18T18:30:27Z`).
- Cursor verify-only: `PASS_REMOTE_DOCUMENTAL_TEARDOWN_VERIFICATION` at HEAD `1eb2be6af07196506b6849c19ecd36509a3f810f`.
- **D-0067-W** docs-only persistence of that closure.

```yaml
teardown_operator_inspection_completed: true
teardown_inventory_cursor_documentally_verified: true
teardown_direct_n8n_observation_by_cursor: false
teardown_result: PASS_REMOTE_DOCUMENTAL_TEARDOWN_VERIFICATION
teardown_evidence_gap: CLOSED
```

**Provenance limitation:** runtime evidence is entirely operator-attested. Cursor did **not** authenticate screenshot pixels and did **not** independently observe n8n. The PASS documents consistency between the operator attestation and repository records, not direct runtime verification by Cursor.

Operator-attested teardown inventory (documentally verified):

- **wf45:** inactive, unpublished, Schedule disabled, no autonomous trigger.
- **wf47:** inactive, unpublished, Schedule disabled, `enable_wg48_handoff=false`.
- **wf48:** inactive; `published=true` only as `triggerless_callable_only`; no autonomous trigger; Schedule disabled.
- **wf40/42:** active, published, unchanged; **wf41:** off, unchanged.
- No duplicate/temp wf47/wf48 copies (including D-0052/D-0058).
- Store `control_plane_decisions_test`: `open_count=0`; `D-0062-T4`/`D-0063-T4` closed option `"4"`.
- Inspection safety: no Telegram; executions `0`; runtime mutations `0`.

Evidence: `docs/sessions/2026-07-18-control-plane-d-0066-e-d-0067-w-teardown-verification-closure.md`.

## D-0065-W — governance + evidence reconciliation (docs-only)

- Decision provenance: `direct_operator_message`.
- Recorded D-0062/D-0063/D-0064 operator-attested runtime evidence; canonized GPT-B/Cursor n8n authoring boundary; repository-based Cursor routing.
- Commit independently repository-verified: `1eb2be6af07196506b6849c19ecd36509a3f810f`.
- Session: `docs/sessions/2026-07-18-control-plane-d-0062-e-d-0065-w-wf47-wf48-runtime-pass-and-workflow-authoring-boundary.md`.

## D-0062-E / D-0063-E / D-0064-E (compact)

- **D-0062:** fresh callable wf47→official wf48 scope-limited PASS (`D-0062-T4` / `"4"` / `update_id=986228609`); update_id uniqueness **not** claimed.
- **D-0063:** bounded scheduled wf47→official wf48 PASS (`D-0063-T4` / `"4"` / `update_id=986228610`); initial `allowed_chat_not_configured` fail-closed then corrected.
- **D-0064:** official wf48 published as triggerless callable dependency (not autonomous automation).

## Prior arcs (compact)

- **D-0060-W / D-0061-W:** official wf48 options 4/5 manual `external_receipt` PASS; collapse fan-out canonized.
- **D-0059-W:** repository parser 1–5 canonization.

## Inbound / decision-store asset state

| Asset | Current state |
|---|---|
| **45 / Wd** | Inactive/unpublished after D-0066 teardown inventory; D-0062 fresh open/send history retained; **not** permanent automation. |
| **46 / We** | `DEPRECATED_AS_PRIMARY_PATH`; retained inactive webhook fallback; We live PASS=false. |
| **47 / Wf** | Inactive/unpublished; Schedule disabled; `enable_wg48_handoff=false`; permanent Schedule **not** authorized; D-0062/D-0063 PASS history retained. |
| **48 / Wg** | Inactive; published **only** as triggerless callable (D-0064/D-0066); no autonomous trigger; parser 1–5 + collapse canonized. |
| **49 / Wh** | Rehearsal PASS history; inactive. |
| **decision-store** | `D-0062-T4` closed option `"4"`; `D-0063-T4` closed option `"4"`; `open_count=0`. |

## Claim boundaries

**Claimed:** D-0066 option 3; operator read-only inventory complete; Cursor documental teardown verification PASS; teardown evidence gap **CLOSED**; wf47/wf48 safe teardown states per inventory; decision-store coherent; no inspection mutation; prior D-0062/D-0063 scope-limited PASSes; GPT-B owns n8n authoring.

**Not claimed:** Cursor independently observed n8n; Cursor authenticated screenshot pixels; new functional/callable/E2E PASS; L5; Gate E full; permanent Schedule; `n8n_ready=true`; PM-34 unlocked; autonomous wf48.

## Active blockers and next gate

- **PM-34:** `BLOCKED`.
- **L5:** `l5_activation_authorized=false`.
- **Gate E:** `OPERATOR_DECISION_PENDING` / full **NOT_CLAIMED**.
- Permanent Schedule authorization: **no**.
- Next real gate: dedicated Decision Packet (Gate E / L5) — **not** auto-started.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook.
- NO PM-34 unlock.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO permanent Schedule activation without a separate authorized gate.
- NO L5 or Gate E full PASS declaration without dedicated decision and evidence.
- NO Cursor autonomous n8n workflow authoring.
- NO color-based Cursor routing in canonical instructions.
- NO describing D-0066/D-0067 as independent n8n runtime verification by Cursor.

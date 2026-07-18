# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è uno stato compatto, non un archivio storico. Evidenza completa in `docs/sessions/`, Git history, `LAST_CURSOR_REPORT.md` e `LAST_HANDOFF_VERIFY.md`.

Ultimo aggiornamento: 2026-07-18 — D-0070-W persist D-0069-E Gate E closure; Gate E PASS/CLOSED.

---

## Stato operativo attuale

- Foundation completa. **PROJECT_VISION v2.19:** GPT-B owns n8n workflow authoring; Cursor is repository/code implementer; Cursor routing is repository/path/branch/task (color labels non-canonical).
- Workflow **40/42 attivi** e invariati; workflow **41 off**.
- **PM-34 BLOCKED**.
- **`n8n_ready=false`**.
- **`l5_activation_authorized=false`**.
- Gate E full: **PASS** / `CLOSED` (`gate_e_closure_basis=cumulative_existing_evidence`).
- Gate E closure: **no new runtime execution**; runtime evidence remains **operator-attested**; repository consistency verified through **D-0068-V**.
- **L5** remains separate and unauthorized (`L5_PASS: NOT_CLAIMED`).
- Nessun loop operativo permanente dichiarato.
- Nessuna autorizzazione permanente di Schedule wf47.

## D-0069-E / D-0070-W — Gate E closure

- **D-0069-E** selected_option `"1"` · `decision_provenance=direct_operator_message` · `operator_decision_timestamp_utc=2026-07-18T19:53:25Z`.
- **D-0070-W** docs-only persistence of that Gate E closure decision.

```yaml
decision_id: D-0069-E
selected_option: "1"
decision_provenance: direct_operator_message
operator_decision_timestamp_utc: "2026-07-18T19:53:25Z"

Gate_E_full: PASS
Gate_E_status: CLOSED
gate_e_closure_basis: cumulative_existing_evidence

new_runtime_executed_for_closure: false
runtime_evidence_source: operator_attested

repository_consistency_verified_by_cursor_at:
  - 1eb2be6af07196506b6849c19ecd36509a3f810f
  - 38915b43c7c6dad26fed6274c6f4939222c1a7be

teardown_evidence_gap: CLOSED
```

**Transition:** Gate E moved from prior pending / not-claimed current-state to `Gate_E_full: PASS` / `Gate_E_status: CLOSED` by direct operator decision on cumulative existing evidence.

**Provenance:** The Gate E full PASS is a direct operator decision based on cumulative existing evidence. Runtime evidence remains operator-attested and scope-limited at its original sources. Cursor did not independently observe n8n and did not authenticate screenshot pixels. No new runtime execution was performed for Gate E closure.

Evidence accepted cumulatively:

- **D-0062-E:** `PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_FRESH_CALLABLE_WF47_TO_OFFICIAL_WF48`
- **D-0063-E:** `PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_SCHEDULED_WF47_TO_OFFICIAL_WF48`
- **D-0064-E:** wf48 published as triggerless callable dependency (not autonomous automation)
- **D-0066-E / D-0067-W:** operator-attested teardown inventory; teardown evidence gap **CLOSED**
- **D-0068-V:** `PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED` for commit `38915b43c7c6dad26fed6274c6f4939222c1a7be`

**Gate E / L5 separation:** Gate E closure does **not** authorize or imply L5. `L5_PASS: NOT_CLAIMED` · `l5_activation_authorized: false`.

Evidence: `docs/sessions/2026-07-18-control-plane-d-0069-e-d-0070-w-gate-e-closure.md`.

## D-0067-W / D-0066-E — teardown verification closure

- **D-0066-E** selected_option `"3"` · `decision_provenance=direct_operator_message` · `mandate=operator_runtime_inventory_plus_cursor_verify_only`.
- Operator completed read-only n8n inspection (`inspection_timestamp_utc=2026-07-18T18:30:27Z`).
- Cursor verify-only: `PASS_REMOTE_DOCUMENTAL_TEARDOWN_VERIFICATION` at HEAD `1eb2be6af07196506b6849c19ecd36509a3f810f`.
- **D-0067-W** docs-only persistence of that closure.
- **D-0068-V** independently verified D-0067 docs persistence through `38915b43c7c6dad26fed6274c6f4939222c1a7be`.

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

**Claimed:** D-0069-E option `"1"` selected directly by operator; Gate E full **PASS**; Gate E status **CLOSED**; cumulative evidence accepted by direct operator decision; no new runtime executed for closure; D-0062/D-0063 scope-limited runtime PASS evidence accepted cumulatively; D-0064 callable-only wf48 dependency retained; teardown evidence gap **CLOSED**; D-0068 independently verified D-0067 docs persistence through `38915b43`; D-0066 option 3; operator read-only inventory complete; Cursor documental teardown verification PASS; GPT-B owns n8n authoring.

**Not claimed:** L5 PASS; L5 authorization; new functional runtime PASS; new callable runtime PASS; Cursor independently observed n8n; Cursor authenticated screenshot pixels; permanent Schedule; `n8n_ready=true`; PM-34 unlocked; autonomous wf48.

## Active blockers and next gate

- **PM-34:** `BLOCKED`.
- **L5:** `l5_activation_authorized=false` · `L5_PASS: NOT_CLAIMED`.
- **Gate E:** **CLOSED** (`Gate_E_full: PASS`).
- Permanent Schedule authorization: **no**.
- Next real gate: **L5** — requires a separate dedicated Decision Packet; **not** auto-authorized and **not** auto-started.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook.
- NO PM-34 unlock.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO permanent Schedule activation without a separate authorized gate.
- NO L5 PASS or `l5_activation_authorized=true` without a separate dedicated Decision Packet.
- NO Cursor autonomous n8n workflow authoring.
- NO color-based Cursor routing in canonical instructions.
- NO describing Gate E closure / D-0066/D-0067 as independent n8n runtime verification by Cursor.
- NO claiming a new functional/callable runtime PASS from D-0069/D-0070.
- NO autonomous wf48.

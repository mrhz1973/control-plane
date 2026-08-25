# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è uno stato compatto, non un archivio storico. Evidenza completa in `docs/sessions/`, Git history, `LAST_CURSOR_REPORT.md` e `LAST_HANDOFF_VERIFY.md`.

Ultimo aggiornamento: 2026-08-25 — D-0081-V PASS certifica documentalmente D-0080-W through `91847807...`; migrazione architettura multi-planner/Cursor in draft PR #9, docs-only.

---

## Stato operativo attuale

- Foundation su `main` resta quella precedente finché la draft PR #9 non viene mergiata; la nuova architettura multi-planner/Cursor è già accettata dall'operatore ma ancora in migrazione docs-only.
- Workflow **40/42 attivi** e invariati; workflow **41 off**.
- **PM-34 BLOCKED**.
- **`n8n_ready=false`**.
- **`l5_activation_authorized=false`** · **`l5_runtime_authorized=false`** · **`l5_bounded_pilot_runtime_authorized_current=false`**.
- Gate E full: **PASS** / `CLOSED` (`gate_e_closure_basis=cumulative_existing_evidence`).
- **Permanent L5 assessment:** `DEFERRED_PENDING_ENDURANCE_EVIDENCE`.
- **L5_PASS:** `NOT_CLAIMED`.
- Bounded D-0074-E pilot PASS retained within original scope; one-shot authorization **consumed**.
- Permanent Schedule **not** authorized; endurance runtime **not** authorized.
- Scope/evidence plan: `docs/runtime/L5_PERMANENT_SCOPE_AND_ENDURANCE_PLAN.md` (planning only).
- **wf47** inactive / unpublished / Schedule disabled / `enable_wg48_handoff=false`.
- Nessun loop operativo permanente dichiarato.
- **D-0081-V:** `PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED` through `91847807bbc4d7b7f63d8e3b3fc48fdfc72f4699`, `actor_relation=intra_actor_self_verify`, independent third-party verification `false`.

## D-0081-V — repository verify-only of D-0080-W

D-0081-V è stato eseguito da Cursor il 2026-08-25 come task strettamente read-only e ha certificato documentalmente il commit D-0080-W `91847807...`.

```yaml
verification_task: D-0081-V
verification_type: documental_repository_verify_only
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED
actor_relation: intra_actor_self_verify
independent_third_party_verification: false
certified_commit: 91847807bbc4d7b7f63d8e3b3fc48fdfc72f4699
previous_verified_through_commit: 218cb99b4a4a97429b44c2e5a9232497a0948450
new_verified_through_commit: 91847807bbc4d7b7f63d8e3b3fc48fdfc72f4699
runtime_executed: false
runtime_actions_by_cursor: 0
files_modified_by_verification: 0
commits_created_by_verification: 0
pushes_by_verification: 0
```

Verified:

- local `main` clean;
- `HEAD == origin/main == ls-remote main == 91847807...` at verification time;
- exact D-0080 delta = six expected docs paths;
- `git diff --check` PASS;
- no `workflows/**`, `tools/**`, `scripts/**` or executable runtime assets changed;
- all 15 documental invariants requested by D-0081-V PASS.

Evidence: `docs/sessions/2026-08-25-control-plane-d-0081-v-d0080w-repository-verify-pass.md`.

**Meaning:** the historical repository gate immediately after D-0080-W is now CLOSED. This does not authorize any runtime or permanent automation.

## D-0079-E / D-0080-W — permanent L5 deferred pending endurance evidence

- **D-0079-E** selected_option `"3"` · `decision_provenance=direct_operator_message` · `operator_decision_date_utc=2026-07-19` · `operator_decision_timestamp_utc=NOT_CAPTURED_EXACTLY`.
- **D-0080-W** docs-only: persist deferral + create L5 Scope Document + endurance evidence plan + contextual D-0078-V backfill + close D-0078-V-F1 wording.
- **D-0081-V** now verifies D-0080-W through `91847807...` with intra-actor provenance.

```yaml
decision_id: D-0079-E
selected_option: "3"
decision_provenance: direct_operator_message
operator_decision_date_utc: 2026-07-19
operator_decision_timestamp_utc: NOT_CAPTURED_EXACTLY

l5_permanent_assessment: DEFERRED_PENDING_ENDURANCE_EVIDENCE
L5_PASS: NOT_CLAIMED
l5_activation_authorized: false
l5_runtime_authorized: false
endurance_runtime_authorized: false
permanent_schedule_authorized: false
bounded_pilot_authorization_consumed: true
l5_bounded_pilot_runtime_authorized_current: false

scope_document: docs/runtime/L5_PERMANENT_SCOPE_AND_ENDURANCE_PLAN.md
document_status: DRAFT_SCOPE_APPROVED_FOR_PLANNING_ONLY
runtime_authorized_by_document: false

d0078v_verify_result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED
d0078v_verified_commit: 218cb99b4a4a97429b44c2e5a9232497a0948450
d0078v_actor_relation: intra_actor_self_verify
d0078v_independent_third_party_verification: false
backfill_status: COMPLETED_CONTEXTUALLY_IN_D0080W
previous_verified_through_commit: cafd3e5d435a2a24aa38e95becaab217ec3cc09d
new_verified_through_commit_after_d0081v: 91847807bbc4d7b7f63d8e3b3fc48fdfc72f4699

finding_id: D-0078-V-F1
previous_status: OPEN_NON_BLOCKING
new_status: CLOSED_CONTEXTUALLY_IN_D0080W
correction_kind: documentation_wording_only
runtime_impact: none
```

**Meaning:** permanent L5 activation deferred; bounded pilot PASS remains valid in original scope; Scope Document and endurance package defined for planning only; no endurance runtime authorized by D-0079-E; any endurance execution and permanent claim require later explicit Decision Packets.

Evidence: `docs/sessions/2026-07-19-control-plane-d-0079-e-d-0080-w-l5-permanent-deferred.md` + D-0081-V session above.

## D-0074-E / D-0077-W — bounded L5 operational pilot

- **D-0074-E** selected_option `"1"` · `direct_operator_message` · timestamp `NOT_CAPTURED_EXACTLY`.
- **D-0077-W** docs-only persistence of operator-attested pilot evidence.
- **D-0078-V** documentally verified D-0077 through `218cb99b4a4a97429b44c2e5a9232497a0948450` with `actor_relation=intra_actor_self_verify`.

```yaml
result: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L5_BOUNDED_OPERATIONAL_PILOT
pilot_decision_id: D-9011-T
pilot_selected_option: "1"
pilot_update_id: 986228611
pilot_open_count_final: 0
wf47_execution_count: 5
bounded_limits_result: PASS
bounded_pilot_authorization_consumed: true
L5_PASS: NOT_CLAIMED
```

Evidence: `docs/sessions/2026-07-19-control-plane-d-0074-e-d-0077-w-l5-bounded-pilot-pass.md`.

## D-0069-E / D-0070-W — Gate E closure

- **D-0069-E** selected_option `"1"` · `decision_provenance=direct_operator_message` · `operator_decision_timestamp_utc=2026-07-18T19:53:25Z`.
- **D-0070-W** docs-only persistence of that Gate E closure decision.
- **D-0071-V** documentally verified D-0070 through `cafd3e5d435a2a24aa38e95becaab217ec3cc09d` with `actor_relation=intra_actor_self_verify`.

```yaml
Gate_E_full: PASS
Gate_E_status: CLOSED
gate_e_closure_basis: cumulative_existing_evidence
new_runtime_executed_for_closure: false
runtime_evidence_source: operator_attested
teardown_evidence_gap: CLOSED
```

**Gate E / L5 separation:** Gate E closure does **not** authorize or imply L5.

Evidence: `docs/sessions/2026-07-18-control-plane-d-0069-e-d-0070-w-gate-e-closure.md`.

## D-0067-W / D-0066-E — teardown verification closure

- **D-0066-E** selected_option `"3"` · operator read-only n8n inspection; Cursor documental teardown verification PASS.
- **D-0067-W** docs-only persistence; **D-0068-V** verified through `38915b43c7c6dad26fed6274c6f4939222c1a7be`.

```yaml
teardown_result: PASS_REMOTE_DOCUMENTAL_TEARDOWN_VERIFICATION
teardown_evidence_gap: CLOSED
teardown_direct_n8n_observation_by_cursor: false
```

## D-0065-W — governance + evidence reconciliation (docs-only)

- Recorded D-0062/D-0063/D-0064 operator-attested runtime evidence; GPT-B/Cursor n8n authoring boundary; repository-based Cursor routing.
- Commit independently repository-verified: `1eb2be6af07196506b6849c19ecd36509a3f810f`.

## D-0062-E / D-0063-E / D-0064-E (compact)

- **D-0062:** fresh callable wf47→official wf48 scope-limited PASS (`D-0062-T4` / `"4"` / `update_id=986228609`).
- **D-0063:** bounded scheduled wf47→official wf48 PASS (`D-0063-T4` / `"4"` / `update_id=986228610`).
- **D-0064:** official wf48 published as triggerless callable dependency (not autonomous automation).

## Prior arcs (compact)

- **D-0060-W / D-0061-W:** official wf48 options 4/5 manual `external_receipt` PASS; collapse fan-out canonized.
- **D-0059-W:** repository parser 1–5 canonization.

## Inbound / decision-store asset state

| Asset | Current state |
|---|---|
| **45 / Wd** | Inactive/unpublished after D-0066 teardown inventory; D-0062 fresh open/send history retained; **not** permanent automation. |
| **46 / We** | `DEPRECATED_AS_PRIMARY_PATH`; retained inactive webhook fallback; We live PASS=false. |
| **47 / Wf** | Inactive/unpublished; Schedule disabled; `enable_wg48_handoff=false`; permanent Schedule **not** authorized; D-0062/D-0063 + D-0074 bounded pilot history retained (one-shot consumed). |
| **48 / Wg** | Inactive; published **only** as triggerless callable; no autonomous trigger. |
| **49 / Wh** | Rehearsal PASS history; inactive; excluded from D-0074 pilot; excluded from permanent L5 planning unless separately authorized. |
| **decision-store** | `D-0062-T4` / `D-0063-T4` closed option `"4"`; **`D-9011-T` closed option `"1"` `update_id=986228611`**; `open_count=0`. |

## Claim boundaries

**Claimed:** D-0081-V documentally verifies D-0080-W through `91847807...` with intra-actor provenance; D-0079-E option `"3"` selected directly by operator; permanent L5 deferred; scope and endurance evidence requirements defined (planning only); D-0078-V verified `218cb99`; D-0078-V-F1 wording closed; bounded pilot PASS retained; Gate E PASS/CLOSED; GPT-B owns n8n authoring under the current main foundation.

**Not claimed:** independent third-party verification; permanent L5 PASS; runtime authorization; endurance runtime authorization; permanent Schedule; autonomous wf48; PM-34 unlock; `n8n_ready=true`; permanent automation from D-0081-V.

## Active blockers and next gate

- **Historical D-0080 repository verify gate:** **CLOSED by D-0081-V PASS**.
- **PM-34:** `BLOCKED`.
- **L5:** `L5_PASS: NOT_CLAIMED` · activation/runtime/endurance authorization **false** · permanent assessment **DEFERRED_PENDING_ENDURANCE_EVIDENCE**.
- **Gate E:** **CLOSED** (`Gate_E_full: PASS`).
- Permanent Schedule authorization: **no**.
- **Immediate repository work:** complete/review/merge the accepted docs-only architecture migration in GitHub issue #8 / draft PR #9, preserving all runtime invariants.
- **Next runtime Decision Packet remains separate:** approval/authorization of the bounded endurance evidence package; it is **not** auto-started by the architecture migration. Permanent L5 claim and permanent Schedule remain later separate gates.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook.
- NO PM-34 unlock.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO permanent Schedule activation without a separate authorized gate.
- NO L5 PASS or `l5_activation_authorized=true` without a separate dedicated Decision Packet.
- NO endurance runtime without a later explicit Decision Packet.
- NO treating the bounded pilot PASS as L5_PASS or permanent automation.
- NO Cursor autonomous n8n workflow authoring.
- NO color-based Cursor routing in canonical instructions.
- NO describing D-0071-V / D-0078-V / D-0081-V as independent third-party verification.
- NO autonomous wf48.
- NO treating D-0081-V as runtime evidence or runtime authorization.

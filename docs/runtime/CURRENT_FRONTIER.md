# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è uno stato compatto, non un archivio storico. Evidenza completa in `docs/sessions/`, Git history, `LAST_CURSOR_REPORT.md` e `LAST_HANDOFF_VERIFY.md`.

Ultimo aggiornamento: 2026-07-19 — D-0077-W persist D-0074-E bounded L5 operational pilot; L5_PASS NOT_CLAIMED.

---

## Stato operativo attuale

- Foundation completa. **PROJECT_VISION v2.19:** GPT-B owns n8n workflow authoring; Cursor is repository/code implementer; Cursor routing is repository/path/branch/task (color labels non-canonical).
- Workflow **40/42 attivi** e invariati; workflow **41 off**.
- **PM-34 BLOCKED**.
- **`n8n_ready=false`**.
- **`l5_activation_authorized=false`** · **`l5_runtime_authorized=false`** · **`l5_bounded_pilot_runtime_authorized_current=false`**.
- Gate E full: **PASS** / `CLOSED` (`gate_e_closure_basis=cumulative_existing_evidence`).
- **One bounded L5 operational pilot completed** (operator-attested, scope-limited, test-only); **no permanent automation**.
- Bounded pilot one-shot authorization **consumed**; current runtime authorization is **false**.
- **L5_PASS:** `NOT_CLAIMED`.
- **wf47** returned to inactive / unpublished / Schedule disabled / `enable_wg48_handoff=false`.
- Nessun loop operativo permanente dichiarato.
- Nessuna autorizzazione permanente di Schedule wf47.

## D-0074-E / D-0077-W — bounded L5 operational pilot

- **D-0074-E** selected_option `"1"` · `decision_provenance=direct_operator_message` · `operator_decision_date_utc=2026-07-18` · `operator_decision_timestamp_utc=NOT_CAPTURED_EXACTLY`.
- **D-0077-W** docs-only persistence of operator-attested pilot evidence + contextual D-0071-V rolling backfill.
- Numbering: D-0075-W rejected (never executed); D-0076-V not executed; D-0077-W is the next substantive persistence.

```yaml
decision_id: D-0074-E
selected_option: "1"
decision_provenance: direct_operator_message
operator_decision_date_utc: 2026-07-18
operator_decision_timestamp_utc: NOT_CAPTURED_EXACTLY

pilot_type: bounded_operational_pilot
pilot_decision_id: D-9011-T
pilot_selected_option: "1"
pilot_update_id: 986228611
pilot_open_count_final: 0
wf47_execution_count: 5
wf47_execution_count_max: 5
pilot_elapsed_first_to_last_minutes: 4
pilot_window_max_minutes: 5
bounded_limits_result: PASS

result: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L5_BOUNDED_OPERATIONAL_PILOT
pilot_result_source: direct_operator_attestation

bounded_pilot_authorized_historically: true
bounded_pilot_authorization_consumed: true
l5_bounded_pilot_runtime_authorized_current: false
l5_runtime_authorized: false
l5_activation_authorized: false
L5_PASS: NOT_CLAIMED

diagnostic_finding: D-0074-E-F1
diagnostic_finding_status: NON_BLOCKING_DIAGNOSTIC_INCONSISTENCY
follow_up_required: false
follow_up_trigger: future_gate_may_reopen_investigation

teardown_wf47_active: false
teardown_wf47_published: false
teardown_wf47_schedule_enabled: false
teardown_enable_wg48_handoff: false

d0071v_verify_only_result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED
d0071v_verified_commit: cafd3e5d435a2a24aa38e95becaab217ec3cc09d
d0071v_actor_relation: intra_actor_self_verify
backfill_status: COMPLETED_CONTEXTUALLY_IN_D0077W
previous_verified_through_commit: 38915b43c7c6dad26fed6274c6f4939222c1a7be
new_verified_through_commit: cafd3e5d435a2a24aa38e95becaab217ec3cc09d
backfill_basis: D-0071-V
```

**Pilot summary:** operator opened `D-9011-T`; temporary `enable_wg48_handoff=true` + one-minute Schedule + publish for bounded window; one Telegram response `dp:D-9011-T:1`; valid close `update_id=986228611`; five successful wf47 executions within limits; immediate teardown; post-close observation `open_count=0`.

**Timezone fields (evidence packet):**
- `closed_at_utc: 2026-07-18T23:52:51.144Z`
- `closed_at_local_utc_plus_2: 2026-07-19T01:52:51.144`
- `wf47_first_execution_local_utc_plus_2: 2026-07-19T01:51:51`
- `wf47_last_execution_local_utc_plus_2: 2026-07-19T01:55:51`

**Diagnostic (D-0074-E-F1):** valid close receipt reported `allowed_chat_configured=false`; subsequent post-close polling reported `allowed_chat_configured=true`. Non-blocking; root cause **not** claimed; follow-up not required now.

**Provenance:** D-0074-E runtime evidence is direct operator-attested evidence from the n8n UI, supplied runtime outputs and screenshots. Cursor did not independently observe n8n, did not authenticate screenshot pixels and did not execute runtime. D-0071-V is intra-actor documental verification (Cursor on Cursor), not independent third-party.

Evidence: `docs/sessions/2026-07-19-control-plane-d-0074-e-d-0077-w-l5-bounded-pilot-pass.md`.

## D-0069-E / D-0070-W — Gate E closure

- **D-0069-E** selected_option `"1"` · `decision_provenance=direct_operator_message` · `operator_decision_timestamp_utc=2026-07-18T19:53:25Z`.
- **D-0070-W** docs-only persistence of that Gate E closure decision.
- **D-0071-V** independently (documentally) verified D-0070 through `cafd3e5d435a2a24aa38e95becaab217ec3cc09d` with `actor_relation=intra_actor_self_verify`.

```yaml
Gate_E_full: PASS
Gate_E_status: CLOSED
gate_e_closure_basis: cumulative_existing_evidence
new_runtime_executed_for_closure: false
runtime_evidence_source: operator_attested
teardown_evidence_gap: CLOSED
```

**Gate E / L5 separation:** Gate E closure does **not** authorize or imply L5. `L5_PASS: NOT_CLAIMED` · `l5_activation_authorized: false`.

Evidence: `docs/sessions/2026-07-18-control-plane-d-0069-e-d-0070-w-gate-e-closure.md`.

## D-0067-W / D-0066-E — teardown verification closure

- **D-0066-E** selected_option `"3"` · operator read-only n8n inspection; Cursor documental teardown verification PASS.
- **D-0067-W** docs-only persistence; **D-0068-V** verified through `38915b43c7c6dad26fed6274c6f4939222c1a7be`.

```yaml
teardown_result: PASS_REMOTE_DOCUMENTAL_TEARDOWN_VERIFICATION
teardown_evidence_gap: CLOSED
teardown_direct_n8n_observation_by_cursor: false
```

Evidence: `docs/sessions/2026-07-18-control-plane-d-0066-e-d-0067-w-teardown-verification-closure.md`.

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
| **47 / Wf** | Inactive/unpublished; Schedule disabled; `enable_wg48_handoff=false`; permanent Schedule **not** authorized; D-0062/D-0063 PASS history retained; **D-0074 bounded pilot history retained** (one-shot consumed). |
| **48 / Wg** | Inactive; published **only** as triggerless callable; no autonomous trigger; parser 1–5 + collapse canonized. |
| **49 / Wh** | Rehearsal PASS history; inactive; **excluded from D-0074 pilot** (`published=false`). |
| **decision-store** | `D-0062-T4` / `D-0063-T4` closed option `"4"`; **`D-9011-T` closed option `"1"` `update_id=986228611`**; `open_count=0`. |

## Claim boundaries

**Claimed:** D-0074-E option `"1"` selected directly by operator; one operator-attested scope-limited bounded pilot PASS; `D-9011-T` closed; five executions within limits; completed teardown; D-0071-V certification and contextual backfill to `cafd3e5`; Gate E PASS/CLOSED; D-0062/D-0063 scope-limited PASSes retained; teardown evidence gap CLOSED; GPT-B owns n8n authoring.

**Not claimed:** L5 PASS; permanent L5 activation; current runtime authorization; permanent Schedule; autonomous wf48; Cursor direct n8n observation; screenshot authentication; independent third-party runtime verification; PM-34 unlock; `n8n_ready=true`; root cause of `allowed_chat_configured` inconsistency; verification of the new D-0077 commit before D-0078-V.

## Active blockers and next gate

- **PM-34:** `BLOCKED`.
- **L5:** `l5_activation_authorized=false` · `L5_PASS: NOT_CLAIMED` · current bounded-pilot runtime authorization **false** (consumed).
- **Gate E:** **CLOSED** (`Gate_E_full: PASS`).
- Permanent Schedule authorization: **no**.
- **Immediate next repository task:** **D-0078-V** verify-only of the new D-0077-W HEAD. If performed by the same Cursor actor → `intra_actor_self_verify` (not independent third-party).
- Later permanent L5 activation requires a **separate dedicated Decision Packet** — **not** auto-started.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook.
- NO PM-34 unlock.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO permanent Schedule activation without a separate authorized gate.
- NO L5 PASS or `l5_activation_authorized=true` without a separate dedicated Decision Packet.
- NO treating the bounded pilot PASS as L5_PASS or permanent automation.
- NO Cursor autonomous n8n workflow authoring.
- NO color-based Cursor routing in canonical instructions.
- NO describing D-0074/D-0077 as independent n8n runtime verification by Cursor.
- NO autonomous wf48.
- NO claiming D-0077 self-certifies before D-0078-V.

# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.  
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.  
> Questo file è uno stato compatto, non un archivio storico. Evidenza completa in `docs/sessions/`, Git history, `LAST_CURSOR_REPORT.md` e `LAST_HANDOFF_VERIFY.md`.

Ultimo aggiornamento: 2026-07-18 — D-0060-W official wf48 options 4/5 runtime PASS; D-0061-W collapse canonized; Gate E `OPERATOR_DECISION_PENDING`.

---

## Stato operativo attuale

- Foundation completa.
- Workflow **40/42 attivi** e invariati; workflow **41 off**.
- **PM-34 BLOCKED**.
- **`n8n_ready=false`**.
- Nessun loop operativo permanente dichiarato.
- Nessuna attivazione L5 autorizzata.

## D-0061-W — repository correction wf48

- Decision provenance: `direct_operator_message`.
- Canonical template: `workflows/wg-telegram-inbound-decision-state-correlation.template.json`.
- Parser options **1–5** già canonizzato da D-0059-W.
- Aggiunto `Collapse shared state load fan-out` in modalità `runOnceForAllItems` tra:
  - `Data Table - Load shared decision state`;
  - `Correlate inbound to decision state`.
- Correlation continua a leggere l’intero row set direttamente dal Data Table load.
- Substantive commit: `d07cf5c79a99beda77c9c261c30596c863524a4a`.
- Template `active=false`; nessun export runtime originale registrato in Git.

## D-0060-W — official wf48 options 4/5 bounded runtime

Result:

```yaml
result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_WF48_OFFICIAL_OPTIONS_4_5
official_wf48_option_4_runtime_pass: true
official_wf48_option_5_runtime_pass: true
official_wf48_options_4_5_runtime_pass: true
wf48_parser_1_5_repository_canonized: true
wf48_collapse_shared_state_fan_out_canonized: true
```

Official inventory after teardown:

- `48 - Wg Telegram Inbound Decision State Correlation TEST ONLY - UFFICIALE`: exactly one instance, inactive, unpublished.
- Previous wf48 instance deleted after reference migration and validation.
- `47 - Wf Telegram Inbound Polling getUpdates TEST ONLY - UFFICIALE`: inactive, unpublished.
- wf47 Execute Workflow reference updated in n8n UI to the new official wf48.
- `enable_wg48_handoff=false`; callable path not exercised.
- No Publish, Active, Schedule activation, Telegram Trigger or public webhook introduced.

### T4 option 4

```yaml
decision_id: D-0060-T4
selected_option: "4"
update_id: 986228608
inspect_status: closed
prior_status: open
state_persisted: true
block_reason: null
test_only: true
store_status: closed
```

### T5 option 5

```yaml
decision_id: D-0060-T5
selected_option: "5"
update_id: 986228609
inspect_status: closed
prior_status: open
state_persisted: true
block_reason: null
test_only: true
store_status: closed
```

Final store state:

```yaml
store: control_plane_decisions_test
open_count: 0
D-0060-T4: closed
D-0060-T5: closed
```

Teardown:

```yaml
scenario: valid_close
manual_receipt_json: {}
rerun_after_teardown: false
enable_wg48_handoff: false
```

An accidental timestamp edit on historical row `D-0041-T` was restored before T4; no lasting mutation is claimed.

Evidence: `docs/sessions/2026-07-18-control-plane-d-0060-w-d-0061-w-wf48-official-options-4-5-runtime-pass.md`.

## Inbound / decision-store asset state

| Asset | Current state |
|---|---|
| **45 / Wd** | Scope-limited runtime PASS history; inactive after bounded tests. |
| **46 / We** | `DEPRECATED_AS_PRIMARY_PATH`; retained inactive webhook fallback; We live PASS=false. |
| **47 / Wf** | L3 repository PASS; L4 callback/option tests recorded; official present, inactive/unpublished; `enable_wg48_handoff=false`. |
| **48 / Wg** | Official parser options 1–5; collapse canonized; official option 4 and 5 manual `external_receipt` runtime PASS; inactive/unpublished. |
| **49 / Wh** | Rehearsal PASS history; inactive. |
| **decision-store** | Gates 1–3 and bounded histories preserved; D-0060-T4/T5 closed; `open_count=0`. |

## Claim boundaries

**Claimed:**

- official wf48 manual `external_receipt` close PASS for option 4;
- official wf48 manual `external_receipt` close PASS for option 5;
- state persisted for both fixtures;
- parser contract 1–5 and collapse topology present in canonical template;
- one official wf48 inventory after teardown.

**Not claimed:**

- callable wf47→wf48 fresh PASS;
- L5 PASS;
- Gate E full PASS;
- permanent polling/automation loop;
- end-to-end automatic Decision Packet lifecycle;
- `n8n_ready=true`;
- PM-34 unlocked.

## Active blockers and next gate

- **PM-34:** `BLOCKED`.
- **L5:** `l5_activation_authorized=false`.
- **Gate E:** `OPERATOR_DECISION_PENDING`; previous misattributed option remains voided.
- Callable 47→48 remains a separate bounded validation requiring a fresh direct-operator decision.
- `enable_wg48_handoff=false` remains the default and current runtime value.
- Gate E does not restart automatically.

## Recent authoritative evidence

- D-0060/D-0061 official wf48 options 4/5 PASS: `docs/sessions/2026-07-18-control-plane-d-0060-w-d-0061-w-wf48-official-options-4-5-runtime-pass.md`.
- D-0059 parser 1–5 canonization: `docs/sessions/2026-07-18-control-plane-d-0059-w-wf48-parser-1-5-canonization.md`.
- D-0055…D-0058 wf47 option 4 + temporary close history: `docs/sessions/2026-07-18-control-plane-d-0055-w-d-0058-w-wf47-option4-pass-and-wf48-manual-close.md`.
- D-0052 callback option 5 history: `docs/sessions/2026-07-17-control-plane-d-0052-w-l4-callback-pass-d0053g-option2.md`.
- D-0054 official wf47 inventory restore: `docs/sessions/2026-07-17-control-plane-d-0054-w-wf47-official-restore-configuration-only.md`.
- Gate D bounded rehearsal: `docs/sessions/2026-07-02-control-plane-gate-d-rehearsal-pass.md`.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook.
- NO PM-34 unlock.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO permanent Schedule activation without a separate authorized gate.
- NO L5 or Gate E full PASS declaration without dedicated decision and evidence.

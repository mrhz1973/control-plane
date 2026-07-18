# Session — D-0060-W / D-0061-W wf48 official options 4–5 runtime PASS

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-07-18  
**Decision provenance:** `direct_operator_message`  
**Runtime executor:** operator in n8n UI  
**Cursor runtime actions:** `0`

## 1. Scope and result

- **D-0061-W repository correction:** canonical wf48 template aligned with the bounded runtime topology by adding `Collapse shared state load fan-out` between the Data Table load and correlation nodes.
- **Substantive repository commit:** `d07cf5c79a99beda77c9c261c30596c863524a4a` (`feat: canonize wf48 collapse shared state fan-out`).
- **D-0060-W runtime:** official wf48 manually validated with `external_receipt` for options **4** and **5**.
- **Result:** `PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_WF48_OFFICIAL_OPTIONS_4_5`.

```yaml
wf48_parser_1_5_repository_canonized: true
wf48_collapse_shared_state_fan_out_canonized: true
official_wf48_option_4_runtime_pass: true
official_wf48_option_5_runtime_pass: true
official_wf48_options_4_5_runtime_pass: true
enable_wg48_handoff: false
l5_activation_authorized: false
gate_e_status: OPERATOR_DECISION_PENDING
gate_e_full_pass: false
pm34_unblocked: false
n8n_ready: false
```

## 2. Official inventory and configuration

Final official workflow:

`48 - Wg Telegram Inbound Decision State Correlation TEST ONLY - UFFICIALE`

Operator-attested final state:

- exactly one official wf48 instance;
- previous wf48 instance removed after the new instance was verified;
- wf48 inactive and unpublished;
- wf47 inactive and unpublished;
- no Schedule activation and no Publish action;
- `Set Wg test scenario` restored after tests to:
  - `scenario=valid_close`;
  - `manual_receipt_json={}`;
- no workflow rerun after teardown.

The wf47 `Execute Workflow - Wg48 TEST ONLY (CONFIGURE_IN_N8N_UI)` reference was updated in the n8n UI to the new official wf48 internal reference. The internal n8n identifier is intentionally not recorded here. `enable_wg48_handoff=false` remained unchanged, so the callable path was not exercised.

## 3. Repository/runtime preflight

Canonical wf48 properties used for import:

- parser contract options `1–5` preserved in all three expected locations;
- Data Table by name: `control_plane_decisions_test`;
- `Collapse shared state load fan-out` present and configured `runOnceForAllItems`;
- Manual Trigger present;
- no Telegram Trigger, public webhook, Schedule activation, or permanent automation;
- template `active=false`.

Store preflight:

```yaml
store: control_plane_decisions_test
open_count_before_t4: 0
max_existing_update_id: 986228607
t4_update_id: 986228608
t5_update_id: 986228609
```

During fixture preparation the operator accidentally edited timestamp fields on historical row `D-0041-T`. The row was restored before proceeding:

```yaml
decision_id: D-0041-T
created_at: 2026-07-09T22:14:04.060Z
closed_at: 2026-07-11T21:47:09Z
status: closed
```

No lasting mutation to `D-0041-T` is claimed.

## 4. T4 — official wf48 option 4

Fixture created as the only open row:

```yaml
decision_id: D-0060-T4
status: open
created_at: 2026-07-18T08:28:05.000Z
selected_option: null
closed_at: null
update_id: null
note_preview: null
```

Manual external receipt:

```json
{
  "inspect_status": "accepted",
  "decision_id": "D-0060-T4",
  "selected_option": "4",
  "update_id": 986228608,
  "duplicate_or_stale": false,
  "note_present": false,
  "block_reason": null,
  "test_only": true
}
```

Official wf48 output, operator pasted verbatim:

```json
[
  {
    "inspect_status": "closed",
    "decision_id": "D-0060-T4",
    "selected_option": "4",
    "update_id": 986228608,
    "note_present": false,
    "block_reason": null,
    "prior_status": "open",
    "state_persisted": true,
    "test_only": true
  }
]
```

Post-run store verification, operator-attested:

```yaml
decision_id: D-0060-T4
status: closed
selected_option: "4"
update_id: 986228608
closed_at: populated
open_count: 0
```

Classification: `official_wf48_option_4_runtime_pass=true`.

## 5. T5 — official wf48 option 5

T5 was created only after the complete T4 PASS and `open_count=0`.

Fixture created as the only open row:

```yaml
decision_id: D-0060-T5
status: open
created_at: 2026-07-18T08:44:15.000Z
selected_option: null
closed_at: null
update_id: null
note_preview: null
```

Manual external receipt:

```json
{
  "inspect_status": "accepted",
  "decision_id": "D-0060-T5",
  "selected_option": "5",
  "update_id": 986228609,
  "duplicate_or_stale": false,
  "note_present": false,
  "block_reason": null,
  "test_only": true
}
```

Official wf48 output, operator pasted verbatim:

```json
[
  {
    "inspect_status": "closed",
    "decision_id": "D-0060-T5",
    "selected_option": "5",
    "update_id": 986228609,
    "note_present": false,
    "block_reason": null,
    "prior_status": "open",
    "state_persisted": true,
    "test_only": true
  }
]
```

Post-run store verification, operator-attested:

```yaml
decision_id: D-0060-T5
status: closed
selected_option: "5"
update_id: 986228609
closed_at: populated
open_count: 0
```

Classification: `official_wf48_option_5_runtime_pass=true`.

## 6. Final teardown and claim boundaries

Final operator-attested invariants:

- `D-0060-T4` and `D-0060-T5` closed;
- `control_plane_decisions_test` has `open_count=0`;
- scenario reset to `valid_close` and receipt reset to `{}`;
- exactly one official wf48 remains;
- wf47 and wf48 inactive/unpublished;
- `enable_wg48_handoff=false`;
- no additional execution after teardown.

**Not claimed:** callable wf47→wf48 PASS · L5 PASS · Gate E full PASS · permanent schedule · automatic end-to-end loop · `n8n_ready=true` · PM-34 unlocked.

## 7. Canonical references

- `workflows/wg-telegram-inbound-decision-state-correlation.template.json`
- `docs/runtime/CURRENT_FRONTIER.md`
- `docs/runtime/AUTOMATION_ACTIVATION_PLAN.md`
- `docs/workflow-wg-telegram-inbound-decision-state-correlation.md`
- `docs/workflow-wf47-wg-operationalization-plan.md`
- `docs/sessions/2026-07-18-control-plane-d-0059-w-wf48-parser-1-5-canonization.md`

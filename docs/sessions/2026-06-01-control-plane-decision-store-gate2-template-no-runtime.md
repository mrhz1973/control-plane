# Session — Shared decision store Gate 2 template no-runtime

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-01  
**Type:** Gate 2 template + docs only. **No runtime by Cursor.**

---

## 1. Context

- Gate 1 design **PASS**: `control_plane_decisions_test` open/close contract defined (`docs/decision-store-shared-open-close-design.md`).
- Gate 2 wires the **TEST ONLY** templates to that shared store — still no runtime, no activation, no Data Table mutation in Git.

## 2. Gate 2 changes

### Wd — OPEN ON SEND (`workflows/wd-operational-decision-packet-integration-manual.template.json`)

- New nodes after **Build Operational Decision Packet**: **Data Table - Load shared decisions** → **Prepare shared decision open row** → **IF shared decision open allowed**.
- IF-true → **Data Table - Upsert shared decision open** (`open` on `control_plane_decisions_test`) → Telegram send. IF-false → straight to **Inspect** (no send).
- Closed `decision_id` → `open_action: blocked` / `block_reason: duplicate_open_attempt`, **no reopen, no send**.
- **Inspect send result (read-only)** reworked to run on both branches and report `open_action` / `block_reason`; claims a send only when Telegram ran (Addendum 1).
- Sticky note documents shared store + `open_without_send` risk. `active: false` and `CONFIGURE_*` preserved.

### Wg — CLOSE ON REPLY (`workflows/wg-telegram-inbound-decision-state-correlation.template.json`)

- **Data Table - Load shared decision state** and **Data Table - Upsert shared decision row** now target `control_plane_decisions_test` (renamed from the `wg_decision_state_test` nodes).
- **Correlate inbound to decision state** reads the renamed load node and carries `updated_at` / `created_by` / `source_workflow` / `packet_kind` through `persist_row`; upsert maps the extended columns.
- All connection keys/targets updated to renamed nodes. `active: false` preserved.

## 3. Files updated

- `workflows/wd-operational-decision-packet-integration-manual.template.json`
- `workflows/wg-telegram-inbound-decision-state-correlation.template.json`
- `docs/decision-store-shared-open-close-design.md` (§8 Gate 2, §11 status, header)
- `docs/workflow-wd-operational-decision-packet-integration.md` (§9)
- `docs/workflow-wg-telegram-inbound-decision-state-correlation.md` (§11)
- `docs/workflow-we-telegram-interactive-decision-buttons.md` (placeholder resolves to shared store)
- `docs/workflow-wf47-wg-operationalization-plan.md` (§4nonies)
- `docs/runtime/CURRENT_FRONTIER.md`

## 4. Addenda

1. **Inspect on both branches** — Wd Inspect handles sent and no_send/blocked, no false send claim.
2. **`open_without_send` risk** — open row precedes Telegram send; verified at Gate 3 runtime user-attested.
3. **No table/seed in repo** — operator creates `control_plane_decisions_test` in n8n UI; no `data-tables/**`, no CSV.

## 5. Not performed

- No n8n runtime, import, activation, schedule.
- No `data-tables/**` change, no CSV seed, no table creation in repo.
- No PM-34, no 49, no 40/41/42, no public webhook, no Telegram Trigger, no secrets, no finalize-hash commit.

## 6. State preserved

- **PM-34:** **BLOCKED**
- **Telegram inbound operational automation:** **NOT ACTIVE / NOT RUN**
- 47→48 controlled handoff runtime: **PASS ATTESTATO UTENTE** (unchanged).

## 7. Next gate

- **Gate 3:** runtime user-attested end-to-end open→close on `control_plane_decisions_test`; verify `open_without_send`.

## 8. Final status

**PASS / IMPLEMENTATION READY** — Gate 2 templates + docs recorded on `main` (two-commit rule). **No runtime.**

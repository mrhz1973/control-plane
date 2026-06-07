# n8n CONTROL PLANE workflow naming (numeric)

**Docs-only registry.** Records operational naming in n8n UI. **Not** a runtime change by itself.

**Related:** [MVP_STATUS.md](MVP_STATUS.md), [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md), [RUNTIME_GATES.md](RUNTIME_GATES.md), [final n8n cleanup](sessions/2026-05-21-control-plane-final-n8n-cleanup.md).

**Last updated:** 2026-06-07 — D-0026-S Decision Packet / inbound state reconciliation (docs-only).

---

## Rule

| Rule | Detail |
|------|--------|
| **Numeric prefix** | Use numeric prefixes only; avoid letter suffixes like `02F` in **new** runtime names |
| **Production (`40`)** | **`40 - CP v4 multirepo + classifier bridge - ACTIVE`** — sole published CP poll+handoff + PM-21 bridge (PM-22 promoted). Do **not** create multiple visible workflows all named `40` |
| **Candidates (`41`–`43`)** | Next import/test/replacement candidates only — e.g. `41 - … CANDIDATE`, then `42`, `43` |
| **Retained off (`01`/`20`/`30`)** | Legacy / v5 / manual handoff — stay **OFF**, not deleted |
| **Backup / test-safe** | Delete from n8n UI after PASS when no longer needed — do not leave duplicate `40` or stale test workflows in the list |
| **Status suffix** | `- ACTIVE`, `- OFF`, `- LEGACY OFF`, `- CANDIDATE`, or `- TEST SAFE` in workflow **display name** where helpful |
| **Pre-bound credentials** | New candidate JSON should include existing n8n credential bindings by credential name where safe |
| **Private values** | Do not commit private runtime values; use clear placeholders when needed |
| **Exports** | Committed `.redacted.json` may keep **historical** names; new exports use readable target names (`41`+, not another `40` candidate) |
| **JSON / raw URL** | Prefer `41 - … CANDIDATE`, not another `40 - … CANDIDATE` |

---

## Credential policy for future JSON candidates

Goal: reduce manual n8n setup friction.

Future candidate exports should arrive as close as possible to ready-to-run:

| Node type | Required default in candidate JSON |
|----------|-------------------------------------|
| GitHub HTTP/API nodes | Include known credential binding name where applicable |
| Telegram nodes | Include known credential binding name where applicable |
| Telegram Chat ID | Prefer a safe placeholder or n8n-side expression when the value should not be stored in GitHub |
| Data Table nodes | Preserve table reference by name, e.g. `control_plane_state` |
| File nodes | Preserve safe container paths under `/home/node/.n8n-files/` |

Operational rule:

- For known GitHub/Telegram credentials, candidates should not arrive with empty credential selectors.
- If a field cannot be safely committed, use a clear placeholder such as `__CONFIGURE_CHAT_ID_IN_N8N_UI__`.
- Prefer a future one-time n8n-side lookup so common Telegram destination data does not need to be retyped in every imported workflow.

---

## Current CONTROL PLANE list (runtime — 2026-05-22 post PM-22/23)

| ID | Workflow name (n8n UI) | State |
|----|------------------------|--------|
| **40** | `40 - CP v4 multirepo + classifier bridge - ACTIVE` | **Active/published** — sole CP production (PM-22 promoted from `42`) |
| **41** | `41 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF` | **Off** — rollback source; **intentionally retained** after PM-22/23 PASS — [PM-27 gate](runtime-packets/pm-27-backup-41-retention-cleanup-gate.md) |
| **30** | `30 - CP handoff manual Telegram v1 - OFF` | **Off** |
| **20** | `20 - CP v5 push webhook - OFF` | **Off** |
| **01** | `01 - CP v4 single-repo polling - LEGACY OFF` | **Off** |

**No `42` in use** after PM-22 PASS. **No duplicate numeric IDs.**

**Retention:** Do **not** delete **`41`** until [PM-27 cleanup gate](runtime-packets/pm-27-backup-41-retention-cleanup-gate.md) authorizes removal.

**Evidence:** [PM-22/23 PASS session](sessions/2026-05-22-control-plane-pm22-pm23-promotion-smoke-pass.md)

**Deleted from n8n UI** (historical — PM-09): backup `40` before Gate D file; `55` test-safe.

---

## PM-22 promotion naming (PASS — current)

**Rule:** **No duplicate numeric IDs** visible in the n8n list.

### Current (after PM-22 + PM-23 PASS)

| ID | Workflow name (n8n UI) | State |
|----|------------------------|--------|
| **40** | `40 - CP v4 multirepo + classifier bridge - ACTIVE` | **ON** |
| **41** | `41 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF` | **OFF** |

### After PM-24 rollback (failure — not needed 2026-05-22)

| ID | Workflow name (n8n UI) | State |
|----|------------------------|--------|
| **40** | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` | **ON** (restored from `41`) |
| **42** | `42 - CP v4 multirepo + classifier bridge - FAILED OFF` | **OFF** (failed promotion) |

**Packets:** [pm-22](runtime-packets/pm-22-promote-42-to-40-bridge-gate.md) · [pm-23](runtime-packets/pm-23-post-promotion-smoke-gate.md) · [pm-24](runtime-packets/pm-24-rollback-recovery-gate.md) · [pm-25](runtime-packets/pm-25-fast-track-runtime-operator-checklist.md)

---

## Candidate numbering policy

Readable n8n UI matters. Avoid many entries starting with identical `40 - ...` names.

| Use case | Prefix |
|----------|--------|
| Current production polling workflow | `40` |
| First candidate replacing/extending `40` | `41` |
| Second candidate | `42` |
| Third candidate | `43` |

When a candidate becomes production:

1. Rename or delete old production backup copies in n8n UI.
2. Rename the selected candidate to `40 - ... - ACTIVE`.
3. Delete obsolete test-safe workflows after PASS.

---

## Historical — prefix `55` (deleted 2026-05-21)

| Item | Detail |
|------|--------|
| **Was** | `55 - CP plan detected Telegram Gate D TEST SAFE` — isolated PM-09 Gate D test |
| **Now** | **Deleted** from n8n after PASS; Gate D lives in production **`40`** |
| **Future** | Use **`41`–`43`** for new candidates; only recreate a separate test-safe workflow if an explicit runtime gate requires it |

---

---

## Decision Packet / inbound reconciliation (2026-06-07)

**Scope:** docs-only state reconciliation after D-0025-L. **No new workflow.** **No runtime in this task.** **No production workflow mutation.** Inbound/loop activation remains a **separate gate**. **PM-34 BLOCKED.** **`n8n_ready=false`.** Pezzi collegati ≠ loop avviato.

| ID | Workflow (letter) | State |
|----|-------------------|--------|
| **45** | **Wd** — Manual → `/classify` → Telegram Send Decision Packet | **PASS ATTESTATO UTENTE** (2026-05-31): `D-9998-T`, `message_id=678`. **Riverificato PASS ATTESTATO UTENTE** (2026-06-07): `D-9999-T`, `message_id=748`, `open_action=insert`. Workflow **esistente** — **non ricreare**. Test-only/manual; no inbound 47/48/49; no schedule/webhook/Funnel. **PM-34 BLOCKED.** **`n8n_ready=false`.** Sessions: `docs/sessions/2026-05-31-control-plane-wd-operational-decision-packet-b-live-pass.md`, `docs/sessions/2026-06-07-control-plane-wd45-d9999t-runtime-reverification-pass.md`. Gate 3 re-evidence 2026-06-02: `message_id=732`. |
| **46** | **We** — Telegram interactive buttons | Package-prep **completato**; **live BLOCKED/PENDING** (HTTPS webhook). **We live PASS non registrato.** Session: `docs/sessions/2026-05-31-control-plane-we-telegram-interactive-buttons-live-blocked.md`. |
| **47** | **Wf** — Telegram inbound polling getUpdates | **PASS multipli ATTESTATO UTENTE**: Data Table accept-once, limited-schedule runtime, live getUpdates, handoff 47→48. **Ora off.** Sessions: `docs/sessions/2026-06-01-control-plane-wf47-*`. |
| **48** | **Wg** — Inbound decision state correlation | **PASS**: manual validation + handoff 47→48 controllato/live. **Callable**; **non schedulato**. |
| **49** | **Wh** — Combined Wf47/Wg inbound decision flow | Rehearsal manuale finale **PASS ATTESTATO UTENTE**; **provato**; **ora inattivo**. **Not** “not used” — bounded fixture rehearsal PASS; not operational loop. Session: `docs/sessions/2026-05-31-control-plane-wf47-wg-wh-final-manual-runtime-rehearsal-pass.md`. |
| — | **decision-store** (`control_plane_decisions_test`) | Gate 1 design **PASS** · Gate 2 template **PASS** · Gate 3 runtime end-to-end **PASS** (2026-06-02). Session: `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`. |

Full live n8n UI registry reconciliation beyond this note remains follow-up / out of scope.

---

## D-0024-M test-safe template (2026-06-05)

| ID | Workflow name (n8n UI) | State |
|----|------------------------|--------|
| **55** | `55 - D-0024-M Decision Packet mapping preview TEST SAFE` | **Runtime PASS ATTESTATO UTENTE** (2026-06-06); fixture-only; inactive/manual. Export: `workflows/exports/2026-06-05_d0024m-decision-packet-mapping-preview-test-safe.redacted.json` |

Full registry reconciliation with live n8n UI remains follow-up / out of scope for this note.

---

## D-0025-L test-safe template (2026-06-06)

| ID | Workflow name (n8n UI) | State |
|----|------------------------|--------|
| **56** | `56 - D-0025-L Live classifier mapping preview TEST SAFE` | **Runtime PASS ATTESTATO UTENTE** (2026-06-07); manual single run; inactive/test-safe; live classifier + Decision Packet preview only; no Telegram/webhook/schedule/Funnel; no production workflow mutation. **Not** imported or run by Cursor — runtime executed manually by user. Export: `workflows/exports/2026-06-06_d0025l-live-classifier-mapping-preview-test-safe.redacted.json` |

Full registry reconciliation with live n8n UI remains follow-up / out of scope for this note.

---

## Rename map (2026-05-21)

| Former (docs/export history) | Current (runtime) |
|-------------------------------|-------------------|
| `02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT` | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` |
| `03 - CP handoff manual Telegram v1` | `30 - CP handoff manual Telegram v1 - OFF` |
| `01 - CP v4 single-repo polling - LEGACY OFF` | unchanged |
| `20` v5 webhook | `20 - CP v5 push webhook - OFF` |

---

## Export hygiene

Committed exports under `workflows/exports/` may still show **`02F`**, **`55`**, backup `40`, or `40 ... CANDIDATE` names in JSON — **historical import-safe artifacts**. Deleting runtime workflows does **not** remove committed export history.

New candidate JSON should use **`41`**, **`42`**, **`43`**, … in the workflow `name` field.

See [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md).

---

## Explicit non-actions (this doc)

- Does not open n8n, import, export, Execute, or Telegram
- Does not modify `workflows/exports/**`
- Does not rename or delete workflows by itself

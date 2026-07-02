# n8n CONTROL PLANE workflow naming (numeric)

**Docs-only registry.** Records operational naming in n8n UI. **Not** a runtime change by itself.

**Related:** [CURRENT_FRONTIER.md](runtime/CURRENT_FRONTIER.md), [AUTOMATION_ACTIVATION_PLAN.md](runtime/AUTOMATION_ACTIVATION_PLAN.md), [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md), [RUNTIME_GATES.md](RUNTIME_GATES.md).

**Last updated:** 2026-07-02 — registry reconciliation post Gate D (D-0033). **PM-34 BLOCKED.** **`n8n_ready=false`.**

**Rule:** When citing n8n workflows, always use **numeric ID + display name**.

---

## Rule

| Rule | Detail |
|------|--------|
| **Numeric prefix** | Use numeric prefixes only; avoid letter suffixes like `02F` in **new** runtime names |
| **Production (`40`, `42`)** | **`40`** — sole CP multirepo poll+handoff+bridge production. **`42`** — diff-summary Telegram production (GIS). Do **not** create multiple visible workflows all named `40` |
| **Backup (`41`)** | Retained **OFF** as rollback source — do not delete without PM-27 gate |
| **Test-only (`45`–`49`, `55`–`57`)** | Decision Packet / inbound / preview / verifier paths — **inactive** or **callable-not-scheduled** unless a separate gate says otherwise |
| **Retained off (`01`/`20`/`30`)** | Legacy / v5 / manual handoff — stay **OFF**, not deleted |
| **Status suffix** | `- ACTIVE`, `- OFF`, `- LEGACY OFF`, `- CANDIDATE`, `- TEST ONLY`, or `- TEST SAFE` in workflow **display name** where helpful |
| **Pre-bound credentials** | New candidate JSON should include existing n8n credential bindings by credential name where safe |
| **Private values** | Do not commit private runtime values; use clear placeholders when needed |
| **Exports** | Committed `.redacted.json` may keep **historical** names; UI fixes post-Gate D on **45**/**47** may diverge from committed exports |

---

## Current CONTROL PLANE list (reconciled — 2026-07-02)

Sources: [CURRENT_FRONTIER.md](runtime/CURRENT_FRONTIER.md), [AUTOMATION_ACTIVATION_PLAN.md](runtime/AUTOMATION_ACTIVATION_PLAN.md), [Gate D session](sessions/2026-07-02-control-plane-gate-d-rehearsal-pass.md).

| ID | Workflow name (n8n UI) | State |
|----|------------------------|--------|
| **40** | `40 - CP v4 multirepo + classifier bridge - ACTIVE` | **Active/published** — sole CP multirepo poll+handoff+bridge production; schedule ~1 min; **unchanged** by Gate D |
| **41** | `41 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF` | **Off** — rollback source; intentionally retained — [PM-27 gate](runtime-packets/pm-27-backup-41-retention-cleanup-gate.md) |
| **42** | `42 - CP diff summary Telegram MVP` (UI name per [workflow-42 doc](workflow-42-diff-summary-mvp.md); may include repo suffix in UI) | **Active/published** — diff-summary Telegram on `cursor-coordinate-converter`; schedule ~120s; **unchanged** by Gate D |
| **45** | `45 - Wd Operational Decision Packet Integration TEST ONLY - TEMPLATE` | **Inactive** post Gate D (2026-07-02); Gate B/D PASS attested; UI fix `event.event_id` applied in n8n UI only |
| **46** | `46 - We Telegram interactive buttons` (letter **We**) | Package-prep complete; **live BLOCKED/PENDING** (HTTPS webhook); We live PASS **not** registered |
| **47** | `47 - Wf Telegram Inbound Polling getUpdates TEST ONLY - TEMPLATE` | **Inactive** / not Published post Gate D; Schedule Trigger **deactivated**; `enable_wg48_handoff=false` |
| **48** | `48 - Wg Telegram Inbound Decision State Correlation TEST ONLY - TEMPLATE` | **Published** / **callable**; **not scheduled**; Gate D handoff `state_persisted=true` on D-1003-T |
| **49** | `49 - Wh Wf47 Wg Combined Inbound Decision Flow TEST ONLY - TEMPLATE` | **Inactive**; rehearsal PASS; not auto-promoted by Gate D |
| **55** | `55 - D-0024-M Decision Packet mapping preview TEST SAFE` | **Preview** — fixture-only; inactive/manual; runtime PASS ATTESTATO UTENTE (2026-06-06) |
| **56** | `56 - D-0025-L Live classifier mapping preview TEST SAFE` | **Preview** — manual single run; inactive/test-safe; runtime PASS ATTESTATO UTENTE (2026-06-07) |
| **57** | `57 - Post-push verifier file reader TEST ONLY` | **Manual Trigger only**, **active=false**; field-validation PASS ATTESTATO UTENTE (2026-06-11); no schedule |
| **30** | `30 - CP handoff manual Telegram v1 - OFF` | **Off** — legacy manual handoff |
| **20** | `20 - CP v5 push webhook - OFF` | **Off** — v5 not active; no public webhook |
| **01** | `01 - CP v4 single-repo polling - LEGACY OFF` | **Off** — legacy single-repo |

**Invarianti (2026-07-02):** **PM-34 BLOCKED** · **`n8n_ready=false`** · wf40/41/42 untouched by Gate D · no permanent schedule · no public webhook · Gate E solo via Decision Packet dedicato.

**Evidence:** [Gate D PASS session](sessions/2026-07-02-control-plane-gate-d-rehearsal-pass.md) · [Gate A](sessions/2026-06-07-control-plane-gate-a-readiness-audit-pass.md) · [PM-22/23](sessions/2026-05-22-control-plane-pm22-pm23-promotion-smoke-pass.md)

---

## Historical — superseded / deleted / legacy

| Item | Detail |
|------|--------|
| **`02F` → `40`** | Runtime renamed 2026-05-21 — see [rename map](#rename-map-2026-05-21) |
| **PM-09 `55` Gate D test-safe** | **Deleted** from n8n UI after PASS; Gate D lives in production **`40`** |
| **`42` classifier bridge candidate (PM-21/22)** | Promoted into production **`40`** (2026-05-22); numeric **`42`** reused for diff-summary MVP — historical name `42 - CP v4 multirepo + classifier bridge - CANDIDATE OFF` **superseded** |
| **PM-22 rollback naming (not needed)** | Failed promotion would have renamed to `42 - CP v4 multirepo + classifier bridge - FAILED OFF` — [pm-24 packet](runtime-packets/pm-24-rollback-recovery-gate.md) |

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

## Candidate numbering policy

Readable n8n UI matters. Avoid many entries starting with identical `40 - ...` names.

| Use case | Prefix |
|----------|--------|
| Current production polling workflow | `40` |
| First backup / rollback of `40` | `41` |
| Diff-summary or next distinct production path | `42` |
| Further candidates | `43`, … |
| Decision Packet / inbound test templates | `45`–`49` |
| Mapping preview test-safe | `55`, `56` |
| Verifier reader test-only | `57` |

When a candidate becomes production:

1. Rename or delete old production backup copies in n8n UI.
2. Rename the selected candidate to `40 - ... - ACTIVE` (or dedicated production ID).
3. Delete obsolete test-safe workflows after PASS when authorized.

---

## Decision Packet / inbound reconciliation (Gate D — 2026-07-02)

**Scope:** state reconciliation after D-0033 Gate D PASS. **No production workflow mutation.** Inbound/loop activation remains a **separate gate**. **PM-34 BLOCKED.** **`n8n_ready=false`.**

| ID | Letter | Summary |
|----|--------|---------|
| **45** | **Wd** | Gate B `D-1000-T`; Gate D `D-1001-T`/`D-1002-T`/`D-1003-T`; **inactive** post-rehearsal |
| **47** | **Wf** | Gate D time-boxed pickup proven; schedule **deactivated**; **inactive** post-rehearsal |
| **48** | **Wg** | Gate D handoff **`state_persisted=true`**; **callable**, not scheduled |
| **49** | **Wh** | Combined rehearsal PASS; **inactive**; UI name **Wh Combined** acceptable |
| — | **decision-store** | `control_plane_decisions_test` — Gate D rows `D-1001-T`/`D-1002-T`/`D-1003-T` closed |

**Pre-Gate E findings (documented, not fixed in this registry):** fan-out multi-message on 45; 47 still uses manual `open_decision_ids_test_only` rotation; UI fixes on 45/47 not in committed exports.

---

## D-0024-M / D-0025-L test-safe templates

| ID | Workflow name (n8n UI) | State |
|----|------------------------|--------|
| **55** | `55 - D-0024-M Decision Packet mapping preview TEST SAFE` | Fixture-only preview; inactive/manual |
| **56** | `56 - D-0025-L Live classifier mapping preview TEST SAFE` | Live classifier + Decision Packet preview; inactive/test-safe |

Exports: `workflows/exports/2026-06-05_d0024m-decision-packet-mapping-preview-test-safe.redacted.json`, `workflows/exports/2026-06-06_d0025l-live-classifier-mapping-preview-test-safe.redacted.json`

---

## Rename map (2026-05-21)

| Former (docs/export history) | Current (runtime) |
|-------------------------------|-------------------|
| `02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT` | `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` → later `40 - CP v4 multirepo + classifier bridge - ACTIVE` |
| `03 - CP handoff manual Telegram v1` | `30 - CP handoff manual Telegram v1 - OFF` |
| `01 - CP v4 single-repo polling - LEGACY OFF` | unchanged |
| `20` v5 webhook | `20 - CP v5 push webhook - OFF` |

---

## Export hygiene

Committed exports under `workflows/exports/` may still show **`02F`**, historical **`55`**, backup `40`, or `40 ... CANDIDATE` names in JSON — **historical import-safe artifacts**. Post-Gate D UI fixes on **45**/**47** may diverge from committed templates.

See [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md).

---

## Explicit non-actions (this doc)

- Does not open n8n, import, export, Execute, or Telegram
- Does not modify `workflows/exports/**`
- Does not rename or delete workflows by itself

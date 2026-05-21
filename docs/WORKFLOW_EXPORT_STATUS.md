# Workflow export status (MVP criterion 4)

**Docs-only inventory.** This document tracks committed n8n workflow exports. It does **not** modify JSON files, open n8n UI, or run exports.

**Criterion (Italian):** Workflow n8n esportato come JSON committato nel repo control-plane.

**Related:** [MVP_CRITERIA.md](MVP_CRITERIA.md) §4, [workflows/README.md](../workflows/README.md), [N8N_REBUILD.md](N8N_REBUILD.md), [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md).

---

## Criterion 4 closure model

| Level | Meaning |
|-------|---------|
| **PASS (now)** | Redacted exports exist under `workflows/exports/`; canonical v4 export matches the provisional MVP path; active runtime v4 was visually checked against the committed redacted export |
| **Reopen if runtime diverges** | If runtime n8n workflow changes nodes, schedule, repo list, or message format, export again, redact, commit, and update this file |

**Rule:** If runtime workflow changes in n8n (nodes, schedule, repo list, message format), export again, redact, commit — or criterion 4 reopens.

---

## Canonical export (provisional MVP)

| File | Workflow name | Role |
|------|---------------|------|
| `2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json` | `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4` | **Legacy export** — single-repo; runtime instance `01 - CP v4 single-repo polling - LEGACY OFF` (**inactive**) |

Runtime match (historical): **PASS** for bootstrap single-repo path. **Not** the active production watcher after PM-02.

**Post-cleanup runtime (PM-07 PASS):** Sole active CONTROL PLANE poll+handoff: **`02F`**; `01`/`03`/`20` retained **off**; v5 **off**; webhook **not configured** ([MVP_STATUS.md](MVP_STATUS.md)). ALINA LAVORO **out of scope**.

**Criterion 5 recovery drill (2026-05-20):** Duplicate-skip smoke on then-active single-repo v4 — historical; see [N8N_REBUILD.md](N8N_REBUILD.md).

**Export refresh:** Required **only** if runtime diverges materially from committed redacted JSON (renames, authenticated GitHub node, schedule) — see [OBSERVABILITY.md](OBSERVABILITY.md). **No** export commit in PM-02 registration task.

---

## Multirepo export — v4 watcher (runtime active; committed export may lag)

| File | Workflow name | Role |
|------|---------------|------|
| `2026-05-20_github-commit-datatable-dedupe-scheduled-v4-multirepo-draft.redacted.json` | `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4 multirepo (DRAFT)` | **Basis export** — manual tests + PM-02 promotion; runtime renamed **`02 - CP v4 multirepo polling - TARGET ON`** |

| Property | Value |
|----------|--------|
| **Runtime status** | **Superseded by `02F`** — draft promoted through PM-02/06; runtime id **`02F`** now canonical |
| **Committed export status** | Draft only — **02F export pending** ([02F redacted export status](#02f-redacted-export-status)) |
| **Based on** | v4 redacted export |
| **Watched repos** | `mrhz1973/control-plane`, `mrhz1973/dev-method`, `mrhz1973/cursor-coordinate-converter` |
| **Data Table keys** | `github:mrhz1973/control-plane:last_commit_sha`, `github:mrhz1973/dev-method:last_commit_sha`, `github:mrhz1973/cursor-coordinate-converter:last_commit_sha` |
| **Purpose** | Enable criterion 3 cycles on dev-method and GIS with v4-style deduped Telegram |
| **Runtime** | Unchanged until explicit import/update gate — **do not** import or activate in docs-only tasks |

**Design:** `Trigger → Data Table - Load all state rows → Emit watched repos (3) → GitHub → Prepare → Decide` (sequential, no parallel Trigger→Emit). Decide joins `Prepare.all()` + `Load all state rows.all()`; missing row → `storedValue ''`, `hadStateRow: false`, `isNew: true`.

**Manual validation gate (2026-05-20):** Re-import draft with sequential state-load fix (`ca8a5db`) → credential/chat_id in UI → **Manual Trigger once** (workflow **inactive**) → **PASS**.

| Manual test | Result |
|-------------|--------|
| 1 — item propagation | Prepare **1** item — fixed `f5cd992` |
| 2 — missing state rows | Telegram only control-plane — fixed load-all + Decide join `c43da22` |
| 3 — state load order | Prepare **3**; Decide failed (Load all not on path) — fixed `0684942` / `ca8a5db` |
| 4 — sequential fix replay | **PASS** — Telegram dev-method `5ce0a25` (`Previous: none`); Telegram GIS `34d543d` retro (`Previous: none`, key absent); no control-plane retro-notify (key present) |
| 5 — Cycle 3 dedupe replay | **PASS** — Telegram dev-method `0be529d` (`Previous: 5ce0a25`); **2** duplicate-skip (control-plane + GIS); Decide **3** → IF **1** true |

**Post-test Data Table (Cycle 2 replay):** dev-method and GIS keys written; control-plane key present (no retro-notify). **Cycle 3 replay:** dedupe confirmed — only `0be529d` notified; prior SHAs skipped.

**PM-02 promotion (recorded):** Scheduled notify **PASS** — dev-method `7f4316e`; GIS `66fe6b5` (`Previous: 34d543d`); dedupe **PASS** (no repeat Telegram for `66fe6b5`). v5 **off**; webhook **not configured**.

**02F handoff (recorded):** GIS `58c5c46` — safe-text handoff + **`latest-gis-handoff.md`** Telegram document + commit notify (`Previous: 7a59bbf`) — [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md). Prior `2a2ff31` / `02` path superseded by `02F`.

**Runtime stabilized (PM-07):** CONTROL PLANE list cleaned around **`02F`**. See [02F redacted export status](#02f-redacted-export-status) below.

---

## 02F redacted export status

| Field | Value |
|-------|--------|
| **Runtime workflow** | `02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT` — **active/published** (sole CONTROL PLANE polling target) |
| **Committed 02F export** | **`workflows/exports/2026-05-21_github-commit-datatable-dedupe-scheduled-v4-multirepo-02f-handoff-safe-text.redacted.json`** |
| **Status** | **Committed** — PM-08 **PASS** (2026-05-21); `active=false` in repo (import-safe) |
| **Runtime on VPS** | **`02F` remains active/published** — **no** n8n import/export or execution in this commit |
| **Prior basis (superseded for rebuild)** | `2026-05-20_github-commit-datatable-dedupe-scheduled-v4-multirepo-draft.redacted.json` |
| **MVP criterion 4** | Remains **PASS** — additional 02F export strengthens rebuild record; C1 **not** relabeled PASS |

### What the committed 02F export contains

- Workflow name matching runtime: **`02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT`**
- Schedule trigger (**1 min**) and **three-repo** multirepo list (`control-plane`, `dev-method`, `cursor-coordinate-converter`)
- Data Table dedupe path on `control_plane_state` (per-repo keys)
- GIS branch: safe-text Telegram handoff + **`latest-gis-handoff.md`** document send (path documented in [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) — no absolute host paths in git beyond redacted placeholders if needed)
- Execute Command / handoff-generate integration nodes as present in production **02F**
- Inactive retained workflows **not** required in this file (`01`, `03`, `20` stay separate exports if ever refreshed)

### Strip / redact before commit (mandatory)

| Remove or placeholder | Never commit |
|------------------------|--------------|
| Telegram bot **token** | Plaintext or env |
| Operational **chat_id** | Use `__CONFIGURE_CHAT_ID_IN_N8N_UI__` or omit |
| n8n **credential IDs** | Use `__REDACTED_N8N_CREDENTIAL_ID__` or credential **name** only |
| **Webhook URL** / tunnel URL / webhook secret | n8n / GitHub UI only |
| URLs embedding secrets (signed, token query params) | — |
| **Execution data**, pinned execution IDs, last-run payloads | — |
| **Binary** attachments / base64 blobs | — |
| **Static data** with tokens, chat_id, or personal data | — |
| Unnecessary runtime-only parameters (instance URLs with auth, personal notes) | — |
| `*.unredacted.json` | Local staging only |

Add JSON metadata `redaction` note listing what was stripped (same pattern as existing exports). **Inspect** full file before `git add` — do not trust filename alone.

**Redaction verified before commit:** placeholders only (`__CONFIGURE_CHAT_ID_IN_N8N_UI__`, `__REDACTED_N8N_CREDENTIAL_ID__`, `__REDACTED_VERSION_ID__`); no `*.unredacted.json` in git.

Naming: [workflows/README.md](../workflows/README.md).

---

## v4 runtime match perimeter (visual operational PASS)

Criterion 4 remains **PASS** for operational visual match. A future export/diff can strengthen audit if needed.

### Verified (visual operational check)

- Active workflow **v4** present and enabled in n8n
- Expected nodes present: Manual Trigger, Schedule Trigger, GitHub latest commit read, Prepare event, Data Table get/decide/upsert on `control_plane_state`, IF new commit, Format Telegram message, Telegram send, duplicate-skip / no-Telegram branch
- Data Table name **`control_plane_state`**
- Dedupe behavior validated historically (duplicate-skip, no spam)
- Telegram send path uses credential name **`CONTROL PLANE - Telegram Bot`**

### NOT verified visually

- Byte-for-byte diff export JSON ↔ runtime export
- Every internal node parameter and default
- Dedupe expressions line-by-line (Code node JS)
- Exact schedule cron string in runtime UI (export says 1 minute; **pending exact UI read** if audit required)
- All GitHub URL variants if runtime was extended beyond export without re-commit

**Note:** Re-export and commit if runtime diverges materially; criterion 4 reopens until match is recorded again.

---

## Future / inactive export

| File | Workflow name | Role |
|------|---------------|------|
| `2026-05-20_github-push-webhook-datatable-dedupe-notify-v5.redacted.json` | `CONTROL PLANE - GitHub push webhook Data Table dedupe notify v5` | **Inactive** — imported and manually tested (placeholder), then disabled. Do not use until [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) satisfied |

---

## Historical / do not use for rebuild

| File | Workflow name | Role |
|------|---------------|------|
| `2026-05-20_github-commit-poll-dedupe-notify.redacted.json` | `CONTROL PLANE - GitHub commit poll dedupe notify` | **Historical** — early poll + workflow static data dedupe (superseded) |
| `2026-05-20_github-commit-poll-dedupe-notify-v2.redacted.json` | `CONTROL PLANE - GitHub commit poll dedupe notify v2` | **Historical / FAILED dedupe** — static data `$getWorkflowStaticData('global')` did not duplicate-skip reliably on manual re-run. **Do not import for MVP.** |

---

## Foundation / manual validation exports

| File | Workflow name | Role |
|------|---------------|------|
| `2026-05-20_telegram-manual-notification-test.redacted.json` | `CONTROL PLANE - Telegram manual notification test` | Telegram + credential smoke test (manual only) |
| `2026-05-20_github-latest-commit-manual-notify.redacted.json` | `CONTROL PLANE - GitHub latest commit manual notify` | GitHub public read → Telegram (manual, no dedupe) |
| `2026-05-20_github-commit-datatable-dedupe-notify-v3.redacted.json` | `CONTROL PLANE - GitHub commit Data Table dedupe notify v3` | **Data Table dedupe validated** — manual runs only; duplicate-skip PASS. Precursor to v4 schedule |

---

## Inventory summary

All committed exports (9 files):

```text
workflows/exports/
├── 2026-05-20_telegram-manual-notification-test.redacted.json
├── 2026-05-20_github-latest-commit-manual-notify.redacted.json
├── 2026-05-20_github-commit-poll-dedupe-notify.redacted.json          # historical
├── 2026-05-20_github-commit-poll-dedupe-notify-v2.redacted.json        # failed dedupe — do not use
├── 2026-05-20_github-commit-datatable-dedupe-notify-v3.redacted.json    # Data Table manual PASS
├── 2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json # legacy single-repo (01 LEGACY OFF)
├── 2026-05-20_github-commit-datatable-dedupe-scheduled-v4-multirepo-draft.redacted.json  # pre-02F basis
├── 2026-05-21_github-commit-datatable-dedupe-scheduled-v4-multirepo-02f-handoff-safe-text.redacted.json  # canonical 02F rebuild export
└── 2026-05-20_github-push-webhook-datatable-dedupe-notify-v5.redacted.json  # inactive future
```

Naming convention: `YYYY-MM-DD_name.redacted.json` — see [workflows/README.md](../workflows/README.md).

---

## Redaction rules (never commit)

| Forbidden in git | Where secrets belong |
|------------------|----------------------|
| Unredacted exports (`*.unredacted.json`) | Local only until redacted |
| Bot token | n8n credential `CONTROL PLANE - Telegram Bot` |
| Operational chat_id | n8n Telegram node UI |
| Real credential IDs | n8n only |
| Production webhook URL | n8n / GitHub settings |
| Webhook secret | n8n / GitHub settings |

Each export includes a `redaction` note in JSON metadata confirming what was stripped. **Do not modify export JSON in docs-only tasks.**

**Import via GitHub (explicit runtime gate only):** committed `.redacted.json` files may be loaded in n8n via **Import from URL** using the matching **`raw.githubusercontent.com`** link — not the GitHub blob page. Import alone does not authorize Execute or Telegram.

---

## Runtime vs committed export

Criterion 4 full closure has been reached for the current provisional MVP path:

1. Active workflow **v4** was opened in n8n during the runtime gate.
2. The user visually confirmed the expected structure: manual trigger, schedule trigger, GitHub latest commit read, Data Table `control_plane_state`, dedupe logic, Telegram send, and duplicate-skip/no-Telegram branch.
3. This matches `2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json` except for expected UI-only chat_id/credential linkage.
4. No re-export was needed.

**Handoff workflow (criterion 2):** no export yet — expected after first runtime PASS.

---

## Docs-only path (this task)

| Action | Status |
|--------|--------|
| Inventory committed exports | Done |
| Mark canonical v4 / inactive v5 / failed v2 | Done |
| Runtime v4 match recorded | **PASS** |
| Modify `workflows/exports/*.json` | **Not done** — forbidden |
| Re-export from n8n | **Not done** — not needed for current v4 match |

---

## What NOT to do now

- Edit existing JSON in `workflows/exports/`
- Commit `*.unredacted.json`
- Store token, chat_id, webhook URL, or secrets in docs
- n8n UI export/import in this task
- Enable v5 or GitHub webhook
- Touch Alina workflows or other repos

---

## Verification (criterion 4 full closure)

- [x] Redacted v4 JSON exists in repo
- [x] Follows naming convention
- [x] Runtime v4 matches committed export
- [x] No secrets in committed exports (per file metadata)
- [ ] After handoff MVP: add redacted handoff workflow export when criterion 2 runtime exists

Criterion 4 is **PASS** in [MVP_CRITERIA.md](MVP_CRITERIA.md).

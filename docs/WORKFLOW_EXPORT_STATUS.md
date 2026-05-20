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
| `2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json` | `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4` | **Active provisional path** — GitHub public read → `control_plane_state` dedupe → Telegram; one-minute schedule |

Use this file for [N8N_REBUILD.md](N8N_REBUILD.md) import. Runtime v4 is **active and stable** per [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md).

Runtime match status: **PASS** — the active n8n v4 workflow was visually checked against this committed redacted export. UI-only credential/chat_id linkage differs as expected and must not be committed.

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

All committed exports (7 files):

```text
workflows/exports/
├── 2026-05-20_telegram-manual-notification-test.redacted.json
├── 2026-05-20_github-latest-commit-manual-notify.redacted.json
├── 2026-05-20_github-commit-poll-dedupe-notify.redacted.json          # historical
├── 2026-05-20_github-commit-poll-dedupe-notify-v2.redacted.json        # failed dedupe — do not use
├── 2026-05-20_github-commit-datatable-dedupe-notify-v3.redacted.json    # Data Table manual PASS
├── 2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json # canonical MVP
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

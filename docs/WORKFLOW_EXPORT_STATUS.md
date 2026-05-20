# Workflow export status (MVP criterion 4)

**Docs-only inventory.** This document tracks committed n8n workflow exports. It does **not** modify JSON files, open n8n UI, or run exports.

**Criterion (Italian):** Workflow n8n esportato come JSON committato nel repo control-plane.

**Related:** [MVP_CRITERIA.md](MVP_CRITERIA.md) §4, [workflows/README.md](../workflows/README.md), [N8N_REBUILD.md](N8N_REBUILD.md), [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md).

---

## Criterion 4 closure model

| Level | Meaning |
|-------|---------|
| **PARTIAL PASS (now)** | Redacted exports exist under `workflows/exports/`; canonical v4 export matches provisional MVP path |
| **Full PASS (pending)** | Runtime n8n workflow matches committed redacted export after activation/configuration; re-export if diverged |

**Rule:** If runtime workflow changes in n8n (nodes, schedule, repo list, message format), export again, redact, commit — or criterion 4 reopens.

---

## Canonical export (provisional MVP)

| File | Workflow name | Role |
|------|---------------|------|
| `2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json` | `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4` | **Active provisional path** — GitHub public read → `control_plane_state` dedupe → Telegram; one-minute schedule |

Use this file for [N8N_REBUILD.md](N8N_REBUILD.md) import. Runtime v4 is **active and stable** per [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md).

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

## Runtime vs committed export (pending check)

Before closing criterion 4 fully:

1. Open active workflow **v4** in n8n (runtime gate — not this task).
2. Compare structure to `2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json` (nodes, schedule interval, Data Table name, GitHub URL pattern).
3. If identical except chat_id/credential linkage → criterion 4 can move to **PASS**.
4. If runtime diverged → export from n8n, redact, commit new dated file, update this doc.

**Handoff workflow (criterion 2):** no export yet — expected after first runtime PASS.

---

## Docs-only path (this task)

| Action | Status |
|--------|--------|
| Inventory committed exports | Done |
| Mark canonical v4 / inactive v5 / failed v2 | Done |
| Modify `workflows/exports/*.json` | **Not done** — forbidden |
| Re-export from n8n | **Not done** — runtime gate |

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

- [ ] Redacted v4 JSON exists in repo — **yes**
- [ ] Follows naming convention — **yes**
- [ ] Runtime v4 matches committed export — **pending manual compare**
- [ ] No secrets in committed exports — **yes** (per file metadata)
- [ ] After handoff MVP: add redacted handoff workflow export when criterion 2 runtime exists

When runtime match is confirmed, set [MVP_CRITERIA.md](MVP_CRITERIA.md) §4 to **PASS**.

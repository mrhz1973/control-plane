# Workflow exports

n8n workflow JSON exports belong in **`workflows/exports/`**.

## Before commit

- Exports must be **redacted** before commit.
- Remove or replace: tokens, API keys, webhook secrets, credential IDs tied to secrets.
- **No tokenized URLs** (e.g. `https://api.telegram.org/bot<TOKEN>/...`).
- **No credentials** embedded in node parameters.

## Naming convention

```
YYYY-MM-DD_name.redacted.json
```

Example: `2026-05-20_push-notify.redacted.json`

## Criterion 2 — handoff manual gate

- **File:** `2026-05-20_handoff-generate-manual-telegram-v1.redacted.json`
- **Purpose:** MVP criterion 2 — Manual Trigger → Execute Command (handoff dry-run) → parse → Telegram `Prompt ready: yes/no`
- **Runtime (2026-05-20):** manual trigger PASS on phone — `Prompt ready: yes`, exit 0. Template: [2026-05-20_handoff-generate-manual-telegram-v1.redacted.json](exports/2026-05-20_handoff-generate-manual-telegram-v1.redacted.json). Re-export optional if UI workflow differs.
- **Import:** keep **inactive** until needed; set chat_id and credential in n8n UI only — see [HANDOFF_N8N_GATE.md](../docs/HANDOFF_N8N_GATE.md)
- **n8n 2.x:** Execute Command disabled when `NODES_EXCLUDE` unset — see HANDOFF_N8N_GATE diagnosis section
- **No secrets** in committed export

## v4 multirepo draft (criterion 3 notifica path)

- **File:** `2026-05-20_github-commit-datatable-dedupe-scheduled-v4-multirepo-draft.redacted.json`
- **Status:** **DRAFT — validated manually (2026-05-20) — inactive** (not active runtime)
- **Based on:** canonical v4 export; extends polling to `control-plane`, `dev-method`, `cursor-coordinate-converter`
- **Data Table keys (per repo):** `github:mrhz1973/control-plane:last_commit_sha`, `github:mrhz1973/dev-method:last_commit_sha`, `github:mrhz1973/cursor-coordinate-converter:last_commit_sha`
- **Runtime:** active v4 on VPS still **control-plane only** until UI import/update gate
- **Purpose:** fix Cycle 2 missing Telegram (`5ce0a25`) and support criterion 3 on product repos
- **Redaction:** same rules as v4 — `__CONFIGURE_CHAT_ID_IN_N8N_UI__`, `__REDACTED_N8N_CREDENTIAL_ID__`, no tokens in JSON
- **Item propagation (2026-05-20):** `runOnceForEachItem` + `.item` on Prepare/Format; Decide uses `Prepare.all()` + full state snapshot.
- **Missing state rows:** load-all snapshot + Decide join (no per-repo Get).
- **Execution order (2026-05-20):** **sequential** `Trigger → Data Table - Load all state rows → Emit watched repos (3) → …` — no parallel `Trigger → Emit`; required for `$('Data Table - Load all state rows').all()` in Decide.
- **Manual test (2026-05-20):** sequential state-load fix replay **PASS** — Telegram dev-method `5ce0a25` + retro GIS `34d543d`; Data Table keys for dev-method and GIS written; draft still **inactive**; active v4 unchanged
- **Next:** Cycle 3 end-to-end or separate runtime gate to promote multirepo scope

## Do not commit

- `*.unredacted.json` (listed in [.gitignore](../.gitignore))
- Raw exports straight from n8n without redaction pass

# Workflow exports

n8n workflow JSON exports belong in **`workflows/exports/`**.

## Before commit

- Exports must be **redacted** before commit (unless a newer policy gate explicitly allows a field in configuration assets).
- **Policy gate 2026-05-31:** operational **chat_id** is **no longer redacted by default** in workflow JSON templates and `data-tables/` CSV seed files committed as configuration assets.
- **chat_id** may appear in those configuration assets when required for ready-import/manual test workflows (e.g. workflow 49).
- Still **forbidden in Git:** Telegram bot token, credential id/content, webhook/auth URL, API key, OAuth material, PAT, chain-of-thought, unredacted execution dumps.
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
- **Redaction:** same rules as v4 — `__REDACTED_N8N_CREDENTIAL_ID__`, no tokens in JSON; chat_id may be committed in config assets per gate 2026-05-31 (legacy exports may still use `__CONFIGURE_CHAT_ID_IN_N8N_UI__`)
- **Item propagation (2026-05-20):** `runOnceForEachItem` + `.item` on Prepare/Format; Decide uses `Prepare.all()` + full state snapshot.
- **Missing state rows:** load-all snapshot + Decide join (no per-repo Get).
- **Execution order (2026-05-20):** **sequential** `Trigger → Data Table - Load all state rows → Emit watched repos (3) → …` — no parallel `Trigger → Emit`; required for `$('Data Table - Load all state rows').all()` in Decide.
- **Manual test (2026-05-20):** Cycle 2 replay **PASS** (`5ce0a25`, retro GIS `34d543d`); Cycle 3 replay **PASS** (`0be529d`, `Previous: 5ce0a25`, 2 duplicate-skip); draft still **inactive**; active v4 unchanged
- **Criterion 3:** closed (3/3) via draft notifica path — see [END_TO_END_CYCLES.md](../docs/END_TO_END_CYCLES.md)
- **Next:** criterion 5 rebuild validation or separate runtime promotion gate (not in docs-only registration)

## v4 multirepo 02F — canonical production export (PM-08 PASS)

- **File:** `exports/2026-05-21_github-commit-datatable-dedupe-scheduled-v4-multirepo-02f-handoff-safe-text.redacted.json`
- **Runtime name:** `02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT` — **active on VPS**; export in repo has **`active: false`** (import-safe)
- **Includes:** 1 min schedule; three-repo poll; Data Table dedupe; GIS safe-text handoff + `latest-gis-handoff.md` document branch
- **Redaction:** same rules as v4 — no token or real credential/workflow/webhook IDs in git; chat_id allowed in config assets per gate 2026-05-31 (this export may still use placeholders)
- **Do not commit:** `02F-unredacted-export-local-only.json` or `*.unredacted.json`

## Do not commit

- `*.unredacted.json` (listed in [.gitignore](../.gitignore))
- Raw exports straight from n8n without redaction pass

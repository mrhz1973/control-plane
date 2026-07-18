# LAST CURSOR REPORT — control-plane (rolling)

## Purpose

Registro su GitHub dell'evidenza post-push di Cursor, in formato leggibile e parsabile
(Markdown + blocco YAML-like). Il verificatore del PASS legge l'hash remoto da qui sul
remoto, oppure direttamente da `git ls-remote origin main` — **non** dalla chat Cursor.
Fonte primaria del PASS resta `PROJECT_VISION.md` §7.1 (hash remoto su `main`). Questo
file è l'artefatto persistente di quell'hash, non una sua sostituzione.

---

## LATEST

```yaml
task_ref: d0059w-wf48-parser-1-5-canonization
result_cursor: PASS_REPOSITORY_ONLY_IMPLEMENTATION
result_runtime: NOT_RUN_REPOSITORY_ONLY_CANONIZATION
base_commit: c241d3b0acf5786aa027bb1b1ae5005296621c0f
real_task_commit: 4c67225d1996c07616a5a2089add976d65b9b4a4
commit_subject: feat: canonize wf48 parser options 1-5
rolling_report_commit: PENDING_SELF_REFERENCE
remote_hash_verbatim: PENDING_SELF_REFERENCE
branch: main
decision_id: D-0059-W
selected_option: 1
decision_provenance: direct_operator_message
task_kind: repository_only_wf48_parser_canonization
template_path: workflows/wg-telegram-inbound-decision-state-correlation.template.json
wf48_parser_1_5_repository_canonized: true
wf48_parser_locations_expected: 3
wf48_parser_locations_updated: 3
wf48_callable_normalization_1_5: true
wf48_external_receipt_normalization_1_5: true
wf48_state_correlation_1_5: true
json_parse_pass: true
repository_fixture_pass: true
template_active: false
export_created: false
runtime_executed_by_cursor: false
runtime_actions_by_cursor: 0
official_wf48_option_4_runtime_pass: false
official_wf48_option_5_runtime_pass: false
enable_wg48_handoff: false
l5_activation_authorized: false
gate_e_status: OPERATOR_DECISION_PENDING
gate_e_full_pass: false
pm34_unblocked: false
n8n_ready: false
timestamp_utc: 2026-07-18
```

- **Commit 1 — D-0059-W repository canonization:** template wf48 parser options **1–5** in three nodes; session + frontier + runbook + activation plan; **no export**; runtime **not** run.
- **Commit 2 (questo report):** `LAST_CURSOR_REPORT.md` + `LAST_HANDOFF_VERIFY.md` + handoff; **non** certifica il proprio hash.
- **Runtime actions by Cursor:** `0`. Session: `docs/sessions/2026-07-18-control-plane-d-0059-w-wf48-parser-1-5-canonization.md`.
- Snapshot verifica attraverso `4c67225d1996c07616a5a2089add976d65b9b4a4`; `rolling_report_commit: PENDING_SELF_REFERENCE`.

**Post-push evidence (commit 1 — real task):**

```text
git log --oneline -8
4c67225 feat: canonize wf48 parser options 1-5
c241d3b docs: refresh runtime reports for D-0055 through D-0058
48537b3 docs: record D-0055 wf47 option 4 pass and D-0058 close
3560949 docs: refresh runtime reports for redaction policy update
b5da3a6 docs: move redaction policy to operator responsibility
be0cd76 docs: refresh runtime reports for D-0054
3dab99f docs: record D-0054 wf47 inventory restore
eea0b4a docs: refresh runtime reports for D-0052 and D-0053

git status --short

git rev-parse HEAD
4c67225d1996c07616a5a2089add976d65b9b4a4

git rev-parse origin/main
4c67225d1996c07616a5a2089add976d65b9b4a4

git branch --show-current
main

git show --stat HEAD
commit 4c67225d1996c07616a5a2089add976d65b9b4a4
 docs/runtime/AUTOMATION_ACTIVATION_PLAN.md         |  21 ++++-
 docs/runtime/CURRENT_FRONTIER.md                   |  28 +++---
 ...-plane-d-0059-w-wf48-parser-1-5-canonization.md | 105 +++++++++++++++++++++
 docs/workflow-wf47-wg-operationalization-plan.md   |   5 +-
 ...-telegram-inbound-decision-state-correlation.md |  40 +++++++-
 ...nbound-decision-state-correlation.template.json |   6 +-
 6 files changed, 180 insertions(+), 25 deletions(-)

git ls-remote origin refs/heads/main
4c67225d1996c07616a5a2089add976d65b9b4a4\trefs/heads/main

git diff --name-only c241d3b0acf5786aa027bb1b1ae5005296621c0f..HEAD
docs/runtime/AUTOMATION_ACTIVATION_PLAN.md
docs/runtime/CURRENT_FRONTIER.md
docs/sessions/2026-07-18-control-plane-d-0059-w-wf48-parser-1-5-canonization.md
docs/workflow-wf47-wg-operationalization-plan.md
docs/workflow-wg-telegram-inbound-decision-state-correlation.md
workflows/wg-telegram-inbound-decision-state-correlation.template.json
```

---

## Rules## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task.
- I campi `rolling_report_commit` e `remote_hash_verbatim` del LATEST restano `PENDING_SELF_REFERENCE` finché quel LATEST è il più recente; si backfillano in HISTORY al task successivo. **Non** esiste un commit finalize-hash dedicato (`PROJECT_VISION.md` §8.1).
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Orchestratore:** se il report Cursor include già l'output post-push verbatim completo (`PROJECT_VISION.md` §8.1), **non** chiedere shell manuale all'utente; leggere anche `docs/runtime/LAST_HANDOFF_VERIFY.md` durante `aggio control`; verify-only Cursor se manca/stale; shell utente = fallback finale.
- **Policy materiali sensibili v2.16:** repo non-confidenziale secondo `PROJECT_VISION.md` §10 v2.18. **Redazione a cura dell'operatore** (token, ID, credenziali, identificatori Telegram, ecc.) prima di incollare in chat o autorizzare commit. Nessuna clausola esplicita «no secrets» / «redazione obbligatoria» nei prompt Cursor o nei session log futuri. Controllo compensativo: rotazione credenziali a fine progetto (`docs/ROTATION_CHECKLIST.md`). Tolleranze chat_id e identificatori tailnet invariate (§10).
- **Two-commit convention:** quando un task reale deve essere referenziato dal rolling report, Cursor crea prima il commit reale (commit 1), cattura l'hash con `git rev-parse HEAD`, e solo dopo crea il commit docs/report (commit 2). Cursor **non** deve mai predire o inventare il proprio hash futuro.

---

## HISTORY

Solo le **5 entry più recenti**, compatte. Cronologia precedente: Git history + `docs/sessions/`.

```yaml
- task_ref: d0055w-d0058w-wf47-option4-pass-wf48-manual-close
  real_task_commit: 48537b3e19ea60a120f29c263ace6fd9a773d258
  base_commit: 356094921e04f9be5396dea3de658345343b391e
  rolling_report_commit: c241d3b0acf5786aa027bb1b1ae5005296621c0f
  remote_hash_verbatim: c241d3b0acf5786aa027bb1b1ae5005296621c0f
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_WF47_OFFICIAL_PLAIN_OPTION_4
  timestamp_utc: 2026-07-18

- task_ref: redaction-policy-operator-responsibility
  real_task_commit: b5da3a658267d5a62877cdb121a6d1f2fb31ff7e
  base_commit: be0cd7685ff6362f9879f660061e3c05e549a594
  rolling_report_commit: 356094921e04f9be5396dea3de658345343b391e
  remote_hash_verbatim: 356094921e04f9be5396dea3de658345343b391e
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_POLICY_UPDATE
  timestamp_utc: 2026-07-18

- task_ref: d0054w-wf47-official-inventory-restore
  real_task_commit: 3dab99f1d5a936c2fc57b928e8a83bd94e54e84a
  base_commit: eea0b4a5ee2adc66c24dd5bd76d4be4d38bdbce1
  rolling_report_commit: be0cd7685ff6362f9879f660061e3c05e549a594
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_CONFIGURATION_ONLY
  result_ui: PASS_ATTESTATO_UTENTE_CONFIGURATION_ONLY
  timestamp_utc: 2026-07-17

- task_ref: d0052w-l4-callback-pass-d0053g-option2
  real_task_commit: 861d41ed0845a7f70e64d17a804e047af560e77f
  base_commit: 97d420c0231e678edc9b440d61923fe3346cb93c
  rolling_report_commit: eea0b4a5ee2adc66c24dd5bd76d4be4d38bdbce1
  remote_hash_verbatim: eea0b4a5ee2adc66c24dd5bd76d4be4d38bdbce1
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L4_CALLBACK
  timestamp_utc: 2026-07-17

- task_ref: d0051g-d0050w-commit-provenance-correction
  real_task_commit: a2d088912ee83603f5fd96b08921937c7d382914
  base_commit: 7515fc9d922fb80f2003fbefde87957c18917a04
  rolling_report_commit: 7a7eb9b5870995404c0a25870d6dec4e9f1830b8
  result_cursor: PASS_REPORT_ONLY_GOVERNANCE_CORRECTION
  result_runtime: NOT_RUN_AUDIT_CORRECTION
  timestamp_utc: 2026-07-12
```


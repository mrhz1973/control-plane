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
task_ref: d0070w-d0069e-gate-e-closure
result_cursor: PASS_DOCS_ONLY
result_runtime: NOT_RUN_DECISION_PERSISTENCE
base_commit: 38915b43c7c6dad26fed6274c6f4939222c1a7be
real_task_commit: PENDING_SELF_REFERENCE
commit_subject: docs: record D-0069 Gate E closure
rolling_report_commit: PENDING_SELF_REFERENCE
remote_hash_verbatim: PENDING_SELF_REFERENCE
branch: main
decision_id: D-0070-W
related_decision_id: D-0069-E
selected_option: "1"
decision_provenance: direct_operator_message
operator_decision_timestamp_utc: "2026-07-18T19:53:25Z"
task_kind: docs_only_gate_e_closure
cursor_authored_or_modified_workflow: false
workflows_path_touched: false
cursor_independent_n8n_verification: false
runtime_evidence_source: operator_attested
Gate_E_full: PASS
Gate_E_status: CLOSED
gate_e_closure_basis: cumulative_existing_evidence
new_runtime_executed_for_closure: false
d0068_verify_only_result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED
d0068_verified_commit: 38915b43c7c6dad26fed6274c6f4939222c1a7be
teardown_evidence_gap: CLOSED
enable_wg48_handoff: false
l5_activation_authorized: false
L5_PASS: NOT_CLAIMED
pm34_unblocked: false
n8n_ready: false
runtime_executed_by_cursor: false
runtime_actions_by_cursor: 0
timestamp_utc: 2026-07-18
```

- **D-0070-W docs-only:** persist D-0069-E Gate E closure (option `"1"`) + contextual rolling backfill of D-0067 via D-0068-V.
- **Gate E:** `PASS` / `CLOSED` on `cumulative_existing_evidence`; **no new runtime** for closure.
- **Provenance:** runtime evidence remains operator-attested; Cursor did **not** independently observe n8n or authenticate screenshot pixels.
- **L5 separation:** `l5_activation_authorized: false` · `L5_PASS: NOT_CLAIMED`.
- **Single-commit docs-only:** `real_task_commit` / `rolling_report_commit` remain `PENDING_SELF_REFERENCE`; authoritative task commit = `HEAD` / `origin/main` / `ls-remote` after push.
- Session: `docs/sessions/2026-07-18-control-plane-d-0069-e-d-0070-w-gate-e-closure.md`.

---

## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task.
- I campi `rolling_report_commit` e `remote_hash_verbatim` del LATEST restano `PENDING_SELF_REFERENCE` finché quel LATEST è il più recente; si backfillano in HISTORY al task successivo. **Non** esiste un commit finalize-hash dedicato (`PROJECT_VISION.md` §8.1).
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Orchestratore:** se il report Cursor include già l'output post-push verbatim completo (`PROJECT_VISION.md` §8.1), **non** chiedere shell manuale all'utente; leggere anche `docs/runtime/LAST_HANDOFF_VERIFY.md` durante `aggio control`; verify-only Cursor se manca/stale; shell utente = fallback finale.
- **Policy materiali sensibili v2.16:** repo non-confidenziale secondo `PROJECT_VISION.md` §10 v2.19. **Redazione a cura dell'operatore**.
- **Workflow-authoring boundary:** GPT-B owns n8n authoring; Cursor does not independently create/modify workflows (`PROJECT_VISION.md` §2.1–§2.2).
- **Cursor routing:** repository/path/branch/task — color labels non-canonical (`PROJECT_VISION.md` §2.3).

---

## HISTORY

Solo le **5 entry più recenti**, compatte. Cronologia precedente: Git history + `docs/sessions/`.

```yaml
- task_ref: d0067w-d0066e-teardown-verification-closure
  real_task_commit: 38915b43c7c6dad26fed6274c6f4939222c1a7be
  base_commit: 1eb2be6af07196506b6849c19ecd36509a3f810f
  rolling_report_commit: 38915b43c7c6dad26fed6274c6f4939222c1a7be
  remote_hash_verbatim: 38915b43c7c6dad26fed6274c6f4939222c1a7be
  verification_result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_REMOTE_DOCUMENTAL_TEARDOWN_VERIFICATION
  timestamp_utc: 2026-07-18

- task_ref: d0065w-wf47-wf48-runtime-pass-and-workflow-authoring-boundary
  real_task_commit: 1eb2be6af07196506b6849c19ecd36509a3f810f
  base_commit: cc550d227f2483207665362d2857c7d5b99bf2c6
  rolling_report_commit: 1eb2be6af07196506b6849c19ecd36509a3f810f
  remote_hash_verbatim: 1eb2be6af07196506b6849c19ecd36509a3f810f
  verification_result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_D0062_D0063_OPERATOR_ATTESTED
  timestamp_utc: 2026-07-18

- task_ref: d0059w-wf48-parser-1-5-canonization
  real_task_commit: 4c67225d1996c07616a5a2089add976d65b9b4a4
  base_commit: c241d3b0acf5786aa027bb1b1ae5005296621c0f
  rolling_report_commit: 9d4c46a43e8b6fc60705d414b63f44b2fdb223f7
  remote_hash_verbatim: 9d4c46a43e8b6fc60705d414b63f44b2fdb223f7
  result_cursor: PASS_REPOSITORY_ONLY_IMPLEMENTATION
  result_runtime: NOT_RUN_REPOSITORY_ONLY_CANONIZATION
  timestamp_utc: 2026-07-18

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
```

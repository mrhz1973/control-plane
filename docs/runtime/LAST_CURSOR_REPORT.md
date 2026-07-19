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
task_ref: d0077w-d0074e-l5-bounded-pilot-persistence
decision_id: D-0077-W
related_decision_id: D-0074-E
selected_option: "1"
decision_provenance: direct_operator_message
operator_decision_date_utc: 2026-07-18
operator_decision_timestamp_utc: NOT_CAPTURED_EXACTLY
task_kind: docs_only_substantive_runtime_evidence_persistence

result_cursor: PASS_DOCS_ONLY
result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L5_BOUNDED_OPERATIONAL_PILOT

base_commit: cafd3e5d435a2a24aa38e95becaab217ec3cc09d
real_task_commit: PENDING_SELF_REFERENCE
rolling_report_commit: PENDING_SELF_REFERENCE
remote_hash_verbatim: PENDING_SELF_REFERENCE
commit_subject: docs: record D-0074-E bounded L5 pilot
branch: main

d0071v_verify_only_result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED
d0071v_verified_commit: cafd3e5d435a2a24aa38e95becaab217ec3cc09d
d0071v_actor_relation: intra_actor_self_verify
d0071v_independent_third_party_verification: false

backfill_status: COMPLETED_CONTEXTUALLY_IN_D0077W
previous_verified_through_commit: 38915b43c7c6dad26fed6274c6f4939222c1a7be
new_verified_through_commit: cafd3e5d435a2a24aa38e95becaab217ec3cc09d
backfill_basis: D-0071-V

pilot_decision_id: D-9011-T
pilot_selected_option: "1"
pilot_update_id: 986228611
pilot_open_count_final: 0
wf47_execution_count: 5
wf47_execution_count_max: 5
pilot_elapsed_first_to_last_minutes: 4
pilot_window_max_minutes: 5
bounded_limits_result: PASS
pilot_result_source: direct_operator_attestation

diagnostic_finding: allowed_chat_configured_false_then_true
diagnostic_finding_status: NON_BLOCKING_DIAGNOSTIC_INCONSISTENCY
follow_up_required: false
follow_up_trigger: future_gate_may_reopen_investigation

bounded_pilot_authorized_historically: true
bounded_pilot_authorization_consumed: true
l5_bounded_pilot_runtime_authorized_current: false
l5_runtime_authorized: false
l5_activation_authorized: false
L5_PASS: NOT_CLAIMED

Gate_E_full: PASS
Gate_E_status: CLOSED

PM_34: BLOCKED
pm34_unblocked: false
n8n_ready: false
enable_wg48_handoff: false
permanent_schedule_count: 0
public_webhook_count: 0

wf47_active: false
wf47_published: false
wf47_schedule_enabled: false
wf48_autonomous_trigger_present: false
wf48_publication_mode: triggerless_callable_only
wf49_included: false

cursor_authored_or_modified_workflow: false
workflows_path_touched: false
cursor_independent_n8n_verification: false
cursor_authenticated_screenshot_pixels: false
runtime_executed_by_cursor: false
runtime_actions_by_cursor: 0
timestamp_utc: 2026-07-19
```

- **D-0077-W** persists operator-attested evidence only (no Cursor n8n observation / no screenshot-pixel authentication / no runtime execution by Cursor).
- **D-0071-V** rolling backfill was completed contextually (`38915b43` → `cafd3e5`; `intra_actor_self_verify`).
- **D-0077-W does not self-certify.** `PENDING_SELF_REFERENCE` fields must be backfilled in the next substantive task after **D-0078-V**.
- No dedicated finalize-hash or backfill-only task.
- Session: `docs/sessions/2026-07-19-control-plane-d-0074-e-d-0077-w-l5-bounded-pilot-pass.md`.

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
- task_ref: d0070w-d0069e-gate-e-closure
  real_task_commit: cafd3e5d435a2a24aa38e95becaab217ec3cc09d
  base_commit: 38915b43c7c6dad26fed6274c6f4939222c1a7be
  rolling_report_commit: cafd3e5d435a2a24aa38e95becaab217ec3cc09d
  remote_hash_verbatim: cafd3e5d435a2a24aa38e95becaab217ec3cc09d
  verification_result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED
  d0071v_actor_relation: intra_actor_self_verify
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_DECISION_PERSISTENCE
  timestamp_utc: 2026-07-18

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
```

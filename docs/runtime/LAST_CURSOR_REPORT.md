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
task_ref: d0080w-d0079e-l5-permanent-deferred
decision_id: D-0080-W
related_decision_id: D-0079-E
selected_option: "3"
decision_provenance: direct_operator_message
operator_decision_date_utc: 2026-07-19
operator_decision_timestamp_utc: NOT_CAPTURED_EXACTLY
task_kind: docs_only_l5_scope_and_endurance_planning

result_cursor: PASS_DOCS_ONLY
result_runtime: NOT_RUN_PLANNING_ONLY

base_commit: 218cb99b4a4a97429b44c2e5a9232497a0948450
real_task_commit: PENDING_SELF_REFERENCE
rolling_report_commit: PENDING_SELF_REFERENCE
remote_hash_verbatim: PENDING_SELF_REFERENCE
commit_subject: docs: defer permanent L5 pending endurance evidence
branch: main

l5_permanent_assessment: DEFERRED_PENDING_ENDURANCE_EVIDENCE
L5_PASS: NOT_CLAIMED
l5_activation_authorized: false
l5_runtime_authorized: false
endurance_runtime_authorized: false
permanent_schedule_authorized: false

scope_document: docs/runtime/L5_PERMANENT_SCOPE_AND_ENDURANCE_PLAN.md

d0078v_verify_result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED
d0078v_verified_commit: 218cb99b4a4a97429b44c2e5a9232497a0948450
d0078v_actor_relation: intra_actor_self_verify
d0078v_independent_third_party_verification: false

previous_verified_through_commit: cafd3e5d435a2a24aa38e95becaab217ec3cc09d
new_verified_through_commit: 218cb99b4a4a97429b44c2e5a9232497a0948450
backfill_status: COMPLETED_CONTEXTUALLY_IN_D0080W
backfill_basis: D-0078-V

d0078v_f1_status: CLOSED_CONTEXTUALLY_IN_D0080W

Gate_E_full: PASS
Gate_E_status: CLOSED
PM_34: BLOCKED
pm34_unblocked: false
n8n_ready: false
enable_wg48_handoff: false

cursor_authored_or_modified_workflow: false
workflows_path_touched: false
runtime_executed_by_cursor: false
runtime_actions_by_cursor: 0
timestamp_utc: 2026-07-19
```

- **D-0080-W** is docs-only planning/governance; `result_runtime: NOT_RUN_PLANNING_ONLY`.
- Permanent L5 deferred; Scope Document created; endurance package defined but **not** authorized.
- **D-0078-V** contextual backfill completed (`cafd3e5` → `218cb99`; `intra_actor_self_verify`).
- **D-0078-V-F1** wording closed contextually.
- **D-0080-W does not self-certify.** `PENDING_SELF_REFERENCE` fields await the next substantive task after verify-only of this HEAD.
- No dedicated finalize-hash or backfill-only task.
- Session: `docs/sessions/2026-07-19-control-plane-d-0079-e-d-0080-w-l5-permanent-deferred.md`.

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
- task_ref: d0077w-d0074e-l5-bounded-pilot-persistence
  real_task_commit: 218cb99b4a4a97429b44c2e5a9232497a0948450
  base_commit: cafd3e5d435a2a24aa38e95becaab217ec3cc09d
  rolling_report_commit: 218cb99b4a4a97429b44c2e5a9232497a0948450
  remote_hash_verbatim: 218cb99b4a4a97429b44c2e5a9232497a0948450
  verification_result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY_VERIFIED
  d0078v_actor_relation: intra_actor_self_verify
  result_cursor: PASS_DOCS_ONLY
  result_runtime: PASS_ATTESTATO_UTENTE_SCOPE_LIMITED_L5_BOUNDED_OPERATIONAL_PILOT
  timestamp_utc: 2026-07-19

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
```

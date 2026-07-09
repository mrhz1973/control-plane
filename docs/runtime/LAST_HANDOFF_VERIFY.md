# LAST HANDOFF VERIFY — control-plane (persistent)

## Purpose

Artefatto persistente su GitHub per **handoff / `aggio control`**: consente all'orchestratore di leggere l'ultimo blocco di verifica post-push **senza** chiedere subito shell manuale all'utente.

- **`docs/runtime/LAST_CURSOR_REPORT.md`** — rolling report per task Cursor (LATEST/HISTORY, `real_task_commit`).
- **`docs/runtime/LAST_HANDOFF_VERIFY.md`** (questo file) — snapshot dell'**ultimo stato remoto verificato**, con output git verbatim e modello **`verified_through_commit`**.

Fonte canonica regole: `docs/foundation/PROJECT_VISION.md` §8.1 (Handoff / post-push verification invariant).

---

## Rules

- **Non auto-certificazione:** questo file **non** certifica il proprio commit di aggiornamento. Usa **`verified_through_commit`** = ultimo commit già verificato con output coerenti.
- **`artifact_commit`:** SHA del commit che ha scritto/aggiornato questo file. Resta **`PENDING_SELF_REFERENCE`** finché un task successivo non backfilla (stesso pattern di `LAST_CURSOR_REPORT.md`). Nessun commit "finalize hash" dedicato.
- **PASS remoto verificabile** fino a `verified_through_commit` quando:
  - `observed_head == observed_origin_main == observed_ls_remote_main`
  - `branch == main`
  - `workspace_status == clean`
- **HEAD GitHub corrente > `verified_through_commit`:** l'artefatto resta utile (contesto storico) ma **non** certifica l'HEAD corrente → orchestratore: prompt **Cursor verify-only** prima di shell utente.
- **Ordine fallback orchestratore (`aggio control`):**
  1. Report Cursor in chat (se output post-push completi)
  2. **`LAST_HANDOFF_VERIFY.md`** su GitHub (se aggiornato e coerente con HEAD remoto)
  3. **`LAST_CURSOR_REPORT.md`** su GitHub
  4. Prompt **Cursor verify-only** (git read-only, zero edit)
  5. Shell manuale utente = **fallback finale**
- **Policy materiali sensibili v2.15:** il repo è trattato come non-confidenziale secondo `PROJECT_VISION.md` §10; non stampare o introdurre token, API key, OAuth material, PAT, URL con token, credential material o runtime dump non previsto. Chat_id e identificatori tailnet seguono le eccezioni/tolleranze documentate in `PROJECT_VISION.md` §10. Controllo compensativo finale: rotazione credenziali secondo `docs/ROTATION_CHECKLIST.md`.

---

## Previous snapshot (backfilled)

```yaml
task_ref: ge02-bounded-runtime-pr4-merge-post-report
verified_task_commit: b6e293f8abd41db65064f24d283eb7aa9a8d96e6
verified_substance_commit: 84b264ef076e83c6fad40292acb9eb407307b218
verified_pr_head_commit: 021c5ca0271e50a764a2260b7208af846d8b6cad
verified_base_commit: e589b9e8384d2262864877fe5070d5ab60c8b98e
verified_rolling_report_commit: 0b9fe468a0e1672d314c25e1276082b25a01da6f
verified_through_commit: b6e293f8abd41db65064f24d283eb7aa9a8d96e6
observed_head: b6e293f8abd41db65064f24d283eb7aa9a8d96e6
observed_origin_main: b6e293f8abd41db65064f24d283eb7aa9a8d96e6
observed_ls_remote_main: b6e293f8abd41db65064f24d283eb7aa9a8d96e6
branch: main
workspace_status: clean
artifact_commit: 0b9fe468a0e1672d314c25e1276082b25a01da6f
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: PASS_ATTESTATO_UTENTE
timestamp_utc: 2026-07-06
```

**Nota:** snapshot PR #4 merge post-report verificato attraverso merge `b6e293f`; `artifact_commit` e `verified_rolling_report_commit` backfilled a `0b9fe46`.

---

## Latest verified snapshot

```yaml
task_ref: wf47-wg48-bounded-handoff-pass
verified_task_commit: 823d025b27b2cf488422eedadff4c73437e0a391
verified_base_commit: 0b9fe468a0e1672d314c25e1276082b25a01da6f
verified_rolling_report_commit: PENDING_SELF_REFERENCE
verified_through_commit: 823d025b27b2cf488422eedadff4c73437e0a391
observed_head: 823d025b27b2cf488422eedadff4c73437e0a391
observed_origin_main: 823d025b27b2cf488422eedadff4c73437e0a391
observed_ls_remote_main: 823d025b27b2cf488422eedadff4c73437e0a391
branch: main
workspace_status: clean
artifact_commit: PENDING_SELF_REFERENCE
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: PASS_ATTESTATO_UTENTE
timestamp_utc: 2026-07-09
```

**Nota:** questo snapshot verifica attraverso `823d025` — commit 1 wf47→wf48 bounded automatic handoff user-attested: `docs/workflow-wf47-wg-operationalization-plan.md` §4undecies; **PASS_ATTESTATO_UTENTE**; `D-3045-T`; `update_id` **986228600**; `selected_option` **1**; `prior_status` open → closed; `state_persisted` true; table hygiene completed; runtime restored (`enable_wg48_handoff=false`); no Publish/Active/Schedule/webhook/Telegram Trigger. **NOT Gate E full PASS**; **NOT global PASS runtime**; **PM-34 BLOCKED**; **`n8n_ready=false`**; wf40/41/42 untouched; nessun workflow JSON/data-tables edit; nessun runtime da Cursor. Commit 2 = solo artefatti verifica/report. Il commit che aggiorna questo file **non** si auto-certifica; resta `artifact_commit: PENDING_SELF_REFERENCE`.

**Backfill PENDING_SELF_REFERENCE:** PR #4 merge post-report snapshot → `0b9fe46`.

---

## Command outputs (verbatim, sanitized — wf47→wf48 bounded handoff pass)

```text
git rev-parse HEAD
823d025b27b2cf488422eedadff4c73437e0a391

git rev-parse origin/main
823d025b27b2cf488422eedadff4c73437e0a391

git ls-remote origin refs/heads/main
823d025b27b2cf488422eedadff4c73437e0a391	refs/heads/main

git status --short

git diff --name-only 0b9fe468a0e1672d314c25e1276082b25a01da6f..HEAD
docs/workflow-wf47-wg-operationalization-plan.md

git log --oneline -8
823d025 docs: record wf47 wg48 bounded handoff pass
0b9fe46 docs: refresh PR4 merge verification artifacts
b6e293f Merge PR #4: docs GE-02 bounded runtime record
021c5ca docs: refresh GE-02 runtime verification artifacts
84b264e docs: record GE-02 bounded runtime result
e589b9e docs: refresh PR2 merge verification artifacts
ea1dbef Merge PR #2: docs D-0038-E wf45 import-only result
a75dfc4 docs: refresh D-0038-E wf45 import UI-only verification artifacts
```

**BASE (preflight commit 1):** `0b9fe468a0e1672d314c25e1276082b25a01da6f`

---

## Required fields (per aggiornamento futuro)

Ogni refresh di questo file deve includere nel blocco YAML:

| Campo | Descrizione |
|-------|-------------|
| `task_ref` | Riferimento task verificato |
| `verified_task_commit` | Commit 1 del task (sostanza) |
| `verified_rolling_report_commit` | Commit 2 rolling report, se applicabile |
| `verified_through_commit` | Ultimo commit remoto verificato con hash coerenti |
| `observed_head` / `observed_origin_main` / `observed_ls_remote_main` | Output osservati al momento della verifica |
| `branch` | Deve essere `main` |
| `workspace_status` | `clean` o descrizione dirty |
| `artifact_commit` | `PENDING_SELF_REFERENCE` fino a backfill al task successivo |
| `result` / `result_runtime` | Esito Cursor / runtime |
| `timestamp_utc` | Data verifica |

Sezione **Command outputs** = output testuale verbatim (non tabelle riassuntive).

---

## Fallback logic

```
aggio control
    │
    ├─ report Cursor in chat con output post-push completi? → PASS remoto
    │
    ├─ leggi LAST_HANDOFF_VERIFY.md su GitHub
    │       │
    │       ├─ HEAD remoto == verified_through_commit
    │       │   AND observed_head == observed_origin_main == observed_ls_remote_main
    │       │   AND branch main AND workspace clean
    │       │       → PASS remoto fino a verified_through_commit
    │       │
    │       └─ HEAD remoto > verified_through_commit (artefatto stale)
    │               → verify-only Cursor (non shell utente)
    │
    ├─ leggi LAST_CURSOR_REPORT.md (contesto task)
    │
    ├─ prompt Cursor verify-only
    │
    └─ shell utente (fallback finale)
```

**Nota:** il commit che aggiorna questo file è verificabile tramite output post-push del task corrente o backfill al task successivo — **non** tramite auto-riferimento nel medesimo snapshot.

**Futuro:** [`AUTOMATIC_POST_PUSH_VERIFIER.md`](AUTOMATIC_POST_PUSH_VERIFIER.md) — worker/n8n popolerà questo file automaticamente; fino ad allora aggiornamento manuale o via Cursor task.

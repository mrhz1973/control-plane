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
task_ref: d0038e-wf45-import-ui-only-pr2-merge-post-report
verified_task_commit: ea1dbef504c48c9edae547181d96268b1974e898
verified_substance_commit: 11747f91d707f71c76accab93489ab44627f009e
verified_pr_head_commit: a75dfc476ba70318c85f6c2b62075cc68ea2a275
verified_base_commit: eb43cef571774a1b513328d8f4837c2c7224c4fc
verified_rolling_report_commit: e589b9e8384d2262864877fe5070d5ab60c8b98e
verified_through_commit: ea1dbef504c48c9edae547181d96268b1974e898
observed_head: ea1dbef504c48c9edae547181d96268b1974e898
observed_origin_main: ea1dbef504c48c9edae547181d96268b1974e898
observed_ls_remote_main: ea1dbef504c48c9edae547181d96268b1974e898
branch: main
workspace_status: clean
artifact_commit: e589b9e8384d2262864877fe5070d5ab60c8b98e
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN
timestamp_utc: 2026-07-06
```

**Nota:** snapshot PR #2 merge post-report verificato attraverso merge `ea1dbef`; `artifact_commit` e `verified_rolling_report_commit` backfilled a `e589b9e`. PASS_IMPORT_UI_ONLY; GE-02 non autorizzato.

---

## Latest verified snapshot

```yaml
task_ref: d0041e-ge02-prep-docs-only
verified_task_commit: d4082ae0e6b5ff940b2e9c6768b58510b00e4c1c
verified_base_commit: e589b9e8384d2262864877fe5070d5ab60c8b98e
verified_rolling_report_commit: PENDING_SELF_REFERENCE
verified_through_commit: d4082ae0e6b5ff940b2e9c6768b58510b00e4c1c
observed_head: d4082ae0e6b5ff940b2e9c6768b58510b00e4c1c
observed_origin_main: d4082ae0e6b5ff940b2e9c6768b58510b00e4c1c
observed_ls_remote_main: d4082ae0e6b5ff940b2e9c6768b58510b00e4c1c
branch: main
workspace_status: clean
artifact_commit: PENDING_SELF_REFERENCE
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN
timestamp_utc: 2026-07-06
```

**Nota:** questo snapshot verifica attraverso `d4082ae` — commit 1 D-0041-E GE-02 prep docs-only (option 1 = GO PREP GE-02 DOCS-ONLY): sessione `docs/sessions/2026-07-06-control-plane-d0041e-ge02-prep-docs-only.md`; packet skeleton minimo per run manuale bounded; **NOT GE-02 run**; **NOT Gate E PASS**; **NOT PASS runtime**; **GE-02 run = not authorized**; **PM-34 BLOCKED**; **`n8n_ready=false`**; **`enable_wg48_handoff=false`**; wf40/41/42 untouched; nessun runtime n8n/import/publish/Telegram/classifier/tunnel eseguito o attivato da Cursor. Commit 2 = solo artefatti verifica/report. Il commit che aggiorna questo file **non** si auto-certifica; resta `artifact_commit: PENDING_SELF_REFERENCE`.

**Backfill PENDING_SELF_REFERENCE:** PR #2 merge post-report snapshot → `e589b9e`.

---

## Command outputs (verbatim, sanitized — D-0041-E GE-02 prep docs-only)

```text
git rev-parse HEAD
d4082ae0e6b5ff940b2e9c6768b58510b00e4c1c

git rev-parse origin/main
d4082ae0e6b5ff940b2e9c6768b58510b00e4c1c

git ls-remote origin refs/heads/main
d4082ae0e6b5ff940b2e9c6768b58510b00e4c1c	refs/heads/main

git status --short

git diff --name-only e589b9e8384d2262864877fe5070d5ab60c8b98e..HEAD
docs/sessions/2026-07-06-control-plane-d0041e-ge02-prep-docs-only.md

git log --oneline -8
d4082ae docs: prepare D-0041-E GE-02 docs-only packet
e589b9e docs: refresh PR2 merge verification artifacts
ea1dbef Merge PR #2: docs D-0038-E wf45 import-only result
a75dfc4 docs: refresh D-0038-E wf45 import UI-only verification artifacts
11747f9 docs: record D-0038-E wf45 import-only result
eb43cef docs: refresh GLM advisor starter verification artifacts
63f3709 docs: add fixed GLM advisor session starter
389eaf3 docs: refresh GE-01 PR1 merge verification artifacts
```

**BASE (preflight commit 1):** `e589b9e8384d2262864877fe5070d5ab60c8b98e`

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

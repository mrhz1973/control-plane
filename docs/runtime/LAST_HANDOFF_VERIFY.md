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
task_ref: glm-advisor-session-starter-docs-only
verified_task_commit: 63f37090137f78bc7165c625fee20e5f316a8468
verified_base_commit: 389eaf3df6d0ba138b569eeadf858f13a557a7a9
verified_rolling_report_commit: eb43cef571774a1b513328d8f4837c2c7224c4fc
verified_through_commit: 63f37090137f78bc7165c625fee20e5f316a8468
observed_head: 63f37090137f78bc7165c625fee20e5f316a8468
observed_origin_main: 63f37090137f78bc7165c625fee20e5f316a8468
observed_ls_remote_main: 63f37090137f78bc7165c625fee20e5f316a8468
branch: main
workspace_status: clean
artifact_commit: eb43cef571774a1b513328d8f4837c2c7224c4fc
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN
timestamp_utc: 2026-07-04
```

**Nota:** snapshot GLM Advisor session starter verificato attraverso `63f3709`; `artifact_commit` e `verified_rolling_report_commit` backfilled a `eb43cef`. Non Gate E PASS; GE-02 non autorizzato.

---

## Latest verified snapshot

```yaml
task_ref: d0038e-wf45-import-ui-only-pass
verified_task_commit: 11747f91d707f71c76accab93489ab44627f009e
verified_base_commit: eb43cef571774a1b513328d8f4837c2c7224c4fc
verified_rolling_report_commit: PENDING_SELF_REFERENCE
verified_through_commit: 11747f91d707f71c76accab93489ab44627f009e
observed_head: 11747f91d707f71c76accab93489ab44627f009e
observed_origin_main: 11747f91d707f71c76accab93489ab44627f009e
observed_ls_remote_main: 11747f91d707f71c76accab93489ab44627f009e
branch: main
workspace_status: clean
artifact_commit: PENDING_SELF_REFERENCE
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN
timestamp_utc: 2026-07-06
```

**Nota:** questo snapshot verifica attraverso `11747f9` — commit 1 D-0038-E wf45 import UI-only (option 1): sessione `docs/sessions/2026-07-06-control-plane-d0038e-wf45-import-ui-only-pass.md`; import target `workflows/exports/2026-07-04_wd-45-operational-decision-packet-integration-ge01-fixforward.proposed.redacted.json`; export storico 2026-07-02 **non** importato; risultato **PASS_IMPORT_UI_ONLY**; runtime **NOT_RUN**; Execute workflow **NOT_PRESSED**; Publish **NOT_PRESSED**; Telegram/classifier **NOT_RUN**; evidenza screenshot operatore (singola catena wf45 con nodo Collapse load fan-out presente). **Non** è Gate E PASS; **non** è PASS runtime; **GE-02 = not authorized**; **PM-34 BLOCKED**; **`n8n_ready=false`**; wf40/41/42 untouched; nessun runtime n8n eseguito o attivato da Cursor. Commit 2 = solo artefatti verifica/report. Il commit che aggiorna questo file **non** si auto-certifica; resta il modello `artifact_commit: PENDING_SELF_REFERENCE`.

**Backfill PENDING_SELF_REFERENCE:** GLM Advisor session starter snapshot → `eb43cef`.

---

## Command outputs (verbatim, sanitized — D-0038-E wf45 import UI-only)

```text
git rev-parse HEAD
11747f91d707f71c76accab93489ab44627f009e

git rev-parse origin/main
11747f91d707f71c76accab93489ab44627f009e

git ls-remote origin refs/heads/main
11747f91d707f71c76accab93489ab44627f009e	refs/heads/main

git status --short

git diff --name-only eb43cef571774a1b513328d8f4837c2c7224c4fc..HEAD
docs/sessions/2026-07-06-control-plane-d0038e-wf45-import-ui-only-pass.md

git log --oneline -8
11747f9 docs: record D-0038-E wf45 import-only result
eb43cef docs: refresh GLM advisor starter verification artifacts
63f3709 docs: add fixed GLM advisor session starter
389eaf3 docs: refresh GE-01 PR1 merge verification artifacts
6a6b9d8 Merge PR #1: fix(wf45) GE-01 fan-out collapse
a32f9e3 fix(wf45): split GE-01 proposed export from 2026-07-02 Gate-D snapshot
a684ca7 fix(wf45): collapse load fan-out before telegram gate (GE-01 repo-only)
b62a30b docs: refresh readme policy verification artifacts
```

**BASE (preflight commit 1):** `eb43cef571774a1b513328d8f4837c2c7224c4fc`

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

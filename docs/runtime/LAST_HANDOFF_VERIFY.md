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
task_ref: readme-policy-alignment-docs-only
verified_task_commit: b2f66140902df5a92fcb70a294c59ab6ea0d4233
verified_rolling_report_commit: b62a30b24223a86396119c3d106f2bc2597a71af
verified_through_commit: b2f66140902df5a92fcb70a294c59ab6ea0d4233
observed_head: b2f66140902df5a92fcb70a294c59ab6ea0d4233
observed_origin_main: b2f66140902df5a92fcb70a294c59ab6ea0d4233
observed_ls_remote_main: b2f66140902df5a92fcb70a294c59ab6ea0d4233
branch: main
workspace_status: clean
artifact_commit: b62a30b24223a86396119c3d106f2bc2597a71af
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN
timestamp_utc: 2026-07-03
```

**Nota:** snapshot README policy alignment verificato attraverso `b2f6614`; `artifact_commit` e `verified_rolling_report_commit` backfilled a `b62a30b`.

---

## Latest verified snapshot

```yaml
task_ref: ge01-wf45-fanout-fixforward-pr1-merge-post-report
verified_task_commit: 6a6b9d8f9679a86423ad9914df9629d7df679b65
verified_pr_head_commit: a32f9e36f16bde10bc09f8f8c42a8cf04f296057
verified_base_commit: b62a30b24223a86396119c3d106f2bc2597a71af
verified_rolling_report_commit: PENDING_SELF_REFERENCE
verified_through_commit: 6a6b9d8f9679a86423ad9914df9629d7df679b65
observed_head: 6a6b9d8f9679a86423ad9914df9629d7df679b65
observed_origin_main: 6a6b9d8f9679a86423ad9914df9629d7df679b65
observed_ls_remote_main: 6a6b9d8f9679a86423ad9914df9629d7df679b65
branch: main
workspace_status: clean
artifact_commit: PENDING_SELF_REFERENCE
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN
timestamp_utc: 2026-07-04
```

**Nota:** questo snapshot verifica attraverso merge `6a6b9d8` — PR #1 GE-01 wf45 fan-out fix-forward merged on `main`; PR head `a32f9e3`; base pre-merge `b62a30b`. **Non** è Gate E PASS; **non** è PASS runtime; **GE-01 = STOP / REVIEW REQUIRED** (runtime pre-merge); **GE-02 = not authorized**; **live n8n import = not authorized**; nessun runtime n8n eseguito o attivato in questo task. Commit 2 post-merge = solo artefatti verifica/report. Il commit che aggiorna questo file **non** si auto-certifica; resta il modello `artifact_commit: PENDING_SELF_REFERENCE`.

**Backfill PENDING_SELF_REFERENCE:** readme-policy snapshot → `b62a30b`. Catena glm-advisor (base `be24da3` → substance `19bd24c` → artifacts `64dbd8b`) già backfilled in snapshot precedente.

---

## Command outputs (verbatim, sanitized — GE-01 PR #1 merge post-report)

```text
git rev-parse HEAD
6a6b9d8f9679a86423ad9914df9629d7df679b65

git rev-parse origin/main
6a6b9d8f9679a86423ad9914df9629d7df679b65

git ls-remote origin refs/heads/main
6a6b9d8f9679a86423ad9914df9629d7df679b65	refs/heads/main

git status --short

git log --oneline -10
6a6b9d8 Merge PR #1: fix(wf45) GE-01 fan-out collapse
a32f9e3 fix(wf45): split GE-01 proposed export from 2026-07-02 Gate-D snapshot
a684ca7 fix(wf45): collapse load fan-out before telegram gate (GE-01 repo-only)
b62a30b docs: refresh readme policy verification artifacts
b2f6614 docs: align readme with current repo policy
64dbd8b docs: refresh glm advisor verification artifacts
19bd24c docs: add glm advisor method
be24da3 docs: prepare gate e runtime prompt
6832b9b docs: refresh gate e prep verification
34cea46 docs: prep gate e controlled start plan
```

**BASE (pre-merge main):** `b62a30b24223a86396119c3d106f2bc2597a71af`
**PR head:** `a32f9e36f16bde10bc09f8f8c42a8cf04f296057`
**Merge commit:** `6a6b9d8f9679a86423ad9914df9629d7df679b65`

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

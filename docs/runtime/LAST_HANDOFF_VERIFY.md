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
task_ref: wf47-wg48-bounded-handoff-pass
verified_task_commit: 823d025b27b2cf488422eedadff4c73437e0a391
verified_base_commit: 0b9fe468a0e1672d314c25e1276082b25a01da6f
verified_rolling_report_commit: 5884acd608113a9e50da8a7f00aebead0cabffd9
verified_through_commit: 823d025b27b2cf488422eedadff4c73437e0a391
observed_head: 823d025b27b2cf488422eedadff4c73437e0a391
observed_origin_main: 823d025b27b2cf488422eedadff4c73437e0a391
observed_ls_remote_main: 823d025b27b2cf488422eedadff4c73437e0a391
branch: main
workspace_status: clean
artifact_commit: 5884acd608113a9e50da8a7f00aebead0cabffd9
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: PASS_ATTESTATO_UTENTE
timestamp_utc: 2026-07-09
```

**Nota:** snapshot wf47→wf48 bounded handoff verificato attraverso `823d025`; `artifact_commit` e `verified_rolling_report_commit` backfilled a `5884acd`.

---

## Latest verified snapshot

```yaml
task_ref: d-0040-e-gate-e-preflight-no-go
verified_task_commit: 85a91dad1f8ae40e5e3552c336c399caf00336dc
verified_base_commit: 49c228f2433f71149136f3303777aa7d802b633f
verified_rolling_report_commit: 0411f3e46ecd0b37800979768ed9b05a849cb144
verified_through_commit: 85a91dad1f8ae40e5e3552c336c399caf00336dc
observed_head: 85a91dad1f8ae40e5e3552c336c399caf00336dc
observed_origin_main: 85a91dad1f8ae40e5e3552c336c399caf00336dc
observed_ls_remote_main: 85a91dad1f8ae40e5e3552c336c399caf00336dc
branch: main
workspace_status: clean
artifact_commit: 0411f3e46ecd0b37800979768ed9b05a849cb144
result: PASS_REMOTE_DOCUMENTAL_DOCS_ONLY
result_runtime: NOT_RUN_OPERATOR_PREFLIGHT_NOGO
timestamp_utc: 2026-07-09
```

**Nota:** questo snapshot verifica attraverso `85a91da` — commit 1 D-0040-E Gate E Phase 1 preflight NO-GO: sessione `docs/sessions/2026-07-09-control-plane-d-0040-e-gate-e-preflight-no-go.md`; **NO-GO preflight** (non runtime FAIL); no open rows in `control_plane_decisions_test`; store snapshot all closed; 47 derivation da store non dimostrabile; 45 non re-run; 47 non eseguito; 48 non chiamato. **NOT Gate E PASS**; **NOT global PASS runtime**; **PM-34 BLOCKED**; **`n8n_ready=false`**; **`enable_wg48_handoff=false`**; wf40/41/42 untouched; nessun workflow/data-tables edit; nessun runtime da Cursor. Commit 2 = artefatti verifica/report. **Backfill ristretto (2026-07-10, arco handoff compliance):** `verified_rolling_report_commit` e `artifact_commit` portati a `0411f3e` — **non** nuova verifica primaria; snapshot resta stale rispetto ad `a7b3bdb`+.

**Backfill PENDING_SELF_REFERENCE:** wf47→wf48 bounded handoff snapshot → `5884acd`.

---

## Command outputs (verbatim, sanitized — D-0040-E Gate E preflight NO-GO)

```text
git rev-parse HEAD
85a91dad1f8ae40e5e3552c336c399caf00336dc

git rev-parse origin/main
85a91dad1f8ae40e5e3552c336c399caf00336dc

git ls-remote origin refs/heads/main
85a91dad1f8ae40e5e3552c336c399caf00336dc	refs/heads/main

git status --short

git diff --name-only 49c228f2433f71149136f3303777aa7d802b633f..HEAD
docs/runtime/CURRENT_FRONTIER.md
docs/sessions/2026-07-09-control-plane-d-0040-e-gate-e-preflight-no-go.md

git log --oneline -8
85a91da docs: record d-0040-e gate e preflight no-go
49c228f docs: refresh cursor report after handoff clarification
06332d4 docs: clarify wf47 wf48 handoff authorization
5884acd docs: refresh wf47 wg48 handoff verification artifacts
823d025 docs: record wf47 wg48 bounded handoff pass
0b9fe46 docs: refresh PR4 merge verification artifacts
b6e293f Merge PR #4: docs GE-02 bounded runtime record
021c5ca docs: refresh GE-02 runtime verification artifacts
```

**BASE (preflight commit 1):** `49c228f2433f71149136f3303777aa7d802b633f`

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

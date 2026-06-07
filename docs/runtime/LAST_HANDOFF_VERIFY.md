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
- **Nessun segreto:** token, chat_id, webhook, PAT, API key, OAuth, URL con token.

---

## Latest verified snapshot

```yaml
task_ref: handoff-post-push-verification-rule
verified_task_commit: 94ed080996a6d5c77691aa4ed1b573439c51a2e2
verified_rolling_report_commit: 890b104ea634bf35800015cbb5c4e031d7aab6bc
verified_through_commit: 890b104ea634bf35800015cbb5c4e031d7aab6bc
observed_head: 890b104ea634bf35800015cbb5c4e031d7aab6bc
observed_origin_main: 890b104ea634bf35800015cbb5c4e031d7aab6bc
observed_ls_remote_main: 890b104ea634bf35800015cbb5c4e031d7aab6bc
branch: main
workspace_status: clean
artifact_commit: PENDING_SELF_REFERENCE
result: PASS
result_runtime: NOT_RUN_BY_CURSOR
timestamp_utc: 2026-06-07
```

---

## Command outputs (verbatim, sanitized)

```text
git rev-parse --show-toplevel
C:/Users/mrhz/Documents/AI/GitHub/control-plane

git remote -v
origin	https://github.com/mrhz1973/control-plane.git (fetch)
origin	https://github.com/mrhz1973/control-plane.git (push)

git branch --show-current
main

git status --short
(clean — no output lines)

git log --oneline -5
890b104 docs: update rolling Cursor report
94ed080 docs: add handoff post-push verification rule
46f6638 docs: update rolling Cursor report
83105bd docs: record Gate B inbound one-shot PASS
bd497bd docs: update rolling Cursor report

git rev-parse HEAD
890b104ea634bf35800015cbb5c4e031d7aab6bc

git rev-parse origin/main
890b104ea634bf35800015cbb5c4e031d7aab6bc

git ls-remote origin main
890b104ea634bf35800015cbb5c4e031d7aab6bc	refs/heads/main
```

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

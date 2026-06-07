# Automatic Post-Push Verifier — design (docs-only)

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-07  
**Status:** Design only. **No runtime.** **No n8n execution.** **No workflow created.**

**Related:** [`LAST_HANDOFF_VERIFY.md`](LAST_HANDOFF_VERIFY.md) · [`LAST_CURSOR_REPORT.md`](LAST_CURSOR_REPORT.md) · [`AUTOMATION_ACTIVATION_PLAN.md`](AUTOMATION_ACTIVATION_PLAN.md) · [`PROJECT_VISION.md`](../foundation/PROJECT_VISION.md) §8.1

---

## Purpose

Sostituire, nella **futura automazione**, il copia-incolla manuale degli output git post-push (oggi: report Cursor in chat o prompt verify-only).

Componente **n8n + worker locale** che:

1. Rileva push su `origin/main` dopo un task Cursor.
2. Esegue verifica git **deterministica** (hash equality, branch, workspace).
3. Scrive stato verificato machine-readable (Data Table runtime e/o commit su `LAST_HANDOFF_VERIFY.md`).
4. Invoca GPT/Codex **solo** su mismatch, diagnosi o Decision Packet — **non** per confrontare tre hash uguali.

---

## Scope

| In scope | Out of scope (Non-goals) |
|----------|---------------------------|
| Design flusso n8n → worker → git verify | Implementazione workflow n8n in questo task |
| Regole PASS/FAIL deterministiche | PM-34 unlock |
| Schema output machine-readable | Loop operativo permanente |
| Integrazione `LAST_HANDOFF_VERIFY` / `LAST_CURSOR_REPORT` | `n8n_ready=true` |
| Sketch implementazione test-safe futura | Modifica wf40/41/42/45–49/56 |
| Kill switch e redaction | Provider API key in workflow |

---

## Actors

| Actor | Ruolo |
|-------|--------|
| **Cursor** | Task implementazione, commit 1 (sostanza), commit 2 (rolling report), push |
| **GitHub** | Fonte di verità remota (`origin/main`) |
| **n8n** | Trigger su evento commit/push; orchestrazione job verify |
| **Worker locale** | Clone/worktree pulito; esegue comandi git read-only (+ eventuale commit docs controllato) |
| **Verifier (deterministico)** | Confronto hash/branch/status senza LLM |
| **GPT/Codex (orchestratore)** | Solo se FAIL, mismatch, o decisione umana richiesta |
| **Telegram / Decision Packet** | Alert su FAIL; nessuna automazione downstream |

---

## Trigger

**Target (futuro):** webhook GitHub `push` su branch `main` del repo `mrhz1973/control-plane`, **oppure** polling GitHub API commit SHA (pattern analogo wf40, scope confinato).

**Filtri:**

- Branch = `main` only.
- Commit message non `[skip verify]` (opt-out esplicito documentato).
- Debounce: ignorare push del solo commit rolling report se già verificato il `real_task_commit` associato (vedi self-reference).

**Prerequisito attivazione:** micro-step test-safe separato in [`AUTOMATION_ACTIVATION_PLAN.md`](AUTOMATION_ACTIVATION_PLAN.md) — **prima** di qualsiasi loop permanente (Gate E/F).

---

## Inputs

| Input | Fonte | Note |
|-------|--------|------|
| `repo` | Config n8n | `mrhz1973/control-plane` |
| `branch` | Evento push | `main` |
| `pushed_sha` | Webhook / API | HEAD candidato post-push |
| `real_task_commit` | `LAST_CURSOR_REPORT.md` LATEST | Commit 1 del task |
| `task_ref` | `LAST_CURSOR_REPORT.md` LATEST | Riferimento task |
| `clone_path` | Worker | Worktree dedicato, read-only per verify |
| `github_token` | n8n credential (UI only) | **Mai** in Git; fetch/ls-remote |

---

## Commands (worker verify-only)

Eseguiti nel clone locale **dopo** `git fetch origin main`:

```bash
git fetch origin main
git log --oneline -5
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git show --stat HEAD
git ls-remote origin main
```

Opzionale preflight (non sostituisce ls-remote):

```bash
git rev-parse --show-toplevel
git remote -v
```

---

## Validation rules (deterministic — no LLM)

**PASS** quando **tutte** vere:

1. `observed_head == observed_origin_main == observed_ls_remote_main` (string equality SHA)
2. `observed_head == pushed_sha` (evento coerente con remoto)
3. `branch == main`
4. `workspace_status == clean` (`git status --short` vuoto)
5. `real_task_commit` ∈ ancestry di `observed_head` (`git merge-base --is-ancestor real_task_commit HEAD` exit 0)

**FAIL** con `failure_reason` esplicito se una regola fallisce, ad esempio:

| `failure_reason` | Condizione |
|------------------|------------|
| `hash_mismatch_head_origin` | HEAD ≠ origin/main |
| `hash_mismatch_ls_remote` | HEAD ≠ ls-remote |
| `wrong_branch` | branch ≠ main |
| `workspace_dirty` | status non vuoto |
| `task_commit_not_in_chain` | real_task_commit non antenato di HEAD |
| `missing_last_cursor_report` | LATEST assente o parse fail |
| `fetch_failed` | fetch/ls-remote error |

**GPT/Codex NON serve** per confrontare tre hash uguali. Il worker/n8n Code node può fare equality check in puro codice.

**GPT/Codex entra solo per:**

- Diagnosi FAIL (quale step correttivo)
- Decision Packet / Telegram gate
- Scelta prossimo task dopo mismatch non auto-riparabile

---

## Outputs / state writes

### Machine-readable minimum (JSON o Data Table row)

```yaml
task_ref: <string>
real_task_commit: <sha>
rolling_report_commit: <sha|null>
verified_through_commit: <sha>          # HEAD verificato
observed_head: <sha>
observed_origin_main: <sha>
observed_ls_remote_main: <sha>
branch: main
workspace_status: clean|dirty
result: PASS|FAIL
result_runtime: AUTOMATED|NOT_RUN
timestamp_utc: <iso8601>
failure_reason: <string|null>
verifier_run_id: <uuid>                 # idempotency
```

### On PASS

1. **Data Table runtime** (futuro): append row `post_push_verify_log` (test table first).
2. **Opzionale — commit docs:** aggiorna `LAST_HANDOFF_VERIFY.md` snapshot + command outputs in **commit separato** (non nel medesimo run che certifica, se possibile — vedi self-reference).
3. **Notifica leggera** (opt-in): Telegram sanitized "verify PASS `<task_ref>` `<verified_through_commit>` short".
4. **Non** avviare automazioni downstream (Decision Packet, inbound, PM-34) senza gate esplicito.

### On FAIL

1. Scrivi row FAIL in Data Table + log n8n.
2. **Telegram alert** o **Decision Packet** — no automazione successiva.
3. **Non** aggiornare `LAST_HANDOFF_VERIFY.md` con PASS falso.

---

## Failure handling

```
push event
    → fetch + git commands
    → validate rules
         ├─ PASS → write state → optional LAST_HANDOFF_VERIFY update (next cycle)
         └─ FAIL → alert → STOP (no downstream)
```

- **Retry:** max 2 retry fetch/ls-remote con backoff (rete transiente).
- **Idempotency:** stesso `verified_through_commit` + stesso `verifier_run_id` → no duplicate alert.
- **Stale event:** push SHA già verificato in log → no-op PASS idempotente.

---

## Security / redaction

- **Mai** token/PAT/webhook secret in Git o export workflow.
- Credential GitHub solo in n8n UI.
- Output log: solo SHA, branch, messaggi commit pubblici — no `.env`, no URL con token.
- Prima di commit docs generati dal worker: `bash tools/redaction-check.sh`.
- Worker clone: read-only verify; write solo su path docs espliciti e branch `main` con messaggio commit fisso.

---

## Rollback / kill switch

| Azione | Effetto |
|--------|---------|
| Disattiva workflow verifier in n8n | Torna a verify-only Cursor manuale |
| Rimuovi webhook GitHub | Nessun trigger automatico |
| `handoff ora` | Orchestratore umano; nessun verifier downstream |
| Flag `verifier_enabled=false` in config | Design-time default fino a gate test-safe |

Verifier **non** modifica wf40/41/42 né runtime Decision Packet.

---

## Integration with LAST_HANDOFF_VERIFY.md

- Verifier **popola** snapshot YAML + command outputs verbatim.
- **`verified_through_commit`** = HEAD osservato al PASS (non il commit che scrive il file).
- **`artifact_commit: PENDING_SELF_REFERENCE`** finché task successivo non backfilla.
- Se HEAD remoto > `verified_through_commit` nel file su GitHub → orchestratore tratta come stale → nuovo run verifier o verify-only Cursor.

**Paradosso self-reference:**

- Commit A = task sostanza (`real_task_commit`).
- Commit B = rolling report (`LAST_CURSOR_REPORT`).
- Commit C = verifier aggiorna `LAST_HANDOFF_VERIFY.md`.
- C **non** può auto-certificarsi nel medesimo snapshot: `verified_through_commit` resta B (o HEAD verificato prima di C).
- Run verifier **successivo** (su push di C o D) backfilla `artifact_commit` e aggiorna `verified_through_commit`.
- **Nessun** commit "finalize hash" dedicato.

---

## Integration with LAST_CURSOR_REPORT.md

- Verifier legge **LATEST.real_task_commit** e **task_ref** per regola 5 (chain).
- **Non** modifica `LAST_CURSOR_REPORT.md` — resta responsabilità Cursor (commit 2 pattern).
- Verifier può **confrontare** `observed_head` con `rolling_report_commit` quando backfilled in HISTORY per coerenza diagnostica.

---

## Target flow (end-to-end)

```
Cursor: commit 1 + commit 2 + push
    │
    ▼
GitHub: push main
    │
    ▼
n8n: webhook/API → start verify job
    │
    ▼
Worker: git fetch + commands (read-only)
    │
    ▼
Verifier (deterministic):
    HEAD == origin/main == ls-remote?
    branch main? workspace clean?
    real_task_commit in chain?
    │
    ├─ YES (PASS)
    │     → write Data Table row
    │     → optional: queue docs commit LAST_HANDOFF_VERIFY (separate push)
    │     → optional: Telegram PASS short
    │     → STOP (no LLM)
    │
    └─ NO (FAIL)
          → failure_reason
          → Telegram / Decision Packet
          → STOP downstream
          → Codex/GPT solo se operatore chiede diagnosi
```

---

## Future n8n/worker implementation sketch

**Phase 0 — test-safe (prossimo gate, non questo task):**

1. Workflow n8n **Manual Trigger only**, inactive by default.
2. Node 1: Read GitHub raw `LAST_CURSOR_REPORT.md` (parse LATEST YAML).
3. Node 2: Execute Command on worker — script `tools/post-push-verify.sh` (da creare in gate futuro).
4. Node 3: Code — validation rules (pure JS, no LLM).
5. Node 4: IF PASS → Data Table test insert; IF FAIL → Telegram test chat sanitized.
6. Nessuno schedule; nessun webhook fino a sub-gate.

**Phase 1 — webhook gated:**

- GitHub push webhook → stesso pipeline + debounce rolling-report-only pushes.

**Phase 2 — docs auto-update (optional):**

- Worker apre PR o commit diretto su `LAST_HANDOFF_VERIFY.md` con `artifact_commit: PENDING_SELF_REFERENCE`; verifier run **next** push certifica.

**Boundaries unchanged:** PM-34 BLOCKED · `n8n_ready=false` · no permanent loop · no new production workflow without naming gate.

---

## Related session

- `docs/sessions/2026-06-07-control-plane-automatic-post-push-verifier-design.md`

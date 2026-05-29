# LAST CURSOR REPORT — control-plane (rolling)

Scopo: registro su GitHub dell'output post-push verbatim di Cursor. Il verificatore del PASS legge l'hash remoto da questo file sul remoto oppure da `git ls-remote origin main` diretto, non dalla chat Cursor.

Fonte primaria del PASS resta `PROJECT_VISION.md` §7.1: hash remoto su `main`. Questo file è l'artefatto persistente di quell'hash, non una sua sostituzione.

Regole:
- Nessun segreto: token, chat_id, webhook, PAT, URL con token.
- LATEST = ultimo task reale.
- HISTORY = entry precedenti, più recente in alto.
- L'hash registrato è quello del COMMIT REALE, cioè commit 1.
- Il commit 2 che aggiorna questo file NON viene ri-registrato.
- Verifica PASS: `LATEST.real_task_commit` deve risultare nella chain di `origin/main`.

---

## LATEST

- task_ref: pending
- timestamp_utc: pending
- branch: main
- real_task_commit: pending
- result_cursor: pending

### remote_hash_verbatim — `git ls-remote origin main` post-push commit 1

```text
pending
```

### git_log_oneline_5 — `git log --oneline -5`

```text
pending
```

### git_status_short — `git status --short`

```text
pending
```

## HISTORY

Nessuna entry precedente.

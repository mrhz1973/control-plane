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

- task_ref: cursor-prompt-preflight-v2.7
- timestamp_utc: 2026-05-29T21:14:02Z
- branch: main
- real_task_commit: 9cb29f8e205c56a70c9b5db42c2e9c970966d920
- result_cursor: PASS

### remote_hash_verbatim — `git ls-remote origin main` post-push commit 1

```text
9cb29f8e205c56a70c9b5db42c2e9c970966d920	refs/heads/main
```

### git_log_oneline_5 — `git log --oneline -5`

```text
9cb29f8 docs: update cursor prompt preflight rules
c5f5dd8 docs: update rolling Cursor report
22514ed docs: align foundation status with v2.6
840d289 docs: update rolling Cursor report
f2ee6d2 docs: add cursor prompt template contract
```

### git_status_short — `git status --short`

```text

```

## HISTORY

### foundation-status-v2.6-reconcile — 2026-05-29T20:52:19Z

- real_task_commit: 22514ed320e1ccf12f627f9798fe6f0d20eb11d5
- result_cursor: PASS

### cursor-prompt-template-v1 — 2026-05-29T20:48:08Z

- real_task_commit: f2ee6d2cfe992465e9e4736d30b1636adad765db
- result_cursor: PASS

### rolling-cursor-report-v1 — 2026-05-29T20:44:01Z

- real_task_commit: ef0afe89efea20f24ed15563f53e3d6930087de8
- result_cursor: PASS

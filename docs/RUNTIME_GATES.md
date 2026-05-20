# Runtime gates

Each runtime action below is a **one-step gate**. Never batch multiple actions in a single step.

## No-confirmation operating rule

Do **not** ask the user to say "vai" for docs-only, GitHub-only, export-template, redacted-file, or status-recording work that does not require secrets and does not execute runtime.

Proceed automatically through safe preparatory work until a real gate is reached.

Stop only when the next action requires one of these:

- local n8n UI action;
- token, credential, secret, or operational chat ID;
- workflow import into n8n;
- workflow execution;
- webhook activation;
- schedule activation;
- VPS/runtime command;
- user-visible confirmation that a Telegram message arrived.

When a real gate is reached, give exactly one concrete action and wait for the user's real output.

| # | Action | Owner | Gate | Rule |
|---|--------|-------|------|------|
| 1 | creare bot Telegram | user | yes | One runtime action per step |
| 2 | ottenere token | user | yes | One runtime action per step |
| 3 | testare token via curl/local command | user / Cursor | yes | One runtime action per step |
| 4 | configurare webhook GitHub | user / Cursor | yes | One runtime action per step |
| 5 | testare webhook | user / Cursor | yes | One runtime action per step |
| 6 | installare n8n su VPS | user / Cursor | yes | One runtime action per step |
| 7 | testare n8n raggiungibile | user / Cursor | yes | One runtime action per step |
| 8 | importare workflow JSON in n8n | user / Cursor | yes | One runtime action per step |
| 9 | testare workflow con dato reale | user / n8n | yes | One runtime action per step |
| 10 | attivare schedule trigger | user / n8n | yes | One runtime action per step |

**Rule:** Complete and verify one gate before starting the next. Do not combine gates (e.g. install n8n and import workflow in the same session step).

---

## Workflow freeze rule (MVP)

Until MVP is **5/5 PASS**, do **not** create new n8n workflows.

### Allowed exceptions

| Exception | Examples |
|-----------|----------|
| **Bugfix on v4** | Fix dedupe, Telegram format, GitHub read URL for watched repos |
| **Cleanup** | Remove unused/duplicate CONTROL PLANE test workflows before commit |
| **Discardable test** | One-off test workflow deleted before any export/commit |

### Not exceptions (defer until after 5/5 PASS)

| Blocked | Why |
|---------|-----|
| Automatic branch cleanup workflow | New scope — measure friction after MVP |
| Ollama integration | Day 5+ rule — stabilize first |
| Second generic Telegram workflow | Duplicates v4 path |
| Data Table backup workflow | Ops extras — not MVP |
| CI/CD workflow in n8n | Not MVP closure |

After **5/5 PASS**, add **one** new capability at a time with an explicit friction/cost note in docs.

# Session log — final CONTROL PLANE n8n list cleanup

Date: 2026-05-21  
Repo: mrhz1973/control-plane  
Mode: n8n UI cleanup (user) + **docs-only** follow-up (this commit).

## Why

PM-09 Gate **C + D + FILE** already **PASS** in production **`40`**. Backup and test-safe workflows added UI noise after validation. Removed them to match the final operational list.

## Final runtime list (4 workflows)

| Workflow | State |
|----------|--------|
| `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE` | **ACTIVE** / published (1 min) |
| `30 - CP handoff manual Telegram v1 - OFF` | **OFF** |
| `20 - CP v5 push webhook - OFF` | **OFF** |
| `01 - CP v4 single-repo polling - LEGACY OFF` | **OFF** |

## Deleted from n8n UI

| Workflow | Reason |
|----------|--------|
| `40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP BEFORE GATE D FILE - OFF` | Candidate promoted into active **`40`** — backup no longer needed |
| `55 - CP plan detected Telegram Gate D TEST SAFE` | Gate D text + file attachment **PASS** — test-safe workflow obsolete |

## Unchanged

| Item | State |
|------|--------|
| **PM-09** | Gate C + D + FILE **PASS** in active **`40`** |
| **v5 / webhook** | Off / not configured |
| **C1** | **PARTIAL** (D-C1-A) — not strict PASS |
| **ALINA LAVORO / GIS / dev-method** | Not touched |
| **`workflows/exports/*.json`** | Not edited — committed exports remain historical/import-safe |
| **Secrets** | None committed |

## Docs updated (follow-up)

- [MVP_STATUS.md](../MVP_STATUS.md)
- [POST_MVP_BACKLOG.md](../POST_MVP_BACKLOG.md)
- [PLAN_WATCHER_GATE_C.md](../PLAN_WATCHER_GATE_C.md)
- [WORKFLOW_EXPORT_STATUS.md](../WORKFLOW_EXPORT_STATUS.md)
- [N8N_WORKFLOW_NAMING.md](../N8N_WORKFLOW_NAMING.md)
- [RUNTIME_GATES.md](../RUNTIME_GATES.md)
- [OBSERVABILITY.md](../OBSERVABILITY.md)
- [README.md](../../README.md)
- [PM-09 docs close](2026-05-21-control-plane-pm09-final-docs-close.md) (pointer update)

## Optional future work

- Strict C1 / v5 / webhook — [PM-01](../POST_MVP_BACKLOG.md) only if explicitly reopened
- Plan-watcher changes via candidates **`41` / `42` / `43`** (pre-bound credentials; placeholders for private values)
- One-time n8n-side Telegram destination lookup to avoid retyping Chat ID per import

Aggio control

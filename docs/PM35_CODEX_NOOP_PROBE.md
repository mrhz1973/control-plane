# PM-35 — Real Codex no-op probe

**Status:** **PASS** (2026-05-22)

**Related:** [PM-33 login](sessions/2026-05-22-control-plane-pm33-codex-manual-login-pass.md) · [PM-18](PM18_CODEX_OAUTH_FEASIBILITY_DRY_RUN.md) · [output sample](examples/pm35-codex-noop-probe-output.sample.json) · [session](sessions/2026-05-22-control-plane-pm35-codex-noop-probe-pass.md)

---

## Purpose

Verify authenticated Codex can respond to a **harmless** no-op prompt without file changes, git, or secrets.

---

## Probe (manual)

| Field | Value |
|-------|--------|
| **Command family** | `codex.cmd exec` |
| **Sandbox** | `read-only` |
| **Approval** | `never` |
| **Model** | `gpt-5.5` |
| **Provider** | `openai` |
| **Output** | `CODEX_NOOP_OK` |

Prompt instructed: no file modification · no git · no secrets · reply only `CODEX_NOOP_OK`.

---

## Explicit negatives

| Item | State |
|------|--------|
| File changes requested | **No** |
| Git commands requested | **No** |
| Secret access requested | **No** |
| `codex review` / `codex apply` | **No** |
| n8n touched | **No** |
| Workflow **40** / **41** | **Not touched** |
| Worker enabled | **No** |
| Codex thread id in git | **Not recorded** |

---

## Related gates

| PM | State |
|----|--------|
| **PM-18** | OAUTH AVAILABLE / WORKER NOT ENABLED |
| **PM-34** | PREPARED / NOT EXECUTED |

---

## Next options

- **PM-36** controlled repo-read probe
- **PM-34** candidate integration planning
- Stabilize (worker still off)

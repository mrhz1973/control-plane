# PM-30 — Codex CLI local setup

**Date:** 2026-05-22  
**Status:** **PASS**

**Related:** [pm-30 packet](../runtime-packets/pm-30-codex-cli-local-setup-gate.md) · [PM-18](../PM18_CODEX_OAUTH_FEASIBILITY_DRY_RUN.md) · [output sample](../examples/pm30-codex-cli-local-setup-output.sample.json) · [PM-28 B then C](../decision-packets/pm-28-next-track-decision.md)

---

## Result

| Check | Result |
|-------|--------|
| **`codex` before task** | Not in PATH |
| **Install** | `npm.cmd install -g @openai/codex` — success |
| **`where codex`** | `C:\Users\mrhz\AppData\Roaming\npm\codex.cmd` |
| **`codex --version`** | `codex-cli 0.133.0` |
| **`codex --help`** | OK — shows `login` subcommand; **not** invoked |

**Node/npm:** `node v22.22.0` · `npm 9.3.0`

---

## Explicit negatives

| Item | State |
|------|--------|
| Codex prompt executed | **No** |
| OAuth login | **No** |
| OAuth token dumped | **No** |
| Provider API key | **No** |
| n8n touched | **No** |
| Workflow **40** / **41** | **Not touched** |
| Worker enabled | **No** |
| **`41` backup** | Retained |
| **C1** | **PARTIAL** |

---

## PM-18

**CLI AVAILABLE / NOT WORKER ENABLED** — OAuth login remains manual/future; no session committed.

---

## Next

**PM-31** — Codex worker contract dry-run (docs-only / mock first), separate gate.

**PM-29** snapshot remains **PENDING** (non-blocking).

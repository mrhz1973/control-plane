# PM-33 — Codex manual login PASS

**Date:** 2026-05-22  
**Status:** **PASS**

**Related:** [pm-33 packet](../runtime-packets/pm-33-codex-oauth-manual-login-gate.md) · [output sample](../examples/pm33-codex-oauth-login-output.sample.json) · [PM-18](../PM18_CODEX_OAUTH_FEASIBILITY_DRY_RUN.md) · [PM-30](../sessions/2026-05-22-control-plane-pm30-codex-cli-local-setup.md)

---

## Login

| Field | Value |
|-------|--------|
| **Command** | `codex.cmd login` |
| **Initial issue** | `codex login` via PowerShell blocked by ExecutionPolicy on `codex.ps1` |
| **Resolution** | `codex.cmd login` succeeded |
| **Terminal** | `Successfully logged in` |

---

## Post-login checks (read-only)

| Check | Result |
|-------|--------|
| `codex.cmd --version` | `codex-cli 0.133.0` |
| `codex.cmd --help` | OK — includes login, exec, review, mcp, doctor, etc. |

---

## Browser note

Callback opened in browser; page showed **localhost refused** after redirect. Terminal success confirms login completed. **No** OAuth URL or tokens recorded in git.

---

## Security / negatives

| Item | State |
|------|--------|
| OAuth URL recorded | **No** |
| Token dumped / committed | **No** |
| OAuth cache in git | **No** |
| Provider API key | **No** |
| Codex prompt | **No** |
| `codex exec` / `codex review` | **No** |
| Worker enabled | **No** |
| n8n touched | **No** |
| Workflow **40** / **41** | **Not touched** |
| GIS / DEV / Alina | **Not touched** |

---

## State updates

| Item | State |
|------|--------|
| **PM-18** | **OAUTH AVAILABLE / WORKER NOT ENABLED** |
| **PM-34** | PREPARED / NOT EXECUTED |
| **PM-29** | PENDING (non-blocking) |
| **C1** | PARTIAL |
| **`41` backup** | Retained |

---

## Next

**PM-35** real Codex no-op probe packet **or** PM-34 candidate integration planning — **not** both automatically.

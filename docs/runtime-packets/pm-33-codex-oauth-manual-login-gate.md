# Runtime packet — PM-33: Codex OAuth / manual login gate

**Packet ID:** `pm-33-codex-oauth-manual-login-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM-18](../PM18_CODEX_OAUTH_FEASIBILITY_DRY_RUN.md) · [PM-31](../PM31_CODEX_WORKER_CONTRACT_DRY_RUN.md) · [PM-30 PASS](../sessions/2026-05-22-control-plane-pm30-codex-cli-local-setup.md)

---

## Purpose

Authorize **future** manual `codex login` (or equivalent) **only** when the user explicitly runs this gate.

Does **not** enable automatic Codex worker after login.

---

## Rules

| Rule | Detail |
|------|--------|
| **Login** | Manual, user-driven — **not** automated from n8n or scripts |
| **Tokens** | **Never** print, dump, or commit OAuth session/cache files |
| **After login** | Only safe checks: `codex --version`, `codex --help`, or equivalent read-only probe |
| **First real prompt** | Requires **separate** future gate — not PM-33 alone |
| **Worker** | Stays **disabled** after PM-33 PASS |

---

## STOP conditions

| Condition | Action |
|-----------|--------|
| Token visible in logs | Stop |
| OAuth cache/session in git | **Forbidden** |
| Provider API key in repo | **Forbidden** |
| n8n workflow edit | **Forbidden** |
| Automatic worker enable | **Forbidden** |
| GIS / DEV / Alina | **Forbidden** |

---

## Future PASS criteria

| # | Criterion |
|---|-----------|
| 1 | Manual login completed without token dump |
| 2 | PM-18 may move to **OAuth AVAILABLE / WORKER NOT ENABLED** |
| 3 | Worker still **not** enabled |
| 4 | Session recorded on GitHub |

---

## Not executed

This packet does **not** run `codex login` in the prep task.

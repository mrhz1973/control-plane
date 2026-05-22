# Runtime packet — PM-50: OpenClaw local install/onboard gate

**Packet ID:** `pm-50-openclaw-local-install-onboard-gate`  
**Date:** 2026-05-22  
**Status:** **PREPARED / NOT EXECUTED**

**Related:** [PM-49 feasibility](../PM49_OPENCLAW_OAUTH_BRIDGE_FEASIBILITY.md) · [PM-50 doc](../PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_GATE.md) · [pm-34](pm-34-n8n-codex-worker-integration-gate.md)

---

## Purpose

Future **manual local** OpenClaw install/update/onboard feasibility gate — **not** executed in PM-49.

---

## Preconditions

| # | Requirement |
|---|-------------|
| 1 | User explicitly chooses **OpenClaw bridge** track |
| 2 | `control-plane` repo clean on `main` |
| 3 | **No** n8n runtime changes |
| 4 | **No** secrets committed to git |

---

## Future manual actions only (not now)

| Step | Action |
|------|--------|
| 1 | `openclaw update` (user machine) |
| 2 | `openclaw onboard` |
| 3 | Provider: **OpenAI → OpenAI Codex → browser login** (if offered) |
| 4 | Verify models via controlled channel (e.g. Telegram `/models` **only** if gateway already user-configured) |

---

## STOP conditions

Abort and document **FAIL** if any of:

- Prompts for **API key** paste into repo
- Prompts for **provider billing** / OpenRouter / Gemini without separate gate
- Requests **unrestricted** shell, repo, GitHub PAT, or n8n access
- Requests **token** or OAuth URL storage in git
- Unknown security prompt without written gate
- Any change to workflow **40** or **41**
- Any n8n runtime change without explicit PM-34 successor gate

---

## Future output (after gate)

| Allowed | Forbidden |
|---------|-----------|
| High-level **PASS/FAIL** | Tokens · OAuth URLs · session ids |
| Model list **names only** (no secrets) | Raw chat logs in git |
| Notes: no n8n/worker/workflow touch | Telegram bot token |

**PM-34:** remains **blocked**.

---

## Not executed

This packet does **not** run `openclaw` in the prep task.

# PM-50 — OpenClaw local install/onboard gate

**Status:** **PREPARED / NOT EXECUTED** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-50-openclaw-local-install-onboard-gate.md) · [PM-49 feasibility](PM49_OPENCLAW_OAUTH_BRIDGE_FEASIBILITY.md)

---

## Summary

PM-50 is the **human-readable** gate for future local OpenClaw install/onboard. **Not executed in PM-49.**

| Item | Value |
|------|--------|
| **Install/onboard in PM-49** | **No** |
| **Runtime** | Manual, user-driven, separate session |
| **Provider fallback** | **No** OpenRouter/Gemini |
| **n8n** | **Not touched** |
| **Worker** | **Not enabled** |
| **Workflow 40 / 41** | **Not touched** |
| **Secrets in git** | **Forbidden** |
| **PM-34** | **Blocked** |

---

## User actions (future only)

1. `openclaw update`
2. `openclaw onboard`
3. Select **OpenAI / OpenAI Codex / browser login** when available
4. Optional: `/models` check via Telegram **only** if user already operates gateway safely

---

## STOP

Stop if asked for API keys, billing, unrestricted access, tokens in repo, or n8n/workflow changes.

---

## Next after PM-50

**PM-51** models verification gate · **PM-52** routing design · **PM-53** validator design — each separate, no PM-34 auto-unblock.

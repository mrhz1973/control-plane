# PM-49 — OpenClaw OAuth bridge feasibility

**Status:** **PASS / FEASIBILITY ONLY** (2026-05-22)

**Related:** [session](sessions/2026-05-22-control-plane-pm49-openclaw-oauth-bridge-feasibility.md) · [PM-50 gate](PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_GATE.md) · [PM-47 CLI diagnosis](PM47_CODEX_RUNNER_CLI_DIAGNOSIS.md) · [pm-48 fallback](runtime-packets/pm-48-real-local-codex-runner-v3-gate.md) · [pm-34](runtime-packets/pm-34-n8n-codex-worker-integration-gate.md)

---

## Purpose

Evaluate **OpenClaw** as a **confined OAuth/browser bridge** toward OpenAI / ChatGPT-Codex after PM-44/PM-46 Codex CLI runner failures — **docs only**, no install in PM-49.

---

## Background

| Track | Evidence |
|-------|----------|
| **Manual Codex CLI** | PM-35/36/38 — `codex.cmd exec --sandbox read-only --cd <repo> <prompt>` can start |
| **Runner CLI** | PM-44/46 — exit **2**, `cli_exit_nonzero`, no strict markers |
| **PM-47** | CLI argv/spawn likely differs from manual known-good; PM-48 v3 prepared **without** `--approval` |
| **User video summary** | `openclaw update` · `openclaw onboard` · provider **OpenAI → OpenAI Codex → browser login** · `/models` via Telegram · multi-agent team idea · OpenRouter/Gemini fallback mentioned |

---

## Feasibility conclusion

| Item | Conclusion |
|------|------------|
| **Useful?** | **Potentially yes** — alternative OAuth path when `codex.cmd` runner argv fails |
| **Replaces control-plane?** | **No** — GitHub / n8n / control-plane remain source of truth |
| **Unblocks PM-34?** | **No** — separate gate + validated artifact still required |
| **Touches n8n directly?** | **No** |
| **Unrestricted access?** | **No** — confined gateway only |

Output must flow: **controlled prompt/packet → OpenClaw gateway → OAuth session → capture → external adapter/validator → safe GitHub artifact** — never raw OpenClaw/ChatGPT text into n8n.

---

## Proposed architecture

```text
CONTROL PLANE / GitHub / n8n (orchestration, gates)
  -> controlled prompt or decision packet
  -> OpenClaw gateway (local, confined)
  -> OpenAI Codex browser/OAuth login (user-driven, future PM-50)
  -> response capture (memory only in future gates)
  -> adapter/validator (PM-43 class logic)
  -> safe artifact in GitHub
  -> optional PM-34 integration only after separate explicit gate
```

---

## Allowed future scope

| PM | Scope |
|----|--------|
| **PM-50** | Local install/onboard gate (manual, user-driven) |
| **PM-51** | `/models` verification gate |
| **PM-52** | Controlled agent routing design |
| **PM-53** | OpenClaw output artifact validator design |

---

## Forbidden / blocked

| Item | Rule |
|------|------|
| **OpenRouter / Gemini** | **Blocked** — separate provider/cost/API gate required |
| **24/7 autonomous agents** | **No** |
| **Unrestricted shell/repo/GitHub** | **No** |
| **GitHub PAT in OpenClaw** | **No** |
| **Telegram token in git** | **No** |
| **n8n UI/API from OpenClaw** | **No** |
| **Deploy/tag/rollback** | **No** |
| **Workflow 40/41 edits** | **No** |
| **Raw output → n8n** | **No** |
| **PM-34 auto-unblock** | **No** |

---

## What NOT to copy from the video

- Unrestricted multi-agent “team” without control-plane gates
- OpenRouter/Gemini fallback without cost/API approval
- Telegram as production orchestrator (verification channel only, future)
- Treating OpenClaw as free orchestrator over repo/shell/n8n
- Pasting tokens or OAuth URLs into the repo

---

## Comparison with PM-48

| Item | PM-48 | PM-49 track |
|------|-------|-------------|
| **Status** | **PREPARED** — Codex CLI v3 | **PASS** feasibility — OpenClaw bridge |
| **Method** | `codex.cmd exec` known-good argv | OAuth via OpenClaw gateway |
| **Preferred next** | Fallback if user stays on CLI track | **PM-50** if user chooses OpenClaw track |
| **Delete PM-48?** | **No** — retained as fallback |

---

## PM-50 execution result

| Item | Value |
|------|--------|
| **PM-50** | **PASS** — [install/onboard PASS](PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_PASS.md) |
| **Feasibility** | Progressed to **local onboard PASS** |
| **Architecture** | Remains **confined** loopback gateway |
| **Forbidden rules** | Unchanged — no OpenRouter/Gemini without gate |

---

## Next

**PM-51** confined gateway no-op probe **or** **PM-52** bridge design. **PM-48** remains Codex CLI fallback.

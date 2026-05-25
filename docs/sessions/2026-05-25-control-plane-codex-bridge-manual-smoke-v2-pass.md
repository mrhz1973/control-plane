# Codex bridge — manual smoke V2 — PASS

**Date:** 2026-05-25
**Status:** **PASS** — single-turn JSON-only read-only smoke
**Host:** Windows control-plane workspace (Cursor CONTROL PLANE), Codex CLI v0.133.0
**Contract:** [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md) §8 (V2 design lessons applied)
**Predecessor:** [smoke V1 partial-blocked](2026-05-25-control-plane-codex-bridge-manual-smoke-v1-partial-blocked.md)

**No repo mutation.** No `codex resume`. No provider API key. No OpenClaw `agent main`. No n8n / wf 40 / 41 touch. No PM-34 unlock. No deploy / tag / rollback. Auth path = Codex CLI ChatGPT OAuth only.

---

## V2 objective

Apply the V1 lessons (anti-tool-use prompt + inlined files + single-turn JSON in fenced block) and verify Codex CLI can return a contract-shaped bridge JSON in **one** non-interactive turn under a read-only sandbox, with **zero** repo / runtime mutation.

---

## V2 design (applied per V1 lessons)

| Lesson from V1 | V2 application |
|----------------|----------------|
| Codex went agentic (proposed shell / tool calls) | Prompt explicitly forbids shell, tool, file, git, network |
| Codex tried to read files | All required files **inlined** in prompt body (no on-disk reads needed) |
| Multi-turn drift / interrupt | Non-interactive `codex exec`; single-turn; `--ephemeral` (no resume) |
| Free-form output | `--output-schema` JSON Schema enforces shape; output captured to `--output-last-message` |
| Workspace risk | Run from a temp dir **outside** the repo; `-s read-only`; `--skip-git-repo-check`; `--ignore-rules` |
| Approval/escalation noise | Non-interactive default; no human approval channel attempted |

---

## Restrictive Codex CLI flags actually used

All flags verified against installed `codex --help` / `codex exec --help` (v0.133.0).

| Flag | Purpose |
|------|---------|
| `codex exec` | Non-interactive subcommand (no TUI, no resume) |
| `-s read-only` | Sandbox: model-generated shell commands cannot mutate disk |
| `--ephemeral` | Do not persist a session file (no resume id we'd commit) |
| `--skip-git-repo-check` | Run from temp dir, not require git repo at workdir |
| `--ignore-rules` | Do not load user/project execpolicy `.rules` |
| `--output-schema <schema.json>` | Force final response shape |
| `--output-last-message <last.txt>` | Write final assistant message to file |
| `-C <tempdir>` | Working root = temp dir outside repo |
| stdin `-` | Inlined prompt streamed via stdin |

Note: `-a / --ask-for-approval` is **only on the top-level interactive command**, not on `codex exec`. Non-interactive `codex exec` does not solicit approvals.

---

## Command shape (sanitized)

```powershell
Get-Content $tmp\prompt.txt -Raw | codex exec `
  --skip-git-repo-check `
  --ephemeral `
  --ignore-rules `
  -s read-only `
  --output-schema $tmp\schema.json `
  --output-last-message $tmp\last.txt `
  -C $tmp -
```

`$tmp` = `%TEMP%\codex-smoke-v2` (outside the repo). Prompt file inlines: `PROJECT_VISION.md`, `FOUNDATION_STATUS.md`, `codex-bridge-contract-v1.md`, `openclaw-codex-bridge-discovery-v1.md`, the V1 partial-blocked session. No secrets, tokens, auth URLs, or session ids are inlined.

---

## Codex preamble (sanitized)

| Field | Value |
|-------|-------|
| workdir | temp dir outside repo |
| model | `gpt-5.5` |
| provider | `openai` (ChatGPT OAuth — no provider API key) |
| approval | `never` (non-interactive default) |
| sandbox | `read-only` |
| reasoning effort | none |
| reasoning summaries | none |

Session id is intentionally **not** recorded here; smoke is `--ephemeral`.

---

## Result — bridge output JSON (verbatim)

```json
{
  "verdict": "pass",
  "bridge_decision": "low",
  "risk_level": "low",
  "allowed_next_action": "Manual docs-only registration of smoke V2 result in session docs and FOUNDATION_STATUS.",
  "blocked_actions": [
    "provider API key configuration",
    "OpenClaw agent main retry",
    "n8n workflow 40/41 mutation",
    "deploy/tag/rollback",
    "codex resume of interrupted V1",
    "PM-34 unlock",
    "Cursor worker auto-loop"
  ],
  "reasoning_summary": "This V2 call is docs-only, single-turn, based only on inlined content, and requires no runtime, file, git, network, n8n, OpenClaw, Cursor, or deploy action. V1 is treated as a tool-use/form issue with graceful fallback, not repo damage. Deterministic guards are respected and the safe next step is manual documentation only.",
  "contract_checks": {
    "deterministic_precheck_respected": true,
    "no_provider_api_key_required": true,
    "no_openclaw_agent_retry": true,
    "no_n8n_mutation": true,
    "no_deploy_tag_rollback": true
  }
}
```

Tokens used: ~26.5k (single turn).

---

## Compliance verification

| Check | Outcome |
|-------|---------|
| Single-turn JSON-only | **PASS** — only one assistant message, conforms to `--output-schema` |
| Tool-use attempts | **None** — no shell call, no file read, no git op, no network |
| Repo mutation | **None** — `git status --short` clean before & after |
| Provider API key | **Not** used / not required |
| OpenClaw `agent main` | **Not** used |
| n8n / wf 40 / 41 | **Untouched** |
| `codex resume` of V1 (`019e6093-…`) | **Not** invoked |
| Deploy / tag / rollback | **Not** triggered |
| Cursor worker / auto loop | **Not** invoked |
| Output schema conformance | **PASS** — all required fields, valid enums |

---

## Interpretation

V2 demonstrates that Codex CLI **can** behave as a bridge reasoning component (contract v1 §1 / §4 output shape) when:

1. Required context is **inlined** (no agentic file discovery).
2. Prompt **explicitly** forbids tool use and demands single-turn JSON.
3. Run via `codex exec` (non-interactive) with `--output-schema`, `read-only` sandbox, `--ephemeral`.
4. Working directory is **outside** the repo, with `--skip-git-repo-check` and `--ignore-rules`.

V1 is therefore confirmed as a **form/tool-use shape problem**, not a repo-damage or security failure. V2 closes that gap for the **manual** smoke gate only.

---

## What remains gated (unchanged)

- n8n integration of the bridge (wf 40 / 41 still untouched, BACKUP OFF).
- PM-34 real worker.
- OpenClaw `agent main` retry.
- Provider API key configuration.
- Cursor worker / auto commit-push.
- `codex exec` for repo mutation.
- Resuming the interrupted V1 session.

---

## Next gate

Design (docs-only) of a **bridge invocation profile** that wraps this V2 shape into the contract v1 §7 future runtime — still **before** any n8n call, **before** any auto-loop, and **without** a provider API key. To be opened as a separate task.

---

## Security

No tokens, OAuth URLs, challenge URLs, emails, API keys, or full Codex session ids are committed in this document. The temp dir, prompt file, schema file, and `last.txt` reside under `%TEMP%` and are not part of the repo.

---

## Related

- [Contract v1](../contracts/codex-bridge-contract-v1.md)
- [Discovery v1](../contracts/openclaw-codex-bridge-discovery-v1.md)
- [Smoke V1 partial-blocked](2026-05-25-control-plane-codex-bridge-manual-smoke-v1-partial-blocked.md)
- [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

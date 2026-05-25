# Codex bridge — manual smoke V1 — PARTIAL-BLOCKED / NON PASS

**Date:** 2026-05-25  
**Status:** **PARTIAL-BLOCKED / NON PASS** — docs-only registration  
**Host:** Ryzen — repo `mrhz1973/control-plane`  
**Contract:** [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md) §8 (V1 attempt)

**No Codex execution in this commit.** Operator ran V1 manually; this file records outcome and lessons only.

---

## V1 objective

Verify **Codex-first bridge** read-only path: no n8n, no workflow 40/41, no OpenClaw `agent main`, no provider API key, no PM-34 unlock.

---

## Result summary

| Check | Outcome |
|-------|---------|
| Smoke V1 overall | **NON PASS** / **PARTIAL-BLOCKED** |
| Repo damage | **None** visible |
| `git status` | **Clean** before and after |
| n8n / wf 40–41 | **Untouched** |
| PM-34 | **Still gated** |
| OpenClaw agent main | **Not** used |
| Provider API key | **Not** configured |
| Graceful fallback (human gate) | **PASS** — sandbox + approval gate prevented visible mutations |

---

## What happened (sanitized sequence)

1. Codex started in **read-only / sandbox** mode for the smoke test.
2. Codex performed **read-only** checks:
   - `git status --short`
   - repo listing
   - `node --check` on a dry-run file
   - validator on sample metadata
3. Codex then **proposed** an adapter/generator command (not authorized for V1 smoke):

   ```text
   node tools/adapt-openclaw-bridge-artifact.mjs examples/pm53-openclaw-bridge-artifact-valid.sample.json
   ```

4. Operator **denied** authorization for that command.
5. Despite denial/interruption, output suggested the adapter command was **still executed or attempted** with no useful bridge JSON output.
6. Codex conversation was **interrupted**.
7. Codex UI showed **"Conversation interrupted"** and offered `codex resume <session-id>` — **session id not recorded in git**; operator decision: **do not resume** that session.
8. **No** `codex resume` for this session — register as **blocked**, not pass.

---

## Interpretation

| Topic | Assessment |
|-------|------------|
| Git / n8n | **Not** failures — no repo or workflow harm |
| Root cause | Codex CLI **interactive agentic behavior** under read-only/sandbox: tends toward tool-use and shell steps instead of **direct single-turn bridge JSON** |
| Contract v1 | Guards useful but **insufficient** for interactive CLI smoke — need V2 anti-tool-use design |
| Policy | No provider API key; no OpenClaw agent main — unchanged |

---

## Lesson for contract / V2 (design notes only — V2 not implemented here)

[codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md) §7 / smoke design must be **strengthened**:

- Forbid **agentic tool use** when smoke requires **only** a direct JSON answer.
- V2 smoke should (when designed/executed later):
  1. **Inline** required file content in the prompt (no file reads by Codex).
  2. **Forbid** shell commands, tool calls, and file reads in prompt instructions.
  3. Require **single-turn** JSON output.
  4. Wrap output in ` ```json ... ``` ` fence.
  5. Keep: read-only sandbox, untrusted approval, no n8n, no API key, no PM-34, no OpenClaw agent.

**This task does not author or run Smoke V2.**

---

## Operator decisions (confirmed)

| Decision | State |
|----------|--------|
| Resume interrupted Codex session | **No** |
| Configure OpenAI provider API key | **No** |
| Retry V1 as-is | **No** — proceed to V2 design/execution gate separately |
| Wire n8n / PM-34 | **No** |

---

## Security

No tokens, auth URLs, API keys, or full Codex resume session ids in this document.

---

## Related

- [Contract v1](../contracts/codex-bridge-contract-v1.md)
- [Contract design session](2026-05-25-control-plane-codex-bridge-contract-v1.md)
- [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

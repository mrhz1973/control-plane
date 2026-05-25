# Local wrapper negative-test matrix design packet

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/local-wrapper-negative-test-matrix-design-packet.md`  
**Date:** 2026-05-26  
**Status:**

- **DESIGN PACKET ONLY**
- no runtime executed by this task
- no Codex execution by this task
- no wrapper code modified
- no fixture created
- no n8n invocation
- no workflow 40/41 mutation
- no PM-34 unlock
- explicit gate required before creating fixtures or running tests

**Related:** [Post-dry-run hardening](post-dry-run-wrapper-hardening.md) · [Dry-run v1 PASS](../sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md) · [Dry-run v0 PASS](../sessions/2026-05-26-control-plane-local-bridge-wrapper-dry-run-v0.md) · [Wrapper design v1](../contracts/codex-bridge-wrapper-design-v1.md) · [Bridge contract v1](../contracts/codex-bridge-contract-v1.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## 1. Purpose

This packet follows:

| Predecessor | Result |
|-------------|--------|
| v0 fail-closed wrapper path | **PASS** — pre-gates only, no Codex |
| v1 Codex-read-only wrapper path | **PASS** — §7 invocation via wrapper |
| Post-dry-run hardening | **DOCS COMPLETE** — proven vs not proven |

**Purpose:** Before any n8n, PM-34, unattended automation, or broader runtime work, design negative tests that prove the wrapper rejects unsafe or malformed inputs and unsafe outputs.

This document defines **what to test later**, not execution now.

---

## 2. What this packet does not authorize

This packet does **NOT** authorize:

| Action | Status |
|--------|--------|
| Fixture creation | **Not authorized** |
| Wrapper code modification | **Not authorized** |
| Local test execution | **Not authorized** |
| Codex execution | **Not authorized** |
| n8n invocation | **Not authorized** |
| Workflow 40 / 41 mutation | **Not authorized** |
| PM-34 unlock | **Not authorized** |
| Provider API key | **Not authorized** |
| OpenClaw `agent main` | **Not authorized** |
| `codex resume` | **Not authorized** |
| Codex repo mutation | **Not authorized** |
| Cursor worker automation | **Not authorized** |
| Deploy / tag / rollback | **Not authorized** |
| Unattended automation | **Not authorized** |

---

## 3. Negative test categories

Future negative tests are grouped below. Each category states examples to design later, what the case proves, and expected future result.

### A. Malformed input JSON

**Examples to design later:**

- invalid JSON (syntax error)
- non-object JSON (array, string, null)
- missing `request_id`
- missing `task_type`
- missing `runtime_policy`
- missing `human_gate_state`
- `requested_actions` not array

**Expected future result:**

- wrapper exits non-zero or emits `failed` / `blocked` per wrapper policy
- no Codex invocation
- no n8n
- no repo mutation

**Proves:** Input validation is fail-closed before any reasoning boundary.

---

### B. Forbidden requested actions

**Examples:**

- `n8n_invocation`
- `workflow_40_mutation`
- `workflow_41_mutation`
- `pm34_unlock`
- `provider_api_key`
- `openclaw_agent_main`
- `codex_resume`
- `codex_repo_mutation`
- `cursor_worker_automation`
- `deploy`
- `tag`
- `rollback`

**Expected future result:**

- `status`: `blocked`
- `codex_invoked`: `false`
- `blocked_actions` includes offending action
- no runtime escalation

**Proves:** Pre-gates reject forbidden escalation paths listed in [post-dry-run hardening §4](post-dry-run-wrapper-hardening.md).

---

### C. Secret-shaped fields

**Examples:**

- `provider_api_key`
- `oauth_token`
- `webhook_url`
- `chat_id`
- `auth_url`
- `tokenized_url`
- `api_key`
- `password`
- `bearer_token`

**Expected future result:**

- `blocked` or `failed`
- no Codex invocation
- no prompt assembly
- no secret persisted in session

**Proves:** Secret-shaped content never reaches prompt assembly or Git evidence.

---

### D. Unsafe context refs

**Examples:**

- absolute path
- path with `..`
- `.env` path
- secret file path
- non-doc path when not allowed
- workflow export path if not allowed
- external URL

**Expected future result:**

- `blocked`
- no file read beyond allowed docs
- no Codex invocation

**Proves:** Context assembly stays within repo-relative, allowed prefixes per [wrapper design §3](../contracts/codex-bridge-wrapper-design-v1.md).

---

### E. Missing or wrong human gate

**Examples:**

- missing `human_gate_state`
- wrong `human_gate_state` (e.g. `rejected` when success path expected)
- runtime env var absent (`CONTROL_PLANE_ALLOW_CODEX_READONLY` unset when Codex path would run)
- `runtime_policy.allows_codex_readonly`: `false`

**Expected future result:**

- `needs_human` or `blocked`
- `codex_invoked`: `false`

**Proves:** Human gate and env gate are enforced before Codex transport.

---

### F. Unsafe Codex output

Design future tests using **mock/stub only** unless Codex execution is separately gated.

**Examples:**

- malformed JSON
- missing `no_runtime_confirmation`
- `no_runtime_confirmation`: `false`
- `recommended_next_step` proposes n8n
- `recommended_next_step` proposes workflow 40/41 mutation
- `recommended_next_step` proposes PM-34
- `recommended_next_step` proposes provider API key
- `recommended_next_step` proposes OpenClaw `agent main`
- `recommended_next_step` proposes deploy / tag / rollback
- `proposed_prompt_for_cursor` unexpectedly non-null
- contradiction between `status: pass` and non-empty `blocked_actions`

**Expected future result:**

- `needs_human` or `failed`
- no unsafe prompt emitted
- no runtime escalation

**Proves:** Post-gates catch unsafe Codex proposals (positive-only pattern detection per v1 lesson).

---

### G. Timeout / non-zero process handling

Design future tests only.

**Examples:**

- Codex timeout
- Codex exits non-zero
- empty stdout
- stderr contains warning
- schema validation failure

**Expected future result:**

- `failed` or `needs_human`
- sanitized evidence only
- no retry loop unless separately gated

**Proves:** Failure paths degrade gracefully without silent pass or unbounded retry.

---

### H. Idempotency / repeated run

Design future tests only.

**Expected future result:**

- same fixture produces same status class
- no additional repo mutation
- no accumulating state
- no duplicate side effects

**Proves:** Wrapper is stateless across repeated invocations with identical input.

---

## 4. Future fixture naming policy

Fixture creation requires a **separate explicit gate**. This packet defines naming only.

**Suggested path pattern:**

```text
tools/codex-bridge-wrapper/fixtures/negative/<case-id>.json
```

**Examples (not created now):**

| Case ID | File |
|---------|------|
| malformed missing request id | `malformed-missing-request-id.json` |
| forbidden action n8n | `forbidden-action-n8n.json` |
| secret-shaped provider key | `secret-shaped-provider-key.json` |
| unsafe context dotenv | `unsafe-context-dotenv.json` |
| missing human gate | `missing-human-gate.json` |
| unsafe Codex output n8n next step | `unsafe-codex-output-n8n-next-step.json` |

Each fixture must be synthetic, contain no secrets, and declare expected status class in the future session record.

---

## 5. Future test execution policy

When separately gated:

| Rule | Policy |
|------|--------|
| Regression first | Run v0 blocked fixture before any new case |
| Success fixture | Run v1 success fixture **only if** Codex-read-only gate is explicitly authorized |
| No-Codex negatives | Run static negative fixtures **before** any Codex path |
| Unsafe Codex output | Use mock/stub first; live Codex only with separate gate |
| n8n | **No** |
| Workflow 40 / 41 | **No** mutation |
| PM-34 | **No** unlock |
| Repo mutation | Evidence/docs files only |
| Workspace | Clean before and after |

Reference existing fixtures for regression only — do not modify in negative-test fixture gate without separate approval:

- `tools/codex-bridge-wrapper/fixtures/blocked-no-runtime-permission.json` (v0)
- `tools/codex-bridge-wrapper/fixtures/success-readonly-codex.json` (v1)

---

## 6. PASS criteria for future negative-test matrix

Future **PASS** requires all of:

- [ ] All selected negative fixtures produce `blocked` / `needs_human` / `failed` as expected
- [ ] No Codex invocation unless explicitly authorized for that specific case
- [ ] No n8n invocation
- [ ] No OpenClaw invocation
- [ ] No workflow 40 / 41 mutation
- [ ] No PM-34 unlock
- [ ] No provider API key
- [ ] No secrets persisted
- [ ] No Codex repo mutation
- [ ] No Cursor worker automation
- [ ] No deploy / tag / rollback
- [ ] `git status` shows only allowed evidence/docs files
- [ ] Session records exact commands and sanitized outputs

---

## 7. FAIL criteria

Future **FAIL** if any of:

- Forbidden action is attempted
- Unsafe fixture reaches Codex unexpectedly
- Secret-shaped field reaches prompt assembly
- Output misses `no_runtime_confirmation`
- Malformed Codex output is treated as `pass`
- Unsafe `recommended_next_step` is treated as `pass`
- Wrapper writes unexpected repo files
- n8n / workflow / PM-34 touched
- Provider API key requested or used
- OpenClaw `agent main` invoked
- `codex resume` attempted
- Ambiguity is not fail-closed

---

## 8. Recommended implementation order for future gated task

1. Create negative fixtures only (separate gate)
2. Run static no-Codex negative fixtures
3. Add mock/stub Codex-output negative cases if needed
4. Rerun v0 regression
5. Only later, with separate gate, rerun v1 live Codex read-only
6. Update session and FOUNDATION_STATUS

---

## 9. Next gate

**After this design packet:** explicit human gate for **local wrapper negative-test fixtures + static no-Codex negative test run**.

**Still not authorized:**

- live Codex negative tests
- n8n integration
- workflow 40 / 41 mutation
- PM-34 unlock
- provider API key
- OpenClaw `agent main`
- `codex resume`
- Codex repo mutation
- Cursor worker automation
- deploy / tag / rollback
- unattended automation

---

## 10. References (no duplication)

| Artifact | Role |
|----------|------|
| [post-dry-run-wrapper-hardening](post-dry-run-wrapper-hardening.md) | Proven vs not proven; hardening priorities |
| [local-wrapper-success-path-design-packet](local-wrapper-success-path-design-packet.md) | Success-path spec |
| [bridge-wrapper-runtime-dry-run-preflight](bridge-wrapper-runtime-dry-run-preflight.md) | First dry-run policy |
| [codex-bridge-wrapper-design-v1](../contracts/codex-bridge-wrapper-design-v1.md) | Wrapper boundary design |
| [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md) | §7 invocation properties |
| `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` | v1 implementation (not modified here) |

# Local wrapper negative tests static no-Codex — PASS

**Date:** 2026-05-26  
**Status:** **PASS** — regression + six static no-Codex negative fixtures  
**Human gate:** Authorized by operator for fixture creation + static no-Codex test run only (narrow scope)  
**Packet:** [local-wrapper-negative-test-matrix-design-packet](../decision-packets/local-wrapper-negative-test-matrix-design-packet.md)

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/local-wrapper-negative-test-matrix-design-packet.md`
- `docs/decision-packets/post-dry-run-wrapper-hardening.md`
- `docs/sessions/2026-05-26-control-plane-local-wrapper-negative-test-matrix-design-packet-docs-only.md`
- `docs/sessions/2026-05-26-control-plane-post-dry-run-wrapper-hardening-docs-only.md`
- `docs/sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md`
- `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` (read-only; not modified)
- `tools/codex-bridge-wrapper/fixtures/blocked-no-runtime-permission.json` (read-only; not modified)
- `tools/codex-bridge-wrapper/fixtures/success-readonly-codex.json` (read-only; not modified)
- `docs/contracts/codex-bridge-wrapper-design-v1.md`
- `docs/contracts/codex-bridge-contract-v1.md`

---

## Files changed

| File | Change |
|------|--------|
| `tools/codex-bridge-wrapper/fixtures/negative/malformed-missing-request-id.json` | New negative fixture |
| `tools/codex-bridge-wrapper/fixtures/negative/forbidden-action-n8n.json` | New negative fixture |
| `tools/codex-bridge-wrapper/fixtures/negative/secret-shaped-provider-key.json` | New negative fixture |
| `tools/codex-bridge-wrapper/fixtures/negative/unsafe-context-dotenv.json` | New negative fixture |
| `tools/codex-bridge-wrapper/fixtures/negative/missing-human-gate.json` | New negative fixture |
| `tools/codex-bridge-wrapper/fixtures/negative/requested-actions-not-array.json` | New negative fixture |
| `docs/sessions/2026-05-26-control-plane-local-wrapper-negative-tests-static-no-codex.md` | This session |
| `docs/foundation/FOUNDATION_STATUS.md` | Negative tests row, next gate |

Wrapper code and existing fixtures **not** modified.

---

## Fixture list

| Fixture | Category |
|---------|----------|
| `malformed-missing-request-id.json` | A — malformed input |
| `forbidden-action-n8n.json` | B — forbidden action |
| `secret-shaped-provider-key.json` | C — secret-shaped field |
| `unsafe-context-dotenv.json` | D — unsafe context ref |
| `missing-human-gate.json` | E — missing human gate |
| `requested-actions-not-array.json` | A — type validation |

---

## Node version

v22.22.0

---

## Regression command and result

```text
node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/blocked-no-runtime-permission.json
```

| Field | Value |
|-------|-------|
| Exit code | 0 |
| status | `needs_human` |
| no_runtime_confirmation | `true` |
| proposed_prompt_for_cursor | `null` |
| codex_invoked | `false` |
| n8n_invoked | `false` |
| openclaw_invoked | `false` |
| repo_mutation_attempted | `false` |

**Regression: PASS**

---

## Negative test results

### 1. malformed-missing-request-id.json

| Field | Value |
|-------|-------|
| Expected | Safe outcome B — reject missing request_id |
| Exit code | 1 |
| Output class | stderr: `request_id must be a non-empty string` |
| codex_invoked | No (process exited before Codex path) |
| **Result** | **PASS** |

### 2. forbidden-action-n8n.json

| Field | Value |
|-------|-------|
| Expected | Safe outcome A — blocked, no Codex |
| Exit code | 0 |
| status | `blocked` |
| blocked_actions | `["n8n_invocation"]` |
| codex_invoked | `false` |
| no_runtime_confirmation | `true` |
| **Result** | **PASS** |

### 3. secret-shaped-provider-key.json

| Field | Value |
|-------|-------|
| Expected | Safe outcome B — reject secret-shaped field |
| Exit code | 1 |
| Output class | stderr: `Forbidden secret fields present: provider_api_key` |
| codex_invoked | No |
| **Result** | **PASS** |

### 4. unsafe-context-dotenv.json

| Field | Value |
|-------|-------|
| Expected | Safe outcome A — blocked/needs_human, no Codex |
| Exit code | 0 |
| status | `needs_human` |
| blocked_actions | `["proceed_without_human_gate"]` |
| codex_invoked | `false` |
| Note | v0 path rejects on human_gate_state before context_refs validation; `.env` ref not read |
| **Result** | **PASS** |

### 5. missing-human-gate.json

| Field | Value |
|-------|-------|
| Expected | Safe outcome B — reject missing human_gate_state |
| Exit code | 1 |
| Output class | stderr: `human_gate_state must exist` |
| codex_invoked | No |
| **Result** | **PASS** |

### 6. requested-actions-not-array.json

| Field | Value |
|-------|-------|
| Expected | Safe outcome B — reject non-array requested_actions |
| Exit code | 1 |
| Output class | stderr: `requested_actions must be an array if present` |
| codex_invoked | No |
| **Result** | **PASS** |

---

## Overall PASS/FAIL

**Overall: PASS**

Regression PASS + all six static no-Codex negative fixtures PASS per safe outcome policy.

---

## Why Codex was not invoked

- Pre-gates reject malformed/unsafe fixtures before routing to v0/v1 handlers.
- v0 path never invokes Codex by design.
- `CONTROL_PLANE_ALLOW_CODEX_READONLY` was not set.
- No fixture used `approved_codex_readonly_wrapper_dry_run_v1` human gate.

## Why n8n was not invoked

Wrapper has no n8n client; trace `n8n_invoked: false` on all JSON outputs; forbidden action `n8n_invocation` blocked explicitly.

## Why workflows 40/41 were untouched

No workflow export/import/edit; fixtures reference wf only as blocked_actions text in regression output.

## Why PM-34 stayed gated

No PM-34 unlock attempted; `pm34_unlock` remains in forbidden actions set.

## Why provider API keys were not used

Secret-shaped field rejected at pre-gate; no real API key configured or used.

## Why no secrets were committed

All fixtures use synthetic sentinel strings only; no OAuth, tokens, or credentials in Git.

---

## What remains gated

- live Codex negative tests (separate gate)
- mock/stub Codex-output negative tests (separate gate)
- n8n runtime integration
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

## Next gate

**Local wrapper negative-test hardening docs-only** or explicit gate for **mock Codex-output negative tests**

---

## Verification commands run

```text
pwd
git rev-parse --show-toplevel
git remote -v
git branch --show-current
git status --short
git log --oneline -10
git fetch origin main && git pull --ff-only origin main
node --version
node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/blocked-no-runtime-permission.json
node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs tools/codex-bridge-wrapper/fixtures/negative/<each-fixture>.json
git diff --check
git log -1 --oneline -- <changed-file>   (local + origin/main per file)
```

Commit hash recorded after push in final report.

---

## Security / runtime confirmation

No secrets, tokens, or OAuth material committed. No Codex, OpenClaw, or n8n invoked. Wrapper code unchanged.

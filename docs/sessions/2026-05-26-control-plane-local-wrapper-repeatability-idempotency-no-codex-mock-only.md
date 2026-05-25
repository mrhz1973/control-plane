# Local wrapper repeatability/idempotency no-Codex + mock-only — PASS

**Date:** 2026-05-26  
**Status:** **PASS** — 15 cases × 3 runs; stable status classes; workspace clean  
**Human gate:** Operator authorized no-Codex + mock-only repeatability run (narrow scope)  
**Packet:** [local-wrapper-repeatability-idempotency-design-packet](../decision-packets/local-wrapper-repeatability-idempotency-design-packet.md)

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/local-wrapper-repeatability-idempotency-design-packet.md`
- `docs/sessions/2026-05-26-control-plane-local-wrapper-repeatability-idempotency-design-packet-docs-only.md`
- `docs/sessions/2026-05-26-control-plane-mock-codex-output-negative-tests-mock-only.md`
- `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` (read-only; not modified)

---

## Files changed

| File | Change |
|------|--------|
| `docs/sessions/2026-05-26-control-plane-local-wrapper-repeatability-idempotency-no-codex-mock-only.md` | This session |
| `docs/foundation/FOUNDATION_STATUS.md` | Repeatability PASS row, next gate |

Wrapper and fixtures **not** modified.

---

## Node version

v22.22.0

---

## Test groups

| Group | Cases | Runs each | Command |
|-------|-------|-----------|---------|
| A | v0 blocked | 3 | `node local-bridge-wrapper.mjs <fixture>` |
| B | 6 static no-Codex negatives | 3 | same |
| C | 8 mock-output negatives | 3 | carrier + `--mock-codex-output`; `CONTROL_PLANE_ALLOW_MOCK_CODEX_OUTPUT=1` |

**Total runs:** 45. No live Codex.

---

## Repeatability table (status class per run)

| Group | Fixture / mock file | Run 1 | Run 2 | Run 3 | Stable | PASS |
|-------|---------------------|-------|-------|-------|--------|------|
| A | `blocked-no-runtime-permission.json` | `needs_human` | `needs_human` | `needs_human` | yes | **PASS** |
| B | `malformed-missing-request-id.json` | stderr reject | stderr reject | stderr reject | yes | **PASS** |
| B | `forbidden-action-n8n.json` | `blocked` | `blocked` | `blocked` | yes | **PASS** |
| B | `secret-shaped-provider-key.json` | stderr reject | stderr reject | stderr reject | yes | **PASS** |
| B | `unsafe-context-dotenv.json` | `needs_human` | `needs_human` | `needs_human` | yes | **PASS** |
| B | `missing-human-gate.json` | stderr reject | stderr reject | stderr reject | yes | **PASS** |
| B | `requested-actions-not-array.json` | stderr reject | stderr reject | stderr reject | yes | **PASS** |
| C | `malformed-non-json.txt` | `failed` | `failed` | `failed` | yes | **PASS** |
| C | `missing-no-runtime-confirmation.json` | `needs_human` | `needs_human` | `needs_human` | yes | **PASS** |
| C | `unsafe-next-step-n8n.json` | `needs_human` | `needs_human` | `needs_human` | yes | **PASS** |
| C | `unsafe-next-step-pm34.json` | `needs_human` | `needs_human` | `needs_human` | yes | **PASS** |
| C | `proposed-prompt-non-null.json` | `needs_human` | `needs_human` | `needs_human` | yes | **PASS** |
| C | `contradiction-pass-with-blocked-action.json` | `needs_human` | `needs_human` | `needs_human` | yes | **PASS** |
| C | `secret-shaped-output.json` | `needs_human` | `needs_human` | `needs_human` | yes | **PASS** |
| C | `unknown-verdict-enum.json` | `needs_human` | `needs_human` | `needs_human` | yes | **PASS** |

**stderr reject** = non-zero exit, pre-gate rejection (no JSON stdout). All Group C runs: `codex_invoked: false`, `mock_codex_output_used: true`, no `pass`.

**Overall: PASS**

---

## git status

| When | Result |
|------|--------|
| Before matrix | clean |
| After 45 runs | clean |

No unexpected repo files.

---

## Safety confirmations

| System | Result |
|--------|--------|
| Live Codex | Not invoked |
| n8n | Not invoked |
| Workflows 40/41 | Not touched |
| PM-34 | Not unlocked |
| Provider API key | Not used |
| OpenClaw | Not invoked |
| `codex resume` | Not used |

---

## What remains gated

- live Codex repeatability
- live Codex negative tests
- n8n runtime integration
- workflow 40 / 41 mutation
- PM-34 unlock
- unattended automation

---

## Next gate

**Post-repeatability hardening docs-only** or explicit gate for **live Codex repeatability design packet**

---

## Verification commands run

```text
git status --short   (before/after)
node tools/codex-bridge-wrapper/local-bridge-wrapper.mjs <fixture>   (×3 per case)
$env:CONTROL_PLANE_ALLOW_MOCK_CODEX_OUTPUT = "1"; node ... --mock-codex-output <mock>   (×3 per case)
git diff --check
git log -1 --oneline -- <changed-file>   (local + origin/main)
```

Commit hash recorded after push in final report.

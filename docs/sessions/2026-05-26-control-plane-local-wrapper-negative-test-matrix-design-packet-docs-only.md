# Local wrapper negative-test matrix design packet — docs-only

**Date:** 2026-05-26  
**Status:** **docs-only negative-test matrix design packet** — no runtime, no Codex execution  
**Packet:** [local-wrapper-negative-test-matrix-design-packet](../decision-packets/local-wrapper-negative-test-matrix-design-packet.md)  
**Predecessor:** [Post-dry-run wrapper hardening docs-only](2026-05-26-control-plane-post-dry-run-wrapper-hardening-docs-only.md)

---

## Why this follows post-dry-run wrapper hardening

Post-dry-run hardening recorded v0/v1 PASS and named adversarial fixture matrix, timeout handling, malformed Codex output, and idempotency as **not proven**. The next safest step is a docs-only negative-test matrix design — defining rejection cases before any fixture creation or runtime execution.

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/post-dry-run-wrapper-hardening.md`
- `docs/sessions/2026-05-26-control-plane-post-dry-run-wrapper-hardening-docs-only.md`
- `docs/sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md`
- `docs/decision-packets/local-wrapper-success-path-design-packet.md`
- `docs/decision-packets/bridge-wrapper-runtime-dry-run-preflight.md`
- `docs/contracts/codex-bridge-wrapper-design-v1.md`
- `docs/contracts/codex-bridge-contract-v1.md`
- `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` (read-only)
- `tools/codex-bridge-wrapper/fixtures/blocked-no-runtime-permission.json` (read-only)
- `tools/codex-bridge-wrapper/fixtures/success-readonly-codex.json` (read-only)

---

## Files changed

| File | Change |
|------|--------|
| `docs/decision-packets/local-wrapper-negative-test-matrix-design-packet.md` | New design packet |
| `docs/foundation/FOUNDATION_STATUS.md` | Negative-test matrix row, next gate |
| `docs/sessions/2026-05-26-control-plane-local-wrapper-negative-test-matrix-design-packet-docs-only.md` | This session |

PROJECT_VISION.md **not** modified. Wrapper and fixtures **not** modified.

---

## Summary of negative-test matrix design

Defines eight future negative-test categories (A–H): malformed input, forbidden actions, secret-shaped fields, unsafe context refs, human gate failures, unsafe Codex output (mock/stub first), timeout/non-zero handling, and idempotency. Includes future fixture naming policy, execution order, PASS/FAIL criteria, and explicit non-authorization list.

---

## Key safety decisions

| Decision | Rationale |
|----------|-----------|
| Design only — no fixtures | Prevents premature runtime drift |
| No-Codex negatives before Codex path | Prove pre/post-gates without transport cost |
| Mock/stub for unsafe Codex output | Live Codex negative tests need separate gate |
| v0 regression always first | Fail-closed path must not regress |
| Positive-only unsafe pattern detection | v1 lesson — negated mentions in output are OK |

---

## What remains gated

- n8n runtime integration
- workflow 40 / 41 mutation
- PM-34 unlock
- Provider API key
- OpenClaw `agent main`
- `codex resume`
- Codex repo mutation
- Cursor worker automation
- deploy / tag / rollback
- unattended / scheduled automation
- live Codex negative tests (separate gate)
- fixture creation (separate gate)

---

## Next gate

**Explicit human gate for local wrapper negative-test fixtures + static no-Codex negative test run**

---

## Security / runtime confirmation

No secrets, tokens, or runtime invoked. No wrapper or fixture changes.

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
git diff --check
git diff -- docs/decision-packets/local-wrapper-negative-test-matrix-design-packet.md docs/foundation/FOUNDATION_STATUS.md docs/sessions/2026-05-26-control-plane-local-wrapper-negative-test-matrix-design-packet-docs-only.md
git log -1 --oneline -- <changed-file>   (local + origin/main per file)
```

Commit hash recorded after push in final report.

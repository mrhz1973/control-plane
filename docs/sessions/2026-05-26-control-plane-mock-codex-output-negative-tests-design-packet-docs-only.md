# Mock Codex-output negative tests design packet — docs-only

**Date:** 2026-05-26  
**Status:** **docs-only mock Codex-output negative tests design packet** — no runtime, no Codex execution  
**Packet:** [mock-codex-output-negative-tests-design-packet](../decision-packets/mock-codex-output-negative-tests-design-packet.md)  
**Predecessor:** [Local wrapper negative-test hardening docs-only](2026-05-26-control-plane-local-wrapper-negative-test-hardening-docs-only.md)

---

## Why this follows local wrapper negative-test hardening

Hardening commit `e09e4e3` documented that static no-Codex PASS proves pre-gates only. Post-Codex output sanitization remains unproven. This design packet specifies future mock-output adversarial cases before any live Codex negative run.

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/local-wrapper-negative-test-hardening.md`
- `docs/sessions/2026-05-26-control-plane-local-wrapper-negative-test-hardening-docs-only.md`
- `docs/sessions/2026-05-26-control-plane-local-wrapper-negative-tests-static-no-codex.md`
- `docs/contracts/codex-bridge-wrapper-design-v1.md`
- `docs/contracts/codex-bridge-contract-v1.md`
- `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` (read-only)

---

## Files changed

| File | Change |
|------|--------|
| `docs/decision-packets/mock-codex-output-negative-tests-design-packet.md` | New design packet |
| `docs/foundation/FOUNDATION_STATUS.md` | Design packet row, next gate |
| `docs/sessions/2026-05-26-control-plane-mock-codex-output-negative-tests-design-packet-docs-only.md` | This session |

PROJECT_VISION.md **not** modified. Wrapper and fixtures **not** modified.

---

## Summary of design packet

Defines eight mock Codex-output negative categories (malformed JSON, missing keys, unsafe `no_runtime_confirmation`, unsafe `recommended_next_step`, unsafe `proposed_prompt_for_cursor`, contradictions, secret-shaped output, schema drift), future fixture path policy, execution policy (mock/stub only), PASS/FAIL criteria, implementation order, and explicit non-authorization list.

---

## Key safety decisions

| Decision | Rationale |
|----------|-----------|
| Mock before live Codex negatives | Post-gates need adversarial proof without transport cost |
| Design only — no fixtures | Separate gate for mock fixture creation |
| Wrapper change optional | Injection hook only if mock path cannot be tested otherwise |
| Positive-only unsafe step detection | v1 lesson preserved in category 4 |

---

## What remains gated

- mock fixture creation and mock-only test run
- live Codex negative tests
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

**Explicit human gate for mock Codex-output negative fixtures + mock-only negative test run**

---

## Security / runtime confirmation

No secrets, tokens, or runtime invoked. No wrapper or fixture changes.

---

## Verification commands run

```text
git rev-parse --show-toplevel
git branch --show-current
git status --short
git fetch origin main && git pull --ff-only origin main
git diff --check
git log -1 --oneline -- <changed-file>   (local + origin/main per file)
```

Commit hash recorded after push in final report.

# Local wrapper repeatability/idempotency design packet — docs-only

**Date:** 2026-05-26  
**Status:** **docs-only design packet** — no runtime, no Codex execution  
**Packet:** [local-wrapper-repeatability-idempotency-design-packet](../decision-packets/local-wrapper-repeatability-idempotency-design-packet.md)  
**Predecessor:** [Post-mock-output hardening docs-only](2026-05-26-control-plane-post-mock-output-hardening-docs-only.md)

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/post-mock-output-hardening.md`
- `docs/sessions/2026-05-26-control-plane-post-mock-output-hardening-docs-only.md`
- `docs/sessions/2026-05-26-control-plane-mock-codex-output-negative-tests-mock-only.md`

---

## Files changed

| File | Change |
|------|--------|
| `docs/decision-packets/local-wrapper-repeatability-idempotency-design-packet.md` | New design packet |
| `docs/foundation/FOUNDATION_STATUS.md` | Design packet row, next gate |
| `docs/sessions/2026-05-26-control-plane-local-wrapper-repeatability-idempotency-design-packet-docs-only.md` | This session |

PROJECT_VISION.md **not** modified. Wrapper and fixtures **not** modified.

---

## Summary

Defines four future repeatability groups (v0, static no-Codex, mock-output, optional live v1), stable status-class rules, evidence requirements, PASS/FAIL criteria, and implementation order. Next gate: explicit human approval for no-Codex + mock-only repeatability run.

---

## Key safety decisions

| Decision | Rationale |
|----------|-----------|
| Groups 1–3 before live Codex repeat | No transport cost; no Codex quota drift |
| Group 4 separate gate | Live Codex repeatability is optional |
| 3× default run count | Enough to detect drift without over-running |
| `git status` bookends | Prove no hidden repo mutation |

---

## Remaining gates

- repeatability/idempotency test execution (no-Codex + mock-only)
- live Codex repeatability
- n8n, wf 40/41, PM-34, unattended automation

---

## Next gate

**Explicit human gate for local wrapper repeatability/idempotency no-Codex + mock-only test run**

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

---

## Security / runtime confirmation

No secrets, tokens, or runtime invoked. No wrapper or fixture changes.

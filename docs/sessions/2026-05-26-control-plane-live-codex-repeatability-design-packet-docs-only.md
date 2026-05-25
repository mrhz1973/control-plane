# Live Codex repeatability design packet — docs-only

**Date:** 2026-05-26  
**Status:** **docs-only design packet** — no runtime, no Codex execution  
**Packet:** [live-codex-repeatability-design-packet](../decision-packets/live-codex-repeatability-design-packet.md)  
**Predecessor:** [Post-repeatability hardening docs-only](2026-05-26-control-plane-post-repeatability-hardening-docs-only.md)

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/post-repeatability-hardening.md`
- `docs/sessions/2026-05-26-control-plane-post-repeatability-hardening-docs-only.md`
- `docs/sessions/2026-05-26-control-plane-local-wrapper-repeatability-idempotency-no-codex-mock-only.md`
- `docs/contracts/codex-bridge-contract-v1.md`
- `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` (read-only)

---

## Files changed

| File | Change |
|------|--------|
| `docs/decision-packets/live-codex-repeatability-design-packet.md` | New design packet |
| `docs/foundation/FOUNDATION_STATUS.md` | Design packet row, next gate |
| `docs/sessions/2026-05-26-control-plane-live-codex-repeatability-design-packet-docs-only.md` | This session |

PROJECT_VISION.md **not** modified. Wrapper and fixtures **not** modified.

---

## Summary

Defines future limited live Codex repeatability (max 3 runs, success fixture, §7 profile, drift policy, PASS/FAIL, evidence requirements). Does not authorize execution.

---

## Key safety decisions

| Decision | Rationale |
|----------|-----------|
| Max 3 runs | Limits quota exposure |
| Single fixture | Narrow blast radius |
| Drift policy explicit | Distinguish wording vs safety drift |
| Env gate ephemeral | No lingering Codex authorization |
| Design only | No transport in this task |

---

## Remaining gates

- live Codex repeatability run (execution)
- live Codex negative tests
- n8n, wf 40/41, PM-34, unattended automation

---

## Next gate

**Explicit human gate for live Codex repeatability run** — local only, max 3 runs, no n8n

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

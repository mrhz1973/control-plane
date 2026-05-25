# Local-only integration preflight design packet — docs-only

**Date:** 2026-05-26  
**Status:** **DESIGN PACKET ONLY** — no runtime, no Codex execution  
**Packet:** [local-only-integration-preflight-design-packet](../decision-packets/local-only-integration-preflight-design-packet.md)  
**Predecessor:** [Local wrapper runtime readiness review](2026-05-26-control-plane-local-wrapper-runtime-readiness-review-docs-only.md)

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/local-wrapper-runtime-readiness-review.md`
- `docs/sessions/2026-05-26-control-plane-local-wrapper-runtime-readiness-review-docs-only.md`
- `docs/contracts/codex-bridge-wrapper-design-v1.md`

---

## Files changed

| File | Change |
|------|--------|
| `docs/decision-packets/local-only-integration-preflight-design-packet.md` | New design packet |
| `docs/foundation/FOUNDATION_STATUS.md` | Row + next tactical step |
| `docs/sessions/2026-05-26-control-plane-local-only-integration-preflight-design-packet-docs-only.md` | This session |

PROJECT_VISION.md, wrapper, and fixtures **not** modified.

---

## Summary

Defines **local-only integration** as a future gated composition of allowlisted fixtures + local wrapper + sanitized session evidence on one operator workstation. Explicitly excludes n8n, wf 40/41, PM-34, cross-machine/Tailscale worker loops, unattended automation, and Cursor worker automation. Documents preflight checks, abort conditions, and evidence requirements. Does not authorize runtime.

---

## Safety decisions

| Decision | Rationale |
|----------|-----------|
| Design ≠ runtime gate | Packet is boundary spec only |
| Codex optional sub-gate | First integration dry-run should default no-Codex |
| Exclusions enumerated | Prevents scope creep from prior PASS evidence |
| Human gate is next step | Operator approval before any dry-run |

---

## Remaining gates

- explicit human gate for local-only integration dry-run (runtime)
- live Codex negatives, n8n, wf 40/41, PM-34, unattended automation (unchanged)

---

## Next gate

**Explicit human gate for local-only integration dry-run** — no n8n, no workflow 40/41, no PM-34.

---

## Verification commands run

```text
git rev-parse --show-toplevel
git branch --show-current
git status --short
git fetch origin main && git pull --ff-only origin main
git diff --check
git diff -- <three allowed paths>
git commit / git push origin main
git log -1 --oneline -- <file>  (local + origin/main)
```

**Commit:** recorded in final report after push.

---

## Security / runtime confirmation

No secrets created. No Codex, n8n, OpenClaw, or wrapper/fixture changes.

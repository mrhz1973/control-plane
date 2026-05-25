# n8n payload contract design packet — docs-only

**Date:** 2026-05-26  
**Status:** **DESIGN PACKET ONLY** — no runtime, no n8n, no Codex  
**Packet:** [n8n-payload-contract-design-packet](../decision-packets/n8n-payload-contract-design-packet.md)  
**Predecessor:** [n8n preflight boundary design](2026-05-26-control-plane-n8n-preflight-boundary-design-packet-docs-only.md)

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/n8n-preflight-boundary-design-packet.md`
- `docs/sessions/2026-05-26-control-plane-n8n-preflight-boundary-design-packet-docs-only.md`

---

## Files changed

| File | Change |
|------|--------|
| `docs/decision-packets/n8n-payload-contract-design-packet.md` | New contract design |
| `docs/foundation/FOUNDATION_STATUS.md` | Row + next step |
| `docs/sessions/2026-05-26-control-plane-n8n-payload-contract-design-packet-docs-only.md` | This session |

PROJECT_VISION.md, wrapper, fixtures, n8n **not** modified.

---

## Summary

Defines n8n-facing payload v1: allowlist, denylist, redaction, abort conditions, synthetic example, and future validation checks. Does not authorize n8n runtime or payload preflight execution.

---

## Safety decisions

| Decision | Rationale |
|----------|-----------|
| `n8n_invoked` must stay false | Until separate runtime gate |
| wf/PM-34 denied in payload | No mutation/unlock signals |
| Example is synthetic | No live n8n IDs or secrets |

---

## Remaining gates

n8n runtime, payload preflight runtime, wf 40/41, PM-34, live Codex negatives — see packet.

---

## Next step

**n8n payload contract hardening (docs-only)**

---

## Verification commands

```text
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

No n8n, Codex, secrets, or wrapper/fixture changes.

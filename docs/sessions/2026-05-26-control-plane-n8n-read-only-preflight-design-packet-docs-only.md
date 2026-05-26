# n8n read-only preflight design packet — docs-only

**Date:** 2026-05-26  
**Repo:** `mrhz1973/control-plane`  
**Branch:** `main`  
**Status:** **DESIGN PACKET ONLY** — no runtime, no n8n, no VPS SSH  
**Packet:** [n8n-read-only-preflight-design-packet](../decision-packets/n8n-read-only-preflight-design-packet.md)

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/n8n-payload-contract-closeout.md`
- `docs/decision-packets/n8n-payload-validation-checklist.md`
- `docs/sessions/2026-05-26-control-plane-n8n-payload-validation-batch-docs-only.md`

---

## Files changed

| File | Change |
|------|--------|
| `docs/decision-packets/n8n-read-only-preflight-design-packet.md` | Design packet — read-only scope, exclusions, abort, evidence |
| `docs/foundation/FOUNDATION_STATUS.md` | DESIGN PACKET COMPLETE row + next step |
| `docs/sessions/2026-05-26-control-plane-n8n-read-only-preflight-design-packet-docs-only.md` | This session |

---

## Summary

Docs-only design for a **future** n8n read-only preflight boundary: possible metadata (workflow id/name, active flag, updated timestamp — each sub-gated), explicit exclusions (credentials, executions, payload send, wf 40/41 mutation), abort conditions A1–A11, and evidence requirements E1–E9 for a future runtime session. **Does not** authorize n8n UI, API, SSH, or execution.

---

## Safety decisions

| Decision | Rationale |
|----------|-----------|
| Paper-only in this gate | No VPS or n8n touch from Cursor |
| Metadata “maybe” not “yes” | Each observation type needs sub-gate |
| Credentials always excluded in v1 | Aligns with PROJECT_VISION §10 |
| Payload send excluded | Payload contract is design-complete, outbound gated |
| PM-34 unchanged | Design does not unlock worker |

---

## Remaining gates

n8n runtime, read-only preflight runtime, workflow 40/41 mutation, PM-34 unlock, provider API key, payload send, VPS SSH — see packet and [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md).

---

## Next step

**n8n read-only preflight hardening (docs-only)** — tighten metadata allowlist and evidence redaction templates; still no n8n runtime.

---

## Verification commands

```text
git branch --show-current
git status --short
git log -1 --oneline
git fetch origin main
git pull --ff-only origin main
git diff --check
git add docs/decision-packets/n8n-read-only-preflight-design-packet.md docs/foundation/FOUNDATION_STATUS.md docs/sessions/2026-05-26-control-plane-n8n-read-only-preflight-design-packet-docs-only.md
git commit -m "docs: design n8n read-only preflight"
git push origin main
git fetch origin main
git status --short
git log --oneline -5
```

**Commit hash after push:** `27b89dc`

---

## Attestation

| Check | Result |
|-------|--------|
| No runtime | Yes |
| No n8n UI/API/credentials | Yes |
| No VPS SSH | Yes |
| No wf 40/41 mutation | Yes |
| No PM-34 unlock | Yes |
| PROJECT_VISION untouched | Yes |

---

## Security confirmation

No secrets, tokens, chat IDs, webhook URLs, or credential ids in committed docs.

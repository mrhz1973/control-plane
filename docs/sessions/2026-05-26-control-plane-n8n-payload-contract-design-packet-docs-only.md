# n8n payload contract design packet — docs-only

**Date:** 2026-05-26  
**Repo:** `mrhz1973/control-plane`  
**Branch:** `main`  
**Status:** **DESIGN PACKET ONLY** — no runtime, no n8n, no credentials  
**Packet:** [n8n-payload-contract-design-packet](../decision-packets/n8n-payload-contract-design-packet.md)

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
| `docs/decision-packets/n8n-payload-contract-design-packet.md` | v1 contract (allowlist, denylist, redaction, example) |
| `docs/foundation/FOUNDATION_STATUS.md` | DESIGN PACKET COMPLETE row |
| `docs/sessions/2026-05-26-control-plane-n8n-payload-contract-design-packet-docs-only.md` | This session |

---

## Summary

Defines n8n-facing payload v1 with explicit `wrapper_trace` booleans (`n8n_invoked`, `codex_invoked`, `wrapper_modified_repo`, `pm34_unblocked`, `provider_api_key_used`), field rules, `REDACTED_*` placeholders, abort conditions, safe synthetic JSON, and manual validation checklist. Paper-only; no n8n required to validate.

---

## Attestation

| Check | Result |
|-------|--------|
| No runtime | Yes |
| No n8n execution/API/UI | Yes |
| No credentials read/mutate | Yes |
| No PM-34 unlock | Yes |
| No wf 40/41 mutation | Yes |
| No wrapper/fixture changes | Yes |

---

## Remaining gates

n8n runtime, payload preflight, wf 40/41, PM-34 — see packet.

---

## Next step

**n8n payload contract hardening (docs-only)**

---

## Validation commands run

```text
git rev-parse --show-toplevel
git branch --show-current
git status --short
git fetch origin main && git pull --ff-only origin main
git diff --check
git diff -- docs/decision-packets/n8n-payload-contract-design-packet.md docs/foundation/FOUNDATION_STATUS.md docs/sessions/2026-05-26-control-plane-n8n-payload-contract-design-packet-docs-only.md
```

**Commits:** initial `d40db3f`; alignment commit in final report if applied.

---

## Security confirmation

No secrets, tokens, chat IDs, webhook URLs, OAuth, PAT, or live n8n execution IDs in committed docs.

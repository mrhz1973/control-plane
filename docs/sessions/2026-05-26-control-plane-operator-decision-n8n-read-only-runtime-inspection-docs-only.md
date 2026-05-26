# Operator decision — n8n read-only runtime inspection — docs-only

**Date:** 2026-05-26  
**Repo:** `mrhz1973/control-plane`  
**Branch:** `main`  
**Status:** **DECISION PACKET ONLY** — no runtime, no n8n, no VPS SSH  
**Packet:** [operator-decision-n8n-read-only-runtime-inspection](../decision-packets/operator-decision-n8n-read-only-runtime-inspection.md)

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/n8n-read-only-runtime-gate-packet.md`
- `docs/sessions/2026-05-26-control-plane-n8n-read-only-runtime-gate-packet-docs-only.md`
- `docs/decision-packets/n8n-read-only-preflight-closeout.md`

---

## Files changed

| File | Change |
|------|--------|
| `docs/decision-packets/operator-decision-n8n-read-only-runtime-inspection.md` | Decision packet A/B/C |
| `docs/foundation/FOUNDATION_STATUS.md` | DECISION PACKET COMPLETE + next step |
| `docs/sessions/2026-05-26-control-plane-operator-decision-n8n-read-only-runtime-inspection-docs-only.md` | This session |

---

## Summary

Docs-only operator decision packet: presents options **A** (one Tier A read-only session), **B** (defer, docs-only), **C** (reject n8n runtime path). Does not choose for operator or open runtime gate.

---

## Decision options A/B/C

| Option | Meaning |
|--------|---------|
| **A** | Approve one read-only n8n inspection (Tier A list metadata only) |
| **B** | Defer runtime; continue docs-only |
| **C** | Reject n8n runtime path for now |

---

## Safety decisions

| Decision | Rationale |
|----------|-----------|
| No agent default to A | Runtime requires explicit human choice |
| A ≠ automatic execution | Separate runtime session + evidence required |
| Default safe = B or C | No n8n until operator acts |
| PM-34 / wf 40/41 unchanged | Decision packet does not unlock |

---

## Remaining gates

n8n read-only runtime, wf 40/41, PM-34, provider API key — gated until operator **A** + runtime session PASS.

---

## Next step

**Operator selects A / B / C outside this packet** (chat or Decision Packet).

---

## Verification commands

```text
git branch --show-current
git status --short
git log -1 --oneline
git fetch origin main
git pull --ff-only origin main
git diff --check
git add docs/decision-packets/operator-decision-n8n-read-only-runtime-inspection.md docs/foundation/FOUNDATION_STATUS.md docs/sessions/2026-05-26-control-plane-operator-decision-n8n-read-only-runtime-inspection-docs-only.md
git commit -m "docs: prepare n8n read-only runtime decision"
git push origin main
git fetch origin main
git status --short
git log --oneline -5
```

**Commit hash after push:** `39ee2a0`

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

No secrets in committed docs.

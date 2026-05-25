# Bridge wrapper design — docs-only

**Date:** 2026-05-25  
**Status:** **docs-only design** — no runtime, no Codex execution  
**Design:** [codex-bridge-wrapper-design-v1](../contracts/codex-bridge-wrapper-design-v1.md)  
**Predecessor:** [invocation profile session](2026-05-25-control-plane-bridge-invocation-profile-docs-only.md) · [smoke V2 PASS](2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md)

---

## Why this follows invocation profile §7

Bridge contract §7 formalized V2-proven **stable Codex invocation properties**. The next gate was wrapper design: define the local boundary that wraps input JSON → pre-gates → optional §7 Codex call → post-gates → output JSON, without implementing runtime.

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/contracts/codex-bridge-contract-v1.md`
- `docs/contracts/openclaw-codex-bridge-discovery-v1.md`
- `docs/contracts/classifier-wrapper-v1.md`
- `docs/sessions/2026-05-25-control-plane-bridge-invocation-profile-docs-only.md`
- `docs/sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md`
- `docs/sessions/2026-05-25-control-plane-codex-bridge-manual-smoke-v1-partial-blocked.md`

---

## Files changed

| File | Change |
|------|--------|
| `docs/contracts/codex-bridge-wrapper-design-v1.md` | New wrapper design contract |
| `docs/foundation/FOUNDATION_STATUS.md` | Wrapper design row, next gate |
| `docs/sessions/2026-05-25-control-plane-bridge-wrapper-design-docs-only.md` | This session |

PROJECT_VISION.md **not** modified.

---

## Summary of wrapper contract

Local wrapper flow: validate bridge input → preflight guards → (future gate) assemble inlined prompt → invoke Codex per §7 properties → schema parse → post-gates → emit bridge output JSON. References bridge contract §3/§4/§5/§6/§7 rather than duplicating full schemas. Fail-closed throughout.

---

## Key safety decisions

| Decision | Rationale |
|----------|-----------|
| References §7 properties, not CLI flags | Version-fragile flags stay in smoke V2 session |
| No approval reliance inside `codex exec` | Non-interactive exec does not solicit approvals |
| Preflight emits output without Codex on block | Same pattern as bridge contract §5 |
| Wrapper never mutates repo/n8n/runtime | Reasoning boundary only |
| V1 session not resumed | V1 was form/tool-use issue, not security failure |

---

## What remains gated

- n8n runtime integration
- workflow 40 / 41 mutation
- PM-34 unlock
- Provider API key
- OpenClaw `agent main`
- `codex resume` (V1 interrupted session)
- Codex repo mutation
- Cursor worker automation
- deploy / tag / rollback
- Wrapper runtime execution (design only in this task)

---

## Next gate

**Bridge wrapper runtime dry-run preflight / design packet** — explicit human gate required before any executable wrapper code or n8n wiring.

---

## Security / runtime confirmation

No secrets, tokens, auth URLs, or OAuth material in this document. No Codex, OpenClaw, or n8n runtime invoked.

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

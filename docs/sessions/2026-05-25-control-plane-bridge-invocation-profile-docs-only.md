# Bridge invocation profile — docs-only formalization

**Date:** 2026-05-25  
**Status:** **docs-only update** — no runtime, no Codex execution  
**Contract:** [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md) §7  
**Predecessor:** [smoke V2 PASS](2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md)

---

## Why this was needed

Smoke V2 **PASS** proved a safe manual Codex bridge invocation shape (non-interactive, inlined context, single-turn schema-enforced JSON, read-only sandbox, ephemeral session, temp workspace outside repo). Contract §7 still read like a pre-V2 generic future profile and §8/§12 still treated manual smoke as the next gate. This session records the docs-only formalization of V2-proven properties into §7.

---

## Editorial decision

**§7 uses stable behavioral properties, not hard-coded CLI flags as normative contract.**

| Layer | Content |
|-------|---------|
| Contract §7.1 | Durable properties any future wrapper MUST satisfy |
| Contract §7.5 | Pointer to non-normative implementation snapshot |
| Smoke V2 session | Exact Codex CLI v0.133.0 flags and command shape |

Rationale: Codex CLI flags may change between versions; the contract must survive version churn while preserving safety constraints.

---

## Where exact V2 flags are recorded

[smoke V2 session](2026-05-25-control-plane-codex-bridge-manual-smoke-v2-pass.md) — observed V2 implementation snapshot for Codex CLI v0.133.0 only (`codex exec`, read-only sandbox, ephemeral, schema output, temp workdir). Not permanent API.

---

## Files changed

| File | Change |
|------|--------|
| `docs/contracts/codex-bridge-contract-v1.md` | §7 rewritten with stable properties; §8 updated with V1/V2 results; §11/§12 next gate |
| `docs/foundation/FOUNDATION_STATUS.md` | Header, contract row, next tactical step |
| `docs/sessions/2026-05-25-control-plane-bridge-invocation-profile-docs-only.md` | This session |

PROJECT_VISION.md **not** modified.

---

## What remains gated

- n8n integration / wf 40 / 41 mutation
- PM-34 real worker unlock
- Provider API key configuration
- OpenClaw `agent main` retry
- Cursor worker / auto commit-push
- `codex resume` of interrupted V1 session
- Codex repo mutation / implementation via bridge
- Any runtime wrapper execution (design docs only next)

---

## Next gate

**Local bridge wrapper design (docs-only)** — minimal contract: bridge input JSON → §7 invocation properties → bridge output JSON. Separate runtime gate required before n8n wire-up.

---

## Security / runtime confirmation

No secrets, tokens, auth URLs, OAuth material, or session ids in this document. No Codex, OpenClaw, or n8n runtime invoked. No repo mutation beyond these doc files.

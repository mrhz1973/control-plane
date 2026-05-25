# Post-dry-run wrapper hardening

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/post-dry-run-wrapper-hardening.md`  
**Date:** 2026-05-26  
**Status:** **DOCS-ONLY HARDENING** · no runtime executed by this task · no Codex execution · no wrapper code modified · no fixture modified · no n8n invocation · no workflow 40/41 mutation · no PM-34 unlock · explicit gate required before any next runtime iteration

**Related:** [Dry-run v1 PASS](../sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md) · [Dry-run v0 PASS](../sessions/2026-05-26-control-plane-local-bridge-wrapper-dry-run-v0.md) · [Wrapper design v1](../contracts/codex-bridge-wrapper-design-v1.md) · [Bridge contract §7](../contracts/codex-bridge-contract-v1.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## 1. Proven so far

| Item | Evidence |
|------|----------|
| v0 fail-closed wrapper path | [dry-run v0 PASS](../sessions/2026-05-26-control-plane-local-bridge-wrapper-dry-run-v0.md) — `needs_human`, no Codex |
| v1 Codex-read-only wrapper path | [dry-run v1 PASS](../sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md) — `pass`, Codex via wrapper |
| Regression path still works | v1 commit re-ran blocked fixture; exit 0, `codex_invoked: false` |
| Codex CLI 0.133.0 via §7 profile | `codex exec` read-only, ephemeral, schema output, temp workdir |
| Read-only sandbox | `-s read-only` |
| Temp workdir outside repo | `mkdtemp` + `-C <tempdir>` |
| No `codex resume` | `--ephemeral`; trace `codex_resume_used: false` |
| No n8n invocation | trace `n8n_invoked: false` |
| No OpenClaw invocation | trace `openclaw_invoked: false` |
| No workflow 40/41 mutation | untouched; listed in blocked_actions only |
| No PM-34 unlock | gated; not touched |
| No provider API key | ChatGPT OAuth via Codex CLI only |
| No Codex repo mutation | inlined context; trace `repo_mutation_attempted: false` |
| No Cursor worker automation | not invoked; post-gate checks |

**Distinction:** Manual smoke V2 proved Codex CLI behavior directly. Dry-run v1 proved the **wrapper boundary** can invoke Codex safely under `CONTROL_PLANE_ALLOW_CODEX_READONLY=1`.

---

## 2. Not proven yet

| Gap | Notes |
|-----|-------|
| n8n integration | No wrapper → n8n path |
| Workflow 40/41 safe routing | No wf touch; no routing logic |
| PM-34 worker unlock | Gated; not tested |
| Unattended automation | Manual operator + env gate only |
| Adversarial fixture matrix | Only two fixtures (blocked + success) |
| Timeout handling | Not designed or tested |
| Malformed Codex output handling | Single happy-path post-gate refinement |
| Schema drift handling | Fixed schema in wrapper; no version negotiation |
| Log redaction under failure | stderr not persisted to Git; no failure-case policy |
| Repeat-run idempotency | Not tested |
| Multi-fixture test matrix | Not defined |
| CI or scheduled execution | Forbidden for now |
| Cursor worker automation | Forbidden; not tested |

---

## 3. Hardening priorities

Conservative next work — **docs-first or local-only**, no n8n:

| Priority | Action |
|----------|--------|
| 1 | **Negative-test matrix design packet** (docs-only) — malformed input, forbidden actions, secret-shaped fields, unsafe Codex responses |
| 2 | Timeout/failure behavior design | Document fail-closed on Codex hang/exit non-zero |
| 3 | Redaction rules | Sanitized logs only; no secrets in sessions |
| 4 | Idempotency expectations | Same fixture → same status class |
| 5 | Safe/unsafe status enum | Document mapping: `pass` / `needs_human` / `blocked` / `failed` |
| 6 | Post-gate policy | Positive-only unsafe pattern detection (v1 lesson) |
| Out of scope | n8n, wf 40/41, PM-34, unattended loops |

---

## 4. Forbidden escalation

v1 PASS does **NOT** authorize:

| Action | Status |
|--------|--------|
| n8n integration | **Not authorized** |
| Workflow 40/41 mutation | **Not authorized** |
| PM-34 unlock | **Not authorized** |
| Provider API key | **Not authorized** |
| OpenClaw `agent main` | **Not authorized** |
| `codex resume` | **Not authorized** |
| Codex repo mutation | **Not authorized** |
| Cursor worker automation | **Not authorized** |
| Deploy / tag / rollback | **Not authorized** |
| Unattended automation | **Not authorized** |
| Scheduled execution | **Not authorized** |

---

## 5. Recommended next step

**Local wrapper negative-test matrix design packet (docs-only)**

**Rationale:** Before n8n or automation, the wrapper must prove it rejects:

- malformed JSON input
- forbidden `requested_actions`
- secret-shaped fields
- unsafe `recommended_next_step` from Codex (positive proposals only)
- malformed or incomplete Codex JSON
- missing `no_runtime_confirmation`

This is the safest incremental step after v1 PASS.

---

## 6. Future gate policy

| Action | Gate required |
|--------|---------------|
| Any runtime test | Explicit human gate |
| Any Codex invocation | Explicit human gate + `CONTROL_PLANE_ALLOW_CODEX_READONLY=1` |
| Any n8n interaction | Separate explicit human gate |
| Any workflow 40/41 mutation | Separate explicit human gate |
| Any PM-34 unlock | Separate explicit human gate |
| Any unattended automation | Separate explicit human gate |
| Wrapper code change | Separate gate; re-run v0 regression + v1 path |

---

## 7. Acceptance criteria (this packet)

- [x] Records v1 PASS accurately
- [x] Distinguishes proven vs not proven
- [x] Prevents premature n8n / PM-34 / worker escalation
- [x] Names conservative next docs-only packet (negative-test matrix)
- [x] No runtime in this task

---

## 8. References (no duplication)

| Artifact | Role |
|----------|------|
| [codex-bridge-wrapper-design-v1](../contracts/codex-bridge-wrapper-design-v1.md) | Wrapper boundary design |
| [codex-bridge-contract-v1](../contracts/codex-bridge-contract-v1.md) | §7 invocation properties |
| [local-wrapper-success-path-design-packet](local-wrapper-success-path-design-packet.md) | Success-path spec |
| [bridge-wrapper-runtime-dry-run-preflight](bridge-wrapper-runtime-dry-run-preflight.md) | First dry-run policy |
| `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` | v1 implementation (not modified here) |

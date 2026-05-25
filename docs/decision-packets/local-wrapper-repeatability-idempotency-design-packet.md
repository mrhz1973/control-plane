# Local wrapper repeatability/idempotency design packet

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/local-wrapper-repeatability-idempotency-design-packet.md`  
**Date:** 2026-05-26

## Status

- **DESIGN PACKET ONLY**
- no runtime executed by this task
- no Codex execution by this task
- no n8n invocation
- no wrapper code modified
- no fixture modified
- no workflow 40/41 mutation
- no PM-34 unlock
- explicit gate required before any repeatability/idempotency test run

**Related:** [Post-mock-output hardening](post-mock-output-hardening.md) · [Mock-only PASS](../sessions/2026-05-26-control-plane-mock-codex-output-negative-tests-mock-only.md) · [Static no-Codex PASS](../sessions/2026-05-26-control-plane-local-wrapper-negative-tests-static-no-codex.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Purpose

| Predecessor | What it proved |
|-------------|----------------|
| v0 / v1 dry-runs | Fail-closed and Codex-read-only happy path (single run each) |
| Static no-Codex negatives | Pre-gate rejection (single run per fixture) |
| Mock-output negatives | Post-gate sanitization (single run per mock) |

**Gap:** Repeatability and idempotency are **not** proven. A single PASS per fixture does not show that repeated local runs avoid hidden state drift, duplicate side effects, or unexpected repo mutations.

**Purpose:** Before n8n or unattended automation, design how repeated local wrapper runs must prove **stable status classes** and **no hidden side effects**.

This document defines the future test plan only. It does not authorize execution.

---

## What this packet does not authorize

| Action | Status |
|--------|--------|
| Test execution | **Not authorized** |
| Wrapper modification | **Not authorized** |
| Fixture creation/modification | **Not authorized** |
| Live Codex negative tests | **Not authorized** |
| n8n invocation | **Not authorized** |
| Workflow 40 / 41 mutation | **Not authorized** |
| PM-34 unlock | **Not authorized** |
| Provider API key | **Not authorized** |
| OpenClaw `agent main` | **Not authorized** |
| `codex resume` | **Not authorized** |
| Codex repo mutation | **Not authorized** |
| Cursor worker automation | **Not authorized** |
| Deploy / tag / rollback | **Not authorized** |
| Unattended automation | **Not authorized** |

---

## Future test scope

Default repeat count per fixture: **3 runs** (configurable in future gate; minimum 2).

### Group 1 — v0 blocked fixture repeated runs

| Fixture | Command base |
|---------|----------------|
| `tools/codex-bridge-wrapper/fixtures/blocked-no-runtime-permission.json` | `node local-bridge-wrapper.mjs <fixture>` |

**Expected stable class:** `needs_human` (exit 0)  
**Trace stability:** `codex_invoked: false`, `n8n_invoked: false`, `repo_mutation_attempted: false`

### Group 2 — static no-Codex negative fixtures repeated runs

| Fixtures | Expected class per fixture |
|----------|---------------------------|
| `negative/malformed-missing-request-id.json` | non-zero exit / stderr rejection |
| `negative/forbidden-action-n8n.json` | `blocked` (exit 0) |
| `negative/secret-shaped-provider-key.json` | non-zero exit |
| `negative/unsafe-context-dotenv.json` | `needs_human` (exit 0) |
| `negative/missing-human-gate.json` | non-zero exit |
| `negative/requested-actions-not-array.json` | non-zero exit |

**Stability rule:** Same fixture → same status class and same exit-code class across all runs in the group.

### Group 3 — mock-output negative fixtures repeated runs

| Requirement | Value |
|-------------|-------|
| Env | `CONTROL_PLANE_ALLOW_MOCK_CODEX_OUTPUT=1` |
| Carrier | `success-readonly-codex.json` |
| Flag | `--mock-codex-output <mock-file>` |

All eight files under `fixtures/mock-codex-output-negative/`.

**Expected stable class:** never `pass`; per mock file same class as first-run matrix (`failed` or `needs_human`)  
**Trace stability:** `codex_invoked: false`, `mock_codex_output_used: true`

### Group 4 — optional v1 Codex-read-only repeated run

| Requirement | Separate explicit gate only |
|-------------|----------------------------|
| Env | `CONTROL_PLANE_ALLOW_CODEX_READONLY=1` |
| Fixture | `success-readonly-codex.json` |
| Live Codex | **Yes** — not part of default repeatability gate |

**Expected stable class:** `pass` if Codex and environment unchanged; document quota/auth variance as FAIL if class drifts without code change.

**Out of scope for default gate:** Group 4 is optional and must not be bundled with Groups 1–3.

---

## Cross-cutting invariants (all groups)

| Invariant | Check |
|-----------|-------|
| No additional repo files | `git status --short` empty except pre-declared evidence |
| No accumulated wrapper state | No new files under repo from wrapper (temp dirs outside repo only for live Codex) |
| No duplicate side effects | No n8n calls, no wf mutation, no PM-34 |
| Workspace clean after | Only allowed session/status commits if applicable |
| `no_runtime_confirmation` | `true` on all JSON stdout outputs |
| `proposed_prompt_for_cursor` | `null` on bridge output |

---

## Future evidence requirements

Future session report must include:

| Item | Content |
|------|---------|
| Commands | Exact commands per group (sanitized) |
| Run count | Per fixture (e.g. 3×) |
| Status class | Per run in table |
| Exit code | Per run |
| `git status` | Before matrix, after matrix |
| Forbidden systems | Explicit not touched: n8n, wf 40/41, PM-34, provider API key, OpenClaw, `codex resume` |
| Output | Sanitized summaries only — no secrets, no full prompts |

---

## PASS criteria

Future **PASS** requires:

- [ ] Repeated runs produce stable expected status class per fixture
- [ ] Exit-code class stable per fixture (0 vs non-zero)
- [ ] No unexpected repo mutation
- [ ] No hidden state files written by wrapper under repo
- [ ] No duplicate side effects
- [ ] No n8n / workflow / PM-34 / provider API key / OpenClaw / `codex resume` / repo mutation / Cursor worker / deploy / tag / rollback / unattended automation
- [ ] JSON outputs retain `no_runtime_confirmation: true` where applicable
- [ ] No unsafe `proposed_prompt_for_cursor` emitted

---

## FAIL criteria

Future **FAIL** if any of:

- Same fixture changes status class unexpectedly across runs
- Exit-code class drifts without documented cause
- Repo gains unexpected files
- Wrapper writes persistent state under repo
- Output loses `no_runtime_confirmation` on JSON path
- Unsafe prompt emitted
- n8n / workflow / PM-34 touched
- Provider API key requested or used
- Codex invoked without separate gate (in Groups 1–3)
- Ambiguity not fail-closed

---

## Recommended implementation order

1. Design fixed fixture subset (Groups 1–3 only) in future gate
2. Run no-Codex repeatability (Group 1 + Group 2)
3. Run mock-output repeatability (Group 3)
4. Record sanitized evidence session
5. Update FOUNDATION_STATUS
6. Only later, with **separate gate**, consider live Codex repeatability (Group 4)

---

## Next gate

**Explicit human gate for local wrapper repeatability/idempotency no-Codex + mock-only test run**

**Still not authorized:**

- live Codex repeatability (Group 4)
- n8n integration
- workflow 40 / 41 mutation
- PM-34 unlock
- provider API key
- OpenClaw `agent main`
- `codex resume`
- Codex repo mutation
- Cursor worker automation
- deploy / tag / rollback
- unattended automation

---

## References (no duplication)

| Artifact | Role |
|----------|------|
| [post-mock-output-hardening](post-mock-output-hardening.md) | Recommends this packet |
| [mock-codex-output-negative-tests-design-packet](mock-codex-output-negative-tests-design-packet.md) | Mock categories |
| `tools/codex-bridge-wrapper/local-bridge-wrapper.mjs` | Current implementation (read-only here) |

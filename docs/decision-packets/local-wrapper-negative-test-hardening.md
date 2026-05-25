# Local wrapper negative-test hardening

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/local-wrapper-negative-test-hardening.md`  
**Date:** 2026-05-26  
**Status:**

- **DOCS-ONLY HARDENING**
- no runtime executed by this task
- no Codex execution by this task
- no wrapper code modified
- no fixture created or modified
- no n8n invocation
- no workflow 40/41 mutation
- no PM-34 unlock
- explicit gate required before mock Codex-output negative tests or any live Codex negative test

**Related:** [Static no-Codex PASS](../sessions/2026-05-26-control-plane-local-wrapper-negative-tests-static-no-codex.md) · [Negative-test matrix design](local-wrapper-negative-test-matrix-design-packet.md) · [Post-dry-run hardening](post-dry-run-wrapper-hardening.md) · [Dry-run v1 PASS](../sessions/2026-05-26-control-plane-codex-readonly-wrapper-dry-run-v1.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## 1. Proven so far

| Item | Evidence |
|------|----------|
| v0 fail-closed regression | [static no-Codex PASS](../sessions/2026-05-26-control-plane-local-wrapper-negative-tests-static-no-codex.md) — exit 0, `needs_human`, `codex_invoked: false` |
| Six static no-Codex negative fixtures | All PASS per safe outcome policy |
| Missing `request_id` rejected | `malformed-missing-request-id.json` — exit 1, stderr rejection |
| Forbidden `n8n_invocation` rejected | `forbidden-action-n8n.json` — `blocked`, `codex_invoked: false` |
| Secret-shaped `provider_api_key` rejected | `secret-shaped-provider-key.json` — exit 1, pre-gate secret scan |
| Unsafe `.env` context ref | `unsafe-context-dotenv.json` — `needs_human`, no Codex (v0 human-gate path; ref not read) |
| Missing `human_gate_state` rejected | `missing-human-gate.json` — exit 1 |
| `requested_actions` wrong type rejected | `requested-actions-not-array.json` — exit 1 |
| Wrapper code unchanged | No edit to `local-bridge-wrapper.mjs` |
| Existing fixtures unchanged | `blocked-no-runtime-permission.json`, `success-readonly-codex.json` untouched |
| Codex not invoked | All negative runs; no `CONTROL_PLANE_ALLOW_CODEX_READONLY` |
| n8n not invoked | `n8n_invoked: false` on JSON outputs |
| OpenClaw not invoked | `openclaw_invoked: false` |
| Workflow 40/41 untouched | No export/import/mutation |
| PM-34 gated | Not unlocked |
| Provider API key policy | **NO** — synthetic sentinel only in fixture; rejected at pre-gate |
| No wrapper repo mutation | Only committed fixtures, session, status |

**Distinction:** v1 dry-run proved Codex read-only happy path. Static no-Codex negatives prove **pre-gate rejection** without transport.

---

## 2. Not proven yet

| Gap | Notes |
|-----|-------|
| Mock Codex-output negative handling | Category F in matrix — not implemented |
| Malformed Codex output handling | Post-gate path untested with adversarial JSON |
| Missing `no_runtime_confirmation` in Codex output | Not exercised |
| Unsafe `recommended_next_step` in Codex output | Positive-only post-gate not adversarially tested |
| Timeout handling | Not designed or tested |
| Non-zero Codex process handling | Not tested |
| Empty stdout handling | Not tested |
| stderr warning handling | Not tested |
| Schema drift handling | Fixed schema; no negotiation |
| Redaction under failure | No failure-case log policy |
| Repeated-run idempotency of negative matrix | Not tested |
| Live Codex negative tests | Explicitly not authorized |
| n8n integration | No wrapper → n8n path |
| Workflow 40/41 routing | No wf touch |
| PM-34 unlock | Gated |
| Unattended automation | Manual operator only |
| Cursor worker automation | Forbidden; not tested |

**Note:** `unsafe-context-dotenv.json` PASS via human-gate rejection on v0 path — **context_refs fragment blocking on v1 path remains unproven** by this static run.

---

## 3. Hardening interpretation

| Statement | Implication |
|-----------|-------------|
| Static no-Codex tests validate pre-gate rejection | Input validation, forbidden actions, secret scan, type checks |
| They do **not** validate post-Codex output sanitization | Post-gates only proven on v1 happy path |
| They do **not** authorize n8n | No n8n client; forbidden action blocked |
| They do **not** authorize live Codex negative tests | No Codex transport in this matrix run |
| They do **not** authorize PM-34 | Gated throughout |
| They do **not** authorize unattended automation | Operator-gated runs only |

**Correct next scope:** docs-only planning for **mock Codex-output negative tests**, or explicit gate to implement mock-only output injection — not live Codex negatives, not n8n.

---

## 4. Recommended next step

**Mock Codex-output negative tests design packet (docs-only)**

**Rationale:** Before live Codex negative tests, design a mock/stub path for unsafe Codex-like outputs:

- malformed JSON
- missing `no_runtime_confirmation`
- `no_runtime_confirmation: false`
- unsafe `recommended_next_step` (n8n, wf 40/41, PM-34, deploy, etc.)
- `proposed_prompt_for_cursor` unexpectedly non-null
- status/output contradictions

Mock design precedes wrapper changes and any live Codex negative run.

---

## 5. Future gate policy

| Action | Gate required |
|--------|---------------|
| Creating mock fixtures | Explicit human gate |
| Modifying wrapper code | Explicit human gate + v0 regression |
| Running mock-output tests | Explicit human gate |
| Live Codex negative tests | **Separate** explicit human gate + env |
| n8n interaction | Separate explicit human gate |
| Workflow 40/41 mutation | Separate explicit human gate |
| PM-34 unlock | Separate explicit human gate |
| Unattended automation | Separate explicit human gate |

---

## 6. Forbidden escalation

Static no-Codex PASS does **NOT** authorize:

| Action | Status |
|--------|--------|
| Live Codex negative tests | **Not authorized** |
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

---

## 7. Acceptance criteria (this packet)

- [x] Records static no-Codex PASS accurately
- [x] Distinguishes pre-gate proven vs post-Codex unproven
- [x] Prevents premature live Codex / n8n / PM-34 / worker escalation
- [x] Names conservative next docs-only packet (mock Codex-output design)
- [x] No runtime in this task

---

## 8. References (no duplication)

| Artifact | Role |
|----------|------|
| [local-wrapper-negative-test-matrix-design-packet](local-wrapper-negative-test-matrix-design-packet.md) | Categories A–H |
| [static no-Codex PASS session](../sessions/2026-05-26-control-plane-local-wrapper-negative-tests-static-no-codex.md) | Test evidence |
| [post-dry-run-wrapper-hardening](post-dry-run-wrapper-hardening.md) | v0/v1 proven baseline |
| `tools/codex-bridge-wrapper/fixtures/negative/` | Six negative fixtures (not modified here) |

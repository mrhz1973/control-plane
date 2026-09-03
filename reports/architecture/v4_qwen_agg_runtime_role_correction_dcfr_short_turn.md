# AGG Runtime Role Correction — DCFR Short-Turn Unqualification (Control Plane)

**BLOCK-ID:** `V4_QWEN_AGG_RUNTIME_ROLE_CORRECTION_DCFR_SHORT_TURN`
**Classification:** `V4_QWEN_AGG_RUNTIME_ROLE_CORRECTION_PASS`
**Date:** 2026-09-03
**Baseline:** `V4_QWEN_LOCAL_6_PROFILE_ROUTER_CONTROL_PLANE_INTEGRATION` (PASS, same day)

## Input finding (verbatim summary)

Live local backend tests on RTX 3060 12 GB (direct, bypassing UI and router):

- 34-token prompt: ~19–20 s prompt evaluation
- 39-token completion: ~4.8–5.0 tok/s
- total simple request: ~27 s
- identical behavior at ctx 16K and ctx 8K

Existing long-workload benchmark remains valid:

- DCFR cold prefill ~87–90 tok/s at 2K–8K
- long decode ~12.56 tok/s

**Correct interpretation:** DCFR = `FAST_THROUGHPUT` / `LONG_TASK`.
DCFR ≠ validated `FAST_INTERACTIVE` / `SHORT_TURN_AGENT`.

## What changed

### 1. Machine role-qualification overlay (new)

`configs/resources/qwen-role-qualification.json` —
version `qwen38-rtx3060-2026-09-03-agg`:

- Six profiles preserved, `keep_in_selector = true` everywhere; **no deletion,
  no retirement, no silent replacement**.
- `qwen38-dcfr-iq3-agent-24k`: `FAST_AGENT`, `FAST_INTERACTIVE`,
  `FAST_AGENT_SHORT_TURN`, `MCP` = `UNQUALIFIED`;
  `FAST_THROUGHPUT_LONG_TASK` = `QUALIFIED`; `BLENDER_FAST` =
  `OUT_OF_SCOPE_CONTROL_PLANE`.
- `qwen38-dcfr-iq3-fast-16k`: `FAST` stays `QUALIFIED`; short-turn roles
  `UNQUALIFIED` (identical short-turn behavior at 16K/8K).
- Role-level map: `FAST_AGENT` / `FAST_INTERACTIVE` / `FAST_AGENT_SHORT_TURN`
  = `UNQUALIFIED`; `FAST_THROUGHPUT_LONG_TASK` = `QUALIFIED`.
- Requalification comparison set (retained profiles):
  `qwen38-original-ar-16k`, `qwen38-opus-q3-daily-16k`,
  `qwen38-opus-q3-agent-24k`.
- Explicit policy booleans: no delete/retire DCFR, no silent substitution, no
  deleting any of the six profiles; Blender out of scope.

### 2. Qualification API (`tools/qwen-local-runtime-v1.mjs`)

- `loadQwenRoleQualification()` — loads the overlay (BOM-safe).
- `roleQualification(role, overlay?)` — exact per-role value; unlisted roles
  default `QUALIFIED` (legacy behavior preserved).
- `roleQualifiedForLiveExecution(role, overlay?)` — gate; **fail-closed for the
  AGG-corrected roles when the overlay is unreadable/malformed**; other roles
  keep pre-overlay behavior.

### 3. Fail-closed live-execution gates (all offline-testable, no live path)

| Boundary | Function | Blocked result |
|---|---|---|
| Adapter (hard final gate) | `executeOpenCodeBounded` | `AUTHORIZATION_REJECTED` + `ROLE_UNQUALIFIED_FOR_LIVE_EXECUTION` before occupancy/guard/runner |
| Scope gate helper | `scopeRoleQualifiedForLiveExecution` | scope digest unchanged; layers role check on top |
| Dispatch | `dispatchOpenCodeExecution` | `PROFILE_ROLE_UNQUALIFIED` (no `DISPATCH_READY` asserted) |
| WF40 proposal | `buildLiveExecutionProposal` | `PROFILE_ROLE_UNQUALIFIED`, `register_request = null` |
| WF40 authorization mint | `buildRuntimeAuthorizationFromStatus` | `PROFILE_ROLE_UNQUALIFIED`, no ACTIVE envelope |
| Registry → adapter passthrough | `openCodeQwenLocalRegistration().run` | forwards `roleGate` (test injection only) |
| n8n bridge | `buildRouterRequest` | forwards `roleGate` (test injection only) |
| WF40 live seam (n8n node source) | `tools/apply-v4-wf40-live-seam-v1.py` | proposal node pushes `ROLE_UNQUALIFIED_FOR_LIVE_EXECUTION` reason; issued-sidecars node `ready=false` |

`roleGate` is an **offline test-injection seam only**; no production caller
supplies it, and the registry/bridge simply pass it through when present.
The scope-v2 digest is **unchanged** (`5261290c…e02261`) — qualification is a
separate layer, not a scope mutation.

### 4. Config annotations (stale mapping marked, not rewritten)

- `configs/resources/qwen-local-runtime.json`:
  `next_wf40_executor_status = STALE_UNQUALIFIED_PENDING_REQUALIFICATION`,
  `role_qualification_overlay` pointer, per-profile `agg_2026_09_03` blocks
  with qualified/unqualified roles and the empirical numbers.
- `configs/resources/qwen-local-model-policy.json`:
  `next_wf40_executor.status = STALE_UNQUALIFIED_PENDING_REQUALIFICATION`,
  `role_qualification` map + pending comparison set, new `do_not_promote`
  entries (`DCFR_AS_SHORT_TURN_INTERACTIVE`, `SILENT_FAST_AGENT_SUBSTITUTION`).

### 5. Docs

- `docs/foundation/QWEN_LOCAL_ROLE_ROUTING_POLICY.md` — "Next WF40 executor"
  section now titled **STALE**, with the empirical data, consequences, and
  fail-closed points.
- `docs/contracts/qwen-execution-scope-v2.md` — new "Role-qualification gate"
  section (digest unchanged; requalification requires overlay update + explicit
  authorization; scope-v2 alone cannot re-enable FAST_AGENT).
- `docs/contracts/opencode-execution-adapter-v1.md` — gate documented at the
  authorization section.
- `docs/contracts/opencode-execution-dispatch-v1.md` — `PROFILE_ROLE_UNQUALIFIED`
  classification added.
- `docs/contracts/v4-windows-local-execution-endpoint-v1.md` — valid-request
  fail-closed note added.

## What did NOT change

- All six production profiles and router/runtime paths — preserved.
- Router at `http://127.0.0.1:8080` and its backend ownership — untouched.
- Scope-v2 contract, digest, register-pending 8-key schema — unchanged.
- Uncensored retention policy — unchanged.
- DFlash2 semantics (profiles retired, directory normal) — unchanged.
- No Blender introduction — out of scope honored.
- Real Qwen generations: **0**. OpenCode executions: **0**. Register-pending
  deltas: **0**. Provider/Telegram calls: **0**.

## Test evidence (all offline; zero side effects)

New suite `tests/qwen-role-qualification-agg/run.mjs` — 19/19 PASS:

- overlay preserves six profiles; no delete/retire flags
- FAST_AGENT/FAST_INTERACTIVE/FAST_AGENT_SHORT_TURN UNQUALIFIED
- FAST_THROUGHPUT_LONG_TASK QUALIFIED; legacy roles (DAILY/QUALITY/REFERENCE/
  MANUAL_UNCENSORED) still QUALIFIED
- live gate blocks FAST_AGENT; allows DAILY; fails closed on malformed overlay
- runtime doc valid; DCFR profiles annotated
- scope-v2 digest unchanged; scope role gate blocks canonical scope
- WF40 proposal fails closed (`PROFILE_ROLE_UNQUALIFIED`, `register_request=null`)
- no ACTIVE envelope minted under unqualified role
- adapter blocks cryptographically-valid auth (guard never starts)
- validator boundary unchanged (scope integrity vs qualification separated)
- dispatch fails closed (`PROFILE_ROLE_UNQUALIFIED`)
- seam applicator embeds the role gate

Updated existing suites (mechanics preserved via injected qualified-role gates;
default-path block behavior now explicitly asserted):

| Suite | Result |
|---|---|
| qwen-role-qualification-agg | 19/19 PASS |
| opencode-execution-adapter | 24/24 PASS (incl. new `agg-default-unqualified-role-blocks`) |
| opencode-execution-dispatch | ALL PASS (incl. new `A0-agg-fast-agent-unqualified`) |
| v4-wf40-live-execution-sidecars | 29/29 PASS (incl. new `14b`, `18b`) |
| v4-execution-adapter-router | 15/15 PASS |
| n8n-v4-execution-adapter-router-bridge | 18/18 PASS (incl. new `agg-valid-auth-blocked-unqualified-role`) |
| v4-windows-local-execution-endpoint | 65/65 PASS |
| v4-execution-adapter-registry | 19/19 PASS |
| qwen-local-6-profile-router | 25/25 PASS |
| qwen-local-llama-cpp-transport | 9/9 PASS |
| qwen-local-session-manager | 14/14 PASS |
| qwen-local-resource-status-overlay | 14/14 PASS |
| qwen-local-adapter | 9/9 PASS |
| execution-router | 12/12 PASS |
| opencode-single-generation-guard | 16/16 PASS |
| v4-runtime-authorization-issuance | 60/60 PASS |
| v4-runtime-authorization-durable-spend-ledger | 13/13 PASS |
| resource-status-validator | 6/6 PASS |
| v4-execution-route-sidecar-source | 24/24 PASS |
| n8n-v4-execution-routing-bridge | 23/23 PASS |
| execution-packet-validator | 5/5 PASS |
| execution-packet-policy-gate | 15/15 PASS |
| v4-local-runtime-readonly-contribution | 57/57 PASS |
| v4-local-runtime-readonly-private-endpoint | 22/22 PASS |
| v4-resource-status-control-plane-source | 34/34 PASS |
| litellm-primary-cycle | 18/18 PASS |
| litellm-primary-one-shot | 7/7 PASS |
| llm-gateway-request-shape | 4/4 PASS |
| llm-gateway-portability | 19/19 PASS |
| openclaw-consumer-roundtrip | PASS |
| openclaw-request-builder | 15/15 PASS |
| openclaw-planner-response-gate | 15/15 PASS |
| backlog-primary-remote-adapter | 18/18 PASS |
| planner-selection-evaluator | 17/17 PASS |
| resource-registry-validator | 7/7 PASS |

## Governance of the next live execution proof

`V4_WF40_FIRST_LIVE_AUTHORIZED_EXECUTION_PROOF_POST_POSTGRES_RETRY` **cannot
proceed** under the current mapping. Preconditions to re-open it:

1. Run the retained-profile comparison (Original AR 16K / OPUS Daily 16K /
   OPUS Agent 24K) for short-turn interactive agent workloads.
2. Operator decision recording the winner (or explicit requalification of a
   DCFR profile for short-turn).
3. Role-qualification overlay update +, if the profile/role binding changes,
   a scope-v3 (or operator-authorized scope-v2 successor) with a new digest.
4. Only then: next-WF40-executor update and the live proof.

## NEXT

`V4_QWEN_SHORT_TURN_PROFILE_COMPARISON_RETAINED_PROFILES` (offline/analysis
first; any live timing tests require explicit operator authorization).

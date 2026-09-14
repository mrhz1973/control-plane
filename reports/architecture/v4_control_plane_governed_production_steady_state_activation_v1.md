# V4 Control Plane governed production steady-state activation V1

**TASK_REF:** `V4_CONTROL_PLANE_GOVERNED_PRODUCTION_STEADY_STATE_ACTIVATION_V1`
**BASE_HEAD:** `8db85b7dd84660b32e46ae0af954a84b14154ea5` (== origin/main == HEAD at start, verified PASS)
**Date (Europe/Rome):** 2026-09-14
**MODE:** GOVERNED PRODUCTION STEADY-STATE ACTIVATION
**MODEL_INFERENCE=0 · CHATGPT_WEB_SENDS=0 · QWEN_GENERATIONS=0 · OPENCODE_EXECUTIONS=0 · PRODUCTION_DISPATCH_COUNT=0**

---

## 1. Exact human authorization

Operator statement (this task's prompt):

> "AUTORIZZO L'ATTIVAZIONE DEL CONTROL PLANE IN PRODUZIONE NEL PERIMETRO GOVERNATO GIÀ QUALIFICATO"

Satisfies the separate human production-promotion gate. It does NOT authorize: new routes, new providers, new model families, task/run authorization bypass, spend-ledger bypass, silent fallback, D-0025 reopening, OpenClaw broker/fallback reactivation, unqualified execution, or synthetic work.

## 2. Prior disabled state (preserved facts)

Post-canary posture (Phase F, 2026-09-12): `HERMES_ROUTE_CONTROL=DISABLED` · `CURRENT_MODE=SHADOW_ONLY` · `ACTIVE_PRODUCTION_AUTHORIZATION=0` · `D0025_ENABLED=false`, with the canary's intentional post-dispatch restore recorded in `disable_history` (RUN_ID `108690b6…`, EXECUTED_CONFIRMED, exactly ONE send). Preserved: `FINAL_PRODUCTION_ACTIVATION_DECISION=A_RECORDED`, `LIVE_CANARY=PASS`, `SILENT_FALLBACK=NO`, `AUTHORIZATION_BYPASS=NO`, `ROLLBACK_READY=YES`, `RT25_ADMISSION_REUSED=YES`, `HERMES_QUALIFIED_TRANSPORT_REUSED=YES`. The canary was NOT repeated.

## 3. Qualified production perimeter (unchanged)

Route allow-list verified live from the provenance registry document: exactly `["opencode+qwen_local", "hermes+chatgpt_web"]` (5 entries, all SPENT, ACTIVE=0 — no third route, no renames, no merges). Controlled Hermes route identity preserved: `qwen_local+hermes+chatgpt_web`.

## 4. Route-control activation

Executed via the existing canonical mechanism (no second control schema):

```bash
node tools/v4-phase-f-route-control-v1.mjs --state-path configs/runtime/route-control/hermes-route-state.json --action enable-candidate --updated-by V4_CONTROL_PLANE_GOVERNED_PRODUCTION_STEADY_STATE_ACTIVATION_V1
```

Result: `state=CANDIDATE_ENABLED` (persistent tracked document; `updated_by` carries THIS task ref + the human authorization recorded in this report/commit) · `restoration_state=SHADOW_ONLY` preserved · `disable_history` preserved intact (post-canary rollback record NOT erased) · fail-closed law intact (`production_dispatch_permitted=false` is an invariant of this control generation: candidate flag ≠ authorization; malformed/missing/unknown documents still fail closed). Note: the control's state space intentionally contains no production-enabled state; steady-state dispatch authority remains per-dispatch authorization, which is the desired governed posture.

## 5. opencode+qwen production-path state

The already-qualified production execution ingress is the existing chain: WF40 structural routing → Windows execution transport (Tailscale-private `/v4/execution/opencode-local` → `127.0.0.1:18791` endpoint) → durable spend ledger → provenance registry ACTIVE→SPENT → execution adapter (`opencode+qwen_local`, scope-v3, `qwen38-opus-q3-agent-24k`). Verified from frontier/contract evidence: that path requires only a valid ACTIVE task/run authorization to execute — no activation change is needed or performed. The LOCAL_DEV always-on dispatcher (WF90) remains LOCAL_DEV_ONLY; LOCAL_DEV proof is NOT reinterpreted as production authorization; no conversion to a production dispatcher occurred.

```text
OPENCODE_QWEN_PRODUCTION_PATH=ARMED_GOVERNED
```

## 6. Hermes steady-state production entrypoint

Assessment: `executePromotedRoute()` is qualified and live-proven, but the only prior live invocation was the Phase-F canary driver — no operational non-canary entrypoint existed. Created exactly ONE minimal composition-only entrypoint: **`tools/v4-governed-production-dispatch-v1.mjs`** (adapter/composition edge only).

It reuses (never reimplements): RT25 admission (local runtime producer → composer → join, occupancy sampled before any live fetch), Phase E shadow selection, route-control evaluation (requires persisted `CANDIDATE_ENABLED`), provenance-registry inspect (`operator-runtime-authorization-v1` envelope, route-pinned, task-bound), durable spend ledger (LEDGER-FIRST before transport, then ACTIVE→SPENT via `admitAuthorization`), Phase-F promotion adapter dual-gate eligibility + `executePromotedRoute(production_activation_confirmed=true)`, the qualified Hermes `chainSend` transport (exactly one chain per invocation), and the independent DOM verifier `turn-verify` law (fresh-check human-gate precheck + post-send confirmation).

Constraints enforced in code: MAX ONE task per invocation; exact `--task-ref` + `--run-id` + `--authorization-id` + `--base-head` + `--payload-file` + `--nonce` binding; route is NOT a parameter (single controlled identity); no authorization creation/approval; no Telegram decision generation; no scheduler/queue; no public listener; bounded `v4-governed-production-dispatch-result-v1` result; fail-closed blocked result with exit 1 on every negative stage.

## 7. Authorization boundaries (preserved issuance law)

No authorization pre-generated; ACTIVE=0 verified after activation. A future real task must still obtain its own bounded runtime authorization through the canonical Telegram/human issuance path; the operator's promotion authorization is NOT an unlimited task-execution token. `RUNTIME_AUTHORIZATION_REQUIRED_PER_DISPATCH=YES` — global activation never replaces task/run-bound authorization. HUMAN PROMOTION GATE ≠ RUNTIME AUTHORIZATION.

## 8. Zero-dispatch activation proof

Structural fail-closed probe (the only invocation of the new entrypoint, this task): invalid authorization id → `BLOCKED / AUTHORIZATION_ID_NOT_ISSUED` at stage `AUTH_REGISTRY`, BEFORE transport, `execution_performed=false`, `production_dispatch=false` — with only read-only admission sampling on the way (producer/composer/join read local state; no model call, no browser action). Final verification sweep: registry ACTIVE=0; route control `CANDIDATE_ENABLED` + `restoration_state=SHADOW_ONLY` + history intact; `ROLLBACK_READY=YES` (rollback observation over preserved history); allow-list unchanged; D-0025 false (untouched); OpenClaw retired roles untouched; NEW VPS not accessed this task.

```text
PRODUCTION_DISPATCH_COUNT_THIS_TASK=0
```

## 9. Emergency rollback (deterministic)

```bash
node tools/v4-phase-f-route-control-v1.mjs --state-path configs/runtime/route-control/hermes-route-state.json --action disable --updated-by <task-or-operator>
```

Minimum target: `HERMES_ROUTE_CONTROL=DISABLED` · `CURRENT_MODE=SHADOW_ONLY` · `ACTIVE_PRODUCTION_AUTHORIZATION=0` (any unspent authorization must be left to expire or be explicitly revoked via the existing issuance/registry path). No qualification evidence removed; no runtime-authorization infrastructure rolled back; independent of OLD VPS (permanently decommissioned). `ROLLBACK_READY=YES`.

## 10. Final production state

```text
CONTROL_PLANE_PRODUCTION_MODE=GOVERNED_ACTIVE
CONTROL_PLANE_PRODUCTION_PROMOTION_AUTHORIZED=YES
HERMES_ROUTE_CONTROL=CANDIDATE_ENABLED
HERMES_PRODUCTION_PATH=ARMED_GOVERNED
OPENCODE_QWEN_PRODUCTION_PATH=ARMED_GOVERNED
RUNTIME_AUTHORIZATION_REQUIRED_PER_DISPATCH=YES
ACTIVE_PRODUCTION_AUTHORIZATION=0
NO_SILENT_FALLBACK=PASS
D0025_ENABLED=false
OPENCLAW_BROKER_RUNTIME=RETIRED
OPENCLAW_FALLBACK_ROLE=RETIRED
OPENCLAW_AGENT_RUNTIME=RETIRED
NEW_ROLE=LIVE
NEW_CANONICAL_VPS=31.70.139.73
ISSUE_18=DEFERRED_FUTURE_RESEARCH (untouched)
ISSUE_35=WAIT_FOR_SUBSCRIPTION_ASTRA_AVAILABILITY_OR_NEW_EVIDENCE (untouched)
```

Steady-state semantics: production is ACTIVE and READY but IDLE — useful work executes only when every canonical gate succeeds (real READY task, admission, eligibility, task/run binding, ACTIVE route-pinned authorization, ledger-first spend, qualified adapter, independent verification).

## 11. NEXT

`NO_READY_ENGINEERING_TASKS` remains the global frontier state (only parked #35 and deferred #18 remain; not modified). The next real production dispatch belongs to a future operator-authorized task that issues its own runtime authorization through the canonical path.

```text
CURRENT_NEXT=NO_READY_ENGINEERING_TASKS
NEXT=NO_READY_ENGINEERING_TASKS
```

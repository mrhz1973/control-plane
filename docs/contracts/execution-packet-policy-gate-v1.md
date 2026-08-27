# Execution Packet policy gate v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/execution-packet-policy-gate-v1.md`  
**Version:** `execution-packet-policy-gate-v1`  
**Date:** 2026-08-27  
**Status:** `GPT-WEB AUTHORED — CANONICAL POLICY CONTRACT`  
**Runtime authorized by this document:** **NO**

---

## 0. Purpose

Define the deterministic policy step that runs after an `execution-packet-v1` object is schema-valid and before any Cursor dispatch.

The gate must not trust planner prose or planner self-authorization. It emits one deterministic policy result:

```text
PROCEED | GATE | BLOCKED
```

This contract is repo-only until a later n8n/runtime integration is explicitly authorized.

---

## 1. Input

One JSON object that must validate against:

```text
docs/contracts/execution-packet-v1.schema.json
```

Schema-invalid input is never evaluated semantically; it is `BLOCKED`.

---

## 2. Machine-readable result

Minimum output:

```yaml
schema: execution-packet-policy-result-v1
task_id: <packet.task_id|null>
packet_id: <packet.packet_id|null>
decision: PROCEED|GATE|BLOCKED
cursor_dispatch_allowed: true|false
human_gate_required: true|false
reason_codes: []
```

Rules:

- `PROCEED` => `cursor_dispatch_allowed=true`, `human_gate_required=false`;
- `GATE` => `cursor_dispatch_allowed=false`, `human_gate_required=true`;
- `BLOCKED` => `cursor_dispatch_allowed=false`, `human_gate_required=false`.

`reason_codes` must be deterministic, stable, and emitted in the precedence/order defined below.

---

## 3. Precedence

Evaluate in this order.

### A. BLOCKED conditions

1. packet fails canonical JSON Schema validation:
   - `PACKET_SCHEMA_INVALID`
2. `status == SUPERSEDED`:
   - `PACKET_SUPERSEDED`

If either applies, decision is `BLOCKED`. Do not continue to a lower-precedence result.

### B. GATE conditions

Accumulate all applicable reason codes in this exact order:

1. `status == GATED`
   - `PACKET_ALREADY_GATED`
2. `risk_assessment.level == high`
   - `RISK_HIGH`
3. `risk_assessment.scope_expansion == true`
   - `SCOPE_EXPANSION`
4. `risk_assessment.destructive == true`
   - `DESTRUCTIVE`
5. `risk_assessment.production_sensitive == true`
   - `PRODUCTION_SENSITIVE`
6. `risk_assessment.credentials_or_billing == true`
   - `CREDENTIALS_OR_BILLING`
7. `gate_recommendation.required == true`
   - `PLANNER_RECOMMENDED_GATE`
8. `planner.fallback_used == true`
   - `PLANNER_FALLBACK_REQUIRES_EQUIVALENCE_GATE`

The fallback rule is intentionally fail-closed in v1 because `execution-packet-v1` does not yet carry a machine-verifiable planner-equivalence attestation. A later explicit contract may narrow this gate.

If one or more GATE conditions apply, decision is `GATE` and all matching reason codes are returned.

### C. PROCEED

If the packet is schema-valid, not superseded, and no GATE condition applies:

```text
PROCEED
```

`READY_FOR_GATE` and `READY_FOR_EXECUTION` do not bypass deterministic policy. They are lifecycle markers only. The planner cannot self-authorize execution.

---

## 4. Boundedness parity prerequisite

The canonical machine schema must enforce the finite bounds already declared by the OpenClaw consumer contract:

```yaml
loop.max_rounds: 1..10
review.max_review_rounds: 0..10
```

Therefore `docs/contracts/execution-packet-v1.schema.json` must contain:

```json
"max_rounds": {"type":"integer","minimum":1,"maximum":10}
```

and:

```json
"max_review_rounds": {"type":"integer","minimum":0,"maximum":10}
```

This closes the current parity gap between the machine schema and `openclaw-execution-packet-consumer-v1.md`.

No other schema semantics are changed by this contract.

---

## 5. Minimum deterministic tests

At minimum:

- low-risk clean packet -> `PROCEED`;
- high risk -> `GATE/RISK_HIGH`;
- scope expansion -> `GATE/SCOPE_EXPANSION`;
- destructive -> `GATE/DESTRUCTIVE`;
- production sensitive -> `GATE/PRODUCTION_SENSITIVE`;
- credentials/billing -> `GATE/CREDENTIALS_OR_BILLING`;
- planner gate recommendation -> `GATE/PLANNER_RECOMMENDED_GATE`;
- planner fallback -> `GATE/PLANNER_FALLBACK_REQUIRES_EQUIVALENCE_GATE`;
- multiple gate reasons -> all codes in canonical order;
- status `GATED` -> `GATE/PACKET_ALREADY_GATED`;
- status `SUPERSEDED` -> `BLOCKED/PACKET_SUPERSEDED`;
- schema-invalid -> `BLOCKED/PACKET_SCHEMA_INVALID`;
- `loop.max_rounds=11` -> schema invalid;
- `review.max_review_rounds=11` -> schema invalid;
- `READY_FOR_EXECUTION` with a hard gate flag -> still `GATE`.

Existing D-0017/D-0018/D-0019/D-0020 tests must remain green.

---

## 6. Hard boundaries

This contract does not authorize:

- Cursor dispatch;
- n8n mutation or activation;
- OpenClaw calls;
- provider/model inference;
- credentials;
- Telegram sends;
- PM-34/L5/endurance/permanent scheduling;
- destructive actions.

It defines deterministic repo-side policy only.

---

**End of contract.**

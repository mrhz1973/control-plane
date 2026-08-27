# Planner selection evaluator v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/planner-selection-evaluator-v1.md`  
**Version:** `planner-selection-evaluator-v1`  
**Date:** 2026-08-27  
**Status:** `GPT-WEB AUTHORED — CANONICAL POLICY CONTRACT`  
**Runtime authorized by this document:** **NO**

---

## 0. Purpose

Make `planner-routing-policy-v1.md` mechanically executable without asking an LLM to choose the planner at runtime.

Input is one `planner-routing-input-v1` object. Output is one deterministic `planner-selection-v1` record.

This evaluator selects only the planner class (`qwen|glm|codex`). It does not invoke a provider, choose/modify credentials, start OpenClaw, or authorize an inference request.

Parent policy: `docs/contracts/planner-routing-policy-v1.md`. On conflict, the parent policy wins and the evaluator must STOP rather than invent new semantics.

---

## 1. Input

Input must validate against:

`docs/contracts/planner-routing-input-v1.schema.json`

No missing provider state is synthesized.

---

## 2. Planner usability states

### Qwen

`qwen` is `HEALTHY` only when:
- `available == true`; and
- `resource_pressure` is `low` or `medium`.

It is `UNAVAILABLE` when:
- `available == false`; or
- `resource_pressure == high`.

It is `UNKNOWN` when:
- `available == "unknown"`; or
- `resource_pressure == "unknown"`.

Qwen has no `CONSERVE` state in v1.

### GLM / Codex

A remote planner is `HEALTHY` only when:
- `available == true`; and
- `quota_state == healthy`.

It is `CONSERVE` only when:
- `available == true`; and
- `quota_state == conserve`.

It is `UNAVAILABLE` when:
- `available == false`; or
- `quota_state == exhausted`.

It is `UNKNOWN` when:
- `available == "unknown"`; or
- `quota_state == unknown`.

`UNKNOWN` is never silently treated as healthy.

---

## 3. Output

Minimum machine-readable result:

```yaml
schema: planner-selection-v1
task_id: D-NNNN-X
preferred: glm
selected: glm|null
fallback_used: false
fallback_reason: null
risk: low|medium|high
complexity: low|medium|high
policy_result: PROCEED|GATE|BLOCKED
reason_codes: []
```

Rules:
- `PROCEED` requires `selected != null`;
- `GATE` and `BLOCKED` require `selected == null`;
- `fallback_used=true` iff `selected != preferred`;
- `fallback_reason` is non-null iff fallback is used.

This output is routing evidence only. It does not authorize a provider call.

---

## 4. Deterministic selection algorithm

Evaluate in this exact order.

### A. Invalid input

If input fails the canonical schema:
- `policy_result=BLOCKED`
- `selected=null`
- reason `ROUTING_INPUT_INVALID`.

### B. Preferred planner HEALTHY

If preferred planner state is `HEALTHY`:
- select preferred;
- `policy_result=PROCEED`;
- no fallback.

This rule applies regardless of `fallback_policy`, because no fallback is needed.

### C. Preferred remote planner CONSERVE

Applies only to GLM/Codex.

1. `fallback_policy=gate_only`:
   - select preferred despite conserve;
   - `PROCEED`;
   - reason code `PREFERRED_CONSERVE_USED_GATE_ONLY`.

2. `fallback_policy=equivalent_or_gate`:
   - select preferred despite conserve;
   - `PROCEED`;
   - reason code `PREFERRED_CONSERVE_USED_NO_EQUIVALENCE_FALLBACK`.
   - v1 has no machine-verifiable equivalence attestation, so it must not switch planners merely to conserve quota.

3. `fallback_policy=normal`:
   - scan the explicit `fallback` array in order;
   - first fallback in `HEALTHY` state may be selected;
   - if selected: `fallback_used=true`, `fallback_reason=PREFERRED_QUOTA_CONSERVE`, `PROCEED`;
   - if no fallback is HEALTHY, select preferred in conserve state and `PROCEED` with reason `PREFERRED_CONSERVE_NO_HEALTHY_FALLBACK`.

A `CONSERVE` fallback is not preferred over a `CONSERVE` preferred planner.

### D. Preferred planner UNAVAILABLE or UNKNOWN

1. If `risk_hint == high`:
   - `GATE`;
   - no automatic fallback;
   - reason `HIGH_RISK_PREFERRED_UNAVAILABLE` or `HIGH_RISK_PREFERRED_UNKNOWN`.
   - This implements the parent high-complexity/high-risk equivalent-fallback-or-gate boundary without inventing equivalence evidence.

2. `fallback_policy=gate_only`:
   - `GATE`;
   - reason `PREFERRED_UNAVAILABLE_GATE_ONLY` or `PREFERRED_UNKNOWN_GATE_ONLY`.

3. `fallback_policy=equivalent_or_gate`:
   - `GATE`;
   - reason `EQUIVALENCE_ATTESTATION_UNAVAILABLE`.
   - v1 cannot auto-certify planner equivalence.

4. `fallback_policy=normal` and risk is low/medium:
   - scan `fallback` in explicit order;
   - first `HEALTHY` fallback is selected;
   - if none is HEALTHY, first `CONSERVE` GLM/Codex fallback may be selected;
   - `UNKNOWN` and `UNAVAILABLE` fallbacks are skipped;
   - if a fallback is selected: `PROCEED`, `fallback_used=true`;
   - fallback reason is `PREFERRED_UNAVAILABLE` or `PREFERRED_UNKNOWN` according to preferred state;
   - if none is usable: `GATE`, reason `NO_USABLE_PLANNER`.

---

## 5. Reason-code ordering

When multiple informational reason codes apply, emit in this order:

1. preferred-state reason;
2. fallback-policy reason;
3. selected-fallback reason.

Do not emit duplicate reason codes.

The evaluator must not infer quota thresholds, provider equivalence, or provider availability from model prose.

---

## 6. Required deterministic tests

At minimum:

1. preferred Qwen available + low pressure -> Qwen PROCEED;
2. preferred GLM healthy -> GLM PROCEED;
3. preferred Codex healthy -> Codex PROCEED;
4. preferred GLM conserve + normal + healthy Codex fallback -> Codex PROCEED/fallback;
5. preferred GLM conserve + normal + no healthy fallback -> GLM PROCEED/conserve;
6. preferred Codex unavailable + medium + normal + healthy GLM -> GLM PROCEED/fallback;
7. preferred Codex unavailable + high -> GATE even if GLM healthy;
8. preferred GLM unavailable + equivalent_or_gate -> GATE;
9. preferred GLM unavailable + gate_only -> GATE;
10. preferred Qwen high resource pressure + low + normal + healthy GLM -> GLM fallback;
11. preferred planner UNKNOWN + normal + healthy fallback -> fallback on low/medium;
12. all planners unavailable/unknown -> GATE/NO_USABLE_PLANNER;
13. preferred unavailable + normal + first fallback unavailable + second healthy -> second selected;
14. preferred unavailable + normal + only conserve remote fallback -> conserve fallback selected on low/medium;
15. invalid input -> BLOCKED/ROUTING_INPUT_INVALID;
16. preferred planner duplicated in fallback -> schema invalid;
17. duplicate fallback entries -> schema invalid.

---

## 7. Pilot boundary

For D-0016-W Phase C, this evaluator may later provide planner-selection evidence, but the first real provider call still requires all separate gates already defined by `openclaw-execution-packet-consumer-v1.md`:

- HOME Phase B PASS;
- private/auth metadata PASS;
- exact consumer input;
- selected planner/backend explicitly recorded;
- explicit operator authorization for max one inference;
- retry=0;
- fallback=0 for the first real pilot.

Therefore, even if this evaluator returns a fallback selection, the first D-0016-W pilot must not silently use that fallback unless a later explicit pilot gate permits it.

---

## 8. Hard boundaries

This contract does not authorize:
- OpenClaw/provider/model calls;
- credential/auth mutation;
- n8n mutation;
- Telegram sends;
- Cursor dispatch;
- PM-34/L5/endurance/permanent scheduling;
- Windows-primary promotion.

---

**End of contract.**

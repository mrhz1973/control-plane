# Planner routing policy v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/planner-routing-policy-v1.md`  
**Version:** `planner-routing-policy-v1`  
**Date:** 2026-08-25  
**Status:** `DESIGN POLICY — DOCS ONLY`  
**Runtime authorized by this document:** **NO**

---

## 0. Purpose

This policy selects the planner that converts a Backlog Item into an Execution Packet.

The planner pool is:

- **Qwen 3.8 37B local**;
- **GLM 5.3**;
- **Codex OAuth**.

There is no mandatory fourth LLM dedicated only to routing.

GPT Web provides the **semantic preference** in the Backlog Item. OpenClaw provides provider/auth/availability/usage state where available. n8n applies deterministic policy to choose the effective planner or escalate.

---

## 1. Separation of concerns

```text
GPT Web
  → what planner is preferred for this kind of work

OpenClaw/provider state
  → what providers are technically available and what usage state is observable

n8n deterministic policy
  → whether the preferred planner can be used, whether fallback is permitted,
    or whether a Telegram gate is required
```

OpenClaw is the broker. It is not the strategic project planner.

Qwen is a planner when selected. It is not required merely to route to another planner.

---

## 2. Inputs

Minimum routing inputs:

```yaml
routing_input:
  task_id: D-NNNN-X
  risk_hint: low|medium|high
  complexity_hint: low|medium|high
  preferred: qwen|glm|codex
  fallback: []
  fallback_policy: normal|equivalent_or_gate|gate_only
  provider_state:
    qwen:
      available: true|false|unknown
      resource_pressure: low|medium|high|unknown
    glm:
      available: true|false|unknown
      quota_state: healthy|conserve|exhausted|unknown
    codex:
      available: true|false|unknown
      quota_state: healthy|conserve|exhausted|unknown
```

Exact numeric quota thresholds are configuration, not foundation constants. They must be calibrated from real evidence before runtime activation.

---

## 3. Semantic defaults

These are preferences, not hard model quality claims.

### Low complexity / low risk

Prefer the least costly adequate planner.

Typical order:

```text
Qwen → GLM → Codex
```

Qwen 3.8 37B is useful when the local machine can load it without unacceptable resource pressure.

### Medium complexity

Typical order:

```text
GLM → Codex → Qwen (only when policy considers it adequate)
```

### High complexity / difficult debugging / architecture

Typical order:

```text
Codex → GLM equivalent fallback → gate
```

Qwen can still be explicitly preferred by GPT Web for a task where local execution is desirable and quality is considered sufficient, but this is not the default high-complexity fallback.

---

## 4. Resource-aware Qwen rule

Qwen 3.8 37B is not a permanent router daemon by default.

Policy:

- load it when it is selected as the actual planner/advisor;
- do not keep it resident solely to route Codex vs GLM;
- while already loaded, it may also serve as local advisor/reviewer for the same job;
- unload it after the job when GPU/RAM should be returned to Cursor and other workloads.

If local resource pressure would materially impair Cursor execution, routing may prefer GLM/Codex even when Qwen is otherwise adequate.

---

## 5. Quota-preservation rule

The system should preserve scarce/high-value pools without blocking useful work.

Conceptual states:

```text
healthy   → normal use permitted
conserve  → prefer an adequate alternative where policy allows
exhausted → planner unavailable until reset/credits/other resolution
unknown   → do not assume healthy for an operation where quota matters
```

The initial runtime implementation must log the observed state and the reason for fallback.

No magic percentage threshold is canonized by v1. Thresholds require measured usage evidence and a later explicit config change.

---

## 6. Fallback policy

### `normal`

```text
preferred → ordered fallback 1 → ordered fallback 2 → manual/gate
```

Suitable only where risk and task quality allow degradation.

### `equivalent_or_gate`

Only a planner classified as equivalent for this task/risk may replace the preferred planner. Otherwise Telegram gate/manual mode.

### `gate_only`

If the preferred planner cannot be used, do not fallback automatically.

---

## 7. Hard gate precedence

Routing does not bypass project safety policy.

If the Backlog Item or provider transition introduces any of the following, deterministic policy wins:

- destructive Git/filesystem operation;
- production/runtime activation;
- credentials/OAuth/billing mutation;
- scope expansion;
- permanent schedule/loop;
- PM-34/L5 authorization change;
- unsupported planner equivalence for high-risk work.

Result: Telegram/Decision Packet or BLOCKED as applicable.

---

## 8. Planner-selection output

Before planner execution, routing produces a small auditable record:

```yaml
schema: planner-selection-v1
task_id: D-NNNN-X
preferred: codex
selected: glm
fallback_used: true
fallback_reason: codex_quota_conserve
risk: medium
complexity: medium
provider_state_ref: <id/path|null>
policy_result: PROCEED|GATE|BLOCKED
```

This record can be embedded in the Execution Packet or stored separately if n8n implementation benefits from it.

---

## 9. Examples

### Example A — simple task, local planner available

```text
Backlog: preferred Qwen, low/low
Qwen resource pressure: low
→ Qwen generates Execution Packet
```

### Example B — medium task, GLM preferred

```text
Backlog: preferred GLM, medium/medium
GLM healthy
→ GLM generates Execution Packet
```

### Example C — Codex preferred but quota in conserve state

```text
Backlog: preferred Codex, medium risk, equivalent_or_gate
Codex conserve
GLM healthy and allowed equivalent
→ GLM
→ record fallback reason
```

### Example D — high-risk Codex task, Codex unavailable

```text
Backlog: preferred Codex, high risk, gate_only/equivalent_or_gate
Codex unavailable
No verified equivalent fallback
→ Telegram gate
```

---

## 10. Cursor boundary

Planner routing ends when an Execution Packet is produced and passes policy.

Cursor remains the execution harness. Cursor may itself choose native agents/subagents/models inside the bounded implementation session, subject to the packet and the verified Cursor configuration.

GLM may be used inside Cursor via BYOK where verified. Codex OAuth as a native Cursor model is **not assumed**; advisor integration through OpenClaw/CLI/MCP remains a separate test track.

---

## 11. Hard boundaries

This policy does not activate OpenClaw provider routing, n8n changes, Cursor loops, Bugbot, PM-34, L5, schedules or any permanent runtime.

---

**End of policy.**

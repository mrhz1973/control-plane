# Backlog Item contract v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/backlog-item-v1.md`  
**Version:** `backlog-item-v1`  
**Date:** 2026-08-25  
**Status:** `DESIGN CONTRACT — DOCS ONLY`  
**Runtime authorized by this document:** **NO**

---

## 0. Purpose

The Backlog Item is the persistent strategic work contract produced by the GPT Web orchestrator and stored on GitHub.

It is **not** the Cursor implementation prompt. It defines what must be achieved, the boundaries of the work and the preferred planner. A selected planner (Codex / GLM / Qwen) converts it into an `Execution Packet`.

GitHub is the source of truth. A planner must not depend on the prior chat to reconstruct this object.

---

## 1. Minimum YAML contract

```yaml
schema: backlog-item-v1
id: D-NNNN-X
title: <short stable title>
created_at: <ISO-8601>
created_by: gpt-web
repository: owner/repo
branch_target: main

objective: <single desired outcome>

scope:
  allowed_areas: []
  forbidden_areas: []
  notes: []

risk_hint: low|medium|high
complexity_hint: low|medium|high

planner:
  preferred: qwen|glm|codex
  fallback: []
  fallback_policy: normal|equivalent_or_gate|gate_only

execution:
  target: cursor
  loop_allowed: true|false
  max_loop_rounds_hint: <integer|null>

acceptance: []
human_gate_required_if: []
context_refs: []

state: DRAFT|READY_FOR_PLANNING|PLANNED|EXECUTING|REVIEW|GATED|BLOCKED|DONE
```

---

## 2. Required semantics

### `objective`

One outcome only. If the item contains multiple independent outcomes, split the backlog before planning.

### `scope.allowed_areas`

Repository paths, components or bounded areas the future Execution Packet may touch.

### `scope.forbidden_areas`

Hard exclusions. A planner cannot silently remove them. Any required expansion becomes a gate.

### `risk_hint`

Strategic hint from GPT Web. It does not replace deterministic policy in n8n.

### `complexity_hint`

Used for planner preference and cost/quality routing. It does not authorize a specific provider by itself.

### `planner`

- `preferred` = semantic preference chosen by GPT Web.
- `fallback` = ordered alternatives.
- `fallback_policy` controls whether technical failover is allowed.

For high-risk work, default expectation is `equivalent_or_gate` or `gate_only`.

### `execution.loop_allowed`

Allows a **task-bounded** Cursor loop only. It never authorizes a permanent project loop.

### `acceptance`

Observable completion conditions. The planner may refine them but cannot weaken them without a new decision.

### `human_gate_required_if`

Explicit conditions that always return to Telegram/operator policy before execution.

### `context_refs`

Canonical GitHub paths/issues/commits required to plan correctly. Do not paste entire historical chats when a repository reference exists.

---

## 3. State transitions

```text
DRAFT
  ↓
READY_FOR_PLANNING
  ↓
PLANNED
  ↓
EXECUTING
  ↓
REVIEW
  ├─ PASS → DONE
  ├─ ISSUE → EXECUTING
  ├─ policy → GATED
  └─ blocker → BLOCKED
```

A state transition must never erase the prior Git history.

---

## 4. Example

```yaml
schema: backlog-item-v1
id: D-0094-W
title: Harden proxy health-check handling
created_at: 2026-08-25T12:00:00Z
created_by: gpt-web
repository: mrhz1973/Planet-Clone
branch_target: main

objective: >-
  Correct the proxy health-check behavior without changing authentication,
  Tailscale policy or deployment topology.

scope:
  allowed_areas:
    - proxy.py
    - tests/
  forbidden_areas:
    - deployment/
    - credentials
    - tailscale
  notes: []

risk_hint: medium
complexity_hint: medium

planner:
  preferred: glm
  fallback:
    - codex
    - qwen
  fallback_policy: equivalent_or_gate

execution:
  target: cursor
  loop_allowed: true
  max_loop_rounds_hint: 5

acceptance:
  - relevant tests pass
  - no unrelated diff
  - no auth/networking changes

human_gate_required_if:
  - scope expansion
  - production change
  - credentials
  - destructive git

context_refs:
  - docs/runtime/CURRENT_FRONTIER.md

state: READY_FOR_PLANNING
```

---

## 5. Hard boundaries

This contract does **not** authorize:

- PM-34 unlock;
- `n8n_ready=true`;
- L5 activation/runtime/endurance;
- permanent schedules or permanent loops;
- production workflow mutation;
- destructive Git operations;
- credential/billing changes.

These remain governed by the existing foundation and Decision Packets.

---

## 6. Relation to other contracts

```text
Backlog Item v1
      ↓ planner
Execution Packet v1
      ↓ n8n deterministic gate
Cursor bounded execution
      ↓ rollover / each required checkpoint
Execution Checkpoint v1
```

Planner/provider selection is governed by `planner-routing-policy-v1.md`.

---

**End of contract.**

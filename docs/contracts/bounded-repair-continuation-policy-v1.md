# Bounded repair continuation policy v1

**Repository:** `mrhz1973/control-plane`
**Document:** `docs/contracts/bounded-repair-continuation-policy-v1.md`
**Version:** `bounded-repair-continuation-policy-v1`
**Status:** `CANONICAL POLICY — DOCS ONLY`
**Runtime authorized by this document:** **NO**

## 0. Purpose and authority boundary

This contract defines when an observed failure may be repaired and resumed in
the same task/session. It is harness-independent: it may be consumed by
Cursor Agent/ACP, Codex, Qwen/OpenCode, Hermes, or a future executor only after
the relevant harness behavior is separately qualified.

It does not create a parallel retry system, authorize inference, authorize a
provider/model change, authorize production work, or turn a STOP into PASS.
`docs/contracts/execution-checkpoint-v1.md` remains the persistence contract;
this document supplies the classification and continuation policy.

## 1. STOP classifications

Every incomplete outcome is classified as exactly one of:

```text
STOP_TERMINAL
STOP_NEW_SCOPE_REQUIRED
STOP_REPAIRABLE_IN_SCOPE
```

- `STOP_TERMINAL` means the task is complete as STOP and cannot resume in the
  same task.
- `STOP_NEW_SCOPE_REQUIRED` means the desired repair or decision is outside
  the declared task; create a new task or open a new Human Gate.
- `STOP_REPAIRABLE_IN_SCOPE` means an observed failure may be repaired in the
  same task, but only after the Human Gate and all invariants below pass.

## 2. Eligibility for same-session continuation

`STOP_REPAIRABLE_IN_SCOPE` is eligible only when every predicate is true:

```text
SAME_TASK_REF=YES
SAME_OBJECTIVE=YES
SCOPE_EXPANSION=NO
AUTHORITY_EXPANSION=NO
HARD_WALL_CHANGE=NO
PRODUCTION_AUTHORITY_CHANGE=NO
REPAIR_DERIVED_FROM_OBSERVED_FAILURE=YES
```

The continuation must preserve task identity, objective, scope, authority,
hard walls, side-effect budget, provider/fallback policy, production authority,
and retry/send budget. A repairable classification grants no new authority.

## 3. State machine and Human Gate

```text
RUNNING
  |
  +--> PASS
  |
  +--> HUMAN_GATE
  |
  +--> REPAIRABLE_STOP
  |       |
  |       v
  |    HUMAN_DECISION
  |       |
  |       +--> RESUME_SAME_SESSION
  |       +--> TERMINATE
  |       +--> NEW_TASK
  |
  +--> DEFER
  |
  +--> TERMINAL_STOP
```

The operational recovery sequence is:

```text
OBSERVED FAILURE
→ classify STOP
→ STOP_REPAIRABLE_IN_SCOPE
→ HUMAN_GATE
→ RESUME SAME TASK/SESSION
→ bounded repair
→ validation
→ regressions where required
→ PASS or STOP
```

Same-session resume requires a Human Gate. The gate may choose resume,
termination, or a new task. A planner, executor, packet, checkpoint, model
answer, or retry result cannot make that decision implicitly.

## 4. Bounded does not mean short-duration

`BOUNDED != SHORT_DURATION`.

A session may continue for hours when task identity, objective, scope,
authority, hard walls, side effects, provider policy, retry/send budget,
checkpoint identity, and convergence remain bounded. There is no universal
`MAX_RUNTIME=20m` or `MAX_RUNTIME=30m` closure rule.

Continue only while the work produces new evidence, eliminates hypotheses,
converges, and remains in scope. Gate or stop when it does not converge, repeats
proof without new information, requests scope or authority expansion, requires
production authorization, exhausts side-effect budget, observes a changed
base, or requires an operator-only decision.

The Execution Checkpoint must preserve enough state for resume and must never
be treated as a PASS claim or authorization artifact.

## 5. Same-task hardening after PASS

The canonical closure sequence is:

```text
FUNCTIONAL PASS
→ optional bounded hardening
→ regression
→ final PASS
```

Optional hardening is allowed in the same task only when:

```text
NEW_FEATURE=NO
SCOPE_EXPANSION=NO
AUTHORITY_EXPANSION=NO
HARD_WALL_CHANGE=NO
SIDE_EFFECT_BUDGET_CHANGE=NO
```

It may only consolidate invariants already required by the task. A new
capability, product choice, provider policy, or materially different behavior
is a new backlog item.

## 6. Harness qualification boundary

The policy is neutral across harnesses, but evidence is not transferable by
assumption. Keep these classifications distinct:

```text
PROJECT_PROVEN
PARTIALLY_PROVEN
VENDOR_SUPPORTED_NOT_PROJECT_PROVEN
```

In particular, a project-proven checkpoint policy does not prove Cursor ACP,
Cursor question/steering behavior, or Codex same-session gate behavior. Each
surface must retain its own qualification status before being called
same-session proven.

## 7. No silent fallback or parallel retry

Fallback is permitted only when already declared and explicitly authorized by
the applicable policy/gate. Provider, model, access surface, quota pool, and
harness are distinct. A failed or unavailable surface yields a bounded gate,
defer, or STOP when no admitted equivalent exists.

This contract does not add a retry owner. Existing RT25 quota, review, retry,
checkpoint, provenance, authorization, and receipt machinery must be reused.

```text
RT25_REUSE_REQUIRED=YES
ARE_WE_REBUILDING_RT25_ALREADY_IMPLEMENTED=NO
SILENT_FALLBACK=NO
SAME_SESSION_RESUME_REQUIRES_HUMAN_GATE=YES
EXECUTION_CHECKPOINT_AUTHORIZES_NEW_SCOPE=NO
```

## 8. Canonical markers

```text
BOUNDED_REPAIR_CONTINUATION_POLICY=CANONICAL
STOP_REPAIRABLE_IN_SCOPE_DEFINED=YES
LONG_RUNNING_AGENT_BOUND_BY_SCOPE_NOT_DURATION=YES
```

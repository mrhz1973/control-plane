# Execution Packet contract v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/execution-packet-v1.md`  
**Version:** `execution-packet-v1`  
**Date:** 2026-08-25  
**Status:** `DESIGN CONTRACT — DOCS ONLY`  
**Runtime authorized by this document:** **NO**

---

## 0. Purpose

The Execution Packet is the planner-generated, persistent implementation contract consumed by Cursor.

The planner can be **Codex**, **GLM 5.3** or **Qwen 3.8 37B**. The packet must be sufficiently complete that Cursor does not need to reconstruct the task from an earlier planner chat.

The packet is generated from a GitHub Backlog Item and is evaluated by deterministic n8n policy before Cursor execution.

---

## 1. Minimum YAML contract

```yaml
schema: execution-packet-v1
packet_id: EP-D-NNNN-X-r1
packet_revision: 1
task_id: D-NNNN-X
source_backlog_ref: <GitHub path/issue>
source_backlog_commit: <sha|null>
generated_at: <ISO-8601>

planner:
  requested: qwen|glm|codex
  used: qwen|glm|codex
  fallback_used: true|false
  fallback_reason: <text|null>
  provider_state_ref: <path/id|null>

executor: cursor
repository: owner/repo
branch_target: main

goal: <single bounded implementation goal>

preflight: []
allowed_paths: []
forbidden_paths: []
steps: []
validation: []
acceptance: []

loop:
  enabled: true|false
  stop_when: []
  max_rounds: <integer>
  on_exhaustion: telegram_gate|blocked

risk_assessment:
  level: low|medium|high
  reasons: []
  scope_expansion: true|false
  destructive: true|false
  production_sensitive: true|false
  credentials_or_billing: true|false

gate_recommendation:
  required: true|false
  reason: <text|null>

context:
  read_set: []
  checkpoint_policy: required
  checkpoint_contract: docs/contracts/execution-checkpoint-v1.md

review:
  bugbot: required|optional|disabled
  max_review_rounds: <integer>
  autofix_cloud: false

final_report_contract: docs/foundation/CURSOR_PROMPT_TEMPLATE.md
status: READY_FOR_GATE|GATED|READY_FOR_EXECUTION|SUPERSEDED
```

---

## 2. Planner obligations

The planner must:

1. preserve the Backlog Item objective and hard exclusions;
2. convert the strategic objective into a bounded executable goal;
3. make allowed/forbidden paths explicit;
4. define deterministic acceptance and validation where possible;
5. define bounded loop behavior;
6. classify risk and call out scope expansion;
7. recommend a gate when uncertainty or policy requires one;
8. include the minimum read-set required for a new Cursor session;
9. never claim runtime authorization that is absent from GitHub policy.

The planner **cannot self-authorize** the packet.

---

## 3. Planner provenance and fallback

`planner.requested` records the semantic preference from the Backlog Item.

`planner.used` records the actual planner.

If they differ, the packet must record:

- `fallback_used: true`;
- why the preferred planner was not used;
- provider/usage evidence reference when available.

For high-risk tasks, silent degradation to a weaker/non-equivalent planner is prohibited.

---

## 4. Gate boundary

The packet is evaluated by n8n policy after generation.

At minimum, these conditions force a human gate unless an existing explicit authorization already covers them:

```text
risk == high
scope_expansion == true
destructive == true
production_sensitive == true
credentials_or_billing == true
policy violation
confidence/ambiguity below policy threshold
planner fallback not equivalent for the risk class
```

The planner recommendation is advisory; deterministic policy wins.

---

## 5. Cursor loop contract

A Cursor loop is authorized only for the scope of this packet and only if `loop.enabled=true` after policy gate.

The loop must stop on the first of:

- all `stop_when` conditions satisfied;
- `max_rounds` reached;
- scope drift;
- new high-risk condition;
- unresolved conflict;
- required human decision;
- context rollover requiring a checkpoint.

A task-bounded loop must never be interpreted as permanent project autonomy.

---

## 6. Review contract

Default target for code work:

```yaml
review:
  bugbot: required
  max_review_rounds: 3
  autofix_cloud: false
```

Bugbot findings may return the task to the same Cursor loop. If the configured review limit is exhausted, the task escalates rather than looping indefinitely.

---

## 7. Example

```yaml
schema: execution-packet-v1
packet_id: EP-D-0094-W-r1
packet_revision: 1
task_id: D-0094-W
source_backlog_ref: github:issue/94
source_backlog_commit: null
generated_at: 2026-08-25T12:05:00Z

planner:
  requested: glm
  used: glm
  fallback_used: false
  fallback_reason: null
  provider_state_ref: null

executor: cursor
repository: mrhz1973/Planet-Clone
branch_target: main

goal: >-
  Reproduce and correct the proxy health-check bug with the minimum code
  change and no networking/authentication changes.

preflight:
  - verify repository and main branch
  - fetch and fast-forward only
  - stop on dirty unexpected workspace
allowed_paths:
  - proxy.py
  - tests/
forbidden_paths:
  - deployment/
  - credentials
  - tailscale
steps:
  - reproduce the failing behavior
  - identify the minimum faulty branch
  - implement the minimum correction
  - run relevant tests
  - inspect final diff
validation:
  - pytest relevant proxy tests
  - git diff --check
acceptance:
  - relevant tests pass
  - no unrelated diff
  - no auth/networking changes

loop:
  enabled: true
  stop_when:
    - acceptance satisfied
    - review pass
  max_rounds: 5
  on_exhaustion: telegram_gate

risk_assessment:
  level: medium
  reasons:
    - code change in proxy path
  scope_expansion: false
  destructive: false
  production_sensitive: false
  credentials_or_billing: false

gate_recommendation:
  required: false
  reason: null

context:
  read_set:
    - docs/runtime/CURRENT_FRONTIER.md
  checkpoint_policy: required
  checkpoint_contract: docs/contracts/execution-checkpoint-v1.md

review:
  bugbot: required
  max_review_rounds: 3
  autofix_cloud: false

final_report_contract: docs/foundation/CURSOR_PROMPT_TEMPLATE.md
status: READY_FOR_GATE
```

---

## 8. Revision rule

Once Cursor execution has started, material changes to goal, scope, acceptance or risk must produce a new packet revision (`r2`, `r3`, ...), not silently mutate the meaning of the active packet.

Git history remains the audit trail.

---

## 9. Hard boundaries

This contract does not authorize PM-34, L5, endurance runtime, permanent schedules, permanent loops, production n8n mutations, credentials or destructive Git operations.

---

**End of contract.**

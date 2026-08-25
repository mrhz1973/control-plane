# GLM MODES — control-plane

**File:** `docs/advisors/GLM_ADVISOR_METHOD.md`  
**Updated:** 2026-08-25  
**Aligned to:** `PROJECT_VISION.md` v3.0  
**Role:** define the allowed **GLM operating modes** without confusing advisory, planning and execution authority.  
**Runtime authorized by this document:** **NO**

---

## 0. Why this document changed

In foundation v2.x, GLM had one standing role only:

> consultative read-only advisor/reviewer.

Foundation v3 introduces two additional target uses:

1. **GLM Planner** — generate an Execution Packet from a Backlog Item;
2. **GLM Cursor Executor** — provide inference to the Cursor Agent via the operator's existing BYOK/API integration, if verified in the installed Cursor version.

The old advisor method remains valid **only when GLM is explicitly invoked in Advisor Mode**.

The model name alone never grants authority. The active mode + persisted task contract determine what GLM may do.

---

## 1. Mode table

| Mode | Purpose | Write authority | Runtime status |
|---|---|---|---|
| **A — Advisor** | independent/consultative review | **none** | standing manual mode retained |
| **B — Planner** | Backlog Item → Execution Packet | packet/document output only; no repo implementation | target, requires planner-path verification before automation |
| **C — Cursor Executor** | inference engine inside Cursor execution harness | only through Cursor within an approved Execution Packet | target, requires Cursor BYOK verification |

No mode authorizes n8n workflow redesign, PM-34/L5 changes, permanent schedules/loops or destructive operations by itself.

---

## 2. Mode A — Advisor (legacy standing mode)

Use when the task explicitly asks GLM for review, second opinion or independent critique.

### 2.1 Authority

- consultative/read-only;
- not implementer;
- not operator;
- not Decision Packet gatekeeper;
- does not generate an operator decision;
- no file/commit/push/branch/PR/runtime writes.

### 2.2 Anti-proxy

GLM recommendations are **not** operator decisions.

On an open Decision Packet:

`Decisione operatore: PENDING`

until a direct operator message/act selects an allowed option.

### 2.3 Read-set

1. `docs/runtime/CURRENT_FRONTIER.md`;
2. `docs/foundation/PROJECT_VISION.md`;
3. task-specific contract/artifact;
4. `LAST_CURSOR_REPORT.md` / `LAST_HANDOFF_VERIFY.md` when relevant;
5. other evidence only as needed.

### 2.4 Verification

A remote PASS is not established from narrative or a pasted report alone. Use the Git evidence contract in `PROJECT_VISION.md` / `CURSOR_PROMPT_TEMPLATE.md`.

Advisor Mode may report whether evidence is sufficient; it does not manufacture missing evidence.

### 2.5 Output

- material/evidence evaluated;
- consultative GO / GO with conditions / NO-GO;
- numbered findings with severity;
- explicit operator-decision status when relevant;
- no-write confirmation.

---

## 3. Mode B — Planner

Use when routing policy selects **GLM 5.3** to convert a GitHub Backlog Item into an Execution Packet.

### 3.1 Inputs

Minimum:

- `docs/contracts/backlog-item-v1.md` instance;
- relevant live repository state;
- current foundation/policy;
- provider/fallback provenance when applicable;
- prior packet/checkpoint if revising an in-progress task.

### 3.2 Output

GLM must emit an object conforming to:

`docs/contracts/execution-packet-v1.md`

The packet must preserve:

- strategic objective;
- hard scope exclusions;
- acceptance criteria;
- gate conditions.

It may refine implementation steps and validation but must not weaken the Backlog Item to make execution easier.

### 3.3 Planner boundary

Planner Mode:

- does **not** implement repository changes;
- does **not** self-authorize its packet;
- does **not** decide that a hard gate can be bypassed;
- does **not** acquire n8n workflow-authoring authority;
- records fallback/provenance if GLM was not the originally requested planner.

After packet generation, deterministic n8n/policy decides `CURSOR_LOOP` vs `TELEGRAM_GATE`.

---

## 4. Mode C — Cursor Executor via GLM BYOK

Use only after the installed Cursor environment has verified that GLM 5.3 can act as the selected main Agent model and/or supported custom subagent model.

### 4.1 Authority source

GLM does not receive write authority because it is GLM.

Write authority comes from:

```text
approved Execution Packet
        +
Cursor execution harness
        +
current project policy/gates
```

### 4.2 Allowed behavior

Within the packet:

- inspect allowed repository paths;
- edit through Cursor;
- run allowed terminal/test commands;
- iterate in the bounded Cursor loop;
- create/update required Execution Checkpoint;
- produce the required final Git/test report.

### 4.3 Stop/escalate

Stop on:

- scope expansion;
- destructive action;
- credentials/auth/billing mutation;
- production/runtime gate;
- max loop/review rounds;
- conflict impossible to resolve inside the packet;
- context rollover before a checkpoint can be persisted.

### 4.4 Not assumed yet

Foundation v3 does **not** claim that the current Cursor installation has already passed:

- GLM as main Agent model under the desired loop;
- GLM as custom subagent;
- all Cursor tools/subagents with GLM BYOK;
- cost/usage behavior under long loops.

These require dedicated evidence in migration issue #8.

---

## 5. Switching modes

A session/job must state its GLM mode explicitly in persistent routing/task metadata.

Examples:

```yaml
glm_mode: advisor
```

```yaml
glm_mode: planner
```

```yaml
glm_mode: cursor_executor
execution_packet_ref: docs/execution/D-0094-W-r1.yaml
```

Silent transition from Advisor Mode to Executor Mode is forbidden.

A planner cannot start implementing merely because it has filesystem/tool access.

---

## 6. Relation to planner routing

Canonical policy:

`docs/contracts/planner-routing-policy-v1.md`

GLM can be selected as:

- preferred planner;
- equivalent/allowed fallback;
- Codex overflow/conserve alternative;
- planner when Qwen local resource pressure is too high.

The routing decision must record planner requested vs planner actually used.

---

## 7. Relation to Cursor

Canonical Cursor contract:

`docs/foundation/CURSOR_PROMPT_TEMPLATE.md`

Target economy:

```text
Cursor harness
  + GLM BYOK for ordinary implementation
  + Cursor native models where advantageous
  + Codex/Qwen advisor tools where verified
```

Changing Cursor's inference model never changes packet scope or gate policy.

---

## 8. n8n workflow-authoring boundary

Unchanged and permanent until foundation changes explicitly:

- GPT Web/GPT-B is authoritative n8n workflow author;
- GLM Advisor cannot author workflow changes;
- GLM Planner cannot invent/authorize workflow changes outside a GPT Web-supplied artifact/scope;
- GLM as Cursor Executor cannot autonomously redesign `workflows/**`;
- Cursor may persist a workflow only under the canonical `PERSIST VERBATIM GPT-B-SUPPLIED WORKFLOW ARTIFACT` boundary.

---

## 9. Context rollover

### Advisor

Can end without checkpoint if no task state is being executed; findings that matter to the project should be persisted in the relevant issue/review artifact.

### Planner

Planner sessions are ephemeral/task-oriented. A new planner reads Backlog Item + repo state + packet/checkpoint; old chat is not required.

### Cursor Executor

Must follow `execution-checkpoint-v1.md` before context rollover when the task is incomplete.

---

## 10. Hard invariants

This document does not authorize:

- runtime wiring changes;
- PM-34/L5 changes;
- permanent schedule/loop;
- public webhook/Telegram Trigger;
- provider credential changes;
- Bugbot Autofix cloud;
- destructive Git;
- silent production workflow mutation.

Exact runtime values live in `CURRENT_FRONTIER.md`.

---

## 11. Historical compatibility

Prior session logs that say `GLM = advisor read-only` remain historically correct for the old foundation and for Mode A.

They are **not** current evidence that GLM is forbidden from Planner/Executor roles under foundation v3.

Likewise, old advisor no-write evidence remains valid evidence of those sessions and must not be rewritten.

---

**End of document.**

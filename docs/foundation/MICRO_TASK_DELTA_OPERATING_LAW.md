# MICRO_TASK_DELTA — Operating Law

**Repository:** `mrhz1973/control-plane`
**Documento:** `docs/foundation/MICRO_TASK_DELTA_OPERATING_LAW.md`
**Versione:** 1.0 — 2026-09-06
**Stato:** CANONICAL
**Ruolo:** legge operativa autoritativa per lo sviluppo Control Plane (GPT Web / Cursor / Codex / automated dispatch).
**Issue:** `#42` — `V4_TOKEN_EFFICIENCY_MICRO_TASK_POLICY_PERSISTENCE_V1`
**Runtime activation:** **NO** (policy/docs only)

Consumatori obbligati a ereditare questa legge (non a riscriverla):

- `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`
- `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`
- `docs/foundation/PROMPT_SEQUENCING_GATE.md`
- `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`

---

## 0. Default development unit

```text
MICRO_TASK_DELTA
  → minimal read scope
  → focused edit
  → focused tests
  → max 2 corrective loops
  → selective commit / push / remote verify
  → next micro-task
```

**DEFAULT TASK UNIT = `MICRO_TASK_DELTA`.**

- one technically coherent delta per task;
- smallest sufficient read/file scope;
- the prompt carries the **task delta**, not repeated stable method text already canonical in the repository.

Normal user-facing prompts MUST identify themselves as `MICRO_TASK_DELTA`.
Checkpoint prompts MAY identify themselves as `CHECKPOINT_DELTA`.

Mandatory user-facing wrapper order is unchanged and remains authoritative in
`CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`:

```text
MODELLO CURSOR: <exact model>
BUGBOT: <NO | SÌ>
MODALITÀ CURSOR: <AGENT | PLAN>
```

then the single copyable TASK DELTA block.

---

## 1. Bounded correction law

Default corrective bound for a `MICRO_TASK_DELTA`:

```text
max_corrective_loops = 2
```

- After the bound is exhausted: **STOP** with the exact blocker (no silent expansion).
- A larger bound requires **explicit task-level justification** or **human authorization** in the task / Execution Packet.
- This bound covers implementation↔test corrective iterations inside the same micro-task.
- It does **not** authorize exploratory unbounded fix loops, scope expansion, or unrelated refactors.

---

## 2. Test law

For a `MICRO_TASK_DELTA`:

- run only focused, directly relevant tests plus mandatory safety checks
  (e.g. `node --check` on changed `.mjs`, `git diff --check` when applicable);
- **do not** run the broad regression suite after every micro-task.

---

## 3. Checkpoint law

Broad regression and BugBot / cross-component review occur **only** at an
explicit `CHECKPOINT_DELTA` (or equivalent explicit checkpoint task).

- Reuse unchanged prior PASS evidence where still valid.
- Run a checkpoint before live/runtime promotion when required.
- Checkpoints may authorize broader suites; micro-tasks must not silently escalate into them.

---

## 4. Context minimization

- Read only the canonical files needed for the current delta.
- Do **not** repeatedly re-read full `CURRENT_FRONTIER.md` / long historical reports
  unless the current delta materially requires them.
- Prefer the latest task / checkpoint evidence (`LAST_CURSOR_REPORT`, issue body,
  compressed handoff) as the default context.

---

## 5. No time-filling

- No artificial long-running work.
- No benchmark / re-read / re-test padding to consume tokens or wall-clock.
- Work-conserving means advance to the **next real micro-task** after closure.

---

## 6. Megaprompt / campaign exception

Long campaign / single-session megaprompts are **NOT** the default.

Allowed **only** when:

1. the work is genuinely inseparable into ordered Git-backed micro-tasks; **AND**
2. an explicit **human authorization** is present in the task / operator decision.

Absence of that authorization ⇒ split into ordered `MICRO_TASK_DELTA` items.

Stable marker for tests / dispatch lint:

```text
HUMAN_AUTHORIZED_CAMPAIGN_EXCEPTION
```

---

## 7. Model economics

- Reserve expensive / high-reasoning models for architecture, ambiguity,
  hard debugging, and difficult review.
- Prefer adequate cheaper / local models for bounded deterministic work.
- Capability / quality gates always win; **no silent quality downgrade**.

Concrete routing presentation remains in `CURSOR_PROMPT_USER_HANDOFF_STANDARD.md`.

---

## 8. Git law

Every `MICRO_TASK_DELTA` ends with:

1. selective stage (preserve all pre-existing untracked files);
2. focused proof;
3. commit;
4. push;
5. remote verify.

The next task starts from the new canonical HEAD.
No `clean` / `stash` / `reset --hard` / rebase / force-push unless explicitly authorized.

---

## 9. Automation parity

n8n / dispatcher automation must eventually claim **one** bounded delta,
execute and persist it, then claim the next.

Automation must **not** reintroduce giant-session context / token churn.

This document persists `AUTOMATION_PARITY` as a method law. Live automation
mutation is **not** performed by the policy-persistence issue alone.

---

## 10. Non-goals

- Not a new runtime architecture.
- Not a large policy engine.
- Not production / n8n / D-0025 activation.
- Not a change to the mandatory wrapper order (`MODELLO CURSOR` → `BUGBOT` → `MODALITÀ CURSOR` → TASK DELTA).

# STANDING OPERATOR AUTHORIZATION

**Status:** CANONICAL
**Effective:** 2026-08-28
**Updated:** 2026-09-04

The operator grants standing authorization for bounded project execution within the current control-plane architecture and active task scope.

## Rule

Do not pause for repeated approval or re-authorization when the next action is already technically determined by `CURRENT_FRONTIER`, ACTIVE WORK, repository contracts, or GPT-Web-authored artifacts. Continue through AUTO-VIA.

This explicitly includes **Cursor prompt generation and execution handoff**: creating the next bounded Cursor prompt is never itself an authorization gate. Do not ask the operator to authorize each prompt, each implementation pass, or each mechanically determined continuation.

## Local service lifecycle ownership — Control Plane, not GPT Web

The operator assigns lifecycle ownership for project-local runtime services to the active Control Plane/orchestrator.

This includes, when they are in scope for the active task, services such as:

- Qwen/router/backend processes;
- OpenCode-local support processes;
- Control Plane local endpoints;
- Blender and Blender MCP bridge processes;
- other bounded localhost project services introduced by an active execution path.

Rules:

- Control Plane decides which required local services must be started, reused, restarted, or stopped from the active task/resource state.
- GPT Web must **not** proactively start, stop, restart, or keep alive local services merely to prepare, tidy, or optimize the workstation.
- GPT Web may inspect/report service state and may provide manual commands only when the operator explicitly requests manual troubleshooting or when an unavoidable manual/external gate prevents the orchestrator from acting itself.
- A service being documented or installed does not make it always-on. Start it only when the active task needs it; stop/release it when the owning workflow determines that it is no longer needed.
- Do not infer that a previously observed PID/process is still current; rediscover live identity before consequential process action.
- This lifecycle rule does not expand Control Plane scope. A service such as Blender remains out of Control Plane workload scope unless the active task/architecture explicitly brings that workload into scope; however, when it is in scope, lifecycle ownership follows this rule.

This operator directive supersedes ad-hoc GPT-Web cleanup/startup guidance for project-local services.

## No unnecessary tests / proof loops

The operator does not want exploratory test cycles, repeated smoke tests, repeated proof-of-concept passes, or re-validation loops that exist only to gain confidence before doing the already-determined implementation.

Default behavior:

- implement the bounded next step directly;
- bundle only the **minimum deterministic validation required to know whether that implementation succeeded** into the same pass;
- do not create a separate test/probe/smoke pass unless a canonical contract makes that test the actual required next step or the implementation cannot be safely completed without it;
- no repeated retries/probes merely to gather more evidence;
- do not stop between implementation and its minimal validation for operator approval.

## One-pass bounded execution — DEFAULT

For Cursor and equivalent bounded implementation passes, the default is one pass, not an implicit corrective loop:

```text
implement
→ target test once
→ required regressions once
→ review once only when explicitly requested by the pass
→ evidence
→ commit/push
```

At the first blocker, failed required test, failed regression, actionable/blocking review finding, unavailable required reviewer, or other acceptance failure:

```text
STOP — <precise cause>
```

Do **not** automatically continue in the same pass with:

```text
fix → test → fix → test
```

A diagnosed failure becomes a new small corrective pass after the canonical evidence/`agg` sequencing cycle.

Exception: a current task may explicitly authorize a bounded corrective loop. That authorization must be present in the task/Execution Packet itself and must define scope, stop conditions and a finite bound. Standing authorization alone never implies such a loop.

This one-pass default complements `docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md` and `docs/foundation/CURSOR_PROMPT_TEMPLATE.md` and overrides older generic loop examples when the active task does not explicitly authorize a corrective loop.

## WAIT only for real blockers

Use `WAIT` only when:

- a manual action cannot be completed by the agent;
- there is a non-equivalent ambiguity with no canonical repository resolution;
- a platform, policy, or tool boundary prevents execution;
- proceeding would require a new goal or material scope/architecture expansion not defined by the repository.

Standing authorization does not permit silent scope expansion or redesign.

## Precedence

This directive supplements the README AI-BOOT AUTO-VIA rules and should be consulted whenever a step would otherwise stop only to request operator consent or to insert an avoidable test/proof cycle.

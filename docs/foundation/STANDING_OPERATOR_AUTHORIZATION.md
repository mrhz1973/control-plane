# STANDING OPERATOR AUTHORIZATION

**Status:** CANONICAL
**Effective:** 2026-08-28
**Updated:** 2026-08-31

The operator grants standing authorization for bounded project execution within the current control-plane architecture and active task scope.

## Rule

Do not pause for repeated approval or re-authorization when the next action is already technically determined by `CURRENT_FRONTIER`, ACTIVE WORK, repository contracts, or GPT-Web-authored artifacts. Continue through AUTO-VIA.

This explicitly includes **Cursor prompt generation and execution handoff**: creating the next bounded Cursor prompt is never itself an authorization gate. Do not ask the operator to authorize each prompt, each implementation pass, or each mechanically determined continuation.

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

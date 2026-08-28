# STANDING OPERATOR AUTHORIZATION

**Status:** CANONICAL
**Effective:** 2026-08-28

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

## WAIT only for real blockers

Use `WAIT` only when:

- a manual action cannot be completed by the agent;
- there is a non-equivalent ambiguity with no canonical repository resolution;
- a platform, policy, or tool boundary prevents execution;
- proceeding would require a new goal or material scope/architecture expansion not defined by the repository.

Standing authorization does not permit silent scope expansion or redesign.

## Precedence

This directive supplements the README AI-BOOT AUTO-VIA rules and should be consulted whenever a step would otherwise stop only to request operator consent or to insert an avoidable test/proof cycle.

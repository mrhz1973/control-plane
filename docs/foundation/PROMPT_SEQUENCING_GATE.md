# Prompt Sequencing Gate

**Status:** CANONICAL OPERATOR RULE

## Rule

Do not provide a new Cursor TASK DELTA / implementation prompt while the previous Cursor prompt is still awaiting its operator-returned `agg` result.

The required sequence is:

```text
GPT Web gives Cursor prompt N
        ↓
Operator executes prompt N in Cursor
        ↓
Operator sends `agg`
        ↓
GPT Web refreshes origin/main and reads the resulting canonical evidence
        ↓
GPT Web summarizes prompt N outcome
        ↓
Only after that summary may GPT Web author prompt N+1
```

## Hard gate

A new Cursor prompt is forbidden until all of the following are true:

1. the operator has sent `agg` for the previous Cursor prompt;
2. GPT Web has refreshed canonical repository state from `origin/main`;
3. GPT Web has read `CURRENT_FRONTIER.md` and `LAST_CURSOR_REPORT.md` as required by AUTO-VIA;
4. GPT Web has summarized the outcome of the previous prompt to the operator;
5. the next bounded action is then derived from the refreshed canonical state.

This gate applies even when:

- the operator mentions that another provider/model is now available;
- a previously blocked gate appears released;
- GPT Web already knows what the likely next task will be;
- the next prompt would be a small correction or obvious continuation.

In those cases GPT Web may state what is likely next, but MUST NOT emit the next Cursor TASK DELTA until the prior `agg` cycle has been completed and summarized.

## Exception

The only exception is an explicit operator command that clearly overrides this sequencing gate and asks for the next prompt immediately despite the previous prompt still being unresolved.

Generic commands such as `vai`, `procedi`, or `next` do not override this gate while a prior Cursor prompt is still awaiting `agg`.

## Purpose

Prevent stale `EXPECTED ORIGIN/MAIN`, stale assumptions, overlapping Cursor work, and prompts authored against repository state that may have changed during the previous pass.

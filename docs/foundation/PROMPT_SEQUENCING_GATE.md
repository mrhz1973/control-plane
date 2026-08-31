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
3. GPT Web has read `CURRENT_FRONTIER.md` plus only the bounded evidence required by the just-finished pass;
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

## Operator handshake after Cursor (`agg` only)

After every Cursor pass completes, the operator's **only** required action is:

```text
agg
```

The operator must **not** manually copy Cursor's chat summary into the orchestrator thread. GPT Web reads canonical evidence from GitHub (`origin/main`) and derives the next pass from persisted state.

## Cursor persistence obligation by outcome

### PASS

Cursor persists normal completion evidence:

- production/test/docs changes for the completed bounded block;
- architecture/verification report when applicable;
- `docs/runtime/LAST_CURSOR_REPORT.md` as the compact rolling evidence of the latest **completed PASS**;
- `docs/runtime/CURRENT_FRONTIER.md` when LIVE STATE/NEXT changes;
- normal commit + push.

`LAST_CURSOR_REPORT.md` remains compact and rolling. It is not an event log and must not accumulate intermediate STOP history.

### STOP

A STOP must be observable from GitHub without contaminating PASS rolling evidence or committing incomplete code.

Cursor MUST:

1. stop at the first blocker/failure/actionable finding; no same-pass fix loop;
2. preserve incomplete production/test changes dirty and uncommitted;
3. leave `CURRENT_FRONTIER.md` unchanged;
4. leave `LAST_CURSOR_REPORT.md` unchanged;
5. create exactly one small immutable machine-readable artifact under:

```text
reports/runtime/cursor-stops/<UTC_TIMESTAMP>__<TASK_REF>.stop.json
```

6. stage/commit/push **only that new `.stop.json` artifact**;
7. verify the dirty production/test tree remains uncommitted after the evidence-only push.

Canonical STOP artifact minimum shape:

```json
{
  "schema_version": "cursor-stop-evidence-v1",
  "task_ref": "<exact task ref>",
  "result_cursor": "STOP",
  "starting_head": "<sha>",
  "stop_evidence_commit": "<sha or PENDING_SELF_REFERENCE>",
  "failure_stage": "<PRECHECK|TARGET_TEST|REGRESSION|BUGBOT|RUNTIME_APPLY|OTHER>",
  "finding": "<precise bounded finding>",
  "target_result": "<result or NOT_RUN>",
  "regressions_status": "<result or NOT_RUN>",
  "bugbot_status": "<result or NOT_RUN>",
  "runtime_apply_status": "<result or NOT_RUN>",
  "execution_route_contained": true,
  "http_execution_endpoint_requests": 0,
  "opencode_calls": 0,
  "qwen_generations": 0,
  "provider_calls": 0,
  "dirty_paths_summary": ["<bounded paths/patterns>"],
  "next_owner": "GPT_WEB"
}
```

No secrets, raw model output, large logs or diffs belong in STOP artifacts.

## `agg` evidence routing — wiki-LLM lean

`agg` does not scan STOP history or list the whole directory.

After refreshing `origin/main` and `CURRENT_FRONTIER.md`:

1. inspect only the Git delta/commit range since the previously observed HEAD;
2. if that delta contains a newly added `reports/runtime/cursor-stops/*.stop.json` for the expected task, read **only that one artifact** and treat the pass as STOP;
3. otherwise follow the PASS path and read `LAST_CURSOR_REPORT.md` once only when needed;
4. read additional pointed evidence only if necessary;
5. summarize the just-finished result, then derive the next bounded action.

If neither matching PASS evidence nor a matching STOP artifact is persisted, classify `EVIDENCE_NOT_PERSISTED`; do not infer non-execution.

`CURRENT_FRONTIER.md` remains the authority for LIVE STATE. A STOP artifact is immutable evidence only and never replaces the frontier.

## Automation equivalence

Human mode:

```text
Cursor → GitHub evidence → operator `agg` → orchestrator refresh
```

Automation mode:

```text
Cursor → GitHub push event → orchestrator refresh
```

The semantics are identical. A push containing a new `cursor-stops/*.stop.json` is a machine-readable `CURSOR_STOP` event; a completed PASS advances normal PASS evidence/frontier. No separate automation protocol is allowed.

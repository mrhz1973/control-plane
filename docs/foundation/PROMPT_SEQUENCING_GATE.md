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

Prevent stale `EXPECTED ORIGIN/MAIN`, stale assumptions, overlapping Cursor work, lost STOP evidence and prompts authored against repository state that may have changed during the previous pass.

## Dispatch/result anchor — HARD INVARIANT

Every emitted Cursor TASK DELTA establishes an immutable result-detection anchor for that pass:

```text
dispatch_task_ref  = exact BLOCK-ID / task_ref delivered to Cursor
dispatch_base_head = exact expected_base_head / origin-main SHA delivered to Cursor
```

This anchor remains active until the matching PASS or STOP has been **ingested and summarized by the orchestrator**.

Rules:

1. `dispatch_base_head` is the base for result detection; it is **not** "the last HEAD GPT Web happened to observe".
2. Later `origin/main` observations do not replace the active dispatch anchor.
3. GPT-Web-authored docs/foundation commits made while a Cursor task is outstanding do not replace or advance the active dispatch anchor.
4. `agg` MUST inspect the bounded range:

```text
<dispatch_base_head>..origin/main
```

for the expected `dispatch_task_ref`.
5. The anchor is cleared only after the matching outcome has been ingested and summarized.
6. A newly emitted/reissued Cursor prompt may establish a new anchor only after the previous sequencing gate is resolved, unless the operator explicitly overrides that gate.

### Result-ingestion barrier before GPT-Web writes

While a Cursor dispatch anchor is active, **before GPT Web performs any GitHub write** it MUST:

1. refresh `origin/main`;
2. inspect `<dispatch_base_head>..origin/main` for a matching PASS/STOP outcome;
3. if matching outcome evidence exists, ingest it before making the GPT-Web write;
4. never let its own subsequent commit hide or move past an un-ingested Cursor result.

This barrier prevents the exact failure mode where Cursor pushes a STOP, GPT Web later pushes a docs commit on top of it, and a subsequent `agg` incorrectly compares only from the newer GPT-Web commit.

### Recovery if the in-session dispatch anchor is unavailable

Normal operation uses the explicit dispatch anchor. After context/session loss, recover narrowly:

1. derive the expected `task_ref` from `CURRENT_FRONTIER` / ACTIVE WORK / current Execution Packet;
2. when an Execution Packet exists, use its `expected_base_head` as `dispatch_base_head`;
3. otherwise search recent commits for the canonical STOP commit subject:

```text
cursor-stop: <TASK_REF>
```

and inspect only the matching commit/artifact;
4. if no STOP commit is found, use matching `LAST_CURSOR_REPORT.md` / frontier PASS evidence as the PASS path;
5. only as a bounded fallback, inspect the commit range since the most recent canonical completed PASS evidence head; do not scan the whole STOP directory/history.

If no matching bounded evidence can be recovered, classify `EVIDENCE_NOT_PERSISTED`; do not infer non-execution.

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
7. use this exact first-line commit subject so recovery can locate the event without a directory scan:

```text
cursor-stop: <TASK_REF>
```

8. verify the dirty production/test tree remains uncommitted after the evidence-only push.

Canonical STOP artifact minimum shape:

```json
{
  "schema_version": "cursor-stop-evidence-v1",
  "task_ref": "<exact task ref>",
  "result_cursor": "STOP",
  "starting_head": "<dispatch_base_head>",
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

1. use the outstanding `dispatch_task_ref` + `dispatch_base_head` for the just-finished pass;
2. inspect only `<dispatch_base_head>..origin/main` — **not** `last_observed_head..origin/main`;
3. ignore unrelated/orchestrator-authored commits in that bounded range for outcome classification, but do not move the dispatch anchor because of them;
4. if the range contains a newly added `reports/runtime/cursor-stops/*.stop.json` matching `dispatch_task_ref`, read **only that one artifact** and treat the pass as STOP;
5. otherwise follow the PASS path and read `LAST_CURSOR_REPORT.md` once only when needed, requiring matching `task_ref`;
6. read additional pointed evidence only if necessary;
7. summarize the just-finished result;
8. clear the dispatch anchor only now, then derive the next bounded action.

If neither matching PASS evidence nor a matching STOP artifact is persisted in the dispatch range/recovery path, classify `EVIDENCE_NOT_PERSISTED`; do not infer non-execution.

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

The semantics are identical. The automation owns the same `dispatch_task_ref` / `dispatch_base_head` from its Execution Packet. A push containing a new `cursor-stops/*.stop.json` is a machine-readable `CURSOR_STOP` event; a completed PASS advances normal PASS evidence/frontier. No separate automation protocol is allowed.

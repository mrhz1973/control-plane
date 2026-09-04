# V4 LOCAL_DEV_EXECUTOR — hard timeout process control and preflight diagnostics

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_HARD_TIMEOUT_PROCESS_CONTROL_AND_PREFLIGHT_DIAGNOSTICS_V1`
**Classification:** `HARD_TIMEOUT_PROCESS_CONTROL_PASS`
**Dispatch base head:** `438f388a0132bfeda72633482c0b2a79d653ab2b`
**Date:** 2026-09-04

## RETRY4 evidence

```text
STOP:BOUNDS_TIMEBOX_EXPIRED
timebox_used_s=302
router_was_running=true
launch_performed=false
turns_used=0
changed_files=[]
tests=[]
guard upstream_generation_requests=0
```

The prior timeout only rejected a `Promise.race`; it did not prove the
OpenCode child had terminated.

## Implemented process control

`defaultSpawn` now returns an explicit task-owned handle:

```text
{ pid, promise, getOutput, terminate }
```

On hard timeout the runner:

1. calls `terminate()` on that exact child handle;
2. requests ordinary child termination and waits up to 1500ms;
3. on Windows only, if still alive, invokes `taskkill /PID <exact-pid> /T /F`;
4. waits another bounded 1500ms;
5. returns `STOP:BOUNDS_TIMEBOX_EXPIRED` only after this handling.

No process-name lookup or stale PID is used. If a handle cannot confirm
termination, the canonical timeout classification is retained with the
secondary reason `TASK_CHILD_TERMINATION_UNCONFIRMED`.

Timeout evidence is bounded and sanitized:

```text
child_pid
termination_requested
termination_confirmed
termination_method
exit_code_after_termination
stdout_excerpt
stderr_excerpt
```

## Pre-generation accounting

Timeout STOP results now include guard accounting without bodies or headers:

```text
generation_requests_seen
upstream_generation_requests
blocked_generation_requests
informational_requests_forwarded
rejected_requests
secret_bearing_requests_rejected
```

`turns_used` remains exactly `upstream_generation_requests`, making the
Retry4 zero-generation case explicit.

## Bounded OpenCode preflight diagnosis

Performed without Qwen generation, model execution, router lifecycle, or
target-task edits:

- installed OpenCode `--version`: **1.18.25**
- installed `run --help`: resolved and returned successfully
- exact generated permission/provider config: accepted by installed V1
  `debug config`; no model selected or executed
- exact no-shell executable: resolved package binary
  `%APPDATA%\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe`
- exact invocation remains structural: `run --dir <target> -m
  qwen_local/qwen38-opus-q3-cline-64k --format json --auto <one literal
  task message>`
- bounded diagnostics completed within 20 seconds

These checks prove CLI availability, config-schema acceptance, and argument
construction, but do not reproduce the model/provider stall without making
the prohibited real Qwen call. Evidence is insufficient to name a concrete
provider/model/permission blocker.

```text
PRE_GENERATION_DIAGNOSTICS = OPENCODE_UNKNOWN_PRE_GENERATION_STALL
```

The next pass remains a bounded live-proof retry with diagnostics rather than
a speculative code change.

## Tests

- wiring/process-control suite: **33/33 PASS**
- executor regression: **20/20 PASS**
- workstation session bridge regression: **14/14 PASS**
- harmless local child termination: exact PID, bounded termination confirmed
- no Qwen generation, no OpenCode model execution, no service start/stop

Production domain remains untouched.

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF_RETRY5_DIAGNOSTIC`

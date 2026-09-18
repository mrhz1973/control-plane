# V4 LOCAL_DEV Dispatcher Crash Resilience V1

**Issue:** #93  
**Classification:** LIVE PASS / CANONICALIZATION PENDING LOCAL REPOINT  
**Date:** 2026-09-18

## Incident

During TMAR R001 `D-9501-R`, the canonical workstation dispatcher disappeared while the durable receipt remained `EXECUTING`. The dashboard listener on `127.0.0.1:18793` vanished, OpenCode was no longer present, and Qwen remained loaded.

The TMAR worktree was clean, TMAR HEAD remained unchanged, no R001 temporary venv existed, and no R001 commit was produced. The original receipt remains intentionally blocking and was not deleted or rewritten.

## Proven pre-state

The canonical Scheduled Task was:

- `ControlPlane-V4-LocalDevDispatcher`
- `MultipleInstances=IgnoreNew`
- `ExecutionTimeLimit=PT0S`
- `RestartCount=0`
- `RestartInterval` unset
- `StartWhenAvailable=true`

No TaskScheduler/Operational event or Application Error entry proved the original Node termination cause. WER `LiveKernelEvent 141` records observed near the investigation time referenced older dump files and were not accepted as causal evidence.

## Failed Task Scheduler restart experiment

A first remediation added durable wrapper logging outside the Git worktree and configured Task Scheduler restart settings:

- `RestartCount=3`
- `RestartInterval=PT1M`

Controlled Node-only termination was executed only while dispatcher `status.active=false`.

Result:

- exact dispatcher Node PID was terminated;
- wrapper logged `NODE_EXIT code=-1`;
- task returned to `Ready`;
- listener did not return within 100 seconds;
- receipt ledger SHA-256 remained unchanged.

Therefore Task Scheduler restart-on-failure was not accepted as sufficient recovery for this demand-start service topology.

## Qualified supervisor recovery

The single canonical Scheduled Task was retained. Its PowerShell wrapper was converted into a supervisor loop that owns one Node child at a time and restarts that child after a 10-second backoff if the child exits.

Live proof:

- task state before controlled crash: `Running`;
- wrapper PID: `58588`;
- dispatcher Node PID before: `25416`;
- controlled termination of only Node PID `25416`;
- wrapper stayed alive;
- log recorded `NODE_EXIT attempt=1 code=-1`;
- log recorded `RESTART_WAIT seconds=10`;
- log recorded `SUPERVISOR_START attempt=2 wrapper_pid=58588`;
- dispatcher Node PID after: `51192`;
- listener returned on `127.0.0.1:18793`;
- final dispatcher state: `IDLE`, `active=false`;
- receipt SHA-256 before and after:
  `E813831A5183DDE57869007EADE37D8909A77F96F7068542701333C4448EFDC7`;
- receipt mutation: **NONE**.

**SUPERVISOR_RECOVERY=PASS**  
**SINGLE_CANONICAL_TASK=PASS**  
**LOOPBACK_BIND_PRESERVED=PASS**  
**RECEIPTS_IMMUTABLE_DURING_RECOVERY_TEST=PASS**  
**SECOND_DAEMON_CREATED=NO**  
**PUBLIC_SURFACE_CHANGED=NO**  
**WF90_CHANGED=NO**  
**ROUTING_CHANGED=NO**

## Canonical implementation

Repository supervisor:

`tools/run-local-dev-dispatcher-supervisor-v1.ps1`

Runtime log:

`%LOCALAPPDATA%\ControlPlane\logs\local-dev-dispatcher.log`

The Scheduled Task must invoke the repository supervisor script directly. The AppData copy used during live diagnosis is transitional and must not remain the canonical action target after local fast-forward.

## Remaining gate

Before closing #93, fast-forward the workstation repository to the commit containing the canonical supervisor and repoint the existing Scheduled Task action to:

`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "<repo>\tools\run-local-dev-dispatcher-supervisor-v1.ps1"`

Then verify the same single listener and dashboard health. No second service/task is permitted.

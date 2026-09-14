# V4 LOCAL_DEV scheduler deduplication — Phase 3

**TASK_REF:** `V4_LOCAL_DEV_SCHEDULER_DEDUP_PHASE_3_V1`
**Classification:** `PASS`
**BASE_HEAD:** `5f4906446f35c5a4380c3810bfe3363b00b396bc`
**Date (Europe/Rome):** 2026-09-14

## Decision

```text
PHASE_3_SCHEDULER_DEDUP=PASS
PHASE_3_DECISION=NO_DEDUP_REQUIRED_ROLE_SEPARATION
CANONICAL_TICK_OWNER=WF90
SERVICE_LIFECYCLE_OWNER=ControlPlane-V4-LocalDevDispatcher
ACTIVE_TICK_GENERATORS=1
SINGLE_FLIGHT_GUARD=PASS
DOUBLE_EXECUTION_OBSERVED=NO
SERVICE_RECOVERY=PASS
TICK_RECOVERY=PASS
MODEL_INFERENCE=0
PRODUCTION_MODEL_DISPATCH_CHANGED=NO
WINDOWS_TASK_ROLE=SERVICE_SUPERVISOR
WF90_ROLE=TICK_SCHEDULER
DUPLICATE_SCHEDULER_ASSUMPTION=DISPROVEN
LIVE_MUTATION_REQUIRED=NO
```

The historical Phase 3 assumption that WF90 and the Windows task were two
competing tick schedulers was too coarse. They are complementary: WF90 owns
the periodic HTTP tick, while the Windows task owns the lifetime of the local
dispatcher service. Neither component was disabled or reconfigured.

## 1. Topology before

```text
Windows Scheduled Task ControlPlane-V4-LocalDevDispatcher
  → hidden PowerShell Start-Process wrapper
  → node tools/serve-local-dev-autonomous-dispatcher-v1.mjs
  → 127.0.0.1:18793

n8n WF90 (90 - CP V4 LOCAL DEV ALWAYS-ON DISPATCHER - ACTIVE)
  Schedule Trigger: every 5 minutes
  → private Tailscale Serve /v4/local-dev/dispatch-tick
  → POST 127.0.0.1:18793/v1/tick
```

The repository has no separate `tools/local-dev-autonomous-dispatcher-v1.mjs`
entrypoint; the actual qualified service entrypoint is the documented
`tools/serve-local-dev-autonomous-dispatcher-v1.mjs`. This was a naming gap in
the task prompt, not a second runtime.

## 2. Role census

| Capability | WF90 | Windows Scheduled Task |
|---|---|---|
| `STARTS_PROCESS` | `NO` | `YES` — canonical Node service |
| `KEEPS_PROCESS_ALIVE` | `NO` | `YES` — task-owned service lifetime |
| `PERIODIC_TRIGGER` | `YES` — 5-minute Schedule Trigger | `NO` — persisted task uses enabled LogonTrigger |
| `CALLS_V1_TICK` | `YES` — private HTTP route to `/v1/tick` | `NO` — it starts the listener |
| `CLAIMS_WORK` | `NO` | `NO` as scheduler; service handles requests |
| `EXECUTES_WORK` | `NO` — orchestration/normalization only | `NO` as scheduler; hosted service may execute an admitted tick |
| `RESTARTS_ON_FAILURE` | `NO` — no retry is a tick-generation role | `NOT_OBSERVED` — no crash test was safe or necessary |
| `SCHEDULE_INTERVAL` | `5 minutes` | `none` (logon/startup lifecycle) |
| `SINGLE_FLIGHT_PARTICIPATION` | indirect — receives `BUSY` from service | service enforces lock; task does not create a second lock |
| `FAILURE_DOMAIN` | n8n/WF90 execution and private transport | local process/task lifecycle and listener availability |
| `DEPENDENCY_ON_OTHER_COMPONENT` | dispatcher listener must be available | WF90 supplies periodic demand for `/v1/tick` |

Therefore:

```text
DO_BOTH_COMPONENTS_GENERATE_DISPATCH_TICKS=NO
DO_BOTH_COMPONENTS_START_THE_DISPATCHER_SERVICE=NO
ARE_THEIR_ROLES_FUNCTIONALLY_DUPLICATE=NO
```

## 3. Read-only live and persisted qualification

The current executor snapshot was read-only: the exact Windows task was not
present in this session, no matching dispatcher process was present, and no
listener was bound at `127.0.0.1:18793`. The local Docker command required for
direct WF90 database inspection was unavailable. No service, workflow, task,
remote host, or endpoint was started or changed to compensate.

The existing sanitized qualification evidence remains sufficient for the role
and recovery claims: the runtime-restore evidence records the exact task
action, enabled LogonTrigger, `MultipleInstances=IgnoreNew`, successful task
start, canonical process identity, one loopback listener, and read-only HTTP
health checks. The subsequent WF90 evidence records the active/published
workflow, exact active version, 5-minute natural schedule, two post-fix
`IDLE_CLEAN` ticks, and zero duplicate executions. No credential or token
material was read.

The live/persisted evidence is summarized without asserting that the absent
current-session task is running:

```text
CURRENT_SESSION_TASK=ABSENT (observed read-only)
CURRENT_SESSION_DISPATCHER_PROCESS=ABSENT (observed read-only)
CURRENT_SESSION_BIND_127.0.0.1_18793=ABSENT (observed read-only)
WF90_PERSISTED_STATE=ACTIVE/PUBLISHED
WF90_SCHEDULE=5_MINUTES
PERSISTED_SERVICE_RESTART_PROOF=PASS
PERSISTED_TICK_RECOVERY_PROOF=PASS
PERSISTED_NATURAL_IDLE_TICKS=2
PERSISTED_DUPLICATE_EXECUTIONS=0
```

## 4. Single-flight and recovery proof

The service source contains one in-process `executing` lock. A concurrent
request receives `409 BUSY` with `EXECUTION_IN_FLIGHT` and is never queued.
The focused service suite proved the guard and all relevant read-only state
semantics. The WF90 normalizer suite proved that `BUSY` is handled as a
bounded dispatcher result and that HTTP status alone cannot infer a gate.

```text
T1 ROLE_CENSUS=PASS
T2 ACTIVE_TICK_GENERATORS=1
T3 SINGLE_FLIGHT_GUARD=PASS
T4 DOUBLE_EXECUTION_OBSERVED=NO
T5 SERVICE_RECOVERY=PASS
T6 TICK_RECOVERY=PASS
T7 NO_MODEL_EXECUTION=PASS
T8 ROLLBACK_READY=YES
T9 PRODUCTION_MODEL_DISPATCH_CHANGED=NO
T10 CURRENT_TOPOLOGY_UNAMBIGUOUS=YES

LOCAL_DEV_DISPATCHER_SERVICE_SUITE=69/69 PASS
WF90_NORMALIZER_SUITE=18/18 PASS
```

Recovery ownership is explicit:

```text
SERVICE_RECOVERY_OWNER=ControlPlane-V4-LocalDevDispatcher Scheduled Task
TICK_SCHEDULING_OWNER=WF90
SERVICE_AVAILABLE_AFTER_RESTART=YES (persisted bounded restart proof)
TICK_PATH_AVAILABLE_AFTER_RESTART=YES (persisted natural-tick proof)
NO_MANUAL_OPERATOR_ACTION_REQUIRED=YES (normal logon service start and WF90 schedule)
AUTOMATIC_CRASH_RESTART=NOT_CLAIMED (not exercised)
```

No model inference, Qwen/GLM/Codex call, ChatGPT Web action, claim, receipt,
queue, Telegram, or production dispatch occurred in this qualification.

## 5. Decision and mutation

The selected decision is `NO_DEDUP_REQUIRED_ROLE_SEPARATION`. Because only one
component generates periodic dispatch ticks, no live mutation was necessary:

```text
LIVE_MUTATIONS=0
WINDOWS_TASK_DISABLED=NO
WF90_DISABLED=NO
WF90_BUSINESS_LOGIC_CHANGED=NO
WINDOWS_TASK_DELETED=NO
```

The prior duplicate-scheduler wording is superseded only by this role
classification; historical rows remain unchanged. The Windows task remains
the service supervisor and WF90 remains the canonical tick scheduler.

## 6. Rollback and hard walls

Rollback is trivially ready because no scheduler or service configuration was
changed. Reverting this report and the three canonical documentation notes
restores the prior documentation state; there is no live mutation to undo.

Verified hard walls:

```text
QWEN_INFERENCE=0
GLM_INFERENCE=0
CODEX_INFERENCE=0
CHATGPT_WEB=0
HERMES_BROWSER_SEND=0
PRODUCTION_MODEL_DISPATCH_CHANGED=NO
OPENCLAW_CHANGED=NO
LITELLM_CHANGED=NO
POSTGRESQL_CHANGED=NO
OLD_VPS_CHANGED=NO
NEW_VPS_UNRELATED_CHANGED=NO
PUBLIC_EXPOSURE=NO
CREDENTIAL_TOKEN_COOKIE_EXPOSURE=NO
D0025_ACTIVATED=NO
PHASE_4_EXECUTED=NO
```

The next bounded slice is:

```text
NEXT=V4_ROUTING_POLICY_SINGLE_SOURCE_PHASE_4_V1
PHASE_4_HUMAN_GATE_REQUIRED=NO
```

Phase 4 was not executed.

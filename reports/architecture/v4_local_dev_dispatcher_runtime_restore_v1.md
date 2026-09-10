# V4 Local Dev Dispatcher Runtime Restore V1

**TASK_REF:** `V4_LOCAL_DEV_DISPATCHER_RUNTIME_RESTORE_V1`
**Classification:** `PASS`
**BASE_HEAD:** `cbaa2b70c1f69c65dd36fcf128566187cbc48936`
**ROOT_CAUSE:** `TASK_ABSENT_CAUSE_NOT_PROVEN`

## Pre-state and discovery

The preceding task recorded `LOCAL_DISPATCHER_RUNTIME_UNAVAILABLE` when the
exact task and listener were absent. At this task's bounded discovery, the
canonical task was present again in `Ready` state, but no dispatcher listener
or dispatcher Node process was present. The transition to task-present was
not causally explained; no deletion, rename, disablement, or configuration
loss is asserted.

Read-only discovery found no similarly named dispatcher task or Windows
service. The only matching task is `ControlPlane-V4-LocalDevDispatcher`.
The canonical repository is
`C:\Users\mrhz\Documents\AI\GitHub\control-plane`; Node is
`C:\Program Files\nodejs\node.exe` (`v24.15.0`), and the canonical
entrypoint exists.

## Reconstructed/verified task configuration

No task was recreated because the canonical task was already present. Its
sanitized live configuration was verified as:

| Field | Observed value |
|---|---|
| Task identity | `ControlPlane-V4-LocalDevDispatcher` |
| Action | `powershell.exe` hidden `Start-Process` wrapper |
| Executable | `C:\Program Files\nodejs\node.exe` |
| Arguments | canonical `tools/serve-local-dev-autonomous-dispatcher-v1.mjs` only |
| Working directory | `C:\Users\mrhz\Documents\AI\GitHub\control-plane` |
| Principal | interactive workstation user, `RunLevel=Limited` |
| Trigger | enabled `LogonTrigger` |
| Settings | `MultipleInstances=IgnoreNew`, `ExecutionTimeLimit=PT0S`, demand start enabled |
| Bind contract | `127.0.0.1:18793` |

Historical repository authority was consulted from
`docs/runtime/LOCAL_DEV_DISPATCHER_OPERATING_MODEL.md`,
`docs/runtime/CURRENT_FRONTIER.md`, `docs/runtime/LAST_CURSOR_REPORT.md`,
and prior dispatcher reports/history. No parallel task, service, daemon,
port, or installer was introduced.

## Restore and live proof

Before start, port `18793` had no listener. Only
`Start-ScheduledTask -TaskName ControlPlane-V4-LocalDevDispatcher` was run.
The resulting process was PID `2320` with the exact canonical Node command
line, and the task reported `LastTaskResult=0`. The entrypoint blob in the
workspace matched the `HEAD` blob exactly:
`17753f8541c4d376fa44ad7f5ccdb4b40a552c48`.

| Read-only check | Result |
|---|---|
| Scheduled Task | present, enabled, started, `LastTaskResult=0` |
| Process identity | exact canonical Node entrypoint |
| Listener | one `LISTEN` on `127.0.0.1:18793` |
| Public bind | zero |
| `GET /dashboard` | HTTP 200 |
| `GET /v1/status` | HTTP 200 |
| `GET /v1/diagnostics` | HTTP 200, `read_only=true` |
| `GET /v1/resources` | HTTP 200, `read_only=true`, Qwen `AVAILABLE` |
| `/v1/tick` | not invoked |

`/v1/status` is the established status schema and does not carry a
`read_only` field; this is unchanged. The restored revision intentionally
does not claim the unqualified Hermes/OpenCode operator-visibility work from
the preceding STOP task.

## Safety and regression evidence

`MANUAL_TICKS=0`, `QUEUE_MUTATIONS=0`, and `QWEN_GENERATIONS=0`. No GLM,
Codex inference, Qwen inference, Hermes/browser interaction, ChatGPT Web,
OpenAI API/BYOK, queue execution, receipt mutation, n8n/VPS/Tailscale/firewall
mutation, public exposure, global process kill, or credential/token/cookie
access occurred.

Offline regression results: dispatcher `69/69`, resource observatory PASS,
resource integrity `7/7`, and registry `76/76`. `git diff --check` passed.

# V4 Cursor Agent CLI accessibility remediation V1

**TASK_REF:** `V4_CURSOR_AGENT_CLI_ACCESSIBILITY_REMEDIATION_V1`
**Classification:** `PASS — PROJECT_ACCESSIBLE_INTERFACE_QUALIFIED`
**Date (Europe/Rome):** 2026-09-12
**Repository:** `mrhz1973/control-plane`
**Branch:** `main`
**BASE_HEAD:** `d2bd6b4110531622d487aac742db7103aa1081fc`

## Scope and result

This bounded remediation addressed only the prior
`CURSOR_ACP_NOT_PROJECT_ACCESSIBLE` blocker. It used Cursor's official native
Windows Agent CLI installer. No Telegram integration, model/provider request,
browser operation, runtime route, production dispatch, n8n operation, or VPS
operation was performed.

## Sanitized evidence

| Check | Result | Evidence boundary |
|---|---|---|
| `AGENT_COMMAND_AVAILABLE` | `YES` | Official installer produced the PowerShell command shim at the user-local Cursor Agent installation. |
| `AGENT_VERSION_OBSERVED` | `YES` | `2026.09.10-fd3934a` from `agent --version`. |
| `AUTHENTICATED` | `YES` | Operator directly verified `agent status` after interactive Cursor login; account identity, login URL, challenge, and credentials are omitted. |
| `ACP_HELP_AVAILABLE` | `YES` | Local `agent acp --help` identifies the Agent Client Protocol server command. |
| `ACP_STDIO_MODE_AVAILABLE` | `YES` | Cursor's official ACP documentation specifies `agent acp` over stdin/stdout newline-delimited JSON-RPC. No ACP server session was started. |
| `SESSION_NEW_SUPPORTED` | `YES` | Official ACP protocol documents `session/new`. |
| `SESSION_LOAD_SUPPORTED` | `YES` | Official ACP protocol documents `session/load`; local root help also exposes `--resume` and `--continue`. |
| `CURSOR_ASK_QUESTION_SUPPORTED` | `YES` | Official ACP documentation specifies blocking `cursor/ask_question`. No question event was initiated. |

## Limits preserved

`CURSOR_ACP_NOT_PROJECT_ACCESSIBLE` is resolved only as a command/interface
accessibility blocker. The following are deliberately **not** claimed:

- an ACP `session/new` or `session/load` live exchange;
- a `cursor/ask_question` event;
- Telegram notification or callback binding;
- stale/duplicate callback fencing; or
- same-session resume after an operator answer.

Those require the separate bounded task
`V4_CURSOR_AGENT_ACP_TELEGRAM_SAME_SESSION_HUMAN_GATE_V2`.

## Markers

```text
CURSOR_ACP_NOT_PROJECT_ACCESSIBLE=RESOLVED
AGENT_COMMAND_AVAILABLE=YES
AGENT_VERSION_OBSERVED=YES
ACP_HELP_AVAILABLE=YES
ACP_STDIO_MODE_AVAILABLE=YES
SESSION_NEW_SUPPORTED=YES
SESSION_LOAD_SUPPORTED=YES
CURSOR_ASK_QUESTION_SUPPORTED=YES
AUTHENTICATED=YES
MODEL_OR_PROVIDER_REQUESTS=0
TELEGRAM_INTEGRATION=NO
PRODUCTION_CHANGED=NO
NEXT=V4_CURSOR_AGENT_ACP_TELEGRAM_SAME_SESSION_HUMAN_GATE_V2
```

## Sources

- Cursor CLI installation (native Windows): `https://cursor.com/docs/cli/installation`
- Cursor ACP protocol: `https://cursor.com/docs/cli/acp`

# V4 Local Dev Hermes/OpenCode Operator Visibility V1 — Retry 1

**TASK_REF:** `V4_LOCAL_DEV_HERMES_OPENCODE_OPERATOR_VISIBILITY_V1_RETRY1`
**Classification:** `PASS`
**BASE_HEAD:** `17bca0ae1202b91df25f429fa1919cecdbf8b1a9`
**PREVIOUS_STOP_WORK:** `NONE`

## Scope and authority

The prior STOP was caused only by the unavailable dispatcher runtime. The
runtime restore was already persisted and verified before this retry. The
worktree had no tracked dirty changes; pre-existing untracked files were
preserved and not staged.

The new view is additive and consumes the existing `/v1/status`,
`/v1/diagnostics`, and `/v1/resources` GET surfaces. It adds a bounded
`operator_visibility` object to diagnostics and a dedicated “Chi sta facendo
cosa” panel beside the existing operational cards. The Resources row remains
the six-card hardware/quota view: workstation, VPS, Qwen, GLM, Codex, Cursor.
Hermes and OpenCode are not resources.

Visible taxonomy is explicit: Qwen = MODELLO; Codex Subscription =
CONTROLLER / SUBSCRIPTION LANE; OpenCode = HARNESS / ESECUTORE LOCALE;
Cursor = IDE / HARNESS / AGENT; Hermes = ORCHESTRATOR / BRIDGE; VPS and
Macchina locale = INFRASTRUTTURA.

## Current-state rules

The active path uses only the current status snapshot. Task, phase, and
assigned Qwen profile are shown only when the dispatcher is active; OpenCode
is `ACTIVE` only when the current phase is `OPENCODE`. A Qwen `LOADED`
observation alone never makes OpenCode active. Missing Hermes controller,
effective model, browser target, app-server, MCP, and machine evidence remain
`NOT_OBSERVED`.

Hermes is shown as `ORCHESTRATOR / BRIDGE` with the required description.
Its activity feed accepts only the ten governed event names, is capped at ten
events, and contains no prompt, response, conversation text, reasoning,
cookie, token, OAuth, authorization header, browser storage, or environment
dump. The governed capability display remains exactly:

`DISCOVER_CHATGPT_TARGET`, `GET_COMPOSER_STATE`, `PREFILL_SINGLE_LINE`,
`CLEAR_COMPOSER`.

`RAW_BROWSER_CDP_EXPOSED=NO`, `CHAIN_OF_THOUGHT_DISPLAY=NO`, and send/submit
is unavailable. No ChatGPT Web interaction occurred.

## Runtime and route proof

After tests, only the identity-checked canonical dispatcher process was
recycled (old PID `2320`, new PID `40784`) and the existing
`ControlPlane-V4-LocalDevDispatcher` task was started. The process command
line points to the canonical workspace entrypoint and the listener is one
loopback bind on `127.0.0.1:18793`; public bind count is zero. The live
diagnostics response contains `operator_visibility`, and the live dashboard
contains “Chi sta facendo cosa”, HERMES, and OPENCODE cards.

Local read-only smoke:

| Surface | Result |
|---|---|
| `GET /dashboard` | HTTP 200 |
| `GET /v1/status` | HTTP 200 |
| `GET /v1/diagnostics` | HTTP 200, `read_only=true` |
| `GET /v1/resources` | HTTP 200, `read_only=true`, Qwen `AVAILABLE` |

The current idle snapshot honestly reports Hermes `NOT_OBSERVED`, Hermes
controller/effective model `NOT_OBSERVED`, Hermes activity `0/10`, and
OpenCode `NOT_OBSERVED`; no historical report was used as current state.

Tailscale Serve was inspected read-only. Existing handlers map
`/dashboard`, `/v1/status`, `/v1/diagnostics`, and `/v1/resources` to the
corresponding `127.0.0.1:18793` paths. Bounded HTTPS GETs from this node
returned HTTP 200 for all four surfaces and the remote dashboard contained
the new section. Therefore `TAILSCALE_DASHBOARD_SURFACE=LIVE` for this
tested private surface. No Serve/Funnel/firewall/public-exposure mutation
occurred.

## Tests and safety

`tests/local-dev-hermes-opencode-operator-visibility-v1/run.mjs`:
`FOCUSED_TESTS=PASS`.

Regression suites passed: dispatcher `69/69`, resource observability
integrity `7/7`, Hermes governed CDP adapter `13/13`, and registry `76/76`.
`git diff --check` passed. No `/v1/tick`, queue execution, receipt mutation,
Qwen inference/load/recycle, GLM, Codex inference, n8n/VPS/OLD/Tailscale
mutation, browser send, or credential access occurred.

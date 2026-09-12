# V4 Cursor ACP MCP human-gate minimal slice implementation V1

**TASK_REF:** `V4_CURSOR_ACP_MCP_HUMAN_GATE_MINIMAL_SLICE_IMPLEMENTATION_V1`
**Classification:** `PASS — MINIMAL_SLICE_IMPLEMENTED_AND_PROVEN (deterministic/synthetic transport only; no real Telegram in this task)`
**Date (Europe/Rome):** 2026-09-12
**Repository:** `mrhz1973/control-plane`
**Branch:** `main`
**BASE_HEAD:** `b1c15165d4768f1d33e1f61d1941461e89ee1f86`

## Scope

Only the selected minimal slice
(`A_PROJECT_OWNED_MCP_HUMAN_GATE_TOOL` from
`v4_cursor_acp_external_human_gate_architecture_selection_v1.md`):

1. one project-owned stdio MCP server exposing exactly one tool `human_gate`;
2. ACP driver wiring (`session/new` carries the server via `mcpServers`);
3. gate adapter reusing/extracting the proven V2 gate law;
4. callback binding (task_ref, run_id, ACP session identity, generation) with
   operator/chat binding, TTL and update-id fences preserved;
5. SAME-SESSION LAW enforced structurally;
6. fail-closed everywhere; no default answer; adapter cannot self-authorize.

No real Telegram send, no production dispatch, no route change.

## Implemented artifacts

| File | Role |
|---|---|
| `tools/v4-cursor-acp-gate-core-v1.mjs` | **Canonical gate law (single decision authority).** Extracted + extended from the proven V2 driver: store schema `v4-cursor-acp-gate-store-v1`, `computeDecisionId(taskRef, runId, sessionIdSha, generation)`, `registerGateDecision` (REGISTERED), `markNotified` (NOTIFIED), `admitGateCallback` (VERIFIED — V2 fence law verbatim), `markReturned` (RETURNED), `markConsumed` (CONSUMED), `markNoAnswer` (NO_ANSWER), bounded TTL clamp [1s, 1h], `validateHumanGateInput` schema law. |
| `tools/v4-cursor-acp-mcp-human-gate-server-v1.mjs` | **MCP stdio server — ADAPTER ONLY.** Exactly one tool `human_gate` (input schema: `task_ref, run_id, generation, question{prompt, options[A,B,C]}`; output: `status = answered|no_answer|error`, `option` only when answered, `decision_id`). Transport injected via env module path (no credentials in this layer); trusted session binding read from a driver-written spool file (never from the model); every mutation goes through the gate-core law; fail-closed on missing binding / missing transport / send failure / no answer / any fence rejection. |
| `tools/v4-cursor-acp-session-wiring-probe-v1.mjs` | Bounded real-session wiring probe: `session/new` with `mcpServers:[human-gate stdio server]`, driver-written binding, SAME-SESSION guard (counts agent-side `session/new`; must be 0), permission requests auto-denied. |
| `tests/v4-cursor-acp-mcp-gate/run.mjs` | Deterministic suite (32 checks). Local/synthetic transport only. |
| `tests/v4-cursor-acp-mcp-gate/transport-synthetic-valid.mjs` / `transport-synthetic-silent.mjs` | Deterministic fixtures: answering transport (forced option letter) and silent transport (TTL path). No network, no credentials. |

## ACP MCP wiring discovery (vendor contract, read-only)

The first wiring attempt failed closed with `-32603/invalid_union … path
["headers"]`. Read-only bundle inspection (installed official
`8096.index.js`, session/new schema) established the exact per-session MCP
server shapes accepted by the vendor adapter:

- stdio: `{ name, command, args: string[], env: [{name, value}] }`
- http / sse: `{ type, name, url, headers[] }` (union `T`).

After aligning the probe to the stdio shape (env as array of `{name,value}`),
`session/new` accepted the project server on a real `agent acp` session.
No vendor artifact was modified; the finding is recorded for the E2E task.

## Proven markers (32/32 PASS — `reports/runtime/cursor-acp/mcp-gate-suite-results.json`)

```text
MCP_SERVER_START=PASS                 (initialize + started marker)
HUMAN_GATE_TOOL_DISCOVERABLE=PASS     (tools/list: exactly one tool, human_gate)
HUMAN_GATE_SCHEMA_VALIDATION=PASS     (A/B/C enum enforced; 6 malformed-input rejections)
ACP_MCP_WIRING=PASS                   (real session/new accepted the stdio server; SAME_SESSION_GUARD=PASS, agent-side session/new=0)
GATE_STATE_MACHINE=PASS               (REGISTERED→NOTIFIED→VERIFIED→RETURNED→CONSUMED; NO_ANSWER/EXPIRED terminal)
CALLBACK_BINDING=PASS                 (decision_id = f(task_ref, run_id, session_sha, generation); happy path VERIFIED→RETURNED→CONSUMED with option B)
STALE_CALLBACK_REJECTED=PASS          (GATE_DECISION_EXPIRED)
DUPLICATE_CALLBACK_REJECTED=PASS      (GATE_UPDATE_REUSED / GATE_DECISION_ALREADY_CONSUMED — idempotent)
WRONG_TASK_REJECTED=PASS              (GATE_TASK_MISMATCH)
WRONG_SESSION_REJECTED=PASS           (GATE_SESSION_MISMATCH)
WRONG_GENERATION_REJECTED=PASS        (GATE_GENERATION_MISMATCH)
INVALID_OPTION_REJECTED=PASS          (GATE_ANSWER_INVALID)
UNKNOWN_DECISION_REJECTED=PASS        (GATE_DECISION_UNKNOWN)
FENCES_LEAVE_DECISION_UNTOUCHED=PASS  (rejections never transition a healthy decision)
NO_DEFAULT_ANSWER=PASS                (silent transport → NO_ANSWER, option stays null; no default anywhere)
ADAPTER_SYNTHETIC_ANSWERED=PASS       (synthetic valid callback returned option C through the MCP tool result)
ADAPTER_NO_BINDING_FAILS_CLOSED=PASS  (SESSION_BINDING_MISSING)
ADAPTER_SILENT_NO_ANSWER=PASS         (no_answer, no option field)
ADAPTER_UNKNOWN_TOOL_REJECTED=PASS    (isError=true)
CONTROL_PLANE_AUTHORITY_PRESERVED=YES (adapter-only; all state transitions via gate-core; adapter has no decision logic)
PRODUCTION_CHANGED=NO
SAME_SESSION_SYNTHETIC=PASS           (answer flows through the tool result in the caller's context; wiring guard proves zero extra session/new)
```

Wiring evidence: `reports/runtime/cursor-acp/mcp-gate-wiring-result.json`
(`ACP_MCP_WIRING=PASS`, `SAME_SESSION_GUARD=PASS`, session identity captured
as sha12 only).

## Explicitly NOT claimed

```text
TELEGRAM_E2E=NOT_CLAIMED
REAL_OPERATOR_CALLBACK=NOT_CLAIMED
```

The synthetic transports prove the adapter/gate contract deterministically.
The real Telegram transport + real operator callback + live same-session ACP
continuation belong to the next task (`V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1`).

## Hard walls respected

No production dispatch; no real Telegram send; no Telegram credential changes
(none read, none present in any new file); no n8n/VPS mutation; no public
endpoint/Funnel; no OpenClaw; no `cursor/ask_question` workaround (bridge not
used at all); no hidden fallback (every failure path returns error/no_answer);
no second decision authority (gate-core is the single one); no secret
persistence; no dashboard work; no vendor binary changes; no global runtime
configuration (per-invocation env only). Tests use temp stores/spools — the
canonical user-local gate store was never touched by tests.

## Same-session law implementation note

- The exact ACP sessionId is captured once by the driver and only its sha12
  enters decisions/ids.
- No code path may call `session/new` after the baseline; the wiring probe
  counts agent-side `session/new` and fails on any.
- `session/load` is reserved exclusively as labeled `LOGICAL_RECOVERY`
  (crash path) in the E2E task; it is not exercised here.

**End of implementation report.**

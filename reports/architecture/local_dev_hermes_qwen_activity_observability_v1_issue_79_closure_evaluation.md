# LOCAL_DEV_HERMES_QWEN_ACTIVITY_OBSERVABILITY_V1_ISSUE_79_CLOSURE_EVALUATION

**TASK_REF:** `LOCAL_DEV_HERMES_QWEN_ACTIVITY_OBSERVABILITY_V1_ISSUE_79_CLOSURE_EVALUATION`
**Mode:** CLOSURE EVALUATION ONLY — no implementation, no issue mutation
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `585e415a315dba979fdc74ef251e1da348e6839c`

## DECISION

```
ISSUE_79_CLOSURE_ELIGIBLE=YES
MINIMUM_CAPABILITY_COMPLETE=YES
READ_ONLY_OBSERVABILITY=PASS
DISPATCHER_IDLE_WITH_EXTERNAL_ACTIVE=PASS
AUTHORITY_EXPANSION=NO
PRODUCTION_CHANGED=NO
```

Recommendation: close issue #79 as **minimum capability complete**. The
read-only observability lane exists, is wired into the real dispatcher
surface, keeps its authority laws, and is regression-green on this exact
tree (suite re-run during this evaluation: `RESULT: PASS — 23 passed,
0 failed`).

## Implementation shape (matches the issue's preferred architecture)

`Hermes/Qwen runner → local JSON ephemeral activity registry → dispatcher
diagnostics/dashboard read-only consumption` — option "in-memory/local JSON
status registry". **No new service**: the registry is a bounded file
(`%LOCALAPPDATA%\control-plane\agent-activity-registry-v1.json`, max 20
activities) consumed by the EXISTING dispatcher process; the dispatcher
exposes `GET /v1/agent-activity` (GET-only) and embeds the same sanitized
section additively in `GET /v1/diagnostics` as `agent_activity`
(`read_only: true`); the dashboard renders it from the already-polled
diagnostics — zero extra HTTP calls. Verified in
`tools/serve-local-dev-autonomous-dispatcher-v1.mjs` (import of
`applyFreshness`/`readActivities`, `AGENT_ACTIVITY_PATH`,
`buildAgentActivitySection`) and `tools/local-dev-dispatcher-dashboard-v1.html`
(distinct `data-section="agentops"`, canonical order
`resources, ops, agentops, queue`).

## Verification matrix — issue #79 acceptance vs. real state

| # | Issue acceptance | Verdict | Evidence |
|---|---|---|---|
| 1 | dispatcher idle + external Hermes/Qwen activity active simultaneously | **SATISFIED** | T2 (ACTIVE while dispatcher IDLE); dashboard shows both without contradiction; report `DISPATCHER_IDLE_WITH_EXTERNAL_ACTIVE=PASS`. |
| 2 | near-real-time updates for operator use | **SATISFIED** | Atomic single-write registry; readers evaluate at request time; dashboard consumes the already-polled diagnostics ⇒ updates visible at the next poll tick (operator-sufficient by design). |
| 3 | no claim/receipt mutation required | **SATISFIED** | T10; registry has no task/claim/receipt surface (exports only publish/read/applyFreshness/path). |
| 4 | no production dispatch implied | **SATISFIED** | Read-only lane; `/v1/agent-activity` performs no tick-lock acquisition (T12). |
| 5 | no credential/cookie/token/session material exposed | **SATISFIED** | Allow-list schema drops all other fields — hostile payloads with secrets leave zero disk trace (T8/T9). |
| 6 | no Google account identity shown | **SATISFIED** | No identity field exists; `auth_state` is boolean-sanitized (`true/false/UNKNOWN/null`). |
| 7 | browser/CDP status loopback/private | **SATISFIED** | `cdp_state` is a status label (e.g. `OBSERVED`/`READY`), never an endpoint; no public CDP anywhere in the lane. |
| 8 | stale activity has TTL/freshness semantics | **SATISFIED** | `applyFreshness()` pure read-time function, 90 s default; no heartbeat side effects (T6). |
| 9 | degrades to STALE/UNKNOWN, never fake ACTIVE | **SATISFIED** | ACTIVE/WAITING old ⇒ STALE; missing/unparsable timestamp ⇒ UNKNOWN; terminal PASS/STOP never reinterpreted (proven at +24 h/+1 h) (T6/T7). |
| 10 | terminal PASS/STOP clearly distinguishable | **SATISFIED** | T4/T5 with `stop_reason`; dashboard state tones ok/danger with distinct labels. |
| 11 | resource cards semantically unchanged | **SATISFIED** | Diagnostics change is additive only (T13); dashboard canonical resources unchanged (`workstation, vps, qwen, glm, codex, cursor`). |
| 12 | queue semantics unchanged | **SATISFIED** | Dispatcher service suite 69/69 (S71 additive layout update only); T18. |
| 13 | telemetry cannot authorize or execute work | **SATISFIED** | No authorize/execute/dispatch surface exists in the registry exports (T11); publishing a terminal record has zero execution effect. |
| 14 | HUMAN_GATE/WAITING without second authority | **SATISFIED** | T3 (`state=WAITING, stage=HUMAN_GATE`); lane never polls Telegram nor reads decisions; persistent operator-wait law untouched (MCP gate 37/37). |
| 15 | dashboard distinguishes dispatcher state from agent/browser activity | **SATISFIED** | Separate `AGENT / "Operazioni agente / browser"` section, explicitly labelled "Fuori dal ciclo di selezione/claim". |
| 16 | registry bounded/sanitized | **SATISFIED** | `MAX_ACTIVITIES=20`; allow-list fields; control-char strip + length caps; corrupt/missing file fails closed (T14/T15/T20). |
| 17 | no new mandatory service | **SATISFIED** | Local JSON registry consumed by the existing dispatcher process; no new daemon/endpoint service created. |
| 18 | existing regressions PASS | **SATISFIED** | Lane suite re-run NOW on this tree: 23/23 PASS; dispatcher 69/69 and MCP gate 37/37 recorded on this lineage (closure-eval tree); sidecar 28/28 re-run today by the wiring task. |

## VISUAL_INSPECTION additive check (issue #78 side effect)

`VISUAL_INSPECTION` is ONLY an appended entry in `ACTIVITY_STAGES` (with a
comment referencing issue #78). States, freshness law, sanitization
allow-list and authority laws are untouched; the lane suite re-run green
today includes the additive stage (`T16C` in the sidecar suite; lane 23/23).
The #78 wiring publishes through the same sanitized `publishActivity()` — no
authority change.

## Hard walls respected

Evaluation only; no issue mutation; no dashboard redesign; no dispatcher
policy/selector/claim changes; no receipt mutation; no production dispatch;
no browser send; no public CDP; no credentials/session persistence; no
unrelated refactor.

## NEXT

`bounded issue #79 closure persistence only` — the closure comment/close
action for the issue is left to the operator-authorized persistence step;
this task did not mutate the issue.

# V4 first live authorized execution — retry 004

**Task ref:** `V4_FIRST_LIVE_AUTHORIZED_EXECUTION_RETRY_004_EXACT_REGISTER_SCHEMA`  
**Run nonce:** `FIRST_LIVE_004_20260901_01`  
**Result:** PASS  
**Starting HEAD:** `90a284767415deb05b8dff8010e3fd4185fafb9e`

## Outcome

- `REGISTER_SCHEMA_EXACT`
- `QWEN_READY_IDLE_STABLE`
- `HUMAN_APPROVAL_PASS`
- `FIRST_LIVE_EXECUTION_PASS`
- `OPENCODE_EXECUTIONS=1`
- `QWEN_GENERATIONS=1`
- `AUTH_004_SPENT`
- `NO_ACTIVE_AUTHORIZATION`
- `LIVE_GATE_RECLOSED`

## Preflight

- Git: `HEAD == origin/main == 90a284767415deb05b8dff8010e3fd4185fafb9e`; working tree clean.
- Persisted fixes: idle-Ollama classifier `57b9dbe`; native bounded OpenCode runner `236f80d`.
- Listeners: ports `18790`, `18791`, `18792`, and canonical `8080` each had exactly one listener.
- Historical authorizations: AUTH 001 and AUTH 002 remained `SPENT`.
- Rejected 003 remained absent from pending store, registry, and ledger.
- One early `/v1/models` probe exposed `qwen38-original-dflash2-8k`; no later model-list probe was made.
- After the required wait, two canonical occupancy classifications separated by at least two seconds were both `QWEN_READY_IDLE` / `PASSIVE_CANONICAL_WEBUI_CLIENT`.

## Exact register and human gate

The canonical compact scope digest was:

`ca501cb41602028c4e575a08bcdfc491a793b7cb462790a6f3a4fc67efdb85aa`

Before the request, the sorted register body keys were programmatically asserted to equal the contract's exact eight-key set. The body included `pending_ttl_seconds: 900` and did not include `authorization_scope`, `scope`, or `authorization_ttl_seconds`.

- Register POSTs: 1.
- Result: HTTP 200, `REGISTER_PENDING_ACCEPTED`, `PENDING`.
- Telegram decision messages: 1.
- Human `APPROVE`: 1.
- Final pending state: `ISSUED`.
- AUTH 004 before execution: `ACTIVE`; ledger spend count: 0.

## One guarded production execution

The final pre-execution canonical socket/process classification was `QWEN_READY_IDLE`; no `/v1/models` probe was used. Exactly one production POST used the ratified read-only proof message and the full exact runtime authorization scope.

- HTTP: 200.
- Endpoint: `EXECUTED_OK`; `execution_performed=true`; `replayed=false`.
- Adapter: `EXECUTED`; `authorization_state_final=SPENT`.
- Occupancy: `QWEN_READY_IDLE`.
- Guard: required and started; upstream generation requests 1; blocked generation requests 0.
- OpenCode executions: 1.
- Qwen generation calls: 1.
- Retry calls: 0.
- Fallback calls: 0.
- Response validation: `NOT_VALIDATED`.
- WF40 executions: 0.
- WF61 executions: 0.
- Cloud provider calls: 0.

## Durable closure

- AUTH 001: `SPENT`, preserved.
- AUTH 002: `SPENT`, preserved.
- AUTH 003: absent/unissued.
- AUTH 004: `SPENT`.
- Ledger contains exactly one `ADMISSION_CONSUMED` record matching AUTH 004, EXEC 004, and `opencode+qwen_local`.
- ACTIVE authorizations remaining: 0.
- Live gate: reclosed.

## Next

`V4_WF40_FIRST_LIVE_AUTHORIZED_EXECUTION_PROOF`

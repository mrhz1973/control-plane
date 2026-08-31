# V4 runtime authorization durable spend ledger — authoring

**Task:** `V4_RUNTIME_AUTHORIZATION_DURABLE_SPEND_LEDGER`  
**Authority:** GPT Web  
**Status:** **PASS — CONTRACT AUTHORED, NOT IMPLEMENTED**  
**Starting HEAD:** `83c55ee410aeef0f3b3f464c3089f48542ab3a53`  
**Runtime mutations:** 0  
**Workflow executions:** 0  
**Endpoint HTTP requests:** 0  
**OpenCode / Qwen / provider calls:** 0

## Trigger

The preceding Cursor pass `V4_WF40_EXECUTION_TRANSPORT_PATCH_APPLY_OFFLINE` passed and advanced WF40 from 66 to 71 nodes while keeping the production authorization registry empty and live execution closed.

`CURRENT_FRONTIER` then named `V4_RUNTIME_AUTHORIZATION_DURABLE_SPEND_LEDGER` as NEXT, but no dedicated machine/human contract yet existed. GPT Web therefore authored the contract before implementation rather than asking Cursor to infer ledger semantics.

## Authored artifacts

- `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.md`
- `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.schema.json`

## Core design

The existing provenance registry remains issuance/current-state authority. The new ledger becomes the durable global consumed-id history.

Admission order is fixed as:

```text
execution_id replay/conflict
→ durable ledger validate + already-spent check
→ provenance registry ACTIVE/unexpired/route validation
→ authorization binding
→ global single-flight
→ durable ledger append + atomic persistence
→ provenance registry ACTIVE→SPENT + atomic persistence
→ adapter/occupancy/guard/runner
```

The ledger is written first. If ledger persistence succeeds but registry persistence fails, the ledger record is never rolled back: the authorization remains conservatively consumed and no adapter execution occurs.

## Production path

```text
%LOCALAPPDATA%\control-plane\v4-runtime-authorization-spend-ledger-v1.json
```

Initial production state after implementation must be empty:

```json
{
  "schema_version": "v4-runtime-authorization-durable-spend-ledger-v1",
  "spends": []
}
```

No historical backfill/import from Git authorization artifacts, chat, old packets or reports is permitted.

## Safety boundary

This authoring block does not:

- implement the ledger;
- modify the endpoint;
- restart services;
- create/spend an authorization;
- execute WF40/WF61;
- call the execution endpoint;
- run OpenCode/Qwen/providers.

Live execution remains **CLOSED**.

## NEXT

`V4_RUNTIME_AUTHORIZATION_DURABLE_SPEND_LEDGER_IMPLEMENTATION` — implement/test the authored contract, then install an empty user-local ledger and wire its fixed server-side path into the existing Windows execution endpoint with zero HTTP/execution/generation calls.

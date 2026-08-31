# v4-runtime-authorization-durable-spend-ledger-v1

**Authority:** GPT Web  
**Status:** DESIGN CONTRACT — RATIFIED FOR IMPLEMENTATION  
**Runtime authorized by this document:** **NO**  
**Live authorization issuance authorized:** **NO**

## Purpose

Add a durable, server-side, cross-route replay/spend boundary for runtime authorizations used by the Windows-local execution endpoint.

The existing provenance registry remains the authority for whether an authorization was issued and is currently ACTIVE. This ledger is a separate durable history of authorizations already consumed at admission. Its primary invariant is:

> once an `authorization_id` has been consumed by any supported execution route, that id can never be admitted again, even after endpoint restart, registry cleanup, registry rotation, or future route expansion.

The current provenance registry is the seed for this block; the ledger does not replace issuance/provenance validation.

## Production file

Canonical Windows user-local path, outside Git:

```text
%LOCALAPPDATA%\control-plane\v4-runtime-authorization-spend-ledger-v1.json
```

The path is server-side only and supplied at endpoint construction / CLI startup:

```text
--authorization-spend-ledger <absolute-path>
```

The HTTP caller cannot select, override or mutate the ledger path or ledger contents.

The ledger contains identifiers and structural admission metadata only. No secrets, prompts, model output, raw stdout/stderr or provider credentials may be stored.

## Machine shape

Schema:

`docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.schema.json`

Canonical object:

```json
{
  "schema_version": "v4-runtime-authorization-durable-spend-ledger-v1",
  "spends": [
    {
      "authorization_id": "AUTH-...",
      "execution_id": "execution-id",
      "route_id": "opencode+qwen_local",
      "spent_at": "2026-08-31T12:00:00.000Z",
      "spend_kind": "ADMISSION_CONSUMED"
    }
  ]
}
```

### Entry rules

- `authorization_id`: non-empty string, max 200.
- `execution_id`: non-empty string, max 200.
- `route_id`: non-empty string, max 200. The ledger is intentionally not const-pinned to one route so it can remain the global spend authority as new registered routes are added later.
- `spent_at`: RFC3339 timestamp.
- `spend_kind`: exactly `ADMISSION_CONSUMED` in v1.
- `authorization_id` is globally unique across the entire ledger, independent of route.
- Existing entries are immutable. Persistence may rewrite the JSON file atomically to append a new record, but no existing record may be edited or removed by normal admission flow.

## Fail-closed validation

Missing/unreadable ledger:

```text
AUTHORIZATION_SPEND_LEDGER_UNAVAILABLE
```

Malformed schema/content, duplicate authorization ids, invalid dates or invalid entry shape:

```text
AUTHORIZATION_SPEND_LEDGER_INVALID
```

Authorization id already present in the ledger:

```text
AUTHORIZATION_ALREADY_SPENT
```

All three produce the endpoint's ordinary structural rejection:

- HTTP 200;
- `ok=false`;
- `classification=AUTHORIZATION_REJECTED`;
- `execution_performed=false`;
- `adapter_result=null`;
- no occupancy/guard/runner/OpenCode/Qwen/provider path.

No filesystem path or ledger details are returned to the HTTP caller.

## Ownership split

- **Authorization shape:** request schema + `validateRuntimeAuthorization()`.
- **Issuance/provenance + current ACTIVE/SPENT state:** `v4-runtime-authorization-provenance-registry-v1`.
- **Durable global consumed-id history:** this ledger.
- **Execution-id replay cache / concurrent single-flight:** endpoint in-memory state.
- **Occupancy / guard / runner / generation accounting:** existing canonical owners, unchanged.

A ledger record is not issuance evidence. It proves only that an id has already been consumed.

## Authoritative admission order

After HTTP schema validation:

1. retained `execution_id` replay-cache check:
   - same id + same fingerprint → cached replay;
   - same id + different fingerprint → `EXECUTION_ID_CONFLICT`;
2. load + validate durable spend ledger;
3. if `authorization_id` already exists in ledger → `AUTHORIZATION_REJECTED / AUTHORIZATION_ALREADY_SPENT`;
4. load + validate provenance registry;
5. exact registry lookup; require ACTIVE + unexpired + route match;
6. existing authorization-id binding conflict check;
7. existing global single-flight check;
8. append one `ADMISSION_CONSUMED` record to the durable ledger and persist atomically using temp+rename;
9. only after ledger persistence succeeds, transition the provenance registry ACTIVE → SPENT and persist atomically using its existing owner;
10. only after **both** durable writes succeed may the canonical adapter path run.

### Two-file failure semantics

The order is deliberately ledger-first.

- If ledger persistence fails: registry remains ACTIVE; adapter is not invoked.
- If ledger persistence succeeds but registry spend persistence fails: the ledger record remains authoritative and is **not rolled back**. The authorization is conservatively consumed forever; adapter is not invoked. Any retry is rejected by the ledger before the registry.
- There is no rollback from SPENT/consumed to ACTIVE.

This preserves fail-closed single-use semantics across partial write failures without requiring a multi-file transaction protocol.

## Persistence requirements

Implementation owner:

`tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs`

Required exported behavior:

- pure object validation;
- absolute-path load + validation;
- read-only lookup by `authorization_id`;
- atomic append persistence via same-directory temp file + rename;
- duplicate/global replay rejection;
- no issuance API;
- no deletion/compaction API in v1.

The production endpoint must require an absolute ledger path just as it requires the provenance registry path.

## Production initialization

The first production ledger is an empty user-local file:

```json
{
  "schema_version": "v4-runtime-authorization-durable-spend-ledger-v1",
  "spends": []
}
```

No backfill/import is allowed from:

- `docs/runtime/AUTH_V4_*.operator.json`;
- chat history;
- old execution packets;
- old runtime reports;
- the current provenance registry.

Reason: none of those artifacts is a canonical durable-spend authority for this ledger. At implementation time the production provenance registry is empty and no registry-backed live authorization has been consumed.

## Endpoint integration

The production CLI gains mandatory:

```text
--authorization-spend-ledger <absolute-path>
```

The Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` must pass both:

- `--authorization-registry <absolute-path>`;
- `--authorization-spend-ledger <absolute-path>`.

Request and response JSON schemas remain unchanged.

The endpoint must never accept ledger state/path from the request.

## Tests required

At minimum prove:

1. empty valid ledger loads;
2. missing ledger fails closed;
3. malformed ledger fails closed;
4. duplicate authorization id invalidates ledger;
5. existing spend blocks before registry/adapter;
6. same spent id blocks regardless of route presented by future-compatible test fixtures;
7. atomic append adds exactly one immutable record;
8. second append of same authorization id is rejected;
9. ledger persistence failure leaves registry unspent and adapter uncalled;
10. registry persistence failure after successful ledger append leaves ledger spend durable and adapter uncalled;
11. retry after that partial failure is rejected from ledger;
12. same execution id + same fingerprint replay still occurs before ledger lookup;
13. same execution id + different fingerprint conflict still occurs before ledger lookup;
14. valid admission persists ledger before registry before adapter invocation;
15. occupancy block after valid admission leaves both ledger consumed and registry SPENT;
16. request cannot override ledger/path;
17. HTTP responses leak no ledger path/content;
18. existing endpoint/provenance/adapter/guard/readonly regression suites remain PASS.

## Runtime apply boundary

Implementation may, after all offline tests and review pass:

1. create the empty production ledger user-locally;
2. update only `ControlPlane-V4-LocalExecutionEndpoint` to add the fixed ledger CLI argument;
3. restart only that endpoint task/service;
4. verify exactly one listener on `127.0.0.1:18791`;
5. verify provenance registry remains empty;
6. verify durable spend ledger remains empty;
7. preserve Tailscale routes, OpenClaw root and readonly endpoint.

During this block:

- execution endpoint HTTP requests = 0;
- WF40/WF61 executions = 0;
- OpenCode = 0;
- Qwen generations = 0;
- provider/model calls = 0;
- authorization issuance = 0;
- authorization spends = 0.

## Out of scope

- issuing an ACTIVE authorization;
- Telegram/operator issuance workflow;
- HMAC/signatures;
- live WF40 execution;
- first authorized OpenCode/Qwen execution;
- route registry expansion;
- ledger deletion/compaction/retention policy;
- changing authorization request/response schemas.

## NEXT after implementation PASS

`V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_DISCOVERY`

The durable replay/spend boundary must be proven before designing or enabling the operator-owned ACTIVE issuance path. Live execution remains CLOSED.
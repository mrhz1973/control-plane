# v4-runtime-authorization-provenance-registry-v1

**Authority:** GPT Web  
**Status:** DESIGN CONTRACT — RATIFIED FOR IMPLEMENTATION  
**Runtime authorized by this document:** **NO** (issuance of ACTIVE entries is a separate operator action outside this contract's scope)

## Purpose

Server-side authority for runtime-authorization **provenance** and **spend** for the Windows-local execution endpoint. Closes the provenance gap confirmed in `reports/architecture/v4_runtime_authorization_provenance_gap_discovery.md`: shape validation (adapter + request schema) cannot distinguish an operator-issued authorization from a caller-synthesized one.

## Registry file

- Production path (Windows, user-local, outside Git): `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-registry-v1.json`
- The path is supplied **server-side only** (`--authorization-registry <absolute-path>` CLI argument at service construction). No HTTP field can select or override it.
- Not a secret (ids + scope + states only), but operator-owned: no caller can add or modify entries via HTTP.

## Entry shape

```json
{
  "schema_version": "v4-runtime-authorization-provenance-registry-v1",
  "entries": [
    {
      "authorization_id": "<non-empty unique id>",
      "state": "ACTIVE | SPENT",
      "route_id": "opencode+qwen_local",
      "issued_at": "<RFC3339>",
      "expires_at": "<RFC3339>",
      "spent_at": null
    }
  ]
}
```

Machine schema: `docs/contracts/v4-runtime-authorization-provenance-registry-v1.schema.json`

## Validation rules (fail-closed)

1. `authorization_id` must be unique — duplicates invalidate the whole registry.
2. Unknown id → `AUTHORIZATION_REJECTED` / `AUTHORIZATION_ID_NOT_ISSUED`.
3. `route_id` mismatch with the request route → `AUTHORIZATION_ROUTE_MISMATCH` (defensive in `inspectAuthorization`; unreachable in v1 because the registry schema const-pins `route_id` to `opencode+qwen_local`, so a mismatched route makes the registry file itself `AUTHORIZATION_REGISTRY_INVALID`).
4. `state=SPENT` → `AUTHORIZATION_ALREADY_SPENT`.
5. `now >= expires_at` → `AUTHORIZATION_EXPIRED`.
6. Missing/unreadable file → `AUTHORIZATION_REGISTRY_UNAVAILABLE`.
7. Malformed content (schema, states, dates, duplicates) → `AUTHORIZATION_REGISTRY_INVALID`.
8. No entry is derived automatically from `docs/runtime/AUTH_V4_*.operator.json` or any Git artifact.
9. Spend persistence failure → `AUTHORIZATION_REGISTRY_UNAVAILABLE`; adapter path NOT invoked.

## Admission order (authoritative)

After HTTP schema validation and after the in-memory execution_id replay-cache check, and after the durable spend ledger has admitted the id as not-yet-consumed:

1. load + validate the server-side registry;
2. exact `authorization_id` lookup;
3. verify ACTIVE + unexpired + route match;
4. execution-id binding conflict check (existing semantics);
5. global single-flight check (existing semantics);
6. durable spend ledger append `ADMISSION_CONSUMED` (persisted first — see durable ledger contract);
7. atomically transition ACTIVE → SPENT in the registry object;
8. persist with atomic temp+rename write;
9. only after successful ledger + registry persistence invoke the canonical adapter path (occupancy → guard → runner).

Single-use-at-admission is intentional: an admitted authorization is consumed **before** the execution-side path. A later occupancy block does NOT reactivate it. If ledger persistence succeeds but registry spend persistence fails, the ledger record remains authoritative and is not rolled back.

## HTTP outcome for provenance-invalid requests

HTTP 200 with the canonical response wrapper:
- `ok=false`
- `classification="AUTHORIZATION_REJECTED"`
- `execution_performed=false`
- `adapter_result=null`
- `replayed=false`
- specific `reason_codes` from the list above

No synthetic `adapter_result`. No registry filesystem details in the response.

## Ownership boundaries

- Issuance/provenance + current ACTIVE/SPENT state: this registry owner (`tools/v4-runtime-authorization-provenance-registry-v1.mjs`).
- Durable global consumed-id history: `v4-runtime-authorization-durable-spend-ledger-v1` (`tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs`).
- Authorization SHAPE validation: unchanged, `validateRuntimeAuthorization()` in `tools/opencode-execution-adapter-v1.mjs`.
- Occupancy, guard, runner, accounting: unchanged canonical owners.
- A ledger record is not issuance evidence; this registry remains the seed for ACTIVE issuance state.

## Out of scope

- Issuance tooling for ACTIVE entries (operator action, separate gate).
- HMAC/signatures/envelopes.
- Import of Git operator auth documents.
- Any HTTP request to the execution endpoint.

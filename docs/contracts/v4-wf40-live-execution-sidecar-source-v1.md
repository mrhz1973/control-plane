# v4-wf40-live-execution-sidecar-source-v1

Status: DESIGN CONTRACT. Offline builder/validator only.

## Purpose

After WF61 has produced an `execution-packet-v1` and the V4 routing bridge has
produced an `execution_route_result`, deterministically build the WF40 live
authorization/dispatch sidecars required by the Windows execution path.

This contract closes the lifecycle defect where
`Code - Prepare V4 execution adapter router input` previously read
`dispatch_result` / `runtime_authorization` from the pre-WF61 capture node.

## Hard boundary

The helper:

- performs zero network calls;
- performs zero model/provider calls;
- performs zero Qwen/OpenCode execution;
- performs zero Telegram calls;
- writes neither pending store, provenance registry, nor spend ledger;
- never probes `:8080`;
- never calls `ensureQwenLocalReady()`;
- never synthesizes a guessed `DISPATCH_READY` without packet + route +
  RESOURCE_STATUS evidence;
- never treats an n8n-constructed object as human-approved authorization.

Server-side issuance remains the only authority that can create PENDING /
ISSUED / ACTIVE provenance. The Windows endpoint remains the authoritative
final occupancy and spend gate.

## Fixed authorization scope

Exact compact JSON object (key order fixed as shown):

```json
{
  "execution_harness": "opencode",
  "model": "qwen_local",
  "single_generation_guard_required": true,
  "max_opencode_executions": 1,
  "max_qwen_generation_calls": 1,
  "retry": 0,
  "fallback": 0,
  "qwen_profile": "fast_8k",
  "dflash_required": true
}
```

`scope_digest` = SHA-256 hex (lowercase) of that exact compact JSON string.

## Deterministic IDs

Given WF61 `task_id` and `packet_id`:

```text
execution_id = "wf40:" + task_id + ":" + packet_id
digest = sha256_hex(execution_id)
pending_decision_id = "PEND-WF40-" + digest
authorization_id = "AUTH-WF40-" + digest
```

All IDs must be `<= 200` chars. Callers may not override IDs after the packet
exists.

## Register-pending request

Exactly eight keys, no extras:

```json
{
  "schema_version": "v4-runtime-authorization-register-pending-request-v1",
  "pending_decision_id": "...",
  "authorization_id": "...",
  "task_id": "...",
  "execution_id": "...",
  "route_id": "opencode+qwen_local",
  "scope_digest": "<64 lowercase hex>",
  "pending_ttl_seconds": 900
}
```

Forbidden fields include `authorization_scope`, `scope`, and
`authorization_ttl_seconds`.

## Status request

Exactly two keys:

```json
{
  "schema_version": "v4-runtime-authorization-status-request-v1",
  "pending_decision_id": "..."
}
```

## DISPATCH_READY sidecar

Emit `opencode-execution-dispatch-result-v1` with
`classification=DISPATCH_READY`, `dispatch_ready=true`,
`execution_performed=false` only when all of the following hold:

1. WF61 `execution_packet` validates as `execution-packet-v1`;
2. `execution_route_result.status == ROUTED`;
3. route_id / implementer / model are exactly
   `opencode+qwen_local` / `opencode` / `qwen_local`;
4. composed RESOURCE_STATUS has
   `resources.opencode.available == true` and
   `resources.qwen_local.available == true`.

Otherwise emit fail-closed (no DISPATCH_READY).

## Runtime authorization envelope

Emit `operator-runtime-authorization-v1` with
`authorization_state=ACTIVE` and the fixed scope **only** when a real issuance
status response proves:

- `ok == true`
- `pending_decision_id` exact match
- `authorization_id` exact match
- `state == ISSUED`
- `authorization_expires_at` is a valid future timestamp

PENDING / REJECTED / EXPIRED / mismatched IDs / expired timestamps produce no
runtime authorization envelope.

## Tool

`tools/build-v4-wf40-live-execution-sidecars-v1.mjs`

## Tests

`tests/v4-wf40-live-execution-sidecars/run.mjs`

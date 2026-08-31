# v4-runtime-authorization-pending-store-v1

**Authority:** GPT Web  
**Status:** DESIGN CONTRACT — RATIFIED FOR IMPLEMENTATION  
**Runtime authorized:** **NO**  
**Live issuance authorized:** **NO**

## Purpose

Define the Windows-local durable source of truth for one-shot runtime-authorization decisions before provenance-registry issuance.

This store is distinct from:

- provenance registry: ACTIVE/SPENT authorization authority;
- durable spend ledger: consumed authorization-id history;
- n8n decision tables: UX/transport state only;
- Telegram: human decision transport only.

Canonical production path:

`%LOCALAPPDATA%\control-plane\v4-runtime-authorization-pending-v1.json`

The path is server-side only. No HTTP caller may select or override it.

## Machine schema

`docs/contracts/v4-runtime-authorization-pending-store-v1.schema.json`

Canonical root:

```json
{
  "schema_version": "v4-runtime-authorization-pending-store-v1",
  "decisions": []
}
```

## Decision record

Required immutable identity/binding fields:

- `pending_decision_id` — globally unique in store;
- `authorization_id` — unique across non-expired/non-rejected store records and pre-bound before human decision;
- `task_id`;
- `execution_id`;
- `route_id` — `opencode+qwen_local` in v1;
- `scope_digest` — lowercase SHA-256 hex, 64 chars;
- `created_at` RFC3339;
- `pending_expires_at` RFC3339.

Mutable lifecycle fields:

- `state`: `PENDING | APPROVED | REJECTED | ISSUED | EXPIRED`;
- `decision_at`: RFC3339 or null;
- `selected_option`: `APPROVE | REJECT` or null;
- `telegram_update_id`: bounded string or null;
- `telegram_chat_id`: bounded string or null;
- `authorization_expires_at`: RFC3339 or null;
- `issued_at`: RFC3339 or null.

No Telegram bot token, credentials, raw callback payload, model output, prompts, filesystem path or secret may be stored.

## State invariants

### PENDING

- no decision receipt;
- `decision_at=null`;
- `selected_option=null`;
- `telegram_update_id=null`;
- `telegram_chat_id=null`;
- `authorization_expires_at=null`;
- `issued_at=null`.

### APPROVED

- exact human decision receipt exists;
- `selected_option=APPROVE`;
- `decision_at`, `telegram_update_id`, `telegram_chat_id`, `authorization_expires_at` are present;
- `issued_at=null` until registry ACTIVE persistence succeeds.

### REJECTED

- terminal;
- `selected_option=REJECT`;
- decision receipt present;
- no `authorization_expires_at` required;
- `issued_at=null`.

### ISSUED

- terminal success;
- `selected_option=APPROVE`;
- decision receipt present;
- `authorization_expires_at` present;
- `issued_at` present;
- corresponding provenance registry ACTIVE entry must exist or have existed before later execution spend.

### EXPIRED

- terminal;
- no later APPROVE/REJECT/ISSUE transition;
- no provenance registry entry is created by expiry.

## Allowed transitions

```text
PENDING -> APPROVED -> ISSUED
PENDING -> REJECTED
PENDING -> EXPIRED
```

No other transition is valid.

`ISSUED`, `REJECTED`, `EXPIRED` are terminal.

## Immutable bindings

After record creation these fields can never change:

- `pending_decision_id`
- `authorization_id`
- `task_id`
- `execution_id`
- `route_id`
- `scope_digest`
- `created_at`
- `pending_expires_at`

An issuance request with different task/execution/route/scope bindings is rejected as `ISSUANCE_BINDING_MISMATCH`; the store is not rewritten to fit the caller.

## Identity/replay invariants

- one `pending_decision_id` -> at most one terminal human decision;
- one `authorization_id` -> at most one pending lifecycle;
- one `telegram_update_id` -> at most one consumed decision across the store;
- duplicate APPROVE/REJECT after terminal state is fail-closed;
- exact ISSUED replay may return the existing structural result but never appends another registry entry;
- changed-binding replay is rejected;
- restart does not reset state because the store is durable.

## Expiry

- v1 pending TTL default/max: 900 seconds;
- `pending_expires_at` is server-derived at registration;
- once `now >= pending_expires_at`, the record cannot be approved/issued;
- implementation may materialize `EXPIRED` lazily on next access, but the fail-closed outcome is identical.

## Persistence

Implementation owner:

`tools/v4-runtime-authorization-issuance-v1.mjs`

Required behavior:

- validate complete object before use;
- missing/unreadable -> fail closed;
- malformed/duplicate ids/invalid state shape -> fail closed;
- atomic whole-file persistence with same-directory temp+rename;
- no delete/compaction API in v1;
- existing immutable bindings preserved byte-semantically across lifecycle updates;
- no normal-flow rollback from terminal state.

## Initialization

First production pending store:

```json
{
  "schema_version": "v4-runtime-authorization-pending-store-v1",
  "decisions": []
}
```

No backfill from Git artifacts, chat history, old decision tables or runtime reports.

## n8n boundary

n8n may hold presentation/callback state, but this Windows-local store remains authoritative for issuance. A VPS/n8n row cannot create or modify a pending record except through the bounded issuance-owner API.

## Out of scope

- execution spend;
- durable spend-ledger writes;
- ACTIVE/SPENT registry consumption;
- Telegram bot credentials;
- auto-issuance;
- retention/compaction/deletion;
- first live execution.

## NEXT

Implemented together with `v4-runtime-authorization-issuance-v1` under `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE`.

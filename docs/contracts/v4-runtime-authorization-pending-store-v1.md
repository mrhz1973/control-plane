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
- n8n state: proposal/status transport only;
- Telegram: human decision transport directly consumed by the Windows issuance owner.

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

Immutable identity/binding fields:

- `pending_decision_id` — globally unique;
- `authorization_id` — pre-bound before human decision;
- `task_id`;
- `execution_id`;
- `route_id` — exactly `opencode+qwen_local` in v1;
- `scope_digest` — lowercase SHA-256 hex, 64 chars;
- `created_at` RFC3339;
- `pending_expires_at` RFC3339.

Lifecycle fields:

- `state`: `PENDING | APPROVED | REJECTED | ISSUED | EXPIRED`;
- `decision_at`: RFC3339 or null;
- `selected_option`: `APPROVE | REJECT` or null;
- `telegram_update_id`: bounded string or null;
- `telegram_chat_id`: bounded string or null;
- `telegram_user_id`: bounded string or null;
- `authorization_expires_at`: RFC3339 or null;
- `issued_at`: RFC3339 or null.

Telegram receipt values are populated **only from direct Telegram updates consumed by the Windows issuance owner**, never from n8n/HTTP request fields.

No Telegram bot token, credential, raw callback payload, prompt/model output, filesystem path or secret may be stored.

## State invariants

### PENDING

All decision receipt fields are null; `authorization_expires_at=null`; `issued_at=null`.

### APPROVED

- `selected_option=APPROVE`;
- `decision_at`, `telegram_update_id`, `telegram_chat_id`, `telegram_user_id`, `authorization_expires_at` present;
- `issued_at=null` until registry ACTIVE persistence succeeds.

### REJECTED

- terminal;
- `selected_option=REJECT`;
- decision receipt including Telegram update/chat/user ids present;
- `authorization_expires_at=null`;
- `issued_at=null`.

### ISSUED

- terminal success;
- `selected_option=APPROVE`;
- full sanitized decision receipt present;
- `authorization_expires_at` + `issued_at` present.

### EXPIRED

- terminal;
- no later decision/issuance transition;
- no provenance entry created by expiry.

## Allowed transitions

```text
PENDING -> APPROVED -> ISSUED
PENDING -> REJECTED
PENDING -> EXPIRED
```

No other transition is valid. `ISSUED`, `REJECTED`, `EXPIRED` are terminal.

## Immutable bindings

After creation these fields never change:

- `pending_decision_id`
- `authorization_id`
- `task_id`
- `execution_id`
- `route_id`
- `scope_digest`
- `created_at`
- `pending_expires_at`

The store is never rewritten to fit a caller.

## Identity / replay invariants

- one `pending_decision_id` -> at most one terminal human decision;
- one `authorization_id` -> at most one pending lifecycle;
- one direct Telegram `update_id` -> at most one consumed decision across the store;
- chat id and user id are server-verified against user-local config before receipt persistence;
- duplicate callbacks after terminal state fail closed;
- exact ISSUED status replay never appends registry again;
- restart does not reset state.

## Expiry

- pending TTL default/max: 900 seconds;
- `pending_expires_at` server-derived;
- `now >= pending_expires_at` blocks approve/reject/issue;
- implementation may materialize `EXPIRED` lazily, with identical fail-closed result.

## Persistence

Implementation owner:

`tools/v4-runtime-authorization-issuance-v1.mjs`

Required:

- validate entire object before use;
- missing/unreadable -> fail closed;
- malformed/duplicate ids/invalid state shape -> fail closed;
- atomic whole-file same-directory temp+rename;
- no delete/compaction API v1;
- immutable bindings preserved;
- no rollback from terminal state.

## Initialization

Future first production store, in a later persistence block only:

```json
{
  "schema_version": "v4-runtime-authorization-pending-store-v1",
  "decisions": []
}
```

No backfill from Git, chat history, n8n decision tables or old runtime reports.

## n8n boundary

n8n may call bounded register/status APIs. It cannot write decision receipt fields and cannot attest APPROVE/REJECT. The Windows-local store remains authoritative.

## Out of scope

- execution spend;
- spend-ledger writes;
- ACTIVE/SPENT consumption;
- Telegram bot credential storage in the store;
- auto-issuance;
- retention/compaction/deletion;
- first live execution.

## NEXT

Implemented with `v4-runtime-authorization-issuance-v1` under `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE`.

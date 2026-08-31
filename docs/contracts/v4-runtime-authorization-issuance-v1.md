# v4-runtime-authorization-issuance-v1

**Authority:** GPT Web  
**Status:** DESIGN CONTRACT — RATIFIED FOR IMPLEMENTATION  
**Runtime authorized by this document:** **NO**  
**Live authorization issuance authorized by this document:** **NO**

## Purpose

Define the sole operator-owned issuance boundary that may create an `ACTIVE` entry in the existing server-side provenance registry. Issuance is separate from execution/spend and MUST remain a different process, port, route, state machine and trust boundary from `tools/serve-v4-windows-local-execution-endpoint-v1.mjs`.

Canonical discovery: `reports/architecture/v4_runtime_authorization_issuance_path_discovery.md`.

## Ownership

- Proposal transport / Telegram UX: n8n MAY propose and transport bounded evidence only.
- Human identity signal: configured Telegram operator chat, verified against server-side user-local issuance config.
- Pending decision source of truth: `v4-runtime-authorization-pending-store-v1` on the Windows host.
- Sole ACTIVE-entry writer: new Windows-local issuance owner.
- Provenance ACTIVE/SPENT authority: existing `v4-runtime-authorization-provenance-registry-v1`.
- Durable consumed-id history: existing `v4-runtime-authorization-durable-spend-ledger-v1`; issuance MUST NOT write it.
- Execution endpoint: consumption only; MUST NOT gain issuance APIs.

## Production boundary

Recommended service:

- loopback: `127.0.0.1:18792`;
- separate Scheduled Task from `ControlPlane-V4-LocalExecutionEndpoint`;
- additive Tailscale-private route under `/v4/authorization/*`;
- no Funnel/public exposure.

Server-side startup configuration is authoritative and cannot be selected by the HTTP caller:

- pending store path;
- provenance registry path;
- issuance config path;
- allowed route set;
- operator Telegram chat identity;
- bounded TTL maxima.

The issuance owner MUST NOT accept a spend-ledger path because issuance never writes the spend ledger.

## Issuance config

Canonical user-local path:

`%LOCALAPPDATA%\control-plane\v4-runtime-authorization-issuance-config-v1.json`

At minimum it owns:

- configured operator Telegram chat id;
- pending store absolute path;
- provenance registry absolute path;
- fixed v1 route allowlist containing only `opencode+qwen_local`;
- `pending_ttl_seconds_default = 900`;
- `pending_ttl_seconds_max = 900`;
- `authorization_ttl_seconds_default = 3600`;
- `authorization_ttl_seconds_max = 3600`.

Config is user-local, outside Git. Chat ids and credentials MUST be redacted from repository evidence.

## Operation 1 — register pending

Request schema variant: `v4-runtime-authorization-register-pending-request-v1`.

Required immutable proposal fields:

- `pending_decision_id` — non-empty, max 200;
- `authorization_id` — non-empty, max 200;
- `task_id` — non-empty, max 200;
- `execution_id` — non-empty, max 200;
- `route_id` — exactly `opencode+qwen_local` in v1;
- `scope_digest` — lowercase hex SHA-256 digest of the exact runtime-authorization scope object, 64 chars;
- `pending_ttl_seconds` — integer 1..900.

The request MUST NOT contain registry path, pending-store path, spend-ledger path, Telegram token, credentials, arbitrary command, endpoint URL, model URL or provider secret.

Server behavior:

1. load/validate server-side issuance config;
2. load/validate pending store;
3. reject duplicate `pending_decision_id`;
4. reject an `authorization_id` already bound by another pending record;
5. reject an `authorization_id` already present in provenance registry;
6. validate route and TTL against server-side maxima;
7. create exactly one durable `PENDING` record with immutable bindings and server-derived `created_at` + `pending_expires_at`;
8. persist atomically via same-directory temp+rename;
9. return bounded structural result only.

Registration never writes the provenance registry or durable spend ledger and never invokes execution code.

## Operation 2 — decide / issue

The issue request carries sanitized human-decision evidence only. Required fields:

- `pending_decision_id`;
- `selected_option` exactly `APPROVE` or `REJECT`;
- `telegram_update_id` non-empty bounded string/integer representation;
- `telegram_chat_id` non-empty bounded string/integer representation;
- `task_id`;
- `execution_id`;
- `route_id` exactly `opencode+qwen_local`;
- `scope_digest`;
- `authorization_expires_at` RFC3339.

No Telegram token or raw callback payload is accepted or persisted.

### Identity and binding verification

Before any state change:

1. load/validate server-side config;
2. `telegram_chat_id` MUST exactly equal configured operator chat id;
3. load pending record by `pending_decision_id`;
4. require state `PENDING`;
5. require pending not expired;
6. task, execution, route and scope digest MUST exactly match the immutable pending bindings;
7. requested authorization expiry MUST be in the future and no later than `now + authorization_ttl_seconds_max`;
8. Telegram update id MUST not already have been consumed by another decision record;
9. pending decision MUST be one-shot.

Mismatch is fail-closed and MUST NOT create ACTIVE registry state.

## APPROVE state transition

For valid `APPROVE`:

1. persist pending `PENDING → APPROVED` with sanitized decision receipt;
2. call the provenance registry owner to append exactly one ACTIVE entry for the pre-bound `authorization_id` with:
   - `route_id = opencode+qwen_local`;
   - server-derived `issued_at`;
   - validated `expires_at`;
   - `spent_at = null`;
3. registry append MUST fail on duplicate authorization id or invalid registry;
4. only after registry persistence succeeds, persist pending `APPROVED → ISSUED`;
5. return bounded `ISSUED` result.

If registry persistence fails after APPROVED persistence, pending remains `APPROVED` and a later exact replay MAY retry the same issuance without changing bindings. It MUST NOT generate a new authorization id. Once registry ACTIVE is found with exact matching id/route/expiry, the owner may converge the pending record to `ISSUED` idempotently.

No durable-spend-ledger write occurs during issuance.

## REJECT state transition

For valid `REJECT`:

- persist `PENDING → REJECTED` with sanitized decision receipt;
- create no provenance registry entry;
- create no durable spend entry;
- perform no execution;
- terminal state: no later APPROVE is accepted.

## Expiry

- default and maximum pending TTL in v1: 15 minutes / 900 seconds;
- default and maximum authorization lifetime in v1: 60 minutes / 3600 seconds;
- no unbounded authorization is valid;
- expired pending transitions to or is treated as terminal `EXPIRED`;
- an issue request received after pending expiry is rejected as `ISSUANCE_EXPIRED`.

## Replay / idempotency

Fail-closed reasons include:

- `ISSUANCE_CONFIG_UNAVAILABLE`
- `ISSUANCE_CONFIG_INVALID`
- `ISSUANCE_PENDING_STORE_UNAVAILABLE`
- `ISSUANCE_PENDING_STORE_INVALID`
- `ISSUANCE_PENDING_NOT_FOUND`
- `ISSUANCE_PENDING_ID_CONFLICT`
- `ISSUANCE_AUTHORIZATION_ID_CONFLICT`
- `ISSUANCE_OPERATOR_IDENTITY_MISMATCH`
- `ISSUANCE_BINDING_MISMATCH`
- `ISSUANCE_EXPIRED`
- `ISSUANCE_DECISION_ALREADY_CONSUMED`
- `ISSUANCE_TELEGRAM_UPDATE_REUSED`
- `ISSUANCE_REGISTRY_UNAVAILABLE`
- `ISSUANCE_REGISTRY_INVALID`
- `ISSUANCE_REGISTRY_WRITE_FAILED`
- `ISSUANCE_ROUTE_NOT_ALLOWED`

Semantics:

- duplicate/stale/malformed callback evidence never issues;
- `REJECTED`, `ISSUED`, `EXPIRED` are terminal;
- exact replay against an `ISSUED` pending may return the same bounded issued result without a second registry append;
- any replay with changed bindings is rejected;
- one Telegram update id cannot decide two pending authorizations.

## HTTP/result semantics

Machine schema: `docs/contracts/v4-runtime-authorization-issuance-v1.schema.json`.

All results are structural and secret-free. No response includes:

- filesystem paths;
- Telegram bot token;
- credential values;
- raw callback payload;
- provenance-registry contents;
- spend-ledger contents;
- model prompt/output;
- stdout/stderr.

A fail-closed issuance result uses `ok=false`, a bounded `classification`, `pending_decision_id` when safely known, `authorization_id` when safely known, state if known, and `reason_codes`.

## Human gate and automation policy

For a proposal classified `human_gate` / `HUMAN_GATE_REQUIRED`, no component may synthesize APPROVE or invoke issuance without explicit verified Telegram operator decision evidence.

Future automation may bypass Telegram only for a separately ratified policy class that explicitly permits machine issuance. This v1 contract does not authorize such auto-issuance.

## Telegram/n8n role

n8n MAY:

- call register-pending;
- present immutable bindings in Telegram;
- receive APPROVE/REJECT callbacks;
- apply the existing allowed-chat/source-chat guard pattern;
- reject duplicate/stale callbacks;
- forward sanitized decision evidence.

n8n MUST NOT:

- write provenance registry JSON;
- write durable spend ledger JSON;
- choose server-side paths;
- mint or replace authorization ids after pending registration;
- alter task/execution/route/scope bindings;
- auto-approve a human-gated proposal.

## Production/runtime apply boundary

Implementation may create the issuance service, empty pending store and user-local config only after offline tests + review PASS. The production provenance registry and durable spend ledger MUST remain empty through implementation/persistence blocks.

No live Telegram message, live ACTIVE issuance, WF40 execution, endpoint execution request, OpenCode call, Qwen generation or provider call is authorized by this contract.

## First live proof shape — later gate only

Future proof, not authorized here:

`1 PENDING → 1 verified Telegram APPROVE → 1 ACTIVE registry entry → 1 WF40 bounded execution → 1 durable ledger spend → registry SPENT → max 1 OpenCode → max 1 Qwen generation`.

## NEXT after contract ratification

`V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE`

# v4-runtime-authorization-issuance-v1

**Authority:** GPT Web  
**Status:** DESIGN CONTRACT — RATIFIED FOR IMPLEMENTATION  
**Runtime authorized by this document:** **NO**  
**Live authorization issuance authorized by this document:** **NO**

## Purpose

Define the sole operator-owned issuance boundary that may create an `ACTIVE` entry in the existing server-side provenance registry. Issuance is separate from execution/spend and MUST remain a different process, port, route, state machine and trust boundary from `tools/serve-v4-windows-local-execution-endpoint-v1.mjs`.

Canonical discovery: `reports/architecture/v4_runtime_authorization_issuance_path_discovery.md`.

### Contract hardening after discovery

The discovery proposed reusing the existing n8n Telegram callback guard as operator-identity evidence. Contract review found that **n8n-forwarded `telegram_chat_id + APPROVE` is not sufficient provenance**, because a compromised/buggy n8n instance could synthesize the same bounded fields.

Therefore v1 hardens the trust boundary:

> for `human_gate` / `HUMAN_GATE_REQUIRED`, the Windows-local issuance owner MUST verify the Telegram decision directly from Telegram using a dedicated issuance bot credential stored user-locally on Windows. n8n may propose and observe status, but MUST NOT attest APPROVE/REJECT.

This supersedes only the Telegram-evidence transport detail from discovery; all pending-store, ACTIVE-writer, expiry, replay and issuance-vs-spend boundaries remain unchanged.

## Ownership

- Proposal transport: n8n MAY register bounded pending proposals.
- Human-gate Telegram UX + inbound verification: **Windows-local issuance owner**, using a dedicated issuance bot and direct Bot API interaction.
- Human identity: exact configured Telegram `chat_id` **and** `from.id` verified server-side from the Telegram update received by the issuance owner.
- Pending decision source of truth: `v4-runtime-authorization-pending-store-v1` on Windows.
- Sole ACTIVE-entry writer: Windows-local issuance owner.
- Provenance ACTIVE/SPENT authority: existing `v4-runtime-authorization-provenance-registry-v1`.
- Durable consumed-id history: existing `v4-runtime-authorization-durable-spend-ledger-v1`; issuance MUST NOT write it.
- Execution endpoint: consumption only; MUST NOT gain issuance APIs.

## Production boundary

Planned service:

- loopback: `127.0.0.1:18792`;
- separate Scheduled Task from execution endpoint;
- additive Tailscale-private API route for proposal/status only, under `/v4/authorization/*`;
- no HTTP route that accepts a human APPROVE/REJECT assertion;
- no Funnel/public exposure.

The service itself owns direct outbound Telegram Bot API calls for the dedicated issuance bot.

Server-side startup config owns and fixes:

- pending store path;
- provenance registry path;
- issuance config path;
- dedicated Telegram bot token/credential reference;
- operator Telegram chat id;
- operator Telegram user id;
- allowed route set;
- bounded TTL maxima.

No HTTP caller can select/override any of those values. The issuance owner MUST NOT accept a spend-ledger path.

## Issuance config

Canonical user-local path:

`%LOCALAPPDATA%\control-plane\v4-runtime-authorization-issuance-config-v1.json`

At minimum:

- `operator_telegram_chat_id`;
- `operator_telegram_user_id`;
- dedicated issuance bot token or server-side credential reference;
- pending store absolute path;
- provenance registry absolute path;
- route allowlist: only `opencode+qwen_local` in v1;
- `pending_ttl_seconds_default = 900`;
- `pending_ttl_seconds_max = 900`;
- `authorization_ttl_seconds_default = 3600`;
- `authorization_ttl_seconds_max = 3600`.

Config is outside Git. Telegram ids/tokens/credentials are redacted from repo evidence.

The dedicated issuance bot MUST NOT simultaneously be owned by an n8n webhook/getUpdates consumer. Telegram update consumption for authorization decisions has one owner: the Windows issuance service.

## HTTP operation 1 — register pending

Schema variant: `v4-runtime-authorization-register-pending-request-v1`.

Required immutable fields:

- `pending_decision_id` — non-empty, max 200;
- `authorization_id` — non-empty, max 200;
- `task_id` — non-empty, max 200;
- `execution_id` — non-empty, max 200;
- `route_id` — exactly `opencode+qwen_local`;
- `scope_digest` — lowercase SHA-256 hex of exact runtime-authorization scope, 64 chars;
- `pending_ttl_seconds` — integer 1..900.

Forbidden caller fields include registry/pending/ledger paths, Telegram token/chat/user ids, credentials, arbitrary command, endpoint/model/provider URLs.

Server behavior:

1. load/validate server-side config;
2. load/validate pending store;
3. reject duplicate pending id;
4. reject authorization id already bound by another pending record;
5. reject authorization id already present in provenance registry;
6. validate route + TTL;
7. create exactly one durable `PENDING` record with server-derived timestamps;
8. persist atomically;
9. send the approval message **directly from Windows via the dedicated Telegram bot**;
10. return bounded structural registration result.

If Telegram send fails, the implementation MUST fail closed. It may preserve the PENDING record with a structural `TELEGRAM_DELIVERY_FAILED` classification, but that record cannot become ISSUED without a later valid direct Telegram callback consumed by the same issuance owner.

Registration never writes provenance ACTIVE or durable spend state and never invokes execution code.

## HTTP operation 2 — status only

Schema variants: `v4-runtime-authorization-status-request-v1` / `...status-result-v1`.

Caller supplies only `pending_decision_id`.

Status may expose bounded non-secret state:

- `PENDING | APPROVED | REJECTED | ISSUED | EXPIRED`;
- pre-bound `authorization_id`;
- `pending_expires_at`;
- `authorization_expires_at` when issued/approved;
- reason codes.

Status MUST NOT expose Telegram bot token, operator ids, raw Telegram update, filesystem paths, registry contents, spend-ledger contents or secrets.

n8n may poll status to learn whether the operator decision produced an ISSUED authorization. Status is read-only.

## Direct Telegram decision channel — NOT HTTP-callable

The issuance owner receives Telegram updates directly from the dedicated bot using Bot API polling (or another direct Telegram transport ratified later). The implementation exposes an internal/testable handler but **no `/issue` HTTP endpoint for human-gated v1**.

Expected callback namespace:

`ra:<pending_decision_id>:approve|reject`

Before any state change the owner verifies from the Telegram update itself:

1. update originates from the dedicated bot channel consumed directly by this service;
2. callback query exists and is structurally valid;
3. `message.chat.id` exactly equals configured operator chat id;
4. `from.id` exactly equals configured operator user id;
5. callback pending id exists and is `PENDING`;
6. pending is not expired;
7. callback option is exactly approve/reject;
8. Telegram `update_id` has not already decided another pending record;
9. pending decision is one-shot.

No caller-provided chat/user identity is trusted.

## APPROVE transition

For a valid direct Telegram APPROVE:

1. server chooses `authorization_expires_at = now + authorization_ttl_seconds_default`, capped by max;
2. persist pending `PENDING → APPROVED` with sanitized receipt:
   - server-observed `telegram_update_id`;
   - server-observed `telegram_chat_id`;
   - server-observed `telegram_user_id`;
   - `decision_at`;
   - selected option;
   - authorization expiry;
3. call provenance owner to append exactly one ACTIVE entry for pre-bound authorization id;
4. registry append fails closed on duplicate/invalid/unavailable;
5. after registry persistence succeeds, persist `APPROVED → ISSUED` with `issued_at`;
6. bounded status/result becomes ISSUED.

If registry persistence fails after APPROVED persistence, pending remains APPROVED. A later internally-triggered exact reconciliation may retry only the same pre-bound id/bindings; it cannot mint a replacement id. If matching ACTIVE registry state is already present, the owner may converge to ISSUED idempotently.

No spend-ledger write occurs during issuance.

## REJECT transition

Valid direct Telegram REJECT:

- persist `PENDING → REJECTED` with sanitized server-observed receipt;
- no registry ACTIVE entry;
- no durable spend entry;
- no execution;
- terminal; later APPROVE ignored/rejected.

## Pending-store / authorization expiry

- pending default/max: 900 seconds;
- authorization default/max: 3600 seconds;
- expired pending cannot be decided/issued;
- no unbounded authorization;
- expiry is server-derived, not caller-selected in human-gated v1.

## Replay / idempotency

Fail-closed reason codes include:

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
- `ISSUANCE_TELEGRAM_UPDATE_INVALID`
- `ISSUANCE_TELEGRAM_DELIVERY_FAILED`
- `ISSUANCE_TELEGRAM_TRANSPORT_UNAVAILABLE`
- `ISSUANCE_REGISTRY_UNAVAILABLE`
- `ISSUANCE_REGISTRY_INVALID`
- `ISSUANCE_REGISTRY_WRITE_FAILED`
- `ISSUANCE_ROUTE_NOT_ALLOWED`

Semantics:

- duplicate/stale/malformed Telegram update never issues;
- wrong chat or user id never issues;
- `REJECTED`, `ISSUED`, `EXPIRED` terminal;
- exact ISSUED status replay never appends registry again;
- one Telegram update id decides at most one pending record;
- service restart preserves pending lifecycle; Telegram offset/update replay must remain fail-closed using durable consumed update ids in pending records.

## Machine schemas

`docs/contracts/v4-runtime-authorization-issuance-v1.schema.json`

Covers only external API messages:

- register-pending request/result;
- status request/result.

Human decision input is direct Telegram transport and is not modeled as an externally trusted HTTP issuance request.

## Human gate / automation policy

For `human_gate` / `HUMAN_GATE_REQUIRED`, only the direct verified Telegram decision path can issue.

Future machine issuance requires a separate ratified contract/policy and is not authorized by v1.

## n8n role

n8n MAY:

- create bounded proposal values;
- call register-pending;
- poll/read bounded status;
- after ISSUED, transport the already pre-bound runtime authorization into the existing execution path.

n8n MUST NOT:

- send or attest APPROVE/REJECT to the issuance owner;
- receive the dedicated issuance bot callbacks;
- possess the dedicated issuance bot token;
- write provenance registry or spend ledger;
- choose server-side paths;
- alter pending bindings;
- auto-approve human-gated proposals.

## Implementation boundary

`V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE` is **offline only**:

- tools + tests + direct-Telegram client abstraction/DI;
- no production pending store/config/service;
- no real Telegram Bot API call;
- no Tailscale route;
- no ACTIVE entry;
- no WF40 execution.

A later persistence/setup block must be separately authorized because it requires a dedicated issuance bot credential and operator ids.

## First live proof — later gate only

Future chain:

`1 PENDING → direct Windows-owned Telegram message → 1 verified operator callback → 1 ACTIVE → 1 WF40 bounded execution → 1 durable spend → registry SPENT → max 1 OpenCode → max 1 Qwen generation`.

## NEXT

`V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE`

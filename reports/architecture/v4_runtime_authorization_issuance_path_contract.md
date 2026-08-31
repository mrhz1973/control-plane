# V4 runtime authorization issuance path — contract ratification

**Block:** `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_CONTRACT`  
**Authority:** GPT Web  
**Result:** **PASS — CONTRACTS RATIFIED + TRUST BOUNDARY HARDENED, NOT IMPLEMENTED**  
**Live issuance:** 0  
**Live execution:** 0

## Inputs

- `reports/architecture/v4_runtime_authorization_issuance_path_discovery.md`
- `docs/contracts/v4-runtime-authorization-provenance-registry-v1.md`
- `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.md`
- `docs/contracts/v4-windows-local-execution-endpoint-v1.md`

## Ratified contracts

1. `docs/contracts/v4-runtime-authorization-issuance-v1.md`
2. `docs/contracts/v4-runtime-authorization-issuance-v1.schema.json`
3. `docs/contracts/v4-runtime-authorization-pending-store-v1.md`
4. `docs/contracts/v4-runtime-authorization-pending-store-v1.schema.json`

## Contract-review hardening

The discovery correctly required a Windows-local sole ACTIVE writer, but its suggested `wf47 -> sanitized Telegram close evidence -> Windows issue` transport left one residual trust gap: n8n could synthetically reproduce `chat_id + APPROVE` fields.

The ratified v1 contract closes that gap:

- a dedicated authorization Telegram bot is owned by the Windows issuance service;
- bot credential + operator chat/user ids live user-locally on Windows;
- Windows sends approval messages directly via Telegram Bot API;
- Windows consumes callback updates directly;
- both `message.chat.id` and `from.id` are verified server-side;
- n8n has **no HTTP issue/approve capability** and does not possess the dedicated bot token;
- n8n may only register pending proposals and poll bounded status.

Thus `AI/n8n may propose; only the verified human callback may approve` is enforced by ownership rather than by trusting forwarded metadata.

## Ratified architecture

```text
n8n / operator proposal
  -> Tailscale-private register-pending
  -> Windows-local issuance owner
  -> durable pending store A: PENDING
  -> Windows-owned dedicated Telegram bot sends APPROVE / REJECT
  -> Windows issuance owner directly consumes Telegram callback
  -> verify configured chat_id + from.id + pending one-shot binding
       APPROVE -> APPROVED -> provenance registry ACTIVE -> ISSUED
       REJECT  -> REJECTED -> no registry write
  -> n8n may poll bounded status
  -> later normal execution endpoint
       durable spend ledger -> registry SPENT -> adapter
```

## Hard ownership boundaries

- n8n: proposal + register/status transport only.
- Telegram decision transport: Windows issuance owner directly.
- Pending store: Windows-local source of truth for decision lifecycle.
- Issuance owner: sole ACTIVE-entry writer.
- Provenance registry: ACTIVE/SPENT authority.
- Durable spend ledger: execution-time consumed-id history only.
- Execution endpoint: consumption only; no issuance surface.

## v1 bounds

- route: `opencode+qwen_local` only;
- pending TTL default/max: 900 seconds;
- authorization TTL default/max: 3600 seconds;
- one pending decision -> one authorization id;
- one direct Telegram update id -> at most one decision;
- exact configured operator chat id + user id required;
- terminal pending states: `ISSUED`, `REJECTED`, `EXPIRED`;
- no auto-approval for `human_gate` / `HUMAN_GATE_REQUIRED`.

## Planned production surface — not applied

- loopback issuance service: recommended `127.0.0.1:18792`;
- separate Scheduled Task;
- Tailscale-private `/v4/authorization/*` for register/status only;
- direct outbound Telegram Bot API from Windows;
- dedicated issuance bot credential stored only user-locally;
- user-local pending store + issuance config;
- existing registry used for ACTIVE append;
- no Funnel/public exposure.

## Implementation boundary

The next block is **offline only**. It may implement tools, schemas/tests and an injected Telegram client abstraction, but it may not:

- create production bot credentials/config;
- call real Telegram;
- create production pending store/service;
- add Tailscale route;
- issue ACTIVE authorization;
- execute WF40/OpenCode/Qwen.

A later persistence/setup block will require the real dedicated Telegram bot/operator identity setup.

## Zero-live accounting

- registry mutations: 0
- spend-ledger mutations: 0
- pending production state: 0
- HTTP execution requests: 0
- WF40/WF61 executions: 0
- OpenCode: 0
- Qwen generations: 0
- provider calls: 0
- Telegram messages: 0
- n8n mutations: 0

## NEXT

`V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE`

# V4 runtime authorization issuance path — contract ratification

**Block:** `V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_CONTRACT`  
**Authority:** GPT Web  
**Result:** **PASS — CONTRACTS RATIFIED, NOT IMPLEMENTED**  
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

## Ratified architecture

```text
proposal
  -> Windows-local issuance owner register-pending
  -> durable pending store A: PENDING
  -> Telegram explicit APPROVE / REJECT
  -> Windows-local issuance owner verifies server-side operator identity + immutable bindings
       APPROVE -> pending APPROVED -> provenance registry ACTIVE -> pending ISSUED
       REJECT  -> pending REJECTED -> no registry write
  -> later normal execution endpoint
       durable spend ledger -> registry SPENT -> adapter
```

## Hard ownership boundaries

- n8n/Telegram: proposal, UX, callback guard, bounded evidence transport only.
- Pending store: Windows-local source of truth for human-decision lifecycle.
- Issuance owner: sole ACTIVE-entry writer.
- Provenance registry: ACTIVE/SPENT authorization authority.
- Durable spend ledger: execution-time consumed-id history only; never written at issuance.
- Execution endpoint: consumption only; no issuance surface.

## v1 bounds

- route: `opencode+qwen_local` only;
- pending TTL default/max: 900 seconds;
- authorization TTL default/max: 3600 seconds;
- one pending decision -> one authorization id;
- one Telegram update id -> at most one decision;
- terminal pending states: `ISSUED`, `REJECTED`, `EXPIRED`;
- no auto-approval for `human_gate` / `HUMAN_GATE_REQUIRED`.

## Planned production surface — not applied

- loopback issuance service: recommended `127.0.0.1:18792`;
- separate Scheduled Task;
- Tailscale-private `/v4/authorization/*` route;
- user-local pending store + issuance config;
- existing registry used for ACTIVE append;
- no Funnel/public exposure.

## Zero-live accounting

- registry mutations: 0
- spend-ledger mutations: 0
- pending production state: not created in this contract pass
- HTTP execution requests: 0
- WF40/WF61 executions: 0
- OpenCode: 0
- Qwen generations: 0
- provider calls: 0
- Telegram messages: 0
- n8n mutations: 0

## NEXT

`V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_IMPLEMENTATION_OFFLINE`

Implementation must remain closed to live issuance/execution until offline tests + review pass and a separately bounded persistence/apply boundary are satisfied.

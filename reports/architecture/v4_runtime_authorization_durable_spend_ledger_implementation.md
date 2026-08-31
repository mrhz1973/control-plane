# V4 runtime authorization durable spend ledger — implementation

**Block:** `V4_RUNTIME_AUTHORIZATION_DURABLE_SPEND_LEDGER_IMPLEMENTATION`  
**Category:** SECURITY_RUNTIME_INTEGRATION  
**Result:** PASS  
**Dispatch base head:** `9635bf4cea0e4553624ec185fc06676d302365be`

## Contract refs

- `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.md`
- `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.schema.json`
- Minimal reconciliation: `docs/contracts/v4-windows-local-execution-endpoint-v1.md` §8.0
- Minimal reconciliation: `docs/contracts/v4-runtime-authorization-provenance-registry-v1.md` ownership split

Request/response JSON schemas: **unchanged**.

## Tool

`tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs`

Exports: `validateSpendLedgerObject`, `loadSpendLedger`, `inspectDurableSpend`, `persistSpendLedger`, `recordDurableSpend`. Append-only; atomic temp+rename; no issuance/delete/compaction API. `route_id` not const-pinned; `authorization_id` globally unique.

## Admission order (endpoint)

After HTTP schema validation in `tools/serve-v4-windows-local-execution-endpoint-v1.mjs`:

1. `execution_id` replay-cache  
2. durable spend ledger load/inspect  
3. already spent → `AUTHORIZATION_REJECTED` / `AUTHORIZATION_ALREADY_SPENT`  
4. provenance registry inspect (ACTIVE/unexpired/route)  
5. authBinding conflict  
6. global single-flight  
7. ledger persist `ADMISSION_CONSUMED`  
8. registry ACTIVE→SPENT  
9. adapter  

Mandatory CLI: `--authorization-registry` + `--authorization-spend-ledger` (absolute paths).

## Ledger-first / partial-failure proof

| Case | Result |
|---|---|
| Ledger persist fail | registry ACTIVE; adapter=0 |
| Ledger pass + registry persist fail | ledger durable; no rollback; adapter=0 |
| Retry after partial failure | `AUTHORIZATION_ALREADY_SPENT` from ledger |
| Order spy | ledger → registry → adapter |

## Target results

| Suite | Result |
|---|---|
| `tests/v4-runtime-authorization-durable-spend-ledger/run.mjs` | **13/13 PASS** |
| `tests/v4-windows-local-execution-endpoint/run.mjs` | **61/61 PASS** (P1–P17 + L13–L25) |

## Regressions

| Suite | Result |
|---|---|
| opencode-execution-adapter | 23/23 PASS |
| opencode-single-generation-guard | 16/16 PASS |
| v4-local-runtime-readonly-contribution | 29/29 PASS |
| v4-local-runtime-readonly-private-endpoint | 22/22 PASS |
| `git diff --check` | PASS |

## BugBot

PASS_NO_FINDINGS (uncommitted changes review, once).

## Runtime apply

| Step | Result |
|---|---|
| Production ledger `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-spend-ledger-v1.json` | created empty (`spends=[]`); no backfill |
| Production registry | `entries=[]` |
| Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` | both `--authorization-registry` and `--authorization-spend-ledger` absolute paths |
| Restart | execution task only |
| Listener `127.0.0.1:18791` | exactly one; command line verified |
| Tailscale routes | root/execution/readonly preserved; Funnel absent |
| Readonly task `18790` | unchanged |
| Endpoint HTTP requests | **0** |
| WF40/WF61 executions | **0** |
| OpenCode / Qwen / provider | **0** |
| Authorization issuance / production spends | **0** |

## Safety

- WF40 = 71 unchanged  
- WF61 inactive  
- D-0025 CLOSED  
- Live execution: **CLOSED TO LIVE EXECUTION**

## NEXT

`V4_RUNTIME_AUTHORIZATION_ISSUANCE_PATH_DISCOVERY`

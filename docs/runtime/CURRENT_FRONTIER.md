# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source lanes **APPLIED LIVE (56 nodes)** · RESOURCE_STATUS composer **OFFLINE COMPLETE** · local read-only contribution adapter **COMPLETE** · GPT-Web WF40 local-status patch **AUTHORED / NOT APPLIED** · private endpoint implementation local/uncommitted |
| **BLOCCO ATTIVO** | `V4_LOCAL_RUNTIME_READONLY_RESPONSE_CLOSE_GUARD_CORRECTION_ONE_PASS` |
| **STATO BLOCCO** | ENDPOINT_LOCAL_UNCOMMITTED / TARGET_TEST1_PASS / TARGET_TEST2_HUNG / HTTP_CLOSE_GUARD_DEFECT_OPERATOR_RELAYED / REGRESSIONS_NOT_RUN / RUNTIME_UNTOUCHED / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no Qwen/OpenCode/provider generation authorized · corrective pass may change only the endpoint premature-disconnect guard from request-scoped close handling to response-scoped close handling with `!res.writableEnded` |
| **NEXT** | `V4_LOCAL_RUNTIME_READONLY_RESPONSE_CLOSE_GUARD_CORRECTION_ONE_PASS` — preserve current uncommitted endpoint block, sync canonical remote docs, restore endpoint artifacts only, apply exactly one HTTP lifecycle correction in `createLocalRuntimeStatusHandler`, then target once; if PASS run required regressions once and continue the original private endpoint runtime proof exactly once. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **56 nodes** · versionId `ef80943e-535d-430f-958f-56c03baa1c62` · local-status patch not applied |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · offline complete · target 34/34 PASS |
| **LOCAL READONLY CONTRIBUTION ADAPTER** | `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs` · committed · target 29/29 · single diagnostic bind · live proof PASS |
| **PRIVATE ENDPOINT CONTRACT** | `docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md` · GPT-Web authored |
| **WF40 LOCAL STATUS PATCH** | `workflows/patches/v4-wf40-local-resource-status-contribution.gpt-web.json` · GPT-Web authored · **not applied** · expected 56→61 |
| **PRIVATE ENDPOINT STOP EVIDENCE** | `reports/architecture/v4_local_runtime_readonly_private_endpoint_target_hang_stop_operator_relay.md` · operator-relayed / not independently verified |

## Reported endpoint STOP

- Target suite started once.
- Test 1 (bind) passed.
- Test 2 (`valid GET returns producer wrapper`) hung with no response.
- Reported defect: `req.on("close")` marks the handler settled when the request message closes, before async producer evaluation resolves; the later success path then suppresses `send(200, ...)`.
- Reported minimal correction: use response-scoped `res.on("close")` and release only on premature client loss (`!res.writableEnded`).
- No corrective edit or rerun occurred after the hang.
- Regressions not run.
- Scheduled task not created; Tailscale Serve not changed; port 18790 reported free; existing OpenClaw root route preserved.
- Zero producer evaluations / diagnostics / generations reported.

## Corrective boundary

The corrective pass may modify only the premature-disconnect lifecycle handling inside local uncommitted `createLocalRuntimeStatusHandler`.

Do not change producer semantics, endpoint route/method contract, in-flight policy, Qwen/OpenCode logic, Tailscale design, tests, schemas, WF40 patch, workflows, composer or standing runtime authorization unless the reported diagnosis proves false; if false, STOP.

After correction:

1. target exactly once;
2. if PASS, endpoint regressions exactly once;
3. if PASS, perform the original bounded Windows persistence + additive Tailscale Serve path + one VPS GET proof;
4. no repeated endpoint request or proof loop.

## Safety boundary

- no Qwen generation/HTTP inference;
- no Qwen start/restart/stop/kill;
- no OpenCode CLI invocation/execution;
- no provider calls;
- no public Funnel/public Internet exposure;
- one accepted producer request = one evaluation / one diagnostic PowerShell;
- raw process/socket/PID evidence ephemeral and unpersisted;
- WF40 local-status patch remains unapplied until endpoint proof PASS.

## Puntatori

- Endpoint STOP relay: `reports/architecture/v4_local_runtime_readonly_private_endpoint_target_hang_stop_operator_relay.md`
- Endpoint contract: `docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md`
- GPT-Web WF40 patch: `workflows/patches/v4-wf40-local-resource-status-contribution.gpt-web.json`
- Producer: `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs`
- Composer: `tools/compose-v4-resource-status-control-plane-v1.mjs`
- Qwen standing constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Windows fallback/Tailscale evidence: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_STATUS.md`
- WF40 id: `9ZMj2ACTKyDVhCue`

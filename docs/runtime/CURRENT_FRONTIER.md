# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source lanes **APPLIED LIVE (56 nodes)** · RESOURCE_STATUS composer **OFFLINE COMPLETE** · local read-only contribution adapter **COMPLETE** · GPT-Web WF40 local-status patch **AUTHORED / NOT APPLIED** · private endpoint implementation local/uncommitted |
| **BLOCCO ATTIVO** | `V4_LOCAL_RUNTIME_READONLY_TEST_PORT_ISOLATION_CORRECTION_ONE_PASS` |
| **STATO BLOCCO** | ENDPOINT_LOCAL_UNCOMMITTED / RESPONSE_CLOSE_FIX_DIRTY / TARGET_STOP_EADDRINUSE_TEST_PORT_18799_OPERATOR_RELAYED / REGRESSIONS_NOT_RUN / RUNTIME_UNTOUCHED / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no Qwen/OpenCode/provider generation authorized · next corrective pass may modify only the endpoint test-harness bind if local inspection confirms fixed test port `18799` is the sole cause |
| **NEXT** | `V4_LOCAL_RUNTIME_READONLY_TEST_PORT_ISOLATION_CORRECTION_ONE_PASS` — preserve current dirty endpoint block and response-close fix; sync canonical remote; verify target suite uses fixed test port `18799`; if confirmed, replace only the test bind with OS-assigned ephemeral port `0` (or equivalent test-only ephemeral helper), leaving production default `18790` unchanged. Then target once; if PASS regressions once; if PASS continue original Windows persistence + additive Tailscale Serve path + one VPS GET proof. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **56 nodes** · versionId `ef80943e-535d-430f-958f-56c03baa1c62` · local-status patch not applied |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · offline complete · target 34/34 PASS |
| **LOCAL READONLY CONTRIBUTION ADAPTER** | `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs` · committed · target 29/29 · single diagnostic bind · live proof PASS |
| **PRIVATE ENDPOINT CONTRACT** | `docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md` · GPT-Web authored |
| **WF40 LOCAL STATUS PATCH** | `workflows/patches/v4-wf40-local-resource-status-contribution.gpt-web.json` · GPT-Web authored · **not applied** · expected 56→61 |
| **LATEST STOP EVIDENCE** | `reports/architecture/v4_local_runtime_readonly_private_endpoint_test_port_eaddrinuse_stop_operator_relay.md` · operator-relayed / not independently verified |

## Latest reported STOP

- The shell exit `4294967295` was the already-known force-stop of the previous hung target suite, not a new runtime failure.
- In the response-close corrective pass, the close-guard fix remained local/dirty.
- The new target run stopped with `EADDRINUSE` on fixed **test port 18799**.
- Production port **18790** and test port **18799** were reported clear after STOP.
- Regressions were not run.
- Scheduled task was not created; Tailscale Serve was not changed; WF40 patch remains unapplied.
- Preservation stash `v4-private-endpoint-target-hang-preserve` remains kept.

## Corrective boundary

The next pass must inspect the local test harness before editing.

If and only if the target suite binds a hard-coded test port `18799` and the production endpoint already accepts injected bind ports, the only authorized correction is test-only port isolation:

- replace fixed `18799` with port `0` / OS-assigned ephemeral port, or an equivalent deterministic test helper;
- derive the actual bound port from the server after `listen`;
- keep production default `127.0.0.1:18790` unchanged;
- keep the response-close production fix unchanged;
- do not change endpoint semantics, producer logic, Qwen/OpenCode behavior, Tailscale design, schemas, composer, WF40 patch or workflows.

If that diagnosis is false, STOP without redesign.

After the test-only correction:

1. target exactly once;
2. if PASS, required regressions exactly once;
3. if PASS, original bounded runtime implementation once;
4. one VPS→Windows GET proof only; no retries for prettier classification.

## Safety boundary

- no Qwen generation/HTTP inference;
- no Qwen start/restart/stop/kill;
- no OpenCode CLI invocation/execution;
- no provider calls;
- no public Funnel/public Internet exposure;
- production endpoint remains loopback `127.0.0.1:18790`;
- WF40 local-status patch remains unapplied until endpoint proof PASS.

## Puntatori

- Latest STOP relay: `reports/architecture/v4_local_runtime_readonly_private_endpoint_test_port_eaddrinuse_stop_operator_relay.md`
- Endpoint contract: `docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md`
- GPT-Web WF40 patch: `workflows/patches/v4-wf40-local-resource-status-contribution.gpt-web.json`
- Producer: `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs`
- Composer: `tools/compose-v4-resource-status-control-plane-v1.mjs`
- Qwen standing constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Windows fallback/Tailscale evidence: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_STATUS.md`
- WF40 id: `9ZMj2ACTKyDVhCue`

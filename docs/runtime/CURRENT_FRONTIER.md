# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source lanes **APPLIED LIVE (56 nodes)** · RESOURCE_STATUS composer **OFFLINE COMPLETE** · local read-only contribution adapter **COMPLETE** · private local-readonly endpoint **LIVE / TAILSCALE PRIVATE** · GPT-Web WF40 local-status patch **AUTHORED / NOT APPLIED** |
| **BLOCCO ATTIVO** | `V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_APPLY_OFFLINE` |
| **STATO BLOCCO** | PRIVATE_ENDPOINT_PASS / TARGET_22_OF_22 / REGRESSIONS_PASS / SCHEDULED_TASK_LIVE / TAILSCALE_PATH_LIVE / VPS_REACHABLE_PASS / DIAGNOSTIC_PS_1 / GENERATIONS_0 / PUBLIC_EXPOSURE_0 / WF40_PATCH_PENDING |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no Qwen/OpenCode/provider generation authorized · private endpoint reachability proven · WF40 local-status patch apply is next authorized structural step |
| **NEXT** | `V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_APPLY_OFFLINE` — apply verbatim GPT-Web artifact `workflows/patches/v4-wf40-local-resource-status-contribution.gpt-web.json` (expected 56→61). Do not redesign. Structural proof only; no workflow execution for validation. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **56 nodes** · versionId `ef80943e-535d-430f-958f-56c03baa1c62` · local-status patch not applied |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · offline complete · target 34/34 PASS |
| **LOCAL READONLY CONTRIBUTION ADAPTER** | `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs` · committed · target 29/29 · single diagnostic bind · live proof PASS |
| **PRIVATE ENDPOINT** | `tools/serve-v4-local-runtime-readonly-contribution-v1.mjs` · loopback `127.0.0.1:18790` · task `ControlPlane-V4-LocalRuntimeStatus` · URL `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` · VPS proof PASS |
| **PRIVATE ENDPOINT CONTRACT** | `docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md` · GPT-Web authored |
| **WF40 LOCAL STATUS PATCH** | `workflows/patches/v4-wf40-local-resource-status-contribution.gpt-web.json` · GPT-Web authored · **not applied** · expected 56→61 |

## Installed execution-routing seam

```text
same-commit GPT-Web route source
  -> deterministic sidecar-source adapter
  -> explicit execution_route_request + resource_status
  -> WF61 planner
  -> V4 execution-routing bridge
  -> route/adapter metadata only
```

No executor dispatch is wired downstream yet.

## Live private local RESOURCE_STATUS transport

```text
IF remote planner TRUE
  -> Tailscale-private local contribution endpoint (LIVE)
  -> deterministic RESOURCE_STATUS composer
  -> explicit resource_status
  -> existing same-commit route-source fetch
  -> existing sidecar-source lane
  -> WF61
  -> existing V4 routing bridge
```

Endpoint failure is nonblocking but fail-closed: zero contributions are composed into canonical unavailable status. No local availability is inferred.

Canonical private URL:

`https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly`

OpenClaw root preserved:

`https://asusdesktop.tailc01234.ts.net/` → `127.0.0.1:18789`

## Safety boundary

- no Qwen generation/HTTP inference;
- no Qwen start/restart/stop/kill;
- no OpenCode CLI invocation/execution;
- no provider calls;
- endpoint accepts no command/model/profile selector;
- one request must cause at most one producer evaluation and one diagnostic PowerShell process;
- raw process/socket/PID evidence remains ephemeral and unpersisted;
- WF40 patch apply is the next block; not authorized until that block starts.

## Puntatori

- Endpoint report: `reports/architecture/v4_local_runtime_readonly_private_endpoint_implementation.md`
- Endpoint contract: `docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md`
- GPT-Web WF40 patch: `workflows/patches/v4-wf40-local-resource-status-contribution.gpt-web.json`
- Patch authoring report: `reports/architecture/v4_resource_status_wf40_local_contribution_patch_authoring.md`
- Adapter report: `reports/architecture/v4_resource_status_local_runtime_readonly_contribution_adapter.md`
- Adapter contract: `docs/contracts/v4-local-runtime-readonly-contribution-adapter-v1.md`
- Producer: `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs`
- Endpoint: `tools/serve-v4-local-runtime-readonly-contribution-v1.mjs`
- Composer: `tools/compose-v4-resource-status-control-plane-v1.mjs`
- Qwen standing constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Windows fallback/Tailscale evidence: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_STATUS.md`
- WF40 id: `9ZMj2ACTKyDVhCue`

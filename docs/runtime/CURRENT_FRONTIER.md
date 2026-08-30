# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing + sidecar-source lanes **APPLIED LIVE (56 nodes)** · RESOURCE_STATUS composer **OFFLINE COMPLETE** · local read-only contribution adapter **COMPLETE** · GPT-Web WF40 local-status patch **AUTHORED / NOT APPLIED** |
| **BLOCCO ATTIVO** | `V4_LOCAL_RUNTIME_READONLY_PRIVATE_ENDPOINT_IMPLEMENTATION` |
| **STATO BLOCCO** | LOCAL_ADAPTER_COMPLETE / TARGET_29_OF_29 / REGRESSIONS_PASS / DIAGNOSTIC_PS_1 / LIVE_READONLY_PASS / PRIVATE_ENDPOINT_CONTRACT_AUTHORED / WF40_PATCH_AUTHORED_56_TO_61 / ENDPOINT_RUNTIME_PENDING / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no Qwen/OpenCode/provider generation authorized · WF40 local-status patch MUST NOT be applied until private endpoint implementation + VPS reachability proof pass |
| **NEXT** | `V4_LOCAL_RUNTIME_READONLY_PRIVATE_ENDPOINT_IMPLEMENTATION` — implement the deterministic Windows read-only contribution endpoint reserved at `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly`, private Tailscale only, preserving existing OpenClaw root route. One request = one producer evaluation / one diagnostic PowerShell; zero generation/OpenCode CLI/process mutation. After PASS, AUTO-VIA to `V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_APPLY_OFFLINE`. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **56 nodes** · versionId `ef80943e-535d-430f-958f-56c03baa1c62` · local-status patch not applied |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **RESOURCE_STATUS COMPOSER** | `tools/compose-v4-resource-status-control-plane-v1.mjs` · offline complete · target 34/34 PASS |
| **LOCAL READONLY CONTRIBUTION ADAPTER** | `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs` · committed · target 29/29 · single diagnostic bind · live proof PASS |
| **PRIVATE ENDPOINT CONTRACT** | `docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md` · GPT-Web authored · implementation pending |
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

## Authored local RESOURCE_STATUS extension

Planned lane after endpoint proof + patch apply:

```text
IF remote planner TRUE
  -> Tailscale-private local contribution endpoint
  -> deterministic RESOURCE_STATUS composer
  -> explicit resource_status
  -> existing same-commit route-source fetch
  -> existing sidecar-source lane
  -> WF61
  -> existing V4 routing bridge
```

Endpoint failure is nonblocking but fail-closed: zero contributions are composed into canonical unavailable status. No local availability is inferred.

## Private transport decision

The producer is a Windows-local CLI/library while n8n/WF40 runs on the VPS, so direct n8n Execute Command cannot truthfully run the Windows producer. GPT Web therefore defined a deterministic private transport seam on the already-proven Windows Tailscale host.

Canonical reserved URL:

`https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly`

The endpoint must preserve the existing OpenClaw root route and remain tailnet-only. Public Funnel/public Internet exposure is forbidden.

## Safety boundary

- no Qwen generation/HTTP inference;
- no Qwen start/restart/stop/kill;
- no OpenCode CLI invocation/execution;
- no provider calls;
- endpoint accepts no command/model/profile selector;
- one request must cause at most one producer evaluation and one diagnostic PowerShell process;
- raw process/socket/PID evidence remains ephemeral and unpersisted;
- WF40 patch apply forbidden until endpoint private-only reachability + safety proof passes.

## Puntatori

- Endpoint contract: `docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md`
- GPT-Web WF40 patch: `workflows/patches/v4-wf40-local-resource-status-contribution.gpt-web.json`
- Patch authoring report: `reports/architecture/v4_resource_status_wf40_local_contribution_patch_authoring.md`
- Adapter report: `reports/architecture/v4_resource_status_local_runtime_readonly_contribution_adapter.md`
- Adapter contract: `docs/contracts/v4-local-runtime-readonly-contribution-adapter-v1.md`
- Producer: `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs`
- Composer: `tools/compose-v4-resource-status-control-plane-v1.mjs`
- Qwen standing constraint: `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- Windows fallback/Tailscale evidence: `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_STATUS.md`
- WF40 id: `9ZMj2ACTKyDVhCue`

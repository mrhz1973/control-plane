# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | WF40 V4 routing lane + sidecar-source lane **APPLIED LIVE (56 nodes)** · next: governed RESOURCE_STATUS producer contract |
| **BLOCCO ATTIVO** | `V4_RESOURCE_STATUS_CONTROL_PLANE_SOURCE_CONTRACT` |
| **STATO BLOCCO** | WF40_56_NODES / SIDECAR_SOURCE_ADAPTER_COMPLETE / SIDECAR_SOURCE_PATCH_APPLIED / RESOURCE_STATUS_SOURCE_CONTRACT_PENDING / GATE_CLOSED |
| **GATE CORRENTE** | **CLOSED** · D-0025 closed · no live OpenCode/Qwen/provider generation authorized · next block is contract authoring only |
| **NEXT** | `V4_RESOURCE_STATUS_CONTROL_PLANE_SOURCE_CONTRACT` — define the governed transient RESOURCE_STATUS producer/composer that can feed the now-installed explicit status seam. Must remain separate from route-source semantics and obey Qwen shared-runtime occupancy rules. Do not implement the producer in this frontier advance. |
| **WF40 LIVE** | active · id `9ZMj2ACTKyDVhCue` · **56 nodes** · versionId `ef80943e-535d-430f-958f-56c03baa1c62` · sidecar-source + routing lanes installed · no downstream executor |
| **WF61 LIVE** | **inactive** · id `d0025-6100-4001-8001-000000000061` · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **N8N ROUTING BRIDGE v1** | **COMMITTED** · explicit sidecars required · `dispatch_prepared=false` · `execution_performed=false` |
| **SIDECAR SOURCE ADAPTER** | **COMMITTED** · `tools/build-v4-execution-routing-sidecars-v1.mjs` · consume-only RESOURCE_STATUS |
| **WF40 SIDECAR SOURCE PATCH** | `workflows/patches/v4-wf40-sidecar-source.gpt-web.json` · **APPLIED** · 50→56 |

## Installed sidecar-source lane

```text
IF remote planner TRUE
  -> same-commit EXECUTION_ROUTE_<task_id>.json fetch
  -> build-v4-execution-routing-sidecars-v1
  -> IF PASS_SIDECARS_READY
       TRUE  -> existing V4 capture -> WF61 -> existing V4 bridge
       FALSE -> terminal sidecar-source gate closed (WF61 unreachable)
```

- Route source is GPT-Web-authored and same-commit bound.
- `technical_requirements` are never synthesized in WF40.
- Explicit upstream `resource_status` may be passed; otherwise adapter uses fail-closed baseline.
- No status collector is invoked by the installed patch.

## Authorization / D-0025

- D-0025: **CLOSED**.
- No live OpenCode/Qwen/provider call authorized.
- Existing `collect-qwen-local-resource-status-v1.mjs` remains outside the installed patch.
- Any future RESOURCE_STATUS producer must obey Qwen shared-runtime occupancy rules.

## Boundaries

- No WF40/WF61 execution for apply validation (complete).
- Do not implement RESOURCE_STATUS producer until its contract is authored.
- No separate V4 n8n workflow.
- No LiteLLM/OpenClaw/network/secret mutation.
- Existing external single-generation guard remains the future hard max-one generation boundary.

## Puntatori

- Apply report: `reports/architecture/v4_wf40_sidecar_source_patch_apply_offline.md`
- GPT-Web patch: `workflows/patches/v4-wf40-sidecar-source.gpt-web.json`
- Authoring report: `reports/architecture/v4_wf40_sidecar_source_patch_authoring.md`
- Source contract: `docs/contracts/v4-execution-route-sidecar-source-v1.md`
- Source adapter: `tools/build-v4-execution-routing-sidecars-v1.mjs`
- Existing WF40 routing patch: `workflows/patches/v4-wf40-execution-routing-bridge.gpt-web.json`
- WF40 id: `9ZMj2ACTKyDVhCue`
- WF61 id: `d0025-6100-4001-8001-000000000061`

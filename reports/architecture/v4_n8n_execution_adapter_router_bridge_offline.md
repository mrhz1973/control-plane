# V4 — n8n execution-adapter-router bridge (offline)

**Task:** `V4_N8N_EXECUTION_ADAPTER_ROUTER_BRIDGE_OFFLINE`  
**Date:** 2026-08-31  
**Status:** **PASS** — live-incapable bridge · EXECUTION_PERFORMED=0  
**Starting HEAD:** `8555ecf297de74281267df33afe4e35a30d2fff9`

## Artifacts

| Role | Path |
|---|---|
| Contract | `docs/contracts/n8n-v4-execution-adapter-router-bridge-v1.md` |
| Result schema | `docs/contracts/n8n-v4-execution-adapter-router-bridge-v1.schema.json` |
| Bridge tool | `tools/n8n-v4-execution-adapter-router-bridge-v1.mjs` |
| Tests | `tests/n8n-v4-execution-adapter-router-bridge/run.mjs` |

## Behavior

Delegates exclusively to `routeToExecutionAdapter()` and the canonical execution-adapter registry. Does not duplicate route selection, registry lookup, dispatch validation, or authorization validation.

CLI:

`node tools/n8n-v4-execution-adapter-router-bridge-v1.mjs --input-b64 <base64-json>`

Optional `dispatch_result` / `runtime_authorization` are forwarded only when present as objects. Null/absent values are not synthesized. Live-callback keys (`getOccupancy`, `guardStart`, `runOpenCode`) are never forwarded.

If the delegated router reports `execution_performed=true`, the bridge fail-closes as `UNEXPECTED_LIVE_EXECUTION` with top-level `execution_performed=false`.

## Tests

| Suite | Result |
|---|---|
| n8n-v4-execution-adapter-router-bridge | **17/17 PASS** |
| v4-execution-adapter-router | **15/15 PASS** |
| v4-execution-adapter-registry | **19/19 PASS** |
| opencode-execution-adapter | **23/23 PASS** |

Proven boundaries include: no-dispatch → `DISPATCH_NOT_READY`; dispatch without auth → `AUTHORIZATION_REJECTED`; valid auth without occupancy → `OCCUPANCY_BLOCKED`; unexpected live claim → `UNEXPECTED_LIVE_EXECUTION`; CLI malformed/missing → fail-closed.

## Preserved / not done

- WF40 remains **61 nodes**; patch `workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json` **not applied**
- WF61 inactive · D-0025 CLOSED
- No Qwen/OpenCode/provider/network/subprocess execution
- No occupancy/runner/guard callbacks injected by the bridge

## NEXT

`V4_WF40_EXECUTION_ADAPTER_ROUTER_PATCH_APPLY_OFFLINE`

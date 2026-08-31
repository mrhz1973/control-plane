# V4 — WF40 Windows execution transport patch apply (offline)

**Task:** `V4_WF40_EXECUTION_TRANSPORT_PATCH_APPLY_OFFLINE`  
**Date:** 2026-08-31  
**Authority:** GPT-Web artifact applied verbatim by Cursor  
**Status:** **PASS** — 66→71 · exact GPT-Web delta · zero workflow executions · zero endpoint HTTP  
**Starting HEAD / dispatch_base_head:** `7e1907fac599f12cabc253381ee74f241f6b0f54`

| Metric | Value |
|---|---|
| Patch artifact | `workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json` |
| Patch blob SHA | `91c1d98dad708b74a9031baa0784a685160820c6` (unchanged) |
| Patch applied verbatim | **true** |
| WF40 executions | **0** |
| WF61 executions | **0** |
| Endpoint HTTP requests | **0** |
| OpenCode / Qwen / provider calls | **0** |
| Authorization entries created/spent | **0** |
| Registry mutations | **0** |
| Credential mutations | **0** |
| Secret exposure | **false** |
| n8n restart | **not performed** (publish note acknowledged; same as prior apply) |

## Preflight (secret-safe)

| Check | Result |
|---|---|
| WF40 id | `9ZMj2ACTKyDVhCue` |
| Name | `40 - CP v4 multirepo + classifier bridge - ACTIVE` |
| Active | **true** |
| Pre versionId | `60f9b75e-39b8-410a-bcd1-364073992df0` |
| Pre node_count | **66** |
| Parse node terminal before patch | **yes** (`v4f40-7404-4004-8404-000000000404`) |
| Adapter-router gate closed terminal | **yes** (`v4f40-7405-4005-8405-000000000405`) |
| New IDs 7501–7505 pre-exist | **none** |
| WF61 active | **false** · 13 nodes |
| D-0025 gate | `enabled=false` · `provider_calls_authorized_per_event=0` |
| Production authorization registry | valid · `entries=[]` |

## Apply

1. Transformed live WF40 export by applying exact GPT-Web ops (`add_node` ×5, `set_connection_exact` ×4 = 9 ops).
2. `n8n import:workflow` of patched JSON (imported inactive).
3. `n8n publish:workflow --id=9ZMj2ACTKyDVhCue`.
4. Secret-safe structural re-export and comparison.
5. No WF40/WF61/endpoint/OpenCode/Qwen/provider execution used for validation.
6. Runtime gate file **not** modified.
7. Production registry **not** modified.
8. Patch artifact in git **byte-for-byte unchanged**.

## Post-apply structural proof

| Field | Pre | Post |
|---|---|---|
| ID | `9ZMj2ACTKyDVhCue` | **same** |
| Name | unchanged | **same** |
| Active | true | **true** |
| versionId | `60f9b75e-39b8-410a-bcd1-364073992df0` | `e2d600d6-48d9-45fe-9527-3f3e0b47d358` |
| Node count | 66 | **71** |

### Topology

```text
Code - Parse V4 execution adapter router result
  -> Code - Prepare V4 Windows execution transport request
  -> IF - V4 Windows execution transport ready?
       TRUE
         -> HTTP Request - V4 Windows local execution endpoint
         -> Code - Parse V4 Windows execution transport result
       FALSE
         -> Code - V4 Windows execution transport gate closed
```

`Code - V4 execution adapter router gate closed` remains terminal and byte-identity unchanged.

### HTTP node (structural only — not executed)

| Field | Value |
|---|---|
| method | `POST` |
| url | `https://asusdesktop.tailc01234.ts.net/v4/execution/opencode-local` |
| Content-Type | `application/json` |
| body | `={{ JSON.stringify($json.execution_request) }}` |
| credentials | none |
| Authorization header | absent |
| retry/fallback | absent |

### Ready gate (structural fail-closed)

Prepare node requires exact route `opencode+qwen_local`, exact adapter `opencode-execution-adapter-v1`, adapter-router structural result with `execution_performed=false`, `dispatch_supplied=true`, `runtime_authorization_supplied=true`, `DISPATCH_READY`, strict ACTIVE endpoint-compatible authorization, `fast_8k`, max OpenCode=1, max Qwen=1, retry=0, fallback=0, guard required, dflash required, offline boundary `OCCUPANCY_BLOCKED` + `OCCUPANCY_SOURCE_MISSING`, execution_id 1..200, packet.goal 1..4096. Authorization and dispatch are not synthesized.

## New transport nodes

1. `v4f40-7501-4001-8501-000000000501` — Code - Prepare V4 Windows execution transport request  
2. `v4f40-7502-4002-8502-000000000502` — IF - V4 Windows execution transport ready?  
3. `v4f40-7503-4003-8503-000000000503` — HTTP Request - V4 Windows local execution endpoint  
4. `v4f40-7504-4004-8504-000000000504` — Code - Parse V4 Windows execution transport result  
5. `v4f40-7505-4005-8505-000000000505` — Code - V4 Windows execution transport gate closed  

## Preservation

All original 66 node IDs/names/types · adapter-router FALSE gate terminal · local RESOURCE_STATUS · same-commit route-source · routing bridge · adapter-router bridge · OpenClaw · readonly endpoint · Windows execution endpoint/service · Tailscale routes · production registry empty · WF61 inactive · D-0025 CLOSED · LiteLLM · Qwen/OpenCode runtime — preserved.

## NEXT

`V4_RUNTIME_AUTHORIZATION_DURABLE_SPEND_LEDGER` — the current provenance registry is the seed; multi-route durable spend ledger remains a later block and was **not** implemented in this pass.

Gate remains **CLOSED TO LIVE EXECUTION**.

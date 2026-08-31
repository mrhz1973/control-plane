# V4 — WF40 Windows execution transport patch authoring

**Task:** `V4_WF40_EXECUTION_TRANSPORT_PATCH_AUTHORING`  
**Authority:** GPT Web  
**Status:** **PASS — PATCH AUTHORED, NOT APPLIED**  
**Workflow mutations:** 0  
**Endpoint HTTP requests:** 0  
**OpenCode/Qwen/provider calls:** 0

## Result

GPT Web authored the exact additive WF40 delta:

`workflows/patches/v4-wf40-windows-execution-transport.gpt-web.json`

The artifact targets live WF40 `9ZMj2ACTKyDVhCue` at the proven 66-node / versionId `60f9b75e-39b8-410a-bcd1-364073992df0` baseline and adds five nodes only after the existing terminal structural execution-adapter-router result.

## Intended topology

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

The existing `Code - V4 execution adapter router gate closed` path remains terminal and unchanged.

## Fail-closed readiness contract

The transport TRUE path requires all of the following before any HTTP request is allowed:

- existing adapter-router parsed result is structural and `execution_performed=false`;
- exact route `opencode+qwen_local`;
- exact adapter `opencode-execution-adapter-v1`;
- explicit `DISPATCH_READY` sidecar with matching implementer/model/route and `execution_performed=false`;
- explicit `operator-runtime-authorization-v1` sidecar with the **exact strict endpoint request shape** and no extra fields;
- authorization is `ACTIVE`, exact `opencode+qwen_local`, `opencode`, `qwen_local`, `fast_8k`, dflash required, max 1 OpenCode / max 1 Qwen generation, retry 0, fallback 0, guard required;
- the offline adapter-router has reached the expected `OCCUPANCY_BLOCKED` / `OCCUPANCY_SOURCE_MISSING` boundary, proving dispatch readiness and authorization-shape validation without performing execution;
- existing execution_id is non-empty and <=200;
- unchanged WF61 packet goal is non-empty and <=4096 and becomes the endpoint `message`.

The workflow does **not** synthesize dispatch or authorization and does not issue/mutate server-side provenance entries.

## Transport contract

Fixed endpoint:

`https://asusdesktop.tailc01234.ts.net/v4/execution/opencode-local`

Native n8n HTTP Request node:

- method `POST`;
- `Content-Type: application/json`;
- raw JSON body = `JSON.stringify($json.execution_request)`;
- no endpoint credential or Authorization header;
- no retry/fallback lane;
- 20 s bounded timeout.

The endpoint's existing server-side provenance registry remains authoritative. The patch cannot make an unknown authorization valid.

## Safety during apply

Patch apply / structural validation must use **zero**:

- WF40 executions;
- WF61 executions;
- execution-endpoint HTTP requests;
- production registry mutations;
- OpenCode executions;
- Qwen generations;
- provider/model calls.

Production registry must still be empty during apply. Therefore applying the transport topology does not itself authorize a live execution.

## Resulting structure

- WF40 nodes: `66 -> 71` after a successful exact apply.
- Five deterministic new node IDs: `v4f40-7501...501` through `v4f40-7505...505`.
- All existing 66 node IDs/names/types preserved.
- WF61 remains inactive.
- D-0025 remains CLOSED.
- OpenClaw root, readonly route and private Windows execution endpoint preserved.

## Source evidence used

- VPS unauthorized proof PASS: `reports/architecture/v4_windows_local_execution_endpoint_vps_unauthorized_reachability_proof.md`
- Endpoint contract: `docs/contracts/v4-windows-local-execution-endpoint-v1.md`
- Request schema: `docs/contracts/v4-windows-local-execution-endpoint-v1.request.schema.json`
- Response schema: `docs/contracts/v4-windows-local-execution-endpoint-v1.response.schema.json`
- Existing applied adapter-router patch: `workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json`

## NEXT

`V4_WF40_EXECUTION_TRANSPORT_PATCH_APPLY_OFFLINE` — Cursor applies the GPT-Web-authored artifact verbatim after a live secret-safe structural precheck, then proves the 66→71 topology with zero workflow execution and zero endpoint/OpenCode/Qwen/provider calls.

# n8n-v4-execution-adapter-router-bridge-v1

Status: DESIGN CONTRACT. Runtime authorized: NO.

Purpose: expose `v4-execution-adapter-router-v1` to n8n after an already-selected V4 route, while remaining fully offline and incapable of live execution.

Inputs: `execution_id`, exact `execution_route_result` from the existing routing bridge, unchanged WF61 `execution_packet`, optional explicit `dispatch_result`, and optional explicit `runtime_authorization`. The bridge must never synthesize dispatch readiness or authorization.

Implementation must reuse `routeToExecutionAdapter()` from `tools/v4-execution-adapter-router-v1.mjs` and the canonical execution-adapter registry. It must not duplicate route selection, registry lookup, dispatch validation, or adapter authorization validation.

Hard boundary for v1: do not provide `getOccupancy`, `guardStart`, `runOpenCode`, session-manager callbacks, or any live runner callback. Therefore `execution_performed` must always remain false. A route that reaches the OpenCode adapter must stop fail-closed at the existing runtime boundary rather than executing.

CLI target: `node tools/n8n-v4-execution-adapter-router-bridge-v1.mjs --input-b64 <base64-json>` with exactly one structural JSON result, no network, subprocess, model/provider call, workflow mutation, or runtime mutation.

Create result schema `docs/contracts/n8n-v4-execution-adapter-router-bridge-v1.schema.json`. Result must include structural router result plus bounded fields: schema version, ok, classification, execution_id, route_id, adapter_id, dispatch_supplied, runtime_authorization_supplied, execution_performed=false, and reason_codes. If delegated router ever reports execution_performed=true, fail closed as `UNEXPECTED_LIVE_EXECUTION`.

WF40 integration artifact: `workflows/patches/v4-wf40-execution-adapter-router.gpt-web.json`. Expected WF40 before apply: id `9ZMj2ACTKyDVhCue`, active, 61 nodes, versionId `1257ed3f-12ad-4fa1-b6ce-ae3e62149b7c`. Patch apply is deferred until this bridge implementation passes offline tests.

Out of scope: real OpenCode execution, a production runner, Qwen start/restore, private execution endpoint, Telegram authorization source, authorization spend persistence, review loop, new executors, or changes to EXECUTION_ROUTER/RESOURCE_STATUS/route-source semantics.

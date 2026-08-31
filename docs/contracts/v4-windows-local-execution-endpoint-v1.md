# V4 Windows local execution endpoint v1

**Authority:** GPT Web  
**Status:** DESIGN CONTRACT — AUTHORED  
**Runtime authorized by this document:** **NO**  
**Purpose:** define the smallest fail-closed private execution transport from VPS/n8n to the Windows-local OpenCode + Qwen execution adapter without changing existing routing, authorization, occupancy, guard or execution ownership.

## 1. Canonical topology

```text
VPS / n8n
  -> Tailscale-private HTTPS POST
  -> Windows loopback execution service
  -> canonical runtime authorization validation
  -> canonical Windows-local occupancy classification
  -> canonical single-generation guard
  -> exactly one OpenCode process
  -> bounded structural result
```

The execution service is separate from the existing read-only endpoint.

Canonical target route for the future implementation:

- tailnet HTTPS path: `/v4/execution/opencode-local`
- Windows loopback bind: `127.0.0.1:18791`

These values are ratified for v1. The existing read-only service remains unchanged on `127.0.0.1:18790` and `/v4/resource-status/local-readonly`.

No Funnel/public exposure is allowed.

## 2. Ownership invariants

The endpoint MUST reuse existing owners rather than duplicate logic:

- route/model selection: existing EXECUTION_ROUTER / dispatch path;
- route -> adapter mapping: `tools/v4-execution-adapter-router-v1.mjs` + registry;
- runtime authorization validation: `validateRuntimeAuthorization()` in `tools/opencode-execution-adapter-v1.mjs`;
- occupancy classification: `gatherQwenDiagnostics()` + `classifyQwenSharedRuntime()` from `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs`;
- generation ceiling: default `startSingleGenerationGuard()` already owned by `tools/opencode-execution-adapter-v1.mjs`;
- execution accounting/bounds: `executeOpenCodeBounded()` in `tools/opencode-execution-adapter-v1.mjs`.

The endpoint MUST NOT duplicate any of these validators/classifiers.

## 3. Hard host boundary

`getOccupancy`, the single-generation guard, `runOpenCode`, the OpenCode process and Qwen loopback access all live on the same Windows host.

The VPS/n8n side MUST NOT receive or emulate live callbacks and MUST NOT reach Qwen directly.

The endpoint MUST NOT invoke `tools/qwen-local-session-manager-v1.mjs` or start/restart/stop/kill Qwen. `QWEN_NOT_RUNNING_SAFE_TO_START` remains only an occupancy classification; it does not authorize a launch.

## 4. Request contract

Method: **POST** only.

Content type: `application/json` only.

No query parameters.

Schema:

`docs/contracts/v4-windows-local-execution-endpoint-v1.request.schema.json`

Top-level request is exactly:

```json
{
  "schema_version": "v4-windows-local-execution-endpoint-request-v1",
  "execution_id": "unique execution id",
  "runtime_authorization": {
    "schema_version": "operator-runtime-authorization-v1"
  },
  "message": "bounded execution goal text"
}
```

`additionalProperties:false` applies to the request and to the v1 authorization shape accepted by this endpoint.

### 4.1 Runtime authorization shape accepted by this endpoint

The endpoint v1 intentionally accepts a strict subset of the adapter's backward-compatible authorization parser. Required exact fields:

- `schema_version = operator-runtime-authorization-v1`
- non-empty `authorization_id`
- `authorization_state = ACTIVE`
- `route_id = opencode+qwen_local`
- `scope.execution_harness = opencode`
- `scope.model = qwen_local`
- `scope.single_generation_guard_required = true`
- `scope.max_opencode_executions = 1`
- `scope.max_qwen_generation_calls = 1`
- `scope.retry = 0`
- `scope.fallback = 0`
- `scope.qwen_profile = fast_8k`
- `scope.dflash_required = true`

The endpoint MUST forward this authorization object unchanged to `executeOpenCodeBounded()` and MUST NOT weaken adapter validation.

No request-supplied guard upstream/base URL is allowed; the adapter uses its canonical Windows-local default.

### 4.2 Message

`message` is required bounded task text, maximum 4096 characters.

For v1, the message is the only execution payload. It MUST be treated as data for the fixed OpenCode invocation, never as a shell command or path selector.

A future workflow may derive it from an already-authorized Execution Packet, but this contract does not authorize that WF40 wiring yet.

## 5. Forbidden request surface

The endpoint MUST reject, before any occupancy sample, guard start or process spawn:

- any command/script/shell/argv field;
- any cwd/path/file/launcher/config field;
- any model/profile selector outside the validated authorization object;
- any endpoint/upstream/base_url/port override;
- any retry/fallback/max-steps/parallelism knob;
- any occupancy hint/classification override;
- any guard configuration;
- any arbitrary environment variable block;
- any credential/token/API key field;
- any batch or array of executions;
- any extra top-level or authorization/scope property;
- GET/PUT/PATCH/DELETE;
- query parameters;
- non-JSON body.

Unknown input fails closed and never reaches the adapter.

## 6. Windows-local getOccupancy callback

The future implementation MUST inject exactly one `getOccupancy` callback into `executeOpenCodeBounded()`.

That callback MUST, at execution time:

1. load the canonical local runtime config;
2. call one bounded `gatherQwenDiagnostics(runtimeConfig)` evaluation;
3. call the existing pure `classifyQwenSharedRuntime(sampleA, sampleB, runtimeConfig)`;
4. return only the canonical classification string.

It MUST NOT call the existing read-only HTTPS endpoint and MUST NOT reuse a stale `RESOURCE_STATUS` snapshot.

No occupancy data from the request is accepted.

## 7. Windows-local runOpenCode callback

The future implementation MUST inject exactly one `runOpenCode` callback into `executeOpenCodeBounded()`.

The callback MUST:

- spawn at most one OpenCode process;
- use a fixed Windows-side executable and fixed argument template derived from canonical local configuration/code, not request fields;
- use `shell:false` or an equivalent no-shell process API;
- receive `guardBaseUrl` only from the adapter-owned guard callback input;
- use the canonical model/profile supplied by the adapter callback input;
- pass `message` only as bounded prompt data;
- never invoke the direct canonical Qwen endpoint as the OpenCode base URL;
- never retry or fallback;
- return structural accounting only: OpenCode execution count, Qwen generation count/upstream count, retry/fallback counts and bounded response validation;
- never return raw stdout/stderr, prompts, model output, process data or secrets to the HTTP caller.

The endpoint MUST NOT provide a custom `guardStart` in v1. The adapter's existing production default `startSingleGenerationGuard()` remains authoritative.

## 8. Single-flight, idempotency and authorization reuse

The implementation MUST keep v1 execution-id replay/single-flight control in memory. Durable authorization consumption is owned by the durable spend ledger (see §8.0).

### 8.0 Server-side provenance + durable spend admission (v1.2)

Two server-side files participate in admission:

1. **Durable spend ledger** (`tools/v4-runtime-authorization-durable-spend-ledger-v1.mjs`, contract `docs/contracts/v4-runtime-authorization-durable-spend-ledger-v1.md`) — global consumed-id history.
2. **Provenance registry** (`tools/v4-runtime-authorization-provenance-registry-v1.mjs`, contract `docs/contracts/v4-runtime-authorization-provenance-registry-v1.md`) — issuance + current ACTIVE/SPENT state.

Mandatory CLI arguments (absolute paths only; never request-selectable):

- `--authorization-registry <absolute-path>`
- `--authorization-spend-ledger <absolute-path>`

Authoritative order after HTTP schema validation:

1. in-memory `execution_id` replay-cache (same fingerprint → replay; different → `EXECUTION_ID_CONFLICT`);
2. load + validate durable spend ledger; if `authorization_id` already present → HTTP 200 `AUTHORIZATION_REJECTED` / `AUTHORIZATION_ALREADY_SPENT`, zero registry spend, zero adapter;
3. load + validate provenance registry; require ACTIVE + unexpired + route match;
4. in-memory authorization-id binding conflict check;
5. global single-flight check;
6. append `ADMISSION_CONSUMED` to the durable ledger and persist atomically (temp+rename);
7. only after ledger persistence succeeds, ACTIVE → SPENT in the provenance registry and persist atomically;
8. only after **both** durable writes succeed may the canonical adapter path run.

Partial-failure semantics (ledger-first, intentional):

- ledger persistence failure → registry remains ACTIVE; adapter/occupancy/guard/runner = 0;
- ledger persistence success + registry spend failure → ledger record remains (no rollback); adapter = 0; any retry is rejected by the ledger as `AUTHORIZATION_ALREADY_SPENT`.

Ledger/registry unavailable or invalid reasons map to HTTP 200 `AUTHORIZATION_REJECTED` with `adapter_result=null` and `execution_performed=false`. No filesystem path or ledger/registry content is returned to the HTTP caller.

Request schema, response schema, adapter ownership and the single-generation guard remain unchanged.

### 8.1 Global single-flight

Only one endpoint execution may be in flight.

A concurrent request is rejected fail-closed with classification `EXECUTION_BUSY`; it performs no occupancy diagnostic, guard start, OpenCode spawn or generation.

### 8.2 execution_id idempotency

The service keeps a bounded in-memory cache keyed by `execution_id` with a deterministic request fingerprint and final structural response.

- same `execution_id` + same fingerprint -> return the cached structural response with `replayed=true`; never re-execute;
- same `execution_id` + different fingerprint -> reject `EXECUTION_ID_CONFLICT`; never execute.

The cache is an implementation detail and MUST be bounded; exact eviction size is implementation-defined but tests must prove no re-execution for a retained id.

### 8.3 authorization_id binding

On the first schema-valid/admitted request, an `authorization_id` is bound to exactly one `execution_id`.

- same authorization + same execution id follows idempotency semantics;
- same authorization + different execution id -> `AUTHORIZATION_ID_REUSED`, no execution.

If the adapter returns `authorization_state_final=SPENT`, the authorization remains terminally rejected for any later execution id.

This prevents transport-level retry with a new execution id while preserving the adapter's own authorization-state semantics.

The durable spend ledger (§8.0) is the cross-restart / cross-route authority for consumed authorization ids; in-memory binding is complementary within a single process lifetime.

## 9. Response contract

Schema:

`docs/contracts/v4-windows-local-execution-endpoint-v1.response.schema.json`

The endpoint returns a bounded wrapper:

```json
{
  "schema_version": "v4-windows-local-execution-endpoint-result-v1",
  "ok": false,
  "classification": "bounded classification",
  "execution_id": "id or null",
  "replayed": false,
  "execution_performed": false,
  "adapter_result": null,
  "reason_codes": []
}
```

When the canonical adapter was invoked, `adapter_result` MUST conform exactly to `docs/contracts/opencode-execution-adapter-v1.schema.json`.

Top-level `execution_performed` MUST equal `adapter_result.execution_performed` when an adapter result exists; otherwise it is false.

No raw OpenCode stdout/stderr, prompt, model response, process list, socket list, PID, executable path, environment block, authorization secret or credential material may appear in the response.

`response_validation` from the canonical adapter is the maximum model-output-derived information allowed in v1.

## 10. HTTP/classification behavior

Structural application outcomes may use HTTP 200, including adapter-level authorization or occupancy blocks.

Transport/input failures use bounded fail-closed HTTP status codes, for example:

- `400` invalid JSON/schema/query/content-type;
- `405` wrong method;
- `409` `EXECUTION_BUSY`, `EXECUTION_ID_CONFLICT`, or `AUTHORIZATION_ID_REUSED`;
- `500/503` bounded internal/service failure.

HTTP status never converts a blocked adapter result into authorization to retry automatically.

## 11. Required first offline implementation behavior

The next implementation block is **offline only**.

It may create the Windows endpoint tool, request/response validation and DI tests, but MUST NOT:

- install/start/persist the service;
- mutate Tailscale Serve/firewall;
- listen on the production port during tests;
- call the live tailnet endpoint;
- execute OpenCode;
- generate with Qwen;
- call providers/models;
- start/stop/restart processes;
- modify WF40/WF61;
- synthesize dispatch or runtime authorization;
- consume a real operator authorization.

Tests must use injected/mocked runner and occupancy behavior and ephemeral listener ports where an HTTP server is exercised.

## 12. First live-test sequence after offline implementation

Each item remains a separate bounded block:

1. offline endpoint implementation + DI tests;
2. Windows service persistence on loopback `127.0.0.1:18791` and additive private Tailscale Serve path `/v4/execution/opencode-local`, listener proof only;
3. one VPS reachability proof using a deliberately unauthorized request -> canonical `AUTHORIZATION_REJECTED`, with execution/generation counters zero;
4. GPT-Web WF40 execution-transport patch authoring;
5. exact patch apply + structural proof;
6. durable spend ledger block before repeated operational use;
7. first live bounded execution only under a separate explicit single-use operator authorization and live-test gate.

This contract does not authorize any of steps 2-7.

## 13. Preserved state

Until a later block explicitly changes it:

- WF40 remains 66 nodes;
- WF61 remains inactive;
- D-0025 remains CLOSED;
- no live runner is wired in n8n;
- existing read-only endpoint remains unchanged;
- OpenClaw root route remains unchanged;
- no provider/Qwen/OpenCode execution is authorized;
- no new public exposure is authorized.

## 14. NEXT

`V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_OFFLINE_IMPLEMENTATION`

Implement the endpoint tool + schemas/tests strictly offline against this contract, reusing the canonical adapter, occupancy classifier and default single-generation guard. No runtime/service/Tailscale/workflow mutation and no live OpenCode/Qwen execution.

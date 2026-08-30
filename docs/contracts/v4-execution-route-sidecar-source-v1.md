# V4 execution route sidecar source v1

**Repository:** `mrhz1973/control-plane`  
**Version:** `v4-execution-route-sidecar-source-v1`  
**Authority:** GPT Web  
**Runtime authorized by this document:** **NO**

## 0. Purpose

Define the only canonical sources that may populate the two explicit inputs required by the installed WF40 V4 routing lane:

- `execution_route_request` (`execution-route-request-v1`)
- `resource_status` (`resource-status-v1`)

This contract exists specifically to prevent `technical_requirements` or runtime availability from being invented from planner prose, Execution Packet text, commit messages, classifier output, chat history, or model inference.

The installed WF40 bridge remains fail-closed and still stops before dispatch/execution.

## 1. Persistent route-source artifact

For a canonical backlog item with `task_id = <TASK_ID>`, GPT Web authors a sibling JSON artifact at the deterministic path:

```text
docs/runtime/EXECUTION_ROUTE_<TASK_ID>.json
```

The route-source artifact MUST be committed in the **same Git commit** as the backlog item it describes.

Canonical shape:

```json
{
  "schema_version": "v4-execution-route-source-v1",
  "task_id": "D-NNNN-X",
  "source_backlog_path": "docs/runtime/BACKLOG_DNNNN_....md",
  "created_by": "gpt-web",
  "technical_requirements": ["filesystem", "code_edit"],
  "risk_level": "low"
}
```

Machine schema:

`docs/contracts/v4-execution-route-sidecar-source-v1.schema.json`

### Hard source rules

- `task_id` is explicit and must equal the backlog item `id`.
- `source_backlog_path` must equal the exact canonical backlog path processed by WF40.
- The route-source artifact must be fetched at the exact same commit SHA as the backlog item.
- `created_by` must equal `gpt-web`.
- `technical_requirements` are explicit GPT-Web-authored values from the capability vocabulary already owned by `execution-route-request-v1` / RESOURCE_REGISTRY.
- `risk_level` is explicit and must equal the backlog `risk_hint`.
- Absence, mismatch, ambiguity, malformed JSON or unsupported capability => fail closed; never infer a replacement.

## 2. Deterministic mapping to `execution-route-request-v1`

The source adapter may perform only this mapping:

| execution-route-request-v1 | source |
|---|---|
| `schema_version` | literal `execution-route-request-v1` |
| `request_id` | exact `task_id` |
| `technical_requirements` | route-source `technical_requirements`, verbatim |
| `risk_level` | route-source `risk_level`, verbatim |

This mapping is deterministic transport normalization, not semantic synthesis.

The adapter MUST NOT derive `technical_requirements` from:

- `objective` / goal;
- `allowed_paths` / `forbidden_paths`;
- planner output or Execution Packet prose;
- risk/complexity prose beyond verifying the explicit `risk_level` equals backlog `risk_hint`;
- PM21/classifier output;
- commit message;
- Telegram/chat text;
- model inference.

## 3. RESOURCE_STATUS source

`resource_status` remains dynamic operational state and MUST NOT be stored inside the persistent route-source artifact.

Canonical sources are:

1. an explicit transient `resource-status-v1` snapshot supplied by the control plane; or
2. when no acceptable transient snapshot is available, the committed fail-closed baseline:
   `configs/resources/status.fail-closed.json`.

The source adapter itself MUST NOT call providers, dashboards, Qwen, OpenCode, session managers, n8n, or network probes to manufacture status.

It consumes status; it does not collect status.

### Transient status requirements

An explicit transient snapshot must:

- validate against `docs/contracts/resource-status-v1.schema.json`;
- carry its own `generated_at`, per-resource `source` and `updated_at` values;
- be no more than **300 seconds old** at adapter evaluation time;
- contain no credential/token/secret material;
- never mark a resource available from a guessed state.

If absent, malformed, future-dated, stale (>300 s), or secret-like, the adapter MUST use the committed fail-closed baseline and classify the status source as fail-closed fallback.

Using the fail-closed baseline is not an error and authorizes no resource. It simply guarantees deterministic `NO_ROUTE`/unavailable behavior until a fresh approved snapshot is supplied.

## 4. Qwen shared-runtime boundary

This source contract does **not** authorize starting, restarting, stopping or probing Qwen/Ollama/llama-server/Blender/OpenCode.

A future RESOURCE_STATUS collector must obey the canonical shared-runtime occupancy classifications:

- `QWEN_READY_IDLE`
- `QWEN_BUSY_SHARED_RUNTIME`
- `QWEN_OCCUPANCY_UNCERTAIN`
- `QWEN_NOT_RUNNING_SAFE_TO_START`

Automatic status-source construction must never terminate/restart another workload merely to make Qwen selectable.

The existing `collect-qwen-local-resource-status-v1.mjs` is therefore **not automatically invoked by this source adapter**; its use remains a separately bounded runtime action.

## 5. Runtime bundle produced for WF40

The future deterministic source adapter emits one bundle equivalent to:

```json
{
  "schema_version": "v4-execution-routing-sidecar-bundle-v1",
  "task_id": "D-NNNN-X",
  "execution_route_request": {
    "schema_version": "execution-route-request-v1",
    "request_id": "D-NNNN-X",
    "technical_requirements": ["filesystem", "code_edit"],
    "risk_level": "low"
  },
  "resource_status": {},
  "route_source": {
    "path": "docs/runtime/EXECUTION_ROUTE_D-NNNN-X.json",
    "commit": "<exact backlog commit>"
  },
  "status_source": "explicit_transient|fail_closed_baseline"
}
```

Only `execution_route_request` and `resource_status` are consumed by the already-installed WF40 V4 capture node. The provenance fields exist for deterministic validation/evidence and must not carry secrets.

## 6. Fail-closed classifications

At minimum the future adapter must distinguish:

- `PASS_SIDECARS_READY`
- `ROUTE_SOURCE_MISSING`
- `ROUTE_SOURCE_SCHEMA_INVALID`
- `ROUTE_SOURCE_TASK_MISMATCH`
- `ROUTE_SOURCE_BACKLOG_MISMATCH`
- `ROUTE_SOURCE_RISK_MISMATCH`
- `ROUTE_SOURCE_COMMIT_MISMATCH`
- `RESOURCE_STATUS_EXPLICIT_FRESH`
- `RESOURCE_STATUS_FAIL_CLOSED_BASELINE`

A route-source failure yields no `execution_route_request` and no routing attempt.
A status-source failure degrades only to the fail-closed baseline; it never guesses availability.

## 7. Integration seam

Future bounded integration is additive to the existing WF40 backlog lane:

```text
canonical backlog detected/fetched
  -> deterministic backlog adapter
  -> fetch exact EXECUTION_ROUTE_<task_id>.json at same commit
  -> build V4 sidecar bundle from explicit route source + explicit/fail-closed RESOURCE_STATUS
  -> existing `Code - Capture explicit V4 execution routing sidecar`
  -> existing WF61 planner lane
  -> existing V4 bridge lane
```

No separate V4 n8n workflow is created.

The current D-0025 primary-remote planner selection and Execution Packet remain unchanged.

## 8. Safety boundaries

This contract does not authorize:

- WF40/WF61 execution;
- provider/model inference;
- OpenCode execution;
- Qwen generation/start/restart;
- adapter dispatch;
- credential access or mutation;
- network mutation;
- D-0025 reopen;
- synthesis of missing route semantics.

## 9. Next implementation boundary

Next implementation block:

`V4_EXECUTION_ROUTE_SIDECAR_SOURCE_ADAPTER_OFFLINE`

It may implement the deterministic source adapter, schema validation and offline tests only. Workflow wiring remains a later GPT-Web-authored delta.

# V4 — WF40 sidecar source patch authoring

**Block ID:** `V4_WF40_SIDECAR_SOURCE_PATCH_AUTHORING`  
**Authority:** GPT Web  
**Starting origin/main:** `ae33bbf96f36126dd4b09896ee0e6136a510de27`  
**Workflow mutation in this block:** NO  
**Provider/model/Qwen/OpenCode calls:** 0

## Result

**PASS — exact additive WF40 delta authored, not applied.**

Canonical artifact:

`workflows/patches/v4-wf40-sidecar-source.gpt-web.json`

The patch extends live WF40's existing 50-node V4 planner/routing lane with six new nodes (expected **50 → 56**) and does not create a new workflow.

## Source lane

```text
IF - remote planner dispatch allowed? TRUE
  -> GitHub - Fetch V4 execution route source
  -> Code - Encode V4 sidecar source adapter input
  -> Execute Command - build V4 execution routing sidecars
  -> Code - Parse V4 sidecar source adapter result
  -> IF - V4 execution route sidecars ready?
       TRUE  -> existing Code - Capture explicit V4 execution routing sidecar
                -> existing WF61 planner
                -> existing V4 bridge lane
       FALSE -> Code - V4 execution route sidecar source gate closed
```

The existing remote-planner FALSE branch remains unchanged.

## Route-source binding

Route artifact path is deterministic:

`docs/runtime/EXECUTION_ROUTE_<TASK_ID>.json`

The GitHub fetch is pinned to the exact `commitSha` already produced by `Code - Detect canonical backlog item`. The source adapter receives that same commit as both backlog commit and route-source commit, so its existing same-commit enforcement remains authoritative.

Task identity comes from the existing parsed primary-remote adapter result; backlog path/commit come from the existing canonical backlog detector; risk comes from the already-validated `consumer_input.risk_hint`. No objective/path/planner/classifier/chat inference is introduced.

## RESOURCE_STATUS behavior

The new lane does not collect status.

- If an explicit upstream `resource_status` object is already present on the remote-dispatch item, it is passed to the source adapter as `--status-b64`.
- Otherwise `--status-b64` is omitted and the source adapter uses the committed `configs/resources/status.fail-closed.json` baseline exactly as defined by the source contract.
- No `collect-qwen-local-resource-status-v1.mjs`, provider/dashboard probe, Qwen/session-manager or OpenCode call is introduced.

This keeps the patch useful now while preserving a later additive seam for a separately governed transient RESOURCE_STATUS producer.

## Fail-closed behavior

A missing, malformed, mismatched or unsupported route-source artifact produces no usable sidecars. The new sidecar-ready IF then terminates the lane before WF61. Therefore a provider planning call is not spent when the mandatory GPT-Web route source is absent or invalid.

A valid route source with absent/stale/bad explicit status still produces a valid bundle containing the fail-closed RESOURCE_STATUS baseline; downstream execution routing will consequently remain unavailable rather than invent resource readiness.

## Preserve

- all existing 50 WF40 nodes;
- WF40 active state;
- WF61 content and inactive state;
- D-0025 runtime gate closed;
- PM21/Telegram/GIS/Data Table lanes;
- WF60/OpenClaw lane;
- existing V4 capture + bridge lane;
- no executor downstream;
- credential values opaque.

## Next

`V4_WF40_SIDECAR_SOURCE_PATCH_APPLY_OFFLINE`

Cursor may apply only the GPT-Web-authored artifact verbatim after secret-safe structural precheck. Validation remains structural only: zero workflow execution, provider/model calls, status collection or inference.

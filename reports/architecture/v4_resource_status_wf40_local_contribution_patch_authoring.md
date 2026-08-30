# V4 — WF40 local RESOURCE_STATUS contribution patch authoring

**Block ID:** `V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_AUTHORING`  
**Authority:** GPT Web  
**Workflow mutation in this block:** NO  
**Provider/model/Qwen/OpenCode calls:** 0

## Result

**PASS — exact WF40 delta authored, intentionally not applied.**

Canonical artifact:

`workflows/patches/v4-wf40-local-resource-status-contribution.gpt-web.json`

Private transport contract:

`docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md`

## Why apply is deferred

The validated local producer runs on the Windows node, while WF40/n8n runs on the VPS. The producer is a CLI/library and is not directly executable by the VPS n8n container. Therefore the workflow cannot truthfully call it until a deterministic private transport seam exists.

The repository already proves the Windows host is reachable from the VPS through the Tailscale-private hostname `asusdesktop.tailc01234.ts.net`, with the existing OpenClaw root route preserved. The new contract reserves a separate path:

`https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly`

No public Funnel/public Internet exposure is allowed.

## Authored WF40 delta

Expected live WF40 before apply:

- id `9ZMj2ACTKyDVhCue`;
- active;
- 56 nodes;
- versionId `ef80943e-535d-430f-958f-56c03baa1c62`.

The artifact adds five nodes, target **56 → 61**:

```text
IF remote planner TRUE
  -> HTTP - Fetch local runtime read-only contribution
  -> Code - Normalize local runtime contribution
  -> Code - Encode local RESOURCE_STATUS composer input
  -> Execute Command - compose local RESOURCE_STATUS
  -> Code - Attach composed local RESOURCE_STATUS
  -> existing GitHub - Fetch V4 execution route source
  -> existing sidecar-source lane
  -> WF61
  -> existing V4 routing bridge
```

The exact existing `Code - Encode V4 sidecar source adapter input` node receives one parameter-only update so its explicit status source becomes the newly composed local `resource_status` rather than the earlier raw gate item.

No existing node ID/name/type is replaced.

## Fail-closed behavior

The local endpoint is an optimization/observation source, not an authorization gate.

If the endpoint is absent, unreachable or returns invalid producer output:

1. the normalize node emits zero contributions;
2. the canonical composer receives `[]`;
3. the composer returns registry-closed fail-closed RESOURCE_STATUS;
4. the existing route-source/sidecar lane continues;
5. local resources remain unavailable rather than guessed.

Thus endpoint failure does not cause a provider call solely to discover status and does not invent Qwen/OpenCode readiness.

## Runtime boundaries

The endpoint call contains no credentials or request body and cannot select commands/models/profiles.

The endpoint implementation must prove, before workflow apply:

- Tailscale-private-only reachability from VPS;
- producer contribution schema valid;
- one diagnostic PowerShell process per request;
- Qwen generation/HTTP calls = 0;
- OpenCode CLI calls = 0;
- process mutations = 0;
- secret exposure = false.

WF40 patch apply remains forbidden until that endpoint proof exists.

## Preserved

- existing 56 WF40 nodes and all legacy lanes;
- remote-planner FALSE branch;
- same-commit `EXECUTION_ROUTE_<task_id>.json` binding;
- `technical_requirements` source semantics;
- WF61 inactive state;
- D-0025 CLOSED;
- no executor downstream;
- no Qwen/OpenCode/provider generation.

## Next

`V4_LOCAL_RUNTIME_READONLY_PRIVATE_ENDPOINT_IMPLEMENTATION`

After that endpoint passes private-only reachability and safety validation, proceed directly to:

`V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_APPLY_OFFLINE`

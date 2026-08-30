# V4 local runtime read-only private endpoint v1

**Authority:** GPT Web  
**Runtime authorized by this document:** NO  
**Purpose:** deterministic private transport from VPS/n8n to the already-validated Windows local-runtime contribution producer.

## 1. Canonical role

This endpoint is a transport adapter only. It exposes the existing read-only producer result for `qwen_local` + `opencode` to the VPS control-plane over the existing Tailscale-private Windows host.

It MUST NOT:

- call any model/provider;
- generate with Qwen;
- start/restart/stop/kill Qwen, Ollama, llama-server, OpenCode, Blender, Cursor or related processes;
- invoke OpenCode CLI;
- compose RESOURCE_STATUS;
- infer `technical_requirements`;
- expose a public listener/Funnel route;
- accept commands, arbitrary scripts, paths or runtime parameters from the caller.

## 2. Canonical private route

Existing private Windows tailnet host, already verified VPS-reachable:

`https://asusdesktop.tailc01234.ts.net/`

Reserved V4 endpoint path:

`/v4/resource-status/local-readonly`

Canonical URL:

`https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly`

The endpoint MUST remain Tailscale-private. Existing OpenClaw root routing on the host must remain preserved. Public Funnel/public Internet exposure is forbidden.

The local service may use a separate loopback-only listener behind a path-specific Tailscale Serve mapping. Exact loopback port is an implementation detail and must not replace the canonical HTTPS URL in WF40.

## 3. Request

Method: `GET`.

No request body. No query parameters. No credential values. No model/profile/command selector.

The endpoint executes exactly one bounded invocation/equivalent in-process call of the canonical producer behavior from:

`tools/produce-v4-local-runtime-readonly-contribution-v1.mjs`

One request must produce at most:

- one producer evaluation;
- one diagnostic PowerShell process;
- zero Qwen HTTP/generation calls;
- zero OpenCode CLI calls;
- zero process mutations.

Concurrent overlapping producer evaluations must fail closed or serialize without spawning parallel diagnostic runs for the same request path.

## 4. Response

HTTP 200 may be used for both ready and fail-closed producer classifications because occupancy is data, not transport success.

The JSON body must be equivalent to the canonical producer wrapper:

```json
{
  "schema_version": "v4-local-runtime-readonly-contribution-result-v1",
  "ok": true,
  "qwen_occupancy_classification": "QWEN_READY_IDLE | QWEN_BUSY_SHARED_RUNTIME | QWEN_OCCUPANCY_UNCERTAIN | QWEN_NOT_RUNNING_SAFE_TO_START",
  "qwen_classification_reason": "bounded_non_secret_reason",
  "opencode_static_classification": "bounded_non_secret_classification",
  "contribution": {
    "schema_version": "v4-resource-status-contribution-v1"
  },
  "launch_performed": false,
  "generation_calls": 0
}
```

`contribution.resources` must contain exactly `qwen_local` and `opencode` and must satisfy `docs/contracts/v4-resource-status-contribution-v1.schema.json`.

The endpoint must not return raw process lists, raw socket tables, PIDs, executable paths, PowerShell output, command lines, environment blocks, secrets or credential material.

Transport/internal failure should return a bounded non-secret JSON failure body and must never synthesize `available=true`.

## 5. Freshness

The producer stamps `produced_at` / resource `updated_at` at local evaluation time. WF40 must pass the contribution immediately to the canonical RESOURCE_STATUS composer, whose existing 300-second freshness rule remains authoritative.

No endpoint or WF40 node may restamp an old contribution to make it fresh.

Clock skew that causes a contribution to appear future-dated is fail-closed; no tolerance is invented here.

## 6. WF40 consumption rule

WF40 may call this endpoint only on the already-existing primary-remote TRUE lane and before the same-commit route-source fetch.

Endpoint failure or invalid producer output is **nonblocking but fail-closed**:

1. normalize to zero valid contributions;
2. invoke `tools/compose-v4-resource-status-control-plane-v1.mjs` with `[]`;
3. obtain a registry-closed fail-closed `resource-status-v1`;
4. continue through the existing route-source/sidecar lane.

Thus local transport failure can never invent local availability and does not consume an additional planner/provider call merely to discover status.

## 7. Authorization boundary

This contract does not authorize endpoint installation, Tailscale Serve mutation, firewall mutation, service persistence, workflow mutation or live endpoint execution.

Implementation is a separate bounded block. WF40 patch application is forbidden until the endpoint has a private-only reachability proof from the VPS and the no-generation/no-process-mutation counters are satisfied.

# V4 Windows local execution endpoint — VPS unauthorized reachability proof

**Blocks:**
- `V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF` (attempt 1 — STOP)
- `V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF_QUOTING_CORRECTION` (attempt 2 — PASS)

**Category:** RUNTIME_PROOF  
**Result:** PASS (corrective attempt)  
**Dispatch base head:** `637f087a7190722332cb26dfaaeb8ea599ea1475`

## Objective

Demonstrate reachability:

```text
VPS → Tailscale private HTTPS → Windows execution endpoint
  → server-side provenance registry → AUTHORIZATION_REJECTED
```

using a schema-valid POST with a deliberately non-issued `authorization_id`, without reaching occupancy, guard, adapter, OpenCode, Qwen, or provider.

## Precheck (attempt 2)

| Check | Result |
|---|---|
| `origin/main` = dispatch base head | PASS |
| Working tree clean | PASS |
| Production registry valid, `entries = []` | PASS |
| Exactly one listener `127.0.0.1:18791` | PASS |
| Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` running with `--authorization-registry` | PASS |
| Tailscale `/v4/execution/opencode-local` → `127.0.0.1:18791` | PASS |
| Tailscale `/` → `127.0.0.1:18789` (OpenClaw) | PASS |
| Tailscale `/v4/resource-status/local-readonly` → `127.0.0.1:18790` | PASS |
| Funnel | absent |
| VPS SSH `ionos-n8n` | PASS |
| HTTP requests during precheck | **0** |

## Attempt 1 — quoting failure (STOP)

**Stop evidence:** `reports/runtime/cursor-stops/20260831T114157Z__V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF.stop.json`

| Field | Value |
|---|---|
| `execution_id` | `v4-vps-unauthorized-reachability-proof-001` |
| `authorization_id` | `V4_VPS_UNAUTHORIZED_REACHABILITY_PROOF_NON_ISSUED_001` |
| Transport | inline `curl` through SSH (quoting unsafe) |
| HTTP status | **400** |
| `classification` | `ENDPOINT_CONTENT_TYPE_REJECTED` |
| `reason_codes` | `APPLICATION_JSON_REQUIRED` |
| Root cause | `Content-Type: application/json` header lost to remote shell quoting |
| `execution_performed` | false |
| `adapter_result` | null |
| Registry after | `entries = []` |
| OpenCode / Qwen / provider | 0 |

Rejection occurred before request-schema/provenance admission because the endpoint never received `application/json`.

## Attempt 2 — quoting-safe corrective proof (PASS)

### Request identity (no secrets)

| Field | Value |
|---|---|
| Origin | VPS `ionos-n8n` |
| Route | `https://asusdesktop.tailc01234.ts.net/v4/execution/opencode-local` |
| `execution_id` | `v4-vps-unauthorized-reachability-proof-002` |
| `authorization_id` | `V4_VPS_UNAUTHORIZED_REACHABILITY_PROOF_NON_ISSUED_002` |
| Transport | SCP payload + SCP bash script; single `curl` inside `/tmp/v4-vps-proof-002.sh`; invoked as `ssh ionos-n8n bash /tmp/v4-vps-proof-002.sh` |
| New HTTP requests this pass | **1** |
| Cumulative proof HTTP requests | **2** |

### Observed response (bounded structural fields)

| Field | Value |
|---|---|
| HTTP status | **200** |
| `schema_version` | `v4-windows-local-execution-endpoint-result-v1` |
| `ok` | false |
| `classification` | `AUTHORIZATION_REJECTED` |
| `execution_id` | `v4-vps-unauthorized-reachability-proof-002` |
| `replayed` | false |
| `execution_performed` | false |
| `adapter_result` | null |
| `reason_codes` | includes `AUTHORIZATION_ID_NOT_ISSUED` |

No adapter result, occupancy classification, OpenCode output, Qwen/model output, raw stdout/stderr, secrets, or server internals appeared in the response.

### Post-proof checks (no further HTTP)

| Check | Result |
|---|---|
| Production registry `entries = []` | PASS |
| Exactly one listener `127.0.0.1:18791` | PASS |
| Scheduled Task unchanged | PASS |
| Tailscale routes preserved | PASS |
| Funnel absent | PASS |
| OpenCode executions | **0** |
| Qwen generations | **0** |
| Provider calls | **0** |
| WF40 | 66 nodes unchanged |
| WF61 | inactive |
| D-0025 | CLOSED |

## Conclusion

Attempt 2 proves the full unauthorized reachability chain through Tailscale private HTTPS to the Windows loopback execution endpoint and server-side provenance registry. Unknown `authorization_id` is rejected with `AUTHORIZATION_REJECTED` / `AUTHORIZATION_ID_NOT_ISSUED` before occupancy, guard, adapter, OpenCode, or Qwen.

## Safety boundary preserved

- Production registry remains empty
- Endpoint/registry/adapter/guard/occupancy code unchanged
- OpenClaw, readonly endpoint, WF40, WF61, D-0025 unchanged
- Live execution gate: **CLOSED TO LIVE EXECUTION**

## NEXT

`V4_WF40_EXECUTION_TRANSPORT_PATCH_AUTHORING` — GPT-Web authoring of the WF40 patch artifact to connect the terminal structural adapter-router result to the private Windows execution transport; authoring-only, no apply in the same block.

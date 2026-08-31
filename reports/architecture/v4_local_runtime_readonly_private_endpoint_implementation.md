# V4 local runtime read-only private endpoint — implementation

**Block:** `V4_LOCAL_RUNTIME_READONLY_TEST_PORT_ISOLATION_CORRECTION_ONE_PASS`  
**Result:** PASS  
**Authority:** GPT Web contract `docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md`

## Summary

Private Tailscale-only transport adapter exposes the already-validated Windows local-runtime contribution producer at:

`https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly`

One VPS GET proof succeeded. OpenClaw root route preserved. No public/Funnel exposure. Zero generation / OpenCode CLI / process mutation.

## Corrective lineage

1. Initial endpoint implementation hung: request-scoped `req.on("close")` prematurely settled responses.
2. Response-close guard corrected to `res.on("close")` with `!res.writableEnded`.
3. Target suite then failed with `EADDRINUSE` on fixed test port `18799` (leftover hung-suite pollution).
4. This pass: test-only isolation — replace fixed `18799` with OS-assigned ephemeral bind (`port: 0` + `server.address().port`). Production default `18790` unchanged. Production tool unmodified in this pass.

## Artifacts

| Role | Path |
|---|---|
| Endpoint tool | `tools/serve-v4-local-runtime-readonly-contribution-v1.mjs` |
| Target tests | `tests/v4-local-runtime-readonly-private-endpoint/run.mjs` |
| Producer (reused) | `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs` |
| Contract | `docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md` |

## Runtime topology

```text
VPS/n8n (tailnet)
  -> https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly
  -> Tailscale Serve (private)
  -> http://127.0.0.1:18790
  -> Node serve tool
  -> one gatherQwenDiagnostics + OpenCode static inspect
  -> v4-resource-status-contribution-v1 (qwen_local + opencode)
```

Preserved OpenClaw:

```text
https://asusdesktop.tailc01234.ts.net/
  -> http://127.0.0.1:18789
```

## Persistence

- Scheduled Task: `ControlPlane-V4-LocalRuntimeStatus`
- Current user, limited privilege, AtLogOn
- Command: `node …\serve-v4-local-runtime-readonly-contribution-v1.mjs --host 127.0.0.1 --port 18790`
- Listener: exactly one `127.0.0.1:18790`

## Tests

- Target: **22/22 PASS** (ephemeral ports; no EADDRINUSE)
- Regressions: contribution **29/29**, composer **34/34**, resource-status-validator **6/6**

## Live VPS proof (exactly one GET)

- HTTP 200
- `schema_version=v4-local-runtime-readonly-contribution-result-v1`
- `ok=true`
- resources exactly `qwen_local`, `opencode`
- `launch_performed=false`, `generation_calls=0`
- Qwen classification: `QWEN_OCCUPANCY_UNCERTAIN` (`available=false`)
- OpenCode classification: `OPENCODE_STATIC_DISPATCH_READY` (`available=true`)

## Counters

| Counter | Value |
|---|---|
| endpoint_requests | 1 |
| producer_evaluations | 1 |
| diagnostic_powershell_processes | 1 |
| qwen_generation_calls | 0 |
| qwen_http_calls | 0 |
| qwen_launcher_calls | 0 |
| qwen_session_manager_calls | 0 |
| opencode_cli_calls | 0 |
| opencode_execution_count | 0 |
| process_kill/stop/restart | 0 |
| provider_calls | 0 |
| workflow_execution_calls | 0 |
| workflow_mutations | 0 |
| public_exposure | false |
| secret_exposure | false |

## Safety

- GET-only; query/body/selectors rejected
- in-flight busy fail-closed (503)
- no RESOURCE_STATUS composition in the endpoint
- no raw process/socket/PID/PowerShell evidence in responses
- WF40 local-status patch **not** applied in this pass

## NEXT

`V4_RESOURCE_STATUS_WF40_LOCAL_CONTRIBUTION_PATCH_APPLY_OFFLINE`

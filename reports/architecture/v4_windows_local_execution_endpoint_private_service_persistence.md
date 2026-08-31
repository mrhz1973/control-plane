# V4 Windows local execution endpoint — private service persistence

**Block:** `V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_PRIVATE_SERVICE_PERSISTENCE`
**Result:** PASS
**Category:** RUNTIME_INTEGRATION
**Starting head:** `ca1be3089ada70e47a84d1273109e468ea59a6f2`
**Contract:** `docs/contracts/v4-windows-local-execution-endpoint-v1.md`

## Summary

Persisted the offline-complete Windows-local execution endpoint as a loopback service and added the private Tailscale Serve route. Zero HTTP requests sent to the execution endpoint. Zero OpenCode/Qwen/provider execution. No production code modified.

## Precheck results

| Check | Result |
|---|---|
| `origin/main` = `ca1be3089ada70e47a84d1273109e468ea59a6f2` | PASS |
| Working tree clean | PASS |
| Port `18791` free before install | PASS (no listener) |
| Repo root | `C:\Users\mrhz\Documents\AI\GitHub\control-plane` (absolute, exists) |
| Existing Tailscale Serve pre-state | `/` → `127.0.0.1:18789` · `/v4/resource-status/local-readonly` → `127.0.0.1:18790` only |
| Readonly Scheduled Task `ControlPlane-V4-LocalRuntimeStatus` | present, untouched |
| Conflicting task for new endpoint | none existed |

## Runtime mutations (authorized, bounded)

1. **Scheduled Task created:** `ControlPlane-V4-LocalExecutionEndpoint`
   - Principal: current user `ASUSDESKTOP\mrhz`, `InteractiveToken` (same pattern as readonly task)
   - Trigger: `AtLogOn` (user `ASUSDESKTOP\mrhz`)
   - Settings: `MultipleInstancesPolicy=IgnoreNew` · `ExecutionTimeLimit=PT0S` · `StartWhenAvailable=true`
   - Command: `C:\Program Files\nodejs\node.exe`
   - Arguments: `"C:\Users\mrhz\Documents\AI\GitHub\control-plane\tools\serve-v4-windows-local-execution-endpoint-v1.mjs" --host 127.0.0.1 --port 18791 --workspace-root C:\Users\mrhz\Documents\AI\GitHub\control-plane`
   - WorkingDirectory: repo root
   - No credentials/secrets stored anywhere
2. **Schema engine provisioning (required for service start):** first task start exited code 1 because the JSON-Schema engine (ajv 2020-12 + ajv-formats) was only reachable via a session env var pointing into `Temp`. Fix: copied the existing engine to stable user-local path `C:\Users\mrhz\AppData\Local\control-plane-schema-engine\node_modules` and set user env var `CONTROL_PLANE_AJV_NODE_MODULES` to it (canonical resolver env var already supported by the tool; no code change, no new packages installed).
3. **Tailscale Serve additive route (private only):**
   - Added: `/v4/execution/opencode-local` → `http://127.0.0.1:18791`
   - Preserved: `/` → `http://127.0.0.1:18789` (OpenClaw) · `/v4/resource-status/local-readonly` → `http://127.0.0.1:18790`

## Structural proofs

| # | Proof | Result |
|---|---|---|
| 1 | Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` exists | PASS |
| 2 | Task command = canonical tool | PASS (XML verified) |
| 3 | host = `127.0.0.1` | PASS |
| 4 | port = `18791` | PASS |
| 5 | `--workspace-root` = absolute repo root | PASS |
| 6 | Exactly one listener `127.0.0.1:18791` | PASS (LISTENER_COUNT=1) |
| 7 | Listener process = service Node (tool+port+host+workspace in cmdline) | PASS (`node.exe` PID verified) |
| 8 | Tailscale Serve contains OpenClaw root + readonly + new path | PASS (all three in `serve status --json`) |
| 9 | New path backend = `http://127.0.0.1:18791` | PASS |
| 10 | Funnel/public exposure | **absent** ("tailnet only") |
| 11 | HTTP requests to execution endpoint | **0** |
| 12 | OpenCode CLI executions | **0** |
| 13 | Qwen generations | **0** |
| 14 | Provider calls | **0** |
| 15 | WF40 | active · `9ZMj2ACTKyDVhCue` · **66 nodes** · versionId `60f9b75e-39b8-410a-bcd1-364073992df0` (unchanged) |
| 16 | WF61 | **inactive** · 13 nodes (unchanged) |
| 17 | D-0025 gate | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** (local + VPS verified) |
| 18 | Readonly service `127.0.0.1:18790` | still exactly one listener (unchanged) |
| 19 | Readonly Scheduled Task | untouched |

WF40/WF61 verification method: read-only `n8n export:workflow` inside container `root-n8n-1` via `ssh ionos-n8n`, structural fields only, temp files removed.

## Preserved

- No production code changes (`git status` shows only this evidence + docs)
- Contract/schema/adapter/guard/classifier unchanged
- OpenClaw root route and readonly route preserved
- Live execution gate remains **CLOSED**

## NEXT

`V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF` — one VPS deliberately unauthorized request; expected `AUTHORIZATION_REJECTED`; execution/generation counters zero.

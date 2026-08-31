# V4 Windows local execution endpoint — offline implementation

**Block:** `V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_OFFLINE_IMPLEMENTATION`
**Result:** PASS
**Authority:** GPT-Web contract `docs/contracts/v4-windows-local-execution-endpoint-v1.md`
**Starting head:** `35f19b3083b79c5d71932bb6ff3c945b91a1c88f`

## Summary

Offline DI implementation of the Windows-local OpenCode execution endpoint. Production bind target remains `127.0.0.1:18791` / `/v4/execution/opencode-local`. Tests use ephemeral port `0` only. No service install/start, no Tailscale/firewall/WF mutation, no live OpenCode/Qwen/provider execution.

## Artifacts

| Role | Path |
|---|---|
| Endpoint tool | `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` |
| Target tests | `tests/v4-windows-local-execution-endpoint/run.mjs` |
| Contract | `docs/contracts/v4-windows-local-execution-endpoint-v1.md` |
| Request schema | `docs/contracts/v4-windows-local-execution-endpoint-v1.request.schema.json` |
| Response schema | `docs/contracts/v4-windows-local-execution-endpoint-v1.response.schema.json` |

## Ownership reuse (no duplication)

- Adapter / auth validation: `executeOpenCodeBounded()` / `validateRuntimeAuthorization()` in `tools/opencode-execution-adapter-v1.mjs`
- Occupancy: `gatherQwenDiagnostics()` + `classifyQwenSharedRuntime()` + `loadRuntimeConfig()` from `tools/produce-v4-local-runtime-readonly-contribution-v1.mjs`
- Guard: adapter production default `startSingleGenerationGuard()` — endpoint does not supply `guardStart`
- CLI surface: `DISPATCH_CLI_CAPABILITIES` from `tools/probe-opencode-local-v1.mjs`
- Provider overlay builder: `buildOpenCodeProviderOverlay()` from `tools/dispatch-opencode-execution-v1.mjs`

## Corrective lineage

1. **Initial offline implementation** — endpoint tool + DI tests authored against GPT-Web contract.
2. **STOP 23/24** — test expected `OCCUPANCY_REJECTED`; canonical adapter returns `OCCUPANCY_BLOCKED`.
3. **Occupancy expectation correction** — `OCCUPANCY_REJECTED` → `OCCUPANCY_BLOCKED` in target suite only.
4. **24/24 + regressions PASS** — then BugBot actionable finding on non-zero exit success accounting.
5. **Non-zero exit fail-closed correction** — child `close` with `code !== 0` or signal rejects/throws into adapter (`OPENCODE_EXIT_NONZERO` / `OPENCODE_TERMINATED_BY_SIGNAL`); never success accounting.
6. **28/28 + regressions PASS** — then BugBot finding: synthetic `qwen_generation_calls` / `upstream_generation_requests` on exit 0.
7. **Guard-accounting authoritative correction** — runner success path attests only `opencode_execution_count`, `retry_calls`, `fallback_calls`, `response_validation`; omits generation counters so adapter uses guard accounting.
8. **30/30 + regressions PASS** — then BugBot finding: unbounded stdout/stderr string accumulation.
9. **Child-output drain correction** — `drainChildOutput()` resumes/discards pipes with zero retention; no parsing/logging/persistence of child output.
10. **Final target suite: 31/31 PASS** (one run).
11. **Final regressions (one run each):**
    - `opencode-execution-adapter` 23/23
    - `opencode-single-generation-guard` 16/16
    - `v4-local-runtime-readonly-contribution` 29/29
    - `v4-local-runtime-readonly-private-endpoint` 22/22
12. **Final BugBot:** PASS_NO_FINDINGS.
13. **Real OpenCode CLI calls = 0; Qwen generation calls = 0; provider calls = 0.**
14. **Runtime / service / Tailscale / workflow mutations = 0.**

## Production runner invariants

- Fixed no-shell spawn: `node` + `opencode-ai` package bin (never `.cmd` via shell)
- Workspace is server-side construction option only (not request field)
- `guardBaseUrl` only from adapter callback; direct Qwen `http://127.0.0.1:8080` rejected
- Single-flight / execution_id replay / authorization_id binding / SPENT terminal — in-memory only
- Exit 0 → structural process accounting without synthetic generation counts
- Exit non-zero / signal → reject into adapter → `ERROR` / `execution_performed=false` / `SPENT`

## Live state preserved

- WF40 = 66 nodes (unchanged)
- WF61 inactive
- D-0025 CLOSED
- LIVE_EXECUTION CLOSED
- Readonly endpoint `127.0.0.1:18790` unchanged
- No listener on production `18791` in this pass

## NEXT

`V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_PRIVATE_SERVICE_PERSISTENCE`

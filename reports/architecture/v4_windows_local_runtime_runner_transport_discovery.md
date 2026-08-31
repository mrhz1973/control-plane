# V4 — Windows local runtime runner / occupancy transport discovery (docs-only)

**Task:** `V4_WINDOWS_LOCAL_RUNTIME_RUNNER_TRANSPORT_DISCOVERY`  
**Date:** 2026-08-31  
**Result:** PASS — repository/code discovery only · RUNTIME_MUTATIONS=0 · EXECUTION_PERFORMED=0  
**Starting HEAD:** `3f5398de0e91707d5dfea3f7899af4384940473a`

This report proposes; it does not authorize. GPT-Web remains the authority that will convert the recommended path into the next contract/TASK DELTA.

## 1. FACTS (verified from repo)

### F1 — Canonical occupancy classification already exists and is pure

`tools/produce-v4-local-runtime-readonly-contribution-v1.mjs`:

- `classifyQwenSharedRuntime(snapshotA, snapshotB, runtimeConfig)` — pure classifier, exactly four outcomes (`QWEN_READY_IDLE` / `QWEN_BUSY_SHARED_RUNTIME` / `QWEN_NOT_RUNNING_SAFE_TO_START` / `QWEN_OCCUPANCY_UNCERTAIN`), never upgraded from UNCERTAIN.
- `gatherQwenDiagnostics(runtimeConfig)` — exactly one bounded read-only PowerShell (two samples, ~1.2s apart; `Get-Process` + `Get-NetTCPConnection` only; PIDs never leave PowerShell).
- Contract: `docs/contracts/v4-local-runtime-readonly-contribution-adapter-v1.md` §3.

The adapter consumes only the classification (`tools/opencode-execution-adapter-v1.mjs` → `occupancyAllowed()`): only `QWEN_READY_IDLE` and `QWEN_NOT_RUNNING_SAFE_TO_START` pass. No duplicated classifier exists downstream.

### F2 — The adapter's missing callbacks are exactly two

`executeOpenCodeBounded(request, options)` in `tools/opencode-execution-adapter-v1.mjs`:

| Callback | Status today | Without it |
|---|---|---|
| `getOccupancy` | **missing in every production caller** | terminal `OCCUPANCY_BLOCKED` / `OCCUPANCY_SOURCE_MISSING` |
| `runOpenCode` | **missing in every production caller** | terminal `RUNNER_NOT_PROVIDED` / `NO_LIVE_EXECUTION_DEFAULT` |
| `guardStart` | **already defaulted** to `startSingleGenerationGuard` (`options.guardStart || startSingleGenerationGuard`) | n/a — no new wiring needed if the runner lives on Windows |

The n8n bridge (`tools/n8n-v4-execution-adapter-router-bridge-v1.mjs`) deliberately forwards none of these and strips them from input (verified by tests `never-forwards-null-optional-or-live-callbacks`, `injected-live-callbacks-on-input-ignored`).

### F3 — The single-generation guard is Windows-loopback by construction

`tools/opencode-single-generation-guard-v1.mjs`: bind host must be `127.0.0.1`; upstream must be `http://127.0.0.1[:port]`; hard budget upstream generation requests ≤ 1; a guard whose `base_url` equals the direct canonical Qwen endpoint `http://127.0.0.1:8080` is rejected by the adapter (`GUARD_TARGET_IS_DIRECT_QWEN_ENDPOINT`). Guard accounting is authoritative over runner claims (`upstream = max(guard, runner)`).

Therefore the guard, the runner, the occupancy sampling, and the OpenCode process must all live on the **same Windows host**. None of these boundaries can be moved to the VPS.

### F4 — A proven private transport pattern already exists

`reports/architecture/v4_local_runtime_readonly_private_endpoint_implementation.md`: loopback Node service (`127.0.0.1:18790`) + Scheduled Task `ControlPlane-V4-LocalRuntimeStatus` + additive Tailscale Serve private path `https://asusdesktop.tailc01234.ts.net/v4/resource-status/local-readonly` → VPS-reachable, tailnet-only, OpenClaw root preserved, no Funnel. The readonly endpoint contract explicitly forbids execution (`docs/contracts/v4-local-runtime-readonly-private-endpoint-v1.md` §1).

### F5 — The session manager exists but is not part of the execution boundary

`tools/qwen-local-session-manager-v1.mjs` (`ensureQwenLocalReady`) can start the Qwen launcher. The adapter and all current contracts forbid the execution lane from invoking it (`QWEN_NOT_RUNNING_SAFE_TO_START` remains informational, `available=false`, authorizes nothing). Any future runner must keep this prohibition.

### F6 — Dispatch and authorization boundaries already have owners

- Dispatch: `DISPATCH_READY` must come from the existing dispatch boundary (`tools/dispatch-opencode-execution-v1.mjs`); never synthesized (bridge contract + WF40 patch `dispatch_result_synthesized=false`).
- Authorization: `validateRuntimeAuthorization` (adapter) requires `operator-runtime-authorization-v1` object, ACTIVE/unused, scope-locked (opencode, qwen_local, fast_8k, guard required, max 1 execution, max 1 generation, retry 0, fallback 0). Terminal spend: `authorization_state_final=SPENT` on any execution attempt.

## 2. DESIGN OPTIONS

### O1 — Where getOccupancy lives

- **O1a (recommended):** in-process on Windows, inside the future execution service: `classifyQwenSharedRuntime(gatherQwenDiagnostics(cfg)…)` called directly at execution time. Reuses F1; zero classifier duplication; fresh evidence.
- O1b: fetch the classification from the existing readonly endpoint over Tailscale. Rejected as primary: adds 300s-freshness semantics, an extra network hop, and samples occupancy before the request rather than at execution time.

### O2 — Where runOpenCode lives

- **O2a (recommended):** in-process on Windows inside the execution service: injects a runner that spawns exactly one OpenCode process with `guardBaseUrl` supplied by the adapter-owned guard, fixed argv, no shell.
- O2b: run the adapter itself on the VPS with remote callbacks. Rejected: violates F3 (guard/loopback) and moves secrets/authority off-host.

### O3 — Transport shape VPS → Windows

- **O3a (recommended):** second, separate private Tailscale Serve path on the same host pattern (e.g. `/v4/execution/opencode-local` → loopback `127.0.0.1:18791`), POST-only, one bounded JSON request, one bounded JSON response.
- O3b: extend the existing readonly service with an execution route. Rejected: the readonly contract is GET-only/no-body/no-credentials; merging observation transport with execution-capable transport increases blast radius and breaks separately-killable services.

### O4 — Replay/concurrency control

- **O4a (recommended):** in-memory single-flight lock (reject with bounded fail-closed body while busy — pattern already proven in the readonly endpoint) + spent-authorization set keyed by `authorization_id` (terminal SPENT) + execution_id idempotency (repeat id returns prior structural result, never re-executes).
- O4b: durable spend ledger from day one. Defer: valuable but larger; first live test can rely on O4a plus operator-issued single authorization; ledger becomes its own block before any repeated use.

## 3. RECOMMENDED MINIMAL PATH

Minimal request/response sketch for the future endpoint (for GPT-Web to ratify):

Request — exactly: `schema_version`, `execution_id` (unique), `runtime_authorization` (full `operator-runtime-authorization-v1` object), `message` (bounded goal text from the packet). Nothing else; `additionalProperties:false`.

Must reject: any command/script/argv field; any path (cwd, file, launcher, config); any model/profile/endpoint/upstream/base_url override; any retry/fallback/parallelism knob; any occupancy hint or classification override; any guard configuration; any token/credential besides the authorization object; batch/multi-execution arrays; query parameters; GET.

Response — bounded structural `opencode-execution-result-v1` + guard accounting counters, `authorization_state_final`, no raw OpenCode stdout/stderr, no process/socket/PID data, no prompts or model outputs persisted.

Anti-abuse mapping (all fail-closed): arbitrary command → fixed code path, no shell, schema rejects unknown fields; path injection → no path fields accepted, Windows-side canonical config only; model/profile → derived solely from validated authorization scope; guard bypass → guard URL assigned by adapter-owned guard, request cannot carry one, direct `127.0.0.1:8080` rejected; retry/fallback → authorization scope enforces 0/0 and adapter treats violations as terminal; replay → single-use spend + idempotent execution_id; concurrency → single-flight reject + occupancy gate at execution time.

### Minimal block sequence to first live test (each separately authorizable)

1. GPT-Web contract: `v4-windows-local-execution-endpoint-v1` (schemas, rejection list, spend/idempotency/concurrency semantics).
2. Offline implementation of the Windows execution endpoint tool + DI tests (zero live run).
3. Windows persistence (own task, own loopback port) + additive Tailscale private path + listener verify (no request).
4. VPS reachability proof with a deliberately unauthorized request — must return `AUTHORIZATION_REJECTED` (zero execution).
5. GPT-Web WF40 execution-transport patch authoring (bridge output → private execution endpoint call, only when dispatch + explicit authorization already exist).
6. Patch apply offline + structural proof (66→N nodes).
7. (Recommended before repeat use) authorization spend ledger block.
8. First live test: operator-issued single-use authorization, idle occupancy, exactly one bounded execution; all counters enforced (opencode_execution_count=1, qwen_generation_calls≤1, retry=0, fallback=0).

## 4. UNRESOLVED DECISIONS (GPT-Web authority)

- Authorization issuance flow (Telegram source vs operator file) — not designed here.
- Spend persistence location/durability (O4a vs O4b timing).
- Whether the request carries the packet goal text or a packet reference resolvable on Windows.
- Response payload content policy (bounded validation only vs sanitized output excerpt).
- Concrete loopback port/path naming for the execution service (18791 and `/v4/execution/opencode-local` are placeholders).

## Preservation (unchanged by this pass)

EXECUTION_ROUTER selection ownership · adapter-router route→adapter mapping · adapter authorization boundary · canonical occupancy classifier (reused, not duplicated) · single-generation guard as hard ceiling · WF40 at 66 nodes · WF61 inactive · D-0025 CLOSED · Tailscale exposure private-only · OpenClaw routing unchanged · no secrets read or reported.

## NEXT

GPT-Web contract authoring for `v4-windows-local-execution-endpoint-v1` (block 1 of the recommended sequence).

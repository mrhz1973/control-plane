# V4 runtime authorization provenance hardening

**Block:** `V4_RUNTIME_AUTHORIZATION_PROVENANCE_HARDENING_VALIDATION_ORDER_CORRECTION`  
**Category:** DELICATO  
**Result:** PASS  
**Starting head:** `84a30b9ded82ce01760f34d94b33616cb951143d`

## Lineage

1. **Initial hardening implementation** — server-side user-local authorization provenance registry; endpoint integration; P1–P17 target tests; execution route contained during development.
2. **Target STOP (46/48)** — two test-expectation / admission-order mismatches diagnosed; no further fixes in that pass.
3. **P7 correction** — invalid registry `route_id` (`other+route`) correctly classified as `AUTHORIZATION_REGISTRY_INVALID` (registry schema const-pins `opencode+qwen_local`; `AUTHORIZATION_ROUTE_MISMATCH` unreachable in v1).
4. **P10 correction** — admission order: replay cache → registry inspect → binding/single-flight → ACTIVE→SPENT persist → adapter. In-memory `spentAuth`/`authBinding` no longer intercept registry-already-SPENT authorizations.
5. **Registry isolation fixes** — per-test registry re-seed for replay/occupancy/concurrency tests after prior tests spent entries.
6. **Final target PASS** — 48/48.
7. **Regressions PASS** — opencode-execution-adapter (23/23), opencode-single-generation-guard (16/16), v4-local-runtime-readonly-contribution (29/29), v4-local-runtime-readonly-private-endpoint (22/22).
8. **BugBot PASS_NO_FINDINGS** — uncommitted changes review, no actionable defects.
9. **Runtime apply** — empty production registry; Scheduled Task updated with `--authorization-registry`; service restarted; listener proof; Tailscale execution route restored additively.
10. **Zero requests/executions** — no HTTP execution endpoint requests; no OpenCode/Qwen/provider calls.

## Artifacts

| Artifact | Role |
|---|---|
| `tools/v4-runtime-authorization-provenance-registry-v1.mjs` | load/validate/inspect/admit (ACTIVE→SPENT, atomic temp+rename) |
| `docs/contracts/v4-runtime-authorization-provenance-registry-v1.md` | registry contract |
| `docs/contracts/v4-runtime-authorization-provenance-registry-v1.schema.json` | route const-pinned schema |
| `tools/serve-v4-windows-local-execution-endpoint-v1.mjs` | admission order integration |
| `docs/contracts/v4-windows-local-execution-endpoint-v1.md` | §8.0 provenance |
| `tests/v4-windows-local-execution-endpoint/run.mjs` | 48 target tests (P1–P17) |

## Admission order (authoritative)

1. Same `execution_id` + same fingerprint → retained replay (before registry).
2. Same `execution_id` + different fingerprint → `EXECUTION_ID_CONFLICT` (before registry).
3. Load + validate server-side provenance registry.
4. Lookup `authorization_id`; reject unknown / SPENT / expired / invalid registry.
5. Only if registry admission is ACTIVE and valid: authBinding conflict, global single-flight, ACTIVE→SPENT atomic persistence, adapter invocation.

## Target acceptance proofs

| # | Requirement | Result |
|---|---|---|
| P7 | invalid registry route → `AUTHORIZATION_REGISTRY_INVALID` | PASS |
| P10 | second new `execution_id` + already-SPENT `authorization_id` → HTTP 200 `AUTHORIZATION_REJECTED` / `AUTHORIZATION_ALREADY_SPENT`, zero adapter/occupancy/runner | PASS |
| — | replay + conflict preserved before registry | PASS |
| — | unknown/malformed/duplicate/expired preserved | PASS |
| — | ACTIVE→SPENT before adapter; persistence failure blocks adapter | PASS |
| — | occupancy block leaves registry SPENT | PASS |
| — | caller cannot select registry path | PASS |
| — | Git `AUTH_V4_*` artifacts non-authoritative | PASS |

## Runtime apply

| Step | Result |
|---|---|
| Empty production registry `%LOCALAPPDATA%\control-plane\v4-runtime-authorization-registry-v1.json` | created (valid empty entries array) |
| Scheduled Task `ControlPlane-V4-LocalExecutionEndpoint` updated with `--authorization-registry` | PASS |
| Service restarted (execution task only) | PASS |
| Exactly one listener `127.0.0.1:18791` | PASS (PID verified, command line includes registry path) |
| Readonly task/service `127.0.0.1:18790` | unchanged |
| Tailscale `/` → `127.0.0.1:18789` | preserved |
| Tailscale `/v4/resource-status/local-readonly` → `127.0.0.1:18790` | preserved |
| Tailscale `/v4/execution/opencode-local` → `127.0.0.1:18791` | restored (additive, tailnet only) |
| Funnel | absent |
| HTTP execution endpoint requests | **0** |
| OpenCode / Qwen / provider calls | **0** |

## Safety boundary preserved

- WF40: 66 nodes unchanged
- WF61: inactive
- D-0025: CLOSED
- Live execution gate: **CLOSED TO LIVE EXECUTION**
- Request/response schemas, canonical adapter, guard, occupancy classifier: unchanged

## NEXT

`V4_WINDOWS_LOCAL_EXECUTION_ENDPOINT_VPS_UNAUTHORIZED_REACHABILITY_PROOF` — one deliberately unauthorized VPS request; expected `AUTHORIZATION_REJECTED`; execution/generation counters zero.

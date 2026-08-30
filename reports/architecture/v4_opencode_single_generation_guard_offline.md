# V4 — OpenCode single-generation guard (offline)

**Block ID:** `V4_OPENCODE_SINGLE_GENERATION_GUARD_OFFLINE`
**Starting HEAD / expected origin/main:** `7ee35748903376e080558cb66fd833c451abf292`
**Status:** **PASS**
**Mutations:** docs/tools/tests only · **Generations:** 0 · **OpenCode run:** 0

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main == expected | PASS |
| CURRENT_FRONTIER NEXT = this block | PASS |
| no `opencode run` / no Qwen / no process kill | PASS |

## Deliverables

| Artifact | Path |
|---|---|
| Contract | `docs/contracts/opencode-single-generation-guard-v1.md` |
| Schema | `docs/contracts/opencode-single-generation-guard-v1.schema.json` |
| Tool | `tools/opencode-single-generation-guard-v1.mjs` |
| Tests | `tests/opencode-single-generation-guard/run.mjs` |

## Topology

```text
OpenCode → 127.0.0.1:<guard_port> → 127.0.0.1:8080 (llama.cpp)
```

Hard ceiling owned by the guard (`max_upstream_generation_requests = 1`), **not** OpenCode `steps`.

## Proven offline

| Requirement | Result |
|---|---|
| first `POST /v1/chat/completions` forwarded once | PASS |
| second sequential generation blocked; upstream stays 1 | PASS |
| concurrent race → exactly one upstream call | PASS |
| failed first still consumes budget; second blocked | PASS |
| streaming first response pass-through; no extra gen | PASS |
| `GET /v1/models` free / repeatable | PASS |
| `POST /v1/responses` rejected | PASS |
| `POST /api/generate` rejected | PASS |
| unknown POST rejected | PASS |
| non-loopback upstream rejected | PASS |
| bind host cannot be non-loopback | PASS |
| Authorization/API-key rejected; value not persisted | PASS |
| accounting has no bodies | PASS |
| invariant `upstream_generation_requests <= 1` | PASS |

## Regression (offline)

| Suite | Result |
|---|---|
| `tests/opencode-single-generation-guard/run.mjs` | **16/16 PASS** |
| `tests/opencode-execution-dispatch/run.mjs` | **PASS** |
| `tests/qwen-local-session-manager/run.mjs` | **14/14 PASS** |
| `tests/qwen-local-resource-status-overlay/run.mjs` | **14/14 PASS** |

Dispatch tool / EXECUTION_ROUTER / packets / registry **unchanged**.

## Counters

| Counter | Value |
|---|---|
| qwen_generation_calls | **0** |
| opencode_execution_count | **0** |
| provider_calls | **0** |
| process_kill_calls | **0** |
| process_stop_calls | **0** |
| runtime_restart_calls | **0** |
| secret_exposure | **false** |

## NEXT

**`V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH_2`** — fresh **human** runtime gate. Do **not** create AUTH or execute live proof in this pass.

Later live proof must use: tools denied · **no** `steps=1`/`steps=2` as generation ceiling · this external guard as hard max-one · fresh shared-runtime occupancy preflight.

---

## Output line

`PASS — OPENCODE SINGLE GENERATION GUARD OFFLINE / MAX_UPSTREAM_GENERATIONS=1 / TESTS=PASS / GENERATIONS=0`

# local-dev-executor-v1

Thin workstation-only executor for economical bounded general-purpose local
development tasks:

```text
TASK DELTA
→ LOCAL_DEV_EXECUTOR
→ OpenCode
→ Qwen locale (router :8080)
→ test
→ Git PASS/STOP
→ agg / GitHub evidence
```

**Status:** DESIGN ONLY — no runtime is implemented by this contract. The
implementation pass is `V4_LOCAL_DEV_EXECUTOR_QWEN_GENERAL_PURPOSE_IMPLEMENTATION_V1`.

## Purpose

Give the operator a cheap, bounded, local-first path for general development
tasks on arbitrary target repositories, driven by an explicit TASK DELTA,
without touching the production execution path in any way.

## Non-goals

- No production WF40 live execution, no D-0025, no Telegram runtime
  authorization, no scope-v3 production execution.
- No automatic ingress into WF40 or any production workflow.
- No change to the six-profile Control Plane eligible set or role mappings.
- No Cline UI usage or Cline configuration changes.
- No unbounded loops, implicit retries, or fallbacks.
- No cross-repository operations beyond the single declared target repo.

## Domain separation

Two explicitly distinct domains; neither may borrow the other's authority.

### PRODUCTION_EXECUTION_DOMAIN (unchanged)

- Six-profile Control Plane eligible set (`configs/resources/qwen-local-runtime.json` → `profiles`).
- WF40 structural routing, Windows execution endpoint, durable spend ledger,
  provenance registry.
- `operator-runtime-authorization-v1`, scope-v3 binding, single-generation
  guard, `opencode-execution-adapter-v1.mjs` fail-closed core.
- Executor `qwen38-opus-q3-agent-24k`, role FAST_AGENT.

LOCAL_DEV_EXECUTOR MUST NOT call, wrap, extend, or simulate any component of
this domain. It is not registered in `v4-execution-adapter-registry-v1`, is
not a route in EXECUTION_ROUTER, and never receives or creates a
`operator-runtime-authorization-v1` object.

### LOCAL_DEV_DOMAIN (this contract)

- Workstation-only; no VPS, no tailnet exposure, no HTTP listener beyond the
  guard proxy bound to `127.0.0.1`.
- Authority source: explicit TASK DELTA envelope + standing operator
  authorization (`docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`), which
  covers bounded project execution without per-task Telegram gating.
- No Telegram gate for bounded dev tasks; no authorization token to spend.
- Profile category `workstation_dev_executor_profile` — a NEW category,
  distinct from `control_plane_eligible_profile`. Members are resolved from
  `workstation_manual_profiles` in `configs/resources/qwen-local-runtime.json`
  and are never added to `profiles`, `role_to_profile_id`, or any eligible set.

## Reuse strategy (Form A — thin wrapper)

The production adapter core is hard-bound to exactly one authorization
schema, one generation, one profile, one role, and scope-v3. A bounded
multi-turn dev loop is incompatible with those bindings, and reusing the
adapter would require either fabricating an authorization object (forbidden)
or weakening the adapter (forbidden). Therefore LOCAL_DEV_EXECUTOR is a thin
wrapper that reuses only safe, authorization-free primitives:

| Primitive | Source | Reuse |
|---|---|---|
| Qwen lifecycle | `tools/qwen-local-session-manager-v1.mjs` | `ensureQwenLocalReady({ profile })` as-is (discover/reuse/start; additive dev-profile resolution below) |
| OpenCode probe | `tools/probe-opencode-local-v1.mjs` | availability + CLI capability resolution |
| Dispatch spec shape | `tools/dispatch-opencode-execution-v1.mjs` | `buildOpenCodeProviderOverlay` + argv construction pattern (imported; the DISPATCH_READY boundary itself is not used) |
| Runtime config | `tools/qwen-local-runtime-v1.mjs` | `loadQwenLocalRuntime` (read-only) |
| Guard pattern | `tools/opencode-single-generation-guard-v1.mjs` | pattern only: local proxy counting upstream generation requests; OpenCode target = guard base URL, never direct `:8080`. Ceiling is `max_agent_turns` (N ≥ 1), not 1. New tool `tools/local-dev-generation-guard-v1.mjs` in the implementation pass |

Explicitly NOT reused: `opencode-execution-adapter-v1.mjs` core,
`operator-runtime-authorization-v1` validation, occupancy gate wired to
production state, spend ledger, provenance registry, issuance service,
EXECUTION_ROUTER, adapter registry.

## Input envelope (TASK DELTA)

Schema `local-dev-task-envelope-v1`. All fields required unless noted.

```text
task_ref                non-empty unique task identifier (e.g. BLOCK-ID style)
target_repo_path        absolute path of the single target repository
target_remote           expected remote URL of target_repo_path
dispatch_base_head      expected HEAD sha of target repo before execution
profile_id              exact workstation_dev_executor_profile id
task_delta              bounded, declarative description of the change
allowed_paths           path globs the executor may read/modify
allowed_commands        explicit command allowlist (test_command included)
test_command            optional single deterministic test command
network_policy          one of: offline | localhost_only (default localhost_only)
timebox_seconds         hard wall-clock bound (recommended ≤ 900)
max_agent_turns         hard ceiling of model turns (recommended ≤ 8)
max_test_cycles         hard ceiling of test executions (0 unless the TASK
                        DELTA explicitly declares a bounded implement→test→
                        correct loop; recommended ≤ 2)
git_persistence_required  boolean; PASS requires commit+push when true
```

Validation: fail-closed `ENVELOPE_INVALID` on any missing/ill-typed field,
`max_test_cycles > 0` without an explicit declared corrective loop in
`task_delta`, `timebox_seconds`/`max_agent_turns`/`max_test_cycles` above
hard caps (1800 / 16 / 3), or `profile_id` not resolving to a
`workstation_dev_executor_profile`.

## Preflight

1. **Repo identity:** run `git -C <target_repo_path> rev-parse HEAD` and
   remote URL resolution; both must match `dispatch_base_head` and
   `target_remote` exactly. The repo is NEVER inferred from the Cursor
   workspace. Mismatch → `STOP — PREFLIGHT_REPO_IDENTITY_MISMATCH`.
2. **Cleanliness semantics:**
   - Pre-existing untracked files: NOT a blocker; preserve, never stage,
     never delete.
   - Tracked modifications outside `allowed_paths` → `STOP —
     PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE` (see classifications).
   - Tracked modifications inside `allowed_paths` that conflict with the
     task delta → `STOP — PREFLIGHT_CONFLICTING_LOCAL_CHANGES`.
3. **Profile resolution:** `profile_id` must resolve from
   `workstation_manual_profiles` (category `workstation_dev_executor_profile`).
   The six production profiles are resolvable ONLY by the production domain;
   using one here → `ENVELOPE_INVALID` (`PROFILE_NOT_DEV_CATEGORY`).
4. **Tool availability:** OpenCode probe must report available; guard port
   bindable. Otherwise `STOP — PREFLIGHT_TOOLING_UNAVAILABLE`.

## Qwen service lifecycle

Canonical principle of `qwen-local-session-manager-v1` reused verbatim:

- Discover live state first (`/v1/models` on `http://127.0.0.1:8080`).
- Reuse a healthy router if the profile is already exposed
  (`router_was_running=true`, `launch_performed=false`).
- Start via the operator launcher ONLY if discovery fails and the task
  requires the model (`launch_performed=true`).
- Record `router_was_running` in the result envelope.
- Ownership restore: if — and only if — LOCAL_DEV_EXECUTOR started the
  router exclusively for this task, it may stop it at task end; before any
  consequential stop it MUST rediscover live process identity (never trust a
  stale PID; `Get-QwenRouterProcesses`-style live query, not cached pid).
- If the router was already running, leave it running.
- No llama-ui / browser interaction is ever required or performed.

## OpenCode boundary

- Exactly one OpenCode process per task; model selector
  `qwen_local/<model_id>` built from the resolved dev profile.
- OpenCode target is ALWAYS the local guard proxy base URL, never the direct
  canonical `:8080` endpoint.
- The guard enforces `upstream_generation_requests <= max_agent_turns`;
  exceed → guard blocks, executor classifies `BOUNDS_TURN_CEILING_EXCEEDED`.
- `network_policy: offline` forbids any non-localhost egress in commands;
  `localhost_only` (default) additionally permits only `127.0.0.1` targets.

## Bounded execution limits

- Hard wall-clock timebox `timebox_seconds`; expiry → `STOP — TIMEBOX_EXPIRED`.
- Hard model-turn ceiling `max_agent_turns` (guard-enforced).
- Hard test-cycle ceiling `max_test_cycles`; a small implement→test→correct
  loop is permitted ONLY when declared in `task_delta` with a numeric bound.
- Retries/fallbacks: only those explicitly declared in the envelope; any
  implicit retry or fallback → `BOUNDS_VIOLATION_RETRY_OR_FALLBACK`.
- STOP at the first real blocker not correctable within the declared bounds
  (no exploratory fix loops — standing authorization one-pass default).

## Test policy

- `test_command` (optional): one deterministic command from
  `allowed_commands`, run at most `max_test_cycles` times.
- PASS requires: exit code 0 on the final run AND no regression evidence in
  the run output classification.
- No test → PASS is judged on structural diff review within `allowed_paths`.

## Git persistence

- No `reset --hard`, no `clean`, no destructive or history-rewriting command,
  ever.
- Pre-existing untracked files: never staged, never deleted (provenance
  snapshot at pre-run; violations stop the run).
- Selective staging: only files inside `allowed_paths` changed by this task.
  Two stageable classes exist (option-B semantics, operator-authorized
  2026-09-05):
  1. tracked in-scope files modified by this task;
  2. TASK_CREATED_UNTRACKED files: paths that did NOT exist in the pre-run
     untracked snapshot, appeared during this run, and are inside
     `allowed_paths`.
  PREEXISTING_UNTRACKED files (present in the pre-run snapshot) remain
  absolutely protected: never staged, never modified/deleted/renamed by
  persistence logic, never included in the executor commit. A pre-existing
  untracked file that goes missing or changes case-identity during the run
  → `STOP:PREEXISTING_UNTRACKED_MODIFIED`. A new untracked file outside
  `allowed_paths` → `STOP:UNEXPECTED_FILE_CHANGES`. Case-only path
  collisions → `STOP:PATH_NORMALIZATION_AMBIGUOUS`. Undeterminable
  provenance → fail closed before staging.
- Commit + push to the target repo remote only when
  `git_persistence_required=true`; push target is exclusively
  `target_repo_path`'s `target_remote`.
- Zero operations on any repository other than the target (the Control Plane
  repo is never touched by the executor itself).

## PASS/STOP evidence (provider-neutral)

Evidence envelope `local-dev-execution-result-v1`, committed in the target
repo (and/or attached to the task report) with:

```text
task_ref, base_head, final_head,
actor/executor   (e.g. local-dev-executor-v1; NOT a person),
profile_id, tests (command + exit codes + cycle count),
changed_files, classification (PASS | STOP:<code>),
router_was_running, launch_performed, turns_used, timebox_used_s
```

Commit subjects are provider-neutral:

```text
executor-pass: <TASK_REF>
executor-stop: <TASK_REF>
```

Rationale: `cursor-pass:` identifies the Cursor agent as actor; local dev
tasks may be executed by Cursor OR by the Qwen-driven LOCAL_DEV_EXECUTOR.
The `executor-*:` prefix lets a future AGG/GPT-Web GitHub-evidence consumer
identify PASS/STOP independent of the implementing agent. The AGG protocol
itself is NOT modified in this pass.

## Failure classifications

```text
ENVELOPE_INVALID                     envelope failed validation
PREFLIGHT_REPO_IDENTITY_MISMATCH     remote/base-head mismatch
PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE tracked dirty outside allowed_paths
PREFLIGHT_CONFLICTING_LOCAL_CHANGES  dirty files conflict with delta
PREFLIGHT_TOOLING_UNAVAILABLE        opencode/guard/router unavailable
PROFILE_NOT_DEV_CATEGORY             non-dev profile requested
QWEN_SESSION_NOT_READY               ensureQwenLocalReady not ready
BOUNDS_TURN_CEILING_EXCEEDED         guard blocked > max_agent_turns
BOUNDS_TIMEBOX_EXPIRED               wall-clock bound hit
BOUNDS_TEST_CYCLES_EXCEEDED          > max_test_cycles runs
BOUNDS_VIOLATION_RETRY_OR_FALLBACK   implicit retry/fallback attempted
TEST_FAILED                          final test run non-zero
GIT_PERSISTENCE_FAILED               commit/push failed on target repo
UNEXPECTED_FILE_CHANGES              diff outside allowed_paths
BLOCKER_UNCORRECTABLE                real blocker inside bounds
```

## Security / safety boundaries

- LOCAL_DEV_EXECUTOR never reads, creates, or spends production
  authorization material; no WF40/D-0025 token reuse.
- The production fail-closed path is untouched: no edits to
  `opencode-execution-adapter-v1.mjs`, guard v1, registry, router, or
  authorization tooling.
- Dev profile stays outside the eligible set; no role mapping gains entries.
- Guard proxy binds `127.0.0.1` only; no tailnet/Funnel exposure.
- Evidence envelopes contain structural fields only — no prompts, model
  outputs, or secrets (secret-pattern scan before persistence).

## Future AGG integration (design hook only)

`executor-pass:` / `executor-stop:` subjects plus the
`local-dev-execution-result-v1` envelope are the stable surface a future
AGG/GitHub-evidence consumer will scan. Integration is deferred; the AGG
protocol is unchanged in this pass.

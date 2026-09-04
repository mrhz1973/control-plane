# V4 LOCAL_DEV_EXECUTOR — Qwen general-purpose bounded design

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_QWEN_GENERAL_PURPOSE_DESIGN`
**Classification:** `LOCAL_DEV_EXECUTOR_DESIGN_COMPLETE`
**Dispatch base head:** `27df03a2a5b582c2abb5565ffc131c185eb613a8`
**Date:** 2026-09-04
**Deliverable:** `docs/contracts/local-dev-executor-v1.md`

## Problem

The workstation needs an economical, bounded, general-purpose local
development path (TASK DELTA → local executor → OpenCode → local Qwen → test
→ Git PASS/STOP → agg/GitHub evidence) that is fully separate from WF40
production live execution, D-0025, Telegram runtime authorization, scope-v3
production execution, and the Cline UI.

## Design decision — Form A (thin wrapper)

`opencode-execution-adapter-v1.mjs` hard-binds its core to
`operator-runtime-authorization-v1` (scope-v3, FAST_AGENT,
`qwen38-opus-q3-agent-24k`, exactly one generation, retry=0, fallback=0).
A bounded dev loop (multi-turn, N test cycles) is structurally incompatible
with those bindings. Reusing the adapter core would require either a
fabricated authorization object (forbidden) or weakening its fail-closed
contract (forbidden). Form B (reuse via a DEV entrypoint) is therefore
rejected.

Form A reuses only authorization-free primitives:

- `ensureQwenLocalReady` from `qwen-local-session-manager-v1.mjs`
- `probeOpenCodeLocal` availability/capability resolution
- `buildOpenCodeProviderOverlay` + dispatch-spec argv pattern
- read-only `loadQwenLocalRuntime`

A new `local-dev-generation-guard-v1` proxy applies the production guard
pattern with ceiling `max_agent_turns` instead of 1.

## Domain separation

- **PRODUCTION_EXECUTION_DOMAIN** — unchanged: six-profile eligible set,
  WF40, runtime authorization, scope-v3, spend ledger, provenance. The local
  dev executor never calls, registers with, or simulates any of it.
- **LOCAL_DEV_DOMAIN** — workstation-only, explicit TASK DELTA envelope,
  standing operator authorization (no Telegram gate for bounded dev tasks),
  no automatic WF40 ingress, new profile category
  `workstation_dev_executor_profile` (distinct from
  `control_plane_eligible_profile`).

## Primary DEV profile

`qwen38-opus-q3-cline-64k` — recommended initial mapping:

```text
purpose = GENERAL_LOCAL_DEV
context = 65536
category = workstation_dev_executor_profile
```

Why it is distinct from production FAST_AGENT 24K: production short-turn
selection binds `qwen38-opus-q3-agent-24k` (24K, scope-v3, single
generation, one-pass). Local dev wants a large cheap context for
general-purpose code work with multi-turn bounded loops — different purpose,
different bounds, different authority source. It remains outside the
production eligible set: it is resolved ONLY from
`workstation_manual_profiles`, selected explicitly by `profile_id` in the
envelope, and any attempt to select a production profile in the dev domain
is rejected (`PROFILE_NOT_DEV_CATEGORY`). Future escalation/fallback between
dev profiles is explicitly NOT designed or implemented now.

## Bounded execution policy

Hard caps: `timebox_seconds` (recommended ≤ 900, hard 1800),
`max_agent_turns` (recommended ≤ 8, hard 16), `max_test_cycles`
(0 by default; > 0 only when the TASK DELTA declares a bounded
implement→test→correct loop, hard 3). Explicit retries only; implicit
retry/fallback is a bounds violation. STOP at the first uncorrectable
blocker — consistent with the standing one-pass default.

## Qwen lifecycle ownership

Session-manager principle reused verbatim: discover/reuse first, start only
if needed via the operator launcher, record `router_was_running`, restore
prior state only when the executor was the sole starter (with live
process-identity rediscovery before any stop; never trust stale PIDs). No
llama-ui browser involvement.

## Provider-neutral PASS/STOP evidence

```text
executor-pass: <TASK_REF>
executor-stop: <TASK_REF>
```

with `local-dev-execution-result-v1` envelope (task_ref, base_head,
final_head, actor/executor, profile_id, tests, changed_files,
classification). This lets a future user → agg → GPT-Web → GitHub-evidence
chain identify PASS/STOP regardless of whether Cursor or the Qwen-driven
executor performed the work. The `cursor-pass:` prefix was rejected for this
path because it names a specific agent; `executor-*:` is actor-neutral. AGG
protocol changes are deferred (design hook only).

## Production invariants preserved

- WF40 / D-0025 / scope-v3 / eligible set / role mappings: unchanged.
- No Qwen generations, no OpenCode execution, no service lifecycle actions
  in this design pass (design only).
- No repository other than control-plane was touched.

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_GENERAL_PURPOSE_IMPLEMENTATION_V1`

Implement the thin local-dev executor (`tools/local-dev-executor-v1.mjs`,
guard, envelope validation, evidence writer) plus deterministic offline
tests. NO real Qwen task execution in that pass.

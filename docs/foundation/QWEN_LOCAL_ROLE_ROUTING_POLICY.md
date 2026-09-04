# Qwen local role-routing policy — Control Plane

Status: **CANONICAL — six-profile Control Plane eligibility set on MultiModel router superset (AGG 2026-09-03 role correction preserved; 2026-09-04 router-superset reconciliation applied)**  
Policy version: `qwen38-rtx3060-2026-09-03`  
Role-qualification overlay: `qwen38-rtx3060-2026-09-03-agg` (`configs/resources/qwen-role-qualification.json`)

Authoritative runtime: existing MultiModel router at `http://127.0.0.1:8080`  
Source repository: `mrhz1973/qwen38-blender-lab` (Control Plane six-profile milestone through `03198e1587f6388634c9ffd749f1633c05e72aa8`; workstation router drift observed through `1ba1a1f1497e588f9833cbd5bdcbb3f8602f33a0`)

This supersedes the 2026-09-02 abstract OPUS/DCFR + `AGENT_16K` draft and the prior
`fast_8k` / DFlash2 universal production assumptions.

## Architecture

```text
Control Plane selects exact eligible profile_id
        |
        v
http://127.0.0.1:8080  (qwen_runtime_router.py)
        |
        +-- normal llama.cpp backend
        |
        +-- D-CFR on-demand sidecars
        |
        +-- additional workstation-local profiles MAY coexist but are not
            Control Plane-eligible unless explicitly admitted by policy
```

Control Plane **must not** reconstruct `llama-server` launch commands.
The router owns backend selection and the production stream/identity fixes.

Startup / default profile: `qwen38-opus-q3-daily-16k`.

## Six Control Plane production profiles (immutable eligibility set)

| profile_id | Role(s) |
|---|---|
| `qwen38-opus-q3-daily-16k` | DAILY / QUALITY |
| `qwen38-opus-q3-agent-24k` | QUALITY_AGENT_24K |
| `qwen38-dcfr-iq3-fast-16k` | FAST |
| `qwen38-dcfr-iq3-agent-24k` | FAST_THROUGHPUT_LONG_TASK / MCP / BLENDER_FAST |
| `qwen38-original-ar-16k` | REFERENCE |
| `qwen38-uncensored-ar-16k` | MANUAL_UNCENSORED / USER_OVERRIDE |

Control Plane requires all six IDs above to remain exposed and addressable through `:8080`.
They must not be removed, renamed, hidden, retired, or deleted by Control Plane work.

**Router-catalog superset rule (2026-09-04):** `GET /v1/models` may expose additional workstation-local profiles. Their presence is not a policy failure and does not make them Control Plane-eligible. Control Plane must route only to profile IDs explicitly listed in the six-profile eligibility set above unless a future policy change admits another profile.

Observed current router catalog: 8 visible profiles = 6 Control Plane-eligible + 2 known out-of-scope workstation-local profiles:

- `qwen38-dcfr-iq3-blender-96k`
- `qwen38-opus-q3-blender-96k`

These two profiles are **OUT OF CONTROL PLANE SCOPE**. They must not affect role qualification, WF40 routing, authorization scope, automatic profile selection, or `NEXT`.

Machine-readable overlay: `configs/resources/qwen-router-catalog-scope-overlay.json`.

## Automatic routing (exact profile IDs)

| Role | profile_id |
|---|---|
| DAILY | `qwen38-opus-q3-daily-16k` |
| QUALITY | `qwen38-opus-q3-daily-16k` |
| QUALITY_AGENT_24K | `qwen38-opus-q3-agent-24k` |
| FAST | `qwen38-dcfr-iq3-fast-16k` |
| FAST_AGENT | `qwen38-opus-q3-agent-24k` |
| FAST_INTERACTIVE | `qwen38-opus-q3-agent-24k` |
| FAST_AGENT_SHORT_TURN | `qwen38-opus-q3-agent-24k` |
| MCP | `qwen38-dcfr-iq3-agent-24k` |
| BLENDER_FAST | `qwen38-dcfr-iq3-agent-24k` |
| REFERENCE | `qwen38-original-ar-16k` |
| MANUAL_UNCENSORED | `qwen38-uncensored-ar-16k` |

Invariants:

- FAST_AGENT must not silently fall back to DCFR 16K.
- DCFR profiles must not silently use the normal llama.cpp backend.
- Sensitive topics must **not** auto-select Uncensored.
- Explicit user selection may override OPUS/DCFR preference, including Uncensored.
- Router-visible profiles absent from the six-profile eligibility set must not be auto-routed by Control Plane.
- Human authorization for external/irreversible actions remains unchanged.

## Uncensored retention (hard)

`qwen38-uncensored-ar-16k` remains available:

- `keep_in_selector = true`
- `selection = explicit_user_choice`
- `auto_route_sensitive_topics = false`
- `delete_without_explicit_user_authorization = false`

Benchmark “UNCENSORED_SPECIALIST = RETIRED” means only: do not auto-select for
sensitive topics. It does **not** authorize removal, hiding, or deletion.

## Next WF40 executor — OPUS24K selected (operator decision 2026-09-04)

```text
profile_id = qwen38-opus-q3-agent-24k
role       = FAST_AGENT
endpoint   = http://127.0.0.1:8080
scope_version = qwen-execution-scope-v3
```

The operator selected OPUS Agent 24K based on the bounded retained-profile
comparison in `reports/architecture/v4_qwen_short_turn_live_comparison_retained_profiles.md`.
It passed the required single fake-tool decision and was faster than OPUS Daily
16K in both measured cases. The measured caveat is preserved: OPUS may expose
`<think>` content; exact-output compliance is not claimed.

New empirical finding (live local backend tests, RTX 3060 12 GB, bypassing UI
and router): DCFR IQ3 short-turn interactive performance is unsuitable —

- 34-token prompt: ~19–20 s prompt evaluation
- 39-token completion: ~4.8–5.0 tok/s
- total simple request: ~27 s
- identical at ctx 16K and ctx 8K

Correct interpretation: **DCFR = FAST_THROUGHPUT / LONG_TASK**. The existing
long-workload benchmark remains valid (cold prefill ~87–90 tok/s at 2K–8K;
long decode ~12.56 tok/s).

Consequences:

- `FAST_AGENT` / `FAST_INTERACTIVE` / `FAST_AGENT_SHORT_TURN` are now
  **QUALIFIED for `qwen38-opus-q3-agent-24k`** by this explicit operator
  decision. The qualification does not claim exact-output compliance.
- DCFR remains preserved and **UNQUALIFIED for short-turn roles**, while
  `FAST_THROUGHPUT_LONG_TASK` remains qualified. Do NOT delete or retire DCFR.
- All six Control Plane production profiles and router/runtime paths are preserved.
- Additional workstation-local router profiles do not change this qualification result.
- Live execution remains bounded by scope-v3 and the existing single-generation
  gates.
- Blender workloads are OUT OF SCOPE for Control Plane and are not imported into this policy beyond the explicit exclusion of the two router-visible local-only profile IDs above.

## DFlash2 semantics

Production DFlash2 **profiles** are RETIRED (do not restore Original/Uncensored
DFlash2 8K/16K/32K; do not require `dflash_required=true`).

`C:\Users\mrhz\llama.cpp-dflash2\` remains the **normal** production llama.cpp
runtime directory. Do not confuse profile retirement with directory unused.

## Identities (attestation only)

- OPUS GGUF SHA-256 `abca69f6401dfdf361092071687b9a925df9c4846d4f040e4facddb663f74e0b`
- Normal runtime: llama.cpp build `10499` / commit `1deefcca3`
- DCFR GGUF SHA-256 `c0b7c3038681ed2e3040456c1dd45f9858b6c2290bed172c70388a94874f3eee`
- DCFR runtime binary SHA-256 `fb26db5520d2ccdd57ac0575c62e120ccb6db74a1292ef0cd85bfdec721d631d`

These are readiness/attestation data, not permission to reconstruct launches.

The workstation llama-ui agentic Copy fix validated on 2026-09-04 remains an isolated/non-production Control Plane concern: the normal production runtime identity above is unchanged until a separately validated switch occurs.

## Authorization scope

Active next-WF40 producers/consumers use `qwen-execution-scope-v3` (see
`docs/contracts/qwen-execution-scope-v3.md`). Scope-v2 remains historical.
Register-pending HTTP body remains
exactly eight keys; `route_id` remains `opencode+qwen_local`.

## Machine source of truth

`configs/resources/qwen-local-model-policy.json`  
`configs/resources/qwen-local-runtime.json`  
`configs/resources/qwen-router-catalog-scope-overlay.json`

Reconciliation evidence: `reports/architecture/v4_qwen_workstation_runtime_reconciliation_2026-09-04.md`.

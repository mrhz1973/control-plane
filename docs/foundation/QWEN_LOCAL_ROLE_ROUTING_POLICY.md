# Qwen local role-routing policy — Control Plane

Status: **CANONICAL — six-profile MultiModel router integrated (AGG 2026-09-03 role correction applied)**  
Policy version: `qwen38-rtx3060-2026-09-03`  
Role-qualification overlay: `qwen38-rtx3060-2026-09-03-agg` (`configs/resources/qwen-role-qualification.json`)

Authoritative runtime: existing MultiModel router at `http://127.0.0.1:8080`  
Source repository: `mrhz1973/qwen38-blender-lab` (milestone commits through `03198e1587f6388634c9ffd749f1633c05e72aa8`)

This supersedes the 2026-09-02 abstract OPUS/DCFR + `AGENT_16K` draft and the prior
`fast_8k` / DFlash2 universal production assumptions.

## Architecture

```text
Control Plane selects exact profile_id
        |
        v
http://127.0.0.1:8080  (qwen_runtime_router.py)
        |
        +-- normal llama.cpp backend :18080
        |
        +-- D-CFR on-demand sidecars :18200 / :18210
```

Control Plane **must not** reconstruct `llama-server` launch commands.
The router owns backend selection and the production stream/identity fixes.

Startup / default profile: `qwen38-opus-q3-daily-16k`.

## Six production profiles (immutable catalog)

| profile_id | Role(s) |
|---|---|
| `qwen38-opus-q3-daily-16k` | DAILY / QUALITY |
| `qwen38-opus-q3-agent-24k` | QUALITY_AGENT_24K |
| `qwen38-dcfr-iq3-fast-16k` | FAST |
| `qwen38-dcfr-iq3-agent-24k` | FAST_AGENT / MCP / BLENDER_FAST |
| `qwen38-original-ar-16k` | REFERENCE |
| `qwen38-uncensored-ar-16k` | MANUAL_UNCENSORED / USER_OVERRIDE |

`GET /v1/models` through `:8080` must expose exactly these six production profiles.
Do not remove, rename, hide, retire, or delete any of them.

## Automatic routing (exact profile IDs)

| Role | profile_id |
|---|---|
| DAILY | `qwen38-opus-q3-daily-16k` |
| QUALITY | `qwen38-opus-q3-daily-16k` |
| QUALITY_AGENT_24K | `qwen38-opus-q3-agent-24k` |
| FAST | `qwen38-dcfr-iq3-fast-16k` |
| FAST_AGENT | `qwen38-dcfr-iq3-agent-24k` |
| MCP | `qwen38-dcfr-iq3-agent-24k` |
| BLENDER_FAST | `qwen38-dcfr-iq3-agent-24k` |
| REFERENCE | `qwen38-original-ar-16k` |
| MANUAL_UNCENSORED | `qwen38-uncensored-ar-16k` |

Invariants:

- FAST_AGENT must not silently fall back to DCFR 16K.
- DCFR profiles must not silently use the normal llama.cpp backend.
- Sensitive topics must **not** auto-select Uncensored.
- Explicit user selection may override OPUS/DCFR preference, including Uncensored.
- Human authorization for external/irreversible actions remains unchanged.

## Uncensored retention (hard)

`qwen38-uncensored-ar-16k` remains available:

- `keep_in_selector = true`
- `selection = explicit_user_choice`
- `auto_route_sensitive_topics = false`
- `delete_without_explicit_user_authorization = false`

Benchmark “UNCENSORED_SPECIALIST = RETIRED” means only: do not auto-select for
sensitive topics. It does **not** authorize removal, hiding, or deletion.

## Next WF40 executor — STALE (AGG 2026-09-03)

```text
profile_id = qwen38-dcfr-iq3-agent-24k
role       = FAST_AGENT
endpoint   = http://127.0.0.1:8080
scope_version = qwen-execution-scope-v2
```

**This mapping is STALE and must not govern the next live execution proof.**

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

- `FAST_INTERACTIVE` / `FAST_AGENT_SHORT_TURN` are **UNQUALIFIED** pending a
  comparison of retained profiles (`qwen38-original-ar-16k`,
  `qwen38-opus-q3-daily-16k`, `qwen38-opus-q3-agent-24k`).
- Do NOT delete or retire DCFR. Do NOT silently replace it.
- All six production profiles and router/runtime paths are preserved.
- Live execution bound to an UNQUALIFIED role fails closed at:
  dispatch (`PROFILE_ROLE_UNQUALIFIED`), WF40 proposal/authorization minting,
  and the OpenCode adapter (`ROLE_UNQUALIFIED_FOR_LIVE_EXECUTION`).
- Blender is OUT OF SCOPE for Control Plane and is not introduced into this
  change.

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

## Authorization scope

Active producers/consumers use `qwen-execution-scope-v2` (see
`docs/contracts/qwen-execution-scope-v2.md`). Register-pending HTTP body remains
exactly eight keys; `route_id` remains `opencode+qwen_local`.

## Machine source of truth

`configs/resources/qwen-local-model-policy.json`  
`configs/resources/qwen-local-runtime.json`

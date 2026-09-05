# V4 — Cline24K DEV profile placement remediation (v1)

Task: `V4_CLINE24K_DEV_PROFILE_PLACEMENT_REMEDIATION_V1`
Base: `751997f3dfa1a0dd3a97d450037484034b118f4f`
Date: 2026-09-05
Operator decision: **B — reduce the dedicated DEV context size.**

## Operator decision & rationale

Option B selected over (a) freeing desktop VRAM, (c) longer timeboxes,
(d) lighter profile. Why 24K: the repo already proved the OPUS Q3 24K
operating point (`qwen38-opus-q3-agent-24k`, ctx 24576) as a viable
short-turn profile, but that identity is Control-Plane-eligible and MUST NOT
be reused by LOCAL_DEV_EXECUTOR, which resolves DEV profiles exclusively
from `workstation_manual_profiles` (category
`workstation_dev_executor_profile`). A distinct workstation-only profile
preserves that architectural isolation.

## Proven input

`V4_CLINE64K_BACKEND_RUNTIME_STATE_INSPECTION_V1` = PASS, classification
**B — BACKEND_CPU_OFFLOAD_OR_PLACEMENT_BOUNDARY**: private 14.2 GB vs 12 GB
VRAM, ~97 % VRAM resident, single instance, config↔live match, ~3-4 s/token,
64K KV pressure contributing.

## 64K preservation proof

- Preset `qwen-models.ini`: `[qwen38-opus-q3-cline-64k]` stanza byte-identical
  before/after (backup-vs-updated delta shows ONLY the added 24K stanza).
- `qwen-local-runtime.json` git diff: purely additive; 64K entry untouched.
- Post-reload `/v1/models`: `qwen38-opus-q3-cline-64k` still exposed.
- `DEFAULT_DEV_PROFILE_ID` changed, but explicit 64K selection remains
  resolvable (test "cline-64k resolves as DEV profile" still passes).

## New profile definition

INI stanza added (after 64K, additive):

```
[qwen38-opus-q3-cline-24k]
model = D:\AI\qwen38-blender-lab\models\qwen38-opus\Qwen3.8-27B-Opus-Distill-v2-Q3_K_M.gguf
alias = Qwen3.8 OPUS Q3 — CLINE DEV (24K)
tags = OPUS,Q3,CLINE,DEV,24K,agent
ctx-size = 24576
n-gpu-layers = 50
cache-type-k = q4_0
cache-type-v = q4_0
spec-type = none
reasoning = off
```

Globals (`parallel=1`, `threads=20`, `flash-attn=on`, `jinja=on`) unchanged.

## Local INI backup + hashes

- Backup: `C:\Users\mrhz\llama.cpp-dflash2\qwen-models.ini.2026-09-05T0354.bak`
  (local-only, NOT committed to GitHub)
- SHA-256 original: `6E9BFF357BF1EF1362FA4D8374D693F4821F845B9F82A241719E521A72BF4AB9`
- SHA-256 updated: `685015BF2EBE0D6293D09BEA003825299527DC2F9AD1CF0FC3E13D363003DD16`
- Anti-duplicate check before mutation: 0 occurrences of `cline-24k`.

## Repo config changes

1. `configs/resources/qwen-local-runtime.json` — added
   `qwen38-opus-q3-cline-24k` under `workstation_manual_profiles`
   (purpose CLINE_GENERAL_DEVELOPMENT, context_tokens 24576, same GGUF,
   backend_lane normal_llama_cpp, control_plane_eligible/auto_route/
   startup_default/wf40/scope_v3/blender all false, live_verification
   STAGED_NOT_LIVE_VERIFIED, category workstation_dev_executor_profile).
   NOT added to `profiles`, NOT added to `role_to_profile_id`.
2. `tools/local-dev-executor-v1.mjs` — `DEFAULT_DEV_PROFILE_ID`:
   `qwen38-opus-q3-cline-64k` → `qwen38-opus-q3-cline-24k`. No other
   executor semantics touched (envelope/result schema, category, provider id,
   endpoint, safety bounds, persistence, no-subagent shaping, network policy,
   production adapters unchanged).
3. `tests/local-dev-executor-v1/run.mjs` — new deterministic regression
   "cline-24k DEV profile defined and distinct from 64k (option-B
   remediation)": asserts new default constant, 24K resolution + context
   tokens + isolation flags, 64K still resolvable (65536), neither DEV
   profile in `runtime.profiles`.

## Unit/regression results

- `tests/local-dev-executor-v1/run.mjs` — **21 passed, 0 failed**
- `tests/local-dev-executor-live-runner-v1/run.mjs` — **42 passed, 0 failed**
- `tests/local-dev-executor-workstation-session-bridge-v1/run.mjs` — **14 passed, 0 failed**
- `git diff --check` — PASS (exit 0)
- Pre-existing production-drift failures (qwen-local-session-manager 4/14,
  qwen-local-6-profile-router 23/25, qwen-local-llama-cpp-transport 8/9)
  verified IDENTICAL at base HEAD `751997f` via temporary read-only git
  worktree (removed after). Not caused by this delta; production-domain
  follow-up, already noted in the test suite itself.

## Canonical router reload evidence

- Launcher: `C:\Users\mrhz\Documents\AI\QWEN\Start-Qwen-MultiModel-16K.ps1`
  (launched exactly once; no reconstructed llama-server commands; no
  launcher edits).
- Pre-stop canonical tree (3 procs): python 16928/46976 (router) +
  llama-server 46376 (:18080 preset host). Unrelated llama/python procs: 0.
  Model instance 24616 already terminated WITH its parent tree at stop time
  (child of preset host).
- Post-stop residue: 0 processes, ports 8080/18080/29795 free, VRAM
  11737→869 MiB (desktop only).
- Post-launch: router :8080 (43792/30036) + preset host :18080 (28068),
  `max_instances=1`, `model_path=none` → no pre-loaded model instance,
  no orphan old instance.
- Readiness: `/v1/models` → **10 IDs**, `qwen38-opus-q3-cline-24k` exposed
  EXACTLY ONCE, `qwen38-opus-q3-cline-64k` still present, all 7 normal + 3
  DCFR profiles preserved, no duplicates.

## Single 24K smoke metrics

Request: POST :8080/v1/chat/completions, model `qwen38-opus-q3-cline-24k`,
"Reply exactly with: CLINE24K_OK", max_tokens 32, temperature 0, stream
false. (Single generation; request included the cold model load —
`--models-autoload` on-selection — because the instance is spawned on first
use, wall time therefore spans load + generation.)

| Metric | Value |
|---|---|
| WALL (load + gen) | **16 059 ms** |
| prompt tokens | 22 |
| completion tokens | 32 |
| total tokens | 54 |
| per-token effective | ~0.50 s/token (vs 3-4 s/token 64K baseline) |
| exact match | false — `<think>` preamble consumed the 32-token cap (known caveat, same as 64K; classification A from prior pass) |

Live instance verification (PID 51484, port 41333, started 04:01:48 =
spawned by this smoke request):

```
--alias qwen38-opus-q3-cline-24k --ctx-size 24576 --cache-type-k q4_0
--cache-type-v q4_0 --flash-attn on --n-gpu-layers 50 --parallel 1
--reasoning off --threads 20 --jinja
model = D:\AI\...\Qwen3.8-27B-Opus-Distill-v2-Q3_K_M.gguf
```

`/props`: alias `qwen38-opus-q3-cline-24k`, `n_ctx 24576`, total_slots 1,
ftype Q3_K - Medium. Exactly **1 model instance** resident.

## VRAM/host placement before/after

| Snapshot | GPU util | VRAM used | Temp | Power | P-state |
|---|---|---|---|---|---|
| Pre-reload (64K instance live) | 17 % | 11 737 MiB | 41 C | 18.9 W | P8 |
| After unload (desktop only) | 16 % | 869 MiB | 41 C | 18.9 W | P8 |
| Post-smoke (24K instance live) | 18-21 % | 10 918 MiB | 42 C | 18.7 W | P8 |

| Host | 24K instance | 64K instance (prior pass) |
|---|---|---|
| WorkingSet | 12 998 MB | 13 329 MB |
| Private | **11 681 MB** | **14 188 MB** |
| vs VRAM 12 GB | fits (margin ~0.3 GB, desktop-dependent) | oversubscribed by ~2.2 GB |

Placement materially improved: private bytes now BELOW physical VRAM (no
forced host-memory spill of the resident set); measured wall-clock improved
~6-7x (16.1 s incl. cold load vs 98-122 s warm 64K). No performance target
was invented; single-sample observation recorded as-is. Host free RAM
6.4/31.9 GB (desktop suite unchanged, none closed).

## PASS placement criteria

- profile valid/live: YES (instance + props);
- ctx=24576 active: YES (command line + `/props`);
- model correct: YES (same OPUS Q3 GGUF);
- only one model instance resident: YES (count=1, `max_instances=1`);
- no runtime/config mismatch: YES (all flags match the new stanza);
- placement materially improved, not regressed: YES (private 11.7 < 12 GB vs
  14.2 GB oversubscribed; VRAM post ~10.9 GiB vs ~11.9 GiB);
- request completed successfully: YES (HTTP 200, 32 tokens).

## Accounting

QWEN_GENERATIONS_THIS_PASS=1 · OPENCODE_RUNS_THIS_PASS=0 ·
LOCAL_DEV_EXECUTOR_RUNS_THIS_PASS=0 · canonical router restarts=1 (operator
option-B authorized) · production unchanged · real dev executions complete
remains 0 · 32 pre-existing untracked preserved.

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_COMPLETE_LIVE_PROOF_CLINE24K_V1` — first
full LOCAL_DEV_EXECUTOR live proof on the new 24K DEV default profile using
the already-proven 10-turn / 600-second envelope unless new evidence
requires otherwise.

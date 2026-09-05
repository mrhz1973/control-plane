# V4 — Cline64K backend runtime state inspection (v1)

Task: `V4_CLINE64K_BACKEND_RUNTIME_STATE_INSPECTION_V1`
Base: `ce3c75194c777f99f1eef8feabecedabbc2c4fb2`
Date: 2026-09-05
Method: READ-ONLY only. QWEN_GENERATIONS_THIS_PASS=0 · OPENCODE_RUNS=0 ·
LOCAL_DEV_EXECUTOR_RUNS=0 · service operations=0 · production unchanged.

## Phase 1 — Repo preflight

main · HEAD = origin/main = `ce3c751` · tracked tree clean · 32 pre-existing
untracked preserved. No destructive git operations.

## Phase 2 — Live process topology (observed)

| PID | PPID | Process | Started (local) | Role |
|---|---|---|---|---|
| 16928 | 27376 | python.exe (WindowsApps shim) | 02:44:48 | router launcher |
| 46976 | 16928 | python.exe 3.14 (`qwen_runtime_router.py --config qwen-runtime-router.json`) | 02:44:48 | router :8080 |
| 46376 | 46976 | llama-server.exe `--models-preset qwen-models.ini --models-max 1 --models-autoload --host 127.0.0.1 --port 18080` | 02:44:51 | preset host :18080 |
| 24616 | 46376 | llama-server.exe (see Phase 3) | **02:57:20** | per-model instance :29795 |

Explicit determinations:
- Active NORMAL llama-server processes: **2 total = 1 preset HOST (no model,
  `/props` role=router, model_path=none) + 1 MODEL instance**. The 64K profile
  is served by a SINGLE backend instance (PID 24616).
- **NO DCFR sidecar processes**: ports 18200/18210/18220 (router-config
  sidecars) are NOT listening.
- NO sibling model instances resident: `--models-max 1` (observed live and
  confirmed by 18080 `/props` `max_instances: 1`). The 9 router-exposed IDs
  are SELECTABLE DEFINITIONS, not resident models.
- Instance 24616 started 02:57:20 local — i.e. it was spawned at the start of
  RETRY11 (after RETRY9, 02:03 local). RETRY9 ran on a PREVIOUS instance whose
  state is not recoverable.

## Phase 3 — Actual backend parameters (live command line, PID 24616)

```
llama-server.exe --cors-origins localhost --host 127.0.0.1 --jinja
  --port 29795 --spec-type none --tags OPUS,Q3,CLINE,DEV,64K,agent
  --alias qwen38-opus-q3-cline-64k --ctx-size 65536
  --cache-type-k q4_0 --cache-type-v q4_0 --flash-attn on
  --model D:\AI\qwen38-blender-lab\models\qwen38-opus\Qwen3.8-27B-Opus-Distill-v2-Q3_K_M.gguf
  --n-gpu-layers 50 --parallel 1 --reasoning off --threads 20
```

CONFIG vs LIVE table (preset `qwen-models.ini` vs observed process):

| Parameter | Configured | Observed live | Match |
|---|---|---|---|
| model | same path | same path | YES |
| ctx-size | 65536 | 65536 (`/props` n_ctx, `/slots` n_ctx) | YES |
| n-gpu-layers | 50 | 50 (flag) — effective layer split not exposed | YES (flag) |
| cache-type-k/v | q4_0 / q4_0 | q4_0 / q4_0 | YES |
| parallel | 1 (global `[*]`) | 1 | YES |
| threads | 20 (global) | 20 | YES |
| flash-attn | on | on | YES |
| jinja | on (global) | on | YES |
| reasoning | off | off (flag; `/props` default `reasoning_format: none`) | YES (default) |
| total model layers | not in ini | **UNKNOWN** (not exposed read-only) | — |
| batch/ubatch | not in ini | UNKNOWN (defaults) | — |
| mmap/mlock, split-mode | not in ini | UNKNOWN (defaults) | — |

## Phase 4 — Read-only backend API findings

- `:18080/props` → role=router, `max_instances: 1`, `models_autoload: true`,
  model_path=none, build `b10499-1deefcca3`. `:18080/v1/models` → 6 preset IDs
  (the 6 normal profiles).
- `:29795/props` → `model_alias=qwen38-opus-q3-cline-64k`, ftype `Q3_K -
  Medium`, `n_ctx 65536`, `total_slots: 1`, `is_sleeping: false`, full chat
  template present (supports_reasoning_effort/preserve_reasoning; the
  `enable_thinking false` branch emits an EMPTY `<think>\n\n</think>` prefix).
- `:29795/slots` → slot 0 idle, `id_task 85` (our diagnostic request 2),
  `n_prompt_tokens 52`, `chat_format: peg-native`, per-REQUEST
  `reasoning_format: deepseek` (≠ default `none`), `generation_prompt`
  `<|im_start|>assistant\n<think>\n\n</think>\n\n`.
- No POST/generation performed.

## Phase 5 — GPU / host memory placement

GPU (RTX 3060 12 GB, read-only): util 75 % pre / 70 % post (desktop activity:
OBS, browsers, StreamDeck, etc. — none altered); VRAM 11977→11945 of 12288
MiB (**~97 % resident**); 61→62 °C; 66 W; P2. Per-process VRAM: not readable
(insufficient permissions; llama-server.exe PID 24616 present in compute-apps).

HOST: RAM 31.9 GB total, **6.6 GB free**; commit limit 71.9 GB, 34.5 GB free
(no hard paging pressure). llama-server PID 24616: **WorkingSet 13 329 MB,
Private 14 188 MB — EXCEEDS the 12 GB physical VRAM**; preset host 46376
(94/277 MB).

Determinations: near-full VRAM saturation PROVEN; host-memory residency of a
material fraction of the backend footprint PROVEN (private bytes > VRAM);
another GPU consumer (desktop suite, ~1-1.5 GB class + shared util) present
but power draw (66 W of a 170 W-class part) shows the GPU is NOT
compute-saturated during generation.

## Phase 6 — Profile/preset correlation

The `[qwen38-opus-q3-cline-64k]` stanza matches the live process exactly
(table above). The router's 9 exposed IDs are definitions (6 normal + 3 DCFR
aliases): with `--models-max 1` only ONE normal model is ever resident.
`parallel=1` live. No configured-vs-live divergence found.

## Phase 7 — `<think>` observation classification

**A) REASONING_OFF_CONFIGURED_BUT_TEMPLATE_STILL_EMITS_THINK** — with
secondary nuance. PROVEN: preset `reasoning=off`; live flag `--reasoning off`;
backend DEFAULT `reasoning_format=none` (propagation worked); yet the actual
per-request processing (slots id_task 85) ran `reasoning_format=deepseek` /
`chat_format=peg-native` through the router path, and the literal output
began with `<think>` text that consumed the 32-token cap. The model's
distill-style think emission survives the configured-off default at the
OpenAI-compat request layer actually used. NOT fixed here; no tokens
generated to test.

## Phase 8 — PRIMARY classification

**B) BACKEND_CPU_OFFLOAD_OR_PLACEMENT_BOUNDARY**

Evidence basis (proven): single backend instance with private memory 14.2 GB
(model Q3_K_M ~12.9 GB + 64K KV) against a 12 GB GPU already ~97 % resident
including the desktop suite → a material fraction of the backend cannot be in
VRAM; host free RAM only 6.6 GB; GPU power 66 W (transfer/wait-bound, not
compute-saturated); throughput ~3-4 s/token is characteristic of
partial-CPU-offload generation.

SECONDARY findings: (C) the 64K ctx/KV footprint (~2 GB class) materially
contributes to the oversubscription; (D) the desktop GPU consumers reduce
usable VRAM/util; NOT primary.

Excluded by evidence: **A** (no sibling instances — proven single-model
residency), **E** (config-vs-live exact match), **F** (dominant boundary
isolated).

## Phase 9 — Comparison to RETRY9

- PROVEN DIFFERENCE: RETRY9 (7 gens / 208 s, ~30 s/gen ⇒ ~≤1 s/token class)
  ran on a DIFFERENT backend instance (PID 24616 was born at RETRY11 start,
  02:57, after RETRY9 at 02:03). That instance's GPU placement/VRAM state was
  never captured and is unrecoverable.
- OBSERVED CURRENT FACT: ~3-4 s/token at baseline with proven oversubscribed
  placement (Phase 5).
- HYPOTHESIS NOT PROVEN: the RETRY9-era instance had a more favorable
  placement (fewer competing desktop VRAM consumers, different model
  residency) explaining the ~10x token-rate gap. No historical GPU data
  exists to confirm.

## Accounting & NEXT

QWEN_GENERATIONS_THIS_PASS=0 · OpenCode 0 · executor 0 · service ops 0 ·
production unchanged · tracked tree clean · untracked preserved.

NEXT (minimum): `V4_CLINE64K_PLACEMENT_REMEDIATION_DECISION_V1` — operator
decision pass on the PROVEN placement boundary, options: (a) reduce desktop
VRAM consumers before DEV runs; (b) reduce DEV ctx-size for the 64K profile
(trades capability); (c) accept longer timeboxes for this profile; (d) select
a lighter DEV executor profile. Requires explicit operator/architect choice —
no silent change (all options touch workstation runtime or envelope policy).

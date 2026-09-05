# LAST CURSOR REPORT

**BLOCK-ID:** `V4_CLINE64K_BACKEND_RUNTIME_STATE_INSPECTION_V1`
**Classification:** `CLINE64K_BACKEND_RUNTIME_STATE_INSPECTION — B: BACKEND_CPU_OFFLOAD_OR_PLACEMENT_BOUNDARY`
**Timestamp (local):** 2026-09-05

## Summary

Read-only inspection of the live backend runtime for
`qwen38-opus-q3-cline-64k` (NO generation, NO OpenCode, NO executor, NO
service ops). Topology: router `:8080` (python, pid 46976) → preset HOST
llama-server `:18080` (pid 46376, `--models-max 1`, `/props` role=router,
model_path=none) → exactly ONE model instance llama-server `:29795` (pid
24616, born 02:57:20 = RETRY11 start). NO DCFR sidecars listening (18200/
18210/18220 all absent). The 9 router-exposed IDs are selectable definitions,
NOT resident models — single-model residency PROVEN, multi-instance
contention (classification A) EXCLUDED.

Config vs live (preset INI ↔ pid 24616 command line): EXACT MATCH — ctx
65536, n-gpu-layers 50, cache k/v q4_0/q4_0, parallel 1, threads 20,
flash-attn on, jinja on, reasoning off; `/props` n_ctx 65536, total_slots 1,
alias + model path identical. State mismatch (classification E) EXCLUDED.

Memory placement is the PROVEN boundary: llama-server pid 24616
**WorkingSet 13 329 MB / Private 14 188 MB against a 12 GB RTX 3060** with
VRAM ~97 % resident (~11.9/12 GiB) including the desktop suite; host RAM
31.9 GB total with only **6.6 GB free**; GPU power 66 W (not
compute-saturated — transfer/offload-bound). Classification
**B: BACKEND_CPU_OFFLOAD_OR_PLACEMENT_BOUNDARY**. Secondary: 64K KV
oversubscription contribution; desktop GPU consumers (~1-1.5 GB class).

`<think>` classification: **A: REASONING_OFF_CONFIGURED_BUT_TEMPLATE_STILL_EMITS_THINK**
— flag off, backend default `reasoning_format=none`, yet the actual routed
request path (`/slots` id_task 85) shows per-request `reasoning_format:
deepseek` / `peg-native` chat format with `generation_prompt` opening an
empty `<think></think>` block; the distill think emission survives at the
OpenAI-compat request layer.

RETRY9 comparison: PROVEN that pid 24616 did not exist during RETRY9 (born at
RETRY11 start); RETRY9-era placement was never captured — HYPOTHESIS (better
placement then) NOT PROVEN. No causal claim beyond evidence.

QWEN_GENERATIONS_THIS_PASS=0 · OpenCode 0 · LOCAL_DEV_EXECUTOR 0 · service
ops 0 · production unchanged · real dev executions complete remains 0 ·
tracked tree clean · 32 untracked preserved.

## NEXT

`V4_CLINE64K_PLACEMENT_REMEDIATION_DECISION_V1` — operator decision pass on
the PROVEN placement boundary: (a) reduce desktop VRAM consumers pre-run;
(b) reduce DEV ctx-size (trades capability); (c) accept longer timeboxes;
(d) switch DEV executor profile. Requires explicit operator choice; no
silent change.

# V4 — Cline64K router latency determinism diagnostic (v1)

Task: `V4_CLINE64K_ROUTER_LATENCY_DETERMINISM_DIAGNOSTIC_V1`
Base: `13292d97d4e80c16efd88403ca5eb33efc5d763d`
Date: 2026-09-05
Method: read-only inspection + EXACTLY TWO direct tiny generations via the
canonical router OpenAI-compatible endpoint. NO OpenCode, NO LOCAL_DEV_EXECUTOR,
NO code/runtime/config changes, NO router restart, NO model switch.

## Context timeline

- RETRY9 (usable conditions): 7 real generations / 208 s ≈ ~30 s/generation.
- RETRY11: ~300 s/generation — confounded by operator-reported intensive
  concurrent workstation load.
- RETRY12 (controlled idle repeat): reproduced ~300 s/generation, proving
  operator load alone is NOT a sufficient explanation.
- RETRY10: cold-start environmental only (no execution).

## Phase 1 — Router API (read-only)

`qwen_runtime_router.py` exposes the OpenAI-compatible
`POST /v1/chat/completions` (listen 127.0.0.1:8080, backend dflash2
llama-server on 127.0.0.1:18080, presets from `qwen-models.ini`). This is the
canonical generation endpoint used below; no backend commands reconstructed.

## Phase 2 — Precheck baseline

- Repo: main, HEAD `13292d9` = origin/main; tracked tree clean; 32 untracked
  preserved. Router READY: `/v1/models` OK, `qwen38-opus-q3-cline-64k` exposed
  (9 profiles total).
- GPU (RTX 3060 12 GB, read-only nvidia-smi): utilization 75 %, VRAM
  11977/12288 MiB (~97 % resident), 61 °C, 66 W, P2. Compute process
  `llama-server.exe` (pid 24616) present. No known concurrent Qwen generation
  at probe start. Desktop apps (OBS, Edge, StreamDeck, etc.) share the GPU.

## Phase 3 — Exactly two direct generations

Identical tiny deterministic prompt ("Reply exactly with: ROUTER_LATENCY_OK"),
`model=qwen38-opus-q3-cline-64k`, `max_tokens=32`, `temperature=0`,
`stream=false`.

| Metric | Request 1 | Request 2 |
|---|---|---|
| Start (UTC) | 01:33:18.441 | 01:34:56.469 |
| End (UTC) | 01:34:56.450 | 01:36:58.853 |
| **Wall time** | **98 003 ms** | **122 383 ms** |
| HTTP | 200 | 200 |
| model | qwen38-opus-q3-cline-64k | qwen38-opus-q3-cline-64k |
| prompt_tokens | 21 | 21 |
| completion_tokens | 32 (cap) | 32 (cap) |
| total_tokens | 53 | 53 |
| exact-output-match | no | no |

Per-token effective: ~3.1 s/token (req 1), ~3.8 s/token (req 2) over the whole
call; completion-only ~3.0-3.8 s/token. Both replies began with `<think>`
reasoning text and hit the 32-token cap before emitting the sentinel (so
exact_match=no is explained by the cap + the documented `<think>` caveat; the
profile's reasoning was NOT suppressed at the router level). No timing fields
natively returned beyond usage. No errors.

Exactly TWO generation requests performed. No third request.

## Phase 4 — Postcheck

GPU: utilization 70 %, VRAM 11945/12288 MiB, 62 °C, 66 W, P2 — substantially
unchanged. Router left running (not owned). Tree remains clean.

## Classification

**C) ROUTER_BASELINE_SLOW_BOTH**

Both TINY requests are themselves in the very-slow regime (~100-122 s for a
32-token completion, ~3-4 s/token). There is no cold-then-warm improvement
(request 2 slower than request 1), so B is excluded; A is excluded because the
baseline is NOT materially fast.

## Bounded interpretation (no causation beyond measurements)

- The ~300 s/generation observed in RETRY11/12 at the OpenCode level is
  CONSISTENT with this baseline: an agent turn of ~100-150 output tokens at
  ~2.5-4 s/token lands naturally in the 300 s regime. No OpenCode-specific
  pathology needs to be hypothesized.
- The unexplained part is the GAP to RETRY9 (~30 s/generation ⇒ ~<=1 s/token
  for full agent turns): the baseline TODAY is several times slower per token
  than the conditions under which RETRY9 ran. Candidate unproven hypotheses:
  VRAM oversubscription of the multi-model router (9 profiles; ~12/12 GiB
  resident forcing spill/CPU offload), changed backend process state since
  RETRY9, desktop GPU contention, KV-cache placement.
- Per mandate: no timebox raise, no profile switch, no unsuitability claim.

## Accounting

REAL_QWEN_GENERATIONS_THIS_PASS=2 · OpenCode runs=0 · LOCAL_DEV_EXECUTOR
runs=0 · production unchanged · runtime/config/router untouched.

## NEXT (minimum)

`V4_CLINE64K_BACKEND_RUNTIME_STATE_INSPECTION_V1` — read-only inspection of
the live llama-server backend state for the 64K instance (llama-server
`/props` or equivalent read-only surface, process layer/offload state,
presence/footprint of concurrently loaded sibling model instances, KV cache
placement) to determine why per-token throughput is ~3-4 s/today versus
RETRY9-era conditions, BEFORE any executor timebox or profile decision.

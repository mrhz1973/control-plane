# LAST CURSOR REPORT

**BLOCK-ID:** `V4_CLINE64K_ROUTER_LATENCY_DETERMINISM_DIAGNOSTIC_V1`
**Classification:** `CLINE64K_ROUTER_LATENCY_DIAGNOSTIC — C: ROUTER_BASELINE_SLOW_BOTH`
**Timestamp (local):** 2026-09-05

## Summary

Localized the unexplained RETRY9-vs-RETRY11/12 latency gap. Exactly TWO tiny
direct generations through the canonical router endpoint
(`POST /v1/chat/completions`, model `qwen38-opus-q3-cline-64k`, 21 prompt
tokens, 32-token cap): **98 003 ms** and **122 383 ms** (~3-4 s/token), both
HTTP 200, no warm-up improvement (request 2 slower). Classification
**C: ROUTER_BASELINE_SLOW_BOTH** — the very-slow regime exists at the
router/model baseline itself, NOT only at OpenCode workload level; the
RETRY11/12 ~300 s/agent-turn is consistent with ~100-150 output tokens at this
baseline. The residual unexplained gap is versus RETRY9 (~30 s/generation),
i.e. per-token throughput was several times faster under RETRY9-era
conditions. Both replies began with `<think>` reasoning (documented caveat;
profile-level reasoning not suppressed).

RETRY10-12 reconciled as historical diagnostics: cold-start environmental
(RETRY10); confounded timing (RETRY11, operator load); controlled
reproduction (RETRY12). No unsuitability classification, no timebox raise, no
profile switch, no config change.

GPU baseline (RTX 3060 12 GB): 75 % util / 70 % post, VRAM ~11.95/12 GiB
(~97 % resident), 61-62 °C, 66 W, P2, llama-server pid 24616 — before and
after, unchanged; router left running.

REAL_QWEN_GENERATIONS_THIS_PASS=2 · OpenCode runs=0 · LOCAL_DEV_EXECUTOR
runs=0 · production unchanged · real dev executions complete remains 0 ·
tracked tree clean · 32 untracked preserved.

## NEXT

`V4_CLINE64K_BACKEND_RUNTIME_STATE_INSPECTION_V1` — read-only inspection of
the live llama-server backend state for the 64K instance (layer/offload state,
concurrently loaded sibling instances, KV-cache placement) to explain the
per-token throughput gap vs RETRY9-era conditions BEFORE any executor timebox
or profile decision.

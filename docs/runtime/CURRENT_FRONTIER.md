# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `V4_ADDITIVE_EXECUTION_RUNTIME` |
| **ACTIVE WORK** | V4 OpenCode live proof **STOPPED** — `QWEN_LOCAL_UNAVAILABLE` |
| **BLOCCO ATTIVO** | `V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF` |
| **STATO BLOCCO** | `D0025_COMPLETE / OPENCODE_DISPATCH_READY / LIVE_PROOF_STOPPED_QWEN_UNAVAILABLE / GATE_CLOSED` |
| **GATE CORRENTE** | V4 live-proof gate **CLOSED** immediately after pre-run STOP. Prior AUTH artifact is historical only — **not reusable**. D-0025 runtime gate remains **CLOSED**. |
| **NEXT** | `V4_QWEN_LOCAL_READY_RESTORE_ZERO_GENERATION` — restore llama.cpp DFlash2 `fast_8k` on `127.0.0.1:8080` exposing `qwen38-original-dflash2-8k` with **zero** OpenCode/Qwen generation; then obtain fresh operator authorization before any live OpenCode retry. |
| **WF40 LIVE** | active · preserved v3.2 foundation |
| **WF61 LIVE** | **inactive** · D-0025 complete/preserved |
| **REMOTE RUNTIME GATE** | D-0025 gate `enabled=false` · **CLOSED** |
| **OPENCODE CLI** | installed · `opencode-ai` · v **1.18.25** |
| **QWEN_LOCAL** | **NOT READY** · last ensure `API_UNREACHABLE` · generation_calls **0** |

## Live-proof outcome

- One-generation OpenCode config proven offline (`steps=1`, tools deny, title/compaction disabled) — **not executed**.
- Session manager ensure once: `launch_performed=true`, still `API_UNREACHABLE` after ~180s; no listener on `:8080`.
- `opencode_execution_count=0` · `qwen_generation_calls=0` · gate closed.

## Boundaries

- Do not reuse closed live-proof authorization.
- No second OpenCode call without fresh AUTH after READY.
- No GLM/Codex/LiteLLM/n8n/WF/OpenClaw/network/credential mutation.
- Do not mutate Qwen launcher runtime parameters unless separately authorized.

## Puntatori

- STOP report: `reports/architecture/v4_opencode_bounded_live_dispatch_proof.md`
- Checkpoint: `docs/runtime/CHECKPOINT_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.md`
- Historical AUTH (spent/closed): `docs/runtime/AUTH_V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF.operator.json`

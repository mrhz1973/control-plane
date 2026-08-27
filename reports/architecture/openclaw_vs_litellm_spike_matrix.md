# OpenClaw vs LiteLLM — offline/config spike matrix (D-0023-W)

**Status:** OFFLINE/CONFIG ONLY — not a runtime proof  
**Date:** 2026-08-27  
**Contracts:** `llm-gateway-portability-v1`, `llm-gateway-comparison-spike-v1`  
**Runtime claims:** none in this offline/config pass.

Classification key:

| Code | Meaning |
|---|---|
| `PROVEN_OFFLINE` | Demonstrated by deterministic local tests/fixtures in this pass |
| `CONFIG_DEFINED_NOT_RUNTIME_PROVEN` | Represented in non-secret config/docs; not executed |
| `BLOCKED` | Explicitly blocked by current evidence or policy |
| `NOT_TESTED` | Out of this offline stage |

(This offline/config matrix intentionally omits any standalone runtime-proven label.)

| # | Dimension | OpenClaw | LiteLLM | Notes |
|---|---|---|---|---|
| 1 | Responses API compatibility (`POST /v1/responses`, `stream=false`, tool call) | `PROVEN_OFFLINE` (D-0019/D-0020 semantics retained via adapter) | `PROVEN_OFFLINE` (adapter builds same semantic envelope) | No HTTP in this pass |
| 2 | Explicit planner binding (`planner-selection-v1.selected` → request model) | `BLOCKED` as `PLANNER_BINDING_UNVERIFIED` for legacy `gateway_default_unverified` / `openclaw/default` | `PROVEN_OFFLINE` via `explicit_model_alias` test aliases | Binding gap is the OpenClaw Phase C readiness issue |
| 3 | Qwen local / Ollama path | `NOT_TESTED` (HOME host offline; OpenClaw path intact but not exercised) | `CONFIG_DEFINED_NOT_RUNTIME_PROVEN` (`planner-qwen-pilot` → Qwen 3.8 37B placeholder) | No 27B; no model download |
| 4 | Z.AI GLM Coding Plan config path | `NOT_TESTED` / prior VPS probe track remains separate (`NO_MORE_MANUAL_ONE_OFF_PROBES`) | `CONFIG_DEFINED_NOT_RUNTIME_PROVEN` (`api_base=https://api.z.ai/api/coding/paas/v4`, env key ref only) | Coding endpoint explicit; General API not implied |
| 5 | ChatGPT / Codex OAuth path | `NOT_TESTED` | `CONFIG_DEFINED_NOT_RUNTIME_PROVEN` (`chatgpt/<EXACT_CODEX_MODEL_AFTER_OAUTH_DISCOVERY>`) | No Platform API-key fallback in template |
| 6 | Auth / secret isolation | `PROVEN_OFFLINE` (auth marker only; no Authorization value) | `PROVEN_OFFLINE` (env refs / placeholders; no secret literals in Git) | Credential access = 0 this pass |
| 7 | Retry / fallback controllability | `PROVEN_OFFLINE` (adapter synthesizes no provider fallback) | `CONFIG_DEFINED_NOT_RUNTIME_PROVEN` (pilot template has no fallback chain) | D-0024 caps: retry=0, fallback=0 |
| 8 | n8n integration shape | `NOT_TESTED` (n8n unchanged) | `NOT_TESTED` (no n8n mutation) | Production routing not changed |
| 9 | Operational complexity | `PROVEN_OFFLINE` (existing install retained; Phase B still separate) | `CONFIG_DEFINED_NOT_RUNTIME_PROVEN` (template only; no install/start) | LiteLLM remains candidate |
| 10 | Failure isolation | `PROVEN_OFFLINE` (fail-closed unverified binding) | `PROVEN_OFFLINE` (PROFILE_INVALID / MODEL_ALIAS_MISSING / SELECTION_NOT_PROCEED) | Deterministic classifications |
| 11 | Architecture portability | `PROVEN_OFFLINE` (legacy profile still representable) | `PROVEN_OFFLINE` (adapter + profile schema) | OpenClaw not removed; no promotion |
| 12 | Current evidence status | Offline path + Phase B auth remain as previously recorded | Offline/config spike PASS only; D-0024 STAGED | Issue #30 is future runtime boundary |

## Decision snapshot (offline)

- LiteLLM is a viable **candidate** gateway for Architecture v3 once runtime prerequisites pass.
- OpenClaw remains intact; D-0016-W Phase B authorization is unchanged.
- No architecture switch, n8n mutation, or permanent LiteLLM deployment is authorized by this matrix.
- D-0024 may consume at most 3 inferences (1×GLM, 1×Codex OAuth, 1×Qwen 3.8 37B) only after its own prerequisites.

**End of matrix.**

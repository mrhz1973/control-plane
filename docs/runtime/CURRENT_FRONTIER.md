# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#30 D-0024-W** — preflight recovery PASS; both human auth prerequisites satisfied locally; exact Codex model discovery + bounded GLM/Codex runtime pilot next; issue **#29 D-0023-W** COMPLETE; Qwen deferred; issue **#22 D-0016-W** Phase B parallel, HOME legacy visible-console autostart removed; issue **#8** Z.AI support parallel |
| **BLOCCO ATTIVO** | `D0024_W_LITELLM_RUNTIME_PILOT_GLM_CODEX` |
| **STATO BLOCCO** | `D0024_PREFLIGHT_RECOVERY_PASS / ZAI_CODING_CREDENTIAL_SET_PROCESS_LOCAL / CHATGPT_DEVICE_OAUTH_COMPLETE / CODEX_EXACT_MODEL_DISCOVERY_PENDING / INFERENCE_BUDGET_0_OF_2 / QWEN_RUNTIME_DEFERRED` |
| **GATE CORRENTE** | `D0024_W_RUNTIME_PILOT_AUTO_ELIGIBLE_AFTER_CODEX_MODEL_DISCOVERY` — both human auth gates are satisfied; discover exact authenticated `chatgpt/<model>` without inference, then run the already-authorized bounded GLM + Codex pilot with max 1 call each, retry/fallback 0 |
| **NEXT** | WORK-PC Cursor syncs, verifies process-local `ZAI_CODING_API_KEY=SET` without reading it, verifies ChatGPT OAuth success without reading token material, resolves the exact authenticated `chatgpt/<model>` using the installed LiteLLM-supported post-auth discovery path without inference, reconciles the template, then runs max 1 GLM + 1 Codex non-streaming `/v1/responses` pilot call under existing issue #30 authorization. No retry/fallback/Qwen. |
| **D-0024-W PILOT AUTHORIZATION** | max **1 GLM + 1 Codex** inference, max **2 total**; unused **0/2**; retry/fallback `0`; `stream=false` |
| **D-0024 AUTH STATUS** | `LOCAL_ZAI_CODING_CREDENTIAL_ENTRY=PASS` · `CHATGPT_SUBSCRIPTION_OAUTH_DEVICE_FLOW_OPERATOR_PRESENT=PASS` · secret/token values not persisted to GitHub |
| **D-0024 PREFLIGHT RUNTIME** | `%LOCALAPPDATA%\\ControlPlane\\litellm-spike\\venv` · Python **3.13.3** · LiteLLM **1.98.0** · isolated · no global install/service/public bind |
| **GLM ROUTE** | template `planner-glm-pilot` → `zai/glm-5.3` + `api_base=https://api.z.ai/api/coding/paas/v4` · Coding credential set in current operator PowerShell process · no GLM call consumed yet |
| **CODEX ROUTE** | ChatGPT subscription device OAuth completed successfully in operator-present flow · source/registry capability PASS · exact authenticated `chatgpt/<model>` still unresolved · no Codex inference consumed yet |
| **REGRESSION HOST NOTE** | WORK-PC Ajv absence = `HOST_TOOLING_AJV_UNAVAILABLE`; not a D-0023 functional regression; no Ajv added to repo |
| **QWEN RUNTIME STATUS** | `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` · inference `0` |
| **PARALLEL D-0016-W** | Phase B AUTHORIZED / NOT EXECUTED · HOME reachable · legacy visible-console Startup `.cmd` removed · current gateway session may still listen until next login · next login will not auto-start until managed Gateway Phase B |
| **HOME STARTUP CONSOLE** | COMPLETE · `OPENCLAW_LEGACY_VISIBLE_AUTOSTART_CONFIRMED` · removed only Startup `OpenClaw-Gateway-Autostart.cmd` · OpenClaw install/config preserved · secret exposure false |
| **PARALLEL ZAI SUPPORT** | issue #8 · `AWAITING_ZAI_SUPPORT_RESPONSE` · `NO_MORE_MANUAL_ONE_OFF_PROBES` |
| **LITELLM STATUS** | candidate gateway · offline portability PASS · preflight recovery PASS · auth prerequisites PASS · runtime pilot ready after exact Codex model discovery |
| **PM-34 / n8n_ready** | BLOCKED / `false` |
| **Gate E / L5_PASS** | PASS-CLOSED / NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |

## Boundaries operative correnti

- D-0024 preflight recovery is PASS; both human auth gates are now satisfied locally.
- Z.AI Coding Plan credential is process-local in the current operator PowerShell session; do not display/read/persist the value.
- ChatGPT subscription device OAuth completed in an operator-present flow; do not display/read/persist token material.
- Before any Codex inference, resolve and record the exact authenticated `chatgpt/<model>` without consuming a model call. If model discovery unexpectedly requires inference or another auth flow, STOP.
- GLM uses `zai/glm-5.3` with explicit Coding Plan endpoint only; no General API fallback.
- Existing D-0024 pilot authorization may be exercised only after exact Codex model binding: max 1 GLM + 1 Codex, max 2 total, `stream=false`, retry/fallback 0.
- Current inference budget remains 0/2 until those bounded calls actually occur.
- HOME nuisance remediation complete; managed Gateway Phase B remains separate.
- Qwen runtime deferred. No n8n/OpenClaw/VPS mutation, public bind, permanent service, credential persistence to GitHub/chat, architecture promotion, or PM-34/L5/endurance/permanent schedule.

## Puntatori

- Active pilot: issue **#30** (`D-0024-W`)
- Recovery contract: `docs/contracts/litellm-runtime-preflight-recovery-glm-codex-v1.md`
- LiteLLM template: `configs/litellm/control-plane-spike.template.yaml`
- Completed portability spike: issue **#29** (`D-0023-W`)
- HOME OpenClaw track: issue **#22** (`D-0016-W`)
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`

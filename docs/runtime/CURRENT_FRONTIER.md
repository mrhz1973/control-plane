# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `GLM-ZAI-VPS-DIRECT-SMOKE` |
| **STATO BLOCCO** | `AUTHORIZED / ONE_BOUNDED_MODEL_INVOCATION_PENDING` |
| **GATE CORRENTE** | `GLM_ZAI_VPS_DIRECT_SMOKE_AUTHORIZED` |
| **NEXT** | execute exactly one minimal direct smoke invocation of exact `zai/glm-5.3` through authenticated OpenClaw on VPS; no retry, fallback, gateway/service, n8n wiring, Codex/Qwen invocation or broader runtime activation |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; post-upgrade structural `doctor --fix` migration explicitly accepted by operator; gateway non attivo |
| **CODEX OAUTH VPS** | PASS |
| **CODEX DIRECT SMOKE VPS** | PASS — exactly one local inference; exit `0`; marker matched; no retry |
| **CODEX PROVIDER AFTER SMOKE** | configured / usable |
| **GLM/Z.AI VPS AUTH** | PASS — configured; profile present; provider `zai` available |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **OPENCLAW CORE UPGRADE FOR GLM53** | PASS / ACCEPTED — official compatible pair installed; exact `zai/glm-5.3` visible; rollback metadata prepared, rollback not executed |
| **POST-UPGRADE SCOPE DEVIATION** | CLOSED / ACCEPTED BY OPERATOR — structural `doctor --fix` config migration explicitly accepted; no credential re-entry, no secret persistence |
| **EXACT GLM 5.3 REF** | visible: `zai/glm-5.3` |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `1` Codex VPS smoke total · `0` GLM/Z.AI invocations before authorized smoke |
| **LATEST EVIDENCE** | `OPENCLAW_CORE_UPGRADE_FOR_GLM53 = PASS`; evidence commit `c58720de13245298adc0bdd2cfe6a74dd437d62f`; exact `zai/glm-5.3` visible; model/Codex invocation count `0` |
| **ROLLBACK** | metadata prepared on VPS; rollback not executed |
| **SECRET / WINDOWS AUTH GUARD** | persisted secrets `false` · Windows credential state copied `false` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / CORE_2026.8.1-BETA.3_ACCEPTED / CODEX_AUTHENTICATED_AND_SMOKE_PASS / GLM_AUTHENTICATED_AND_5_3_VISIBLE / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: PASS · GLM VPS: AUTHORIZED_ONE_BOUNDED_5_3_INVOCATION · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Upgrade tecnico completato e accettato: OpenClaw core `2026.8.1-beta.3`; provider Z.AI `2026.8.1-beta.3`; exact `zai/glm-5.3` visibile.
- L'operatore ha accettato esplicitamente lo stato post-upgrade incluso il `doctor --fix` strutturale già eseguito; la review della deviazione è chiusa.
- Auth Z.AI/profile/provider restano integri; gateway false; port `18789` free; system Node/npm invariati; GLM invocation count `0` prima dello smoke autorizzato.
- L'operatore ha autorizzato esattamente **una** minimal direct smoke invocation dell'esatto `zai/glm-5.3` sul VPS tramite OpenClaw autenticato, con preflight/postcheck read-only.
- Nessun retry automatico o seconda invocazione se lo smoke fallisce o è inconcludente.
- Nessun fallback a `glm-5.2`, `glm-5.1`, `glm-5` o altro modello durante questo smoke; la futura policy quota-aware resta backlog separato.
- Nessun gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy/public exposure, runtime wiring, billing, Qwen o broader runtime activation è autorizzato.
- Nessuna ulteriore invocazione Codex è autorizzata; nessun secret/token deve essere persistito in GitHub o log.
- Dopo la singola invocazione: postcheck read-only di auth/provider, gateway e porta `18789`, persist `LAST_CURSOR_REPORT.md`, quindi STOP sul prossimo gate.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.
- WF40/42 invariati; WF41 off; wf47 invariato.

## Puntatori

- Active work: GitHub issue **#8**
- Future research backlog: GitHub issue **#18 — DeepSeek-OCR-2 for LLM context compression** (`DEFERRED / NOT ON CURRENT CRITICAL PATH`)
- Future quota policy: GitHub issue **#19 — quota-aware GLM model switching (5.3 / 5.2 / 5.1 / 5)** (`DEFERRED / NOT ACTIVE RUNTIME`)
- Planner routing contract: `docs/contracts/planner-routing-policy-v1.md`
- OpenClaw placement: `docs/foundation/OPENCLAW_VPS_BROKER_PLACEMENT.md`
- Lean/agg method: `README.md` AI-BOOT + `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Cursor evidence: `docs/runtime/LAST_CURSOR_REPORT.md`

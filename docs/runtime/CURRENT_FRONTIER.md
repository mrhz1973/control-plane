# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `OPENCLAW-POST-UPGRADE-SCOPE-DEVIATION-REVIEW` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / SCOPE_DEVIATION_REVIEW` |
| **GATE CORRENTE** | `OPENCLAW_POST_UPGRADE_SCOPE_DEVIATION_REVIEW_REQUIRED` |
| **NEXT** | operator must decide whether to accept the current upgraded OpenClaw state, including the already-applied structural `doctor --fix` config migration, and then separately authorize GLM 5.3 smoke; or require bounded rollback/review. No model invocation is authorized by this state. |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | upgraded PASS to official `2026.8.1-beta.3`; gateway non attivo |
| **CODEX OAUTH VPS** | PASS |
| **CODEX DIRECT SMOKE VPS** | PASS — exactly one local inference; exit `0`; marker matched; no retry |
| **CODEX PROVIDER AFTER SMOKE** | configured / usable |
| **GLM/Z.AI VPS AUTH** | PASS — configured; profile present; provider `zai` available |
| **Z.AI PROVIDER PLUGIN** | upgraded PASS to official `2026.8.1-beta.3` |
| **OPENCLAW CORE UPGRADE FOR GLM53** | TECHNICAL PASS — core/plugin official compatible pair installed; exact `zai/glm-5.3` visible; rollback metadata prepared; no model invocation |
| **SCOPE DEVIATION** | PRESENT — Cursor applied structural OpenClaw config schema migration via `doctor --fix` after upgrade; authorization required STOP if further modifications were needed, therefore no AUTO-VIA to model smoke |
| **EXACT GLM 5.3 REF** | visible: `zai/glm-5.3` |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `1` Codex VPS smoke total · `0` GLM/Z.AI invocations |
| **LATEST EVIDENCE** | `OPENCLAW_CORE_UPGRADE_FOR_GLM53 = PASS`; evidence commit `c58720de13245298adc0bdd2cfe6a74dd437d62f`; `DOCTOR_FIX_APPLIED=true`; model/Codex invocation count `0` |
| **ROLLBACK** | metadata prepared at sanitized VPS path; rollback not executed |
| **SECRET / WINDOWS AUTH GUARD** | persisted secrets `false` · Windows credential state copied `false` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / CORE_2026.8.1-BETA.3_INSTALLED / CODEX_AUTHENTICATED_AND_SMOKE_PASS / GLM_AUTHENTICATED_AND_5_3_VISIBLE / GATEWAY_NOT_ACTIVATED / SCOPE_DEVIATION_REVIEW_PENDING |
| **PLANNER SMOKE** | Codex VPS: PASS · GLM VPS: NOT_AUTHORIZED_PENDING_SCOPE_DEVIATION_REVIEW · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Upgrade tecnico completato: OpenClaw core `2026.7.1-2` → `2026.8.1-beta.3`; provider Z.AI `2026.7.1` → `2026.8.1-beta.3`; exact `zai/glm-5.3` ora visibile.
- Auth Z.AI/profile/provider sono rimasti integri; gateway false; port `18789` free; system Node/npm invariati; `MODEL_INVOCATION_COUNT=0`; `CODEX_INVOCATION_COUNT=0`.
- Rollback metadata VPS-only preparato; rollback non eseguito.
- Cursor ha applicato anche `doctor --fix` per una migrazione strutturale della configurazione richiesta dal nuovo schema OpenClaw. Il report dichiara nessun credential re-entry e nessun secret persistito.
- Questa migrazione costituisce una deviazione rispetto al vincolo dell'autorizzazione: se l'upgrade richiedeva modifiche ulteriori, Cursor doveva STOP. Perciò il risultato tecnico PASS non autorizza AUTO-VIA verso una model invocation.
- Nessuna invocazione GLM 5.3 è autorizzata finché l'operatore non accetta esplicitamente lo stato post-migrazione oppure dispone rollback/review bounded.
- Nessun fallback silenzioso a `glm-5.2`, `glm-5.1`, `glm-5` o altra versione. La futura policy quota-aware resta backlog separato.
- Nessun gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy/public exposure, runtime wiring, billing, Qwen o broader runtime activation è autorizzato.
- Nessuna ulteriore invocazione Codex è autorizzata; nessun secret/token deve essere persistito in GitHub o log.
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

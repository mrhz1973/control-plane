# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `GLM-ZAI-VPS-CREDENTIAL-REFRESH` |
| **STATO BLOCCO** | `AUTHORIZED / BOUNDED_CREDENTIAL_REFRESH_PENDING` |
| **GATE CORRENTE** | `GLM_ZAI_VPS_CREDENTIAL_REFRESH_AUTHORIZED` |
| **NEXT** | refresh/re-enter only the Z.AI credential on VPS OpenClaw using secure interactive operator entry if required, then perform read-only auth/provider/network postcheck; no model invocation or smoke retry is authorized |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | `2026.8.1-beta.3`; post-upgrade structural `doctor --fix` migration explicitly accepted by operator; gateway non attivo |
| **CODEX OAUTH VPS** | PASS |
| **CODEX DIRECT SMOKE VPS** | PASS — exactly one local inference; exit `0`; marker matched; no retry |
| **CODEX PROVIDER AFTER SMOKE** | configured / usable |
| **GLM/Z.AI VPS AUTH STATE** | local profile present/configured, but runtime credential rejected by provider with HTTP 401 during exact GLM 5.3 smoke; bounded refresh/re-entry now explicitly authorized |
| **Z.AI PROVIDER PLUGIN** | `2026.8.1-beta.3` |
| **OPENCLAW CORE UPGRADE FOR GLM53** | PASS / ACCEPTED — official compatible pair installed; exact `zai/glm-5.3` visible; rollback metadata prepared, rollback not executed |
| **POST-UPGRADE SCOPE DEVIATION** | CLOSED / ACCEPTED BY OPERATOR |
| **EXACT GLM 5.3 REF** | visible: `zai/glm-5.3` |
| **GLM/Z.AI DIRECT SMOKE 5.3** | BLOCKED after exactly one invocation — provider HTTP 401 `token expired or incorrect`; no retry |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `1` Codex VPS smoke total · `1` GLM 5.3 VPS smoke total · `0` Qwen invocations |
| **LATEST EVIDENCE** | `GLM_ZAI_VPS_DIRECT_SMOKE_EXACT_53 = BLOCKED`; evidence commit `7381b4f624669eb4cc5061c2b298ede3729ac765`; blocker `BLOCKED_ZAI_AUTH_401_TOKEN_EXPIRED_OR_INCORRECT` |
| **ROLLBACK** | metadata prepared on VPS; rollback not executed |
| **SECRET / WINDOWS AUTH GUARD** | persisted secrets `false` · Windows credential state copied `false` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / CORE_2026.8.1-BETA.3_ACCEPTED / CODEX_AUTHENTICATED_AND_SMOKE_PASS / GLM_5_3_VISIBLE_BUT_CREDENTIAL_REFRESH_PENDING / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: PASS · GLM VPS: BLOCKED_401_CREDENTIAL_REFRESH_AUTHORIZED · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
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
- Lo smoke dell'esatto `zai/glm-5.3` è stato eseguito una sola volta: provider HTTP 401 `token expired or incorrect`; nessun retry; Codex/Qwen invocation count `0` durante il pass.
- L'operatore ha autorizzato esclusivamente refresh/re-entry bounded della credenziale Z.AI necessaria a risolvere il 401, con preflight/postcheck read-only.
- Se serve inserire una API key/token, l'operatore deve farlo direttamente in una console interattiva non registrata. Il secret non deve comparire in GPT Web, Cursor chat, GitHub, stdout persistente o log.
- Nessuna model invocation, smoke retry, Codex/Qwen invocation, gateway/service activation, upgrade core/plugin, n8n/Docker/Tailscale mutation, firewall/reverse proxy/public exposure, runtime wiring, billing o altra modifica è autorizzata in questo pass.
- Dopo il refresh: verificare solo read-only presenza profilo/provider, exact model visibility, gateway false e port `18789` free; persist `LAST_CURSOR_REPORT.md`; quindi STOP sul nuovo gate di smoke.
- Nessun fallback a `glm-5.2`, `glm-5.1`, `glm-5` o altro modello durante questa recovery; la futura policy quota-aware resta backlog separato.
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

# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `OPENCLAW-CORE-UPGRADE-FOR-GLM53` |
| **STATO BLOCCO** | `HUMAN_GATE_REQUIRED / CORE_UPGRADE` |
| **GATE CORRENTE** | `OPENCLAW_CORE_UPGRADE_GATE_REQUIRED` |
| **NEXT** | decide whether to authorize a bounded upgrade of OpenClaw core from `2026.7.1-2` to an official compatible `>=2026.8.1-beta.3` build together with matching official Z.AI provider support so exact `zai/glm-5.3` becomes visible; no model invocation is implied |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | installed `2026.7.1-2`; gateway non attivo; core upgrade required for official GLM 5.3 support |
| **CODEX OAUTH VPS** | PASS |
| **CODEX DIRECT SMOKE VPS** | PASS — exactly one local inference; exit `0`; marker matched; no retry |
| **CODEX PROVIDER AFTER SMOKE** | configured / usable |
| **GLM/Z.AI VPS AUTH** | PASS — configured; profile present; provider `zai` available |
| **Z.AI PROVIDER PLUGIN** | installed stable `2026.7.1`; official beta `2026.8.1-beta.3` contains GLM 5.3 but requires OpenClaw core `>=2026.8.1-beta.3` |
| **GLM/Z.AI VERSION RESOLUTION** | BLOCKED — official GLM 5.3 support found, but only through OpenClaw core upgrade; plugin-only upgrade incompatible |
| **EXACT GLM 5.3 REF** | not currently visible |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `1` Codex VPS smoke total · `0` GLM/Z.AI invocations |
| **LATEST EVIDENCE** | `GLM_ZAI_VERSION_RESOLUTION = BLOCKED`; evidence commit `ecf856c14d6eb27962b31041e41c09d9cec386e3`; blocker `BLOCKED_OPENCLAW_CORE_UPGRADE_REQUIRED` |
| **SECRET / WINDOWS AUTH GUARD** | persisted secrets `false` · Windows credential state copied `false` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / INSTALLED / CODEX_AUTHENTICATED_AND_SMOKE_PASS / GLM_AUTHENTICATED_BUT_CORE_UPGRADE_REQUIRED_FOR_5_3 / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: PASS · GLM VPS: BLOCKED_CORE_UPGRADE_REQUIRED_FOR_EXACT_5_3 · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- `CODEX_VPS_DIRECT_SMOKE` resta PASS; provider Codex usable; gateway false; port `18789` free.
- `GLM_ZAI_VPS_CREDENTIAL_CONFIG` resta PASS; provider `zai` configurato/disponibile; nessun secret persistito.
- `GLM_ZAI_VERSION_RESOLUTION` ha trovato supporto ufficiale a `zai/glm-5.3` nel provider beta `2026.8.1-beta.3`, ma il plugin richiede OpenClaw core `>=2026.8.1-beta.3`; il core installato `2026.7.1-2` non è compatibile con un plugin-only upgrade.
- Nessuna mutazione provider/core è stata eseguita nel pass; `MODEL_INVOCATION_COUNT=0`, `CODEX_INVOCATION_COUNT=0`, gateway false, port `18789` free.
- Il prossimo gate è umano: un eventuale aggiornamento del core OpenClaw è una mutazione runtime separata e non è autorizzato implicitamente.
- Nessun fallback silenzioso a `glm-5.2`, `glm-5.1`, `glm-5` o altra versione. La futura policy quota-aware tra versioni GLM resta backlog separato e non attiva switch automatici.
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

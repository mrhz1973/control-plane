# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `OPENCLAW-CORE-UPGRADE-FOR-GLM53` |
| **STATO BLOCCO** | `AUTHORIZED / BOUNDED_CORE_UPGRADE_PENDING` |
| **GATE CORRENTE** | `OPENCLAW_CORE_UPGRADE_AUTHORIZED` |
| **NEXT** | perform a bounded upgrade of isolated VPS OpenClaw core from `2026.7.1-2` only to an official compatible `>=2026.8.1-beta.3` build required for official `zai/glm-5.3` support, together with the matching official Z.AI provider plugin; no model invocation or runtime activation |
| **PLACEMENT DECISION** | ACCEPTED — OpenClaw target canonico sul VPS IONOS come broker 24/7; Cursor/Bugbot/Ollama-Qwen restano locali |
| **ISOLATED NODE 24** | PASS — `v24.19.0`; `/opt/openclaw-node/current`; system Node/npm unchanged |
| **VPS OPENCLAW** | installed `2026.7.1-2`; bounded core upgrade authorized solely for official GLM 5.3 support; gateway non attivo |
| **CODEX OAUTH VPS** | PASS |
| **CODEX DIRECT SMOKE VPS** | PASS — exactly one local inference; exit `0`; marker matched; no retry |
| **CODEX PROVIDER AFTER SMOKE** | configured / usable |
| **GLM/Z.AI VPS AUTH** | PASS — configured; profile present; provider `zai` available |
| **Z.AI PROVIDER PLUGIN** | installed stable `2026.7.1`; official beta `2026.8.1-beta.3` contains GLM 5.3 and requires OpenClaw core `>=2026.8.1-beta.3` |
| **GLM/Z.AI VERSION RESOLUTION** | BLOCKED previously — official GLM 5.3 support found, but requires bounded OpenClaw core + matching provider upgrade now explicitly authorized |
| **EXACT GLM 5.3 REF** | not currently visible; target post-upgrade = exact `zai/glm-5.3` visible without invoking it |
| **VPS NETWORK** | port `18789` free · gateway false |
| **PLANNER INVOCATION COUNT** | `1` Codex VPS smoke total · `0` GLM/Z.AI invocations |
| **LATEST EVIDENCE** | `GLM_ZAI_VERSION_RESOLUTION = BLOCKED`; evidence commit `ecf856c14d6eb27962b31041e41c09d9cec386e3`; blocker `BLOCKED_OPENCLAW_CORE_UPGRADE_REQUIRED` |
| **SECRET / WINDOWS AUTH GUARD** | persisted secrets `false` · Windows credential state copied `false` |
| **AGG EVIDENCE RULE** | CANONICAL — Cursor pass needed by `agg` must persist final report; stale/missing => `EVIDENCE_NOT_PERSISTED` |
| **OPENCLAW v3 RUNTIME** | TARGET_VPS / CORE_UPGRADE_AUTHORIZED_FOR_GLM53 / CODEX_AUTHENTICATED_AND_SMOKE_PASS / GLM_AUTHENTICATED / GATEWAY_NOT_ACTIVATED |
| **PLANNER SMOKE** | Codex VPS: PASS · GLM VPS: WAIT_CORE_UPGRADE_THEN_EXACT_5_3_SMOKE_GATE · Qwen 3.8 37B: BLOCKED_MISSING_MODEL |
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
- `GLM_ZAI_VERSION_RESOLUTION` ha trovato supporto ufficiale a `zai/glm-5.3` nel provider beta `2026.8.1-beta.3`, che richiede OpenClaw core `>=2026.8.1-beta.3`.
- L'operatore ha autorizzato esclusivamente un upgrade bounded del core OpenClaw isolato sotto `/opt/openclaw-app` a una release ufficiale compatibile `>=2026.8.1-beta.3` necessaria per GLM 5.3, insieme al matching official Z.AI provider plugin.
- Sono autorizzati preflight, backup/rollback metadata della configurazione OpenClaw e postcheck read-only di versione, auth/provider, catalogo modelli, gateway e porta `18789`.
- Il system Node/npm non deve essere modificato; `/opt/openclaw-node/current` resta invariato.
- Nessuna model invocation è autorizzata durante questo pass; nessun Codex/Qwen invocation e nessun fallback a `glm-5.2`, `glm-5.1`, `glm-5` o altra versione.
- Nessun gateway/service activation, n8n/Docker/Tailscale mutation, firewall/reverse proxy/public exposure, runtime wiring, billing o altri upgrade sono autorizzati.
- Nessun secret/token deve essere persistito in GitHub, log o output persistente. La configurazione auth esistente deve essere preservata.
- Se la compatibilità ufficiale non è verificabile, se l'upgrade richiede modifiche ulteriori o se auth/provider non restano integri, STOP senza workaround e senza model invocation.
- Dopo l'upgrade: verificare read-only che l'esatto `zai/glm-5.3` sia visibile, auth/provider restino validi, gateway `false`, port `18789` free; persist `LAST_CURSOR_REPORT.md`; quindi STOP sul successivo model-invocation gate.
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

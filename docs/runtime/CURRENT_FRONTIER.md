# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**
> Deve restare piccolo. Non contiene cronologia, narrativa, HEAD remota corrente o copie di foundation/evidence.

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `CODEX-DIRECT-PLANNER-SMOKE` |
| **STATO BLOCCO** | HUMAN_GATE_REQUIRED |
| **GATE CORRENTE** | `CODEX_DIRECT_SMOKE_EXPLICIT_AUTHORIZATION_REQUIRED` |
| **NEXT** | autorizzare una sola invocazione innocua `openclaw agent --local` usando il provider Codex OAuth già configurato, finalizzata esclusivamente a generare/validare un Execution Packet; nessun gateway start/install, GLM/Z.AI config, Qwen pull, n8n mutation o repo write |
| **CODEX OAUTH** | PASS — `openai-codex` OAuth profile presente; provider effective usable; usage/quota snapshot disponibile con gateway down; nessun secret esposto |
| **CODEX DIRECT PATH** | `openclaw agent --local` AVAILABLE — direct smoke possibile senza gateway persistente |
| **OPENCLAW DISCOVERY** | PASS — npm global `openclaw@2026.5.20`; gateway `ws://127.0.0.1:18789` non in ascolto; nessun servizio/task gateway installato |
| **OPENCLAW PROVIDERS** | `openai-codex` AVAILABLE / AUTHENTICATED · `zai` AVAILABLE / auth missing |
| **USAGE OBSERVABILITY** | Codex native and visible after auth even with gateway down · Z.AI native after credential+gateway · Qwen local/not_applicable |
| **QWEN LOCAL** | target Qwen 3.8 37B NOT_INSTALLED; `qwen3.8:27b` presente; nessun modello caricato alla discovery; nessun pull/run/stop autorizzato |
| **OPENCLAW v3 RUNTIME** | AUTHENTICATED_CODEX / NOT_ACTIVATED_AS_GATEWAY |
| **PLANNER SMOKE** | Qwen 3.8 37B: BLOCKED_MISSING_MODEL · GLM 5.3: BLOCKED_MISSING_AUTH · Codex OAuth: READY_FOR_DIRECT_SMOKE_GATE |
| **CURSOR v3 SMOKE** | GLM BYOK: NOT_RUN · bounded loop: NOT_RUN · Bugbot loop: NOT_RUN · checkpoint resume: NOT_RUN |
| **PM-34** | BLOCKED |
| **n8n_ready** | `false` |
| **Gate E** | PASS / CLOSED |
| **L5_PASS** | NOT_CLAIMED |
| **L5 runtime** | activation `false` · runtime `false` · endurance `false` |
| **PERMANENT SCHEDULE / LOOP** | NOT_AUTHORIZED / NOT_DECLARED |
| **WF40 / WF42 / WF41** | 40 active unchanged · 42 active unchanged · 41 off |
| **wf47** | inactive/unpublished · Schedule disabled · `enable_wg48_handoff=false` |

## Boundaries operative correnti

- Foundation v3.1 wiki-LLM lean è canonica su `main`; issue #8 è l'unico ACTIVE WORK.
- Codex OAuth login e post-auth verify sono PASS; modifiche auth limitate allo stato OpenClaw attribuibile al provider `openai-codex`.
- Il gateway NON è stato avviato; nessun servizio/task gateway è stato installato.
- Il prossimo passo è una vera invocazione provider e richiede gate umano separato anche se bounded/innocua.
- Il gate proposto autorizzerà una sola chiamata direct/local per smoke Execution Packet; non autorizza GLM/Z.AI credential write, gateway start/install, Qwen pull, n8n/runtime wiring, billing mutation o repo write.
- Warning transitori `@openclaw/codex` osservati durante auth verify non invalidano lo stato provider `usable`; se ricompaiono nello smoke vanno riportati come evidence.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.

## Puntatori

- Active work: GitHub issue **#8**
- Foundation/invarianti: `docs/foundation/PROJECT_VISION.md`
- Lean method: `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
- Evidence Cursor rolling: `docs/runtime/LAST_CURSOR_REPORT.md` — on demand
- Storico/recovery: Git history + baseline `777504f7c46e5e724b6ad5f8586a98d43bab7ce8`; mai bootstrap di default

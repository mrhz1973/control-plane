# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**
> Deve restare piccolo. Non contiene cronologia, narrativa, HEAD remota corrente o copie di foundation/evidence.

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `OPENCLAW-CODEX-OAUTH-AUTH` |
| **STATO BLOCCO** | AUTHORIZED / EXECUTION_PENDING |
| **GATE CORRENTE** | `CODEX_OAUTH_LOGIN_AUTHORIZED` |
| **NEXT** | eseguire esclusivamente `openclaw models auth login --provider openai-codex`; poi verificare auth state read-only e fermarsi prima di qualsiasi gateway start/install, GLM/Z.AI config, Qwen pull, n8n mutation o billing change |
| **CODEX OAUTH AUTHORIZATION** | EXPLICIT HUMAN GATE RECEIVED — solo provider `openai-codex`; nessun altro provider/runtime/config scope autorizzato |
| **CLONE SYNC VERIFY** | PASS — clone `main` pulito e allineato al remote al momento della discovery |
| **OPENCLAW DISCOVERY** | PASS — npm global `openclaw@2026.5.20`; CLI presente; gateway `ws://127.0.0.1:18789` non in ascolto; nessun servizio/task gateway installato |
| **OPENCLAW PROVIDERS** | `openai-codex` AVAILABLE / auth missing · `zai` AVAILABLE / auth missing |
| **USAGE OBSERVABILITY** | Codex native after auth+gateway · Z.AI native after credential+gateway · Qwen local/not_applicable |
| **QWEN LOCAL** | target Qwen 3.8 37B NOT_INSTALLED; `qwen3.8:27b` presente; nessun modello caricato alla discovery; `ollama list` ha incidentalmente riavviato l'app Ollama locale, senza pull/run/stop |
| **OPENCLAW v3 RUNTIME** | DISCOVERED / NOT_ACTIVATED |
| **PLANNER SMOKE** | Qwen 3.8 37B: BLOCKED_MISSING_MODEL · GLM 5.3: BLOCKED_MISSING_AUTH · Codex OAuth: AUTHORIZED_LOGIN_PENDING |
| **CURSOR v3 SMOKE** | GLM BYOK: NOT_RUN · bounded loop: NOT_RUN · Bugbot loop: NOT_RUN · checkpoint resume: NOT_RUN |
| **WIKI-LLM CONSOLIDATION** | issue #10 COMPLETED; L3B post-merge re-census PASS; recovery baseline `777504f7c46e5e724b6ad5f8586a98d43bab7ce8` |
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
- Discovery OpenClaw PASS; repo/config/auth/OpenClaw runtime mutation precedente = 0.
- Side-effect osservato separatamente: `ollama list` ha riavviato l'app Ollama locale; nessun modello è stato pullato, avviato o fermato.
- Il gate OAuth è stato autorizzato esplicitamente per il solo provider `openai-codex`.
- L'autorizzazione NON include GLM/Z.AI credential write, gateway start/install, Qwen pull, n8n/runtime/provider wiring o billing mutation.
- Dopo il login sono autorizzati soltanto controlli read-only dello stato auth/provider.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.
- GPT Web resta autore autorevole dei workflow n8n; Cursor non li ridisegna autonomamente.

## Puntatori

- Active work: GitHub issue **#8**
- Foundation/invarianti: `docs/foundation/PROJECT_VISION.md`
- Lean method: `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
- Evidence Cursor rolling: `docs/runtime/LAST_CURSOR_REPORT.md` — on demand
- Storico/recovery: Git history + baseline `777504f7c46e5e724b6ad5f8586a98d43bab7ce8`; mai bootstrap di default

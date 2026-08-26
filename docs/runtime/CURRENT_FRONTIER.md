# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**
> Deve restare piccolo. Non contiene cronologia, narrativa, HEAD remota corrente o copie di foundation/evidence.

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | GitHub issue **#8 — Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop** |
| **BLOCCO ATTIVO** | `CURSOR-CLONE-SYNC-VERIFY` |
| **STATO BLOCCO** | IN_PROGRESS |
| **GATE CORRENTE** | `READ_ONLY_CLONE_SYNC_VERIFY` |
| **NEXT** | sincronizzare/verificare il clone Cursor contro `origin/main`; se PASS, AUTO-VIA alla discovery OpenClaw read-only (path/version/gateway/provider surface), senza login/config/auth mutation |
| **WIKI-LLM CONSOLIDATION** | issue #10 COMPLETED; L3B post-merge re-census PASS; recovery baseline `777504f7c46e5e724b6ad5f8586a98d43bab7ce8` |
| **OPENCLAW v3 RUNTIME** | NOT_VERIFIED / NOT_ACTIVATED |
| **PLANNER SMOKE** | Qwen 3.8 37B: NOT_RUN · GLM 5.3: NOT_RUN · Codex OAuth: NOT_RUN |
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

- Foundation v3.1 wiki-LLM lean è canonica su `main`.
- Issue #10 è chiusa; nessun ulteriore file/branch cleanup è implicito o autorizzato.
- Issue #8 è l'unico ACTIVE WORK.
- Prima fase issue #8: clone sync/verify read-only; poi OpenClaw discovery read-only via AUTO-VIA.
- Nessuna runtime/provider/n8n mutation durante discovery.
- Nessuna credential/OAuth/billing mutation senza gate esplicito.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.
- GPT Web resta autore autorevole dei workflow n8n; Cursor non li ridisegna autonomamente.

## Puntatori

- Active work: GitHub issue **#8**
- Foundation/invarianti: `docs/foundation/PROJECT_VISION.md`
- Lean method: `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Contracts: `docs/contracts/backlog-item-v1.md` · `planner-routing-policy-v1.md` · `execution-packet-v1.md` · `execution-checkpoint-v1.md`
- Evidence Cursor rolling: `docs/runtime/LAST_CURSOR_REPORT.md` — on demand
- Storico/recovery: Git history + baseline `777504f7c46e5e724b6ad5f8586a98d43bab7ce8`; mai bootstrap di default

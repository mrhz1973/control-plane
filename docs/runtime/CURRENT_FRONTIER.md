# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**
> Deve restare piccolo. Non contiene cronologia, narrativa, HEAD remota corrente o copie di foundation/evidence.

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `WIKI-LLM-LEAN-CONSOLIDATION` |
| **ACTIVE WORK** | GitHub issue **#10 — Wiki-LLM lean consolidation — reduce stale/duplicate repository surface** |
| **BLOCCO ATTIVO** | `L3B-ATOMIC-HISTORICAL-REDUCTION` |
| **STATO BLOCCO** | WAITING_HUMAN_DESTRUCTIVE_GATE |
| **GATE CORRENTE** | `L3B_PHYSICAL_DELETE_EXPLICIT_AUTHORIZATION_REQUIRED` |
| **NEXT** | dopo autorizzazione umana esplicita: creare una sola modifica atomica con 5 file deletion + 28 history-link rewrite + audit update; verificare zero broken links; **nessuna deletion prima del gate** |
| **NEXT WORKSTREAM** | issue **#8 — Architecture v3 evidence track** dopo chiusura issue #10 |
| **BOOTSTRAP 9.5 VERIFY** | PASS — `CORE_BOOT_SUFFICIENT=true`; preload foundation/history/report/handoff/PM/session = false |
| **L2 CENSUS** | PASS |
| **L3A / PR #12** | MERGED / PASS — canonical extraction |
| **L3A.5 / PR #14** | MERGED / PASS — active-looking stale collisions = 0 |
| **L3A.6 / PR #16** | MERGED / PASS — squash `d24fc0ee99c7c45948d852d1bcc3dde161521aa7`; immutable link rewrite complete; no physical deletions/runtime changes |
| **FINAL PREDELETE REVERIFY** | PASS — 5/5 `DELETE_READY_FINAL`; A–I green; history plan 29/29; `UNPLANNED_HISTORY_REFS=[]`; atomic L3B simulation → zero broken links |
| **L3B DELETE SET** | `MVP_STATUS` · `MVP_CRITERIA` · `POST_MVP_BACKLOG` · `PLAN_OUTPUT_INGESTION` · `V4_POLLING_LATENCY` |
| **L3B REWRITE SET** | 28 history/evidence Markdown sources; immutable baseline `777504f7c46e5e724b6ad5f8586a98d43bab7ce8` |
| **LAST VERIFIED THROUGH** | `91847807bbc4d7b7f63d8e3b3fc48fdfc72f4699` — D-0081-V PASS, `intra_actor_self_verify` |
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
- L2, L3A, L3A.5, L3A.6 e final predelete reverify sono PASS.
- I 5 target sono `DELETE_READY_FINAL`, ma **la physical deletion non è autorizzata** senza gate umano esplicito.
- La futura L3B deve essere atomica: 5 delete + tutti i rewrite history previsti + audit update nello stesso change set; broken links finali = 0.
- Compatibility pointers da mantenere: `docs/RUNTIME_GATES.md`, `docs/WORKFLOW_EXPORT_STATUS.md`, `docs/HANDOFF_N8N_GATE.md`.
- Nessuna branch deletion o runtime/provider mutation è autorizzata.
- Nessuna modifica credenziali/OAuth/billing senza gate esplicito.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.
- GPT Web resta autore autorevole dei workflow n8n; Cursor non li ridisegna autonomamente.

## Puntatori

- Active work: GitHub issue **#10**
- Foundation/invarianti: `docs/foundation/PROJECT_VISION.md`
- Lean method: `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Audit: `docs/audits/WIKI_LLM_LEAN_REDUCTION_AUDIT.md`
- Candidate manifest + exact L3B history rewrite plan: `docs/audits/WIKI_LLM_LEAN_CANDIDATE_MANIFEST.md`
- Recovery baseline pre-cleanup: `777504f7c46e5e724b6ad5f8586a98d43bab7ce8` + Git history
- Next architecture evidence backlog: GitHub issue **#8**
- Evidence Cursor rolling: `docs/runtime/LAST_CURSOR_REPORT.md` — on demand
- Storico: Git history + `docs/sessions/` + PM/runtime-packets; mai bootstrap di default

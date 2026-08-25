# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**
> Deve restare piccolo. Non contiene cronologia, narrativa, HEAD remota corrente o copie di foundation/evidence.

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `WIKI-LLM-LEAN-CONSOLIDATION` |
| **ACTIVE WORK** | GitHub issue **#10 — Wiki-LLM lean consolidation — reduce stale/duplicate repository surface** |
| **BLOCCO ATTIVO** | `L3A-CANONICAL-EXTRACTION` |
| **STATO BLOCCO** | IN_PROGRESS |
| **GATE CORRENTE** | `L3A_CANONICAL_EXTRACTION_PR` |
| **NEXT** | preparare PR docs-only L3A: estrarre policy/runbook ancora validi nei proprietari canonici, trasformare fonti legacy pericolose in lean runbook/compatibility pointer, correggere inbound links; **nessuna cancellazione fisica o branch deletion** |
| **NEXT WORKSTREAM** | issue **#8 — Architecture v3 evidence track** dopo chiusura issue #10 |
| **BOOTSTRAP 9.5 VERIFY** | PASS — clone locale reale; `CORE_BOOT_SUFFICIENT=true`; preload foundation/history/report/handoff/PM/session = false; zero write/runtime |
| **L2 CENSUS** | PASS — reference/consumer/rebuild census completo; `DELETE_CANDIDATE=[]`; L3 separata in L3A semantic deconfliction → L3B physical reduction dopo re-census |
| **LAST VERIFIED THROUGH** | `91847807bbc4d7b7f63d8e3b3fc48fdfc72f4699` — D-0081-V PASS, `intra_actor_self_verify` |
| **PR #11** | MERGED — squash `feb755913712807ecbfe5aac5df662409e234c8e`; docs-only wiki-LLM lean foundation |
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
- L2 census è PASS; nessun file ha ancora superato il delete gate completo.
- L3A è docs-only e reversibile: nessuna cancellazione fisica, branch deletion o runtime mutation.
- L3B physical reduction si apre solo dopo re-census post-L3A.
- Nessun provider/runtime wiring v3 è ancora promosso a PASS.
- Nessuna modifica credenziali/OAuth/billing senza gate esplicito.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.
- GPT Web resta autore autorevole dei workflow n8n; Cursor non li ridisegna autonomamente.

## Puntatori

- Active work / cleanup backlog: GitHub issue **#10**
- Foundation/invarianti: `docs/foundation/PROJECT_VISION.md`
- Lean method: `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Audit: `docs/audits/WIKI_LLM_LEAN_REDUCTION_AUDIT.md`
- Candidate manifest: `docs/audits/WIKI_LLM_LEAN_CANDIDATE_MANIFEST.md`
- Recovery baseline pre-cleanup: `777504f7c46e5e724b6ad5f8586a98d43bab7ce8` + Git history
- Next architecture evidence backlog: GitHub issue **#8**
- Ultimo PASS D-0081-V: `docs/sessions/2026-08-25-control-plane-d-0081-v-d0080w-repository-verify-pass.md`
- Evidence Cursor rolling: `docs/runtime/LAST_CURSOR_REPORT.md` — **on demand**, può essere stale rispetto al frontier
- Storico: Git history + `docs/sessions/` + PM/runtime-packets; **mai bootstrap di default**

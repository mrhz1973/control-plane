# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**
> Deve restare piccolo. Non contiene cronologia, narrativa, HEAD remota corrente o copie di foundation/evidence.

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.1 wiki-LLM lean — CANONICAL |
| **WORKSTREAM ATTIVO** | `WIKI-LLM-LEAN-CONSOLIDATION` |
| **ACTIVE WORK** | GitHub issue **#10 — Wiki-LLM lean consolidation — reduce stale/duplicate repository surface** |
| **BLOCCO ATTIVO** | `POST-MERGE-LEAN-BOOTSTRAP-VALIDATION` |
| **STATO BLOCCO** | IN_PROGRESS |
| **GATE CORRENTE** | `POST_MERGE_LOCAL_SYNC_AND_CORE_BOOT_VERIFY_REQUIRED` |
| **NEXT** | sync locale `main` al remoto vivo; eseguire fresh CORE BOOT usando solo remote HEAD + README AI-BOOT + CURRENT_FRONTIER + issue #10; verificare `git diff --check` sul commit range post-merge; **zero edits/runtime**; riportare report a GPT Web |
| **NEXT WORKSTREAM** | issue **#8 — Architecture v3 evidence track** dopo chiusura del consolidation gate |
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

- Foundation v3.1 wiki-LLM lean è canonica su `main`; la riduzione fisica dello storico non è ancora autorizzata.
- Nessun provider/runtime wiring v3 è ancora promosso a PASS.
- Nessuna modifica credenziali/OAuth/billing senza gate esplicito.
- Nessun PM-34 unlock, L5 activation, endurance runtime, permanent Schedule/loop o public Telegram Trigger implicito.
- GPT Web resta autore autorevole dei workflow n8n; Cursor non li ridisegna autonomamente.

## Puntatori

- Active work / cleanup backlog: GitHub issue **#10**
- Merged lean implementation: PR **#11**
- Foundation/invarianti: `docs/foundation/PROJECT_VISION.md`
- Lean method: `docs/foundation/WIKI_LLM_LEAN_METHOD.md`
- Audit: `docs/audits/WIKI_LLM_LEAN_REDUCTION_AUDIT.md`
- Candidate manifest: `docs/audits/WIKI_LLM_LEAN_CANDIDATE_MANIFEST.md`
- Next architecture evidence backlog after lean gate: GitHub issue **#8**
- Ultimo PASS D-0081-V: `docs/sessions/2026-08-25-control-plane-d-0081-v-d0080w-repository-verify-pass.md`
- Evidence Cursor rolling: `docs/runtime/LAST_CURSOR_REPORT.md` — **on demand**, può essere stale rispetto al frontier
- Storico: Git history + `docs/sessions/` + PM/runtime-packets; **mai bootstrap di default**

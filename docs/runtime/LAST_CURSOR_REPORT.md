# LAST CURSOR REPORT — control-plane (rolling)

## Purpose

Registro su GitHub dell'evidenza post-push di Cursor, in formato leggibile e parsabile
(Markdown + blocco YAML-like). Il verificatore del PASS legge l'hash remoto da qui sul
remoto, oppure direttamente da `git ls-remote origin main` — **non** dalla chat Cursor.
Fonte primaria del PASS resta `PROJECT_VISION.md` §7.1 (hash remoto su `main`). Questo
file è l'artefatto persistente di quell'hash, non una sua sostituzione.

---

## LATEST

```yaml
task_ref: glm-advisor-session-starter-docs-only
result_cursor: PASS_DOCS_ONLY
result_runtime: NOT_RUN_BY_CURSOR
base_commit: 389eaf3df6d0ba138b569eeadf858f13a557a7a9
real_task_commit: 63f37090137f78bc7165c625fee20e5f316a8468
commit_subject: docs: add fixed GLM advisor session starter
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS docs-only commit 1 = HEAD locale, origin/main e ls-remote refs/heads/main coincidono su 63f3709; workspace clean; diff commit 1 limitato a docs/advisors/GLM_ADVISOR_METHOD.md; nessun workflow toccato; nessun runtime n8n; non Gate E PASS; non PASS runtime; GE-02 non autorizzato. Commit 2 = solo artefatti verifica/report.
remote_hash_verbatim: "63f37090137f78bc7165c625fee20e5f316a8468\trefs/heads/main"
timestamp_utc: 2026-07-04
```

- **Commit 1 — GLM Advisor session starter docs-only:** aggiunta §6.1 (starter fisso operatore) in `docs/advisors/GLM_ADVISOR_METHOD.md`; §7 esteso con `STALE_LOCAL_CLONE`, comandi eseguiti, contatori no-write; §4 whitelist **invariata**; nessun `git pull` obbligatorio; GLM rileva clone stale ma **non** lo aggiorna; verifica remota su `63f3709`.
- **Commit 2 (questo report):** solo artefatti di verifica (`LAST_CURSOR_REPORT.md`, `LAST_HANDOFF_VERIFY.md`); **non** modifica sostanza commit 1.
- **Explicit non-touched (commit 1):** `workflows/**`, wf40/41/42, `CURRENT_FRONTIER.md`, `AUTOMATION_ACTIVATION_PLAN.md`, `PROJECT_VISION.md`, runtime n8n, schedule/webhook/Telegram/classifier/tunnel, credenziali.
- **Gate E PASS = NO**; **PASS runtime = NO**; **GE-02 = not authorized**; nessun runtime n8n eseguito o attivato.
- Snapshot verifica attraverso `63f3709`; il commit che aggiorna questo file **non** auto-certifica il proprio hash (`rolling_report_commit: PENDING_SELF_REFERENCE`).
- **Backfill PENDING_SELF_REFERENCE:** `ge01-wf45-fanout-fixforward-pr1-merge-post-report` → `rolling_report_commit: 389eaf3` (in HISTORY).

---

## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task.
- I campi `rolling_report_commit` e `remote_hash_verbatim` del LATEST restano `PENDING_SELF_REFERENCE` finché quel LATEST è il più recente; si backfillano in HISTORY al task successivo. **Non** esiste un commit finalize-hash dedicato (`PROJECT_VISION.md` §8.1).
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Orchestratore:** se il report Cursor include già l'output post-push verbatim completo (`PROJECT_VISION.md` §8.1), **non** chiedere shell manuale all'utente; leggere anche `docs/runtime/LAST_HANDOFF_VERIFY.md` durante `aggio control`; verify-only Cursor se manca/stale; shell utente = fallback finale.
- **Policy materiali sensibili v2.15:** il repo è trattato come non-confidenziale secondo `PROJECT_VISION.md` §10; non stampare o introdurre token, API key, OAuth material, PAT, URL con token, credential material o runtime dump non previsto. Chat_id e identificatori tailnet seguono le eccezioni/tolleranze documentate in `PROJECT_VISION.md` §10. Controllo compensativo finale: rotazione credenziali secondo `docs/ROTATION_CHECKLIST.md`.
- **Two-commit convention:** quando un task reale deve essere referenziato dal rolling report, Cursor crea prima il commit reale (commit 1), cattura l'hash con `git rev-parse HEAD`, e solo dopo crea il commit docs/report (commit 2). Cursor **non** deve mai predire o inventare il proprio hash futuro.

---

## HISTORY

Solo le **5 entry più recenti**, compatte. Cronologia precedente: Git history + `docs/sessions/`.

```yaml
- task_ref: ge01-wf45-fanout-fixforward-pr1-merge-post-report
  real_task_commit: 6a6b9d8f9679a86423ad9914df9629d7df679b65
  rolling_report_commit: 389eaf3df6d0ba138b569eeadf858f13a557a7a9
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-04

- task_ref: readme-policy-alignment-docs-only
  real_task_commit: b2f66140902df5a92fcb70a294c59ab6ea0d4233
  rolling_report_commit: b62a30b24223a86396119c3d106f2bc2597a71af
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-03

- task_ref: glm-advisor-method-docs-only
  real_task_commit: 19bd24c06f5f0d83efb361c695dae467180e8d0f
  rolling_report_commit: 64dbd8bac29ece0f759c37c72e49baad8cfdf0da
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-03

- task_ref: gate-e-controlled-start-prep-docs-only
  real_task_commit: 34cea4684491ff729df7322418e558febff4257b
  rolling_report_commit: 6832b9b7e0da42b0fcce5fb0da07cc5548e0eb6c
  result_cursor: PASS_DOCS_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-03

- task_ref: post-gate-d-policy-frontier-verify-only
  real_task_commit: b462ee7eda6235797dab41ac822a331e30bbe7c5
  rolling_report_commit: 1a910b4eba30f6e6ff4f801b2cdbb1984a6d0a0d
  result_cursor: PASS_VERIFY_ONLY
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-07-03
```

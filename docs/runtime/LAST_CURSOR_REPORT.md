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
task_ref: automatic-post-push-verifier-design
result_cursor: PASS
result_runtime: NOT_RUN_BY_CURSOR
real_task_commit: 2fff6572d2252453536a86b1510b3772808c341f
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS = docs-only AUTOMATIC_POST_PUSH_VERIFIER design + LAST_HANDOFF_VERIFY backfill to 7fac1ad + activation plan micro-step + session log + commit in origin/main + redaction check exit 0; no runtime; no n8n workflow; PM-34 BLOCKED; n8n_ready=false
remote_hash_verbatim: PENDING_SELF_REFERENCE
timestamp_utc: 2026-06-07
```

- Creato design **automatic post-push verifier** (`docs/runtime/AUTOMATIC_POST_PUSH_VERIFIER.md`).
- Verifier sostituisce il copia-incolla manuale degli output git; n8n/worker esegue verifica **deterministica**.
- GPT/Codex entra solo per diagnosi / Decision Packet — **non** per hash equality.
- **`LAST_HANDOFF_VERIFY.md`** aggiornato fino a **`7fac1ad`**; `artifact_commit: PENDING_SELF_REFERENCE` — non auto-certifica questo task.
- Nessun runtime n8n. Nessun nuovo workflow. **PM-34 BLOCKED.** **`n8n_ready=false`**.
- `rolling_report_commit` / `remote_hash_verbatim` = **PENDING_SELF_REFERENCE** finché questo LATEST resta il più recente; backfill in HISTORY al task successivo.

Snapshot task commit:

```text
2fff6572d2252453536a86b1510b3772808c341f	refs/heads/main
```

---

## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task.
- I campi `rolling_report_commit` e `remote_hash_verbatim` del LATEST restano `PENDING_SELF_REFERENCE` finché quel LATEST è il più recente; si backfillano in HISTORY al task successivo. **Non** esiste un commit finalize-hash dedicato (`PROJECT_VISION.md` §8.1).
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Orchestratore:** se il report Cursor include già l'output post-push verbatim completo (`PROJECT_VISION.md` §8.1), **non** chiedere shell manuale all'utente; leggere anche `docs/runtime/LAST_HANDOFF_VERIFY.md` durante `aggio control`; verify-only Cursor se manca/stale; shell utente = fallback finale.
- **Nessun segreto**: token, chat_id, webhook, PAT, API key, OAuth, URL con token.

---

## HISTORY

Solo le **5 entry più recenti**, compatte. Cronologia precedente: Git history + `docs/sessions/`.

```yaml
- task_ref: last-handoff-verify-artifact
  real_task_commit: 3cb075a4b7b6b2b1b611a80dc15089fdcf485ee6
  rolling_report_commit: 7fac1add9a7c515a5d55f21d87f61a63935815bd
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-07

- task_ref: handoff-post-push-verification-rule
  real_task_commit: 94ed080996a6d5c77691aa4ed1b573439c51a2e2
  rolling_report_commit: 890b104ea634bf35800015cbb5c4e031d7aab6bc
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-07

- task_ref: gate-b-inbound-one-shot-pass
  real_task_commit: 83105bdf185135c4cf8c99dc31f5ec93dd70daab
  rolling_report_commit: 46f6638c5c56ef953464fc541acb25fa68ccb474
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-07

- task_ref: gate-a-readiness-audit-pass
  real_task_commit: 7fd7377c0573b0e56e3784d3c6063bbc955e26c1
  rolling_report_commit: bd497bdece4b3ced4d112dc1a104ceb137c4fa33
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-07

- task_ref: d0028a-automation-activation-plan
  real_task_commit: f42c06e2a1881141dfa1342746fc22e4651007c4
  rolling_report_commit: e36d91d02efdb2ceb6528f7d43069a347feeedff
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-07
```

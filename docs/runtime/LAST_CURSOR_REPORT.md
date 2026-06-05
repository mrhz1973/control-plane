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
task_ref: redact-tailnet-identifiers-and-check
result_cursor: PASS
result_runtime: NOT_RUN_BY_CURSOR
real_task_commit: c77cfae63140b013db460eaddc9edce5b2bdb458
rolling_report_commit: PENDING_SELF_REFERENCE
branch: main
verification_rule: PASS = forward redaction commit in origin/main + tools/redaction-check.sh exit 0; no runtime; no history rewrite; no workflow/export/template changes; no secrets added
remote_hash_verbatim: PENDING_SELF_REFERENCE
timestamp_utc: 2026-06-05T22:22:44Z
```

- `real_task_commit` = `docs: redact tailnet identifiers and add check` (`c77cfae`).
- `result_runtime` = **NOT_RUN_BY_CURSOR** — forward redaction + local pre-commit check only.
- `rolling_report_commit` / `remote_hash_verbatim` = **PENDING_SELF_REFERENCE** finché questo LATEST resta il più recente; backfill in HISTORY al task successivo (`PROJECT_VISION.md` §8.1).

Snapshot task commit:

```text
c77cfae63140b013db460eaddc9edce5b2bdb458	refs/heads/main
```

---

## Rules

- **PASS** richiede che `real_task_commit` risulti nella chain di `origin/main`.
- Il **GitHub raw** può essere **stale** (cache/CDN): in caso di divergenza, **vince l'hash remoto** (`git ls-remote` / `git rev-parse origin/main`).
- `rolling_report_commit` **non** va trattato come il commit reale del task.
- I campi `rolling_report_commit` e `remote_hash_verbatim` del LATEST restano `PENDING_SELF_REFERENCE` finché quel LATEST è il più recente; si backfillano in HISTORY al task successivo. **Non** esiste un commit finalize-hash dedicato (`PROJECT_VISION.md` §8.1).
- Un **SUCCESS** dichiarato **senza** l'output git richiesto **non** è PASS.
- **Nessun segreto**: token, chat_id, webhook, PAT, API key, OAuth, URL con token.

---

## HISTORY

Solo le **5 entry più recenti**, compatte. Cronologia precedente: Git history + `docs/sessions/`.

```yaml
- task_ref: d0022w-n8n-classifier-manual-wiring-pass
  real_task_commit: eadd9287b154ba27235cbe8da876922e8dd6de17
  rolling_report_commit: 03c1e7b05313e87069e415abc78312c2dc94c0d9
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-05T19:14:04Z

- task_ref: classifier-tailscale-serve-auth-acl-pass
  real_task_commit: a8a198fa16fe10a709006c3d6f8ceb8f5d17d93f
  rolling_report_commit: 45231516831a9e6936c86e09ff1da1fb2d97d72c
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-04T01:03:27Z

- task_ref: classifier-persistent-at-logon-a1-pass
  real_task_commit: 408e5752aaa1262d2e6a6b775cc1845916538a37
  rolling_report_commit: b295afacf47414eb8e61fd7c7e0fcb8cbdeff4f3
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-03T23:45:31Z

- task_ref: canonicalize-rolling-report-backfill-convention
  real_task_commit: c6051033aa3e80dd1ae682b0803369d517858c1a
  rolling_report_commit: 5694b0d1e1daff16be488f01705a7f096dc9690b
  remote_hash_verbatim: 5694b0d1e1daff16be488f01705a7f096dc9690b
  result_cursor: PASS
  result_runtime: NOT_RUN_BY_CURSOR
  timestamp_utc: 2026-06-03T22:17:00Z

- task_ref: decision-store-gate3-runtime-pass
  real_task_commit: 0f6605c7c0dd6fbd06f5a5480905ef91300a9dc6
  rolling_report_commit: 7f833e5af295ca59f79b49d46d237ec0ad706ba4
  result_cursor: PASS
  result_runtime: PASS_ATTESTATO_UTENTE
  timestamp_utc: 2026-06-02T22:53:00Z
```

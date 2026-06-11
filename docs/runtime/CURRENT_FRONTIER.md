# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/runtime/LAST_HANDOFF_VERIFY.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-06-11 — D-0032-W Opzione 1 Passo 2: verifier result uploader (manual one-shot).

---

## Stato operativo attuale

- Foundation: completa. Workflow **40/42**: **ATTIVO** (unchanged). Workflow **41**: off.
- Classifier / mapping preview: **D-0021**–**D-0025-L** PASS; **D-0027-R** Wd45 reverification PASS.
- **D-0028-A Option 2:** activation plan committed. **Gate A** PASS · **Gate B** inbound one-shot **PASS ATTESTATO UTENTE** (2026-06-07). **Option 4 not permanent loop.**
- **`n8n_ready=false`** unchanged. **No permanent automation declared**. Pezzi collegati ≠ loop avviato.
- **D-0032-W Opzione 1 Passo 2:** `tools/push-post-push-verifier-result.ps1` **implementato** — esecuzione **manuale one-shot**; esegue verifier locale e deposita JSON su VPS via SFTP alias `ionos-cpinbox` → `/srv/cp-verifier-inbox/latest.json`. **No schedule** · **no loop** · **no push-hook** · **no runtime PASS da Cursor** (validazione campi = step futuro user-attested).
- **Workflow 57 / Post-push verifier file reader TEST ONLY:** versionato (`9804765`); **Manual Trigger only**, **active=false**; legge JSON da `/files/control-plane-verifier-inbox/latest.json`; reader **PASS runtime attestato** (2026-06-08); **non loop**, **non schedule**. wf40/42 untouched · wf41 off · no Telegram Trigger/Funnel/public webhook · **PM-34 BLOCKED**.
- **Runtime post-push verifier:** `tools/runtime-post-push-verifier.ps1` **implementato e hardened** — auto-source scoped LATEST. Trasporto remoto: **`docs/runtime/REMOTE_INVOCATION_TRANSPORT_DESIGN.md`** — **APPROVED** Opzione 2 (B) variante **manuale one-shot** (2026-06-11); **not auto-wired**.

## Latest verified PASS

- **Gate B — Inbound one-shot (D-0028-A)**: **PASS ATTESTATO UTENTE** — `D-1000-T` closed via **47/Wf** manual polling; `selected_option=1`, `update_id=986228573`. **Not** permanent loop. Evidenza: `docs/sessions/2026-06-07-control-plane-gate-b-inbound-one-shot-pass.md`.
- **Gate A — Readiness audit (D-0028-A)**: **PASS ATTESTATO UTENTE** — read-only inventory + classifier `/healthz`. Evidenza: `docs/sessions/2026-06-07-control-plane-gate-a-readiness-audit-pass.md`.
- **D-0027-R — Wd45 runtime reverification**: **PASS ATTESTATO UTENTE** — existing workflow **45/Wd**; test-only `D-9999-T`; `telegram_send_ok`, `message_id=748`. Evidenza: `docs/sessions/2026-06-07-control-plane-wd45-d9999t-runtime-reverification-pass.md`.
- **D-0025-L — Live classifier mapping preview**: **PASS ATTESTATO UTENTE** — workflow `56`. Evidenza: `docs/sessions/2026-06-07-control-plane-d0025l-live-mapping-preview-runtime-pass.md`.
- **D-0024-M — Decision Packet mapping preview (fixture-only)**: **PASS ATTESTATO UTENTE** — workflow `55`. Evidenza: `docs/sessions/2026-06-06-control-plane-d0024m-mapping-preview-runtime-pass.md`.
- **D-0023-N — Decision Packet mapping design**: **PASS** (docs-only). Evidenza: `docs/contracts/decision-packet-mapping-v1.md`, `docs/sessions/2026-06-05-control-plane-d0023n-decision-packet-mapping-design.md`.
- **D-0022-W / D-0021**: **PASS ATTESTATO UTENTE**.

## Decision Packet / Telegram / inbound / decision-store (known state)

Costruito e in gran parte **test-PASSato**; **NON attivo** come loop operativo.

| Asset | Stato | Note |
|-------|--------|------|
| **45 / Wd** | **PASS ATTESTATO UTENTE** + Gate B send **2026-06-07** | Original/riverifica: `D-9998-T`/`D-9999-T`. Gate B: **`D-1000-T`** send OK (`message_id=753`,`754` duplicate diagnostic). **Non va ricreato.** |
| **46 / We** | Package-prep **completato**; **live BLOCKED/PENDING** | HTTPS webhook required; **We live PASS NON registrato**. |
| **47 / Wf** | **PASS multipli** + **Gate B** one-shot **2026-06-07** | **`D-1000-T` closed** via manual polling; `update_id=986228573`. **Ora off.** Session: `docs/sessions/2026-06-07-control-plane-gate-b-inbound-one-shot-pass.md`. |
| **48 / Wg** | **PASS**; **callable**; **non schedulato** | Not auto-promoted by Gate B. |
| **49 / Wh** | Rehearsal **PASS**; **inattivo** | Not auto-promoted by Gate B. |
| **decision-store** | Gates **1–3 PASS** + Gate B row **`D-1000-T` closed** | `D-9998-T` closed (historical). **`D-9999-T` open** residue — not deleted. |

- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- **We/46 live**: **BLOCKED/PENDING** (HTTPS webhook).
- **Attivazione operativa inbound/loop**: **gate separato** — non deciso; eventuale prossimo runtime = **riuso/riverifica asset esistenti**, non nuovo workflow.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

**Not auto-started.** Recommended next: **user-attested runtime** of `tools/push-post-push-verifier-result.ps1` + manual workflow 57 read of deposited JSON — separate session; **not** PM-34, **not** permanent loop, **not** schedule. Then: hardening/cleanup **`D-9999-T`** + **47/Wf** target, **or** Gate C (We/46 HTTPS) / Option 4 — **separate explicit decision** only. Boundaries: NO PM-34 · NO `n8n_ready=true` · NO permanent loop · wf40/42 untouched · pezzi collegati ≠ loop avviato.

## Redaction hygiene

- Before commits touching docs/workflow artifacts: run `bash tools/redaction-check.sh`.

## Handoff / post-push verification

- **Invariante §8.1 PROJECT_VISION:** report Cursor post-push deve includere output git verbatim (incluso `git ls-remote origin main`). Orchestratore **non** chiede shell utente se output già presente; verify-only Cursor se manca; shell utente = fallback finale.
- **`LAST_HANDOFF_VERIFY.md`:** artefatto persistente per `aggio control`; snapshot backfilled to `7fac1ad` (last-handoff-verify-artifact); `artifact_commit: PENDING_SELF_REFERENCE`. **PM-34 BLOCKED** · **`n8n_ready=false`** · nessun runtime.
- **`AUTOMATIC_POST_PUSH_VERIFIER.md`:** design docs-only — future n8n/worker replaces manual verify paste; LLM not needed for hash equality.
- **`tools/runtime-post-push-verifier.ps1`:** **runtime verifier implementato e hardened** (structured JSON, PASS→exit 0 / FAIL→exit 1). **Auto-source scoped al blocco LATEST** di `LAST_CURSOR_REPORT.md` (mai da HISTORY); override manuale opzionale; fail-closed `expected_commit_unreadable`. Verifica indipendente contro il remoto. **No wrapper HTTP** · **no n8n runtime** · wf40/42 untouched · **PM-34 BLOCKED** · **`n8n_ready=false`**.
- **`tools/push-post-push-verifier-result.ps1`:** **uploader manuale one-shot** — child verifier + deposito SFTP alias `ionos-cpinbox`; exit 0 solo su verifier PASS + upload OK. **No schedule** · **no loop** · wf57 inactive/manual · runtime field validation **future/user-attested**.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook / PM-34 unlock / wf40/41/42 mutation / secrets in Git.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO declaring prior test-PASS assets as permanent operational loop automation.

## Audit

- Inbound/decision-store: sessions under `docs/sessions/2026-05-31-*`, `docs/sessions/2026-06-01-*`, `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`.
- Mapping preview / Wd reverification: `docs/sessions/2026-06-06-control-plane-d0024m-*`, `docs/sessions/2026-06-07-control-plane-d0025l-*`, `docs/sessions/2026-06-07-control-plane-wd45-d9999t-runtime-reverification-pass.md`.
- D-0028-A / Gates: `docs/runtime/AUTOMATION_ACTIVATION_PLAN.md`, Gate A/B sessions `docs/sessions/2026-06-07-control-plane-gate-*`.
- Hash / verify: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/runtime/LAST_HANDOFF_VERIFY.md`, `docs/runtime/AUTOMATIC_POST_PUSH_VERIFIER.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.

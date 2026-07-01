# CURRENT FRONTIER — Stato autorevole del progetto control-plane

> LEGGI QUESTO FILE PER PRIMO, prima di proporre qualsiasi cosa.
> Lo stato si LEGGE da qui, NON si ricostruisce cercando tra i session log.
> Questo file è un **file di stato compatto**, NON un archivio storico.
> Evidenza: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/runtime/LAST_HANDOFF_VERIFY.md`, `docs/sessions/`, Git history.

Ultimo aggiornamento: 2026-07-02 — Gate D bounded rehearsal PASS attestato (D-0033).

---

## Stato operativo attuale

- Foundation: completa. Workflow **40/42**: **ATTIVO** (unchanged). Workflow **41**: off.
- Classifier / mapping preview: **D-0021**–**D-0025-L** PASS; **D-0027-R** Wd45 reverification PASS.
- **D-0028-A Option 2:** activation plan committed. **Gate A** PASS · **Gate B** inbound one-shot **PASS ATTESTATO UTENTE** (2026-06-07). **Gate D** bounded rehearsal **PASS ATTESTATO UTENTE / Claude-attested** (2026-07-02). **Option 4 not permanent loop.**
- **`n8n_ready=false`** unchanged. **No permanent automation declared**. Pezzi collegati ≠ loop avviato.
- **D-0032-W:** **completato e field-validated** — **PASS ATTESTATO UTENTE / Claude-attested** (2026-06-11). Trasporto **manuale one-shot operativo**: `tools/push-post-push-verifier-result.ps1` → verifier locale → SFTP alias `ionos-cpinbox` → `/srv/cp-verifier-inbox/latest.json` → workflow 57 reader `/files/control-plane-verifier-inbox/latest.json`. Invocazione canonica: `powershell -NoProfile -ExecutionPolicy Bypass -File tools\push-post-push-verifier-result.ps1` (`-ExecutionPolicy Bypass` = **solo process-level**; nessuna modifica policy persistente del nodo). **No schedule** · **no loop** · **no push-hook** · **no wrapper HTTP** · **no callable-from-n8n worker**.
- **Workflow 57 / Post-push verifier file reader TEST ONLY:** versionato (`9804765`); **Manual Trigger only**, **active=false**; field-validation **PASS ATTESTATO UTENTE** (2026-06-11); **non loop**, **non schedule**. wf40/42 untouched · wf41 off · no Telegram Trigger/Funnel/public webhook · **PM-34 BLOCKED**.
- **Runtime post-push verifier:** `tools/runtime-post-push-verifier.ps1` **implementato e hardened** — auto-source scoped LATEST. Trasporto remoto: **`docs/runtime/REMOTE_INVOCATION_TRANSPORT_DESIGN.md`** — **APPROVED** Opzione 2 (B) variante **manuale one-shot**; **field-validated end-to-end**.

## Latest verified PASS

- **Gate D — Bounded rehearsal (D-0033)**: **PASS ATTESTATO UTENTE / Claude-attested** — pre-step `D-9999-T` hygiene; Fase 1 `D-1001-T` manual + UI fix 45/47; Fase 2 `D-1002-T` time-boxed scheduled pickup within window; Addendum A `D-1003-T` handoff 47→48 with `state_persisted=true`; final inventory aligned with Gate A; **`enable_wg48_handoff=false`**. Evidenza: `docs/sessions/2026-07-02-control-plane-gate-d-rehearsal-pass.md`.
- **D-0032-W — Field-validation end-to-end (manual one-shot)**: **PASS ATTESTATO UTENTE / Claude-attested** — uploader + SFTP + wf57 manual read (`read_ok=true`, `hash_match=true`); cleanup `LATEST_JSON_CLEAN`. Evidenza: `docs/sessions/2026-06-12-control-plane-d-0032-w-field-validation-pass.md`.
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
| **45 / Wd** | **PASS ATTESTATO UTENTE** + Gate D **2026-07-02** | Gate B: `D-1000-T`. Gate D: `D-1001-T`/`D-1002-T`/`D-1003-T` sends; UI fix `event.event_id`. **Inactive** post-rehearsal. |
| **46 / We** | Package-prep **completato**; **live BLOCKED/PENDING** | HTTPS webhook required; **We live PASS NON registrato**. |
| **47 / Wf** | **PASS multipli** + **Gate D** **2026-07-02** | `D-1001-T`/`D-1002-T`/`D-1003-T` closed; time-boxed pickup proven; schedule **deactivated**. **`enable_wg48_handoff=false`**. **Inactive / not Published.** |
| **48 / Wg** | **PASS** + Gate D handoff **2026-07-02** | **`state_persisted=true`** on `D-1003-T`; **callable**; **non schedulato**. |
| **49 / Wh** | Rehearsal **PASS**; **inattivo** | Not auto-promoted by Gate D. |
| **decision-store** | Gates **1–3 PASS** + Gate B/D rows closed | `D-9999-T` closed (hygiene). `D-1001-T`/`D-1002-T`/`D-1003-T` closed (Gate D). |

- **Telegram inbound operational automation**: **NOT ACTIVE / NOT RUN**.
- **We/46 live**: **BLOCKED/PENDING** (HTTPS webhook).
- **Attivazione operativa inbound/loop**: **gate separato** — non deciso; eventuale prossimo runtime = **riuso/riverifica asset esistenti**, non nuovo workflow.
- Catena completa AUTOMATIZZATA: **NOT RUN**. **PM-34**: **BLOCKED**.

## Active blockers

- **PM-34**: **BLOCKED**.
- **We** (HTTPS webhook): **BLOCKED/PENDING**.

## Next gate

**Not auto-started.** **Gate D closed** (2026-07-02). **Gate E** — **SOLO via Decision Packet dedicato** — precondizioni documentate:

1. **Fan-out** messaggi/item da risolvere (45 invia 3–5 messaggi; output 47 ripetuti 4–6 item).
2. **47** deve derivare decisioni aperte dallo store, non da lista manuale `open_decision_ids_test_only`.
3. **Re-export redatto** 45 e 47 post-fix UI — divergono dai template committati; rebuild deve bastare.
4. Flag **`enable_wg48_handoff`** documentato; default **`false`** fuori test.

Gates C / E / F: **not PASS** unless separately attested. Boundaries unchanged: **PM-34 BLOCKED** · **`n8n_ready=false`** · NO permanent schedule · wf40/42 untouched · pezzi collegati ≠ loop avviato.

## Redaction hygiene

- Before commits touching docs/workflow artifacts: run `bash tools/redaction-check.sh`.
- **Decisione 2026-07-02 — redaction policy aggiornata:** **identificatori tailnet** (IP CGNAT `100.x`, hostname `*.ts.net`) **non bloccanti** — WARN informativo, repo pubblico consapevole. **Restano vietati e bloccanti:** token (incluso bot token Telegram), `chat_id`, credential, OAuth, PAT, webhook secret, API key. `tools/redaction-check.sh` aggiornato in commit `tools:` separato (aggiunti pattern Telegram bot token + chat_id). Eccezione chat_id 2026-05-31 (workflow JSON / data-tables seed) invariata. Invarianti confermati: **PM-34 BLOCKED** · **`n8n_ready=false`** · wf40/41/42 untouched · no permanent schedule · no public webhook · **Gate E solo via Decision Packet dedicato**.

## Handoff / post-push verification

- **Invariante §8.1 PROJECT_VISION:** report Cursor post-push deve includere output git verbatim (incluso `git ls-remote origin main`). Orchestratore **non** chiede shell utente se output già presente; verify-only Cursor se manca; shell utente = fallback finale.
- **`LAST_HANDOFF_VERIFY.md`:** artefatto persistente per `aggio control`; snapshot D-0032-W field-validation through `966f508`; `artifact_commit: PENDING_SELF_REFERENCE`. **PM-34 BLOCKED** · **`n8n_ready=false`**.
- **`AUTOMATIC_POST_PUSH_VERIFIER.md`:** design docs-only — future n8n/worker replaces manual verify paste; LLM not needed for hash equality.
- **`tools/runtime-post-push-verifier.ps1`:** **runtime verifier implementato e hardened** (structured JSON, PASS→exit 0 / FAIL→exit 1). **Auto-source scoped al blocco LATEST** di `LAST_CURSOR_REPORT.md` (mai da HISTORY); override manuale opzionale; fail-closed `expected_commit_unreadable`. Verifica indipendente contro il remoto. **No wrapper HTTP** · **no n8n runtime** · wf40/42 untouched · **PM-34 BLOCKED** · **`n8n_ready=false`**.
- **`tools/push-post-push-verifier-result.ps1`:** **uploader manuale one-shot operativo** — invocazione canonica `powershell -NoProfile -ExecutionPolicy Bypass -File tools\push-post-push-verifier-result.ps1`; child verifier + deposito SFTP alias `ionos-cpinbox`; field-validation **PASS ATTESTATO UTENTE** (2026-06-11). **No schedule** · **no loop** · wf57 inactive/manual.

## Do-not-do

- NO Telegram Trigger / Funnel / public webhook / PM-34 unlock / wf40/41/42 mutation / secrets in Git.
- NO `pm34_unblocked=true` or `n8n_ready=true`.
- NO declaring prior test-PASS assets as permanent operational loop automation.

## Audit

- Inbound/decision-store: sessions under `docs/sessions/2026-05-31-*`, `docs/sessions/2026-06-01-*`, `docs/sessions/2026-06-02-control-plane-decision-store-gate3-runtime-pass.md`.
- Mapping preview / Wd reverification: `docs/sessions/2026-06-06-control-plane-d0024m-*`, `docs/sessions/2026-06-07-control-plane-d0025l-*`, `docs/sessions/2026-06-07-control-plane-wd45-d9999t-runtime-reverification-pass.md`.
- D-0028-A / Gates: `docs/runtime/AUTOMATION_ACTIVATION_PLAN.md`, Gate A/B sessions `docs/sessions/2026-06-07-control-plane-gate-*`.
- D-0032-W field-validation: `docs/sessions/2026-06-12-control-plane-d-0032-w-field-validation-pass.md`.
- Gate D bounded rehearsal: `docs/sessions/2026-07-02-control-plane-gate-d-rehearsal-pass.md`.
- Hash / verify: `docs/runtime/LAST_CURSOR_REPORT.md`, `docs/runtime/LAST_HANDOFF_VERIFY.md`, `docs/runtime/AUTOMATIC_POST_PUSH_VERIFIER.md`.

## Manutenzione

- Epilogo per ogni task che cambia stato. Preferibilmente < 120 righe.

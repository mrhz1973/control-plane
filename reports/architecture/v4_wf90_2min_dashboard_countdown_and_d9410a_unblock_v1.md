# V4_WF90_2MIN_DASHBOARD_COUNTDOWN_AND_D9410A_UNBLOCK_V1

**Data:** 2026-09-15/16 · **Executor:** Cursor (GLM 5.3) · **Base HEAD:** `77f147c437bc392038a616dc4243978ae7b8e578` · **Final HEAD:** `7d71b11ae1f37a4d4b771b6fbd6bc448e6967029`

**RESULT=PASS**

## Phase 1 — Diagnosi D-9410-A (evidenza attuale, non inferita)

Lettura live dispatcher `GET /v1/diagnostics` prima di ogni modifica:

```
D9410A_PRESENT_IN_QUEUE=YES        (READY_D9410A.md, scanned_file_count=33)
D9410A_PARSEABLE=YES               (backlog_state=READY_FOR_PLANNING)
D9410A_CONSUMABLE=YES              (admissible=true)
D9410A_RECEIPT_PRESENT=NO          (matching_receipt_count=0)
D9410A_RECEIPT_STATE=NONE
D9410A_SELECTOR_ELIGIBLE=YES       (eligible=true; selection_reason_code=SELECTED;
                                   candidate_task_ref=LOCAL_DEV_B_D-9410-A;
                                   eligible_count=1)
D9410A_LAST_REASON_CODE=TRACKED_DIRTY_CONFLICT (dal last_tick, non dal selector)
```

### Perché la dashboard mostrava `eligible=0`, `blocked=29`, `HUMAN_GATE_REQUIRED`

Tre cause concatenate, tutte verificate su evidenza reale:

1. **`eligible=0` (storico, pre-fast-forward):** il checkout locale era a
   `7dd9010` mentre `READY_D9410A.md` esisteva solo a `77f147c`. La scansione
   della coda locale non vedeva il file. Il precheck di questo task ha
   allineato con l'unico fast-forward consentito → il file è apparso e la
   coda ha riportato `eligible_count=1 / SELECTED`.
2. **`blocked by receipt = 29`:** tutti i 29 receipt nel ledger
   `reports/runtime/dev-queue/always-on/receipts.json` sono classificati
   bloccanti dalla funzione canonica `isReceiptBlocking` (16 legacy senza
   `state` → fail-closed; 11 PASS; 2 STOP terminali con
   `execution_started=true`). Sono **STORICI con receipt terminale**, NON
   lavoro corrente che richiede azione umana. La dashboard ora li separa
   (`READY TOTALI / READY ESEGUIBILI / READY BLOCCATI / STORICI CON RECEIPT
   TERMINALE`). Nessun receipt è stato modificato, cancellato o convertito.
3. **`HUMAN_GATE_REQUIRED`:** il tick 22:10:40Z riportava
   `reason_codes=["TRACKED_DIRTY_CONFLICT"]`,
   `gate_summary="tracked dirty: 2 file(s)"` — il gate fail-closed di repo
   hygiene del dispatcher scattava **dopo** la selezione di D-9410-A e
   **prima** dell'esecuzione, causa i 2 file tracked-dirty pre-esistenti
   `reports/runtime/cursor-acp/mcp-gate-{suite-results,wiring-result}.json`
   (churn di run dei test ACP/MCP: timestamp/run_id/session_sha diversi).
   Il defect `HUMAN_GATE_DECLARED` di D-9410-A era già corretto in
   `77f147c` (`human_gate_required_if: []`); il blocker era **questo**,
   non un gate dichiarativo.

### Sblocco naturale (nessuna esecuzione manuale, nessun receipt prodotto)

I 2 file dirty sono churn di telemetry riproducibile da `tests/v4-cursor-acp-mcp-gate/run.mjs`
(non parte di questo task). Ripristinati al contenuto committato con
`git checkout --` (ripristino file, non cancellazione receipt; il contenuto
committato è la versione canonica degli stessi artifact). Dopo il ripristino
il worktree era tracked-clean → il gate repo-hygiene è passato.

## Phase 2 — WF90 live schedule 5 min → 2 min (LIVE, non da documentazione)

Workflow `90ldaa5a-4000-8000-000000000090` su NEW VPS `ionos-n8n-new`
(root-n8n-1, n8n 2.33.3, postgres). Percorso canonico export→import→publish:

1. Backup pre-change su VPS (`/tmp/wf90-pre-2min-backup.json`, 7823 byte).
2. Export canonico; modifica SOLO `Schedule Trigger - LOCAL_DEV tick`
   `minutesInterval: 5 → 2`. Preservati: workflow id, 7 nodi, connections,
   credenziale Telegram (`t7zNsQdsOXmXbmgw` per riferimento, mai esportata),
   settings, endpoint Tailscale, payload, idempotenza. Nessun secondo
   trigger/scheduler.
3. `n8n import:workflow` + `n8n publish:workflow` + `docker restart root-n8n-1`
   (healthz OK; restart necessario per il trigger attivo, stesso precedente
   canonico di `tools/import-wf40-post-seam.sh`).

```
WF90_ACTIVE=YES (active=t in workflow_entity)
WF90_SCHEDULE_BEFORE_SECONDS=300   (rule.interval[0].minutesInterval=5)
WF90_SCHEDULE_AFTER_SECONDS=120    (rule.interval[0].minutesInterval=2)
WF90_SCHEDULE_INTERVAL_SECONDS=120 (marker richiesto)
WF90_VERSION=b31a957b-…→dccaff58-… (solo version bump da schedule change)
WF90_CADENCE_LIVE_VERIFIED=5 TICK CONSECUTIVI A Δ120s
  (22:36:41 → 22:38:41 → 22:40:41 → 22:42:41 → 22:44:41 UTC, execution_entity)
```

## Phase 3 — Dashboard: countdown, fase, gate, coda

File: `tools/local-dev-dispatcher-dashboard-v1.html`,
`tools/serve-local-dev-autonomous-dispatcher-v1.mjs`,
`tests/local-dev-dispatcher-service-v1/run.mjs`.

- **`tick_clock` in `/v1/diagnostics`** (additivo, schema
  `local-dev-dispatch-tick-clock-v1`): `wf90_interval_seconds=120`,
  `last_observed_tick_at` (= `last_tick.recorded_at` REALE),
  `next_expected_tick_at = last + 120000ms`. Nessun anchor inventato.
- **Strip operativa in cima alla pagina**: PROSSIMO CONTROLLO BACKLOG
  (countdown MM:SS client-side ogni secondo), Ultimo tick, Prossimo previsto,
  Cadenza. A zero senza nuovo tick reale: **"ATTESA TICK N8N"** — nessun
  riavvio sintetico del countdown; il tick reale successivo riallinea dal
  suo timestamp osservato.
- **Phase rail**: ATTESA → SCAN → SELECT → CLAIM → QWEN PREFLIGHT →
  ADMISSION → EXECUTOR → TEST → PASS / STOP / HUMAN GATE, mappata SOLO da
  campi reali (`status.phase`, `status.classification`, `last_tick`).
- **Task visibility** durante esecuzione: TASK / CONTROLLER / MODELLO /
  HARNESS / FASE / ELAPSED da dati runtime reali.
- **HUMAN GATE visibility**: pannello con `Blocked at: <fase>`,
  `Reason: <reason_code>`, `Detail: <gate_summary/detail>`, `Task:` —
  verificato live: "Blocked at: Verifica del repository · Reason:
  TRACKED_DIRTY_CONFLICT · Detail: tracked dirty: 2 file(s)".
- **Queue display fix**: contatori separati READY TOTALI / READY ESEGUIBILI /
  READY BLOCCATI / STORICI CON RECEIPT TERMINALE; riga D-9410-A visibile
  individualmente (`READY · ELIGIBLE` quando eleggibile; Storico/ricevuta
  terminale quando storico). I 29 PASS storici NON sono più presentati come
  lavoro corrente bloccato.

## Validazione focalizzata

```
1. D-9410-A queue diagnosis ...................... PASS (evidenza sopra)
2. countdown arithmetic .......................... PASS (S77)
3. zero → ATTESA TICK N8N senza tick reale ....... PASS (S77 + live)
4. tick reale riallinea countdown ................ PASS (S77 + live
   23:22:40→23:24:40 osservati)
5. phase mapping (solo campi reali) .............. PASS (S78 + live
   ATTESA/EXECUTOR/HUMAN GATE)
6. HUMAN_GATE reason visibility .................. PASS (S78 + live)
7. historical-vs-current receipt classification .. PASS (S79 + live 32/0/x/y)
8. WF90 live ACTIVE dopo schedule change ......... PASS (5 tick Δ120s)
Suite dispatcher: 75/75 PASS (S1–S81; nuove S76–S81).
Suite observability: 6/7 — 1 fallimento PRE-ESISTENTE a HEAD 77f147c
  (verificato stash clean checkout; NOT_OBSERVED vs STALE su freshness
  Cursor/quota; fuori scope questo task; non regredito).
```

```
DASHBOARD_COUNTDOWN=PASS
DASHBOARD_PHASE_RAIL=PASS
HUMAN_GATE_DETAIL_VISIBILITY=PASS
QUEUE_CURRENT_VS_HISTORY_CLASSIFICATION=PASS
```

## Natural Control Plane test (nessuna esecuzione manuale)

```
NO_MANUAL_D9410A_EXECUTION=YES
NEXT_NATURAL_TICK_OBSERVED=YES
D9410A_NATURAL_SELECTION=YES
D9410A_SELECTION_REASON=SELECTED
```

Dopo il deploy (commit/push/restart solo dispatcher): il tick naturale
WF90 delle ~00:52:41Z ha selezionato D-9410-A, superato repo-hygiene
(worktree clean), Qwen preflight (profilo `qwen38-opus-q3-opencode-64k`),
claim, admission, ed è entrato in EXECUTOR/OPENCODE reale
(~29 min, envelope timebox 3600s, max 24 turni). Esito terminale:
**STOP** (`execution_started=true, replayable=false` nel receipt) — l'executor
ha prodotto lavoro VPS-CPU reale non committato (parse `/proc/stat` →
`cpu_percent` in `tools/local-dev-resource-observatory-v1.mjs` + test, 2 file
tracked-dirty) e si è fermato dentro i bounds senza commit finale. Il
dispacher ora segnala correttamente HUMAN_GATE/TRACKED_DIRTY_CONFLICT per il
lascito dell'executor: handoff umano previsto dal modello operativo.

**Il VPS CPU feature NON è stato implementato manualmente in questo task**;
l'implementazione presente nel worktree è opera dell'executor naturale di
D-9410-A e attende revisione/commit umano (verifiche e merge restano
responsabilità dell'operatore).

## Runtime apply

```
COMMIT=7d71b11ae1f37a4d4b771b6fbd6bc448e6967029
REMOTE_HEAD_VERIFIED=YES
DISPATCHER_RESTART=ControlPlane-V4-LocalDevDispatcher (solo servizio dispatcher)
GET /dashboard=200 · GET /v1/status=200 · GET /v1/diagnostics=200 ·
GET /v1/resources=200 (schema ok)
```

## Nessun'altra superficie toccata

Nessuna modifica a: routing policy, produzione/autorizzazioni, Hermes route
control, quota authorities, profili Qwen, servizi VPS (oltre al solo
restart root-n8n-1 necessario all'attivazione del trigger, preceduto da
publish), n8n (oltre al solo interval WF90), #18 #35 #81. Nessun receipt
storico alterato. Nessun reboot PC.

## NEXT

Revisione/commit umano del lascito D-9410-A (2 file: implementazione
`cpu_percent` osservatorio + test) oppure STOP-and-discard secondo la
procedura operativa; successiva selezione naturale dal backlog.

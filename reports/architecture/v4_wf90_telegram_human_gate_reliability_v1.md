# V4_WF90_TELEGRAM_HUMAN_GATE_RELIABILITY_V1 — Report

**RESULT=PASS**
**BASE_HEAD:** `b4211eb27ec6c6e99e3207498f5028cdf6419e87`
**FINAL_HEAD:** (vedi COMMIT sotto)
**ISSUE_83:** chiuso COMPLETED con questo report/commit.

**Date (Europe/Rome):** 2026-09-16
**Executor:** Cursor / GLM 5.3
**Worktree remediation:** `../control-plane-wf90tg` (detached `b4211eb`) — primary checkout MAI toccato; i due file tracked-dirty del handoff D-9410-A sono rimasti protetti e intatti.

---

## ROOT_CAUSE

Difetto doppio, entrambi provati da evidenza live (execution_data, pool-reference resolved):

1. **HTTP timeout 900000ms < timebox executor 3600s.**
   Esecuzione **339784** (`2026-09-15 22:52:41Z`, durata esatta 900.2s, run D-9410-A
   ~29 min): `AxiosError: timeout of 900000ms exceeded` → il nodo HTTP non ha mai
   osservato il risultato terminale del dispatcher → normalizer → `SERVICE_ERROR`
   (`response_valid=false`) invece del reale WORK_EXECUTED_STOP/handoff.

2. **Nodo Telegram n8n FORZA `parse_mode='Markdown'` (legacy) quando non impostato**
   (`GenericFunctions.addAdditionalFields`: `if (!additionalFields.parse_mode)
   { additionalFields.parse_mode = 'Markdown'; }`). Il testo WF90 conteneva token
   con underscore non appaiati (`HUMAN_GATE_REQUIRED`, `TRACKED_DIRTY_CONFLICT`):
   Markdown legacy li interpreta come entità italic non chiuse → Telegram risponde
   **400 "can't parse entities: Can't find end of the entity starting at byte
   offset 50/131"** su OGNI tick gate dal 23:18Z del 15/09 → **l'operatore non ha
   mai ricevuto l'alert human gate** (e nessuno STOP/SERVICE_ERROR con underscore).
   I nodi Telegram WF40 funzionano solo perché i loro testi non contengono underscore.

## Forensics live (read-only, segreti mai esposti)

```
WF90_EXECUTION_ID=339784 (run D-9410-A; 22:52:41Z→23:07:41.242Z, 900.2s)
HTTP_NODE_STARTED=22:52:41Z  HTTP_NODE_FINISHED=23:07:41Z
HTTP_NODE_TIMEOUT_CONFIG_MS=900000 (prima)
HTTP_NODE_RESULT=TIMEOUT (AxiosError timeout of 900000ms exceeded)
HTTP_NODE_ERROR_CODE=ETIMEDOUT-class AxiosError (timeout)
DISPATCHER_TERMINAL_RESULT_OBSERVED_BY_WF90=NO
DISPATCHER_CLASSIFICATION_OBSERVED=SERVICE_ERROR (normalizzato, non il terminale reale)

Tick gate correnti (es. 340779 e tutti dalle 23:18Z del 15/09):
NORMALIZER_RAN=YES  NORMALIZER_CLASSIFICATION=HUMAN_GATE_REQUIRED
NORMALIZER_NOTIFY_REQUIRED=YES  IF_NOTIFY_BRANCH=TRUE
TELEGRAM_NODE_RAN=YES  TELEGRAM_NODE_STATUS=ERROR
TELEGRAM_NODE_ERROR=400 Bad Request: can't parse entities
  (byte 50: HUMAN_GATE_REQUIRED; byte 131: TRACKED_DIRTY_CONFLICT)
```

## Fix applicati (ONLY WF90; nulla altro toccato)

Live versioni: `dccaff58` → **`f1d06c55`** (fix parziale: timeout+text shape) →
**`369b2fdd`** (fix definitivo parse_mode). BACKUP pre-change su VPS:
`/tmp/wf90-pre-tgfix-backup.json`, `/tmp/wf90-pre-parsemode-backup.json`.

1. **HTTP timeout 900000 → 3900000 ms** (65 min: copre timebox canonico 3600s +
   margine trasporto/finalizzazione; mai unlimited). `onError=continueRegularOutput`
   e `alwaysOutputData` invariati.
2. **Telegram node repaired** alla shape provata WF40 + HTML esplicito:
   `resource=message, operation=sendMessage, text={{ $json.telegram_text }},
   additionalFields={appendAttribution:false, parse_mode:'HTML'}`.
   Rimossa la dead `jsonBody` HTTP-style dal nodo live. Credenziale
   `CONTROL PLANE - Telegram Bot` preservata (mai stampata, mai persistita nel repo).
3. **Normalizer** (`Code - Normalize LOCAL_DEV tick result`): costruisce
   `telegram_text` con header ASCII `CONTROL PLANE - HUMAN ACTION REQUIRED`,
   righe classification/task/phase/reason/executor/origin, valori dinamici
   HTML-escaped (`& < >`), nessuna invenzione di task_ref (NONE quando assente,
   SERVICE_ERROR incluso). Policy di notifica invariata:
   HUMAN_GATE_REQUIRED / WORK_EXECUTED_STOP / SERVICE_ERROR.
4. **Schedule invariata: 2 minuti** (`minutesInterval=2`). Nessun secondo
   scheduler/trigger. Overlap governato dal single-flight BUSY del dispatcher.

### Applicazione live

`export → mutate (solo i punti sopra) → import:workflow → publish:workflow`;
restart `root-n8n-1` SOLO dopo proof `SELECT COUNT(*) running = 0` (2 volte,
entrambe 0); healthz OK. Nessun reboot VPS. Nessuna modifica a WF40/WF61/D0025/
routing/Hermes/LiteLLM/Postgres schema/Tailscale/profili Qwen.

## PROVA END-TO-END REALE (nessun task sintetico, nessun replay D-9410-A)

Il genuine dirty handoff D-9410-A (2 file tracked-dirty) genera un reale
`HUMAN_GATE_REQUIRED` (409, `gate_summary="tracked dirty: 2 file(s)"`,
`reason_codes=["TRACKED_DIRTY_CONFLICT"]`) a ogni tick naturale.

```
Tick naturali POST-fix (execution_entity, node-by-node):
340844  2026-09-16 05:56:41Z  status=success
340849  2026-09-16 05:58:41Z  status=success
340854  2026-09-16 06:00:41Z  status=success   (3 consecutivi)

NORMALIZER_CLASSIFICATION=HUMAN_GATE_REQUIRED
NORMALIZER_NOTIFY_REQUIRED=YES
IF_NOTIFY_BRANCH=TRUE
TELEGRAM_NODE_RAN=YES
TELEGRAM_NODE_STATUS=SUCCESS    ← era ERROR 400 su ogni tick pre-fix
TELEGRAM_DELIVERY_PROVEN=YES    (3/3; testo: "CONTROL PLANE - HUMAN ACTION
  REQUIRED / classification: HUMAN_GATE_REQUIRED / task: NONE / phase:
  HUMAN_GATE / reason: TRACKED_DIRTY_CONFLICT / executor: NONE / origin: WF90")
```

Messaggio ricevuto dall'operatore sul chat Telegram CONTROL PLANE (3 volte).

## Test focalizzati

`tests/wf90-axios-409-normalizer/run.mjs` esteso: **25/25 PASS**
(normalizer telegram_text, HTML escape, ASCII header, node shape sendMessage+
parse_mode HTML, no dead jsonBody, timeout 3900000, schedule 2min, policy
notify invariata, igiene stdout/stderr). Nessun test broad. Nessun model
invocation. Nessun replay D-9410-A.

## Repo canon reconciliation

`workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json`:
- purpose: "every 5 minutes" → "every 2 minutes";
- Schedule Trigger `minutesInterval: 5 → 2`;
- HTTP timeout `900000 → 3900000`;
- Telegram node: shape HTML + note remediation (nessun segreto: chatId
  placeholder `LIVE_APPLY_IN_MEMORY_CLONE`, credential solo referenziata);
- Normalizer: builder `telegram_text` con esc() (identico al live).

## stato D-9410-A (protetto)

```
D9410A_HANDOFF_PRESERVED=YES   (2 file tracked-dirty intatti nel primary checkout)
D9410A_RECEIPT_UNCHANGED=YES   (receipts.json non toccato)
D9410A_REPLAYED=NO             (nessuna esecuzione manuale; solo tick naturali
                                che ora NOTIFICANO il gate, senza eseguire nulla)
```

## Metriche richieste

```
WF90_ACTIVE=YES (active=t, version 369b2fdd-9e94-4660-8f8d-bf48a185f6f3)
WF90_INTERVAL_SECONDS=120
HTTP_TIMEOUT_BEFORE_MS=900000
HTTP_TIMEOUT_AFTER_MS=3900000
SECRETS_EXPOSED=0
```

## COMMIT / PUSH

Commit solo remediation/report/canone dal worktree (branch temporaneo
`cursor/wf90-telegram-reliability-v1` → merge fast-forward in `main`);
i file protetti D-9410-A NON sono inclusi. Push e verifica `origin/main`.

## NEXT

1. L'operatore ora riceve l'alert per il handoff D-9410-A: revisione umana dei
   2 file lasciatigli (implementazione `cpu_percent` + test) → commit umano o
   STOP-and-discard (procedura operativa esistente).
2. I tick successivi torneranno a notificare solo per stati gate/STOP/SERVICE_ERROR.

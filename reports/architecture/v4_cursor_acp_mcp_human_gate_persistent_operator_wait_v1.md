# V4_CURSOR_ACP_MCP_HUMAN_GATE_PERSISTENT_OPERATOR_WAIT_V1

Data: 2026-09-13 · Base head: `76920a352adbeffe2dba8da0f4b9ee73f513f40a` · REAL_TELEGRAM_SENDS=0

## 1. Legge di lifetime introdotta (PART 2)

`HUMAN_WAIT != TOOL_CALL_TIMEOUT` — `NO_OPERATOR_RESPONSE != FAILURE` —
`ELAPSED_TIME_ALONE != OPERATOR_DECISION`.

In `tools/v4-cursor-acp-gate-core-v1.mjs`:

- Nuova costante `OPERATOR_WAIT_MODE = "operator_wait"`; ogni decisione ora
  registra `lifetime_mode`.
- **operator_wait (nuovo default, env `ACP_GATE_LIFETIME_MODE` overridabile):**
  `expires_at = null`, `ttl_ms = null`. Nessun timer 15m/1h governa il gate.
  I campi `ttl_ms`/`expires_at` diventano legacy NON-autoritativi su questo path.
- **bounded_ttl (legacy, esplicito):** comporta compatibile (1s–1h clamp,
  fence EXPIRED invariata) — le vecchie fixture/evidence restano valide.
- `admitGateCallback`: il fence `GATE_DECISION_EXPIRED` scatta SOLO per
  `lifetime_mode != "operator_wait"`. Una callback umana valida è ammissibile
  a +15m, +1h, +2h, +8h e oltre (provato con injected clock).
- `markNoAnswer`: vietato su operator_wait (`GATE_OPERATOR_WAIT_NO_AUTO_EXPIRY`)
  — nessuna trasformazione automatica in NO_ANSWER.
- **Nuove terminazioni ESPLICITE, persistite, auditabili (history):**
  `markCancelled` (CANCELLED, con `cancelled_by`/`cancelled_reason`) e
  `markSuperseded` (SUPERSEDED, con `superseded_by` = decision_id del gate
  nuovo). Mai generate dal tempo; supersessione solo tramite transizione
  canonica esplicita (nuova generazione + transizione registrata).

## 2. Server MCP (tools/v4-cursor-acp-mcp-human-gate-server-v1.mjs)

- `human_gate` → PENDING immediato (invariato, watchdog-safe) con
  `lifetime_mode` nel risultato.
- **Background waiter persistente:** loop di attesa re-armata — ogni attesa è
  una `waitAnswer` bounded (`ACP_GATE_OPERATOR_WAIT_REARM_MS`, default 10m,
  cap 1h; il long-polling avviene server-side Telegram). Nessun busy-loop
  (gap 1s tra re-arm). Il waiter termina SOLO per: ANSWERED (ammissione
  canonica → VERIFIED→RETURNED), CANCELLED/SUPERSEDED espliciti nello store,
  classe fatale transport (CONFLICT/AUTH — il gate resta PENDING persistito,
  fail-closed: mai auto-risposto, mai auto-scaduto). NESSUN wall-clock exit.
- `human_gate_status` → slice bounded invariata (default 8s, cap 20s ≪ 45s).
  Segnala terminali SOLO per eventi espliciti (CANCELLED/SUPERSEDED) o legacy
  bounded_ttl expiry. Il tempo da solo resta `PENDING`.

## 3. Crash / restart behavior

- Lo store canonico è persistente: se il processo MCP muore mentre il gate è
  PENDING, la decisione PENDING sopravvive (PW19).
- Al restart del server (stessa ACP session), la ripresa del waiter avviene al
  primo ri-armo; NON è richiesta session/load sul live path.
- Limite documentato: se NESSUN server MCP è vivo, nessuno fa polling — il
  gate resta PENDING nel persistent store (non scaduto); le callback tardive
  non sono perse perché Telegram conserva gli update (offset gestito dal
  transport al prossimo wait), ma l'ammissione avviene solo quando un waiter
  è attivo. Fail-closed, mai falsamente "actively polled".

## 4. PART 1 — CURRENT_FRONTIER UTF-8

- Causa: la stesura RETRY4 via PowerShell `Set-Content` ha prodotto
  double-encoding (mojibake: `â€”`, `Â·`, `â†’`, `â€¦`) + BOM.
- Il primo tentativo di fix via roundtrip ISO-8859-1 ha degradato ulteriormente
  (CP1252 bytes non mappabili) → **scartato**.
- Fix definitivo: ripristino del blob pristine dal parent `2dc213f` (git
  checkout) + ri-applicazione del SOLO delta semantico RETRY4 tramite Node
  (UTF-8 nativo, LF, no BOM).
- Verificato: **mojibake=0, replacement chars=0, BOM=no, 172 righe, unica riga
  differente dal parent = 23 (ACP MCP HUMAN GATE SLICE) con il delta RETRY4**,
  nessun altro contenuto alterato.

## 5. Test (REAL_TELEGRAM_SENDS=0)

| Suite | Esito |
|---|---|
| `tests/v4-cursor-acp-mcp-gate/persistent-operator-wait-fixture.mjs` (NUOVO, injected clock: 15m/1h/2h/8h) | **25/25 PASS** |
| MCP gate suite `run.mjs` (estesa: OPERATOR_WAIT_NO_AUTO_EXPIRY, silent-gate resta PENDING persistito, legacy fence) | **37/37 PASS** |
| Watchdog remediation fixture (W7 aggiornato alla nuova legge: silent ⇒ resta PENDING) | **13/13 PASS** |
| Final-proof guards | PASS |
| Prompt timeout/cleanup focused suite | 19/19 PASS |
| Soak callback law | 0 failures |
| Process leaks | 0 |

Copertura fixture PW1–PW20: no auto-expiry a 15m/1h/2h/8h; callback A/B/C a +2h
→ VERIFIED/RETURNED; consumo esatto post-attesa lunga; elapsed-alone mai
NO_ANSWER/EXPIRED; PENDING non-decisione; CANCELLED/SUPERSEDED espliciti,
persistiti, auditabili; callback su cancelled/superseded respinte; duplicate e
wrong-binding respinte post-attesa lunga; no default answer; single gate/send
fence intatto; status slice bounded; nessun busy polling (48 re-arm in 8h);
persistenza store across reload; compatibilità legacy fail-closed.

## 6. Invarianti

CONTROL_PLANE_GATE_SOLE_AUTHORITY=PASS · NO_DEFAULT_ANSWER=PASS ·
NO_SECOND_DECISION_AUTHORITY=PASS (CANCELLED/SUPERSEDED sono transizioni di
stato canoniche, non seconde autorità) · FAIL_CLOSED=PASS ·
SAME_SESSION_RULE preservata · PENDING_IS_NON_DECISION=PASS ·
LONG_BLOCKING_MCP_CALL_REMOVED=PASS (Pattern B invariato) ·
STATUS_POLL_WATCHDOG_SAFE=PASS · NO_COMPETING_GETUPDATES_CONSUMER=PASS ·
PRODUCTION_CHANGED=NO.

## 7. NEXT

Il requisito ≥2h è provato da evidence deterministica con injected clock +
architettura law; il RETRY4 resta semanticamente valido per il resto della
catena (binding, same-session, consumo, cleanup). NON è richiesto un nuovo
Telegram reale per la lifetime law; se l'operatore volesse comunque una prova
live del long-wait, il task sarebbe
`ONE_LONG_WAIT_REAL_TELEGRAM_E2E_AFTER_NEW_OPERATOR_DECISION` (non eseguito
automaticamente).

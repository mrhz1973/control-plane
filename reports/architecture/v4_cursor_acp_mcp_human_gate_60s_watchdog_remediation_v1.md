# V4_CURSOR_ACP_MCP_HUMAN_GATE_60S_WATCHDOG_REMEDIATION_V1

Data: 2026-09-13 · Base head: `1f4def31ac5bfab38ab7e045f3c74ad954a0f85d` · REAL_TELEGRAM_SENDS=0

## 1. Blocker (RETRY3 evidence)

`VENDOR_MCP_TOOL_CALL_WATCHDOG_APPROX_60S`: nel RETRY3 reale la tool call MCP
`human_gate` (blocking) è stata chiusa/erroata dal runtime Cursor Agent ACP a
~60.1s. Il modello ricevette il tool error, chiuse il turno con `GATE_FAILED`,
e quando la callback operator reale A fu ammessa (VERIFIED→RETURNED) il canale
tool-result era già terminato: consumo impossibile.

Causa confermata come watchdog vendor-side sull'interazione MCP tool call
singola; nessuna primitiva async/pending MCP documentata o osservabile sul
runtime corrente (qualificazione A/C: NON supportate → escluse).

## 2. Qualification delle primitive

| Primitive | Verdetto | Evidenza |
|---|---|---|
| A. ASYNC/PENDING TOOL CONTRACT (vendor) | NON supportata | nessuna primitiva MCP async documentata; il canale tool-result si chiude al return/watchdog (RETRY3) |
| B. PENDING + BOUNDED STATUS/POLL CONTRACT (project-owned) | **SUPPORTATA → SELEZIONATA** | dimostrata dal fixture deterministico 13/13 e dalla real ACP qualification PASS |
| C. SUPPORTED ASYNC MCP MECHANISM | NON assumibile | nessuna superficie documentabile; esclusa senza ipotesi |
| D. DRIVER-MEDIATED SAME-SESSION CONTINUATION | fallback ammesso, NON necessaria | B soddisfa tutte le invarianti con superficie minore (nessun secondo prompt) |

## 3. Pattern selezionato (B) — watchdog-safe contract

- `human_gate` (MCP): registra la decisione nel canonical gate store, esegue
  l'UNICO send Telegram (ACTIVE GATE) e ritorna **`status=PENDING`** subito
  (misurato ~3s reali, budget 45s). NESSUN wait umano dentro la tool call.
- Background waiter DENTRO il server MCP (unico consumer getUpdates — mai
  duplicato nel driver): esegue waitAnswer + ammissione canonica
  (VERIFIED→RETURNED) anche se il modello polla tardi o mai.
- `human_gate_status` (MCP, nuovo): poll read-only a slice brevi bounded
  (`ACP_GATE_STATUS_POLL_SLICE_MS`, default 8s, cap 20s ≪ watchdog). Non
  autorizza, non inventa, non crea gate, non invia. Ritorna `PENDING`, oppure
  l'opzione verificata SOLO da stato canonico VERIFIED/RETURNED, oppure
  `no_answer` (fail-closed TTL/expired). Binding fence:
  decision_id+task_ref+generation devono matchare.
- **PENDING non è una decisione**: nessun campo opzione su PENDING; solo uno
  stato canonico VERIFIED/RETURNED con selected_option diventa decision result.

## 4. Watchdog law

- Watchdog osservato: 60s. Budget sicuro: **45s** (non 59.9s).
- Ogni interazione MCP misurata: gate 3.0s (qualifica reale), status slice ≤8s.
- Il long human wait (70s reali in qualifica, qualunque in produzione fino a
  TTL) avviene FUORI da ogni singola tool invocation.

## 5. Qualification reale ACP (harmless, zero Telegram)

`tools/v4-cursor-acp-mcp-gate-watchdog-qualification-v1.mjs` +
`tools/v4-cursor-acp-gate-transport-null-v1.mjs` (transport nullo; ammissione
sintetica SOLO tramite gate-core law).

Sessione ACP reale, stessa identità per tutto il ciclo:

```
RESULT: PASS · RUN_ID 2075a16fb6e7407b · session_sha 2173bc362554
GATE_TOOL_DURATION_MS: 3010 (< SAFE_BUDGET_MS 45000)
SYNTHETIC_HUMAN_DELAY_MS: 70000 (reale, NO tool call pendente)
CANONICAL_STATE: RETURNED · CANONICAL_OPTION: B (exact consumption)
SAME_SESSION_IDENTITY: PASS · SESSION_NEW_AFTER_GATE_START: 0
SESSION_LOAD_ON_LIVE_PATH: NO · REAL_TELEGRAM_SENDS: 0
Evidenza: reports/runtime/cursor-acp/watchdog-remediation-acp-qualification.json
```

## 6. Test deterministici (REAL_TELEGRAM_SENDS=0)

- Suite adapter `tests/v4-cursor-acp-mcp-gate/run.mjs`: **35/35 PASS**
  (inclusi ADAPTER_PENDING_NON_DECISION, exact A/B/C via status poll,
  no_answer fail-closed, fences, schema del nuovo tool, wiring ACP reale).
- Fixture watchdog `tests/v4-cursor-acp-mcp-gate/watchdog-remediation-fixture.mjs`:
  **13/13 PASS** (W1 PENDING veloce; W2 poll sotto budget; W3 delay umano
  senza tool call pendente; W5 recupero canonico post-delay; W6 opzioni esatte
  A/B/C; W7 no default answer; W8 fences status poll + PENDING non-decisione;
  W9 single gate/send invariant).
- Soak callback law: 0 failures. Final-proof guards: PASS.
- Process leaks: 0. Regressione pre-esistente riparata (project-owned):
  `v4-cursor-acp-session-wiring-probe-v1.mjs` non usciva su Windows
  (albero processi wrapper sopravvive a kill(); ora taskkill /T /F + exit esplicito).

## 7. Invarianti

CONTROL_PLANE_GATE_SOLE_AUTHORITY=PASS · SAME_SESSION_RULE=EXACT_SESSION_IDENTITY ·
SESSION_LOAD=LOGICAL_RECOVERY_ONLY · NO_DEFAULT_ANSWER=PASS ·
NO_SECOND_DECISION_AUTHORITY=PASS (null transport non è autorità: legge
solo lo store annotato dall'ammissione gate-core) · FAIL_CLOSED=PASS ·
SINGLE_GATE_INVARIANT=PASS · SINGLE_SEND_INVARIANT=PASS · Telegram resta solo transport.

## 8. READY_FOR_FINAL_REAL_E2E

**true** — il blocker watchdog è eliminato sul path qualificato. Il prossimo
step (fuori da questo task) è il ri-proof Telegram reale ONE_FINAL_REAL_TELEGRAM_E2E
dopo una nuova decisione operator: il driver E2E esistente resta valido; il
modello consumerà via human_gate_status (contratto PENDING), quindi il prompt
E2E andrà aggiornato alle nuove istruzioni due-step al momento del retry.

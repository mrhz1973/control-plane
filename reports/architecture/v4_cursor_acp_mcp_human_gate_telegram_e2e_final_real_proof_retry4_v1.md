# V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1 — FINAL REAL PROOF RETRY4 (PASS)

Data: 2026-09-13 12:12–12:15Z · Base head: `2dc213ffa6876f0119706074664c7992c4d727fc`
Preceduto da: `V4_CURSOR_ACP_MCP_HUMAN_GATE_60S_WATCHDOG_REMEDIATION_V1` (PASS, `2dc213f`)

## 1. Contratto eseguito

Watchdog-safe **Pattern B two-step** (NESSUN blocking human_gate):

```
human_gate → PENDING (tool call ~0.3s, mai vicino al watchdog ~60s)
→ il modello dichiara WAITING_FOR_OPERATOR e attende SENZA tool call
→ l'operatore preme UNA volta il bottone Telegram (callback reale)
→ background waiter nel server MCP ammette: VERIFIED→RETURNED
→ human_gate_status (1 chiamata, <1s) recupera l'opzione canonica
→ consumo esatto opzione A + marker GATE_CONSUMPTION_JSON nella STESSA sessione
```

Il driver è stato aggiornato al nuovo contratto (prompt two-step con legge
esplicita: PENDING = WAITING_FOR_OPERATOR, mai mappato ad A/B/C; polling SOLO
via human_gate_status; nessun secondo gate/send) prima del proof.

## 2. Evidenza reale (sanitizzata)

| Claim | Valore |
|---|---|
| RESULT | **PASS** |
| RUN_ID / DECISION_ID | `b00978c05fae4813` / `ACP-GATE-5491671d78b7` |
| SESSION_ID_SHA | `e224dd9722a4` (invariante per tutto il ciclo) |
| REAL_TELEGRAM_SENDS | **1** (🟢 ACTIVE GATE unico) |
| ACTIVE_GATE_MESSAGES | **1** |
| HUMAN_GATE_CREATIONS | **1** (fence FINAL_PROOF_SCOPE) |
| STATUS_POLL_CALLS | 1 |
| MAX_TOOL_CALL_DURATION_MS | **~300ms** (gate) / <1s (status) vs budget sicuro 45s |
| Human wait dentro tool call | **NO** (12:12:54 PENDING → callback 12:13:46 → status 12:14:58) |
| REAL_OPERATOR_CALLBACK | PASS — un tap reale, opzione **A**, ammesso al primo colpo |
| Gate lifecycle | REGISTERED→NOTIFIED→**VERIFIED→RETURNED** (store persistito) |
| PENDING_CONSUMED_AS_DECISION | NO |
| STATUS_RECOVERY / STATUS_RETURNED_CANONICAL_OPTION | PASS / PASS |
| EXACT_GATE_BINDING (task/run/session/generation/TTL/decision/update-id) | PASS |
| EXACT_OPERATOR_OPTION_CONSUMPTION | PASS — `GATE_CONSUMPTION_JSON:{"operator_decision_consumed":"A","continued_in_same_session":true}` + APPROVE_AND_CONTINUE |
| ACP_SESSION_IDENTITY_PRESERVED / SAME_SESSION_LIVE | PASS |
| SESSION_NEW_AFTER_GATE_START | 0 |
| SESSION_LOAD_ON_LIVE_PATH | NO |
| POST_GATE_CONTINUATION | PASS (stop_reason end_turn) |
| NO_DEFAULT_ANSWER | PASS |
| Fences negative live (post-callback, no send extra) | DUPLICATE, WRONG_TASK/UNKNOWN, WRONG_SESSION, WRONG_GENERATION, INVALID_OPTION — tutte respinte |
| TERMINAL_KEYBOARD_DEACTIVATION | PASS (deactivated=true) |
| ACTIVE_KEYBOARD_REGISTRY_CLEAN | PASS (active=null) |
| ISSUANCE quiesce/restore | QUIESCE verified → RESTORE verified (pid 50352) |
| PROCESS_LEAKS | 0 |
| PRODUCTION_CHANGED | NO |

## 3. Confronto col RETRY3 (blocker risolto)

- RETRY3: tool call blocking → vendor watchdog ~60.1s → tool error → modello
  `GATE_FAILED` → callback arrivata dopo → canale tool-result chiuso → consumo impossibile.
- RETRY4: NESSUN wait umano in tool call; l'attesa reale dell'operatore (~90s)
  è avvenuta interamente FUORI da ogni interazione MCP; il risultato canonico
  è stato recuperato da `human_gate_status` e consumato esattamente.

## 4. File

- `reports/runtime/cursor-acp/telegram-e2e-retry4-result.json` (claim canonicali)
- `reports/runtime/cursor-acp/telegram-e2e-retry4-trace.json` (traccia driver completa)
- `reports/runtime/cursor-acp/telegram-e2e-retry4-gate-store.json` (stato canonico del gate)
- `reports/runtime/cursor-acp/telegram-e2e-retry4-tg-observe.log` (osservabilità transport, sanitizzata)

## 5. Stato

`V4_CURSOR_ACP_MCP_HUMAN_GATE_TELEGRAM_E2E_V1=PASS (FINAL REAL PROOF RETRY4)` —
la catena umana bounded end-to-end è provata sul runtime reale con il nuovo
contratto watchdog-safe. Nessun ulteriore retry dovuto.

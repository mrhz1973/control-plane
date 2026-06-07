# Session — D-0025-L live mapping preview runtime PASS

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-07  
**Type:** Runtime user-attested. **No runtime by Cursor.**

---

## 1. Context

- **D-0021** transport/auth **PASS**.
- **D-0022-W** n8n classifier wiring **PASS ATTESTATO UTENTE**.
- **D-0023-N** mapping contract **PASS** (docs-only).
- **D-0024-M** fixture-only mapping preview **PASS ATTESTATO UTENTE**.
- **D-0025-L** template previously committed (`56 - D-0025-L Live classifier mapping preview TEST SAFE`); runtime was pending manual import/run.

## 2. Runtime action

- User manually imported and ran workflow **56** once in n8n (2026-06-07).
- Live classifier → Decision Packet mapping preview test.
- Output node: **Inspect preview output**.
- Single manual run; workflow inactive/test-safe.
- Live classifier called via sole HTTP Request node (configured in n8n UI only).
- No Telegram node/credential/send.
- No webhook.
- No schedule.
- No Funnel.
- No workflow **40/41/42** mutation.
- No workflow **49**.
- No **PM-34** unlock.
- **No permanent automation declared.**

## 3. Evidence — Inspect preview output

- `preview_status`: `PACKET_PREVIEW`
- `packet_present`: `true`
- `fail_closed_synthesized`: `false`
- Live classifier produced valid 5-field output (not synthesized fallback).

**effective_classifier:**

| Field | Value |
|-------|-------|
| `risk` | `high` |
| `route` | `human_gate` |
| `confidence` | `high` |
| `requires_human` | `true` |
| `reason` | `guard:secrets_touched` |

**Note:** `risk=high` derives from the keyword-guard on `"secrets"` in the test event summary — expected and safe for a secrets-adjacent test event.

**checks (all true):**

- `route_in_allowed_set`
- `no_send_performed`
- `no_secret_placeholders_only`
- `live_classifier_called_by_http_node_expected`
- `no_telegram_node_expected`
- `no_webhook_expected`
- `no_schedule_expected`
- `manual_only`
- `no_permanent_automation`

## 4. Redaction

- No token values, credential ids/content, auth URLs, webhook URLs, provider API keys, OAuth material, real chat_id, real tailnet host/IP, raw env dumps, or chain-of-thought recorded in Git.

## 5. Conclusion

**D-0025-L live classifier mapping preview runtime = PASS ATTESTATO UTENTE.**

- **D-0025-L closed.**
- **PM-34** remains **BLOCKED**.
- **`n8n_ready=false`** unchanged.
- **Next gate:** separate Decision Packet step **not yet decided**.
- **Linea rossa:** pezzi collegati ≠ loop avviato. This is **not** permanent automation.

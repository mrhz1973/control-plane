# Wb-live runbook — manual n8n → classifier-server via Tailscale

**Repository:** `mrhz1973/control-plane`
**Document:** `docs/workflow-wb-live-classifier-server.md`
**Status:** Manual runbook — **package preparation only**. This document does not execute anything.

---

## 1. Scope

Wb-live physical execution is a **manual single execution** from n8n to the classifier-server
over **Tailscale**. The user performs it physically later; this package only prepares the
artifacts to verify and run.

**Boundary:** the package itself does not execute, import, start a server, call Ollama, or
send Telegram. The **user executes later**.

---

## 2. Preconditions

| Precondition | State required |
|--------------|----------------|
| Step Wa classifier HTTP server v1 offline | **PASS** |
| `DECISION_PACKET_FORMAT.md` (Wb-docs) | **PASS** |
| classifier server available locally on Ryzen | Available (`tools/classifier-server-v1.mjs`) |
| Tailscale path Ryzen ↔ VPS/n8n | Available |

---

## 3. Local server start (Ryzen only)

- Use `tools/classifier-server-v1.mjs` on the **Ryzen workstation only**.
- Bind to **loopback** or the **Ryzen Tailscale IP**. **Never** bind to public `0.0.0.0`.
  - `CLASSIFIER_BIND_ADDR` = `127.0.0.1` for a local-only test, **or** the **`RYZEN_TAILSCALE_IP`** for n8n access via Tailscale.
  - `CLASSIFIER_PORT` default `8765`.
  - `CLASSIFIER_AUTH_TOKEN` optional; if used, configure the matching `X-Classifier-Token` value **only in the n8n UI**, never in Git.
- Tailscale ACLs are the access control; do not expose the server to a public IP.

> This runbook does not start the server. The user starts it manually on Ryzen when ready.

---

## 4. n8n import guidance

1. Import `workflows/wb-live-classifier-server-manual.template.json` **manually** in the n8n UI.
2. Keep the workflow **inactive** (template ships `active: false`).
3. Configure **`CLASSIFIER_SERVER_URL`** in the n8n UI only (replace the `**CLASSIFIER_SERVER_URL**` placeholder in the HTTP Request node). Use the Tailscale URL form, e.g. `http://RYZEN_TAILSCALE_IP:8765`.
4. Configure the optional token (`**CLASSIFIER_AUTH_TOKEN_OPTIONAL**` → `X-Classifier-Token`) in the n8n UI only, if `CLASSIFIER_AUTH_TOKEN` is set on the server.
5. Run **Manual Trigger once**. Do not activate. Do not schedule.

The template POSTs the sanitized test event to **`CLASSIFIER_SERVER_URL`/classify**.

---

## 5. Expected response

HTTP `200` with a JSON body containing **exactly** the classifier output fields:

- `risk`
- `route`
- `reason`
- `confidence`
- `requires_human`

For the docs-only test event, expect `risk: low`, `route: auto_allowed`, `requires_human: false`.

---

## 6. PASS criteria

- HTTP `200`.
- Schema-valid 5-field output.
- No fallback error.
- No secret / token / `chat_id` / credential / webhook / API key / chain-of-thought in output.
- Workflow remains **inactive** after the manual run.
- No Telegram send.
- No Data Table mutation.
- No workflow 40 / 41 mutation.
- No PM-34 unlock.

## 7. BLOCKED criteria

- Server unreachable.
- Auth failure.
- Non-200 response.
- Invalid JSON.
- `fallback:model_error` / `fallback:invalid_json` / `fallback:missing_keys` / schema invalid.
- Any secret or token leakage.
- Workflow becomes active unexpectedly.

---

## 8. Evidence to copy after physical execution

- n8n execution status.
- HTTP status.
- Sanitized response body (5-field classifier output, redacted of anything sensitive).
- Workflow active/inactive state.
- Confirmation: no Telegram send.
- Confirmation: no workflow 40 / 41 mutation.
- Confirmation: no PM-34 unlock.

---

## 9. Next step after execution

Use **`docs/runtime/WB_LIVE_REGISTRATION_PROMPT.md`** to record **PASS** or **BLOCKED**
based on the sanitized evidence collected above.

---

## 10. Stable transport — Tailscale Serve + token + ACL (D-0021, 2026-06-04)

**Status:** **PASS ATTESTATO UTENTE** (runtime user-attested). Session: [2026-06-04-control-plane-classifier-tailscale-serve-auth-acl-pass.md](sessions/2026-06-04-control-plane-classifier-tailscale-serve-auth-acl-pass.md).

The **Gate 3 temporary** path (reverse SSH tunnel Ryzen → VPS + Python bridge `172.18.0.1:8765`) is **superseded** for classifier transport by:

- **Tailscale Serve** tailnet-only → `https://asusdesktop.tailc01234.ts.net/` → proxy `http://127.0.0.1:8765`
- **`CLASSIFIER_AUTH_TOKEN`** on Ryzen (Windows User env); **`X-Classifier-Token`** required for `/classify` when token is set
- **Tailscale ACL**: VPS `100.114.7.53/32` → Ryzen `100.110.35.23/32` `tcp:443` only
- **No Funnel**; no token in Git

**n8n workflow wiring** (URL + header in HTTP Request node) remains a **future gate** — not done in D-0021. Configure token **only in n8n UI**, never in Git.

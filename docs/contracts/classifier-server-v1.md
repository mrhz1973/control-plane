# Classifier HTTP server — contract v1 (Step Wa, OFFLINE)

**Repository:** `mrhz1973/control-plane`
**Document:** `docs/contracts/classifier-server-v1.md`
**Runtime:** `tools/classifier-server-v1.mjs`
**Tests:** `tests/classifier-server/run-offline-tests.mjs`
**Status:** Step Wa — built and tested **OFFLINE only**. Not exposed live. No n8n wiring. No Telegram.

---

## 1. Purpose

A **thin HTTP server** around the already-tested `classifier-wrapper-v1`. It imports and
reuses `classifyEvent` / `validateInput` from `tools/classifier-wrapper-v1.mjs` — it does
**not** duplicate classification logic.

- Node built-ins only (`node:http`). No express. No external dependency.
- The server adds transport only; risk/route decisions stay in the wrapper.
- No chain-of-thought is requested, logged, stored, summarized, or persisted.

---

## 2. Endpoints

### `GET /healthz`

- Returns `200` with JSON `{"status":"ok"}`.
- **Never** calls the model. Exempt from auth.

### `POST /classify`

- Body: a JSON event (same event-shaped wrapper contract).
- Parses JSON → `classifyRequest(body)` → `200` with the 5-field classifier output on success.
- Malformed JSON → `400 {"error": "..."}`.
- Invalid input (missing required fields) → `400 {"error": "..."}`.

### Method / path errors

- Wrong method on a known route (e.g. `GET /classify`) → `405`.
- Unknown path → `404`.

---

## 3. `/classify` input schema

Same **event-shaped wrapper contract** (see `docs/contracts/classifier-wrapper-v1.md` §2).
Required fields: `event_id`, `event_type`, `summary`, `touched_paths` (array),
`runtime_flags`, `secrets_flags`, `deploy_flags`, `n8n_flags`, `automation_flags`.

## 4. `/classify` output schema

Same **5-field classifier output**:

| Field | Type | Allowed values |
|-------|------|----------------|
| `risk` | string | `low` \| `medium` \| `high` |
| `route` | string | `auto_allowed` \| `human_gate` \| `blocked` |
| `reason` | string | brief justification (no secrets) |
| `confidence` | string | `low` \| `medium` \| `high` |
| `requires_human` | boolean | human decision required before proceed |

---

## 5. Bind rule (safety)

- Default `CLASSIFIER_BIND_ADDR` = `127.0.0.1` (loopback).
- The server **never** defaults to `0.0.0.0`.
- For n8n via Tailscale: set `CLASSIFIER_BIND_ADDR` to the **Ryzen Tailscale IP**, never a
  public IP. Rely on **Tailscale ACLs** for access control.
- `CLASSIFIER_PORT` default = `8765`.

The default bind address constant is exported so offline tests can assert it without
starting a listener.

---

## 6. Optional auth

- If `CLASSIFIER_AUTH_TOKEN` is set, the server requires header `X-Classifier-Token` equal
  to it. If absent, no auth is required.
- The token value is **never committed**, never printed, and never included in docs/tests.

---

## 7. Ollama handling

- The server does **not** manage `baseUrl`/`model`. `classifyEvent` uses its own
  defaults/env: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`.
- Default wrapper transport stays loopback `127.0.0.1:11434`. `ollama run` is never used.

---

## 8. Scope & boundaries (Step Wa)

- **OFFLINE only.** No live server is started; tests use pure `classifyRequest` /
  `routeRequest` imports and never listen on a TCP port or call Ollama.
- No secrets / token / `chat_id` in Git.
- No chain-of-thought requested or persisted.
- **No n8n wiring yet.** No Telegram send. No Decision Packet. No PM-34 unlock.

Next gate — **Wb:** live n8n → classifier-server manual single execution via Tailscale +
`DECISION_PACKET_FORMAT.md`.

# opencode-single-generation-guard-v1

Loopback-only HTTP **generation firewall** between OpenCode and the canonical
local llama.cpp OpenAI-compatible endpoint.

**Hard ceiling owner:** this guard — **not** OpenCode `steps`.

```text
OpenCode  →  127.0.0.1:<guard_port>  →  127.0.0.1:8080 (llama.cpp)
```

## Invariant

```text
upstream_generation_requests <= 1
```

Budget is consumed **before** asynchronous upstream forwarding and is **never
refunded** (failure / timeout / disconnect / non-2xx still consume the slot).

## Network

| Rule | Value |
|---|---|
| Bind host | **`127.0.0.1` only** |
| Upstream | loopback **HTTP** only (canonical `http://127.0.0.1:8080`) |
| Non-loopback bind/upstream | **fail closed** |

No system firewall/network mutation.

## Allowed paths

| Method | Path | Budget |
|---|---|---|
| `GET` | `/v1/models` | **free** (informational; may repeat) |
| `POST` | `/v1/chat/completions` | **consumes 1** on first accept; later blocked |

## Rejected (never forwarded)

- `POST /v1/responses`
- `POST /api/generate`
- any other unrecognized `POST` / method+path
- requests bearing `Authorization` / API-key style headers (values never logged)

## Streaming

First `/v1/chat/completions` is a transparent pass-through (JSON or
chunked/SSE). The guard counts the **request**, not output chunks.

## Accounting (structural only)

```text
schema_version
guard_state
bind_host
listen_port
upstream_origin
generation_budget
generation_requests_seen
upstream_generation_requests
blocked_generation_requests
informational_requests_forwarded
rejected_requests
first_generation_started
first_generation_terminal
secret_bearing_requests_rejected
```

No request/prompt/response bodies in accounting or logs.

## Programmatic API

`startSingleGenerationGuard(options)` → `{ base_url, getAccounting(), close() }`

## CLI

```text
node tools/opencode-single-generation-guard-v1.mjs \
  --upstream http://127.0.0.1:8080 \
  --port 0
```

Emits one machine-readable `READY` record with `base_url` (no secrets), then
stays alive until the owning harness terminates it.

Does **not** launch OpenCode or Qwen.

## Tool / schema

- Tool: `tools/opencode-single-generation-guard-v1.mjs`
- Schema: `docs/contracts/opencode-single-generation-guard-v1.schema.json`

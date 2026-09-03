# qwen-execution-scope-v2

Canonical operator runtime-authorization **scope** for Control Plane local
OpenCode + Qwen execution after the six-profile MultiModel router integration.

## Fixed scope (key order is part of the digest)

```json
{
  "scope_version": "qwen-execution-scope-v2",
  "execution_harness": "opencode",
  "model": "qwen_local",
  "profile_id": "qwen38-dcfr-iq3-agent-24k",
  "role": "FAST_AGENT",
  "canonical_endpoint": "http://127.0.0.1:8080",
  "single_generation_guard_required": true,
  "max_opencode_executions": 1,
  "max_qwen_generation_calls": 1,
  "retry": 0,
  "fallback": 0
}
```

`scope_digest` = SHA-256 hex (lowercase) of that exact compact JSON string:

`5261290cbdda414de0a6bd5ffd79e939f805eefde3fe2e39a8f490c5a2e02261`

## Forbidden in scope v2

- `dflash_required`
- legacy `qwen_profile` / `fast_8k`
- reconstructed llama-server command bindings
- silent FAST_AGENT → DCFR 16K fallback

## Register-pending unchanged

HTTP register-pending body remains exactly eight keys:

`schema_version`, `pending_decision_id`, `authorization_id`, `task_id`,
`execution_id`, `route_id`, `scope_digest`, `pending_ttl_seconds`

`route_id` remains `opencode+qwen_local`.

## Tool

`tools/qwen-execution-scope-v2.mjs`

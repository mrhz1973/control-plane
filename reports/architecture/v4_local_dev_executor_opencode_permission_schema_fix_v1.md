# V4 LOCAL_DEV_EXECUTOR — OpenCode V1 permission schema fix

**BLOCK-ID:** `V4_LOCAL_DEV_EXECUTOR_OPENCODE_PERMISSION_SCHEMA_FIX_V1`
**Classification:** `OPENCODE_PERMISSION_SCHEMA_FIXED`
**Dispatch base head:** `79c97ca2151b338f8bc535d10235a3f4d854ef41`
**Date:** 2026-09-04

## Live blocker

Retry3 stopped before generation because OpenCode V1 rejected the generated
config:

```text
Expected PermissionActionConfig, got "localhost_only"
permission._network_policy
```

Root cause was the undocumented informational `_network_policy` key inside
the OpenCode V1 `permission` object. V1 validates every permission key.

## Fix

Removed `_network_policy` from `buildPermissionOverlay`. The envelope
`network_policy` remains executor metadata and is not serialized into the
OpenCode config.

Technical enforcement is unchanged:

- `webfetch: "deny"`
- `websearch: "deny"`
- deny-all-first bash allowlist
- deny-all-first edit scope with allowed path exceptions
- model traffic only via the DEV guard on `127.0.0.1`
- direct `:8080` target remains forbidden
- no-shell Windows binary launch, one process, hard timeout, diagnostics

## Exact config validation

The wiring test now constructs the exact live config from:

```text
buildPermissionOverlay(...)
→ buildOpenCodeRuntimeConfig(...)
```

for BOTH `network_policy=localhost_only` and `network_policy=offline`, with
no field deletion or test-only mutation, then passes each through the
installed OpenCode V1 `debug config` schema path. It proves:

- `_network_policy` absent under `permission`
- CLI accepts both exact configs
- webfetch/websearch denied
- bash wildcard denied and allowlisted command allowed
- edit wildcard denied and allowed path retained
- provider overlay retained
- no model execution, Qwen generation, or service lifecycle

## Tests

- Wiring/permission suite: **32/32 PASS**
- Executor regression: **20/20 PASS**
- Workstation bridge regression: **14/14 PASS**

No live proof was executed.

## NEXT

`V4_LOCAL_DEV_EXECUTOR_QWEN_FIRST_BOUNDED_LIVE_PROOF_RETRY4`

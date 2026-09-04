# opencode-execution-dispatch-v1

Bounded machine-readable boundary converting a **ROUTED** V4 execution route
(`opencode` + `qwen_local`) plus an unchanged `execution-packet-v1` into an
OpenCode dispatch specification.

**This pass:** `DISPATCH_READY` only — `execution_performed` is always `false`.

## Request (`opencode-execution-dispatch-v1`)

| Field | Required | Notes |
|---|---|---|
| `schema_version` | yes | `opencode-execution-dispatch-v1` |
| `dispatch_id` | yes | Stable correlation id |
| `execution_route_result` | yes | `execution-route-result-v1` |
| `execution_packet` | yes | Unchanged packet object |
| `repository` | yes | Absolute or normalized repo path for `--dir` |
| `branch` | yes | Target branch label |

## Route acceptance (fail-closed)

Accept **only**:

- `execution_route_result.status == ROUTED`
- `execution_route.implementer == opencode`
- `execution_route.model == qwen_local`

Otherwise: `ROUTE_NOT_OPENCODE_QWEN_LOCAL` (or `INVALID_INPUT` for `NO_ROUTE`).

## Result (`opencode-execution-dispatch-result-v1`)

| Field | Notes |
|---|---|
| `classification` | See vocabulary |
| `dispatch_ready` | `true` only for `DISPATCH_READY` |
| `execution_performed` | **always `false` in v1** |
| `dispatch_spec` | Present when `DISPATCH_READY` |

### Classifications

| Value | Meaning |
|---|---|
| `DISPATCH_READY` | Spec built; no execution |
| `INVALID_INPUT` | Request/route shape invalid |
| `ROUTE_NOT_OPENCODE_QWEN_LOCAL` | Route not opencode+qwen_local |
| `OPENCODE_UNAVAILABLE` | CLI probe failed |
| `QWEN_LOCAL_UNAVAILABLE` | Session manager not READY |
| `PACKET_INVALID` | Packet failed schema validation |
| `DISPATCH_BUILD_FAILED` | Spec construction failed |
| `PROFILE_ROLE_UNQUALIFIED` | Dispatch profile's live-execution role is not qualified; `DISPATCH_READY` is not asserted |

## OpenCode CLI (opencode-ai npm)

Noninteractive dispatch uses installed syntax:

```text
opencode run --dir <repository> -m qwen_local/<llama_cpp_model_id> --format json --auto <message>
```

Provider overlay (project config) binds `qwen_local` to the existing local
OpenAI-compatible MultiModel router (`127.0.0.1:8080`, next WF40 executor
`qwen38-opus-q3-agent-24k` / FAST_AGENT via scope v3). No API key for local
unauthenticated endpoint. No `dflash_required`.

## Tool

`tools/dispatch-opencode-execution-v1.mjs`

Machine schema: `docs/contracts/opencode-execution-dispatch-v1.schema.json`

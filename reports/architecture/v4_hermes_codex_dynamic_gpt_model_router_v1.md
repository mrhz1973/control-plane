# V4 Hermes Codex dynamic GPT model router V1

**TASK_REF:** `V4_HERMES_CODEX_DYNAMIC_GPT_MODEL_ROUTER_V1`
**Classification:** `PASS — HERMES_CODEX_DYNAMIC_GPT_MODEL_ROUTER=QUALIFIED · PHASE_D=OPEN`
**Date (UTC):** 2026-09-10
**BASE_HEAD:** `55ff01b7b37eee4a8d1d48ff67a6bcc55d6706c6`

## Scope

This bounded qualification adds a repo-owned dynamic model router on the
already-qualified Hermes -> `openai-codex` -> Codex app-server subscription
lane. It changes no production routing and does not close Phase D. The router
uses official JSON-RPC `model/list`, `thread/start.model`, and
`turn/start.model/effort` fields. Codex app-server remains the runtime
authority; Codex was not patched.

## Live evidence

```text
CATALOG_AUTHORITY=AUTHENTICATED_CODEX_APP_SERVER_MODEL_LIST
CATALOG_SOURCE=codex_app_server:model/list
CATALOG_DYNAMIC=YES
LOCAL_CODEX_VERSION=0.133.0
LOCAL_HERMES_VERSION=0.21.0
LOCAL_CATALOG_MODEL_COUNT=5
LOCAL_CATALOG_MODELS=gpt-5.5,gpt-5.4,gpt-5.4-mini,gpt-5.3-codex,gpt-5.2
LOCAL_CATALOG_REASONING_EFFORTS=low,medium,high,xhigh
LOCAL_SELECTION_VALIDATED=5/5_THREAD_START_EXACT
LOCAL_RUNTIME_MARKER=gpt-5.5:PASS:CODEX_MODEL_ROUTE_gpt_5_5_OK
LOCAL_ADVERTISED_NOT_SELECTABLE=gpt-5.4,gpt-5.4-mini,gpt-5.3-codex,gpt-5.2:subscription_runtime_400
LOCAL_MULTI_MODEL_PROOF=NOT_POSSIBLE_CATALOG_SINGLETON_AFTER_ACCOUNT_FILTER
VPS_CODEX_VERSION=0.133.0
VPS_HERMES_VERSION=0.21.0
VPS_CATALOG_MODEL_COUNT=5
VPS_CATALOG_MODELS=gpt-5.5,gpt-5.4,gpt-5.4-mini,gpt-5.3-codex,gpt-5.2
VPS_CATALOG_COMPARISON=COMMON:gpt-5.5,gpt-5.4,gpt-5.4-mini,gpt-5.3-codex,gpt-5.2
VPS_SELECTION_VALIDATED=5/5_MODEL_LIST_AND_THREAD_START_PROTOCOL
VPS_RUNTIME_MARKER=gpt-5.5:PASS:CODEX_MODEL_ROUTE_gpt_5_5_OK
VPS_ADVERTISED_NOT_SELECTABLE=gpt-5.4:subscription_runtime_400
VPS_MULTI_MODEL_PROOF=NOT_POSSIBLE_CATALOG_SINGLETON_AFTER_ACCOUNT_FILTER
VPS_DYNAMIC_MODEL_ROUTER=PASS
```

`gpt-5.4` was also independently attempted as a harmless text-only marker
on both subscription environments and was rejected by the service as not
supported for a ChatGPT account. This is recorded as
`ADVERTISED_NOT_SELECTABLE`; no closest/default/fallback model was used.
The dynamic catalog still accepts future IDs after refresh, while a removed
or stale ID fails closed.

## Router contract

The adapter exposes `LIST_MODELS`, `GET_MODEL`, `SET_MODEL`,
`LIST_REASONING_EFFORTS`, and `SET_REASONING_EFFORT` through
`tools/hermes-codex-dynamic-model-router-v1.mjs`. Explicit selection requires
an exact live ID and exact effective `thread/start` model. Unsupported effort
returns `REASONING_EFFORT_NOT_SUPPORTED`; an unavailable catalog returns
`CATALOG_UNAVAILABLE`; selection or execution mismatch is terminal. Native
Codex default is preserved when no model is requested and is recorded as
`MODEL_SELECTION_MODE=NATIVE_DEFAULT`.

The receipt contract records catalog source/freshness, requested/effective
model, exactness, effort, subscription auth state, and the fixed safety
values `fallback_used=false`, `openai_api_used=false`, and `byok_used=false`.
`SET_MODEL` retires only the current qualification thread through its caller
hook; it does not kill Cursor or global Codex processes. No credentials,
tokens, cookies, raw model output, or chain-of-thought are persisted.

## Security and regression result

```text
EXACT_MODEL_SELECTION=QUALIFIED
REASONING_EFFORT_ROUTING=QUALIFIED_EXACT_OR_NOT_SUPPORTED
DEFAULT_MODEL_SEMANTICS=NATIVE_DEFAULT_WHEN_REQUEST_OMITTED
SESSION_SWITCH_SEMANTICS=BOUNDED_NEW_THREAD_CURRENT_SESSION_ONLY
NEW_MODEL_DISCOVERABLE_WITHOUT_CODE_CHANGE=YES
STALE_MODEL_FAIL_CLOSED=YES
NO_SILENT_MODEL_FALLBACK=YES
QUOTA_POOL=chatgpt_codex_subscription
OPENAI_API_USED=NO
BYOK_USED=NO
GLM_USED=NO
CHATGPT_WEB_SEND=NO
PRODUCTION_ROUTING_CHANGED=NO
RAW_BROWSER_CDP_EXPOSED=NO
V7_REGRESSION=UNCHANGED
FOCUSED_TESTS=PASS:18
REGISTRY_TESTS=PASS:76/76
DIFF_CHECK=PASS
```

The focused suite is offline and covers pagination, exact selection, native
default, future model discovery, removed/stale IDs, unsupported reasoning,
catalog outage, effective mismatch, no-fallback behavior, and session switch
semantics. Existing registry/V7 qualification was not modified.

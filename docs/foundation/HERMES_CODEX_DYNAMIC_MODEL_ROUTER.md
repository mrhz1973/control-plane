# Hermes Codex Dynamic Model Router

The qualified controller lane is `CODEX_SUBSCRIPTION` through Hermes and the
Codex app-server. It uses the existing quota pool
`chatgpt_codex_subscription`; it does not create a second pool and it never
uses the OpenAI API, BYOK, GLM, or a provider fallback.

## Authority

`model/list` from the authenticated local Codex app-server is the live
catalog authority. The router follows `nextCursor` until it is null and keeps
only bounded model metadata. No permanent list of current GPT model IDs is
stored in code or the registry. The NEW VPS performs the same discovery
independently; LOCAL_ONLY, VPS_ONLY, and COMMON are valid snapshot results.

## Operations

The repo-owned adapter in
`tools/hermes-codex-dynamic-model-router-v1.mjs` exposes:

- `listModels()` / `discoverLiveCatalog()` - refresh the live catalog;
- `getModel(id)` - require an exact live ID;
- `setModel(id)` - send the exact ID through official `thread/start.model` and
  require the returned effective `model` to be identical;
- `listReasoningEfforts(id)` - return advertised efforts, or
  `NOT_ADVERTISED`;
- `setReasoningEffort(value)` - require an advertised exact effort;
- `startTurn(text)` - send the selected exact model and effort through the
  official `turn/start` fields.

An explicit unknown, hidden, removed, stale alias, or runtime-rejected model
fails closed with `MODEL_NOT_AVAILABLE` or a classified selection/execution
error. The router never chooses a closest model, a default model, or a retry
model. An advertised model rejected by the subscription service is recorded as
`ADVERTISED_NOT_SELECTABLE` during qualification.

If no model is requested, `useNativeDefault()` leaves selection to Codex and
records `MODEL_SELECTION_MODE=NATIVE_DEFAULT` plus the effective model when
the app-server exposes it. An explicit request always records exact selection;
requested and effective IDs must match.

## Session and receipt semantics

`SET_MODEL` starts a bounded new app-server thread with the requested model.
When a qualification session is active, the caller-provided retirement hook
retires only that session; it does not kill Cursor or global Codex processes.
The next turn uses the new thread and exact model. Receipts record catalog
source/freshness, requested/effective IDs, effort, subscription auth state,
pool, and the fixed safety fields `fallback_used=false`,
`openai_api_used=false`, and `byok_used=false`. Credentials, tokens, cookies,
raw model output, and chain-of-thought are never persisted.

# LLM Gateway portability contract v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/llm-gateway-portability-v1.md`  
**Version:** `llm-gateway-portability-v1`  
**Date:** 2026-08-27  
**Status:** `GPT-WEB AUTHORED — CANONICAL PORTABILITY CONTRACT`  
**Runtime authorized by this document:** **NO**

---

## 0. Purpose

Decouple the Architecture v3 planner-consumer path from a single gateway implementation.

The control-plane must treat the LLM gateway as a replaceable transport/broker behind a deterministic adapter boundary:

```text
planner-selection-v1
        ↓
LLM gateway adapter
        ↓
OpenAI Responses-compatible request
        ↓
OpenClaw | LiteLLM | later compatible gateway
```

This contract does not install, start, configure, or call any gateway. It defines the repo-only compatibility boundary needed to compare the existing OpenClaw path with LiteLLM without rewriting Execution Packet validation or policy logic.

---

## 1. Existing invariants that remain canonical

The following stay unchanged:

- planner selection is produced by `planner-selection-v1`;
- task input is `openclaw-consumer-input-v1` until a later neutral rename is explicitly authorized;
- structured planner output is exactly one `emit_execution_packet` function call;
- packet validation remains `execution-packet-v1`;
- response validation remains deterministic and fail-closed;
- packet policy remains `PROCEED | GATE | BLOCKED`;
- first real provider pilot remains max 1 inference, retry 0, fallback 0, under an explicit operator gate.

No gateway may bypass these stages.

---

## 2. Gateway profile

A gateway adapter receives one non-secret profile that validates against:

`docs/contracts/llm-gateway-profile-v1.schema.json`

The profile identifies only transport/configuration semantics safe to persist in GitHub. It must never contain a token, password, API key, OAuth material, Authorization value, provider credential, or private secret URL.

Supported gateway kinds in v1:

```text
openclaw
litellm
```

Adding another gateway requires an explicit contract update.

---

## 3. Planner binding requirement

The critical portability invariant is that the planner selected by `planner-selection-v1` must be machine-bindable to the request sent to the gateway.

Two binding modes exist:

### `explicit_model_alias`

The selected planner maps to one explicit gateway model alias from the profile:

```text
qwen  -> profile.model_aliases.qwen
glm   -> profile.model_aliases.glm
codex -> profile.model_aliases.codex
```

The adapter may build a request only when the selected planner has a non-empty alias.

### `gateway_default_unverified`

The gateway accepts one default/agent route but the repo cannot prove that the selected planner is the backend actually used.

This mode is not sufficient for the first real Phase C provider pilot.

Stable classification:

```text
PLANNER_BINDING_UNVERIFIED
```

The adapter must fail closed for real-dispatch readiness even if an offline envelope could otherwise be constructed.

---

## 4. Transport contract

Both current candidates are evaluated against the same transport shape:

```text
POST /v1/responses
stream: false
```

The request body preserves the D-0019 semantics:

- fixed planner instructions;
- serialized consumer input;
- exactly one function tool `emit_execution_packet`;
- function parameters loaded from `execution-packet-v1.schema.json`;
- `tool_choice` pinned to `emit_execution_packet`.

The selected planner determines the request `model` through the gateway profile when `planner_binding_mode=explicit_model_alias`.

No provider override is synthesized by the adapter.

---

## 5. Candidate-specific metadata

### OpenClaw

Current legacy profile characteristics:

```yaml
gateway_kind: openclaw
responses_path: /v1/responses
auth_requirement: existing_bearer
agent_header:
  name: x-openclaw-agent-id
  value: main
planner_binding_mode: gateway_default_unverified
```

The existing `openclaw/default` path remains valid as historical/compatibility behavior, but it does not by itself prove that `planner-selection-v1.selected` is the backend planner actually invoked.

D-0016-W Phase B authorization remains valid and separate; this portability contract does not cancel it.

### LiteLLM

LiteLLM is a candidate gateway because its proxy supports OpenAI-compatible APIs including the Responses API, and its proxy configuration supports named model aliases mapped to backend deployments. Official LiteLLM documentation also documents Ollama as a supported backend path.

A LiteLLM profile is considered dispatch-ready only if the non-secret profile provides explicit aliases for the selected planner and later runtime configuration proves those aliases map to the intended backends.

Repo-only tests may use placeholder aliases such as:

```yaml
model_aliases:
  qwen: planner-qwen-test
  glm: planner-glm-test
  codex: planner-codex-test
```

These are test names only, not runtime/provider claims.

This contract does **not** assume that Z.AI Coding Plan, ChatGPT/Codex subscription OAuth, or any specific provider is already proven through LiteLLM. Each remains a separate runtime/provider compatibility check.

---

## 6. Adapter input

The deterministic adapter consumes:

1. `consumer_input` validated against `openclaw-consumer-input-v1.schema.json`;
2. `planner_selection` with `schema == planner-selection-v1`;
3. `gateway_profile` validated against `llm-gateway-profile-v1.schema.json`.

Required cross-checks:

- `consumer_input.task_id == planner_selection.task_id`;
- `planner_selection.policy_result == PROCEED`;
- `planner_selection.selected != null`;
- selected planner is one of `qwen|glm|codex`;
- gateway profile is valid;
- selected planner has a deterministic binding if dispatch readiness is claimed.

---

## 7. Adapter output

Machine-readable result:

```yaml
schema: llm-gateway-adapter-result-v1
task_id: D-NNNN-X
gateway_kind: openclaw|litellm
selected_planner: qwen|glm|codex|null
planner_binding_verified: true|false
request_ready: true|false
classification: PASS|PLANNER_BINDING_UNVERIFIED|INPUT_MISMATCH|SELECTION_NOT_PROCEED|PROFILE_INVALID|MODEL_ALIAS_MISSING|BUILD_FAILED
request_envelope: <object|null>
```

Rules:

- `PASS` requires `planner_binding_verified=true` and `request_ready=true`;
- `PLANNER_BINDING_UNVERIFIED` requires `request_ready=false`;
- any invalid input/profile/task mismatch is fail-closed;
- adapter output never contains a credential value.

`PASS` means only that a deterministic request envelope is ready. It does not authorize HTTP or inference.

---

## 8. Compatibility objective

D-0023-W should prove offline whether the existing D-0019 request semantics can be moved behind this adapter without changing:

- Execution Packet schema;
- response gate semantics;
- packet policy gate;
- planner-selection policy.

The implementation may refactor shared request-building code only if D-0017 through D-0022 regressions remain PASS.

---

## 9. Hard boundaries

This contract does not authorize:

- installing LiteLLM;
- installing or changing OpenClaw;
- starting/restarting gateways;
- HTTP requests;
- provider/model inference;
- credential/auth/OAuth changes;
- n8n workflow mutation;
- VPS mutation;
- public exposure;
- Telegram sends;
- Cursor dispatch;
- PM-34/L5/endurance/permanent scheduling.

---

**End of contract.**

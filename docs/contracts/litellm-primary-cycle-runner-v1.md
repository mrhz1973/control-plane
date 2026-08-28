# LiteLLM primary remote cycle runner v1

**Repository:** `mrhz1973/control-plane`  
**Contract:** `litellm-primary-cycle-runner-v1`  
**Authority:** GPT Web  
**Date:** 2026-08-28  
**Status:** CANONICAL CONTRACT — implementation pending

## 0. Purpose

Define the deterministic, n8n-callable helper that composes the already-canonical planner-selection / LiteLLM request / response / packet-policy tools without duplicating their semantics inside n8n Code nodes.

The helper is **not** a daemon and does **not** own credentials. n8n performs the single authenticated HTTP request to the private LiteLLM gateway; this helper only prepares and finalizes one cycle offline.

## 1. Runtime placement

Expected path when mounted read-only into the n8n container:

`/files/handoff-runtime/control-plane/tools/run-litellm-primary-cycle.mjs`

Canonical repo mount root:

`/files/handoff-runtime/control-plane`

Schema-engine resolution is inherited from `CONTROL_PLANE_AJV_NODE_MODULES` and `tools/validate-execution-packet-v1.mjs`.

No package install, mount or container mutation is authorized by this contract itself.

## 2. Modes

### 2.1 `prepare`

CLI:

```text
node tools/run-litellm-primary-cycle.mjs prepare \
  --consumer-b64 <BASE64_JSON> \
  --routing-b64 <BASE64_JSON> \
  --profile <GATEWAY_PROFILE_JSON>
```

Required behavior:

1. base64-decode and JSON-parse both objects;
2. require `routing_input.schema == planner-routing-input-v1`;
3. require matching non-empty `task_id` values;
4. enforce current D-0025 runtime policy:
   - preferred planner is `glm` or `codex` only;
   - Qwen rejected;
   - `fallback` must be `[]`;
   - `fallback_policy` must be `gate_only`;
   - `consumer_input.planner_requested == routing_input.preferred`;
5. invoke canonical `evaluatePlannerSelection()` from `tools/evaluate-planner-selection.mjs`;
6. require `policy_result=PROCEED`, `selected` in `glm|codex`, `fallback_used=false`;
7. invoke canonical `buildGatewayRequest()` from `tools/build-llm-gateway-request.mjs` using the supplied profile;
8. require `classification=PASS`, `request_ready=true`, explicit model alias, `/v1/responses`, `stream=false`;
9. emit one machine JSON result and no other stdout.

`prepare` performs **zero HTTP/provider calls**.

Minimum PASS output:

```json
{
  "schema": "litellm-primary-cycle-prepared-v1",
  "ok": true,
  "classification": "PASS",
  "task_id": "...",
  "selected_planner": "glm|codex",
  "request_envelope": {},
  "consumer_b64": "..."
}
```

On gate/block/failure, emit `ok:false`, deterministic classification/reason, `request_envelope:null`, and non-zero exit. Never repair or rewrite the canonical inputs to force PASS.

### 2.2 `finalize`

CLI:

```text
node tools/run-litellm-primary-cycle.mjs finalize \
  --consumer-b64 <BASE64_JSON> \
  --response-b64 <BASE64_RAW_HTTP_BODY>
```

Required behavior:

1. decode consumer JSON and raw response body;
2. normalize response with `tools/normalize-litellm-responses-body.mjs`;
3. preserve the canonical normalized Responses object unchanged;
4. invoke canonical response evaluation semantics from `tools/validate-openclaw-planner-response-gate.mjs`;
5. extract exactly one `emit_execution_packet.arguments` packet only after response gate PASS;
6. invoke `evaluatePacketPolicy()` from `tools/evaluate-execution-packet-policy.mjs` on that exact packet;
7. do not execute Cursor or any packet action;
8. emit one machine JSON result and no other stdout.

`finalize` performs **zero HTTP/provider calls**.

Minimum PASS output:

```json
{
  "schema": "litellm-primary-cycle-final-v1",
  "ok": true,
  "classification": "PASS",
  "task_id": "...",
  "response_source_format": "json|sse",
  "response_gate": "PASS",
  "packet": {},
  "policy": {
    "decision": "PROCEED|GATE|BLOCKED",
    "cursor_dispatch_allowed": false
  }
}
```

`cursor_dispatch_allowed` in this wrapper result MUST remain `false` even when canonical policy says PROCEED: the n8n integration stage only returns the validated packet/policy result. A later explicitly authorized dispatch stage may consume it.

## 3. HTTP ownership

The runner never reads LiteLLM credentials and never performs the gateway request.

The n8n workflow owns exactly one POST between `prepare` and `finalize`:

```text
http://litellm-primary:4000/v1/responses
```

The HTTP body MUST be exactly `prepare.request_envelope.body`.

Credential binding, if LiteLLM master-key auth is enabled, belongs to an n8n Header Auth credential and is a separate runtime credential gate. No secret literal is allowed in workflow JSON/GitHub.

## 4. Attempt policy

For each workflow invocation:

- max LiteLLM HTTP calls: **1**;
- automatic retry: **0**;
- planner fallback: **0**;
- gateway fallback: **0**;
- Qwen: **0**.

Any non-2xx/provider error consumes the single attempt and is returned fail-closed. No second request is permitted inside the same invocation.

Global operator budget remains governed by `CURRENT_FRONTIER.md`.

## 5. Secret boundary

Never emit/log/persist:

- Authorization header values;
- Z.AI API key;
- ChatGPT access/refresh tokens;
- LiteLLM master key;
- n8n credential values.

Base64 arguments contain only canonical task/routing/response payloads, never auth material.

## 6. Required tests

Offline tests must include at least:

1. GLM prepare PASS;
2. Codex prepare PASS;
3. Qwen preferred -> FAIL-CLOSED;
4. non-empty fallback -> FAIL-CLOSED;
5. fallback policy other than `gate_only` -> FAIL-CLOSED;
6. task id mismatch -> FAIL-CLOSED;
7. consumer planner mismatch -> FAIL-CLOSED;
8. request envelope uses one forced `emit_execution_packet`, `stream=false`;
9. normal JSON finalize PASS on canonical fixture;
10. captured Codex SSE finalize PASS;
11. malformed SSE -> FAIL-CLOSED;
12. hard-constraint mismatch -> FAIL-CLOSED;
13. policy GATE preserved as GATE with no dispatch;
14. no secret-shaped output;
15. provider/network calls in runner tests = 0.

## 7. n8n authoring boundary

Canonical workflow artifact: `workflows/61-litellm-primary-remote-planner.template.json`.

The workflow must call this runner; it must not reimplement planner selection, request building, SSE normalization, packet schema validation, response gate or policy semantics in n8n Code nodes.

## 8. Out of scope

- LiteLLM container deployment/start;
- control-plane mount deployment;
- Ajv installation on VPS;
- credential creation/binding;
- n8n workflow import/activation;
- WF40 parent wiring;
- Cursor dispatch;
- OpenClaw mutation;
- Qwen runtime.

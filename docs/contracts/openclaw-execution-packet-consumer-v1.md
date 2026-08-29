# OpenClaw Execution Packet Consumer Contract v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/openclaw-execution-packet-consumer-v1.md`  
**Version:** `openclaw-execution-packet-consumer-v1`  
**Date:** 2026-08-27  
**Status:** `GPT-WEB AUTHORED — DESIGN/REQUEST CONTRACT`  
**Runtime authorized by this document:** **NO**

---

## 0. Purpose

Define the exact first concrete planner-consumer request contract for Architecture v3:

```text
Backlog Item / bounded task input
  → OpenClaw Gateway `/v1/responses`
  → selected planner agent/model
  → required structured function call
  → deterministic Execution Packet validation
  → Cursor only after policy/gate
```

This contract prepares D-0016-W Phase C while the HOME Windows host is unavailable. It does not enable the HTTP surface, start the Gateway, perform inference, import/activate n8n, or authorize a provider call.

The generated packet must conform to `docs/contracts/execution-packet-v1.md`.

---

## 1. OpenClaw HTTP surface

Use the OpenResponses-compatible endpoint:

```text
POST /v1/responses
```

Request characteristics:

```yaml
model: openclaw/default
stream: false
agent_header: x-openclaw-agent-id: main
auth: existing Gateway bearer credential only
provider_override: absent unless a later explicit runtime gate supplies one
```

Do not use a generic free-text completion contract. The planner must be forced to emit a structured client-side function call.

Official behavior relied upon by this contract:

- `/v1/responses` runs through the normal OpenClaw Gateway agent path;
- `tools` accepts client-side function definitions;
- `tool_choice` can require one named function;
- auth follows `gateway.auth.mode`;
- the HTTP surface is default-off and is enabled separately by D-0016-W Phase B.

Reference: `https://docs.openclaw.ai/gateway/openresponses-http-api`.

---

## 2. Runtime input contract

The consumer accepts one bounded object:

```yaml
consumer_input:
  task_id: D-NNNN-X
  source_backlog_ref: github:issue/N
  source_backlog_commit: <sha|null>
  repository: owner/repo
  branch_target: main
  goal: <bounded goal>
  risk_hint: low|medium|high
  complexity_hint: low|medium|high
  planner_requested: qwen|glm|codex
  allowed_paths: []
  forbidden_paths: []
  acceptance_seed: []
  validation_seed: []
  hard_constraints: []
```

No secret, API key, bearer token, password, OAuth material, or credential value belongs in `consumer_input`.

---

## 3. Planner instructions

The OpenResponses `instructions` field is fixed to the following semantics:

```text
You are the planner for mrhz1973/control-plane.
Generate exactly one bounded Execution Packet conforming to execution-packet-v1.
Preserve the supplied task objective, allowed/forbidden scope and hard constraints.
hard_constraints MUST equal consumer_input.hard_constraints exactly: same length, same order, same strings; do not add, remove, rephrase, or infer additional hard constraints.
Every execution-packet-v1 required field MUST be present in emit_execution_packet arguments; do not omit required fields even when their schema value is fixed by const.
final_report_contract MUST be present and MUST equal docs/foundation/CURSOR_PROMPT_TEMPLATE.md exactly.
Do not self-authorize runtime.
Do not invent credentials, provider state, repository facts, hashes or acceptance evidence.
If required information is absent, encode a gate/blocking condition rather than guessing.
Return the packet only through the required emit_execution_packet function call.
```

The task-specific material is supplied in `input` as a serialized `consumer_input` object.

---

## 4. Required function tool

The request must expose exactly one client-side function tool for the pilot:

```json
{
  "type": "function",
  "name": "emit_execution_packet",
  "description": "Emit one execution-packet-v1 object for deterministic validation and Cursor handoff.",
  "parameters": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "schema",
      "packet_id",
      "packet_revision",
      "task_id",
      "source_backlog_ref",
      "source_backlog_commit",
      "generated_at",
      "planner",
      "executor",
      "repository",
      "branch_target",
      "goal",
      "preflight",
      "allowed_paths",
      "forbidden_paths",
      "hard_constraints",
      "steps",
      "validation",
      "acceptance",
      "loop",
      "risk_assessment",
      "gate_recommendation",
      "context",
      "review",
      "final_report_contract",
      "status"
    ],
    "properties": {
      "schema": { "const": "execution-packet-v1" },
      "packet_id": { "type": "string", "minLength": 1 },
      "packet_revision": { "type": "integer", "minimum": 1 },
      "task_id": { "type": "string", "minLength": 1 },
      "source_backlog_ref": { "type": "string", "minLength": 1 },
      "source_backlog_commit": { "type": ["string", "null"] },
      "generated_at": { "type": "string", "minLength": 1 },
      "planner": {
        "type": "object",
        "additionalProperties": false,
        "required": ["requested", "used", "fallback_used", "fallback_reason", "provider_state_ref"],
        "properties": {
          "requested": { "enum": ["qwen", "glm", "codex"] },
          "used": { "enum": ["qwen", "glm", "codex"] },
          "fallback_used": { "type": "boolean" },
          "fallback_reason": { "type": ["string", "null"] },
          "provider_state_ref": { "type": ["string", "null"] }
        }
      },
      "executor": { "const": "cursor" },
      "repository": { "type": "string", "minLength": 1 },
      "branch_target": { "type": "string", "minLength": 1 },
      "goal": { "type": "string", "minLength": 1 },
      "preflight": { "type": "array", "items": { "type": "string" } },
      "allowed_paths": { "type": "array", "items": { "type": "string" } },
      "forbidden_paths": { "type": "array", "items": { "type": "string" } },
      "hard_constraints": { "type": "array", "items": { "type": "string" } },
      "steps": { "type": "array", "minItems": 1, "items": { "type": "string" } },
      "validation": { "type": "array", "items": { "type": "string" } },
      "acceptance": { "type": "array", "minItems": 1, "items": { "type": "string" } },
      "loop": {
        "type": "object",
        "additionalProperties": false,
        "required": ["enabled", "stop_when", "max_rounds", "on_exhaustion"],
        "properties": {
          "enabled": { "type": "boolean" },
          "stop_when": { "type": "array", "items": { "type": "string" } },
          "max_rounds": { "type": "integer", "minimum": 1, "maximum": 10 },
          "on_exhaustion": { "enum": ["telegram_gate", "blocked"] }
        }
      },
      "risk_assessment": {
        "type": "object",
        "additionalProperties": false,
        "required": ["level", "reasons", "scope_expansion", "destructive", "production_sensitive", "credentials_or_billing"],
        "properties": {
          "level": { "enum": ["low", "medium", "high"] },
          "reasons": { "type": "array", "items": { "type": "string" } },
          "scope_expansion": { "type": "boolean" },
          "destructive": { "type": "boolean" },
          "production_sensitive": { "type": "boolean" },
          "credentials_or_billing": { "type": "boolean" }
        }
      },
      "gate_recommendation": {
        "type": "object",
        "additionalProperties": false,
        "required": ["required", "reason"],
        "properties": {
          "required": { "type": "boolean" },
          "reason": { "type": ["string", "null"] }
        }
      },
      "context": {
        "type": "object",
        "additionalProperties": false,
        "required": ["read_set", "checkpoint_policy", "checkpoint_contract"],
        "properties": {
          "read_set": { "type": "array", "items": { "type": "string" } },
          "checkpoint_policy": { "const": "required" },
          "checkpoint_contract": { "const": "docs/contracts/execution-checkpoint-v1.md" }
        }
      },
      "review": {
        "type": "object",
        "additionalProperties": false,
        "required": ["bugbot", "max_review_rounds", "autofix_cloud"],
        "properties": {
          "bugbot": { "enum": ["required", "optional", "disabled"] },
          "max_review_rounds": { "type": "integer", "minimum": 0, "maximum": 10 },
          "autofix_cloud": { "const": false }
        }
      },
      "final_report_contract": { "const": "docs/foundation/CURSOR_PROMPT_TEMPLATE.md" },
      "status": { "enum": ["READY_FOR_GATE", "GATED", "READY_FOR_EXECUTION", "SUPERSEDED"] }
    }
  }
}
```

`tool_choice` must pin that function:

```json
{
  "type": "function",
  "name": "emit_execution_packet"
}
```

This avoids treating arbitrary free text as a valid Execution Packet.

---

## 5. Deterministic post-response validation

The consumer must reject the response unless all are true:

1. HTTP request succeeded;
2. exactly one `function_call` named `emit_execution_packet` is present;
3. function arguments parse as JSON;
4. required top-level keys exist;
5. `schema == execution-packet-v1`;
6. `task_id`, `source_backlog_ref`, `repository`, `branch_target` match the supplied input;
7. `executor == cursor`;
8. `planner.requested` matches the routed/requested planner;
9. fallback metadata is internally consistent;
10. risk/gate fields are present;
11. loop and review bounds are finite;
12. no field contains a known secret value or authorization header material;
13. `packet.hard_constraints` equals `consumer_input.hard_constraints` by exact deep array equality (same length, same order, byte-for-byte strings; no trim/case-fold/normalize/dedup/paraphrase). Empty input requires `[]`. Mismatch classification: `HARD_CONSTRAINT_MISMATCH`.

If validation fails, classify the consumer result `INVALID_EXECUTION_PACKET` (or the specific stable classification such as `HARD_CONSTRAINT_MISMATCH`) and do not send anything to Cursor.

---

## 6. YAML rendering

After structured validation, convert the validated object deterministically to YAML for persistence as the canonical Execution Packet artifact.

The planner is not responsible for YAML syntax. The planner is responsible for the structured packet content; the consumer serializes it.

Canonical persistence shape:

```text
docs/runtime/execution-packets/<packet_id>.yaml
```

Persistence itself is a later bounded workflow/action and is not authorized by this contract.

---

## 7. Pilot call boundary

D-0016-W Phase C may execute only after all of these are true:

- Phase B Gateway HTTP surface is enabled and listening;
- private/auth metadata validation passes;
- GPT Web supplies the exact pilot `consumer_input`;
- backend planner/model selection is explicit for the pilot;
- operator/provider-call gate authorizes exactly one planner inference request;
- retries/fallbacks are disabled unless separately authorized.

The first pilot must use:

```yaml
provider_model_inference_request_count_max: 1
retry_count: 0
fallback_count: 0
stream: false
```

---

## 8. Windows pilot and broker boundary

D-0016-W is specifically a Windows fallback pilot. The existing Windows Header Auth binding may be used only for the Windows private Gateway.

Do not assume that the same credential is valid for the future VPS canonical primary.

A generic broker consumer supporting both primary and fallback requires broker-specific authenticated invocation policy/credentials and is a later contract.

---

## 9. Hard boundaries

This contract does not authorize:

- enabling OpenClaw HTTP endpoints;
- starting/restarting/installing the Gateway;
- provider/model inference;
- credential read/rotation/mutation;
- n8n import/activation/execution;
- VPS Z.AI mutation or extra probes;
- public exposure/Funnel/NAT;
- PM-34/L5/endurance/permanent schedule;
- Cursor execution.

---

**End of contract.**

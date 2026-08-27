# LLM Gateway comparison spike v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/llm-gateway-comparison-spike-v1.md`  
**Version:** `llm-gateway-comparison-spike-v1`  
**Date:** 2026-08-27  
**Status:** `GPT-WEB AUTHORED — SPIKE CONTRACT`  

## 0. Objective

Compare OpenClaw and LiteLLM as replaceable LLM gateways without changing the existing Architecture v3 control-plane. The comparison proceeds in two bounded stages:

1. **offline/config stage** — no install, no HTTP, no provider/model call, no credential access;
2. **controlled runtime pilot stage** — only after offline/config PASS and runtime prerequisites are met.

The architecture remains:

`planner selection -> gateway adapter -> Responses API -> Execution Packet validation -> policy gate -> Cursor`

No candidate may bypass the existing deterministic validators or policy gates.

## 1. Current candidate roles

### OpenClaw

Existing implementation/fallback path. Keep it intact. D-0016-W Phase B remains separately authorized for the HOME Windows host when that host is reachable.

Current limitation for Phase C readiness: the legacy `openclaw/default` route is not a machine-verifiable binding from `planner-selection-v1.selected` to the actual planner backend. Until an explicit mapping exists, classify as `PLANNER_BINDING_UNVERIFIED`.

### LiteLLM

Candidate replacement gateway. Offline/config comparison must use explicit model aliases for:

- `qwen`
- `glm`
- `codex`

The selected planner must deterministically map to exactly one LiteLLM alias.

## 2. Offline/config stage

This stage is fulfilled by D-0023-W plus the artifacts below.

Required outputs:

- gateway portability adapter;
- OpenClaw legacy profile test;
- LiteLLM explicit-alias profile test;
- deterministic request envelope parity with current `/v1/responses` planner-consumer semantics;
- no secrets in committed config examples;
- test-only LiteLLM configuration skeleton for three aliases;
- comparison matrix covering planner binding, Responses API/tool call compatibility, auth shape, retry/fallback control, n8n fit, Qwen local path, GLM Coding Plan path, Codex subscription OAuth path, operational complexity, and failure isolation.

Offline/config PASS does not prove runtime provider compatibility.

## 3. Runtime pilot suite authorization boundary

The operator authorized a later controlled spike suite with **at most one inference request per backend**:

- GLM Coding Plan;
- ChatGPT/Codex subscription OAuth;
- Qwen 3.8 37B local.

For the complete suite:

- total max inference requests: **3**;
- max per backend: **1**;
- retry: **0**;
- gateway fallback: **0**;
- planner fallback: **0**;
- stream: **false**;
- same bounded consumer contract / `emit_execution_packet` function-call target;
- no architectural switch, n8n mutation, production deployment, public exposure, or permanent service activation.

A failed backend pilot is evidence, not permission to retry automatically.

## 4. Runtime prerequisites

No runtime pilot starts until its own prerequisites are satisfied.

### GLM

- LiteLLM runtime is isolated/reversible;
- Z.AI Coding Plan credential is supplied locally without entering chat/GitHub;
- coding endpoint is configured explicitly as `https://api.z.ai/api/coding/paas/v4`;
- exact GLM model alias/backend is recorded;
- no VPS Z.AI diagnostic probe is added under issue #8 while `NO_MORE_MANUAL_ONE_OFF_PROBES` remains active.

The GLM pilot may run on a non-VPS execution surface if that is the bounded spike surface selected at runtime.

### Codex OAuth

- LiteLLM ChatGPT subscription provider support is verified for the installed version;
- OAuth/device flow is completed locally by the operator;
- exact Codex model exposed by the authenticated provider is recorded before the call;
- use `/v1/responses`, `stream=false`;
- no OpenAI Platform API key or paid API fallback is silently substituted.

### Qwen

- HOME/local Qwen host is reachable;
- exact target remains **Qwen 3.8 37B**;
- no silent 27B substitution;
- local resource pressure is acceptable;
- LiteLLM maps a dedicated alias to the existing local Ollama/OpenAI-compatible backend;
- no model download is implicitly authorized by this spike.

## 5. Comparison method

Use the same bounded semantic test wherever transport allows:

- fixed `consumer_input`;
- deterministic selected planner;
- exactly one `emit_execution_packet` function tool;
- schema-valid `execution-packet-v1` required;
- response gate required;
- packet policy gate required;
- sanitized evidence only.

Record per candidate/backend:

- gateway kind/version;
- selected planner alias;
- request accepted/rejected;
- function-call shape valid/invalid;
- Execution Packet schema PASS/FAIL;
- deterministic response gate PASS/FAIL;
- latency if safely observable;
- error classification;
- secret exposure: false required.

## 6. Decision rule

The spike does not automatically replace OpenClaw.

LiteLLM may be recommended as the new primary gateway candidate only if:

- D-0023 offline portability is PASS;
- required explicit planner binding works;
- GLM, Codex OAuth, and Qwen pilot evidence is sufficient for the intended planner pool, or any unsupported path is explicitly accepted as a limitation;
- no regression in Execution Packet validation/policy semantics;
- operator makes a separate architecture-change decision.

Until then:

- OpenClaw remains intact;
- LiteLLM remains a candidate;
- no n8n production routing is changed.

## 7. Hard boundaries

This contract does not authorize:

- more than one model call per backend;
- retry/fallback during the pilot;
- secrets in GitHub/chat/log evidence;
- public listener/Funnel/NAT exposure;
- permanent LiteLLM service deployment;
- removal/uninstall of OpenClaw;
- n8n workflow mutation;
- VPS Z.AI diagnostic expansion;
- PM-34/L5/endurance/permanent schedule;
- automatic architecture promotion.

**End of contract.**

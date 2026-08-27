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

Candidate replacement gateway. Offline/config comparison may retain explicit model aliases for the full planner pool (`qwen`, `glm`, `codex`) so portability remains structurally testable.

**Current runtime priority is GLM + Codex only. Qwen runtime is explicitly deferred.**

The selected planner must deterministically map to exactly one LiteLLM alias.

## 2. Offline/config stage

This stage is fulfilled by D-0023-W plus the artifacts below.

Required outputs:

- gateway portability adapter;
- OpenClaw legacy profile test;
- LiteLLM explicit-alias profile test;
- deterministic request envelope parity with current `/v1/responses` planner-consumer semantics;
- no secrets in committed config examples;
- test-only LiteLLM configuration skeleton;
- comparison matrix covering planner binding, Responses API/tool call compatibility, auth shape, retry/fallback control, n8n fit, GLM Coding Plan path, Codex subscription OAuth path, optional/deferred Qwen local path, operational complexity, and failure isolation.

Qwen may remain represented only as an offline/static compatibility alias in D-0023-W. No Qwen model load, local runtime probe, download, or inference belongs to the current priority path.

Offline/config PASS does not prove runtime provider compatibility.

## 3. Current runtime pilot authorization boundary

The operator currently authorizes the runtime priority suite for **two backends only**:

- GLM Coding Plan;
- ChatGPT/Codex subscription OAuth.

Current caps:

- total max inference requests: **2**;
- max per active backend: **1**;
- retry: **0**;
- gateway fallback: **0**;
- planner fallback: **0**;
- stream: **false**;
- same bounded consumer contract / `emit_execution_packet` function-call target;
- no architectural switch, n8n mutation, production deployment, public exposure, or permanent service activation.

A failed backend pilot is evidence, not permission to retry automatically.

### Qwen deferred

Qwen 3.8 37B remains in the architecture/planner pool but is **not part of the current runtime spike**.

Current Qwen runtime authorization:

- inference calls: **0**;
- model load/start/download: **not authorized by this spike**;
- no 27B substitution;
- future Qwen pilot requires a later explicit resume/authorization step when its host is reachable and the operator decides it is worth testing.

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

### Qwen — deferred prerequisite set

No current runtime action. Future-only prerequisites remain:

- HOME/local Qwen host reachable;
- exact target **Qwen 3.8 37B**;
- no silent 27B substitution;
- local resource pressure acceptable;
- dedicated LiteLLM alias to existing local backend;
- no model download implicitly authorized.

## 5. Comparison method

Use the same bounded semantic test wherever transport allows:

- fixed `consumer_input`;
- deterministic selected planner;
- exactly one `emit_execution_packet` function tool;
- schema-valid `execution-packet-v1` required;
- response gate required;
- packet policy gate required;
- sanitized evidence only.

Record per active runtime backend:

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

For the **current priority decision**, LiteLLM may be recommended as the primary gateway candidate for the remote-planner path if:

- D-0023 offline portability is PASS;
- explicit planner binding works;
- GLM runtime evidence is sufficient;
- Codex OAuth runtime evidence is sufficient;
- no regression in Execution Packet validation/policy semantics;
- Qwen is recorded as `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` rather than falsely claimed proven;
- operator makes a separate architecture-change decision.

A later Qwen runtime pilot can extend evidence for the local-planner path without reopening the already-proven GLM/Codex transport work unless a real incompatibility appears.

Until an architecture decision is made:

- OpenClaw remains intact;
- LiteLLM remains a candidate;
- no n8n production routing is changed.

## 7. Hard boundaries

This contract does not authorize:

- more than one GLM call and one Codex call in the current priority suite;
- any Qwen inference in the current priority suite;
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

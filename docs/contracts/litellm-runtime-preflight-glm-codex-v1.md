# LiteLLM runtime preflight — GLM + Codex v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/litellm-runtime-preflight-glm-codex-v1.md`  
**Version:** `litellm-runtime-preflight-glm-codex-v1`  
**Date:** 2026-08-27  
**Status:** `GPT-WEB AUTHORED — D-0024 PRE-RUNTIME CONTRACT`  

## 0. Purpose

Advance D-0024-W from offline compatibility to an isolated LiteLLM runtime prerequisite check on the WORK PC, without consuming either authorized provider inference call.

Current priority backend pool:

- GLM Coding Plan;
- ChatGPT/Codex subscription OAuth.

Qwen runtime is `DEFERRED_NOT_BLOCKING_CURRENT_REMOTE_PATH` and is outside this preflight.

## 1. Authorization boundary

This preflight authorizes only:

- creation of an isolated, reversible LiteLLM environment outside the repository working tree;
- installation of a pinned stable LiteLLM proxy build for the spike;
- local package/provider introspection;
- local config parsing/validation;
- optional loopback-only process startup for local health/version checks **only when it can be done without triggering provider authentication or inference**;
- sanitized evidence persistence in GitHub.

This preflight does **not** consume the D-0024 inference budget.

Provider request budget remains:

- GLM inference: 0/1 consumed;
- Codex inference: 0/1 consumed;
- total: 0/2 consumed;
- retry: 0;
- planner fallback: 0;
- gateway fallback: 0;
- stream: false.

## 2. LiteLLM spike runtime

Preferred pinned package for this spike:

`litellm[proxy]==1.98.0`

Install into a dedicated venv under a user-local non-repo location such as:

`%LOCALAPPDATA%\ControlPlane\litellm-spike\venv`

or an equivalent user-local isolated directory chosen deterministically by Cursor.

Do not install globally. Do not add LiteLLM as a repository dependency. Do not create a permanent service or autostart entry.

If the available Python runtime is incompatible with the pinned package, STOP and report the exact Python/package compatibility finding rather than silently choosing a different LiteLLM version.

## 3. Local-only provider capability discovery

After installation, inspect the installed package locally and record only non-secret capability evidence.

### GLM

Verify locally whether the installed LiteLLM version recognizes the native Z.AI provider route for the intended semantic target GLM 5.3.

Preferred route to verify:

`zai/glm-5.3`

Required endpoint remains exactly:

`https://api.z.ai/api/coding/paas/v4`

Do not send a request to Z.AI in preflight.

If installed-package inspection shows a different required LiteLLM provider prefix/config shape, STOP with the exact finding for GPT Web review. Do not silently fall back to the General API endpoint.

### Codex subscription OAuth

Verify locally that the installed package contains the `chatgpt/` subscription provider and its OAuth/device-flow support for Responses-style access.

Do not initiate OAuth/device flow in this preflight unless the operator is present at the explicit auth gate.

Do not substitute OpenAI Platform API-key access.

The exact authenticated Codex model remains unresolved until the OAuth discovery gate and must not be invented.

## 4. Config reconciliation

Inspect:

`configs/litellm/control-plane-spike.template.yaml`

Reconcile only provider-route/config syntax proven by the installed LiteLLM package.

Preserve:

- alias `planner-glm-pilot`;
- alias `planner-codex-pilot`;
- `stream=false` pilot semantics;
- no retry/fallback chain;
- no secret literals;
- Qwen runtime deferred.

Any repo config correction must remain non-secret and test/spike-only.

## 5. Local bind boundary

If a proxy process is started during preflight, it must bind only to loopback:

`127.0.0.1`

No `0.0.0.0`, LAN bind, Tailscale Serve, Funnel, NAT, public reverse proxy, Windows service, scheduled task, or autostart.

Stop the process before completing the preflight unless a later explicit runtime-pilot step requires it.

## 6. Human auth gates after preflight

Preflight must end before provider authentication/inference unless those prerequisites are already locally satisfied without secret disclosure.

### GLM credential gate

The Z.AI Coding Plan credential must be supplied locally by the operator into the runtime process/session without entering chat or GitHub and without committing/persisting the value.

### Codex OAuth gate

The operator must complete the ChatGPT subscription OAuth/device flow locally. Record only sanitized evidence such as provider route and discovered model identifier; never token/device secret material.

These are real human gates.

## 7. Acceptance

Preflight PASS requires:

1. D-0023 remains PASS;
2. isolated LiteLLM environment exists and is reversible;
3. exact installed LiteLLM version recorded;
4. installed-package GLM provider route/config shape classified;
5. coding endpoint remains `/api/coding/paas/v4`;
6. installed-package `chatgpt/` OAuth/provider capability classified;
7. no OAuth login completed unless operator explicitly participates;
8. no provider/model inference request;
9. no secret readout/persistence;
10. no public/non-loopback listener;
11. no global install/permanent service;
12. Qwen runtime untouched;
13. sanitized evidence persisted;
14. D-0024 inference budget remains 0/2.

## 8. Stable preflight classifications

- `PREFLIGHT_PASS_AUTH_GATES_PENDING`
- `PYTHON_INCOMPATIBLE`
- `LITELLM_INSTALL_FAILED`
- `GLM_PROVIDER_ROUTE_UNRESOLVED`
- `CODEX_OAUTH_PROVIDER_UNRESOLVED`
- `CONFIG_RECONCILIATION_REQUIRED`
- `PUBLIC_BIND_RISK`
- `UNEXPECTED_PROVIDER_NETWORK_ACCESS`

## 9. Hard boundaries

No provider inference, no Qwen runtime, no n8n mutation, no OpenClaw mutation, no VPS Z.AI diagnostic expansion, no credential persistence, no architecture promotion, no PM-34/L5/endurance/permanent schedule.

**End of contract.**

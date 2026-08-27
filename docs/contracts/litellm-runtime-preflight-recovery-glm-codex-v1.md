# LiteLLM runtime preflight recovery — GLM + Codex v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/litellm-runtime-preflight-recovery-glm-codex-v1.md`  
**Version:** `litellm-runtime-preflight-recovery-glm-codex-v1`  
**Date:** 2026-08-27  
**Status:** `GPT-WEB AUTHORED — D-0024 RECOVERY CONTRACT`

## 0. Purpose

Recover D-0024-W after the preflight STOP caused by an involuntary ChatGPT device-code OAuth side effect during `get_llm_provider(chatgpt/...)` introspection.

This recovery completes only the remaining zero-inference prerequisite work needed to reach the two real human authentication gates for:

- GLM Coding Plan;
- ChatGPT/Codex subscription OAuth.

Qwen runtime remains deferred.

## 1. Canonical findings from the STOP

The installed isolated runtime is:

- Python `3.13.3`;
- LiteLLM `1.98.0`;
- isolated under `%LOCALAPPDATA%\ControlPlane\litellm-spike\venv`;
- no global install;
- no proxy/service/autostart/public bind.

### GLM

Installed-package introspection proved:

- `zai/glm-5.3` resolves to provider `zai`, model `glm-5.3`;
- LiteLLM native default `api_base` is the Z.AI General API `https://api.z.ai/api/paas/v4`;
- the project requires the Coding Plan endpoint explicitly:
  `https://api.z.ai/api/coding/paas/v4`.

Therefore the canonical D-0024 test route is:

`zai/glm-5.3`

with an explicit `api_base` override to the Coding Plan endpoint.

### Codex

Installed package source proves:

- provider enum `LlmProviders.CHATGPT` exists;
- `litellm/llms/chatgpt/authenticator.py` exists;
- ChatGPT Responses transformation exists;
- device OAuth symbols exist;
- `chatgpt/` model-prefix examples exist, including Codex-family examples.

The exact model for the pilot remains unresolved until the operator-present OAuth gate.

## 2. Involuntary OAuth hard prohibition

Until the operator explicitly enters the Codex OAuth gate, recovery MUST NOT execute any code path that can start device OAuth.

Forbidden before the gate:

- `get_llm_provider()` on a `chatgpt/...` model;
- ChatGPT completion/responses calls;
- authenticator login helpers;
- token/device-code helpers;
- any command that prints or requests a ChatGPT device code.

Codex capability verification in recovery is SOURCE/REGISTRY-ONLY.

Any device code emitted by the failed preflight is invalid for project use and must not be completed.

## 3. GLM config reconciliation

Update the test/spike LiteLLM template so `planner-glm-pilot` uses:

- `model: zai/glm-5.3`
- `api_base: https://api.z.ai/api/coding/paas/v4`
- API key by local environment reference only.

Do not call Z.AI.
Do not use the General API endpoint.

## 4. Codex config reconciliation

Keep the test/spike alias `planner-codex-pilot` on the `chatgpt/` subscription provider.

Before OAuth, the exact model remains a placeholder and MUST NOT be guessed.

Do not substitute OpenAI Platform API-key access.

## 5. Regression/tooling note

The D-0023 portability test runner failed on the WORK PC because the existing Ajv draft-2020-12 engine could not be resolved on that host. This is classified as a host tooling availability issue, not evidence of a D-0023 functional regression.

Recovery MUST NOT add Ajv/package-manager dependencies to the repository merely to satisfy this host.

If shared JS tooling is not modified in recovery, it is sufficient to:

- preserve historical D-0023 PASS evidence;
- validate the modified YAML/config locally using available Python/YAML or LiteLLM local config parsing without provider access;
- record the Ajv host limitation explicitly.

If shared JS tooling is modified, STOP unless the canonical regression environment can be restored without repo dependency changes.

## 6. Human authentication gates

After source-only/config recovery, stop at these real gates:

### GLM

`LOCAL_ZAI_CODING_CREDENTIAL_ENTRY`

The operator supplies the Z.AI Coding Plan credential locally to the isolated runtime/session. Never expose or persist the value in chat/GitHub.

### Codex

`CHATGPT_SUBSCRIPTION_OAUTH_DEVICE_FLOW_OPERATOR_PRESENT`

The operator starts and completes the ChatGPT subscription OAuth/device flow locally while present. Record only sanitized provider/model metadata; never token/device-secret material.

## 7. Inference budget

Recovery consumes zero provider inference.

Required end state:

- GLM inference `0/1`;
- Codex inference `0/1`;
- total `0/2`;
- retry `0`;
- planner fallback `0`;
- gateway fallback `0`;
- Qwen inference `0`.

## 8. Acceptance

Recovery PASS requires:

1. isolated LiteLLM 1.98.0 runtime preserved;
2. GLM template reconciled to native `zai/glm-5.3` + explicit Coding Plan endpoint;
3. Codex capability confirmed source/registry-only with no OAuth side effect;
4. exact Codex model still unresolved unless operator-present OAuth gate has explicitly begun;
5. no provider/model inference;
6. no credential value read/displayed/persisted;
7. no proxy/public listener required;
8. Qwen runtime untouched;
9. config parses/validates locally without provider access;
10. D-0024 issue remains OPEN at the auth gates.

Stable PASS classification:

`D0024_PREFLIGHT_RECOVERY_PASS_AUTH_GATES_READY`

## 9. Hard boundaries

No provider inference, no silent OAuth, no Qwen runtime, no n8n/OpenClaw/VPS mutation, no public exposure, no permanent service, no credential persistence, no architecture promotion, no PM-34/L5/endurance/permanent schedule.

**End of contract.**
# V4 Hermes controller A/B diagnostic — Qwen vs GLM 5.3 Flash

**TASK_REF:** `V4_HERMES_CONTROLLER_AB_DIAGNOSTIC_GLM_FLASH_V1`
**Issue:** #73
**Date (UTC):** 2026-09-10
**BASE_HEAD:** `955f007a5959a618918e5a1aa05adc76b6dc8a30`
**Classification:** `PASS — DETERMINISTIC_A/B_NARROWING`
**ROOT_CAUSE:** `QWEN_MODEL_BEHAVIOR`
**GLM_RESULT:** `DIAGNOSTIC_CONTROL_PASS`
**PHASE_D:** `OPEN`

## Boundary

This was a bounded diagnostic, not a Phase D execution. GLM 5.3 Flash was
used only as the control lane. It was not selected or promoted as the
canonical #73 controller. No ChatGPT Web message, candidate, production
dispatch, `/v1/tick`, n8n/VPS mutation, credential mutation, or login action
occurred.

## Preflight and browser state

- `origin/main` and local `HEAD` both equalled the required base; branch was
  `main`; the tracked worktree was clean. Pre-existing untracked files were
  preserved.
- V11 and V12 evidence was read boundedly. Both retain their original STOP
  classifications.
- `ISSUE_73_PHASE_C=PASS`; `PHASE_D=OPEN`.
- Only the Chrome instance owning loopback CDP `127.0.0.1:9222` was closed by
  `Browser.close`, then the same persistent
  `C:\Users\mrhz\AppData\Local\HermesChromeProfile` was reopened.
- The new listener was loopback-only. ChatGPT Web was authenticated without
  automated login, and the fresh chat had `USER_TURNS=0` and
  `ASSISTANT_TURNS=0`.
- Native Computer Use was unavailable after its required bounded retry/reset
  recovery, so browser verification used semantic CDP on the same loopback
  endpoint.

## Controlled A/B results

| Layer | Qwen local | GLM 5.3 Flash |
|---|---|---|
| Raw model, identical action-classification prompt | **FAIL**, refusal prose; required positive action absent; 85.198 s | **PASS**, returned `ACTION=SEND_CHAT_N`, `BRIDGE=HERMES`, `TARGET=CHATGPT_WEB`; 133.909 s |
| Hermes text-only marker | **PASS**, exact `HERMES_QWEN_TEXT_OK`; 81.240 s | **FAIL_CREDENTIAL_ISOLATION**, Hermes has no usable `zai` credential in its own pool; 1.956 s |
| Hermes controller classification | **FAIL_TIMEOUT_NO_ACTION**, one completion timed out at 244.052 s; no browser tools enabled | **FAIL_CREDENTIAL_ISOLATION**, fail-closed before inference; 3.505 s |

The successful GLM raw result was produced through the already-configured
OpenClaw Z.AI route with the explicit model `zai/glm-5.3-flash`. The provider
first reported that this model cannot use `thinking=off`; the same model,
route, and semantic prompt were then used with its required minimum
`thinking=low`. The successful result reported no fallback attempts. No key
was printed, copied, created, or persisted.

Bounded operational outputs:

```text
QWEN_RAW = refusal: "I'm not going to engage with this request as framed ...
I don't perform action classification ..."

GLM_FLASH_RAW =
ACTION=SEND_CHAT_N
BRIDGE=HERMES
TARGET=CHATGPT_WEB

QWEN_HERMES_TEXT = HERMES_QWEN_TEXT_OK
```

No chain-of-thought or credential material is persisted here.

## Effective wrapper inspection

The raw Qwen failure occurs before Hermes, which excludes Hermes as the
primary source of that refusal. Read-only inspection further found:

- `qwen_runtime_router.py` forwards the OpenAI-compatible request body to the
  selected backend and changes only the canonical `model` field when needed;
- the active worker was the exact
  `qwen38-opus-q3-opencode-64k` profile, with `--jinja` and
  `--reasoning off`;
- the active GGUF chat template was the model-provided standard template;
- the raw request contained no system message, no tools, and no
  model-specific instruction prefix;
- no custom stop sequence was present; the raw test explicitly used
  deterministic temperature zero.

The minimal marker succeeds through Hermes while action-classification
language refuses or times out. Combined with raw GLM PASS on the identical
semantic prompt, this narrows the primary failure to the selected Qwen
model's behavior rather than the generic Hermes integration, browser
integration, or an injected Hermes wrapper.

## Browser read/write without send

Hermes resolves `browser.cdp_url` to `http://127.0.0.1:9222`. Because neither
model lane completed all Hermes controller prerequisites, no model-driven
browser action was attempted. The permitted semantic CDP fallback proved the
browser boundary directly:

1. attached to the authenticated fresh ChatGPT page;
2. wrote `HERMES_AB_COMPOSER_TEST_20260910T002658799Z` into the composer;
3. verified the exact marker in the DOM;
4. cleared it and verified an empty composer;
5. verified user/assistant turns remained `0/0` throughout.

`COMPOSER_WRITE_WITHOUT_SEND=PASS_DIRECT_CDP_FALLBACK` and
`SEND_ACTION_PERFORMED=NO`. Qwen/GLM Hermes composer actions are separately
`NOT_ATTEMPTED` because their controller prerequisites failed.

## Decision

```text
RESULT=PASS
RAW_AB=QWEN_FAIL / GLM_PASS
ROOT_CAUSE=QWEN_MODEL_BEHAVIOR
CORRECTION_APPLIED=NO
QWEN_AFTER_CORRECTION=NOT_RUN
GLM_CLASSIFICATION=DIAGNOSTIC_CONTROL_PASS
ISSUE_73_PHASE_C=PASS
PHASE_D=OPEN
PHASE_D_PASS=NO
NEXT=ARCHITECTURE_DECISION_REQUIRED_QWEN_CONTROLLER
```

No Qwen correction was applied. The effective transport/template does not
introduce the refusal, V12 already showed that a bounded non-authorizing
prompt correction does not recover the action, and changing the model is
explicitly outside this task. The next step is therefore an architecture
decision about the Qwen controller boundary. This report does not make that
decision and does not authorize GLM promotion.

## Safety accounting

```text
CHATGPT_WEB_MESSAGES_SENT=0
PRODUCTION_DISPATCH=0
CANDIDATE_EXECUTION=0
V1_TICK_CALLS=0
N8N_MUTATION=0
VPS_MUTATION=0
CREDENTIAL_PERSISTENCE=0
AUTOMATED_LOGIN=0
GLM_PROMOTION=0
PHASE_D_PASS_CLAIM=0
```

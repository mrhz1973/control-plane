# Qwen Hermes controller profile tool-emission qualification V1

TASK_REF=V4_QWEN_HERMES_CONTROLLER_PROFILE_TOOL_EMISSION_QUALIFICATION_V1
ISSUE=73
BASE_HEAD=78c1c9d39ed01776bfa0086c53ee5582adba5aa7

## Diagnosis

FAILED_RUN_PROFILE_ID=qwen38-opus-q3-opencode-64k
FAILED_RUN_CONTROL_PLANE_ELIGIBLE=NO
FAILED_RUN_TOOL_COUNT_PRESENTED=12
FAILED_RUN_TOOL_NAMES_PRESENTED=browser_back,browser_cdp,browser_click,browser_console,browser_dialog,browser_get_images,browser_navigate,browser_press,browser_scroll,browser_snapshot,browser_type,browser_vision
FAILED_RUN_TOOL_CHOICE=UNSPECIFIED_DEFAULT
FAILED_RUN_FINISH_REASON=UNKNOWN
FAILED_RUN_TOOL_CALL_COUNT=0

The failed one-shot explicitly selected the workstation manual OpenCode 64K
profile. The canonical policy marks that profile `control_plane_eligible=false`,
`auto_route=false`, `wf40=false`, and `scope_v3=false`.

The installed Hermes CLI browser toolset resolves to the 12 schemas listed
above and the request builder forwards the resolved tools to the
OpenAI-compatible chat-completions request. No specific function was forced.
The failed run produced no observed tool call and no browser action. The
installed browser toolset includes `browser_cdp` as a schema, but it was not
called and no controller capability was changed by this task.

TOOLS_PRESENTED_BUT_MODEL_DID_NOT_CALL=YES
ROOT_CAUSE_CLASSIFICATION=HERMES_FAILED_PROFILE_OUT_OF_SCOPE

## Canonical agent-24k qualification

AGENT24K_PROFILE_ID=qwen38-opus-q3-agent-24k
AGENT24K_CONTROL_PLANE_ELIGIBLE=YES
AGENT24K_TOOL_SCHEMA_PRESENTED=YES
AGENT24K_TOOL_CHOICE=auto
AGENT24K_FINISH_REASON=tool_calls
AGENT24K_TOOL_CALL_COUNT=1
AGENT24K_TOOL_EMISSION_RESULT=PASS

One bounded local request was sent to the canonical loopback Qwen endpoint
`http://127.0.0.1:8080/v1/chat/completions` with one minimal no-op function
schema. The response contained one structured function call. The returned
call was captured as metadata only and was never dispatched.

DAILY16K_COMPARISON_RUN=NO
DAILY16K_TOOL_EMISSION_RESULT=NOT_RUN
QWEN_GENERATIONS=1

## Answers and boundaries

The failed Hermes controller did not use a Control Plane-eligible profile.
Browser schemas were present in the effective Hermes browser toolset; the
failed model did not call one. The canonical agent-24k profile naturally
emitted a structured tool call with `tool_choice=auto`.

The next fix is profile selection only, followed by a separately scoped
Hermes agent-24k native-browser-send qualification. Hermes wiring and
production routing were not changed here.

CONTROLLER_TOOL_EMISSION_DIAGNOSIS_COMPLETE=YES
RECOMMENDED_NEXT_SCOPE=V4_HERMES_CONTROLLER_AGENT24K_NATIVE_BROWSER_SEND_QUALIFICATION_V1

## Safety accounting

CHATGPT_WEB_SENDS=0
GLM_CALLS=0
CODEX_CALLS=0
OPENAI_API_CALLS=0
PRODUCTION_DISPATCH=0
CDP_MUTATION=0
BROWSER_INTERACTION=0
V1_TICK=0
PHASE_C=PASS
PHASE_D=OPEN
ROUTING_CHANGED=NO
HERMES_CONFIGURATION_CHANGED=NO
QWEN_CONFIGURATION_CHANGED=NO

Focused deterministic checks: `tests/qwen-hermes-controller-profile-tool-emission-v1/run.mjs`.
No prompt transcript, model prose, credentials, cookies, tokens, or
chain-of-thought was persisted.

NEXT=V4_HERMES_CONTROLLER_AGENT24K_NATIVE_BROWSER_SEND_QUALIFICATION_V1

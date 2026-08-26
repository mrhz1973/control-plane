# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_BIGMODEL_CN_OFFICIAL_OPENCLAW_CODING_PLAN_CONFIG_DELTA_DIAGNOSIS
result_cursor: PASS
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 2490d8e353ba15d1e357a512db21ff5ef4433cd7
workspace: clean

OPENCLAW_VERSION: 2026.8.1-beta.3
ZAI_PLUGIN_VERSION: 2026.8.1-beta.3

CURRENT_PROVIDER_ID: zai
CURRENT_PROFILE_ID: zai:manual
CURRENT_AUTH_TYPE: api_key
CURRENT_BASE_URL: https://open.bigmodel.cn/api/coding/paas/v4
CURRENT_API_STYLE: openai-completions
CURRENT_MODEL_IDS: "catalog-visible includes glm-5.2,glm-5-turbo,glm-4.7,glm-5.3; authored models.providers.zai.models=[]"
CURRENT_PRIMARY_MODEL: openai/gpt-5.6-sol

OFFICIAL_PROVIDER_ID: zai
OFFICIAL_PROVIDER_LABEL: Z.AI
OFFICIAL_PRODUCT_ID: coding-cn
OFFICIAL_PRODUCT_LABEL: Coding-Plan-CN
OFFICIAL_AUTH_PROFILE_PATTERN: "zai:<id> api_key (plugin default id pattern zai:default)"
OFFICIAL_AUTH_TYPE: api_key
OFFICIAL_BASE_URL: https://open.bigmodel.cn/api/coding/paas/v4
OFFICIAL_API_STYLE: openai-completions
OFFICIAL_DEFAULT_MODEL: glm-5.3
OFFICIAL_MODEL_IDS: "installed catalog: glm-5.3,glm-5.2,glm-5-turbo,glm-5v-turbo,glm-5.1; coding probe prefers glm-5.3 then glm-5.1/glm-4.7"
OFFICIAL_PROVIDER_PLUGIN: "@openclaw/zai-provider"
OFFICIAL_PROVIDER_ADAPTER: "openai-completions + wrapZaiStreamFn (thinking/reasoning_effort/tool_stream)"
OFFICIAL_REQUIRED_EXTRA_FIELDS: "none beyond api_key + baseUrl for coding-cn; onboard also sets primaryModelRef zai/glm-5.3 and catalog aliases"

PROFILE_NAME_ONLY_DIFFERENCE: true
OFFICIAL_PRODUCT_FLAG_PRESENT: "method coding-cn at onboard only; not persisted as separate provider product flag"
OFFICIAL_REGION_FLAG_PRESENT: "encoded by coding-cn -> open.bigmodel.cn coding baseUrl"
OFFICIAL_CODING_PLAN_FLAG_PRESENT: "encoded by coding-* endpoint/baseUrl selection"
OFFICIAL_SPECIAL_HEADER_NAMES: none
OFFICIAL_SPECIAL_REQUEST_TRANSFORM: "none coding-cn-specific beyond baseUrl + coding default model selection"
CURRENT_EQUIVALENT_PRESENT: "current baseUrl equals ZAI_CODING_CN_BASE_URL; same provider/api/adapter"

CURRENT_REQUEST_ADAPTER: "zai openai-completions wrapZaiStreamFn"
OFFICIAL_REQUEST_ADAPTER: "zai openai-completions wrapZaiStreamFn"
REQUEST_ADAPTER_MATCH: true

PROVIDER_ID_MATCH: true
PRODUCT_ID_MATCH: true
AUTH_PROFILE_TYPE_MATCH: true
BASE_URL_MATCH: true
API_STYLE_MATCH: true
MODEL_MAPPING_MATCH: "partial"
HEADER_NAME_SET_MATCH: true
PAYLOAD_TRANSFORM_MATCH: true
CODING_PLAN_PRODUCT_FLAG_MATCH: true
REGION_MAPPING_MATCH: true

DELTA_PROVIDER: none
DELTA_PRODUCT: none
DELTA_AUTH_PROFILE: "profile id zai:manual vs official default pattern zai:default; type api_key equivalent"
DELTA_BASE_URL: none
DELTA_API_STYLE: none
DELTA_ADAPTER: none
DELTA_MODEL_MAPPING: "official Coding-Plan-CN onboard primary defaults to zai/glm-5.3; current agent primary is openai/gpt-5.6-sol; authored zai.models=[]"
DELTA_HEADERS: none
DELTA_PAYLOAD: none
DELTA_PRODUCT_FLAG: none
DELTA_REGION: none

PRESETS:
  - {PRESET_ID: zai-global, PRESET_BASE_URL: https://api.z.ai/api/paas/v4, PRESET_PRODUCT_TYPE: general, PRESET_REGION: global}
  - {PRESET_ID: zai-cn, PRESET_BASE_URL: https://open.bigmodel.cn/api/paas/v4, PRESET_PRODUCT_TYPE: general, PRESET_REGION: cn}
  - {PRESET_ID: zai-coding-global, PRESET_BASE_URL: https://api.z.ai/api/coding/paas/v4, PRESET_PRODUCT_TYPE: coding, PRESET_REGION: global}
  - {PRESET_ID: zai-coding-cn, PRESET_BASE_URL: https://open.bigmodel.cn/api/coding/paas/v4, PRESET_PRODUCT_TYPE: coding, PRESET_REGION: cn}

CURRENT_BASE_URL_MATCHES_OFFICIAL_CODING_CN: true

RAW_DIRECT_API_CONTROL_HTTP500_OBSERVED: true
DIRECT_RAW_REQUEST_IS_SUPPORTED_TOOL_EQUIVALENCE_TEST: false

ROOT_CAUSE_CLASSIFICATION: CURRENT_CONFIG_SEMANTICALLY_MATCHES_OFFICIAL_CODING_PLAN_CN

PROVIDER_REQUEST_COUNT: 0
MODEL_INVOCATION_COUNT: 0
DIRECT_API_REQUEST_COUNT: 0
OPENCLAW_INFER_INVOCATION_COUNT: 0
CURSOR_GLM_REQUEST_COUNT: 0
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0

SECRET_VALUE_READ: false
SECRET_VALUES_PERSISTED: false

AUTH_MUTATION: false
CONFIG_MUTATION: false
PROFILE_MUTATION: false
ENDPOINT_MUTATION: false
RUNTIME_MUTATION: false

NEXT_GATE_CLASSIFICATION: GLM_BIGMODEL_CN_PROVIDER_CLIENT_SPECIFIC_SUPPORT_GATE_REQUIRED
```

## Evidence boundary

Read-only comparison only. Installed OpenClaw maps `zai-coding-cn` / Coding-Plan-CN to provider `zai`, api `openai-completions`, baseUrl `https://open.bigmodel.cn/api/coding/paas/v4`, default model `glm-5.3`. Current `zai:manual` + same baseUrl uses the same request adapter; no coding-cn-specific header/payload fork exists beyond baseUrl. Profile id naming differs only. Primary model is not the official Coding Plan default, but that is not a provider-adapter mismatch. Prior raw direct HTTP 500 is recorded and is not treated as a supported-tool equivalence test. No requests/mutations/secrets.

## Completion persistence invariant

Per i task Cursor successivi, il report finale non deve restare soltanto nella chat Cursor.

Prima di dichiarare il task completamente chiuso, Cursor deve persistere in GitHub un aggiornamento docs-only di questo file con almeno:

- `task_ref` esatto;
- risultato `PASS|BLOCKED|FAILED`;
- evidence deterministica necessaria al gate/NEXT;
- HEAD/workspace osservati quando pertinenti;
- eventuali mutazioni runtime effettuate;
- `NEXT_GATE_CLASSIFICATION` o blocker esatto;
- nessun secret/token.

La persistenza del report è evidence bookkeeping recuperabile e non amplia lo scope runtime del task.

Se `agg` trova un `LAST_CURSOR_REPORT` che non corrisponde al pass Cursor atteso, deve classificare **`EVIDENCE_NOT_PERSISTED`**, non concludere che il task non sia stato eseguito.

## History

La cronologia precedente del rolling report resta recuperabile nella Git history. Il file corrente privilegia il LATEST necessario a `agg` e al resume lean.

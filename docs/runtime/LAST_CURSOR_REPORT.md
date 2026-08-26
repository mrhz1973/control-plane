# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_ZAI_PROVIDER_AUTH_READ_ONLY_DIAGNOSIS
result_cursor: PASS
reported_via: cursor_direct_persistence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: cb5673e520579078e91d10f088dd788f25a5027f
workspace: clean

OPENCLAW_VERSION: 2026.8.1-beta.3 (5831b80)
ZAI_PLUGIN_VERSION: 2026.8.1-beta.3

ZAI_PLUGIN_ROOT: /root/.openclaw/npm/projects/openclaw-zai-provider-aefca72c67__openclaw-generation__g-96c590d7dce25b66/node_modules/@openclaw/zai-provider
OPENCLAW_CORE_ROOT: /opt/openclaw-app/node_modules/openclaw

PLUGIN_DECLARED_MODEL_REF: zai/glm-5.3
PLUGIN_DECLARED_BASE_ENDPOINT: "https://api.z.ai/api/paas/v4"
PLUGIN_AUTH_SCHEME: "Bearer api_key (openai-completions)"
PLUGIN_EXPECTED_CREDENTIAL_CLASS: api_key
PLUGIN_PRODUCT_OR_PLAN_HINT: "docs: glm-5.3 is Coding Plan default; plugin setup also offers coding-global/coding-cn vs general zai-global/zai-cn"
PLUGIN_DOCUMENTED_KEY_SOURCE: "Z.AI console API key; env ZAI_API_KEY / Z_AI_API_KEY; onboard --auth-choice zai-api-key|zai-coding-global|..."

CONFIG_ZAI_PROVIDER_PRESENT: true
CONFIG_ZAI_PROFILE_ID: "zai:manual"
CONFIG_ZAI_AUTH_TYPE: api_key
CONFIG_ZAI_BASE_ENDPOINT_PRESENT: false
CONFIG_ZAI_BASE_ENDPOINT_SANITIZED: null
CONFIG_EXPLICIT_MODEL_MAPPING: false
CONFIG_DEFAULT_PROFILE_SELECTION: "auth.profiles.zai:manual mode=api_key; plugins.entries.zai enabled with empty config"

AUTH_PROFILE_ID: "zai:manual"
AUTH_PROVIDER_ID: zai
AUTH_PROFILE_TYPE: api_key
AUTH_PROFILE_ACTIVE: true
AUTH_PROFILE_STORE: "~/.openclaw/state/openclaw.sqlite auth_profile_stores"
AUTH_PROFILE_SELECTION_RULE: "provider zai -> profile zai:manual (api_key); preferProfileFirst=true on profile apply"

CREDENTIAL_RESOLUTION_ORDER: "explicit profileId (if set) -> scoped auth profile store api_key -> env/setup fallbacks (ZAI_API_KEY, Z_AI_API_KEY) when no usable profile path"
ENV_OVERRIDE_SUPPORTED: true
ENV_OVERRIDE_NAMES: ["ZAI_API_KEY", "Z_AI_API_KEY"]
STALE_ENV_CREDENTIAL_OVERRIDE_POSSIBLE: true
STALE_ENV_CREDENTIAL_OVERRIDE_CONFIRMED_BY_PRESENCE: false
ENV_PRESENCE: "ZAI_API_KEY=absent; Z_AI_API_KEY=absent"

GLM53_ENDPOINT_CLASS: "coding-plan (per installed openclaw docs/providers/zai.md); plugin modelCatalog baseUrl currently general paas/v4"
GLM53_EXPECTED_CREDENTIAL_CLASS: api_key
GLM53_EXPECTED_PRODUCT_OR_PLAN: "Coding Plan (documented for zai/glm-5.3)"
STANDARD_API_KEY_COMPATIBLE: unknown
CODING_PLAN_KEY_REQUIRED: unknown
OPERATOR_KEY_SOURCE_CONFIRMATION_REQUIRED: true

DOCUMENTED_CODING_PLAN_BASE: "https://api.z.ai/api/coding/paas/v4"
DOCUMENTED_GENERAL_API_BASE: "https://api.z.ai/api/paas/v4"
PRIOR_SMOKE_URL_OBSERVED: "https://api.z.ai/api/paas/v4/chat/completions"

ENDPOINT_MATCH: "plugin-catalog-baseUrl == prior smoke general paas URL (true); documented glm-5.3 Coding Plan URL != effective general paas URL (false)"
MODEL_PROVIDER_BINDING_MATCH: true
AUTH_PROFILE_PROVIDER_BINDING_MATCH: true

STORED_KEY_STRUCTURAL_INTEGRITY: "malformed: exact half-duplication / double-paste pattern; key_dot_parts=3 (expected single id.secret shape)"
PLUGIN_AUTH_PATH_CONSISTENT: true
LOCAL_ROOT_CAUSE_FOUND: true
LOCAL_ROOT_CAUSE_CLASS: ZAI_STORED_API_KEY_DOUBLE_PASTE_MALFORMED
SECONDARY_LOCAL_FACTOR: ZAI_GLM53_CODING_PLAN_ENDPOINT_NOT_CONFIGURED
DIAGNOSIS_CLASSIFICATION: ZAI_STORED_CREDENTIAL_MALFORMED_DOUBLE_PASTE_CONFIRMED

AUTH_SECRET_VALUE_READ: false
PROVIDER_REQUEST_COUNT: 0
MODEL_INVOCATION_COUNT: 0
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

AUTH_MUTATION: false
CONFIG_MUTATION: false
ENV_MUTATION: false
CORE_PLUGIN_MUTATION: false
SERVICE_MUTATION: false
SECRET_VALUES_PERSISTED: false

NEXT_GATE_CLASSIFICATION: GLM_ZAI_AUTH_CONFIG_REMEDIATION_GATE_REQUIRED
```

## Evidence boundary

Read-only diagnosis on VPS `ionos-n8n`. No provider HTTP, no model invocation, no auth/config/env mutation. Local auth-store metadata shows profile `zai:manual` present but stored API key structurally malformed (exact half-duplication / double-paste), which alone explains provider HTTP 401 after a “successful” local refresh. Env overrides `ZAI_API_KEY`/`Z_AI_API_KEY` absent. Installed docs also state `zai/glm-5.3` is Coding Plan-oriented (`…/api/coding/paas/v4`) while effective/plugin-catalog path used general `…/api/paas/v4` with no configured baseUrl override—secondary factor after credential repair. No secret values persisted.

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

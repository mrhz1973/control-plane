# LAST CURSOR REPORT — control-plane (rolling)

**Ruolo:** evidence rolling dell'ultimo pass Cursor completato. Non è LIVE STATE e non sostituisce `CURRENT_FRONTIER.md`.

## LATEST

```yaml
task_ref: GLM_ZAI_CODING_PLAN_HTTP500_READ_ONLY_DIAGNOSIS
result_cursor: PASS
reported_via: cursor_direct_persistence
independent_verification: cursor_runtime_evidence
report_persistence_commit: PENDING_SELF_REFERENCE

repo_head_observed_at_task: 732093320632b5a6cb183386d4db19cc708eb6a9
workspace: clean

OPENCLAW_VERSION: 2026.8.1-beta.3
ZAI_PLUGIN_VERSION: 2026.8.1-beta.3

EFFECTIVE_ZAI_BASE_ENDPOINT: https://api.z.ai/api/coding/paas/v4

GLM53_PLUGIN_DECLARED: true
GLM52_PLUGIN_DECLARED: true
GLM51_PLUGIN_DECLARED: true
GLM5_PLUGIN_DECLARED: true

GLM52_CODING_PLAN_EXPLICITLY_SUPPORTED: true
GLM52_GENERAL_API_EXPLICITLY_SUPPORTED: true
GLM52_CODING_PLAN_SUPPORT_EVIDENCE: "docs/providers/zai.md: catalog labels glm-5.2 as General API default; Coding Plan default is glm-5.3; Note states Z.AI currently routes Coding Plan requests for GLM-5.2 and GLM-5.1 to GLM-5.3. Plugin detect.js coding probes verify glm-5.3 then glm-5.1/glm-4.7 fallbacks — not glm-5.2."
GLM52_MODEL_ID_SENT_TO_PROVIDER: glm-5.2

CODING_PLAN_DEFAULT_MODEL: glm-5.3
CODING_PLAN_DOCUMENTED_MODEL_SET: "glm-5.3 (default); auto-detect fallbacks glm-5.1 then glm-4.7; glm-5.2/glm-5.1 Coding Plan requests documented as routed to glm-5.3"
CODING_PLAN_MODEL_SELECTION_RULE: "Coding Plan onboard/preset selects ZAI_CODING_DEFAULT_MODEL_ID=glm-5.3 when baseUrl is coding/paas; general selects glm-5.2"
GLM52_ENTITLEMENT_COMPATIBILITY: undocumented

REQUEST_API_STYLE: openai-completions
REQUEST_PATH: "{baseUrl}/chat/completions"
REQUEST_MODEL_FIELD: "model=<requested id> (glm-5.2)"
REQUEST_MESSAGES_FORMAT: "OpenAI chat messages[]"
REQUEST_STREAM_SETTING: "infer path uses provider stream wrapper; detect probes use stream=false"
REQUEST_OPTIONAL_FIELDS: "thinking/reasoning_effort by model family; tool_stream default true; no coding-vs-general payload fork beyond baseUrl"

REQUEST_CONTRACT_MATCH: true
REQUEST_CONTRACT_MISMATCH: none

EXISTING_PROVIDER_ERROR_DETAIL_AVAILABLE: false
SANITIZED_EXISTING_PROVIDER_ERROR_DETAIL: none

ROOT_CAUSE_CLASSIFICATION: LOCAL_STACK_CONSISTENT_PROVIDER_HTTP500_UNEXPLAINED

PROVIDER_REQUEST_COUNT: 0
MODEL_INVOCATION_COUNT: 0
CODEX_INVOCATION_COUNT: 0
QWEN_INVOCATION_COUNT: 0

AUTH_MUTATION: false
CONFIG_MUTATION: false
ENDPOINT_MUTATION: false
CREDENTIAL_REENTRY: false
CORE_PLUGIN_MUTATION: false
GATEWAY_MUTATION: false
SERVICE_MUTATION: false
N8N_MUTATION: false
DOCKER_MUTATION: false
TAILSCALE_MUTATION: false
SECRET_VALUES_PERSISTED: false

PORT_18789_AFTER: free
GATEWAY_RUNNING_AFTER: false

NEXT_GATE_CLASSIFICATION: GLM_ZAI_PROVIDER_SIDE_VERIFICATION_OR_SUPPORT_GATE_REQUIRED
```

## Evidence boundary

Read-only diagnosis only. Effective baseUrl remains Coding Plan. Catalog/docs: glm-5.2 = General API default; glm-5.3 = Coding Plan default; Coding Plan glm-5.2 requests documented as routed to glm-5.3. Offline plugin/core trace: same openai-completions `/chat/completions` contract for general vs Coding Plan aside from baseUrl; no local request-contract mismatch found. Prior smoke error detail remains only generic HTTP 500. No provider/model call in this task. Root cause: local stack consistent; provider HTTP 500 unexplained locally.

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

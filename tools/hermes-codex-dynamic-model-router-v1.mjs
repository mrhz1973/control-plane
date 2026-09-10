/**
 * Hermes -> Codex app-server dynamic model router.
 *
 * The live Codex app-server model/list response is the only model authority.
 * This module deliberately contains no model allowlist and never falls back
 * from an explicitly requested model.
 */

export const ROUTE = Object.freeze({
  controller_lane: "CODEX_SUBSCRIPTION",
  quota_pool: "chatgpt_codex_subscription",
  catalog_source: "codex_app_server:model/list",
});

export const MODEL_SELECTION_MODE = Object.freeze({
  EXPLICIT: "EXPLICIT",
  NATIVE_DEFAULT: "NATIVE_DEFAULT",
});

export class DynamicModelRouterError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "DynamicModelRouterError";
    this.code = code;
    this.details = details;
  }
}

const asNonEmptyString = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

function sanitizeModel(raw) {
  const id = asNonEmptyString(raw?.id ?? raw?.model);
  const model = asNonEmptyString(raw?.model ?? raw?.id);
  if (!id || !model) return null;
  const efforts = Array.isArray(raw?.supportedReasoningEfforts)
    ? raw.supportedReasoningEfforts
        .map((entry) =>
          typeof entry === "string"
            ? entry
            : asNonEmptyString(entry?.reasoningEffort)
        )
        .filter(Boolean)
    : null;
  return Object.freeze({
    id,
    model,
    display_name: asNonEmptyString(raw?.displayName),
    description: asNonEmptyString(raw?.description),
    hidden: raw?.hidden === true,
    selectable: raw?.hidden !== true,
    is_default: raw?.isDefault === true,
    supported_reasoning_efforts: efforts,
    default_reasoning_effort:
      asNonEmptyString(raw?.defaultReasoningEffort) ?? null,
    input_modalities: Array.isArray(raw?.inputModalities)
      ? raw.inputModalities.filter((value) => typeof value === "string")
      : [],
    upgrade: raw?.upgrade ?? null,
    upgrade_info: raw?.upgradeInfo ?? null,
  });
}

function requireRpc(rpc) {
  if (!rpc || typeof rpc.request !== "function") {
    throw new TypeError("router requires an app-server rpc.request function");
  }
}

function effectiveModel(result) {
  return asNonEmptyString(result?.model);
}

function modelFor(catalog, requestedModel) {
  const model = catalog.models.find(
    (candidate) => candidate.id === requestedModel
  );
  if (!model || !model.selectable) {
    throw new DynamicModelRouterError(
      "MODEL_NOT_AVAILABLE",
      `requested Codex model is not available/selectable: ${requestedModel}`,
      { requested_model: requestedModel }
    );
  }
  return model;
}

export async function discoverLiveCatalog(
  rpc,
  { limit = 100, now = () => new Date().toISOString() } = {}
) {
  requireRpc(rpc);
  const models = [];
  const seenCursors = new Set();
  let cursor = null;
  let pages = 0;

  try {
    do {
      const params = { includeHidden: false, limit };
      if (cursor !== null) params.cursor = cursor;
      const response = await rpc.request("model/list", params);
      if (!response || !Array.isArray(response.data)) {
        throw new Error("model/list response has no data array");
      }
      for (const raw of response.data) {
        const model = sanitizeModel(raw);
        if (model) models.push(model);
      }
      pages += 1;
      const next = response.nextCursor ?? null;
      if (next !== null && typeof next !== "string") {
        throw new Error("model/list nextCursor is not a string or null");
      }
      if (next !== null && seenCursors.has(next)) {
        throw new Error("model/list pagination cursor repeated");
      }
      if (next !== null) seenCursors.add(next);
      cursor = next;
    } while (cursor !== null);
  } catch (error) {
    throw new DynamicModelRouterError(
      "CATALOG_UNAVAILABLE",
      `live Codex model catalog unavailable: ${error.message}`,
      { cause: error.message }
    );
  }

  if (models.length === 0) {
    throw new DynamicModelRouterError(
      "CATALOG_UNAVAILABLE",
      "live Codex model catalog is empty",
      { pages }
    );
  }

  const ids = new Set();
  for (const model of models) {
    if (ids.has(model.id)) {
      throw new DynamicModelRouterError(
        "CATALOG_INVALID",
        `live Codex model catalog contains duplicate id: ${model.id}`
      );
    }
    ids.add(model.id);
  }

  return Object.freeze({
    source: ROUTE.catalog_source,
    refreshed_at: now(),
    state: "LIVE",
    pages,
    models: Object.freeze(models),
  });
}

export function reasoningEfforts(model) {
  if (!Array.isArray(model?.supported_reasoning_efforts)) {
    return Object.freeze({
      state: "NOT_ADVERTISED",
      efforts: Object.freeze([]),
      default_effort: model?.default_reasoning_effort ?? null,
    });
  }
  return Object.freeze({
    state: "ADVERTISED",
    efforts: Object.freeze([...model.supported_reasoning_efforts]),
    default_effort: model.default_reasoning_effort,
  });
}

export function makeReceipt({
  requestedModel = null,
  selectedModel = null,
  selectionMode = MODEL_SELECTION_MODE.EXPLICIT,
  catalog,
  reasoningRequested = null,
  reasoningSelected = null,
  reasoningSupported = null,
  codexAuthState = "UNKNOWN",
}) {
  const explicit = selectionMode === MODEL_SELECTION_MODE.EXPLICIT;
  const exact = explicit && requestedModel === selectedModel;
  return Object.freeze({
    schema_version: "hermes-codex-dynamic-model-router-v1",
    controller_lane: ROUTE.controller_lane,
    requested_model: requestedModel,
    selected_model: selectedModel,
    selection_mode: selectionMode,
    selection_exact: exact,
    catalog_source: catalog?.source ?? null,
    catalog_freshness: catalog?.refreshed_at ?? null,
    model_available: Boolean(selectedModel),
    reasoning_effort_requested: reasoningRequested,
    reasoning_effort_selected: reasoningSelected,
    reasoning_effort_supported: reasoningSupported,
    codex_auth_state: codexAuthState,
    quota_pool: ROUTE.quota_pool,
    fallback_used: false,
    openai_api_used: false,
    byok_used: false,
  });
}

export class DynamicCodexModelRouter {
  constructor({
    rpc,
    codexAuthState = "UNKNOWN",
    now = () => new Date().toISOString(),
    retireCurrentSession = null,
    threadDefaults = {},
  } = {}) {
    requireRpc(rpc);
    this.rpc = rpc;
    this.codexAuthState = codexAuthState;
    this.now = now;
    this.retireCurrentSession = retireCurrentSession;
    this.threadDefaults = { ...threadDefaults };
    this.catalog = null;
    this.current = null;
    this.requestedEffort = null;
    this.sessionState = "NO_SESSION";
  }

  async listModels() {
    this.catalog = await discoverLiveCatalog(this.rpc, { now: this.now });
    return this.catalog;
  }

  async getModel(modelId) {
    if (!asNonEmptyString(modelId)) {
      throw new DynamicModelRouterError(
        "MODEL_REQUIRED",
        "a model id is required"
      );
    }
    const catalog = await this.listModels();
    return modelFor(catalog, modelId);
  }

  async listReasoningEfforts(modelId = this.current?.id) {
    if (!modelId) {
      throw new DynamicModelRouterError(
        "MODEL_REQUIRED",
        "a model is required to list reasoning efforts"
      );
    }
    return reasoningEfforts(await this.getModel(modelId));
  }

  async setReasoningEffort(effort, { modelId = this.current?.id } = {}) {
    const value = asNonEmptyString(effort);
    if (!value) {
      throw new DynamicModelRouterError(
        "REASONING_EFFORT_REQUIRED",
        "reasoning effort must be a non-empty string"
      );
    }
    if (!asNonEmptyString(modelId)) {
      throw new DynamicModelRouterError(
        "MODEL_REQUIRED",
        "a model is required to set reasoning effort"
      );
    }
    const model = await this.getModel(modelId);
    const advertised = reasoningEfforts(model);
    if (
      advertised.state !== "ADVERTISED" ||
      !advertised.efforts.includes(value)
    ) {
      throw new DynamicModelRouterError(
        "REASONING_EFFORT_NOT_SUPPORTED",
        `reasoning effort is not supported by ${model.id}: ${value}`,
        { model_id: model.id, requested_effort: value }
      );
    }
    this.requestedEffort = value;
    return {
      model_id: model.id,
      reasoning_effort_requested: value,
      reasoning_effort_selected: value,
      reasoning_effort_control: "ADVERTISED",
    };
  }

  async setModel(modelId, { reasoningEffort = null, thread = {} } = {}) {
    const requested = asNonEmptyString(modelId);
    if (!requested) {
      throw new DynamicModelRouterError(
        "MODEL_REQUIRED",
        "explicit SET_MODEL requires a model id"
      );
    }
    const catalog = await this.listModels();
    const candidate = modelFor(catalog, requested);
    let selectedEffort = null;
    if (reasoningEffort !== null) {
      const advertised = reasoningEfforts(candidate);
      if (
        advertised.state !== "ADVERTISED" ||
        !advertised.efforts.includes(reasoningEffort)
      ) {
        throw new DynamicModelRouterError(
          "REASONING_EFFORT_NOT_SUPPORTED",
          `reasoning effort is not supported by ${candidate.id}: ${reasoningEffort}`,
          { model_id: candidate.id, requested_effort: reasoningEffort }
        );
      }
      selectedEffort = reasoningEffort;
    }
    if (this.retireCurrentSession && this.sessionState === "ACTIVE") {
      await this.retireCurrentSession();
      this.sessionState = "RETIRED_FOR_MODEL_SWITCH";
    }
    let result;
    try {
      result = await this.rpc.request("thread/start", {
        ...this.threadDefaults,
        ...thread,
        model: candidate.id,
      });
    } catch (error) {
      throw new DynamicModelRouterError(
        "MODEL_SELECTION_FAILED",
        `Codex could not start the requested model ${candidate.id}: ${error.message}`,
        { requested_model: candidate.id, cause: error.message }
      );
    }
    const selected = effectiveModel(result);
    if (selected !== candidate.id) {
      throw new DynamicModelRouterError(
        "EFFECTIVE_MODEL_MISMATCH",
        `Codex selected ${selected ?? "no model"} for requested ${candidate.id}`,
        { requested_model: candidate.id, selected_model: selected }
      );
    }
    this.current = Object.freeze({
      ...candidate,
      thread_id: asNonEmptyString(result?.thread?.id) ?? null,
    });
    this.sessionState = "ACTIVE";
    this.requestedEffort = selectedEffort;
    return makeReceipt({
      requestedModel: candidate.id,
      selectedModel: selected,
      catalog,
      reasoningRequested: this.requestedEffort,
      reasoningSelected: this.requestedEffort,
      reasoningSupported: reasoningEfforts(candidate).state === "ADVERTISED",
      codexAuthState: this.codexAuthState,
    });
  }

  async useNativeDefault({ thread = {} } = {}) {
    const catalog = await this.listModels();
    const result = await this.rpc.request("thread/start", {
      ...this.threadDefaults,
      ...thread,
    });
    const selected = effectiveModel(result);
    if (!selected) {
      throw new DynamicModelRouterError(
        "EFFECTIVE_MODEL_UNKNOWN",
        "native Codex default did not expose an effective model"
      );
    }
    const candidate = catalog.models.find((model) => model.id === selected);
    if (!candidate) {
      throw new DynamicModelRouterError(
        "EFFECTIVE_MODEL_NOT_IN_CATALOG",
        `native default is not present in the live catalog: ${selected}`
      );
    }
    this.current = Object.freeze({
      ...candidate,
      thread_id: asNonEmptyString(result?.thread?.id) ?? null,
    });
    this.sessionState = "ACTIVE";
    this.requestedEffort = null;
    return makeReceipt({
      requestedModel: null,
      selectedModel: selected,
      selectionMode: MODEL_SELECTION_MODE.NATIVE_DEFAULT,
      catalog,
      reasoningSupported: reasoningEfforts(candidate).state === "ADVERTISED",
      codexAuthState: this.codexAuthState,
    });
  }

  buildTurnStartParams(input) {
    if (!this.current) {
      throw new DynamicModelRouterError(
        "MODEL_NOT_SELECTED",
        "select a model or native default before starting a turn"
      );
    }
    const params = {
      threadId: this.current.thread_id,
      input: [{ type: "text", text: String(input) }],
      model: this.current.id,
    };
    if (this.requestedEffort !== null) params.effort = this.requestedEffort;
    return Object.freeze(params);
  }

  async startTurn(input, { threadId } = {}) {
    const params = { ...this.buildTurnStartParams(input) };
    if (threadId) params.threadId = threadId;
    if (!params.threadId) {
      throw new DynamicModelRouterError(
        "THREAD_REQUIRED",
        "Codex app-server turn requires the selected thread id"
      );
    }
    let response;
    try {
      response = await this.rpc.request("turn/start", params);
    } catch (error) {
      throw new DynamicModelRouterError(
        "MODEL_EXECUTION_FAILED",
        `Codex rejected the selected model ${this.current.id}: ${error.message}`,
        { selected_model: this.current.id, cause: error.message }
      );
    }
    if (!response?.turn) {
      throw new DynamicModelRouterError(
        "TURN_NOT_ACCEPTED",
        "Codex app-server did not accept the selected-model turn"
      );
    }
    return response;
  }
}

export async function validateAllSelectableModels(
  router,
  { thread = {} } = {}
) {
  const catalog = await router.listModels();
  const results = [];
  for (const model of catalog.models.filter((candidate) => candidate.selectable)) {
    try {
      const receipt = await router.setModel(model.id, { thread });
      results.push({ model_id: model.id, status: "PASS", receipt });
    } catch (error) {
      results.push({
        model_id: model.id,
        status: error.code === "MODEL_NOT_AVAILABLE" ? "ADVERTISED_NOT_SELECTABLE" : "STOP",
        error_code: error.code ?? "UNKNOWN",
      });
    }
  }
  const passed = results.filter((result) => result.status === "PASS").length;
  return Object.freeze({
    catalog_count: catalog.models.filter((model) => model.selectable).length,
    validated_count: passed,
    status: passed === results.length ? "PASS" : "STOP",
    results: Object.freeze(results),
  });
}

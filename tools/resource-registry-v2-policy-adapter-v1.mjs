#!/usr/bin/env node
/**
 * Resource-registry-v2 policy adapter.
 *
 * The registry is the only static authority for MODEL/ROLE -> ACCESS_SURFACE
 * -> QUOTA_POOL relationships.  This adapter exposes the small derived views
 * needed by existing consumers.  It deliberately does not collect quota,
 * discover concrete provider models, or select a route.
 *
 * The legacy projection ids returned here are compatibility identifiers from
 * the resource-registry-v2 contract.  They are not a second policy store.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REGISTRY_SCHEMA = "resource-registry-v2";
export const POLICY_ADAPTER_SCHEMA = "resource-registry-v2-policy-adapter-v1";
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_REGISTRY_PATH = resolve(ROOT, "configs/resources/registry.json");

export class RegistryPolicyError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "RegistryPolicyError";
    this.code = code;
    this.details = details;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requireObject(value, label) {
  if (!isObject(value)) {
    throw new RegistryPolicyError("REGISTRY_POLICY_INVALID", `${label} must be an object`);
  }
  return value;
}

/** Validate only the registry shape required by derived routing views. */
export function requireRegistryV2(registry) {
  if (!isObject(registry) || registry.schema_version !== REGISTRY_SCHEMA) {
    throw new RegistryPolicyError("REGISTRY_POLICY_INVALID", "registry schema_version is not resource-registry-v2");
  }
  for (const section of ["models", "access_surfaces", "quota_pools", "resources"]) {
    requireObject(registry[section], `registry.${section}`);
  }
  return registry;
}

/** Read the canonical static registry; no network or provider access occurs. */
export function loadCanonicalRegistryV2(registryPath = DEFAULT_REGISTRY_PATH) {
  const path = resolve(registryPath);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new RegistryPolicyError("REGISTRY_POLICY_UNAVAILABLE", "canonical registry could not be read", {
      cause: String(error?.message || error).slice(0, 160),
    });
  }
  return requireRegistryV2(parsed);
}

function requireModel(registry, modelId) {
  const model = registry.models[modelId];
  if (!isObject(model)) {
    throw new RegistryPolicyError("REGISTRY_POLICY_INVALID", `registry model is missing: ${modelId}`);
  }
  const surfaceId = nonEmptyString(model.default_access_surface);
  if (!surfaceId || !isObject(registry.access_surfaces[surfaceId])) {
    throw new RegistryPolicyError("REGISTRY_POLICY_INVALID", `model ${modelId} has no valid default access surface`);
  }
  return { model, surfaceId, surface: registry.access_surfaces[surfaceId] };
}

function requirePool(registry, poolId, context) {
  if (!nonEmptyString(poolId) || !isObject(registry.quota_pools[poolId])) {
    throw new RegistryPolicyError("REGISTRY_POLICY_INVALID", `${context} has no valid quota-pool binding`);
  }
  return poolId;
}

function projectionResource(registry, resourceId, context) {
  if (!isObject(registry.resources[resourceId])) {
    throw new RegistryPolicyError("REGISTRY_POLICY_INVALID", `${context} has no v1 projection resource: ${resourceId}`);
  }
  return resourceId;
}

function freezePolicy(policy) {
  return Object.freeze({
    schema_version: POLICY_ADAPTER_SCHEMA,
    ...policy,
  });
}

/**
 * Derive the Codex subscription route identity from the registry model class.
 * The concrete model catalog remains owned by the live Codex app-server.
 */
export function deriveCodexRoutePolicy(input) {
  const registry = requireRegistryV2(input);
  const { model, surfaceId, surface } = requireModel(registry, "codex_subscription_models");
  const poolId = requirePool(registry, surface.quota_pool_id, "codex subscription surface");
  const selection = isObject(model.model_selection_policy) ? model.model_selection_policy : {};
  if (selection.selection !== "dynamic" || selection.frozen_list === true) {
    throw new RegistryPolicyError("REGISTRY_POLICY_INVALID", "Codex registry model class must remain dynamically selected");
  }
  projectionResource(registry, "codex", "Codex subscription model class");
  return freezePolicy({
    policy_kind: "CODEX_SUBSCRIPTION",
    model_class_id: "codex_subscription_models",
    roles: Object.freeze(Array.isArray(model.roles) ? [...model.roles] : []),
    access_surface_id: surfaceId,
    quota_pool_id: poolId,
    auth_allowed: Object.freeze(Array.isArray(surface.auth?.allowed) ? [...surface.auth.allowed] : []),
    auth_forbidden: Object.freeze(Array.isArray(surface.auth?.forbidden) ? [...surface.auth.forbidden] : []),
    model_selection_policy: Object.freeze({ ...selection }),
    projection_resource_id: "codex",
  });
}

/**
 * Derive the supported-plan model group used by the GLM selector.
 * Model ids are discovered from registry metadata; no concrete list is frozen
 * in the selector.  An ambiguous supported-plan surface fails closed.
 */
export function deriveGlmRoutePolicy(input) {
  const registry = requireRegistryV2(input);
  const groups = new Map();
  for (const [modelId, model] of Object.entries(registry.models)) {
    if (!isObject(model) || !Array.isArray(model.roles)) continue;
    if (!model.roles.includes("planner") || !model.roles.includes("implementation_model")) continue;
    const surfaceId = nonEmptyString(model.default_access_surface);
    const surface = surfaceId ? registry.access_surfaces[surfaceId] : null;
    if (!isObject(surface) || surface.surface_type !== "supported_plan_client") continue;
    const poolId = nonEmptyString(surface.quota_pool_id);
    if (!poolId || !isObject(registry.quota_pools[poolId])) {
      throw new RegistryPolicyError("REGISTRY_POLICY_INVALID", `supported-plan model ${modelId} has no valid quota-pool binding`);
    }
    if (!groups.has(surfaceId)) groups.set(surfaceId, { surface, poolId, modelIds: [] });
    groups.get(surfaceId).modelIds.push(modelId);
  }
  if (groups.size !== 1) {
    throw new RegistryPolicyError("REGISTRY_POLICY_INVALID", "registry must expose exactly one supported-plan planner surface for the GLM route");
  }
  const [surfaceId, group] = [...groups.entries()][0];
  if (group.modelIds.length === 0) {
    throw new RegistryPolicyError("REGISTRY_POLICY_INVALID", "supported-plan surface has no planner model classes");
  }
  projectionResource(registry, "glm", "supported-plan model group");
  return freezePolicy({
    policy_kind: "SUPPORTED_PLAN_CLIENT",
    model_class_ids: Object.freeze([...group.modelIds]),
    access_surface_id: surfaceId,
    quota_pool_id: group.poolId,
    projection_resource_id: "glm",
  });
}

/** Representational-only registry surfaces are the only globally forbidden surfaces. */
export function deriveForbiddenSurfaceIds(input) {
  const registry = requireRegistryV2(input);
  return Object.freeze(
    Object.entries(registry.access_surfaces)
      .filter(([, surface]) => isObject(surface) && surface.representational_only === true)
      .map(([surfaceId]) => surfaceId),
  );
}

/**
 * Derive model-class -> v1 projection resource bindings.  The three named
 * class bindings are compatibility mappings mandated by the v2 contract;
 * GLM membership is derived from the supported-plan surface above.
 */
export function deriveModelResourceBindings(input) {
  const registry = requireRegistryV2(input);
  const bindings = {};
  for (const modelId of Object.keys(registry.models)) {
    if (isObject(registry.resources[modelId])) bindings[modelId] = modelId;
  }
  if (isObject(registry.models.codex_subscription_models)) bindings.codex_subscription_models = projectionResource(registry, "codex", "Codex model class");
  const hasSupportedPlanModels = Object.values(registry.models).some((model) => {
    const surface = model && registry.access_surfaces[model.default_access_surface];
    return isObject(model) && Array.isArray(model.roles) &&
      model.roles.includes("planner") && model.roles.includes("implementation_model") &&
      surface?.surface_type === "supported_plan_client";
  });
  if (hasSupportedPlanModels) {
    const glm = deriveGlmRoutePolicy(registry);
    for (const modelId of glm.model_class_ids) bindings[modelId] = glm.projection_resource_id;
  }
  return Object.freeze(bindings);
}

/**
 * Derive the resource -> pool join view from model/surface relationships.
 * Resources without a model-backed commercial pool intentionally remain null.
 */
export function deriveResourcePoolBindings(input) {
  const registry = requireRegistryV2(input);
  const bindings = Object.fromEntries(Object.keys(registry.resources).map((resourceId) => [resourceId, null]));
  const codex = deriveCodexRoutePolicy(registry);
  const glm = deriveGlmRoutePolicy(registry);
  bindings[codex.projection_resource_id] = codex.quota_pool_id;
  bindings[glm.projection_resource_id] = glm.quota_pool_id;
  for (const resourceId of Object.keys(registry.resources)) {
    const model = registry.models[resourceId];
    const surfaceId = model && nonEmptyString(model.default_access_surface);
    const surface = surfaceId ? registry.access_surfaces[surfaceId] : null;
    if (isObject(surface) && nonEmptyString(surface.quota_pool_id) && isObject(registry.quota_pools[surface.quota_pool_id])) {
      bindings[resourceId] = surface.quota_pool_id;
    }
  }
  return Object.freeze(bindings);
}

export function deriveResourceNoPoolSemantics(input) {
  const registry = requireRegistryV2(input);
  const bindings = deriveResourcePoolBindings(registry);
  const semantics = {};
  for (const resourceId of Object.keys(registry.resources)) {
    if (bindings[resourceId] !== null) continue;
    const model = registry.models[resourceId];
    const surfaceId = model && nonEmptyString(model.default_access_surface);
    const surface = surfaceId ? registry.access_surfaces[surfaceId] : null;
    semantics[resourceId] = surface?.surface_type === "local_harness" || resourceId === "qwen_local" || resourceId === "opencode"
      ? "local_unmetered"
      : "no_pool_binding";
  }
  return Object.freeze(semantics);
}

/** Static pool ids are derived from the two registry route groups. */
export function deriveQuotaPoolIds(input) {
  const registry = requireRegistryV2(input);
  return Object.freeze({
    codex: deriveCodexRoutePolicy(registry).quota_pool_id,
    glm: deriveGlmRoutePolicy(registry).quota_pool_id,
  });
}

const DEFAULT_REGISTRY = loadCanonicalRegistryV2();
export const DEFAULT_CODEX_ROUTE_POLICY = deriveCodexRoutePolicy(DEFAULT_REGISTRY);
export const DEFAULT_GLM_ROUTE_POLICY = deriveGlmRoutePolicy(DEFAULT_REGISTRY);
export const DEFAULT_FORBIDDEN_SURFACE_IDS = deriveForbiddenSurfaceIds(DEFAULT_REGISTRY);
export const DEFAULT_MODEL_RESOURCE_BINDINGS = deriveModelResourceBindings(DEFAULT_REGISTRY);
export const DEFAULT_RESOURCE_POOL_BINDINGS = deriveResourcePoolBindings(DEFAULT_REGISTRY);
export const DEFAULT_RESOURCE_NO_POOL_SEMANTICS = deriveResourceNoPoolSemantics(DEFAULT_REGISTRY);
export const DEFAULT_QUOTA_POOL_IDS = deriveQuotaPoolIds(DEFAULT_REGISTRY);

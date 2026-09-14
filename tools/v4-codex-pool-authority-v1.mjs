#!/usr/bin/env node
/**
 * PHASE_0_5 — Codex pool authority migration (bounded, deterministic).
 *
 * Target law (V4_OPENCLAW_QUOTA_LANE_RETIREMENT_PHASE_0_5_V1):
 *   chatgpt_codex_subscription:
 *     PRIMARY_SOURCE = CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ
 *     CODEX_OPENCLAW_AUTHORITY = NO
 *     CODEX_OPENCLAW_FALLBACK = NO  (app-server unknown/stale ⇒ pool UNKNOWN/STALE)
 *   glm_coding_plan:
 *     PRIMARY_SOURCE = OPENCLAW_STATUS_USAGE_JSON  (UNCHANGED)
 *
 * Mechanics (no second authority, no invented numbers):
 *   1. The OpenClaw collector STOPS EMITTING codex contributions at the source
 *      (suppressed in buildContribution callers via POOL authority law), so the
 *      canonical composer never receives OpenClaw codex data. GLM flow untouched.
 *   2. The observatory OVERWRITES the codex pool card from the injected
 *      codex-app-server observation (options.codexAppServerObservation) when it
 *      is ok+fresh, preserving canonical window/reset/remaining semantics. If
 *      absent/malformed/stale the codex pool REMAINS whatever the canonical
 *      compose law produces WITHOUT OpenClaw (i.e. UNKNOWN/STALE) — never a
 *      fallback to OpenClaw.
 *   3. Reconciliation law flips: app-server is PRIMARY, OpenClaw codex pool is
 *      diagnostic-only (OPENCLAW_DEMOTED_TO_DIAGNOSTIC).
 *
 * OpenClaw codex DATA may still appear inside the raw OpenClaw observation
 * section (diagnostics) but no longer enters the codex pool authority path.
 */
import { normalizeCodexAppServerQuota } from "./collect-codex-appserver-quota-v1.mjs";
import { DEFAULT_CODEX_ROUTE_POLICY } from "./resource-registry-v2-policy-adapter-v1.mjs";

/** Pool whose OpenClaw authority is retired by this module. */
export const CODEX_POOL_ID = DEFAULT_CODEX_ROUTE_POLICY.quota_pool_id;
export const CODEX_PRIMARY_SOURCE = "CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ";
export const OPENCLAW_DEMOTED_TO_DIAGNOSTIC = true;

/**
 * Authoritative codex pool card source for the observatory.
 * Returns a normalized ok app-server observation, or null (fail-closed →
 * caller keeps canonical UNKNOWN/STALE; OpenClaw is NEVER consulted).
 */
export function codexAuthorityObservation(options = {}) {
  const input = options.codexAppServerObservation ?? options.codexAppServerResponse ?? null;
  if (!input) return null;
  const normalized = normalizeCodexAppServerQuota(input, options);
  return normalized && normalized.ok === true && normalized.freshness === "fresh" ? normalized : null;
}

#!/usr/bin/env node
/**
 * V4_AUTOMATED_MICRO_TASK_ADMISSION_PARITY_V1 — deterministic MICRO_TASK_DELTA
 * admission helper for the automated local-dev dispatcher path.
 *
 * Inherits: docs/foundation/MICRO_TASK_DELTA_OPERATING_LAW.md
 *
 * Pure / offline. Never executes a model, never touches git, never mutates
 * production. The dispatcher MUST call this AFTER claim and BEFORE
 * runExecutor; rejected admission ⇒ execution_performed=false.
 *
 * Envelope.task_kind (CREATE|MODIFY) is a file-op hint from the backlog
 * bridge and is NOT the operating-method kind. Operating kind lives under
 * micro_task_policy.task_kind (or safe legacy defaults).
 */

export const ADMISSION_SCHEMA = "v4-micro-task-admission-result-v1";
export const DEFAULT_TASK_KIND = "MICRO_TASK_DELTA";
export const DEFAULT_MAX_CORRECTIVE_LOOPS = 2;
export const HARD_MAX_CORRECTIVE_LOOPS_WITHOUT_AUTH = 2;

export const TASK_KINDS = Object.freeze([
  "MICRO_TASK_DELTA",
  "CHECKPOINT_DELTA",
  "CAMPAIGN",
]);

/**
 * Normalize optional micro_task_policy / legacy claim+envelope into a
 * bounded admission input. Never invents campaign or broad-regression
 * authority.
 */
export function extractMicroTaskAdmissionInput(claimOrEnvelope = {}) {
  const envelope = claimOrEnvelope?.envelope && typeof claimOrEnvelope.envelope === "object"
    ? claimOrEnvelope.envelope
    : (claimOrEnvelope && typeof claimOrEnvelope === "object" && claimOrEnvelope.schema_version
      ? claimOrEnvelope
      : null);
  const policy = (envelope?.micro_task_policy && typeof envelope.micro_task_policy === "object"
    && !Array.isArray(envelope.micro_task_policy))
    ? envelope.micro_task_policy
    : (claimOrEnvelope?.micro_task_policy && typeof claimOrEnvelope.micro_task_policy === "object"
      && !Array.isArray(claimOrEnvelope.micro_task_policy)
      ? claimOrEnvelope.micro_task_policy
      : null);

  const legacy = policy == null;
  const taskKindRaw = policy?.task_kind
    ?? claimOrEnvelope?.operating_task_kind
    ?? null;

  let maxLoops = policy?.max_corrective_loops;
  if (maxLoops === undefined || maxLoops === null) {
    // Legacy safe default: bridge already clamps loop rounds to ≤2 when
    // loop_allowed; otherwise bound=2 is the MICRO_TASK law default and
    // does not weaken it. If envelope.max_test_cycles > 2 without policy,
    // leave the raw value so admit() can fail closed with migration reason.
    if (envelope && Number.isInteger(envelope.max_test_cycles) && envelope.max_test_cycles > HARD_MAX_CORRECTIVE_LOOPS_WITHOUT_AUTH) {
      maxLoops = envelope.max_test_cycles;
    } else {
      maxLoops = DEFAULT_MAX_CORRECTIVE_LOOPS;
    }
  }

  const requireBroad = policy?.require_broad_regression === true
    || policy?.broad_regression === true
    || claimOrEnvelope?.require_broad_regression === true;
  const bugbot = policy?.bugbot === true
    || policy?.bugbot === "SÌ"
    || policy?.bugbot === "SI"
    || claimOrEnvelope?.bugbot === true
    || claimOrEnvelope?.bugbot === "SÌ";
  const campaignAuth = policy?.human_authorized_campaign_exception === true
    || claimOrEnvelope?.human_authorized_campaign_exception === true
    || (typeof envelope?.task_delta === "string"
      && /HUMAN_AUTHORIZED_CAMPAIGN_EXCEPTION/.test(envelope.task_delta));

  // Detect unauthorized campaign shape from explicit kind OR campaign markers
  // without the stable authorization token.
  const campaignMarker = (typeof envelope?.task_delta === "string"
    && /\b(MEGAPROMPT|multi-?hour\s+campaign|25-task|giant-session)\b/i.test(envelope.task_delta))
    || taskKindRaw === "CAMPAIGN";

  return {
    legacy_defaults_applied: legacy,
    task_kind: taskKindRaw || (campaignMarker && !campaignAuth ? "CAMPAIGN" : DEFAULT_TASK_KIND),
    max_corrective_loops: maxLoops,
    require_broad_regression: requireBroad,
    bugbot,
    human_authorized_campaign_exception: campaignAuth,
    campaign_shape_detected: campaignMarker,
    task_ref: envelope?.task_ref ?? claimOrEnvelope?.task_ref ?? null,
  };
}

/**
 * Deterministic admission decision.
 * @returns {{
 *   schema_version: string,
 *   admitted: boolean,
 *   task_kind: string|null,
 *   max_corrective_loops: number|null,
 *   legacy_defaults_applied: boolean,
 *   reason_codes: string[],
 * }}
 */
export function admitMicroTaskDelta(input = {}) {
  const extracted = input.task_kind !== undefined || input.max_corrective_loops !== undefined
    || input.legacy_defaults_applied !== undefined
    ? {
        legacy_defaults_applied: input.legacy_defaults_applied === true,
        task_kind: input.task_kind ?? DEFAULT_TASK_KIND,
        max_corrective_loops: input.max_corrective_loops ?? DEFAULT_MAX_CORRECTIVE_LOOPS,
        require_broad_regression: input.require_broad_regression === true,
        bugbot: input.bugbot === true,
        human_authorized_campaign_exception: input.human_authorized_campaign_exception === true,
        campaign_shape_detected: input.campaign_shape_detected === true,
        task_ref: input.task_ref ?? null,
      }
    : extractMicroTaskAdmissionInput(input);

  const reason_codes = [];
  const kind = extracted.task_kind;

  if (!TASK_KINDS.includes(kind)) {
    return base(false, extracted, ["MICRO_TASK_ADMISSION_REJECTED", "TASK_KIND_UNSUPPORTED", String(kind).slice(0, 40)]);
  }

  // Campaign / megaprompt
  if (kind === "CAMPAIGN" || extracted.campaign_shape_detected) {
    if (extracted.human_authorized_campaign_exception !== true) {
      return base(false, extracted, [
        "MICRO_TASK_ADMISSION_REJECTED",
        "CAMPAIGN_REQUIRES_HUMAN_AUTHORIZED_EXCEPTION",
        "HUMAN_AUTHORIZED_CAMPAIGN_EXCEPTION",
      ]);
    }
    // Explicit exception: admit as authorized campaign (still one claim/tick).
    return base(true, { ...extracted, task_kind: "CAMPAIGN" }, [
      "MICRO_TASK_ADMISSION_ADMITTED",
      "HUMAN_AUTHORIZED_CAMPAIGN_EXCEPTION",
    ]);
  }

  // Corrective bound
  const maxLoops = extracted.max_corrective_loops;
  if (typeof maxLoops !== "number" || !Number.isFinite(maxLoops) || maxLoops < 0 || !Number.isInteger(maxLoops)) {
    return base(false, extracted, ["MICRO_TASK_ADMISSION_REJECTED", "MAX_CORRECTIVE_LOOPS_INVALID"]);
  }
  if (maxLoops > HARD_MAX_CORRECTIVE_LOOPS_WITHOUT_AUTH) {
    const authorizedHigher = input.corrective_bound_explicitly_authorized === true
      || extracted.human_authorized_campaign_exception === true;
    if (!authorizedHigher) {
      return base(false, extracted, [
        "MICRO_TASK_ADMISSION_REJECTED",
        "MAX_CORRECTIVE_LOOPS_EXCEEDS_DEFAULT",
        extracted.legacy_defaults_applied
          ? "LEGACY_ITEM_REQUIRES_MICRO_TASK_POLICY_MIGRATION"
          : "EXPLICIT_AUTHORIZATION_REQUIRED_FOR_HIGHER_BOUND",
      ]);
    }
  }

  // Broad regression / BugBot
  if (kind === "MICRO_TASK_DELTA") {
    if (extracted.require_broad_regression === true) {
      return base(false, extracted, [
        "MICRO_TASK_ADMISSION_REJECTED",
        "BROAD_REGRESSION_FORBIDDEN_ON_MICRO_TASK",
      ]);
    }
    if (extracted.bugbot === true) {
      return base(false, extracted, [
        "MICRO_TASK_ADMISSION_REJECTED",
        "BUGBOT_FORBIDDEN_ON_MICRO_TASK",
      ]);
    }
  }
  // CHECKPOINT_DELTA may authorize broad regression / BugBot.
  if (kind === "CHECKPOINT_DELTA") {
    reason_codes.push("CHECKPOINT_DELTA_ADMITTED");
    if (extracted.require_broad_regression) reason_codes.push("CHECKPOINT_BROAD_REGRESSION_AUTHORIZED");
    if (extracted.bugbot) reason_codes.push("CHECKPOINT_BUGBOT_AUTHORIZED");
  }

  if (extracted.legacy_defaults_applied) {
    reason_codes.push("LEGACY_SAFE_MICRO_TASK_DEFAULTS_APPLIED");
  }
  reason_codes.unshift("MICRO_TASK_ADMISSION_ADMITTED");
  return base(true, extracted, reason_codes);
}

function base(admitted, extracted, reason_codes) {
  return {
    schema_version: ADMISSION_SCHEMA,
    admitted: admitted === true,
    task_kind: extracted?.task_kind ?? null,
    max_corrective_loops: typeof extracted?.max_corrective_loops === "number"
      ? extracted.max_corrective_loops
      : null,
    legacy_defaults_applied: extracted?.legacy_defaults_applied === true,
    reason_codes: Array.isArray(reason_codes) ? reason_codes.slice(0, 16) : [],
  };
}

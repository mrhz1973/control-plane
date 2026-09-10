const TIME_ZONE = "Europe/Rome";
const WINDOW_START_MINUTE = 8 * 60;
const WINDOW_END_MINUTE = 12 * 60;
const CODEX_POOL = "chatgpt_codex_subscription";

function localParts(date) {
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) throw new Error("invalid date");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  return { ...value, minuteOfDay: Number(value.hour) * 60 + Number(value.minute) };
}

function stateFlag(value, accepted) {
  return typeof value === "string" && accepted.includes(value.toLowerCase());
}

export function selectCodexWindowController({ now, codexState, outsideController = "PREEXISTING_GOVERNED_CONTROLLER" }) {
  const local = localParts(now instanceof Date ? now : new Date(now));
  const inWindow = local.minuteOfDay >= WINDOW_START_MINUTE && local.minuteOfDay < WINDOW_END_MINUTE;
  if (!inWindow) {
    return {
      schema_version: "control-plane-time-window-decision-v1",
      timezone: TIME_ZONE,
      local_time: `${local.year}-${local.month}-${local.day}T${local.hour}:${local.minute}:${local.second}`,
      window_match: false,
      selected_controller: outsideController,
      decision_reason: "OUTSIDE_CODEX_PRIORITY_WINDOW_PRESERVE_EXISTING_POLICY",
      codex_auth_state: "NOT_SELECTED",
      codex_qualification_state: "NOT_SELECTED",
      codex_quota_state: "NOT_SELECTED",
      glm_eligible: "PRESERVE_EXISTING_POLICY",
      quota_pool_id: null,
    };
  }
  const auth = codexState && codexState.auth_state;
  const qualification = codexState && codexState.qualification_state;
  const availability = codexState && codexState.availability_state;
  const quota = codexState && codexState.quota_state;
  const ready = stateFlag(auth, ["authenticated", "pass"]) &&
    stateFlag(qualification, ["qualified", "pass"]) &&
    stateFlag(availability, ["available", "ready", "pass"]);
  const quotaBlocked = stateFlag(quota, ["exhausted", "unavailable"]);
  if (!ready || quotaBlocked) {
    return {
      schema_version: "control-plane-time-window-decision-v1",
      timezone: TIME_ZONE,
      local_time: `${local.year}-${local.month}-${local.day}T${local.hour}:${local.minute}:${local.second}`,
      window_match: true,
      selected_controller: null,
      decision_reason: quotaBlocked
        ? "CODEX_QUOTA_AUTHORITATIVELY_UNAVAILABLE_FAIL_CLOSED_NO_GLM_FALLBACK"
        : "CODEX_NOT_READY_FAIL_CLOSED_NO_GLM_FALLBACK",
      codex_auth_state: auth ?? "UNKNOWN",
      codex_qualification_state: qualification ?? "UNKNOWN",
      codex_quota_state: quota ?? "UNKNOWN",
      glm_eligible: "NO",
      quota_pool_id: CODEX_POOL,
    };
  }
  return {
    schema_version: "control-plane-time-window-decision-v1",
    timezone: TIME_ZONE,
    local_time: `${local.year}-${local.month}-${local.day}T${local.hour}:${local.minute}:${local.second}`,
    window_match: true,
    selected_controller: "CODEX_SUBSCRIPTION",
    decision_reason: "CODEX_SUBSCRIPTION_PRIORITY_WINDOW_SHADOW",
    codex_auth_state: auth,
    codex_qualification_state: qualification,
    codex_quota_state: quota ?? "UNKNOWN",
    glm_eligible: "NO",
    quota_pool_id: CODEX_POOL,
  };
}

export { CODEX_POOL, TIME_ZONE, WINDOW_START_MINUTE, WINDOW_END_MINUTE };

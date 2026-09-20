#!/usr/bin/env node
/**
 * local-dev-sentinel-v1 — observation-only STALL / no-progress sentinel (#109).
 *
 * NOT a dispatcher, scheduler, claim authority, or remediatior.
 * Evaluates evaluateStall() against natural WF90/dispatcher observations,
 * persists bounded restart-safe state outside the Git worktree, emits exact-once
 * STALL/RECOVERED via the existing terminal notify ledger + mission-control journal.
 *
 * WF90_STALE_DETECTION_MODE=NEXT_OBSERVABLE_EVENT
 * (staleness is detected when the next natural tick observes a gap > 3× interval).
 *
 * DISPATCHER_UNAVAILABLE_COVERAGE=SERVICE_ERROR_EXISTING_PATH
 * (WF90 already notifies SERVICE_ERROR; no second watcher).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import {
  evaluateStall,
  STALL_RULES,
  loadNotifyLedger,
  saveNotifyLedgerAtomic,
  dispatchNotifications,
  loadTelegramTransportConfig,
} from "./local-dev-terminal-notifier-v1.mjs";

export const SENTINEL_MODULE_VERSION = "local-dev-sentinel-v1";
export const SENTINEL_STATE_SCHEMA = "local-dev-sentinel-state-v1";
export const SENTINEL_TICK_HISTORY_MAX = 16;
export const SENTINEL_HEALTH = Object.freeze(["NORMAL", "DEGRADED", "STALLED", "HUMAN_GATE", "ERROR"]);
export const WF90_STALE_DETECTION_MODE = "NEXT_OBSERVABLE_EVENT";
export const DISPATCHER_UNAVAILABLE_COVERAGE = "SERVICE_ERROR_EXISTING_PATH";
export const WF90_INTERVAL_SECONDS_DEFAULT = 120;

export function sentinelStatePath(env = process.env, home = homedir()) {
  const base = typeof env?.LOCALAPPDATA === "string" && env.LOCALAPPDATA.trim()
    ? join(env.LOCALAPPDATA, "ControlPlane", "runtime")
    : join(home || ".", ".control-plane-runtime");
  return join(base, "local-dev-sentinel-state-v1.json");
}

function emptyState(nowIso) {
  return {
    schema_version: SENTINEL_STATE_SCHEMA,
    health: "NORMAL",
    active_episode: null,
    reason: null,
    task_ref: null,
    subject: null,
    first_observed_at: null,
    last_observed_at: null,
    last_evaluated_at: nowIso || null,
    episode_generation: 0,
    tick_history: [],
    stall_notified_generation: null,
    recovered_notified_generation: null,
  };
}

/** Load sentinel state. Malformed → fail-closed empty NORMAL (no notification storm). */
export function loadSentinelState(path = sentinelStatePath()) {
  if (!existsSync(path)) return { ok: true, state: emptyState(null), fresh: true };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)
      || parsed.schema_version !== SENTINEL_STATE_SCHEMA
      || !Array.isArray(parsed.tick_history)) {
      return { ok: false, reason: "SENTINEL_STATE_INVALID", state: emptyState(null) };
    }
    const hist = parsed.tick_history.filter((e) => e && typeof e === "object").slice(-SENTINEL_TICK_HISTORY_MAX);
    return {
      ok: true,
      fresh: false,
      state: {
        ...emptyState(parsed.last_evaluated_at),
        ...parsed,
        tick_history: hist,
        episode_generation: Number.isFinite(Number(parsed.episode_generation))
          ? Math.max(0, Math.floor(Number(parsed.episode_generation)))
          : 0,
      },
    };
  } catch {
    return { ok: false, reason: "SENTINEL_STATE_UNREADABLE", state: emptyState(null) };
  }
}

export function saveSentinelStateAtomic(state, path = sentinelStatePath()) {
  if (!state || state.schema_version !== SENTINEL_STATE_SCHEMA || !Array.isArray(state.tick_history)) {
    const err = new Error("SENTINEL_STATE_INVALID");
    err.code = "SENTINEL_STATE_INVALID";
    throw err;
  }
  const trimmed = {
    ...state,
    tick_history: state.tick_history.slice(-SENTINEL_TICK_HISTORY_MAX),
  };
  mkdirSync(dirname(path), { recursive: true });
  const tmp = join(dirname(path), `.sentinel-${process.pid}-${Date.now()}.tmp`);
  try {
    writeFileSync(tmp, `${JSON.stringify(trimmed, null, 2)}\n`, "utf8");
    renameSync(tmp, path);
  } catch (err) {
    try { unlinkSync(tmp); } catch { /* best-effort */ }
    throw err;
  }
  return true;
}

export function appendTickObservation(state, entry) {
  if (!state || !Array.isArray(state.tick_history)) return state;
  const row = {
    recorded_at: typeof entry?.recorded_at === "string" ? entry.recorded_at.slice(0, 40) : null,
    classification: typeof entry?.classification === "string" ? entry.classification.slice(0, 80) : null,
    candidateTaskRef: typeof entry?.candidateTaskRef === "string" ? entry.candidateTaskRef.slice(0, 200) : null,
    eligible_count: Number.isFinite(Number(entry?.eligible_count)) ? Math.max(0, Math.floor(Number(entry.eligible_count))) : 0,
    claimed: entry?.claimed === true,
  };
  state.tick_history = [...state.tick_history, row].slice(-SENTINEL_TICK_HISTORY_MAX);
  return state;
}

/**
 * Health precedence: ERROR / HUMAN_GATE > STALLED > DEGRADED > NORMAL.
 * Never invents ERROR without evidence.
 */
export function projectSentinelHealth({
  stalled = false,
  stallReason = null,
  classification = null,
  humanGateRequired = false,
  stateLoadOk = true,
} = {}) {
  if (classification === "SERVICE_ERROR") {
    return { health: "ERROR", reason: "SERVICE_ERROR", subject: "dispatcher" };
  }
  if (humanGateRequired === true || classification === "HUMAN_GATE_REQUIRED") {
    return { health: "HUMAN_GATE", reason: "HUMAN_GATE_REQUIRED", subject: "operator" };
  }
  if (!stateLoadOk) {
    return { health: "DEGRADED", reason: "SENTINEL_STATE_INVALID", subject: "sentinel" };
  }
  if (stalled === true) {
    return { health: "STALLED", reason: stallReason || "STALL", subject: "sentinel" };
  }
  return { health: "NORMAL", reason: null, subject: null };
}

function stallNotifyKey(reason, taskRef, generation) {
  return `stall|${String(reason || "UNKNOWN")}|${String(taskRef || "NONE")}|g${generation}`;
}
function recoveredNotifyKey(generation) {
  return `recovered|g${generation}`;
}

function stallTelegramText({ reason, taskRef, detail }) {
  return [
    "CONTROL PLANE - STALL",
    `reason: ${reason || "UNKNOWN"}`,
    `task: ${taskRef || "NONE"}`,
    `detail: ${String(detail || "none").slice(0, 240)}`,
  ].join("\n");
}

function recoveredTelegramText({ reason, taskRef }) {
  return [
    "CONTROL PLANE - RECOVERED",
    `prior_reason: ${reason || "UNKNOWN"}`,
    `task: ${taskRef || "NONE"}`,
  ].join("\n");
}

/**
 * Core observation step. Pure-ish except durable state/ledger/journal/Telegram.
 * Never throws into the tick path — callers should still wrap.
 */
export async function observeSentinel(input = {}) {
  const nowIso = typeof input.nowIso === "string" && input.nowIso ? input.nowIso : new Date().toISOString();
  const statePath = input.statePath || sentinelStatePath();
  const loaded = typeof input.loadState === "function" ? input.loadState(statePath) : loadSentinelState(statePath);
  const state = loaded.state || emptyState(nowIso);
  const stateLoadOk = loaded.ok !== false;

  const classification = typeof input.classification === "string" ? input.classification : null;
  const humanGateRequired = input.humanGateRequired === true || classification === "HUMAN_GATE_REQUIRED";

  // Append observation (bounded). Skip inventing rows when classification unknown.
  if (classification) {
    appendTickObservation(state, {
      recorded_at: nowIso,
      classification,
      candidateTaskRef: input.candidateTaskRef || null,
      eligible_count: input.queueEligibleCount,
      claimed: input.claimed === true,
    });
  }

  // HUMAN_GATE present → do not promote ELIGIBLE_READY_NO_CLAIM stalls.
  const suppressEligibleStall = humanGateRequired === true;

  const snap = {
    queueEligibleCount: Number(input.queueEligibleCount) || 0,
    candidateTaskRef: suppressEligibleStall ? null : (input.candidateTaskRef || null),
    lastTickClassification: classification,
    active: input.active === true,
    phase: input.phase || null,
    wf90IntervalSeconds: Number(input.wf90IntervalSeconds) || WF90_INTERVAL_SECONDS_DEFAULT,
    lastTickAt: input.lastTickAt || null,
    nowIso,
    executorTimeboxSeconds: Number.isFinite(Number(input.executorTimeboxSeconds))
      ? Number(input.executorTimeboxSeconds)
      : null,
    activeSince: input.activeSince || null,
    taskRef: input.taskRef || null,
    tickHistory: state.tick_history,
  };

  let stall = { stalled: false };
  try {
    stall = evaluateStall(snap, input.rules || STALL_RULES) || { stalled: false };
  } catch {
    stall = { stalled: false };
  }

  // If HUMAN_GATE, never keep an eligible-ready stall reason.
  if (suppressEligibleStall && stall.reason === "ELIGIBLE_READY_NO_CLAIM") {
    stall = { stalled: false };
  }

  const projected = projectSentinelHealth({
    stalled: stall.stalled === true,
    stallReason: stall.reason || null,
    classification,
    humanGateRequired,
    stateLoadOk,
  });

  const notifications = [];
  const journalEvents = [];
  const wasStalled = state.active_episode && state.health === "STALLED";

  if (stall.stalled === true && projected.health === "STALLED") {
    if (!wasStalled || state.reason !== stall.reason || state.task_ref !== (stall.task_ref || null)) {
      state.episode_generation = (Number(state.episode_generation) || 0) + 1;
      state.active_episode = {
        reason: stall.reason,
        task_ref: stall.task_ref || null,
        detail: stall.detail || null,
        generation: state.episode_generation,
      };
      state.reason = stall.reason;
      state.task_ref = stall.task_ref || null;
      state.subject = stall.reason;
      state.first_observed_at = nowIso;
      state.stall_notified_generation = null;
      journalEvents.push({
        event: "STALL",
        phase: "SENTINEL",
        component: "sentinel",
        classification: stall.reason,
        task_ref: stall.task_ref || undefined,
        human_summary: `STALL ${stall.reason}${stall.task_ref ? ` · ${stall.task_ref}` : ""}`.slice(0, 300),
      });
    }
    state.health = "STALLED";
    state.last_observed_at = nowIso;
    if (state.stall_notified_generation !== state.episode_generation) {
      notifications.push({
        key: stallNotifyKey(stall.reason, stall.task_ref, state.episode_generation),
        text: stallTelegramText({ reason: stall.reason, taskRef: stall.task_ref, detail: stall.detail }),
        _mark: "stall",
      });
    }
  } else if (wasStalled && projected.health !== "STALLED") {
    const prior = state.active_episode || {};
    const gen = state.episode_generation;
    journalEvents.push({
      event: "RECOVERED",
      phase: "SENTINEL",
      component: "sentinel",
      classification: prior.reason || state.reason || "RECOVERED",
      task_ref: prior.task_ref || state.task_ref || undefined,
      human_summary: `RECOVERED from ${prior.reason || state.reason || "STALL"}`.slice(0, 300),
    });
    if (state.recovered_notified_generation !== gen) {
      notifications.push({
        key: recoveredNotifyKey(gen),
        text: recoveredTelegramText({ reason: prior.reason || state.reason, taskRef: prior.task_ref || state.task_ref }),
        _mark: "recovered",
      });
    }
    state.active_episode = null;
    state.reason = projected.reason;
    state.task_ref = null;
    state.subject = projected.subject;
    state.health = projected.health;
    state.last_observed_at = nowIso;
  } else {
    state.health = projected.health;
    state.reason = projected.reason;
    state.subject = projected.subject;
    if (projected.health !== "STALLED") {
      state.active_episode = null;
      if (projected.health !== "HUMAN_GATE" && projected.health !== "ERROR") {
        state.task_ref = null;
      }
    }
    state.last_observed_at = nowIso;
  }

  state.last_evaluated_at = nowIso;
  state.schema_version = SENTINEL_STATE_SCHEMA;

  // Persist state (fail-closed: skip notify storm if save fails after invalid).
  let persistOk = true;
  if (stateLoadOk || loaded.fresh) {
    try {
      if (typeof input.saveState === "function") input.saveState(state, statePath);
      else saveSentinelStateAtomic(state, statePath);
    } catch {
      persistOk = false;
    }
  } else {
    persistOk = false;
  }

  // Journal (observability only).
  if (typeof input.journalEmit === "function") {
    for (const ev of journalEvents) {
      try { input.journalEmit({ recorded_at: nowIso, ...ev }); } catch { /* bounded */ }
    }
  }

  // Exact-once Telegram via existing ledger.
  let notifyResults = [];
  if (persistOk && notifications.length && input.notify !== false) {
    try {
      const ledgerPath = input.ledgerPath;
      const loadLedger = input.loadLedger || (() => loadNotifyLedger(ledgerPath));
      const saveLedger = input.saveLedger || ((l) => saveNotifyLedgerAtomic(l, ledgerPath));
      const ledger = loadLedger();
      const transport = input.transport || (input.telegramConfigPath
        ? loadTelegramTransportConfig(input.telegramConfigPath)
        : { ok: false, reason: "TRANSPORT_NOT_CONFIGURED" });
      const dispatched = await dispatchNotifications({
        requests: notifications.map(({ key, text }) => ({ key, text })),
        ledger,
        transport,
        nowIso,
        fetchImpl: input.fetchImpl,
        saveLedger,
      });
      notifyResults = dispatched.results || [];
      for (const r of notifyResults) {
        if (r.sent === true || r.reason === "ALREADY_SENT") {
          const n = notifications.find((x) => x.key === r.key);
          if (n?._mark === "stall") state.stall_notified_generation = state.episode_generation;
          if (n?._mark === "recovered") state.recovered_notified_generation = state.episode_generation;
        }
      }
      // Re-save notification markers.
      try {
        if (typeof input.saveState === "function") input.saveState(state, statePath);
        else saveSentinelStateAtomic(state, statePath);
      } catch { /* markers best-effort */ }
    } catch {
      notifyResults = [{ sent: false, reason: "NOTIFY_FAILED" }];
    }
  }

  return {
    ok: true,
    invoked: true,
    health: state.health,
    reason: state.reason,
    task_ref: state.task_ref,
    since: state.first_observed_at,
    last_evaluated_at: state.last_evaluated_at,
    stall,
    episode_generation: state.episode_generation,
    state_load_ok: stateLoadOk,
    persist_ok: persistOk,
    notify_results: notifyResults,
    wf90_stale_detection_mode: WF90_STALE_DETECTION_MODE,
    dispatcher_unavailable_coverage: DISPATCHER_UNAVAILABLE_COVERAGE,
    projection: {
      health: state.health,
      reason: state.reason,
      task_ref: state.task_ref,
      since: state.first_observed_at,
      last_evaluated_at: state.last_evaluated_at,
      active_episode: state.active_episode,
    },
  };
}

/** Read-only diagnostics projection (never mutates). */
export function readSentinelProjection(path = sentinelStatePath()) {
  const loaded = loadSentinelState(path);
  const s = loaded.state || emptyState(null);
  return {
    schema_version: SENTINEL_STATE_SCHEMA,
    read_only: true,
    state_ok: loaded.ok !== false,
    health: s.health || "NORMAL",
    reason: s.reason || null,
    task_ref: s.task_ref || null,
    since: s.first_observed_at || null,
    last_evaluated_at: s.last_evaluated_at || null,
    active_episode: s.active_episode || null,
    tick_history_len: Array.isArray(s.tick_history) ? s.tick_history.length : 0,
    wf90_stale_detection_mode: WF90_STALE_DETECTION_MODE,
    dispatcher_unavailable_coverage: DISPATCHER_UNAVAILABLE_COVERAGE,
  };
}

const isCli = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("tools/local-dev-sentinel-v1.mjs");
if (isCli) {
  process.stdout.write(`${SENTINEL_MODULE_VERSION} — observation-only STALL sentinel\n`);
  process.exit(0);
}

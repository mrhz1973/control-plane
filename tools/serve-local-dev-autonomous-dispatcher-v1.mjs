#!/usr/bin/env node
/**
 * serve-local-dev-autonomous-dispatcher-v1 — Windows always-on LOCAL_DEV
 * dispatcher service (GPT_WEB authoring override:
 * V4_LOCAL_DEV_N8N_ALWAYS_ON_LIVE_FAST_TRACK_V1).
 *
 * ONE private dispatch tick per HTTP request:
 *   POST /v1/tick   on 127.0.0.1:18793
 *   External route (Tailscale Serve): /v4/local-dev/dispatch-tick
 *
 * One tick = MAX ONE real execution through the PROVEN pipeline:
 *   scan → select (selector law) → claim (bridge receipts) → emit envelope
 *   → MICRO_TASK_DELTA admission (admit-micro-task-delta-v1) → execute
 *   envelope (LOCAL_DEV_EXECUTOR authority) → bounded response.
 *
 * Composition only: reuses tools/dispatch-local-dev-queue-loop-v1.mjs
 * (selector/claim authority), tools/admit-micro-task-delta-v1.mjs
 * (MICRO_TASK operating-law admission), and tools/run-local-dev-executor-v1.mjs
 * (execution authority). No second executor. No safety-law merge.
 * Rejected admission never reaches the executor (execution_performed=false).
 *
 * The caller can NEVER influence: repo path, commands, profile, allowed
 * paths, task choice, synthetic policy, or production routing. Those are
 * server-side canonical constants.
 *
 * In-process single-flight lock: a concurrent tick returns BUSY and never
 * queues.
 *
 * Repository hygiene (fail-closed): canonical checkout, branch main,
 * `git fetch origin main`, TRACKED-clean before any sync, then either
 * HEAD==origin/main or exactly one `git merge --ff-only origin/main` when
 * HEAD is a strict ancestor. Ahead/diverged/dirty/ff-failure →
 * HUMAN_GATE_REQUIRED (never reset/stash/clean/rebase/force-pull).
 * Pre-existing untracked files are preserved (dirty check uses
 * --untracked-files=no). Sync runs before queue claim/admission/executor.
 *
 * IDLE ticks NEVER manufacture synthetic work (authoring law: only real
 * READY backlog executes here; synthetic capability preserved elsewhere).
 */
import http from "node:http";
import { execFile } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runDispatchLoop } from "./dispatch-local-dev-queue-loop-v1.mjs";
import {
  KNOWN_LOCAL_REPOS,
  buildReceiptLifecycle,
  transitionLatestReceipt,
  isReceiptBlocking,
  CLAIM_STALE_AFTER_MS,
} from "./bridge-backlog-to-local-dev-envelope-v1.mjs";
import { executeLocalDevTask } from "./local-dev-executor-v1.mjs";
import { composeRunners } from "./run-local-dev-executor-v1.mjs";
import { admitMicroTaskDelta, extractMicroTaskAdmissionInput } from "./admit-micro-task-delta-v1.mjs";
import { ensureWorkstationDevQwenReady } from "./qwen-local-session-manager-v1.mjs";
import { selectNextQueueItem, parseBacklogFile, isAdmissible } from "./select-local-dev-queue-item-v1.mjs";

export const RESULT_SCHEMA = "local-dev-dispatch-tick-result-v1";
export const REQUEST_SCHEMA = "local-dev-dispatch-tick-v1";
export const STATUS_SCHEMA = "local-dev-execution-status-v1";
export const DIAGNOSTICS_SCHEMA = "local-dev-dispatch-diagnostics-v1";
export const LAST_TICK_SCHEMA = "local-dev-dispatch-last-tick-v1";
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 18793;
export const TICK_PATH = "/v1/tick";
export const STATUS_PATH = "/v1/status";
export const DIAGNOSTICS_PATH = "/v1/diagnostics";
export const DASHBOARD_PATHS = Object.freeze(["/", "/dashboard", "/dashboard/"]);
export const QWEN_OBSERVE_BASE_URL = "http://127.0.0.1:8080";
export const REPO = "mrhz1973/control-plane";
export const CANONICAL_REPO_PATH = KNOWN_LOCAL_REPOS[REPO];
export const QUEUE_DIR = "reports/runtime/dev-queue/always-on";
const DASHBOARD_HTML_PATH = join(dirname(fileURLToPath(import.meta.url)), "local-dev-dispatcher-dashboard-v1.html");
// Claim receipts for the always-on queue live INSIDE the queue dir (untracked
// runtime state). The shared tracked ledger reports/runtime/dev-queue/receipts.json
// must NOT be written by the service: a claim written there dirties a tracked
// file BEFORE the executor preflight runs, so every live claim would deterministically
// STOP with PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE (observed live 2026-09-05).
export const RECEIPTS_PATH = "reports/runtime/dev-queue/always-on/receipts.json";
export const MAX_BODY_BYTES = 64 * 1024;
/** Bounded DEV Qwen readiness preflight before claim persistence. */
/** Align with session-manager DEV router/backend readiness budget. */
export const QWEN_PREFLIGHT_TIMEOUT_MS = 120_000;
export const CLASSIFICATIONS = Object.freeze([
  "WORK_EXECUTED_PASS",
  "WORK_EXECUTED_STOP",
  "IDLE_CLEAN",
  "BUSY",
  "HUMAN_GATE_REQUIRED",
  "SERVICE_ERROR",
]);

function boundStr(value, max) {
  if (value === null || value === undefined) return null;
  const s = String(value);
  if (!s) return null;
  return s.length <= max ? s : s.slice(0, max);
}

function boundInt(value, { allowNull = true, min = 0 } = {}) {
  if (value === null || value === undefined) return allowNull ? null : min;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min) return allowNull ? null : min;
  return Math.floor(n);
}

function boundFilesTouched(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((p) => boundStr(p, 200))
    .filter(Boolean)
    .slice(0, 16);
}

function emptyStatusSnapshot(partial = {}) {
  return {
    schema_version: STATUS_SCHEMA,
    active: false,
    terminal: false,
    request_id: null,
    task_ref: null,
    phase: "IDLE",
    elapsed_ms: 0,
    executor_pid: null,
    qwen_profile: null,
    runtime_ready: null,
    tests_state: "NOT_STARTED",
    files_touched: [],
    classification: null,
    last_event: null,
    ...partial,
  };
}

/**
 * In-memory execution status tracker (observability only).
 * Never throws into the execution path; callers should still wrap updates.
 */
export function createExecutionStatusTracker(options = {}) {
  const nowFn = options.nowMs || (() => Date.now());
  let startedAt = null;
  let state = emptyStatusSnapshot();

  const snapshot = () => {
    const elapsed = startedAt == null ? (state.elapsed_ms || 0) : Math.max(0, nowFn() - startedAt);
    return {
      schema_version: STATUS_SCHEMA,
      active: state.active === true,
      terminal: state.terminal === true,
      request_id: boundStr(state.request_id, 200),
      task_ref: boundStr(state.task_ref, 200),
      phase: boundStr(state.phase, 80) || "IDLE",
      elapsed_ms: boundInt(elapsed, { allowNull: false, min: 0 }),
      executor_pid: boundInt(state.executor_pid, { allowNull: true, min: 1 }),
      qwen_profile: boundStr(state.qwen_profile, 120),
      runtime_ready: state.runtime_ready === true ? true : (state.runtime_ready === false ? false : null),
      tests_state: boundStr(state.tests_state, 80) || "NOT_STARTED",
      files_touched: boundFilesTouched(state.files_touched),
      classification: boundStr(state.classification, 120),
      last_event: boundStr(state.last_event, 160),
    };
  };

  return {
    start(fields = {}) {
      startedAt = nowFn();
      state = emptyStatusSnapshot({
        active: true,
        terminal: false,
        request_id: boundStr(fields.request_id, 200),
        task_ref: boundStr(fields.task_ref, 200),
        phase: boundStr(fields.phase, 80) || "REPO_HYGIENE",
        executor_pid: boundInt(fields.executor_pid, { allowNull: true, min: 1 }),
        qwen_profile: boundStr(fields.qwen_profile, 120),
        runtime_ready: null,
        tests_state: "NOT_STARTED",
        files_touched: [],
        classification: null,
        last_event: boundStr(fields.last_event || "tick_started", 160),
      });
      return snapshot();
    },
    update(fields = {}) {
      if (!state.active && !fields.force) {
        // Still allow enriching terminal snapshot only via finish; ignore stray updates.
        if (state.terminal) return snapshot();
      }
      if (fields.request_id !== undefined) state.request_id = boundStr(fields.request_id, 200);
      if (fields.task_ref !== undefined) state.task_ref = boundStr(fields.task_ref, 200);
      if (fields.phase !== undefined) state.phase = boundStr(fields.phase, 80) || state.phase;
      if (fields.executor_pid !== undefined) state.executor_pid = boundInt(fields.executor_pid, { allowNull: true, min: 1 });
      if (fields.qwen_profile !== undefined) state.qwen_profile = boundStr(fields.qwen_profile, 120);
      if (fields.runtime_ready !== undefined) {
        state.runtime_ready = fields.runtime_ready === true ? true : (fields.runtime_ready === false ? false : null);
      }
      if (fields.tests_state !== undefined) state.tests_state = boundStr(fields.tests_state, 80) || state.tests_state;
      if (fields.files_touched !== undefined) state.files_touched = boundFilesTouched(fields.files_touched);
      if (fields.classification !== undefined) state.classification = boundStr(fields.classification, 120);
      if (fields.last_event !== undefined) state.last_event = boundStr(fields.last_event, 160);
      if (fields.active !== undefined) state.active = fields.active === true;
      if (fields.terminal !== undefined) state.terminal = fields.terminal === true;
      return snapshot();
    },
    finish(fields = {}) {
      const elapsed = startedAt == null ? 0 : Math.max(0, nowFn() - startedAt);
      state = {
        ...state,
        active: false,
        terminal: true,
        phase: "TERMINAL",
        elapsed_ms: elapsed,
        classification: boundStr(fields.classification ?? state.classification, 120),
        task_ref: fields.task_ref !== undefined ? boundStr(fields.task_ref, 200) : state.task_ref,
        request_id: fields.request_id !== undefined ? boundStr(fields.request_id, 200) : state.request_id,
        qwen_profile: fields.qwen_profile !== undefined ? boundStr(fields.qwen_profile, 120) : state.qwen_profile,
        runtime_ready: fields.runtime_ready !== undefined
          ? (fields.runtime_ready === true ? true : (fields.runtime_ready === false ? false : null))
          : state.runtime_ready,
        tests_state: fields.tests_state !== undefined ? (boundStr(fields.tests_state, 80) || state.tests_state) : state.tests_state,
        files_touched: fields.files_touched !== undefined ? boundFilesTouched(fields.files_touched) : state.files_touched,
        last_event: boundStr(fields.last_event || "terminal", 160),
      };
      startedAt = null;
      return snapshot();
    },
    snapshot,
  };
}

// Diagnostic-only normalization. Do not change boundStr/status/tick contracts.
const diagnosticObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const diagnosticText = (value, max = 200) => typeof value === "string" && value.trim()
  ? value.trim().slice(0, max) : null;
const diagnosticBoolean = (value) => typeof value === "boolean" ? value : null;
const diagnosticNumber = (value) => (typeof value === "number" || (typeof value === "string" && value.trim()))
  && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;

function diagnosticDetails(value, depth = 0) {
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.slice(0, 600);
  if (depth >= 3) return null;
  if (Array.isArray(value)) return value.slice(0, 24).map((v) => diagnosticDetails(v, depth + 1));
  if (diagnosticObject(value)) return Object.fromEntries(Object.entries(value).slice(0, 16)
    .map(([key, val]) => [key.slice(0, 80), diagnosticDetails(val, depth + 1)]));
  return null;
}

const MODEL_STATUS_LABELS = Object.freeze({
  loaded: "Caricato", unloaded: "Non caricato", loading: "Caricamento in corso",
  unloading: "Scaricamento in corso", ready: "Pronto", error: "Errore",
  failed: "Errore", unknown: "Sconosciuto", listed: "Presente nel catalogo",
  not_listed: "Assente dal catalogo", unreachable: "Non raggiungibile",
});

/** The live router exposes status.value and status.args; catalog presence is not readiness. */
export function normalizeQwenModel(value) {
  const model = diagnosticObject(value) ? value : {};
  const rawStatus = model.status ?? model.state;
  const nested = diagnosticObject(rawStatus) ? rawStatus : {};
  const state = diagnosticText(nested.value ?? nested.state ?? nested.status ?? rawStatus, 40)?.toLowerCase()
    || (rawStatus === null || rawStatus === undefined ? null : "unknown");
  const args = Array.isArray(nested.args) ? nested.args : [];
  const argument = (...flags) => {
    const index = args.findIndex((arg) => typeof arg === "string" && flags.includes(arg));
    return index >= 0 ? args[index + 1] : null;
  };
  const observedContext = diagnosticNumber(model.meta?.n_ctx ?? model.context_tokens ?? model.context_length);
  const configuredContext = diagnosticNumber(argument("--ctx-size", "-c"));
  return {
    id: diagnosticText(model.id ?? model.model ?? model.name, 120),
    status: state,
    status_label: state ? (MODEL_STATUS_LABELS[state] || "Sconosciuto") : "Non disponibile",
    health: diagnosticText(model.health?.value ?? model.health?.status ?? model.health ?? nested.health, 80),
    context_tokens: observedContext ?? configuredContext,
    context_source: observedContext !== null ? (diagnosticText(model.context_source, 80) || "model_metadata")
      : (configuredContext !== null ? "configured_args" : null),
    runtime: diagnosticText(model.runtime, 80),
    owned_by: diagnosticText(model.owned_by, 80),
    worker_pid: diagnosticNumber(model.worker_pid ?? model.worker?.pid ?? nested.pid),
    worker_port: diagnosticNumber(model.worker_port ?? model.worker?.port ?? nested.port)
      || (state === "loaded" ? diagnosticNumber(argument("--port")) || null : null),
    status_details: diagnosticDetails(model.status_details ?? (diagnosticObject(rawStatus) ? rawStatus : null)),
  };
}

/** Read-only GET :8080/v1/models — never launches, loads, or recycles. */
export async function probeQwenEndpointReadOnly(options = {}) {
  const baseUrl = String(options.baseUrl || QWEN_OBSERVE_BASE_URL).replace(/\/$/, "");
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(200, options.timeoutMs) : 2000;
  const fetchFn = options.fetchFn || globalThis.fetch;
  const wanted = diagnosticText(options.wanted_profile, 120);
  try {
    const r = await fetchFn(`${baseUrl}/v1/models`, { method: "GET", signal: AbortSignal.timeout(timeoutMs) });
    if (!r || !r.ok) {
      return {
        reachable: false,
        health_summary: `HTTP_${r?.status || "ERR"}`,
        profile_status: "unreachable",
        models: [],
        error: boundStr(`HTTP_${r?.status || "ERR"}`, 80),
      };
    }
    const body = await r.json();
    const raw = Array.isArray(body?.data) ? body.data : (Array.isArray(body?.models) ? body.models : null);
    if (!raw) return {
      reachable: true, health_summary: "invalid_catalog", profile_status: "unknown",
      models: [], model_count: null, loaded_count: null, error: "QWEN_CATALOG_INVALID",
    };
    const allModels = raw.map(normalizeQwenModel).filter((m) => m.id);
    const models = allModels.slice(0, 24);
    let profile_status = "unknown";
    if (wanted) {
      const hit = allModels.find((m) => m.id === wanted);
      profile_status = hit ? (hit.status || "unknown") : "not_listed";
    } else if (models.length) {
      profile_status = "listed";
    }
    return {
      reachable: true,
      health_summary: allModels.length ? `${allModels.length}_models` : "empty_catalog",
      profile_status,
      models,
      model_count: allModels.length,
      loaded_count: allModels.filter((m) => m.status === "loaded").length,
      models_truncated: allModels.length > models.length,
      error: allModels.length < raw.length ? "QWEN_MODEL_INVALID" : null,
    };
  } catch (err) {
    return {
      reachable: false,
      health_summary: "unreachable",
      profile_status: "unreachable",
      models: [],
      error: boundStr(err?.code || err?.message || "probe_failed", 80),
    };
  }
}

/** Dry-run queue explanation — never claims, never writes receipts. */
export function buildQueueScanDiagnostics({ entries = [], receipts = [], nowIso } = {}) {
  const decidedAt = nowIso || new Date().toISOString();
  if (!Array.isArray(entries) || !Array.isArray(receipts)) {
    return queueDiagnosticsFailure("DIAGNOSTICS_QUEUE_DATA_INVALID");
  }
  const parsed = entries.map((value) => {
    const e = diagnosticObject(value) ? value : {};
    if (e.read_failed) return { ok: false, source: diagnosticText(e.source), reason: "READ_FAILED" };
    if (e.ok === true && diagnosticObject(e.item)) return e;
    if (e.ok === false) return { ok: false, source: diagnosticText(e.source), reason: diagnosticText(e.reason, 80) || "PARSE_FAILED" };
    if (typeof e.markdown !== "string" || !e.markdown) {
      return { ok: false, source: e.source || null, reason: e.read_failed ? "READ_FAILED" : "EMPTY_FILE" };
    }
    try {
      const p = parseBacklogFile(e.markdown);
      return { ...p, markdown: e.markdown, source: e.source, backlog_path: e.backlog_path };
    } catch (err) {
      return { ok: false, source: e.source || null, reason: boundStr(err?.message || "PARSE_FAILED", 80) };
    }
  });
  const decision = selectNextQueueItem(parsed, receipts, decidedAt);
  const excluded = (decision.excluded || []).map((r) => ({
    source: diagnosticText(r.source, 200),
    reason: diagnosticText(r.reason, 80),
  }));
  const reasons = new Map();
  for (const r of excluded) {
    const key = r.reason || "UNKNOWN";
    reasons.set(key, (reasons.get(key) || 0) + 1);
  }
  const now = new Date(decidedAt);
  const items = parsed.map((entry) => {
    const item = entry.ok ? entry.item : null;
    const task_ref = typeof item?.id === "string" && item.id ? `LOCAL_DEV_B_${item.id}` : null;
    const admissible = entry.ok === true && isAdmissible(item);
    // Selector authority is ANY matching receipt, including older ledger entries.
    const matching = task_ref ? receipts.map((receipt, ledger_index) => ({ receipt, ledger_index }))
      .filter(({ receipt }) => receipt && receipt.task_ref === task_ref) : [];
    const observations = matching.map(({ receipt, ledger_index }) => ({
      ...receiptDiagnostic(receipt, now), ledger_index,
    }));
    const blocking = observations.filter((receipt) => receipt.currently_blocking);
    return {
      id: diagnosticText(item?.id), task_ref: diagnosticText(task_ref),
      source_file: diagnosticText(entry.source), backlog_state: diagnosticText(item?.state, 80),
      ready_looking: item?.state === "READY_FOR_PLANNING" || /^READY[_-]/i.test(diagnosticText(entry.source) || ""),
      admissible, eligible: admissible && blocking.length === 0,
      matching_receipt_present: matching.length > 0, matching_receipt_count: matching.length,
      currently_blocking: blocking.length > 0,
      blocking_reason: !entry.ok ? (diagnosticText(entry.reason, 80) || "PARSE_FAILED")
        : (!admissible ? "INADMISSIBLE_STATE_OR_SCOPE" : (blocking.length ? "CLAIM_ALREADY_EXISTS" : null)),
      latest_receipt: observations.at(-1) || null,
      blocking_receipt_count: blocking.length,
      blocking_receipts: blocking.slice(-16),
      blocking_receipts_truncated: blocking.length > 16,
    };
  }).sort((a, b) => Number(b.admissible) - Number(a.admissible)
    || Number(b.ready_looking) - Number(a.ready_looking)
    || (a.source_file || "").localeCompare(b.source_file || ""));
  return {
    ok: true,
    observed_at: decidedAt,
    eligible_count: boundInt(decision.eligible_count, { allowNull: false, min: 0 }),
    candidate_task_ref: boundStr(decision.selected?.task_ref, 200),
    candidate_source_file: boundStr(decision.selected?.source_file, 200),
    candidate_risk_hint: boundStr(decision.selected?.risk_hint, 40),
    selection_reason_code: boundStr(decision.reason_code, 80),
    scanned_file_count: parsed.length,
    claim_present_count: excluded.filter((r) => r.reason === "CLAIM_ALREADY_EXISTS").length,
    ready_count: items.filter((item) => item.backlog_state === "READY_FOR_PLANNING").length,
    matching_receipt_item_count: items.filter((item) => item.matching_receipt_present).length,
    rejected_count: excluded.length,
    rejected_items: excluded.slice(0, 128),
    rejected_items_truncated: excluded.length > 128,
    items: items.slice(0, 128),
    items_truncated: items.length > 128,
    skip_reason_summary: Object.fromEntries(reasons),
  };
}

function receiptDiagnostic(receipt, now) {
  // The canonical helper alone determines blocking. Everything below only explains its result.
  const currently_blocking = isReceiptBlocking(receipt, now, CLAIM_STALE_AFTER_MS);
  // Preserve malformed whitespace/type states: the authority compares exact raw values.
  const rawState = receipt?.state;
  const state = typeof rawState === "string" ? rawState.slice(0, 40) : null;
  const claimed_at = diagnosticText(receipt?.claimed_at, 80);
  const age = claimed_at ? now.getTime() - Date.parse(claimed_at) : NaN;
  let interpretation_code;
  let interpretation;
  if (!currently_blocking) {
    interpretation_code = state === "CLAIMED" ? "STALE_CLAIM_REPLAYABLE" : "PRE_EXECUTION_STOP_REPLAYABLE";
    interpretation = state === "CLAIMED"
      ? "Il criterio canonico consente una nuova candidatura: claim scaduto, esecuzione non avviata e ripetizione consentita."
      : "Il criterio canonico consente una nuova candidatura dopo uno STOP precedente all’esecuzione con ripetizione consentita.";
  } else if (!["CLAIMED", "EXECUTING", "PASS", "STOP"].includes(rawState)) {
    interpretation_code = rawState === null || rawState === undefined ? "LEGACY_RECEIPT_BLOCKING" : "UNKNOWN_RECEIPT_STATE_BLOCKING";
    interpretation = "Lo stato del receipt manca o non è riconosciuto. Il criterio canonico mantiene il blocco per sicurezza, indipendentemente dall’età.";
  } else if (state === "PASS" || state === "EXECUTING") {
    interpretation_code = `RECEIPT_${state}_BLOCKING`;
    interpretation = state === "PASS"
      ? "Il receipt registra un esito PASS e impedisce una nuova selezione dello stesso task."
      : "Il receipt registra un’esecuzione avviata e impedisce una nuova selezione. Questo dato non prova che il processo sia ancora attivo.";
  } else {
    interpretation_code = `RECEIPT_${state}_BLOCKING`;
    interpretation = state === "STOP"
      ? "Lo STOP non soddisfa le condizioni canoniche di ripetizione: devono risultare replayable=true ed execution_started=false."
      : `Il claim non soddisfa tutte le condizioni canoniche di ripetizione: età valida di almeno ${CLAIM_STALE_AFTER_MS / 60_000} minuti, replayable=true ed execution_started=false.`;
  }
  return {
    state, execution_started: diagnosticBoolean(receipt?.execution_started),
    replayable: diagnosticBoolean(receipt?.replayable), claimed_at,
    age_ms: Number.isFinite(age) && age >= 0 ? age : null,
    currently_blocking, interpretation_code, interpretation,
  };
}

function queueDiagnosticsFailure(error) {
  return {
    ok: false, observed_at: null, eligible_count: null, ready_count: null,
    candidate_task_ref: null, candidate_source_file: null, candidate_risk_hint: null,
    selection_reason_code: "DIAGNOSTICS_QUEUE_SCAN_FAILED", scanned_file_count: null,
    claim_present_count: null, matching_receipt_item_count: null, rejected_count: null,
    items: [], items_truncated: false, rejected_items: [], rejected_items_truncated: false,
    skip_reason_summary: { DIAGNOSTICS_QUEUE_SCAN_FAILED: 1 },
    error: diagnosticText(error, 160) || "DIAGNOSTICS_QUEUE_SCAN_FAILED",
  };
}

export function buildOperatorExplanation({ status, last_tick, queue } = {}) {
  const s = diagnosticObject(status) ? status : {};
  const tick = diagnosticObject(last_tick) ? last_tick : {};
  const q = diagnosticObject(queue) ? queue : {};
  // A previous tick is historical evidence, not the current queue snapshot.
  const sameTick = !s.request_id || !tick.request_id || s.request_id === tick.request_id;
  const codes = sameTick && Array.isArray(tick.reason_codes)
    ? tick.reason_codes.map((code) => diagnosticText(code, 80)).filter(Boolean).slice(0, 16) : [];
  const primaryCode = codes[0] || null;
  const classification = diagnosticText(s.classification, 120) || (sameTick ? diagnosticText(tick.classification, 120) : null);
  const task = diagnosticText(s.task_ref) || (sameTick ? diagnosticText(tick.task_ref) : null);
  const result = (headline, detail, blocked_at, why_code, action_required, operator_action, severity = "info") => ({
    headline, detail, blocked_at, why_code, action_required, operator_action, severity,
    blocked_at_label: ({ queue_selection: "Selezione della coda", "claim/bridge": "Assegnazione del claim",
      qwen_preflight: "Verifica del runtime Qwen", admission: "Ammissione del task", repo_hygiene: "Verifica del repository",
      human_gate: "Intervento umano", single_flight: "Esclusione dei cicli concorrenti", executor: "Esecuzione",
      service: "Servizio dispatcher", diagnostics: "Lettura diagnostica" })[blocked_at] || null,
  });

  if (s.active === true) {
    return result("Il dispatcher sta lavorando.", task ? `Il ciclo corrente sta elaborando ${task}.`
      : "Un ciclo è in corso; il task non è ancora stato selezionato.", null, diagnosticText(s.phase, 80), false,
    "Attendere l’avanzamento del ciclo e osservare la fase corrente.");
  }

  if (classification === "HUMAN_GATE_REQUIRED" || (sameTick && tick.human_gate_required === true)) {
    const blocked_at = codes.some((c) => c.startsWith("QWEN"))
      ? "qwen_preflight"
      : (codes.includes("MICRO_TASK_ADMISSION_REJECTED") ? "admission"
        : (codes.some((c) => /DIRTY|BRANCH|FETCH|HEAD|MERGE|REV_PARSE|LOCAL_AHEAD|DIVERGED/.test(c)) ? "repo_hygiene" : "human_gate"));
    return result("È richiesto un intervento umano.", "L’automazione si è fermata perché un prerequisito o una decisione richiede una verifica umana.",
      blocked_at, primaryCode || "HUMAN_GATE_REQUIRED", true,
      blocked_at === "qwen_preflight" ? "Verificare il runtime e il profilo richiesto usando i codici tecnici dell’ultimo ciclo."
      : "Esaminare la fase di blocco e i codici tecnici prima di autorizzare il proseguimento.", "warn");
  }

  if (classification === "SERVICE_ERROR") {
    return result("Il dispatcher ha incontrato un errore di servizio.", "L’ultimo ciclo disponibile segnala un errore del servizio; i codici tecnici ne descrivono la causa.",
      "service", primaryCode || "SERVICE_ERROR", true, "Consultare i codici dell’ultimo ciclo e i log del dispatcher.", "danger");
  }

  if (classification === "STOP" || classification?.startsWith("STOP:") || classification === "WORK_EXECUTED_STOP") {
    return result("L’ultima esecuzione si è fermata con esito STOP.", "L’esecutore ha registrato un arresto; il codice STOP va interpretato prima di valutare ulteriori azioni.",
      "executor", primaryCode || classification, true, "Esaminare i codici dell’esecutore e il receipt del task; il dashboard non autorizza ripetizioni.", "warn");
  }

  if (q.ok === false) {
    return result("La coda non è verificabile in questo momento.", "La lettura diagnostica non è riuscita: il numero di task eseguibili e lo stato dei claim non sono disponibili.",
      "diagnostics", "DIAGNOSTICS_QUEUE_SCAN_FAILED", true, "Verificare l’errore di lettura prima di interpretare la coda come vuota.", "danger");
  }

  if (classification === "BUSY") {
    return result("L’ultimo ciclo è stato rifiutato perché il dispatcher era occupato.", "Il vincolo di un solo ciclo alla volta impedisce esecuzioni concorrenti.",
      "single_flight", "BUSY", false, "Attendere il completamento del ciclo e aggiornare lo stato.");
  }

  if (q.eligible_count > 0 && diagnosticText(q.candidate_task_ref)) {
    return result("Un task è candidato al prossimo ciclo.", `${q.candidate_task_ref} risulta selezionabile nella lettura corrente. L’avvio dipende ancora dai controlli di esecuzione del prossimo ciclo.`,
      null, "SELECTED", false, "Attendere il prossimo ciclo pianificato; questa lettura non assegna lavoro.");
  }

  if (classification === "PASS" || classification === "WORK_EXECUTED_PASS") {
    return result("L’ultima esecuzione è terminata con esito PASS.", task ? `Il task ${task} ha riportato un esito PASS.` : "L’esecutore ha riportato un esito PASS nell’ultimo ciclo disponibile.",
      null, classification, false, "Consultare la coda corrente per verificare i prossimi candidati.", "ok");
  }

  if (classification === "IDLE_CLEAN" || primaryCode === "NO_ELIGIBLE_READY" || primaryCode === "CLAIM_SKIPPED_PRESENT" || q.eligible_count === 0) {
    const why = primaryCode === "CLAIM_SKIPPED_PRESENT" ? primaryCode : "NO_ELIGIBLE_READY";
    return result("Nessun task eseguibile in questo momento.", q.claim_present_count > 0
      ? "La coda è stata controllata, ma i task READY ammissibili risultano bloccati da receipt esistenti."
      : "La coda è stata controllata, ma nessun task READY è attualmente libero e ammissibile per la selezione.",
    why === "CLAIM_SKIPPED_PRESENT" ? "claim/bridge" : "queue_selection", why, false,
    q.claim_present_count > 0 ? "Consultare i receipt bloccanti: un claim esistente non richiede automaticamente un intervento o una cancellazione."
      : "Attendere la presenza di un task ammissibile nella coda.", q.claim_present_count > 0 ? "warning" : "info");
  }

  return result("Il dispatcher è in attesa di dati.", "Non è disponibile un esito conclusivo sufficiente per spiegare lo stato corrente.",
    null, classification, null, "Aggiornare la lettura e attendere il prossimo ciclo pianificato.");
}

export async function buildDiagnostics(deps = {}) {
  const status = (() => {
    try {
      const value = deps.statusTracker && typeof deps.statusTracker.snapshot === "function"
        ? deps.statusTracker.snapshot()
        : emptyStatusSnapshot();
      return diagnosticObject(value) ? value : emptyStatusSnapshot({ last_event: "status_snapshot_unavailable" });
    } catch {
      return emptyStatusSnapshot({ last_event: "status_snapshot_error" });
    }
  })();
  const last_tick = (() => {
    try {
      const value = deps.lastTickStore && typeof deps.lastTickStore.snapshot === "function"
        ? deps.lastTickStore.snapshot()
        : null;
      return diagnosticObject(value) ? value : null;
    } catch {
      return null;
    }
  })();

  const scan = deps.scanQueue || ((queueDir) => {
    const abs = resolve(CANONICAL_REPO_PATH, queueDir);
    if (!existsSync(abs)) return [];
    return readdirSync(abs).filter((f) => f.endsWith(".md")).sort().map((f) => {
      try {
        const markdown = readFileSync(join(abs, f), "utf8").replace(/^\uFEFF/, "");
        return { markdown, source: f, backlog_path: `${queueDir}/${f}` };
      } catch {
        return { markdown: "", source: f, backlog_path: `${queueDir}/${f}`, read_failed: true };
      }
    });
  });
  const receiptsPath = deps.receiptsPath || resolve(CANONICAL_REPO_PATH, RECEIPTS_PATH);
  // Diagnostics must distinguish an empty ledger from an unreadable ledger.
  // The existing execution loader and its execution policy remain unchanged.
  const loadReceipts = deps.loadReceipts || (() => {
    if (!existsSync(receiptsPath)) return [];
    const ledger = JSON.parse(readFileSync(receiptsPath, "utf8").replace(/^\uFEFF/, ""));
    if (!Array.isArray(ledger)) throw new Error("DIAGNOSTICS_RECEIPTS_INVALID");
    return ledger;
  });
  const nowIso = deps.nowIso ? deps.nowIso() : new Date().toISOString();
  let queue;
  try {
    queue = buildQueueScanDiagnostics({
      entries: scan(QUEUE_DIR),
      receipts: loadReceipts(),
      nowIso,
    });
  } catch (err) {
    queue = queueDiagnosticsFailure(err?.message);
  }

  const probe = deps.probeQwen || probeQwenEndpointReadOnly;
  let observation;
  try {
    observation = await probe({ wanted_profile: diagnosticText(status.qwen_profile, 120) });
  } catch (err) {
    observation = { reachable: null, error: diagnosticText(err?.message, 80) || "QWEN_PROBE_FAILED" };
  }
  const qwen = diagnosticObject(observation) ? observation : {};
  const models = Array.isArray(qwen.models) ? qwen.models.slice(0, 24).map(normalizeQwenModel).filter((model) => model.id) : [];
  const profile_status = diagnosticText(qwen.profile_status, 40)
    || (qwen.profile_status === null || qwen.profile_status === undefined ? null : "unknown");

  const explanation = buildOperatorExplanation({ status, last_tick, queue });
  return {
    schema_version: DIAGNOSTICS_SCHEMA,
    generated_at: nowIso,
    read_only: true,
    status,
    last_tick,
    queue,
    qwen: {
      endpoint: QWEN_OBSERVE_BASE_URL,
      reachable: diagnosticBoolean(qwen.reachable),
      health_summary: diagnosticText(qwen.health_summary, 80),
      profile_status,
      profile_status_label: profile_status ? (MODEL_STATUS_LABELS[profile_status] || "Sconosciuto") : "Non disponibile",
      models,
      model_count: diagnosticNumber(qwen.model_count) ?? (qwen.reachable === true && !qwen.error ? models.length : null),
      loaded_count: diagnosticNumber(qwen.loaded_count) ?? (qwen.reachable === true && !qwen.error ? models.filter((model) => model.status === "loaded").length : null),
      models_truncated: qwen.models_truncated === true || (Array.isArray(qwen.models) && qwen.models.length > models.length),
      error: diagnosticText(qwen.error, 80) || (!diagnosticObject(observation) ? "QWEN_OBSERVATION_UNAVAILABLE" : null),
    },
    explanation,
  };
}

function loadDashboardHtml() {
  try {
    if (existsSync(DASHBOARD_HTML_PATH)) {
      return readFileSync(DASHBOARD_HTML_PATH, "utf8");
    }
  } catch { /* fall through */ }
  return `<!DOCTYPE html><html><body><h1>Dispatcher dashboard missing</h1><p>Expected ${DASHBOARD_HTML_PATH}</p></body></html>`;
}

function gitExec(repoPath, args) {
  return new Promise((res) => {
    execFile("git.exe", args, { cwd: repoPath, windowsHide: true, timeout: 120_000 }, (err, stdout, stderr) => {
      res({ status: err ? (typeof err.code === "number" ? err.code : 1) : 0, stdout: stdout || "", stderr: stderr || "" });
    });
  });
}

/** Fail-closed repo hygiene: canonical checkout + main + synced + clean-enough.
 * When local main is a strict ancestor of origin/main and the TRACKED
 * worktree is clean, performs exactly one `git merge --ff-only origin/main`
 * (V4_DISPATCHER_SAFE_FAST_FORWARD_SYNC_V1). Never reset/stash/clean/rebase.
 * Untracked files are ignored by the dirty check and never touched.
 */
export async function verifyRepoState(deps = {}) {
  const run = deps.gitExec || gitExec;
  const repoPath = deps.repoPath || CANONICAL_REPO_PATH;
  if (!existsSync(repoPath)) {
    return { ok: false, reason_codes: ["CANONICAL_REPO_PATH_MISSING"], human_gate_required: true };
  }
  const inside = await run(repoPath, ["rev-parse", "--is-inside-work-tree"]);
  if (inside.status !== 0 || inside.stdout.trim() !== "true") {
    return { ok: false, reason_codes: ["NOT_A_GIT_WORKTREE"], human_gate_required: true };
  }
  const branch = await run(repoPath, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch.status !== 0 || branch.stdout.trim() !== "main") {
    return { ok: false, reason_codes: ["BRANCH_NOT_MAIN"], human_gate_required: true };
  }
  const fetch = await run(repoPath, ["fetch", "origin", "main"]);
  if (fetch.status !== 0) {
    return { ok: false, reason_codes: ["FETCH_FAILED"], human_gate_required: true };
  }

  // TRACKED dirty must block BEFORE any sync mutation (untracked preserved).
  const dirty = await run(repoPath, ["status", "--porcelain=v1", "--untracked-files=no"]);
  if (dirty.status !== 0) {
    return { ok: false, reason_codes: ["STATUS_FAILED"], human_gate_required: true };
  }
  const dirtyLines = dirty.stdout.split("\n").filter((l) => l.trim());
  if (dirtyLines.length) {
    return {
      ok: false,
      reason_codes: ["TRACKED_DIRTY_CONFLICT"],
      human_gate_required: true,
      gate_summary: `tracked dirty: ${dirtyLines.length} file(s)`,
    };
  }

  const local = await run(repoPath, ["rev-parse", "HEAD"]);
  const remote = await run(repoPath, ["rev-parse", "origin/main"]);
  if (local.status !== 0 || remote.status !== 0) {
    return { ok: false, reason_codes: ["REV_PARSE_FAILED"], human_gate_required: true };
  }
  let headSha = local.stdout.trim();
  const originSha = remote.stdout.trim();
  if (!/^[0-9a-f]{40}$/i.test(headSha) || !/^[0-9a-f]{40}$/i.test(originSha)) {
    return { ok: false, reason_codes: ["REV_PARSE_FAILED"], human_gate_required: true };
  }

  // Already synced — no mutation.
  if (headSha === originSha) {
    return {
      ok: true,
      reason_codes: [],
      head: headSha,
      human_gate_required: false,
      sync_performed: false,
    };
  }

  // Ancestry: behind / ahead / diverged (fail closed on merge-base failure).
  const mb = await run(repoPath, ["merge-base", "HEAD", "origin/main"]);
  if (mb.status !== 0 || !/^[0-9a-f]{40}$/i.test(mb.stdout.trim())) {
    return { ok: false, reason_codes: ["MERGE_BASE_FAILED"], human_gate_required: true };
  }
  const baseSha = mb.stdout.trim();
  if (baseSha === originSha && headSha !== originSha) {
    return { ok: false, reason_codes: ["LOCAL_AHEAD_OF_ORIGIN"], human_gate_required: true };
  }
  if (baseSha !== headSha && baseSha !== originSha) {
    return { ok: false, reason_codes: ["HEAD_ORIGIN_DIVERGED"], human_gate_required: true };
  }
  if (baseSha !== headSha) {
    // Not a strict ancestor relationship we recognize.
    return { ok: false, reason_codes: ["HEAD_ORIGIN_MISMATCH"], human_gate_required: true };
  }

  // Strict ancestor: HEAD is behind origin/main → exactly one ff-only merge.
  const ff = await run(repoPath, ["merge", "--ff-only", "origin/main"]);
  if (ff.status !== 0) {
    return { ok: false, reason_codes: ["FAST_FORWARD_FAILED"], human_gate_required: true };
  }
  const after = await run(repoPath, ["rev-parse", "HEAD"]);
  if (after.status !== 0) {
    return { ok: false, reason_codes: ["REV_PARSE_FAILED"], human_gate_required: true };
  }
  headSha = after.stdout.trim();
  if (headSha !== originSha) {
    return { ok: false, reason_codes: ["FAST_FORWARD_DID_NOT_SYNC"], human_gate_required: true };
  }
  return {
    ok: true,
    reason_codes: ["FAST_FORWARD_SYNCED"],
    head: headSha,
    human_gate_required: false,
    sync_performed: true,
  };
}

export function validateTickRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, reason_codes: ["BODY_NOT_OBJECT"] };
  }
  if (body.schema_version !== REQUEST_SCHEMA) {
    return { ok: false, reason_codes: ["SCHEMA_VERSION_UNSUPPORTED"] };
  }
  if (typeof body.request_id !== "string" || !body.request_id.trim() || body.request_id.length > 200) {
    return { ok: false, reason_codes: ["REQUEST_ID_INVALID"] };
  }
  if (body.source !== "n8n") {
    return { ok: false, reason_codes: ["SOURCE_UNSUPPORTED"] };
  }
  const allowedKeys = ["schema_version", "request_id", "source"];
  for (const k of Object.keys(body)) {
    if (!allowedKeys.includes(k)) return { ok: false, reason_codes: ["REQUEST_FIELD_UNSUPPORTED", k] };
  }
  return { ok: true, reason_codes: [] };
}

export function wrapTickResult(partial) {
  return {
    schema_version: RESULT_SCHEMA,
    ok: partial.ok === true,
    request_id: partial.request_id ?? null,
    classification: partial.classification ?? "SERVICE_ERROR",
    execution_performed: partial.execution_performed === true,
    task_ref: partial.task_ref ?? null,
    executor_classification: partial.executor_classification ?? null,
    human_gate_required: partial.human_gate_required === true,
    gate_summary: partial.gate_summary ?? null,
    reason_codes: Array.isArray(partial.reason_codes) ? partial.reason_codes.slice(0, 16) : [],
  };
}

/**
 * Remembers the most recent completed tick result (observability only).
 * Never influences selection/claim/execution.
 */
export function createLastTickStore() {
  let last = null;
  return {
    record(result, meta = {}) {
      const wrapped = wrapTickResult(result || {});
      last = {
        schema_version: LAST_TICK_SCHEMA,
        recorded_at: boundStr(meta.recorded_at || new Date().toISOString(), 40),
        elapsed_ms: boundInt(meta.elapsed_ms, { allowNull: true, min: 0 }),
        ok: wrapped.ok === true,
        request_id: boundStr(wrapped.request_id, 200),
        classification: boundStr(wrapped.classification, 120),
        execution_performed: wrapped.execution_performed === true,
        task_ref: boundStr(wrapped.task_ref, 200),
        executor_classification: boundStr(wrapped.executor_classification, 120),
        human_gate_required: wrapped.human_gate_required === true,
        gate_summary: boundStr(wrapped.gate_summary, 240),
        // WF90 may derive notify; dispatcher result does not emit it today.
        notify_required: meta.notify_required === true ? true : (meta.notify_required === false ? false : null),
        reason_codes: Array.isArray(wrapped.reason_codes) ? wrapped.reason_codes.slice(0, 16) : [],
      };
      return last;
    },
    snapshot() {
      return last;
    },
  };
}

/** Normalize an executor result into the bounded tick result. */
export function classificationFromExecutorResult(executorResult, request_id) {
  const pass = executorResult && executorResult.status === "PASS";
  return wrapTickResult({
    ok: pass,
    request_id,
    classification: pass ? "WORK_EXECUTED_PASS" : "WORK_EXECUTED_STOP",
    execution_performed: true,
    task_ref: executorResult?.task_ref ?? null,
    executor_classification: executorResult?.classification ?? null,
    human_gate_required: false,
    reason_codes: Array.isArray(executorResult?.reason_codes) ? executorResult.reason_codes : [],
  });
}

/**
 * TRUE only when NONE of the supported performTick dependencies were injected.
 * Any supplied injectable dep disables BOTH claim-envelope and receipts writes
 * (V4_PARTIAL_INJECTED_TICKDEPS_REAL_RUNTIME_ISOLATION_V1 — closes S4 verifyRepo-only leakage).
 */
export function shouldPersistRuntimeArtifacts(deps = {}) {
  return !(
    deps.verifyRepo ||
    deps.scanQueue ||
    deps.runDispatchLoop ||
    deps.runExecutor ||
    deps.nowIso ||
    deps.ensureDevQwenReady
  );
}

/**
 * Atomic same-directory receipts persist: write complete JSON to a unique
 * temp file, then rename onto receipts.json. Best-effort temp cleanup on
 * failure. Never truncates the canonical file in place.
 */
export function persistReceiptsAtomic(targetPath, receipts) {
  if (typeof targetPath !== "string" || !targetPath) {
    const err = new Error("RECEIPTS_PATH_INVALID");
    err.code = "RECEIPTS_PATH_INVALID";
    throw err;
  }
  if (!Array.isArray(receipts)) {
    const err = new Error("RECEIPTS_NOT_ARRAY");
    err.code = "RECEIPTS_NOT_ARRAY";
    throw err;
  }
  const dir = dirname(targetPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmp = join(dir, `.receipts-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`);
  try {
    writeFileSync(tmp, `${JSON.stringify(receipts, null, 2)}\n`, "utf8");
    renameSync(tmp, targetPath);
  } catch (err) {
    try { unlinkSync(tmp); } catch { /* best-effort */ }
    throw err;
  }
}

/**
 * One bounded tick. deps are injectable for offline tests:
 * verifyRepo, scanQueue, runDispatchLoop, runExecutor, nowIso, statusTracker.
 * scanQueue returns [{ ok, item, markdown, source, backlog_path }].
 */
export async function performTick(body, deps = {}) {
  const requestId = typeof body?.request_id === "string" ? body.request_id : null;
  const tracker = deps.statusTracker || null;
  const statusSafe = (fn, ...args) => {
    try { return tracker && typeof tracker[fn] === "function" ? tracker[fn](...args) : null; } catch { return null; }
  };
  const terminalClassification = (result) => {
    if (!result) return "SERVICE_ERROR";
    if (result.executor_classification) return result.executor_classification;
    if (result.classification === "WORK_EXECUTED_PASS") return "PASS";
    if (result.classification === "WORK_EXECUTED_STOP") return result.executor_classification || "STOP";
    return result.classification || "SERVICE_ERROR";
  };
  const done = (result) => {
    const finished = statusSafe("finish", {
      request_id: requestId,
      task_ref: result?.task_ref ?? null,
      classification: terminalClassification(result),
      last_event: `terminal:${terminalClassification(result)}`,
    });
    try {
      if (deps.lastTickStore && typeof deps.lastTickStore.record === "function") {
        deps.lastTickStore.record(result, {
          elapsed_ms: finished?.elapsed_ms ?? null,
          recorded_at: deps.nowIso ? deps.nowIso() : new Date().toISOString(),
        });
      }
    } catch { /* observability only */ }
    return result;
  };

  statusSafe("start", {
    request_id: requestId,
    phase: "REPO_HYGIENE",
    executor_pid: process.pid,
    last_event: "repo_hygiene",
  });

  const verifyRepo = deps.verifyRepo || verifyRepoState;
  const scan = deps.scanQueue || ((queueDir) => {
    const abs = resolve(CANONICAL_REPO_PATH, queueDir);
    if (!existsSync(abs)) return [];
    return readdirSync(abs).filter((f) => f.endsWith(".md")).sort().map((f) => {
      try {
        const markdown = readFileSync(join(abs, f), "utf8").replace(/^\uFEFF/, "");
        return { markdown, source: f, backlog_path: `${queueDir}/${f}` };
      } catch {
        return { markdown: "", source: f, backlog_path: `${queueDir}/${f}`, read_failed: true };
      }
    });
  });
  const dispatchLoop = deps.runDispatchLoop || runDispatchLoop;
  const defaultRunExecutor = async (envelope, execOpts = {}) =>
    executeLocalDevTask(envelope, { ...composeRunners(), ...execOpts });
  const runExecutor = deps.runExecutor || defaultRunExecutor;
  const nowIso = deps.nowIso ? deps.nowIso() : new Date().toISOString();
  const receiptsPath = deps.receiptsPath || resolve(CANONICAL_REPO_PATH, RECEIPTS_PATH);
  const loadReceipts = deps.loadReceipts || (() => loadReceiptsFile(receiptsPath));

  // 1. Repo hygiene (fail-closed, non-destructive).
  const repoState = await verifyRepo();
  if (!repoState.ok) {
    return done(wrapTickResult({
      ok: false,
      request_id: requestId,
      classification: "HUMAN_GATE_REQUIRED",
      human_gate_required: true,
      gate_summary: repoState.gate_summary || (repoState.reason_codes || []).join(","),
      reason_codes: repoState.reason_codes,
    }));
  }
  const head = repoState.head;

  // 2. Claim AT MOST ONE real READY item via the proven dispatcher primitive.
  statusSafe("update", { phase: "QUEUE_SCAN", last_event: "queue_scan" });
  const receipts = loadReceipts();
  const entries = scan(QUEUE_DIR).map((e) => {
    if (e.read_failed || !e.markdown) return { ok: false, source: e.source };
    try {
      const parsed = parseBacklog(e.markdown);
      return { ...parsed, markdown: e.markdown, source: e.source, backlog_path: e.backlog_path };
    } catch {
      return { ok: false, source: e.source };
    }
  });
  const loop = dispatchLoop(entries, receipts, {
    repo: REPO,
    commit: head,
    head,
    nowIso,
    maxClaims: 1,
    queueDir: QUEUE_DIR,
  });
  if (!loop.claims.length) {
    return done(wrapTickResult({
      ok: true,
      request_id: requestId,
      classification: "IDLE_CLEAN",
      execution_performed: false,
      reason_codes: loop.skipped?.length ? ["CLAIM_SKIPPED_PRESENT"] : ["NO_ELIGIBLE_READY"],
    }));
  }
  const claim = loop.claims[0];
  statusSafe("update", {
    phase: "QWEN_PREFLIGHT",
    task_ref: claim.task_ref,
    qwen_profile: claim?.envelope?.profile_id ?? null,
    last_event: "qwen_preflight",
  });

  // 2b. Exact DEV profile readiness BEFORE any durable claim/envelope write.
  // In-memory selection is not consumption; persistence is.
  const ensureDevQwenReady = deps.ensureDevQwenReady || ensureWorkstationDevQwenReady;
  const profileId = claim?.envelope?.profile_id;
  let readiness;
  try {
    readiness = await ensureDevQwenReady({
      profile: profileId,
      readinessTimeoutMs: deps.qwenPreflightTimeoutMs ?? QWEN_PREFLIGHT_TIMEOUT_MS,
    });
  } catch (err) {
    statusSafe("update", { runtime_ready: false, last_event: "qwen_preflight_threw" });
    return done(wrapTickResult({
      ok: false,
      request_id: requestId,
      classification: "HUMAN_GATE_REQUIRED",
      execution_performed: false,
      task_ref: claim.task_ref,
      human_gate_required: true,
      gate_summary: "QWEN_SESSION_NOT_READY",
      reason_codes: [
        "QWEN_SESSION_NOT_READY",
        String(err?.code || err?.message || "ensure_threw").slice(0, 80),
      ],
    }));
  }
  if (!readiness || readiness.ready !== true) {
    const status = readiness?.reason_code || readiness?.status || "QWEN_SESSION_NOT_READY";
    statusSafe("update", { runtime_ready: false, last_event: "qwen_not_ready" });
    return done(wrapTickResult({
      ok: false,
      request_id: requestId,
      classification: "HUMAN_GATE_REQUIRED",
      execution_performed: false,
      task_ref: claim.task_ref,
      human_gate_required: true,
      gate_summary: `QWEN_SESSION_NOT_READY:${status}`,
      reason_codes: ["QWEN_SESSION_NOT_READY", String(status).slice(0, 80)],
    }));
  }
  statusSafe("update", { runtime_ready: true, last_event: "qwen_ready" });

  // 3. Persist claim receipts + envelope ONLY after exact profile READY.
  // Real runtime (zero injected deps) persists BOTH; ANY injected performTick
  // dependency persists NEITHER (shouldPersistRuntimeArtifacts).
  statusSafe("update", { phase: "CLAIM", last_event: "claim_persist" });
  const realRuntimePersistence = shouldPersistRuntimeArtifacts(deps);
  const persistReceiptsFn = deps.persistReceipts
    || (realRuntimePersistence ? (list) => persistReceiptsAtomic(receiptsPath, list) : null);
  const persistFailed = (err) => wrapTickResult({
    ok: false,
    request_id: requestId,
    classification: "SERVICE_ERROR",
    task_ref: claim.task_ref,
    reason_codes: ["PERSIST_FAILED", String(err?.code || err?.message || "unknown").slice(0, 80)],
  });
  let ledger = receipts.concat(loop.claims.map((c) => buildReceiptLifecycle(c.receipt || { task_ref: c.task_ref }, "CLAIMED")));
  try {
    if (realRuntimePersistence) {
      const outDir = resolve(CANONICAL_REPO_PATH, QUEUE_DIR);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      const safe = claim.task_ref.replace(/[^A-Za-z0-9_-]/g, "_");
      writeFileSync(join(outDir, `${safe}__dispatch-envelope.json`), JSON.stringify(claim.envelope, null, 2), "utf8");
    }
    if (persistReceiptsFn) persistReceiptsFn(ledger);
  } catch (err) {
    return done(persistFailed(err));
  }

  // 3b. MICRO_TASK_DELTA admission — AFTER claim, BEFORE executor.
  // Rejected admission never reaches runExecutor (execution_performed=false).
  // Classification HUMAN_GATE_REQUIRED stays within the WF90 ALLOWED set
  // (no live schema expansion in this pass).
  statusSafe("update", { phase: "ADMISSION", last_event: "admission" });
  const admitFn = deps.admitMicroTaskDelta || admitMicroTaskDelta;
  const admissionInput = deps.admissionInput
    || extractMicroTaskAdmissionInput(claim);
  const admission = admitFn(admissionInput);
  if (!admission || admission.admitted !== true) {
    try {
      ledger = transitionLatestReceipt(ledger, claim.task_ref, "STOP", {
        execution_started: false,
        replayable: true,
      });
      if (persistReceiptsFn) persistReceiptsFn(ledger);
    } catch (err) {
      return done(persistFailed(err));
    }
    return done(wrapTickResult({
      ok: false,
      request_id: requestId,
      classification: "HUMAN_GATE_REQUIRED",
      execution_performed: false,
      task_ref: claim.task_ref,
      human_gate_required: true,
      gate_summary: (admission?.reason_codes || ["MICRO_TASK_ADMISSION_REJECTED"]).join(","),
      reason_codes: [
        "MICRO_TASK_ADMISSION_REJECTED",
        ...(Array.isArray(admission?.reason_codes) ? admission.reason_codes : ["ADMISSION_HELPER_INVALID"]),
      ].slice(0, 16),
    }));
  }

  // 4. Persist EXECUTING immediately BEFORE runExecutor, then execute.
  try {
    ledger = transitionLatestReceipt(ledger, claim.task_ref, "EXECUTING");
    if (persistReceiptsFn) persistReceiptsFn(ledger);
  } catch (err) {
    return done(persistFailed(err));
  }
  statusSafe("update", {
    phase: "EXECUTING",
    executor_pid: process.pid,
    last_event: "executor_start",
  });
  let executorResult;
  try {
    const onStatus = (event = {}) => {
      statusSafe("update", {
        phase: event.phase || "EXECUTING",
        tests_state: event.tests_state,
        files_touched: event.files_touched,
        classification: event.classification,
        last_event: event.last_event || event.phase || "executor_event",
      });
    };
    executorResult = await runExecutor(claim.envelope, { onStatus });
  } catch (err) {
    executorResult = {
      status: "STOP",
      classification: "STOP:SERVICE_EXECUTION_ERROR",
      task_ref: claim.task_ref,
      reason_codes: [String(err?.code || err?.message || "executor_error").slice(0, 80)],
    };
  }
  const terminalPass = executorResult && executorResult.status === "PASS";
  try {
    ledger = transitionLatestReceipt(
      ledger,
      claim.task_ref,
      terminalPass ? "PASS" : "STOP",
      { execution_started: true, replayable: false },
    );
    if (persistReceiptsFn) persistReceiptsFn(ledger);
  } catch (err) {
    return done(persistFailed(err));
  }
  return done(classificationFromExecutorResult(executorResult, requestId));
}

// parseBacklog via the proven selector module (imported lazily to keep the
// module import graph identical to the proven dispatcher primitive).
import { parseBacklogFile as parseBacklog } from "./select-local-dev-queue-item-v1.mjs";

function loadReceiptsFile(path = resolve(CANONICAL_REPO_PATH, RECEIPTS_PATH)) {
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Read the request body with a hard byte cap. */
function readBody(req) {
  return new Promise((res) => {
    let size = 0;
    const chunks = [];
    let done = false;
    const finish = (v) => { if (!done) { done = true; res(v); } };
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) { finish(null); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => finish(Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => finish(null));
  });
}

/** HTTP handler. Injected deps only for tests. Routes tick/status/diagnostics/dashboard. */
export async function handleTickRequest(req, res, deps = {}) {
  const send = (status, obj) => {
    try {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(`${JSON.stringify(obj)}\n`);
    } catch { /* client gone */ }
  };
  const sendHtml = (status, html) => {
    try {
      res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(html);
    } catch { /* client gone */ }
  };
  let url;
  try { url = new URL(req.url, "http://127.0.0.1"); } catch { url = null; }
  const path = url?.pathname || "";

  // Read-only dashboard (HTML). Never acquires the tick lock.
  if (DASHBOARD_PATHS.includes(path)) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      send(405, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["GET_ONLY"] }));
      return;
    }
    const html = typeof deps.dashboardHtml === "string" ? deps.dashboardHtml : loadDashboardHtml();
    if (req.method === "HEAD") {
      try {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
        res.end();
      } catch { /* ignore */ }
      return;
    }
    sendHtml(200, html);
    return;
  }

  // Read-only status: never acquires the tick lock, never executes work.
  if (path === STATUS_PATH) {
    if (req.method !== "GET") {
      send(405, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["GET_ONLY"] }));
      return;
    }
    const tracker = deps.statusTracker || null;
    let snap;
    try {
      snap = tracker && typeof tracker.snapshot === "function"
        ? tracker.snapshot()
        : emptyStatusSnapshot();
    } catch {
      snap = emptyStatusSnapshot({ phase: "IDLE", last_event: "status_snapshot_error" });
    }
    send(200, snap);
    return;
  }

  // Read-only diagnostics: queue dry-run + last tick + optional Qwen probe.
  if (path === DIAGNOSTICS_PATH) {
    if (req.method !== "GET") {
      send(405, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["GET_ONLY"] }));
      return;
    }
    try {
      const diag = await buildDiagnostics({
        statusTracker: deps.statusTracker,
        lastTickStore: deps.lastTickStore,
        scanQueue: deps.diagnosticsScanQueue || deps.tickDeps?.scanQueue,
        loadReceipts: deps.diagnosticsLoadReceipts || deps.tickDeps?.loadReceipts,
        receiptsPath: deps.receiptsPath || deps.tickDeps?.receiptsPath,
        probeQwen: deps.probeQwen,
        nowIso: deps.nowIso || deps.tickDeps?.nowIso,
      });
      send(200, diag);
    } catch (err) {
      send(500, {
        schema_version: DIAGNOSTICS_SCHEMA,
        read_only: true,
        ok: false,
        reason_codes: ["DIAGNOSTICS_FAILED", boundStr(err?.message || err, 80)],
      });
    }
    return;
  }

  if (path !== TICK_PATH) {
    send(404, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["PATH_NOT_FOUND"] }));
    return;
  }
  if (req.method !== "POST") {
    send(405, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["POST_ONLY"] }));
    return;
  }
  const raw = await readBody(req);
  if (raw === null) {
    send(413, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["BODY_TOO_LARGE"] }));
    return;
  }
  let body;
  try { body = JSON.parse(raw); } catch {
    send(400, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["BODY_NOT_JSON"] }));
    return;
  }
  const validation = validateTickRequest(body);
  if (!validation.ok) {
    send(400, wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: validation.reason_codes }));
    return;
  }
  // Single-flight: concurrent ticks are BUSY, never queued.
  if (deps.tryAcquireLock && !deps.tryAcquireLock()) {
    send(409, wrapTickResult({ ok: false, request_id: body.request_id, classification: "BUSY", reason_codes: ["EXECUTION_IN_FLIGHT"] }));
    return;
  }
  try {
    const tickDeps = { ...(deps.tickDeps || {}) };
    if (deps.statusTracker && !tickDeps.statusTracker) tickDeps.statusTracker = deps.statusTracker;
    if (deps.lastTickStore && !tickDeps.lastTickStore) tickDeps.lastTickStore = deps.lastTickStore;
    const result = await performTick(body, tickDeps);
    if (deps.releaseLock) deps.releaseLock();
    // WORK_EXECUTED_STOP is a well-formed bounded contract result (executor
    // stopped safely) — transport 200; the n8n normalizer keys off
    // classification, not status code. 500 stays reserved for SERVICE_ERROR
    // (malformed/failed service responses) and HUMAN_GATE_REQUIRED stays 409.
    const status = result.classification === "SERVICE_ERROR" ? 500
      : result.classification === "HUMAN_GATE_REQUIRED" ? 409
      : 200;
    send(status, result);
  } catch (err) {
    if (deps.releaseLock) deps.releaseLock();
    try {
      deps.statusTracker?.finish?.({
        request_id: body.request_id,
        classification: "SERVICE_ERROR",
        last_event: "tick_unhandled",
      });
    } catch { /* observability only */ }
    send(500, wrapTickResult({ ok: false, request_id: body.request_id, classification: "SERVICE_ERROR", reason_codes: ["TICK_UNHANDLED", String(err?.message || err).slice(0, 80)] }));
  }
}

export function startServer(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  let executing = false;
  const tryAcquireLock = () => {
    if (executing) return false;
    executing = true;
    return true;
  };
  const releaseLock = () => { executing = false; };
  const statusTracker = options.statusTracker || createExecutionStatusTracker();
  const lastTickStore = options.lastTickStore || createLastTickStore();
  const server = http.createServer((req, res) => {
    handleTickRequest(req, res, {
      ...(options.deps || {}),
      tryAcquireLock,
      releaseLock,
      statusTracker,
      lastTickStore,
    }).catch(() => {
      releaseLock();
      try {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(`${JSON.stringify(wrapTickResult({ ok: false, classification: "SERVICE_ERROR", reason_codes: ["HANDLER_UNHANDLED"] }))}\n`);
      } catch { /* ignore */ }
    });
  });
  return new Promise((resolvePromise, rejectPromise) => {
    server.on("error", rejectPromise);
    server.listen(port, host, () => resolvePromise(server));
  });
}

async function main() {
  const server = await startServer();
  const addr = server.address();
  process.stdout.write(`${JSON.stringify({
    schema_version: RESULT_SCHEMA,
    service: "local-dev-autonomous-dispatcher-v1",
    listening: `${addr.address}:${addr.port}`,
    tick_path: TICK_PATH,
    status_path: STATUS_PATH,
    diagnostics_path: DIAGNOSTICS_PATH,
    dashboard_path: "/dashboard",
    external_route: "/v4/local-dev/dispatch-tick",
    repo: CANONICAL_REPO_PATH,
    queue_dir: QUEUE_DIR,
    started_at: new Date().toISOString(),
  })}\n`);
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/serve-local-dev-autonomous-dispatcher-v1.mjs");
if (isMain) {
  main().catch((e) => {
    process.stderr.write(`error: ${e && e.message ? e.message : e}\n`);
    process.exit(1);
  });
}

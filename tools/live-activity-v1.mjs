#!/usr/bin/env node
/**
 * live-activity-v1 — passive bounded OpenCode/executor activity projection (#120).
 *
 * Laws:
 * - Outside Git (%LOCALAPPDATA%\ControlPlane\runtime\live-activity.json)
 * - Ring buffer, hard size caps, debounced disk flush
 * - No extra model calls; observability failure never breaks execution
 * - Allow-listed fields + secret redaction; no raw CoT / env / full shell lines
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { homedir } from "node:os";

export const LIVE_ACTIVITY_SCHEMA = "local-dev-live-activity-v1";
export const LIVE_ACTIVITY_PATH = "/v1/live-activity";
export const LIVE_BUFFER_MAX_EVENTS = 80;
export const LIVE_MAX_EVENT_CHARS = 240;
export const LIVE_MAX_MESSAGE_CHARS = 160;
export const LIVE_MAX_PAYLOAD_BYTES = 48_000;
export const LIVE_FLUSH_DEBOUNCE_MS = 400;
export const LIVE_MAX_OUTPUT_EXCERPTS = 8;

const SECRET_RE = /(secret|token|cookie|password|authorization|api[_-]?key|bearer\s+|sk-[A-Za-z0-9_-]+|gh[pousr]_[A-Za-z0-9_]+)/i;
const ENV_DUMP_RE = /\b(process\.env|OPENAI_API_KEY|ANTHROPIC_API_KEY|HF_TOKEN|GITHUB_TOKEN)\b/i;
const COT_RE = /\b(chain[- ]?of[- ]?thought|private\s+scratchpad|hidden\s+reasoning|latent\s+reasoning|internal\s+deliberation)\b/i;

const EVENT_TYPES = new Set([
  "TASK_ACTIVITY", "FILE_READ", "FILE_EDIT", "COMMAND", "TEST", "GIT", "PERSISTENCE", "OUTPUT", "PHASE",
]);

export function liveActivityStoragePath(env = process.env, home = homedir()) {
  // File path override only — never confuse with HTTP LIVE_ACTIVITY_PATH.
  if (typeof env?.CONTROL_PLANE_LIVE_ACTIVITY_FILE === "string" && env.CONTROL_PLANE_LIVE_ACTIVITY_FILE.trim()) {
    return env.CONTROL_PLANE_LIVE_ACTIVITY_FILE.trim();
  }
  const base = typeof env?.LOCALAPPDATA === "string" && env.LOCALAPPDATA.trim()
    ? join(env.LOCALAPPDATA, "ControlPlane", "runtime")
    : join(home || ".", ".control-plane-runtime");
  return join(base, "live-activity.json");
}

/** Attach passive capture to an existing spawn handle's data streams (if any).
 * Observability failures are swallowed — never alters spawn/execution. */
export function attachLiveCaptureToSpawn(handle, sink, streams = {}) {
  if (!sink || !handle) return handle;
  try {
    const out = streams.stdout;
    const err = streams.stderr;
    if (out && typeof out.on === "function") {
      out.on("data", (d) => { try { sink.ingestChunk(d, "stdout"); } catch { /* ignore */ } });
    }
    if (err && typeof err.on === "function") {
      err.on("data", (d) => { try { sink.ingestChunk(d, "stderr"); } catch { /* ignore */ } });
    }
  } catch { /* ignore */ }
  return handle;
}

export function sanitizeLiveText(value, max = LIVE_MAX_MESSAGE_CHARS) {
  if (value === null || value === undefined) return null;
  let text = String(value);
  if (ENV_DUMP_RE.test(text) || COT_RE.test(text)) return "[redacted]";
  if (/\b(authorization|bearer\s+|api[_-]?key)\b/i.test(text) && /(sk-|gh[pousr]_|Bearer\s+\S+)/i.test(text)) {
    return "[redacted]";
  }
  text = text.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]");
  text = text.replace(/(authorization|x-api-key|api-key|token|secret|password|cookie)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]");
  text = text.replace(/\b(sk-[A-Za-z0-9_-]+|gh[pousr]_[A-Za-z0-9_]+)\b/g, "[REDACTED_TOKEN]");
  text = text.replace(/[A-Za-z]:\\Users\\[^\\\s]+/g, "[user]");
  if (SECRET_RE.test(text) && /[=:]\s*\S+/.test(text)) {
    text = text.replace(/(=\s*)(\S+)/g, (_, a) => `${a}[REDACTED]`);
  }
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return null;
  if (text.length > max) text = `${text.slice(0, max - 1)}…`;
  return text;
}

export function sanitizeLivePath(value) {
  const raw = sanitizeLiveText(value, 200);
  if (!raw || raw === "[redacted]") return raw;
  const cleaned = raw.replace(/^[A-Za-z]:\\.*?\\(?=[\w.-]+[\\/])/g, "").replace(/\\/g, "/");
  if (cleaned.includes("..")) return basename(cleaned);
  return cleaned.slice(0, 160);
}

export function sanitizeCommandCategory(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (SECRET_RE.test(raw) || ENV_DUMP_RE.test(raw)) return "[redacted]";
  const lower = raw.toLowerCase();
  if (/\bpytest\b|\bpython\b.*test|\.venv\\scripts\\python/.test(lower)) return "test:python";
  if (/\bgit\b/.test(lower) && /diff\s+--check/.test(lower)) return "git:diff-check";
  if (/\bgit\b/.test(lower) && /\bcommit\b/.test(lower)) return "git:commit";
  if (/\bgit\b/.test(lower) && /\bpush\b/.test(lower)) return "git:push";
  if (/\bgit\b/.test(lower) && /\bstatus\b/.test(lower)) return "git:status";
  if (/\bgit\b/.test(lower)) return "git:other";
  if (/\bpowershell\b|\.ps1\b/.test(lower)) return "shell:powershell";
  if (/\bnode\b/.test(lower)) return "shell:node";
  return "shell:bounded";
}

export function sanitizeLiveEvent(raw = {}) {
  if (!raw || typeof raw !== "object") return null;
  const event_type = String(raw.event_type || "").trim();
  if (!EVENT_TYPES.has(event_type)) return null;
  const recorded_at = typeof raw.recorded_at === "string" && raw.recorded_at.trim()
    ? raw.recorded_at.trim().slice(0, 40)
    : new Date().toISOString();
  const out = {
    schema_version: LIVE_ACTIVITY_SCHEMA,
    recorded_at,
    event_type,
    source: sanitizeLiveText(raw.source || "executor", 40) || "executor",
  };
  if (typeof raw.task_ref === "string" && raw.task_ref.trim()) out.task_ref = raw.task_ref.trim().slice(0, 200);
  if (typeof raw.phase === "string" && raw.phase.trim()) out.phase = raw.phase.trim().slice(0, 80);
  if (typeof raw.operation === "string" && raw.operation.trim()) {
    out.operation = sanitizeLiveText(raw.operation, 80);
  }
  if (raw.path !== undefined && raw.path !== null) {
    const p = sanitizeLivePath(raw.path);
    if (p) out.path = p;
  }
  if (typeof raw.status === "string" && raw.status.trim()) out.status = sanitizeLiveText(raw.status, 40);
  if (raw.message !== undefined && raw.message !== null) {
    const m = sanitizeLiveText(raw.message, LIVE_MAX_MESSAGE_CHARS);
    if (m) out.message = m;
  }
  return out;
}

export function parseOpenCodeActivityLine(line, ctx = {}) {
  const text = String(line || "").trim();
  if (!text) return [];
  if (COT_RE.test(text)) return [];
  const base = {
    recorded_at: ctx.nowIso || new Date().toISOString(),
    task_ref: ctx.task_ref || null,
    phase: ctx.phase || "OPENCODE",
    source: "opencode",
  };
  if (text.startsWith("{") && text.endsWith("}")) {
    try {
      const obj = JSON.parse(text);
      const type = String(obj.type || obj.event || obj.kind || "").toLowerCase();
      const tool = String(obj.tool || obj.name || obj.tool_name || "").toLowerCase();
      const path = obj.path || obj.file || obj.filename || obj.args?.path || obj.input?.path || obj.properties?.filePath;
      if (/read|view|cat/.test(tool) || type.includes("read")) {
        return [sanitizeLiveEvent({ ...base, event_type: "FILE_READ", operation: "READ", path, message: tool || "read" })].filter(Boolean);
      }
      if (/edit|write|patch|apply|create/.test(tool) || type.includes("edit") || type.includes("write")) {
        return [sanitizeLiveEvent({ ...base, event_type: "FILE_EDIT", operation: "EDIT", path, message: tool || "edit" })].filter(Boolean);
      }
      if (/bash|shell|exec|command|run/.test(tool) || type.includes("command")) {
        const cmd = obj.command || obj.args?.command || obj.input?.command || tool;
        return [sanitizeLiveEvent({
          ...base,
          event_type: "COMMAND",
          operation: sanitizeCommandCategory(cmd) || "shell:bounded",
          message: sanitizeLiveText(String(cmd || "").split(/\s+/)[0] || "command", 40),
        })].filter(Boolean);
      }
      if (/test/.test(tool) || type.includes("test")) {
        return [sanitizeLiveEvent({ ...base, event_type: "TEST", operation: "TEST", status: obj.status || null, message: tool || "test" })].filter(Boolean);
      }
      if (type.includes("step") || type.includes("phase") || type.includes("assistant") || type.includes("tool")) {
        return [sanitizeLiveEvent({
          ...base,
          event_type: "TASK_ACTIVITY",
          operation: sanitizeLiveText(type || tool || "activity", 40),
          message: sanitizeLiveText(obj.message || obj.text || obj.content || type, LIVE_MAX_MESSAGE_CHARS),
        })].filter(Boolean);
      }
    } catch { /* fall through */ }
  }
  const readM = text.match(/\b(?:Reading|Read|Opened|Loading)\b[:\s]+([^\s|"']+\.[A-Za-z0-9]+)/i)
    || text.match(/\b(?:read_file|Read)\b[^\n]*?([A-Za-z0-9_./\\-]+\.[A-Za-z0-9]+)/i);
  if (readM) {
    return [sanitizeLiveEvent({ ...base, event_type: "FILE_READ", operation: "READ", path: readM[1] })].filter(Boolean);
  }
  const editM = text.match(/\b(?:Writing|Wrote|Edited|Updated|Modified|Created)\b[:\s]+([^\s|"']+\.[A-Za-z0-9]+)/i)
    || text.match(/\b(?:edit_file|Write|ApplyPatch)\b[^\n]*?([A-Za-z0-9_./\\-]+\.[A-Za-z0-9]+)/i);
  if (editM) {
    return [sanitizeLiveEvent({ ...base, event_type: "FILE_EDIT", operation: "EDIT", path: editM[1] })].filter(Boolean);
  }
  if (/\bgit\s+diff\s+--check\b/i.test(text)) {
    return [sanitizeLiveEvent({ ...base, event_type: "GIT", operation: "git:diff-check", message: "diff --check" })].filter(Boolean);
  }
  if (/\b(pytest|unittest|node .*test|Tests?:)\b/i.test(text)) {
    const status = /\bPASS\b/i.test(text) ? "PASS" : (/\bFAIL\b/i.test(text) ? "FAIL" : null);
    return [sanitizeLiveEvent({ ...base, event_type: "TEST", operation: "TEST", status, message: sanitizeLiveText(text, 80) })].filter(Boolean);
  }
  const msg = sanitizeLiveText(text, LIVE_MAX_MESSAGE_CHARS);
  if (!msg || msg === "[redacted]") return [];
  return [sanitizeLiveEvent({ ...base, event_type: "OUTPUT", operation: "OUTPUT", message: msg })].filter(Boolean);
}

function emptyState(taskRef = null) {
  return {
    schema_version: LIVE_ACTIVITY_SCHEMA,
    updated_at: null,
    task_ref: taskRef,
    active: false,
    last_activity_at: null,
    events: [],
    public_rationale: null,
    meta: { flush_count: 0, dropped: 0 },
  };
}

function trimEvents(events) {
  const list = Array.isArray(events) ? events.slice(-LIVE_BUFFER_MAX_EVENTS) : [];
  let payload = JSON.stringify(list);
  while (list.length > 1 && payload.length > LIVE_MAX_PAYLOAD_BYTES) {
    list.shift();
    payload = JSON.stringify(list);
  }
  return list;
}

export function buildPublicRationale({ envelope = {}, phase = null, lastEvent = null } = {}) {
  const objective = typeof envelope.task_delta === "string"
    ? envelope.task_delta.split(/\n/).find((l) => /^Objective:/i.test(l))?.replace(/^Objective:\s*/i, "")
      || envelope.task_delta.slice(0, 220)
    : (typeof envelope.objective === "string" ? envelope.objective.slice(0, 220) : null);
  let acceptanceHint = Array.isArray(envelope.acceptance)
    ? envelope.acceptance.find((a) => typeof a === "string")
    : null;
  if (!acceptanceHint && typeof envelope.task_delta === "string") {
    const m = envelope.task_delta.match(/Acceptance criteria:\n((?:\d+\..+\n?)+)/i);
    if (m) {
      const first = m[1].split(/\n/).map((l) => l.replace(/^\d+\.\s*/, "").trim()).find(Boolean);
      acceptanceHint = first || null;
    }
  }
  const phaseLabel = phase || lastEvent?.phase || "OPENCODE";
  const op = lastEvent?.event_type || "TASK_ACTIVITY";
  let why = "Sta avanzando il task osservabile nella fase corrente.";
  if (op === "FILE_READ") why = "Sta leggendo un file del perimetro per capire lo stato attuale prima di modificare.";
  else if (op === "FILE_EDIT") why = "Sta applicando una modifica in un path consentito dal task.";
  else if (op === "TEST") why = acceptanceHint
    ? `Sta eseguendo i test perché l'acceptance richiede: ${sanitizeLiveText(acceptanceHint, 120)}.`
    : "Sta verificando i test focalizzati richiesti dal task.";
  else if (op === "GIT") why = "Sta controllando la hygiene git (diff --check / stato) prima della persistenza.";
  else if (op === "PERSISTENCE") why = "Sta persistendo il risultato con commit/push ordinari.";
  else if (op === "COMMAND") why = "Sta eseguendo un comando di supporto bounded necessario al task.";
  else if (op === "PHASE") why = `È entrato nella fase ${sanitizeLiveText(phaseLabel, 40)}.`;
  return {
    objective: sanitizeLiveText(objective, 220),
    acceptance: sanitizeLiveText(acceptanceHint, 160),
    phase: sanitizeLiveText(phaseLabel, 40),
    why: sanitizeLiveText(why, 220),
    notice: "Nessuna chain-of-thought privata esposta",
  };
}

export function createLiveActivitySink(options = {}) {
  const storagePath = options.storagePath || liveActivityStoragePath(options.env);
  const nowIso = options.nowIso || (() => new Date().toISOString());
  let state = emptyState(options.task_ref || null);
  let lineBuf = "";
  let flushTimer = null;
  let dirty = false;
  let closed = false;
  const syncHeavy = { disk_writes: 0, parse_calls: 0, model_calls: 0 };

  function scheduleFlush() {
    if (options.disableDisk) return;
    if (flushTimer) return;
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, options.debounceMs ?? LIVE_FLUSH_DEBOUNCE_MS);
    if (typeof flushTimer.unref === "function") flushTimer.unref();
  }

  function flush() {
    if (options.disableDisk || !dirty || closed) return true;
    try {
      const dir = dirname(storagePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const tmp = `${storagePath}.tmp`;
      const payload = {
        ...state,
        events: trimEvents(state.events),
        updated_at: nowIso(),
        meta: { ...state.meta, flush_count: (state.meta?.flush_count || 0) + 1 },
      };
      let text = JSON.stringify(payload);
      while (payload.events.length > 1 && text.length > LIVE_MAX_PAYLOAD_BYTES) {
        payload.events.shift();
        payload.meta.dropped = (payload.meta.dropped || 0) + 1;
        text = JSON.stringify(payload);
      }
      writeFileSync(tmp, text, "utf8");
      try { renameSync(tmp, storagePath); } catch {
        writeFileSync(storagePath, text, "utf8");
      }
      state = payload;
      dirty = false;
      syncHeavy.disk_writes += 1;
      return true;
    } catch {
      return false;
    }
  }

  function pushEvent(raw) {
    try {
      const ev = sanitizeLiveEvent({ ...raw, recorded_at: raw.recorded_at || nowIso() });
      if (!ev) return false;
      if (state.task_ref && ev.task_ref && state.task_ref !== ev.task_ref) {
        state = emptyState(ev.task_ref);
      }
      if (!state.task_ref && ev.task_ref) state.task_ref = ev.task_ref;
      state.active = true;
      state.last_activity_at = ev.recorded_at;
      state.events = trimEvents([...state.events, ev]);
      if (options.envelope) {
        state.public_rationale = buildPublicRationale({
          envelope: options.envelope,
          phase: ev.phase || options.phase,
          lastEvent: ev,
        });
      }
      dirty = true;
      scheduleFlush();
      return true;
    } catch {
      return false;
    }
  }

  function ingestChunk(chunk, stream = "stdout") {
    try {
      syncHeavy.parse_calls += 1;
      lineBuf += String(chunk || "");
      if (lineBuf.length > 32_000) lineBuf = lineBuf.slice(-16_000);
      const parts = lineBuf.split(/\r?\n/);
      lineBuf = parts.pop() || "";
      for (const line of parts) {
        const events = parseOpenCodeActivityLine(line, {
          task_ref: state.task_ref || options.task_ref,
          phase: options.phase || "OPENCODE",
          nowIso: nowIso(),
          stream,
        });
        for (const ev of events) pushEvent(ev);
      }
      return true;
    } catch {
      return false;
    }
  }

  function setPhase(phase) {
    options.phase = phase;
    return pushEvent({
      event_type: "PHASE",
      operation: phase,
      phase,
      task_ref: state.task_ref || options.task_ref,
      source: "executor",
      message: `phase:${phase}`,
    });
  }

  function end(status = "DONE") {
    try {
      if (lineBuf.trim()) ingestChunk("\n", "stdout");
      pushEvent({
        event_type: "TASK_ACTIVITY",
        operation: status,
        phase: options.phase || "TERMINAL",
        task_ref: state.task_ref || options.task_ref,
        source: "executor",
        status,
        message: `execution:${status}`,
      });
      state.active = false;
      if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
      dirty = true;
      flush();
      closed = true;
    } catch { /* ignore */ }
  }

  return {
    pushEvent,
    ingestChunk,
    setPhase,
    flush,
    end,
    getState: () => ({ ...state, events: [...state.events] }),
    getMetrics: () => ({ ...syncHeavy, EXTRA_MODEL_CALLS: syncHeavy.model_calls }),
    storagePath,
  };
}

export function readLiveActivityProjection(options = {}) {
  const storagePath = options.storagePath || liveActivityStoragePath(options.env);
  const status = options.status || null;
  const activeTaskRef = status?.active === true && typeof status.task_ref === "string" ? status.task_ref : null;
  let fileState = null;
  let stale = false;
  try {
    if (existsSync(storagePath)) {
      fileState = JSON.parse(readFileSync(storagePath, "utf8"));
    }
  } catch {
    fileState = null;
  }
  if (!fileState || fileState.schema_version !== LIVE_ACTIVITY_SCHEMA) {
    return {
      schema_version: LIVE_ACTIVITY_SCHEMA,
      read_only: true,
      active: false,
      task_ref: activeTaskRef,
      last_activity_at: null,
      events: [],
      public_rationale: null,
      freshness: "EMPTY",
      note: "Nessuna attività live disponibile",
    };
  }
  if (activeTaskRef && fileState.task_ref && fileState.task_ref !== activeTaskRef) {
    return {
      schema_version: LIVE_ACTIVITY_SCHEMA,
      read_only: true,
      active: true,
      task_ref: activeTaskRef,
      last_activity_at: null,
      events: [],
      public_rationale: null,
      freshness: "EMPTY",
      note: "Attività live non ancora osservata per il task corrente",
    };
  }
  // Idle projection: never present prior-task events as current work.
  if (!activeTaskRef) {
    return {
      schema_version: LIVE_ACTIVITY_SCHEMA,
      read_only: true,
      active: false,
      task_ref: null,
      last_activity_at: fileState.last_activity_at || null,
      events: [],
      public_rationale: null,
      freshness: "EMPTY",
      note: "Nessuna attività live disponibile",
    };
  }
  if (activeTaskRef && fileState.active !== true) stale = true;
  const events = trimEvents(Array.isArray(fileState.events) ? fileState.events : [])
    .filter((e) => !activeTaskRef || !e.task_ref || e.task_ref === activeTaskRef);
  return {
    schema_version: LIVE_ACTIVITY_SCHEMA,
    read_only: true,
    active: Boolean(activeTaskRef),
    task_ref: activeTaskRef || fileState.task_ref || null,
    last_activity_at: fileState.last_activity_at || null,
    events,
    public_rationale: fileState.public_rationale || null,
    freshness: stale ? "STALE" : (events.length ? "FRESH" : "EMPTY"),
    note: stale
      ? "Ultima attività disponibile (STALE) — non corrente"
      : (events.length ? null : "Nessuna attività live disponibile"),
  };
}

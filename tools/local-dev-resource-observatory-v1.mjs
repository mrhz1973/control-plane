#!/usr/bin/env node
/**
 * local-dev-resource-observatory-v1 — READ-ONLY resource + quota observatory
 * for the LOCAL_DEV dispatcher dashboard (GET /v1/resources).
 *
 * Never mutates queue/receipts, never loads Qwen, never claims, never invokes
 * models, never mutates VPS. Reuses existing quota/Qwen authorities.
 */
import { execFile } from "node:child_process";
import { cpus, freemem, hostname, loadavg, totalmem, uptime } from "node:os";
import { existsSync, readFileSync, statfsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { composeCanonicalQuotaState, collectIngestContributions } from "./rt25-canonical-quota-state-v1.mjs";
import { getOpenClawQuotaObservation } from "./collect-openclaw-quota-v1.mjs";
import {
  normalizeCodexAppServerQuota,
  reconcileCodexQuotaObservations,
} from "./collect-codex-appserver-quota-v1.mjs";

const execFileAsync = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const RESOURCES_SCHEMA = "local-dev-resource-observatory-v1";
export const RESOURCES_PATH = "/v1/resources";
export const QWEN_OBSERVE_BASE_URL = "http://127.0.0.1:8080";
export const QWEN_OBSERVATION_TIMEOUT_MS = 4_000;
export const VPS_CACHE_TTL_MS = 30_000;
export const WORKSTATION_FRESH_MS = 15_000;
export const QUOTA_DISPLAY_FRESH_MS = 300_000;
export const VPS_SSH_ALIAS = "ionos-n8n-new";
export const OBSERVABILITY_CONTRACT = "health-separated-from-observation-v1";
export const HERMES_NOVNC_PRIVATE_URL = "http://127.0.0.1:16080/vnc.html";
export const HERMES_NOVNC_VPS_BIND = "127.0.0.1:6080";
export const HERMES_NOVNC_TUNNEL_TIMEOUT_MS = 2_500;

/** Observation-only remote command allowlist (no mutation verbs). */
export const VPS_SAFE_REMOTE_COMMANDS = Object.freeze([
  "uname -a",
  "uptime",
  "cat /proc/uptime",
  "cat /proc/loadavg",
  "free -b",
  "df -B1 /",
  "nproc",
  "hostname",
  "cat /etc/os-release",
  "hostname -I",
  "docker info --format '{{.ServerVersion}}'",
  "docker ps --format '{{.Names}} {{.Status}}'",
  "systemctl is-active n8n || true",
  "systemctl is-active docker || true",
  "systemctl is-active postgresql || systemctl is-active postgresql@* || true",
  "systemctl is-active hermes-xvfb || true",
  "systemctl is-active hermes-chromium || true",
  "systemctl is-active hermes-x11vnc || true",
  "systemctl is-active hermes-novnc || true",
  "curl --silent --show-error --max-time 2 --output /dev/null --write-out '%{http_code}' http://127.0.0.1:6080/vnc.html",
  "ss -ltnH",
]);

const MUTATION_RE = /\b(rm|mv|chmod|chown|tee|dd|kill|reboot|shutdown|apt|yum|dnf|systemctl\s+(start|stop|restart|enable|disable|reload)|docker\s+(run|rm|start|stop|restart|compose|exec)|curl\s+-X\s*(POST|PUT|PATCH|DELETE)|write(?!-out)|truncate)\b/i;

let vpsCache = null;

function boundStr(value, max = 120) {
  if (value === null || value === undefined) return null;
  const s = String(value);
  if (!s) return null;
  return s.length <= max ? s : s.slice(0, max);
}

function boundNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function boundedPercent(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100
    ? Math.round(value * 10) / 10
    : null;
}

function validDateOnly(value) {
  const raw = boundStr(value, 10);
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [year, month, day] = raw.split("-").map(Number);
  const ms = Date.UTC(year, month - 1, day);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === raw ? raw : null;
}

function validTimestampString(value) {
  const raw = boundStr(value, 40);
  return raw && Number.isFinite(Date.parse(raw)) ? raw : null;
}

function remainingFromUsed(value) {
  const used = boundedPercent(value);
  return used === null ? null : Math.round((100 - used) * 10) / 10;
}

/** Normalize explicit manual Cursor evidence without inventing timestamps. */
export function normalizeCursorManualObservation(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const labels = raw.labels && typeof raw.labels === "object" && !Array.isArray(raw.labels) ? raw.labels : {};
  const sourceUsage = raw.source_usage && typeof raw.source_usage === "object" && !Array.isArray(raw.source_usage)
    ? raw.source_usage
    : {};
  const cursorUsed = boundedPercent(sourceUsage.cursor_models_used_percent);
  const otherUsed = boundedPercent(sourceUsage.other_models_used_percent);
  const cursorLabel = boundedPercent(labels.cursor_models);
  const otherLabel = boundedPercent(labels.other_models);
  const planResetAt = validTimestampString(raw.plan_reset_at);
  const planResetDate = validDateOnly(raw.plan_reset_date);
  return {
    source: boundStr(raw.source, 80) || "operator_manual_observation",
    state: boundStr(raw.state, 40) || "UNKNOWN",
    observed_at: boundStr(raw.observed_at, 40),
    plan: boundStr(raw.plan, 40),
    plan_reset_at: planResetAt,
    plan_reset_date: planResetDate,
    plan_reset_precision: planResetDate ? "date" : planResetAt ? "timestamp" : null,
    usage_semantics: "labels_are_remaining_percent",
    labels: {
      cursor_models: cursorLabel ?? remainingFromUsed(cursorUsed),
      other_models: otherLabel ?? remainingFromUsed(otherUsed),
    },
    source_usage: {
      cursor_models_used_percent: cursorUsed,
      other_models_used_percent: otherUsed,
    },
    on_demand_spending: boundStr(raw.on_demand_spending, 20),
    monthly_limit: boundStr(raw.monthly_limit, 20),
  };
}

function freshnessFromAge(observedAt, nowMs, maxAgeMs) {
  const t = Date.parse(observedAt);
  if (!Number.isFinite(t) || t > nowMs) return "stale";
  return nowMs - t <= maxAgeMs ? "fresh" : "stale";
}

function collectorMeta(id, label, detail = null) {
  return {
    collector_id: id,
    collector_label: label,
    collector_detail: detail,
  };
}

function healthMeta(healthState, observationState, reasonCode = null) {
  return {
    health_state: healthState,
    observation_state: observationState,
    ...(reasonCode ? { reason_code: reasonCode } : {}),
  };
}

function percent(used, total) {
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((used / total) * 1000) / 10));
}

export async function collectWorkstationMetrics(options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  const observed_at = new Date(nowMs).toISOString();
  const total = totalmem();
  const free = freemem();
  const used = total - free;
  const cpuCount = cpus()?.length || null;
  let system_disk_total_bytes = null;
  let system_disk_free_bytes = null;
  try {
    if (typeof statfsSync === "function") {
      const root = process.platform === "win32" ? `${process.env.SystemDrive || "C:"}\\` : "/";
      const st = statfsSync(root);
      const bsize = boundNum(st.bsize) || boundNum(st.frsize) || 0;
      system_disk_total_bytes = bsize * (boundNum(st.blocks) || 0);
      system_disk_free_bytes = bsize * (boundNum(st.bavail ?? st.bfree) || 0);
    }
  } catch {
    /* disk optional */
  }
  const disk_used = system_disk_total_bytes != null && system_disk_free_bytes != null
    ? system_disk_total_bytes - system_disk_free_bytes
    : null;

  let cpu_percent = null;
  try {
    const sample = cpus() || [];
    if (sample.length) {
      let idle = 0;
      let totalTick = 0;
      for (const c of sample) {
        const t = Object.values(c.times || {}).reduce((a, b) => a + b, 0);
        idle += c.times?.idle || 0;
        totalTick += t;
      }
      cpu_percent = totalTick > 0 ? Math.round((1 - idle / totalTick) * 1000) / 10 : null;
    }
  } catch {
    cpu_percent = null;
  }

  const gpu = await collectGpuMetrics(options);
  return {
    reachable: true,
    state: "AVAILABLE",
    ...healthMeta("AVAILABLE", "OBSERVED"),
    observed_at,
    freshness: freshnessFromAge(observed_at, nowMs, WORKSTATION_FRESH_MS),
    hostname: boundStr(hostname(), 120),
    uptime_seconds: Math.floor(uptime()),
    cpu_percent,
    logical_cpu_count: cpuCount,
    loadavg: process.platform === "win32" ? null : loadavg().map((n) => Math.round(n * 100) / 100),
    ram_total_bytes: total,
    ram_used_bytes: used,
    ram_free_bytes: free,
    ram_percent: percent(used, total),
    system_disk_total_bytes,
    system_disk_free_bytes,
    system_disk_percent: percent(disk_used, system_disk_total_bytes),
    gpu,
    ...collectorMeta("workstation_os", "Node.js dispatcher / Windows OS", "os + optional nvidia-smi"),
  };
}

export async function collectGpuMetrics(options = {}) {
  const execFn = options.execFile || execFileAsync;
  const nvidia = options.nvidiaSmiPath || "nvidia-smi";
  try {
    const { stdout } = await execFn(
      nvidia,
      [
        "--query-gpu=name,utilization.gpu,temperature.gpu,memory.total,memory.used,memory.free",
        "--format=csv,noheader,nounits",
      ],
      { timeout: options.timeoutMs ?? 2500, windowsHide: true },
    );
    const line = String(stdout || "").trim().split(/\r?\n/)[0];
    if (!line) {
      return { state: "UNKNOWN", reason_code: "GPU_EMPTY_OUTPUT", ...collectorMeta("nvidia_smi", "nvidia-smi") };
    }
    const parts = line.split(",").map((p) => p.trim());
    return {
      state: "AVAILABLE",
      ...healthMeta("AVAILABLE", "OBSERVED"),
      gpu_name: boundStr(parts[0], 120),
      gpu_util_percent: boundNum(parts[1]),
      temperature_c: boundNum(parts[2]),
      vram_total_mb: boundNum(parts[3]),
      vram_used_mb: boundNum(parts[4]),
      vram_free_mb: boundNum(parts[5]),
      ...collectorMeta("nvidia_smi", "nvidia-smi"),
    };
  } catch (err) {
    return {
      state: err?.code === "ENOENT" ? "UNAVAILABLE" : "UNKNOWN",
      ...healthMeta("NOT_OBSERVED", "NOT_OBSERVED", err?.code === "ENOENT" ? "GPU_COLLECTOR_NOT_AVAILABLE" : "GPU_OBSERVATION_FAILED"),
      reason_code: err?.code === "ENOENT" ? "NVIDIA_SMI_NOT_FOUND" : "NVIDIA_SMI_FAILED",
      error: boundStr(err?.code || err?.message, 80),
      ...collectorMeta("nvidia_smi", "nvidia-smi"),
    };
  }
}

export async function collectQwenResources(options = {}) {
  const probe = options.probeQwen || defaultQwenCatalogProbe;
  const observed_at = new Date(options.nowMs ?? Date.now()).toISOString();
  let observation;
  try {
    observation = await probe({
      baseUrl: options.baseUrl || QWEN_OBSERVE_BASE_URL,
      wanted_profile: options.wanted_profile || null,
      timeoutMs: options.timeoutMs ?? QWEN_OBSERVATION_TIMEOUT_MS,
      fetchFn: options.fetchFn,
    });
  } catch (err) {
    observation = { reachable: false, error: boundStr(err?.message, 80), models: [], profile_status: "unreachable" };
  }
  const models = Array.isArray(observation?.models) ? observation.models.slice(0, 24) : [];
  const loaded = models.filter((m) => String(m?.status || "").toLowerCase() === "loaded");
  let occupancy = "UNKNOWN";
  if (observation?.reachable === false) occupancy = "UNKNOWN";
  else if (loaded.length) occupancy = "LOADED";
  else if (observation?.reachable === true) occupancy = "IDLE";

  return {
    reachable: observation?.reachable === true,
    state: observation?.reachable === true ? "AVAILABLE" : "UNAVAILABLE",
    ...healthMeta(
      observation?.reachable === true ? "AVAILABLE" : (observation?.probe_status === "HTTP_FAILURE" ? "REAL_FAILURE" : "NOT_OBSERVED"),
      observation?.reachable === true ? "OBSERVED" : (observation?.probe_status === "HTTP_FAILURE" ? "OBSERVED" : "NOT_OBSERVED"),
      observation?.reachable === true ? null : (observation?.probe_status === "HTTP_FAILURE" ? "QWEN_ENDPOINT_UNHEALTHY" : "QWEN_ENDPOINT_NOT_OBSERVED"),
    ),
    failure_verified: observation?.probe_status === "HTTP_FAILURE",
    observed_at,
    freshness: observation?.reachable === true ? "fresh" : "stale",
    commercial_quota: "N/A",
    capacity_label: "Capacità locale — nessuna quota commerciale",
    endpoint: options.baseUrl || QWEN_OBSERVE_BASE_URL,
    profile_status: boundStr(observation?.profile_status, 40),
    health_summary: boundStr(observation?.health_summary, 80),
    occupancy,
    models_visible: models.length,
    loaded_models: loaded.map((m) => ({
      id: boundStr(m.id, 120),
      status: boundStr(m.status, 40),
      context_tokens: boundNum(m.context_tokens),
      pid: boundNum(m.pid),
      port: boundNum(m.port),
    })),
    models,
    error: boundStr(observation?.error, 80),
    ...collectorMeta("qwen_probe", "dispatcher read-only Qwen probe :8080", "GET /v1/models only"),
  };
}

/** Local GET-only catalog probe (no launch/load). Prefer injected probe in production wiring. */
async function defaultQwenCatalogProbe(options = {}) {
  const baseUrl = String(options.baseUrl || QWEN_OBSERVE_BASE_URL).replace(/\/$/, "");
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(200, options.timeoutMs) : QWEN_OBSERVATION_TIMEOUT_MS;
  const fetchFn = options.fetchFn || globalThis.fetch;
  try {
    const r = await fetchFn(`${baseUrl}/v1/models`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!r || !r.ok) {
      return { reachable: false, probe_status: "HTTP_FAILURE", health_summary: `HTTP_${r?.status || "ERR"}`, profile_status: "unreachable", models: [], error: `HTTP_${r?.status || "ERR"}` };
    }
    const body = await r.json();
    const raw = Array.isArray(body?.data) ? body.data : (Array.isArray(body?.models) ? body.models : []);
    const models = raw.slice(0, 24).map((m) => ({
      id: boundStr(m?.id || m?.model || m?.name, 120),
      status: boundStr(
        typeof m?.status === "string" ? m.status : (m?.status?.value || m?.state || null),
        40,
      ),
      context_tokens: boundNum(m?.context_tokens ?? m?.meta?.n_ctx),
      pid: boundNum(m?.status?.pid || m?.pid),
      port: boundNum(m?.status?.port || m?.port),
    })).filter((m) => m.id);
    let profile_status = models.length ? "listed" : "unknown";
    if (options.wanted_profile) {
      const hit = models.find((m) => m.id === options.wanted_profile);
      profile_status = hit ? String(hit.status || "listed").toLowerCase() : "unloaded";
    }
    return {
      reachable: true,
      health_summary: models.length ? `${models.length}_models` : "empty_catalog",
      profile_status,
      models,
      error: null,
    };
  } catch (err) {
    return {
      reachable: false,
      probe_status: "TRANSPORT_FAILURE",
      health_summary: "unreachable",
      profile_status: "unreachable",
      models: [],
      error: boundStr(err?.code || err?.message || "probe_failed", 80),
    };
  }
}

export function assertVpsCommandSafe(command) {
  const cmd = String(command || "").trim();
  if (!cmd) return { ok: false, reason_code: "VPS_COMMAND_EMPTY" };
  if (MUTATION_RE.test(cmd)) return { ok: false, reason_code: "VPS_COMMAND_MUTATION_FORBIDDEN" };
  if (!VPS_SAFE_REMOTE_COMMANDS.includes(cmd)) {
    return { ok: false, reason_code: "VPS_COMMAND_NOT_ALLOWLISTED" };
  }
  return { ok: true, command: cmd };
}

function parseFirstNumber(text) {
  const match = String(text || "").match(/[-+]?\d+(?:\.\d+)?/);
  return match ? boundNum(match[0]) : null;
}

function parseVpsObservation(results, nowMs) {
  const output = (command) => results.get(command)?.stdout || "";
  const failedCore = ["uname -a", "cat /proc/uptime", "cat /proc/loadavg", "free -b", "df -B1 /"]
    .find((command) => results.get(command)?.ok !== true);
  if (failedCore) {
    const failure = results.get(failedCore);
    return {
      reachable: false,
      reason_code: "VPS_OBSERVATION_CORE_COMMAND_FAILED",
      error: boundStr(failure?.error || failedCore, 80),
      observed_at: new Date(nowMs).toISOString(),
    };
  }

  const uptimeSeconds = parseFirstNumber(output("cat /proc/uptime"));
  const uname = output("uname -a").trim();
  const unameParts = uname.split(/\s+/);
  const architecture = unameParts.length >= 2 ? unameParts[unameParts.length - 2] : null;
  const osRelease = output("cat /etc/os-release").match(/^PRETTY_NAME=(.*)$/mi);
  const osName = osRelease ? osRelease[1].trim().replace(/^['"]|['"]$/g, "") : null;
  const loadParts = output("cat /proc/loadavg").trim().split(/\s+/).slice(0, 3).map(boundNum);
  const mem = output("free -b").match(/Mem:\s+(\d+)\s+(\d+)\s+(\d+)/i);
  const swap = output("free -b").match(/Swap:\s+(\d+)\s+(\d+)\s+(\d+)/i);
  const diskLine = output("df -B1 /").trim().split(/\r?\n/).find((line) => /^\S+\s+\d+\s+\d+\s+\d+\s+\d+%\s+\/$/.test(line.trim()));
  const disk = diskLine ? diskLine.trim().split(/\s+/) : [];
  const docker = output("docker info --format '{{.ServerVersion}}'").trim();
  const service = (command) => {
    const value = output(command).trim();
    return value || (results.get(command)?.ok === true ? "unknown" : "unobserved");
  };
  const total = mem ? boundNum(mem[1]) : null;
  const used = mem ? boundNum(mem[2]) : null;
  const free = mem ? boundNum(mem[3]) : null;
  const diskTotal = disk.length ? boundNum(disk[1]) : null;
  const diskUsed = disk.length ? boundNum(disk[2]) : null;
  const diskFree = disk.length ? boundNum(disk[3]) : null;
  const swapTotal = swap ? boundNum(swap[1]) : null;
  const swapUsed = swap ? boundNum(swap[2]) : null;
  const swapFree = swap ? boundNum(swap[3]) : null;
  const tailnetIp = output("hostname -I").trim().split(/\s+/).find((address) => /^100\.(?:6[4-9]|[78]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(address)) || null;
  const serviceStates = {
    n8n: serviceOutput(results, "systemctl is-active n8n || true"),
    docker: serviceOutput(results, "systemctl is-active docker || true"),
    postgresql: serviceOutput(results, "systemctl is-active postgresql || systemctl is-active postgresql@* || true"),
  };
  const hermesServiceStates = {
    xvfb: serviceOutput(results, "systemctl is-active hermes-xvfb || true"),
    chromium: serviceOutput(results, "systemctl is-active hermes-chromium || true"),
    x11vnc: serviceOutput(results, "systemctl is-active hermes-x11vnc || true"),
    novnc: serviceOutput(results, "systemctl is-active hermes-novnc || true"),
  };
  const hermesNovnc = buildHermesNovncVpsObservation({
    hermes_service_states: hermesServiceStates,
    http_status: serviceOutput(results, "curl --silent --show-error --max-time 2 --output /dev/null --write-out '%{http_code}' http://127.0.0.1:6080/vnc.html"),
    listener_bindings: parsePrivatePortBindings(serviceOutput(results, "ss -ltnH")),
  });
  return {
    reachable: true,
    observed_at: new Date(nowMs).toISOString(),
    hostname: boundStr(output("hostname").trim(), 120),
    os: boundStr(osName, 120),
    kernel: boundStr(unameParts[2], 120),
    architecture: boundStr(architecture, 40),
    vcpu_count: parseFirstNumber(output("nproc")),
    uptime_seconds: uptimeSeconds,
    load_average: loadParts.every((value) => value !== null) ? loadParts : null,
    load: loadParts.every((value) => value !== null) ? loadParts : null,
    ram_total_bytes: total,
    ram_used_bytes: used,
    ram_free_bytes: free,
    ram_percent: total && used !== null ? percent(used, total) : null,
    swap_total_bytes: swapTotal,
    swap_used_bytes: swapUsed,
    swap_free_bytes: swapFree,
    swap_percent: swapTotal && swapUsed !== null ? percent(swapUsed, swapTotal) : null,
    root_disk_total_bytes: diskTotal,
    root_disk_used_bytes: diskUsed,
    root_disk_free_bytes: diskFree,
    root_disk_percent: diskTotal && diskFree !== null ? percent(diskTotal - diskFree, diskTotal) : null,
    tailscale_ip: tailnetIp,
    service_states: serviceStates,
    hermes_novnc: hermesNovnc,
    docker: docker || service("systemctl is-active docker || true"),
    n8n: serviceStates.n8n,
    postgresql: serviceStates.postgresql,
    litellm: "unobserved",
  };
}

function serviceOutput(results, command) {
  const value = results.get(command)?.stdout?.trim();
  return value || null;
}

function normalizedServiceState(value) {
  const state = boundStr(value, 40)?.toLowerCase();
  return state || "not_observed";
}

function stateFromService(value) {
  const state = normalizedServiceState(value);
  if (state === "active") return "AVAILABLE";
  if (["inactive", "failed", "deactivating"].includes(state)) return "UNAVAILABLE";
  return "NOT_OBSERVED";
}

function parseHttpStatus(value) {
  const raw = boundStr(value, 8);
  return raw && /^\d{3}$/.test(raw) ? Number(raw) : null;
}

function parsePrivatePortBindings(value) {
  const bindings = { "9222": [], "5900": [], "6080": [] };
  for (const line of String(value || "").split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/);
    if (fields[0] !== "LISTEN" || !fields[3]) continue;
    const match = fields[3].match(/^(.*):(9222|5900|6080)$/);
    if (!match) continue;
    const host = match[1].replace(/^\[|\]$/g, "");
    const loopback = host === "127.0.0.1" || host === "::1" || host === "localhost";
    bindings[match[2]].push(loopback ? "LOOPBACK" : "NON_LOOPBACK");
  }
  return bindings;
}

function publicExposureFromBindings(bindings) {
  const ports = ["9222", "5900", "6080"];
  const values = ports.map((port) => Array.isArray(bindings?.[port]) ? bindings[port] : []);
  if (values.some((entries) => entries.includes("NON_LOOPBACK"))) return "YES";
  if (values.every((entries) => entries.length > 0 && entries.every((entry) => entry === "LOOPBACK"))) return "NO";
  return "NOT_OBSERVED";
}

/** Bounded VPS-side Hermes/noVNC state; no listener addresses or response bodies escape. */
export function buildHermesNovncVpsObservation({ hermes_service_states = {}, http_status = null, listener_bindings = {} } = {}) {
  const status = parseHttpStatus(http_status);
  const publicExposure = publicExposureFromBindings(listener_bindings);
  const novncService = hermes_service_states.novnc;
  const novncState = normalizedServiceState(novncService);
  const vpsState = novncState === "active" && status === 200
    ? "AVAILABLE"
    : (novncState === "inactive" || (status !== null && status !== 200) ? "UNAVAILABLE" : "NOT_OBSERVED");
  return {
    chrome_state: stateFromService(hermes_service_states.chromium),
    novnc_vps_state: vpsState,
    xvfb_state: stateFromService(hermes_service_states.xvfb),
    x11vnc_state: stateFromService(hermes_service_states.x11vnc),
    novnc_http_status: status,
    bind: HERMES_NOVNC_VPS_BIND,
    public_exposure: publicExposure,
    auto_tunnel: "NO",
    source: "VPS_PRIVATE_READ_ONLY_OBSERVATION",
    service_states: {
      chromium: normalizedServiceState(hermes_service_states.chromium),
      novnc: novncState,
      x11vnc: normalizedServiceState(hermes_service_states.x11vnc),
      xvfb: normalizedServiceState(hermes_service_states.xvfb),
    },
  };
}

function tunnelErrorCode(error) {
  return boundStr(error?.cause?.code || error?.code, 40);
}

/** Local GET-only probe. It never starts a tunnel and never reads the response body. */
export async function collectHermesNovncTunnel(options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  const timeoutMs = Number.isFinite(options.timeoutMs)
    ? Math.max(200, Math.min(5_000, options.timeoutMs))
    : HERMES_NOVNC_TUNNEL_TIMEOUT_MS;
  const fetchFn = options.fetchFn || globalThis.fetch;
  try {
    const response = await fetchFn(HERMES_NOVNC_PRIVATE_URL, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const status = Number.isFinite(response?.status) ? response.status : null;
    try { await response?.body?.cancel?.(); } catch { /* body intentionally ignored */ }
    return {
      state: status === 200 ? "CONNECTED" : "INACTIVE",
      http_status: status,
      private_url: HERMES_NOVNC_PRIVATE_URL,
      observed_at: new Date(nowMs).toISOString(),
      read_only: true,
      auto_tunnel: "NO",
      operator_host_scope: "DASHBOARD_HOST_LOCALHOST",
      remote_browser_localhost_asserted: false,
      ...collectorMeta("hermes_novnc_local_probe", "local GET-only noVNC tunnel probe", "GET /vnc.html; response body discarded"),
    };
  } catch (error) {
    const code = tunnelErrorCode(error);
    const inactiveCodes = new Set(["ECONNREFUSED", "ECONNRESET", "EPIPE", "ENOTFOUND"]);
    return {
      state: inactiveCodes.has(code) ? "INACTIVE" : "NOT_OBSERVABLE",
      http_status: null,
      private_url: HERMES_NOVNC_PRIVATE_URL,
      observed_at: new Date(nowMs).toISOString(),
      read_only: true,
      auto_tunnel: "NO",
      operator_host_scope: "DASHBOARD_HOST_LOCALHOST",
      remote_browser_localhost_asserted: false,
      ...(code ? { error_code: code } : {}),
      ...collectorMeta("hermes_novnc_local_probe", "local GET-only noVNC tunnel probe", "GET /vnc.html; response body discarded"),
    };
  }
}

/** Canonical private SSH transport. Fixed alias, BatchMode, fixed read-only commands only. */
export function createCanonicalVpsSshRunner(options = {}) {
  const execFn = options.execFile || execFileAsync;
  return async ({ host = VPS_SSH_ALIAS, commands = VPS_SAFE_REMOTE_COMMANDS, timeoutMs = 8000, batchMode = true } = {}) => {
    if (host !== VPS_SSH_ALIAS || batchMode !== true || !Array.isArray(commands) || commands.some((command) => !assertVpsCommandSafe(command).ok)) {
      return { reachable: false, reason_code: "VPS_SSH_TRANSPORT_ARGUMENTS_REJECTED" };
    }
    const nowMs = Date.now();
    const results = new Map();
    const perCommandTimeout = Math.max(500, Math.min(2500, Number(timeoutMs) || 2500));
    for (const command of commands) {
      try {
        const { stdout } = await execFn("ssh", ["-o", "BatchMode=yes", "-o", "ConnectTimeout=5", host, command], {
          timeout: perCommandTimeout,
          windowsHide: true,
          maxBuffer: 128 * 1024,
        });
        results.set(command, { ok: true, stdout: String(stdout || "").slice(0, 16_384) });
      } catch (err) {
        results.set(command, { ok: false, error: boundStr(err?.code || "SSH_COMMAND_FAILED", 80) });
      }
    }
    return parseVpsObservation(results, nowMs);
  };
}

export async function collectVpsNewResources(options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  const cacheTtl = Number.isFinite(options.cacheTtlMs) ? options.cacheTtlMs : VPS_CACHE_TTL_MS;
  if (!options.bypassCache && vpsCache && nowMs - vpsCache.cached_at_ms < cacheTtl) {
    return { ...vpsCache.payload, cache_hit: true };
  }

  const sshRunner = options.sshRunner || null;
  if (typeof sshRunner !== "function") {
    const payload = {
      reachable: false,
      state: "UNAVAILABLE",
      reason_code: "VPS_PRIVATE_OBSERVATION_UNAVAILABLE",
      observation_reason_code: "VPS_PRIVATE_OBSERVATION_NOT_WIRED",
      observed_at: new Date(nowMs).toISOString(),
      freshness: "stale",
      ...healthMeta("NOT_OBSERVED", "COLLECTOR_NOT_WIRED", "VPS_PRIVATE_OBSERVATION_NOT_WIRED"),
      reason_code: "VPS_PRIVATE_OBSERVATION_UNAVAILABLE",
      cache_hit: false,
      host_hint: "ionos-n8n-new.tailc01234.ts.net",
      detail: "Nessun trasporto privato di osservazione è configurato nel runtime del dispatcher.",
      hermes_novnc: buildHermesNovncVpsObservation(),
      ...collectorMeta("vps_private_probe", "dispatcher private read-only remote probe", "SSH BatchMode observation-only"),
    };
    vpsCache = { cached_at_ms: nowMs, payload };
    return payload;
  }

  const results = {};
  for (const command of VPS_SAFE_REMOTE_COMMANDS) {
    const safety = assertVpsCommandSafe(command);
    if (!safety.ok) {
      return {
        reachable: false,
        state: "UNAVAILABLE",
        reason_code: safety.reason_code,
        observed_at: new Date(nowMs).toISOString(),
        freshness: "stale",
        ...collectorMeta("vps_private_probe", "dispatcher private read-only remote probe"),
      };
    }
  }

  try {
    const observed = await sshRunner({
      host: options.host || "ionos-n8n-new",
      commands: VPS_SAFE_REMOTE_COMMANDS,
      timeoutMs: options.timeoutMs ?? 8000,
      batchMode: true,
    });
    const payload = {
      reachable: observed?.reachable === true,
      state: observed?.reachable === true ? "AVAILABLE" : "UNAVAILABLE",
      reason_code: observed?.reason_code || (observed?.reachable ? null : "VPS_PROBE_FAILED"),
      observed_at: observed?.observed_at || new Date(nowMs).toISOString(),
      freshness: observed?.reachable === true ? "fresh" : "stale",
      ...healthMeta(
        observed?.reachable === true ? "AVAILABLE" : "NOT_OBSERVED",
        observed?.reachable === true ? "OBSERVED" : (observed?.observation_state || "NOT_OBSERVED"),
        observed?.reachable === true ? null : (observed?.reason_code || "VPS_OBSERVATION_NOT_OBSERVED"),
      ),
      ...(observed?.reachable === true ? {} : { reason_code: observed?.reason_code || "VPS_PROBE_FAILED" }),
      cache_hit: false,
      uptime_seconds: boundNum(observed?.uptime_seconds),
      hostname: boundStr(observed?.hostname, 120),
      os: boundStr(observed?.os, 120),
      kernel: boundStr(observed?.kernel, 120),
      architecture: boundStr(observed?.architecture, 40),
      vcpu_count: boundNum(observed?.vcpu_count),
      load: observed?.load ?? null,
      load_average: observed?.load_average ?? observed?.load ?? null,
      cpu_percent: boundNum(observed?.cpu_percent),
      ram_total_bytes: boundNum(observed?.ram_total_bytes),
      ram_used_bytes: boundNum(observed?.ram_used_bytes),
      ram_free_bytes: boundNum(observed?.ram_free_bytes),
      ram_percent: boundNum(observed?.ram_percent),
      swap_total_bytes: boundNum(observed?.swap_total_bytes),
      swap_used_bytes: boundNum(observed?.swap_used_bytes),
      swap_free_bytes: boundNum(observed?.swap_free_bytes),
      swap_percent: boundNum(observed?.swap_percent),
      root_disk_total_bytes: boundNum(observed?.root_disk_total_bytes),
      root_disk_used_bytes: boundNum(observed?.root_disk_used_bytes),
      root_disk_free_bytes: boundNum(observed?.root_disk_free_bytes),
      root_disk_percent: boundNum(observed?.root_disk_percent),
      tailscale_ip: boundStr(observed?.tailscale_ip, 40),
      host_hint: "ionos-n8n-new.tailc01234.ts.net",
      tailscale_magicdns: "ionos-n8n-new.tailc01234.ts.net",
      service_states: observed?.service_states && typeof observed.service_states === "object" ? Object.fromEntries(Object.entries(observed.service_states).slice(0, 8).map(([key, value]) => [boundStr(key, 40), boundStr(value, 40)])) : {},
      hermes_novnc: observed?.hermes_novnc && typeof observed.hermes_novnc === "object" ? {
        chrome_state: boundStr(observed.hermes_novnc.chrome_state, 40),
        novnc_vps_state: boundStr(observed.hermes_novnc.novnc_vps_state, 40),
        xvfb_state: boundStr(observed.hermes_novnc.xvfb_state, 40),
        x11vnc_state: boundStr(observed.hermes_novnc.x11vnc_state, 40),
        novnc_http_status: boundNum(observed.hermes_novnc.novnc_http_status),
        bind: HERMES_NOVNC_VPS_BIND,
        public_exposure: boundStr(observed.hermes_novnc.public_exposure, 40),
        auto_tunnel: "NO",
        source: "VPS_PRIVATE_READ_ONLY_OBSERVATION",
        service_states: observed.hermes_novnc.service_states && typeof observed.hermes_novnc.service_states === "object"
          ? Object.fromEntries(Object.entries(observed.hermes_novnc.service_states).slice(0, 4).map(([key, value]) => [boundStr(key, 40), boundStr(value, 40)]))
          : {},
      } : buildHermesNovncVpsObservation(),
      docker: boundStr(observed?.docker, 80),
      n8n: boundStr(observed?.n8n, 80),
      postgresql: boundStr(observed?.postgresql, 80),
      litellm: boundStr(observed?.litellm, 80),
      ...collectorMeta("vps_private_probe", "dispatcher private read-only remote probe", "SSH BatchMode observation-only"),
    };
    vpsCache = { cached_at_ms: nowMs, payload };
    return payload;
  } catch (err) {
    const payload = {
      reachable: false,
      state: "UNAVAILABLE",
      reason_code: "VPS_PROBE_FAILED",
      error: boundStr(err?.code || err?.message, 80),
      observed_at: new Date(nowMs).toISOString(),
      freshness: "stale",
      ...healthMeta("NOT_OBSERVED", "NOT_OBSERVED", "VPS_OBSERVATION_NOT_OBSERVED"),
      cache_hit: false,
      hermes_novnc: buildHermesNovncVpsObservation(),
      ...collectorMeta("vps_private_probe", "dispatcher private read-only remote probe"),
    };
    vpsCache = { cached_at_ms: nowMs, payload };
    return payload;
  }
}

/** Test helper: clear VPS observation cache. */
export function resetVpsObservationCache() {
  vpsCache = null;
}

function poolCard(poolId, pool, consumers, collector) {
  const p = pool && typeof pool === "object" ? pool : null;
  const state = p ? boundStr(p.state, 40) || "unknown" : "unknown";
  const freshness = p ? boundStr(p.freshness, 40) || "stale" : "stale";
  return {
    quota_pool_id: poolId,
    accounting_domain: poolId,
    consumers,
    state: state.toUpperCase(),
    freshness,
    remaining_percent: p && typeof p.remaining_percent === "number" ? p.remaining_percent : null,
    reset_at: p?.reset_at ?? null,
    evaluation: boundStr(p?.evaluation, 80),
    windows: Array.isArray(p?.windows) ? p.windows.slice(0, 8) : null,
    source: boundStr(p?.source, 80),
    observed_at: p?.observed_at || p?.updated_at || null,
    health_state: "NOT_APPLICABLE",
    observation_state: freshness === "stale" ? "STALE" : "OBSERVED",
    quota_observation_state: freshness === "stale" ? "STALE" : "OBSERVED",
    quota_health_state: "NOT_APPLICABLE",
    ...(freshness === "stale" ? { reason_code: boundStr(p?.reason_code, 80) || "QUOTA_NOT_OBSERVED" } : {}),
    ...collector,
  };
}

export async function collectQuotaObservatory(options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  const compose = options.composeCanonicalQuotaState || composeCanonicalQuotaState;

  // LIVE OpenClaw read-only observation (#73). Bounded in-memory cache (default
  // 60s TTL) so GET /v1/resources never executes the CLI on every browser
  // refresh. The observation is in-memory only: no receipts, envelopes,
  // configs or ingest files are written as a side effect of GET.
  let openclaw = null;
  if (options.collectOpenClaw !== null) {
    const probeOpenClaw = options.collectOpenClaw || getOpenClawQuotaObservation;
    try {
      openclaw = await probeOpenClaw({
        nowMs,
        ...(options.openClawCacheTtlMs != null ? { cacheTtlMs: options.openClawCacheTtlMs } : {}),
        ...(options.openClawTimeoutMs != null ? { timeoutMs: options.openClawTimeoutMs } : {}),
      });
    } catch {
      openclaw = null; // collector failures never break /v1/resources
    }
  }

  // Existing merge law: OpenClaw live contributions are merged WITH the
  // ingest-lane contributions by the composer's deterministic priority/
  // freshness selection — a newer valid canonical observation is never
  // silently discarded.
  let laneContributions = options.contributions;
  if (openclaw?.emit_contributions === true && Array.isArray(openclaw.contributions)) {
    const ingested =
      Array.isArray(options.contributions) && options.contributions.length
        ? options.contributions
        : safeCollectIngestContributions(options.ingestDir);
    laneContributions = [...(ingested || []), ...openclaw.contributions];
  }
  let canonical;
  try {
    canonical = await compose({
      registry: options.registry,
      baseline: options.baseline,
      contributions: laneContributions,
      ingestDir: options.ingestDir,
      nowMs,
    });
  } catch (err) {
    canonical = { ok: false, reason_codes: ["QUOTA_COMPOSE_FAILED", boundStr(err?.message, 60)] };
  }

  const joined = canonical?.joined && typeof canonical.joined === "object" ? canonical.joined : null;
  const pools = joined?.pools && typeof joined.pools === "object" ? joined.pools : {};
  const openclawLive = openclaw?.pools && typeof openclaw.pools === "object" ? openclaw.pools : {};
  const liveSource = (poolId) =>
    openclaw?.emit_contributions === true &&
    openclawLive[poolId] &&
    openclawLive[poolId].state !== "unknown" &&
    openclawLive[poolId].freshness === "fresh"
      ? openclawLive[poolId]
      : null;
  const liveMeta = (poolId) => {
    const live = liveSource(poolId);
    return live
      ? collectorMeta(
          "openclaw_usage_live",
          "OpenClaw usage (read-only CLI) / canonical quota state",
          boundStr(live.source_label, 80),
        )
      : collectorMeta("rt25_quota_ingest", "rt25 quota ingest / canonical quota state", `${poolId} shared once`);
  };
  const attachLive = (pool, live) => {
    if (!live) return pool;
    // Window detail comes from the SAME single live pool observation (no
    // per-model duplication — glm-5.3 and flash share one pool entry).
    // Binding windows only; auxiliary (MCP) is separate non-routing metadata.
    pool.windows = live.windows.map((w) => ({
      window_type: w.window_type,
      label: w.label,
      remaining_percent: w.remaining_percent,
      reset_at: w.reset_at,
    }));
    pool.auxiliary_windows = (live.auxiliary_windows || []).slice(0, 8).map((w) => ({
      kind: w.kind || "auxiliary",
      label: w.label,
      remaining_percent: w.remaining_percent,
      reset_at: w.reset_at,
    }));
    pool.unmapped_windows = (live.unmapped_windows || []).slice(0, 8);
    // Headline remaining + reset come from the LIMITING binding window (MIN).
    if (typeof live.effective_remaining_percent === "number") {
      pool.remaining_percent = live.effective_remaining_percent;
    } else if (live.primary && typeof live.primary.remaining_percent === "number") {
      pool.remaining_percent = live.primary.remaining_percent;
    }
    pool.reset_at = live.primary?.reset_at ?? pool.reset_at;
    pool.observed_at = openclaw.observed_at;
    pool.freshness = "fresh";
    pool.observation_state = "OBSERVED";
    pool.quota_observation_state = "OBSERVED";
    if (typeof live.plan === "string" && live.plan) pool.plan = boundStr(live.plan, 40);
    return pool;
  };
  const glm = attachLive(
    poolCard(
      "glm_coding_plan",
      pools.glm_coding_plan,
      ["glm-5.3", "glm-5.3-flash"],
      liveMeta("glm_coding_plan"),
    ),
    liveSource("glm_coding_plan"),
  );
  const codex = attachLive(
    poolCard(
      "chatgpt_codex_subscription",
      pools.chatgpt_codex_subscription,
      ["codex_ide_cursor_extension", "codex_external_planner"],
      liveMeta("chatgpt_codex_subscription"),
    ),
    liveSource("chatgpt_codex_subscription"),
  );
  // Optional offline fixture/adapter input only. This branch never performs
  // an app-server RPC and never changes the canonical OpenClaw projection.
  const codexSecondaryInput =
    options.codexAppServerObservation ??
    options.codexAppServerResponse ??
    null;
  const codexSecondary = codexSecondaryInput
    ? normalizeCodexAppServerQuota(codexSecondaryInput, { nowMs })
    : null;
  const codexPrimary = openclaw?.pools?.chatgpt_codex_subscription || null;
  const codexReconciliation = codexSecondary
    ? reconcileCodexQuotaObservations(codexPrimary, codexSecondary)
    : null;
  if (codexSecondary) {
    codex.secondary_observation = codexSecondary;
    codex.reconciliation = codexReconciliation;
  }

  const cursorManual = loadCursorManualObservation(options);
  const cursor = {
    accounting_mapping: "UNVERIFIED",
    health_state: "NOT_OBSERVED",
    observation_state: "UNVERIFIED_ACCOUNTING",
    reason_code: "CURSOR_ACCOUNTING_UNVERIFIED",
      state: cursorManual ? boundStr(cursorManual.state, 40) || "UNKNOWN" : "UNKNOWN",
      freshness: cursorManual ? freshnessFromAge(cursorManual.observed_at, nowMs, QUOTA_DISPLAY_FRESH_MS) : "stale",
      observed_at: cursorManual?.observed_at || null,
      source: cursorManual?.source || null,
      plan: cursorManual?.plan || null,
      plan_reset_at: cursorManual?.plan_reset_at || null,
      plan_reset_date: cursorManual?.plan_reset_date || null,
      plan_reset_precision: cursorManual?.plan_reset_precision || null,
      usage_semantics: cursorManual?.usage_semantics || "labels_are_remaining_percent",
      labels: cursorManual?.labels || { cursor_models: null, other_models: null },
      source_usage: cursorManual?.source_usage || { cursor_models_used_percent: null, other_models_used_percent: null },
      on_demand_spending: cursorManual?.on_demand_spending || null,
      monthly_limit: cursorManual?.monthly_limit || null,
    note: "Cursor rimane un harness: nessun pool inventato. Solo osservazione manuale runtime se presente.",
    ...collectorMeta("cursor_manual", "manual runtime observation until accounting is qualified"),
  };

  const qwen = {
    capacity: "LOCAL_COMPUTE",
    commercial_quota: "N/A",
    state: "N/A",
    health_state: "NOT_APPLICABLE",
    observation_state: "NOT_APPLICABLE",
    quota_observation_state: "NOT_APPLICABLE",
    note: "Capacità locale — nessuna quota commerciale",
    ...collectorMeta("qwen_local", "local compute (no commercial pool)"),
  };

  return {
    ok: canonical?.ok === true,
    canonical_schema: boundStr(canonical?.schema_version, 80),
    reason_codes: Array.isArray(canonical?.reason_codes) ? canonical.reason_codes.slice(0, 8) : [],
    codex_capability: {
      state: "AVAILABLE",
      health_state: "AVAILABLE",
      observation_state: "NOT_OBSERVED",
      reason_code: "CODEX_CAPABILITY_QUALIFIED_QUOTA_NOT_OBSERVED",
      source: "hermes_codex_dynamic_model_router_qualification",
      catalog_state: "DYNAMIC_LIVE",
      quota_observation_state: codex.quota_observation_state,
    },
    openclaw: openclaw
      ? {
          collector: "openclaw_usage_live",
          observed_at: openclaw.observed_at,
          freshness: openclaw.freshness,
          cache_hit: openclaw.cache_hit === true,
          refresh_in_progress: openclaw.refresh_in_progress === true,
          reason_codes: Array.isArray(openclaw.reason_codes) ? openclaw.reason_codes.slice(0, 8) : [],
        }
      : null,
    pools: {
      glm_coding_plan: glm,
      chatgpt_codex_subscription: codex,
    },
    codex_appserver_secondary: codexSecondary,
    codex_reconciliation: codexReconciliation,
    cursor,
    qwen_local: qwen,
    observed_at: new Date(nowMs).toISOString(),
  };
}

/** Read-only ingest-lane collection for the merge law; failures yield []. */
function safeCollectIngestContributions(ingestDir) {
  try {
    const lane = collectIngestContributions(ingestDir);
    return Array.isArray(lane?.contributions) ? lane.contributions : [];
  } catch {
    return [];
  }
}

function loadCursorManualObservation(options = {}) {
  if (options.cursorObservation) return normalizeCursorManualObservation(options.cursorObservation);
  const path = options.cursorObservationPath
    || resolve(ROOT, "configs/runtime/quota-observatory/cursor-manual-observation.json");
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    return normalizeCursorManualObservation(raw);
  } catch {
    return null;
  }
}

export async function collectChatgptWebObservation(options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  // Never claim unlimited/free. Prefer injected/read-only evidence only.
  if (options.chatgptWebObservation && typeof options.chatgptWebObservation === "object") {
    const o = options.chatgptWebObservation;
    return {
      availability_domain: "SEPARATE_AVAILABILITY_DOMAIN",
      state: boundStr(o.state, 40) || "UNKNOWN",
      reachable: o.reachable === true ? true : o.reachable === false ? false : null,
      authenticated: o.authenticated === true ? true : o.authenticated === false ? false : null,
      throttled: o.throttled === true ? true : o.throttled === false ? false : null,
      observed_at: boundStr(o.observed_at, 40) || new Date(nowMs).toISOString(),
      freshness: freshnessFromAge(o.observed_at || new Date(nowMs).toISOString(), nowMs, QUOTA_DISPLAY_FRESH_MS),
      unlimited: false,
      free: false,
      health_state: "NOT_OBSERVED",
      observation_state: "STALE",
      reason_code: "CHATGPT_WEB_OBSERVATION_NOT_AVAILABLE",
      note: "ChatGPT Web è un dominio di disponibilità separato; non è un pool di quota.",
      ...collectorMeta("hermes_web_observation", "existing Hermes/Web observation if available"),
    };
  }
  return {
    availability_domain: "SEPARATE_AVAILABILITY_DOMAIN",
    state: "UNKNOWN",
    reachable: null,
    authenticated: null,
    throttled: null,
    observed_at: null,
    freshness: "stale",
    unlimited: false,
    free: false,
    health_state: "NOT_OBSERVED",
    observation_state: "NOT_OBSERVED",
    reason_code: "CHATGPT_WEB_OBSERVATION_NOT_AVAILABLE",
    note: "Nessuna osservazione sicura disponibile. Non assumere disponibilità illimitata o gratuita.",
    ...collectorMeta("hermes_web_observation", "existing Hermes/Web observation if available"),
  };
}

export async function buildResourceObservatory(options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  const observed_at = new Date(nowMs).toISOString();
  const collectVps = options.collectVps || collectVpsNewResources;
  const collectHermesTunnel = options.collectHermesNovncTunnel || collectHermesNovncTunnel;
  const [workstation, qwen, vps_new, quotas, chatgpt_web, hermes_novnc_tunnel] = await Promise.all([
    (options.collectWorkstation || collectWorkstationMetrics)({ ...options, nowMs }),
    (options.collectQwen || collectQwenResources)({ ...options, nowMs }),
    collectVps({ ...options, sshRunner: options.sshRunner || createCanonicalVpsSshRunner(), nowMs }),
    (options.collectQuotas || collectQuotaObservatory)({ ...options, nowMs }),
    (options.collectChatgptWeb || collectChatgptWebObservation)({ ...options, nowMs }),
    collectHermesTunnel({ ...options, nowMs }),
  ]);

  return {
    schema_version: RESOURCES_SCHEMA,
    observability_contract: OBSERVABILITY_CONTRACT,
    dashboard_red_state_requires_real_failure: true,
    observed_at,
    read_only: true,
    workstation,
    qwen,
    vps_new,
    hermes_novnc: {
      private_url: HERMES_NOVNC_PRIVATE_URL,
      vps: vps_new?.hermes_novnc || buildHermesNovncVpsObservation(),
      tunnel: hermes_novnc_tunnel,
      public_exposure: vps_new?.hermes_novnc?.public_exposure || "NOT_OBSERVED",
      auto_tunnel: "NO",
      observed_at,
    },
    quotas,
    chatgpt_web,
    collectors: {
      workstation: workstation.collector_label,
      gpu: workstation.gpu?.collector_label || null,
      qwen: qwen.collector_label,
      vps_new: vps_new.collector_label,
      glm: quotas.pools?.glm_coding_plan?.collector_label || null,
      codex: quotas.pools?.chatgpt_codex_subscription?.collector_label || null,
      cursor: quotas.cursor?.collector_label || null,
      chatgpt_web: chatgpt_web.collector_label,
      hermes_novnc_tunnel: hermes_novnc_tunnel.collector_label,
    },
  };
}

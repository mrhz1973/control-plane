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
export const VPS_CACHE_TTL_MS = 30_000;
export const WORKSTATION_FRESH_MS = 15_000;
export const QUOTA_DISPLAY_FRESH_MS = 300_000;

/** Observation-only remote command allowlist (no mutation verbs). */
export const VPS_SAFE_REMOTE_COMMANDS = Object.freeze([
  "uname -a",
  "uptime",
  "cat /proc/loadavg",
  "free -b",
  "df -B1 /",
  "docker info --format '{{.ServerVersion}}'",
  "docker ps --format '{{.Names}} {{.Status}}'",
  "systemctl is-active n8n || true",
  "systemctl is-active docker || true",
  "systemctl is-active postgresql || systemctl is-active postgresql@* || true",
]);

const MUTATION_RE = /\b(rm|mv|chmod|chown|tee|dd|kill|reboot|shutdown|apt|yum|dnf|systemctl\s+(start|stop|restart|enable|disable|reload)|docker\s+(run|rm|start|stop|restart|compose|exec)|curl\s+-X\s*(POST|PUT|PATCH|DELETE)|write|truncate)\b/i;

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
      timeoutMs: options.timeoutMs ?? 2000,
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
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(200, options.timeoutMs) : 2000;
  const fetchFn = options.fetchFn || globalThis.fetch;
  try {
    const r = await fetchFn(`${baseUrl}/v1/models`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!r || !r.ok) {
      return { reachable: false, health_summary: `HTTP_${r?.status || "ERR"}`, profile_status: "unreachable", models: [], error: `HTTP_${r?.status || "ERR"}` };
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
      observed_at: new Date(nowMs).toISOString(),
      freshness: "stale",
      cache_hit: false,
      host_hint: "ionos-n8n-new.tailc01234.ts.net",
      detail: "Nessun trasporto privato di osservazione è configurato nel runtime del dispatcher.",
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
      cache_hit: false,
      uptime_seconds: boundNum(observed?.uptime_seconds),
      load: observed?.load ?? null,
      cpu_percent: boundNum(observed?.cpu_percent),
      ram_total_bytes: boundNum(observed?.ram_total_bytes),
      ram_used_bytes: boundNum(observed?.ram_used_bytes),
      ram_free_bytes: boundNum(observed?.ram_free_bytes),
      ram_percent: boundNum(observed?.ram_percent),
      root_disk_total_bytes: boundNum(observed?.root_disk_total_bytes),
      root_disk_free_bytes: boundNum(observed?.root_disk_free_bytes),
      root_disk_percent: boundNum(observed?.root_disk_percent),
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
      cache_hit: false,
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
    state: cursorManual ? boundStr(cursorManual.state, 40) || "UNKNOWN" : "UNKNOWN",
    freshness: cursorManual ? freshnessFromAge(cursorManual.observed_at, nowMs, QUOTA_DISPLAY_FRESH_MS) : "stale",
    observed_at: cursorManual?.observed_at || null,
    labels: cursorManual?.labels || { cursor_models: null, other_models: null },
    note: "Cursor rimane un harness: nessun pool inventato. Solo osservazione manuale runtime se presente.",
    ...collectorMeta("cursor_manual", "manual runtime observation until accounting is qualified"),
  };

  const qwen = {
    capacity: "LOCAL_COMPUTE",
    commercial_quota: "N/A",
    state: "N/A",
    note: "Capacità locale — nessuna quota commerciale",
    ...collectorMeta("qwen_local", "local compute (no commercial pool)"),
  };

  return {
    ok: canonical?.ok === true,
    canonical_schema: boundStr(canonical?.schema_version, 80),
    reason_codes: Array.isArray(canonical?.reason_codes) ? canonical.reason_codes.slice(0, 8) : [],
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
  if (options.cursorObservation) return options.cursorObservation;
  const path = options.cursorObservationPath
    || resolve(ROOT, "configs/runtime/quota-observatory/cursor-manual-observation.json");
  if (!existsSync(path)) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    return {
      state: boundStr(raw.state, 40) || "UNKNOWN",
      observed_at: boundStr(raw.observed_at, 40),
      labels: {
        cursor_models: typeof raw?.labels?.cursor_models === "number" ? raw.labels.cursor_models : null,
        other_models: typeof raw?.labels?.other_models === "number" ? raw.labels.other_models : null,
      },
    };
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
    note: "Nessuna osservazione sicura disponibile. Non assumere disponibilità illimitata o gratuita.",
    ...collectorMeta("hermes_web_observation", "existing Hermes/Web observation if available"),
  };
}

export async function buildResourceObservatory(options = {}) {
  const nowMs = options.nowMs ?? Date.now();
  const observed_at = new Date(nowMs).toISOString();
  const [workstation, qwen, vps_new, quotas, chatgpt_web] = await Promise.all([
    (options.collectWorkstation || collectWorkstationMetrics)({ ...options, nowMs }),
    (options.collectQwen || collectQwenResources)({ ...options, nowMs }),
    (options.collectVps || collectVpsNewResources)({ ...options, nowMs }),
    (options.collectQuotas || collectQuotaObservatory)({ ...options, nowMs }),
    (options.collectChatgptWeb || collectChatgptWebObservation)({ ...options, nowMs }),
  ]);

  return {
    schema_version: RESOURCES_SCHEMA,
    observed_at,
    read_only: true,
    workstation,
    qwen,
    vps_new,
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
    },
  };
}

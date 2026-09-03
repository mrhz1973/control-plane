#!/usr/bin/env node
/**
 * V4 — collect-qwen-local-resource-status-v1
 *
 * Produces a transient complete resource-status-v1 overlay from fresh
 * qwen-local session-manager evidence. Does NOT mutate the committed
 * fail-closed baseline. Does NOT mark any non-qwen resource available.
 *
 * Usage:
 *   node tools/collect-qwen-local-resource-status-v1.mjs [--profile qwen38-opus-q3-daily-16k] [--out <temp-path>]
 *
 * Exit: 0 on schema-valid overlay; non-zero on fail-closed collector error.
 */
import { readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureQwenLocalReady } from "./qwen-local-session-manager-v1.mjs";
import { validateResourceStatusObject } from "./validate-resource-status-v1.mjs";
import {
  opencodeResourceEntryReady,
  opencodeResourceEntryUnavailable,
  probeOpenCodeLocal,
} from "./probe-opencode-local-v1.mjs";
import {
  ROLE_TO_PROFILE_ID,
  STARTUP_PROFILE_ID,
  loadQwenLocalRuntime,
  validateRuntimeDocument,
} from "./qwen-local-runtime-v1.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const BASELINE_PATH = resolve(
  ROOT,
  "configs/resources/status.fail-closed.json",
);

export const READY_STATUSES = Object.freeze([
  "READY",
  "LAUNCH_STARTED_AND_READY",
]);

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadBaseline(path = BASELINE_PATH) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function isoNow(clock) {
  if (typeof clock === "function") {
    const v = clock();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "string") return v;
    if (typeof v === "number") return new Date(v).toISOString();
  }
  return new Date().toISOString();
}

function qwenEntryReady(updatedAt) {
  return {
    available: true,
    quota_remaining: { value: null, unit: "unlimited" },
    reserve_floor: { value: 0, unit: "none" },
    reset_at: null,
    cost_mode: "free",
    location: "local",
    source: "local_probe",
    updated_at: updatedAt,
  };
}

function qwenEntryUnavailable(updatedAt) {
  return {
    available: false,
    quota_remaining: { value: null, unit: "unknown" },
    reserve_floor: { value: 0, unit: "none" },
    reset_at: null,
    cost_mode: "free",
    location: "local",
    source: "local_probe",
    updated_at: updatedAt,
  };
}

function isReadySession(session) {
  return (
    session &&
    typeof session === "object" &&
    session.ready === true &&
    READY_STATUSES.includes(session.status)
  );
}

function isMalformedSession(session) {
  if (!session || typeof session !== "object" || Array.isArray(session)) {
    return true;
  }
  if (typeof session.status !== "string" || !session.status.trim()) {
    return true;
  }
  if (typeof session.ready !== "boolean") {
    return true;
  }
  return false;
}

function mapSessionToReadinessClass(session) {
  if (!session || typeof session !== "object") return "UNCERTAIN";
  if (isReadySession(session)) return "QWEN_READY_IDLE";
  if (
    session.status === "API_UNREACHABLE" ||
    session.status === "LAUNCHER_NOT_FOUND" ||
    session.reason_code === "API_UNREACHABLE" ||
    session.reason_code === "LAUNCHER_NOT_FOUND"
  ) {
    return "QWEN_NOT_RUNNING_SAFE_TO_START";
  }
  if (session.status === "BUSY" || session.reason_code === "BUSY") {
    return "BUSY";
  }
  return "UNCERTAIN";
}

function assessRouterResource(session, profile, role) {
  let catalog_valid = false;
  try {
    catalog_valid = validateRuntimeDocument(loadQwenLocalRuntime()).ok === true;
  } catch {
    catalog_valid = false;
  }
  return {
    canonical_endpoint: "http://127.0.0.1:8080",
    production_catalog_valid: catalog_valid,
    selected_profile_id: profile || STARTUP_PROFILE_ID,
    selected_role: role || null,
    readiness_class: mapSessionToReadinessClass(session),
    router_worker_ready: isReadySession(session),
  };
}

/**
 * Collect a complete resource-status-v1 overlay with fresh qwen_local.
 *
 * options:
 *   profile — default qwen38-opus-q3-daily-16k
 *   ensureReady — injectable session manager
 *   baseline / baselinePath
 *   clock — () => Date|string|number
 *   outPath — optional ephemeral write path (must be explicit)
 */
export async function collectQwenLocalResourceStatus(options = {}) {
  const profile = options.profile || "qwen38-opus-q3-daily-16k";
  const role = options.role || null;
  const ensureReady = options.ensureReady || ensureQwenLocalReady;
  const clock = options.clock || (() => new Date());
  const baseline =
    options.baseline ||
    loadBaseline(options.baselinePath || BASELINE_PATH);

  // Never mutate caller/baseline object.
  const overlay = deepClone(baseline);
  const stamp = isoNow(clock);
  const resolvedRole =
    role ||
    Object.entries(ROLE_TO_PROFILE_ID).find(([, id]) => id === profile)?.[0] ||
    null;

  let session;
  try {
    session = await ensureReady({ profile, ...options.sessionOptions });
  } catch {
    return {
      ok: false,
      classification: "COLLECTOR_SESSION_ERROR",
      reason: "session manager threw",
      status: null,
      session: null,
      router_assessment: assessRouterResource(null, profile, resolvedRole),
    };
  }

  if (isMalformedSession(session)) {
    return {
      ok: false,
      classification: "COLLECTOR_MALFORMED_SESSION",
      reason: "malformed session-manager result",
      status: null,
      session,
      router_assessment: assessRouterResource(session, profile, resolvedRole),
    };
  }

  overlay.generated_at = stamp;
  if (!overlay.resources || typeof overlay.resources !== "object") {
    return {
      ok: false,
      classification: "COLLECTOR_STATUS_SCHEMA_INVALID",
      reason: "baseline missing resources",
      status: null,
      session,
      router_assessment: assessRouterResource(session, profile, resolvedRole),
    };
  }

  // Refresh baseline resource updated_at? Prompt: only qwen overlaid; other
  // resources keep fail-closed semantics (available=false). Keep their fields
  // from baseline clone except we already only change qwen_local.
  overlay.resources.qwen_local = isReadySession(session)
    ? qwenEntryReady(stamp)
    : qwenEntryUnavailable(stamp);

  if (options.probeOpenCode !== false) {
    const probeFn = options.probeOpenCode || probeOpenCodeLocal;
    const opencodeProbe =
      typeof probeFn === "function" ? probeFn(options.opencodeProbeOptions) : probeFn;
    const opencodeReady =
      opencodeProbe &&
      opencodeProbe.available === true &&
      opencodeProbe.dispatch_interface_resolved === true;
    overlay.resources.opencode = opencodeReady
      ? opencodeResourceEntryReady(stamp)
      : opencodeResourceEntryUnavailable(stamp);
  }

  const validation = await validateResourceStatusObject(overlay);
  if (!validation.ok) {
    return {
      ok: false,
      classification: "COLLECTOR_STATUS_SCHEMA_INVALID",
      reason: validation.reason || "overlay failed schema validation",
      status: null,
      session,
      validation,
      router_assessment: assessRouterResource(session, profile, resolvedRole),
    };
  }

  return {
    ok: true,
    classification: "PASS",
    status: overlay,
    session,
    qwen_local_available: overlay.resources.qwen_local.available === true,
    opencode_available: overlay.resources.opencode?.available === true,
    opencode_probe: options.probeOpenCode === false ? null : undefined,
    router_assessment: assessRouterResource(session, profile, resolvedRole),
  };
}

function parseArgs(argv) {
  const opts = { profile: "qwen38-opus-q3-daily-16k", outPath: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--profile" && argv[i + 1]) {
      opts.profile = argv[++i];
    } else if (argv[i] === "--out" && argv[i + 1]) {
      opts.outPath = argv[++i];
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      opts.help = true;
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    process.stderr.write(
      "Usage: node tools/collect-qwen-local-resource-status-v1.mjs [--profile qwen38-opus-q3-daily-16k] [--out <temp-path>]\n",
    );
    process.exit(0);
  }

  if (opts.outPath) {
    const abs = resolve(process.cwd(), opts.outPath);
    const norm = abs.replace(/\\/g, "/").toLowerCase();
    if (norm.includes("/configs/resources/")) {
      process.stderr.write(
        "error: --out must not write under committed configs/resources\n",
      );
      process.exit(1);
    }
  }

  const collected = await collectQwenLocalResourceStatus({
    profile: opts.profile,
  });

  if (!collected.ok) {
    process.stdout.write(
      `${JSON.stringify({
        ok: false,
        classification: collected.classification,
        reason: collected.reason,
        session_status: collected.session?.status ?? null,
      })}\n`,
    );
    process.exit(1);
  }

  if (opts.outPath) {
    const abs = resolve(process.cwd(), opts.outPath);
    mkdirSync(dirname(abs), { recursive: true });
    const tmp = `${abs}.${process.pid}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(collected.status, null, 2)}\n`, "utf8");
    renameSync(tmp, abs);
  }

  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      classification: "PASS",
      qwen_local_available: collected.qwen_local_available,
      session_status: collected.session.status,
      launch_performed: Boolean(collected.session.launch_performed),
      generated_at: collected.status.generated_at,
      status: collected.status,
    })}\n`,
  );
  process.exit(0);
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("collect-qwen-local-resource-status-v1.mjs") ||
    process.argv[1]
      .replace(/\\/g, "/")
      .endsWith("tools/collect-qwen-local-resource-status-v1.mjs"));

if (isMain) {
  main().catch((err) => {
    process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  });
}

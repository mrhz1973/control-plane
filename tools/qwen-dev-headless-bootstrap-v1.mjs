#!/usr/bin/env node
/**
 * qwen-dev-headless-bootstrap-v1 — one-shot zero-generation DEV router restore.
 *
 * Intended entrypoint for a future Windows Scheduled Task at logon/reboot.
 * Restores ONLY the canonical qwen_runtime_router (no browser UI, no PowerShell
 * operator launcher, no agent CLI, no generation, no process kill/restart).
 *
 * Always emits exactly one bounded JSON result on stdout (including unexpected
 * throws normalized to BOOTSTRAP_ERROR). No stderr noise.
 *
 * Usage:
 *   node tools/qwen-dev-headless-bootstrap-v1.mjs
 *
 * Exit 0 when router API is READY; nonzero when fail-closed.
 */
import { ensureWorkstationDevRouterReady } from "./qwen-local-session-manager-v1.mjs";

export const BOOTSTRAP_SCHEMA = "qwen-dev-headless-bootstrap-result-v1";

function sanitizeReason(err) {
  const raw = err && typeof err === "object"
    ? (err.code || err.message || err.name || "BOOTSTRAP_ERROR")
    : String(err || "BOOTSTRAP_ERROR");
  return String(raw).replace(/\s+/g, " ").trim().slice(0, 80) || "BOOTSTRAP_ERROR";
}

function bootstrapErrorResult(err) {
  return {
    schema_version: BOOTSTRAP_SCHEMA,
    status: "BOOTSTRAP_ERROR",
    ready: false,
    base_url: null,
    launch_performed: false,
    launch_count: 0,
    wait_elapsed_ms: 0,
    reason_code: sanitizeReason(err),
  };
}

export async function runDevHeadlessBootstrap(options = {}) {
  try {
    const ensure = options.ensureDevRouterReady || ensureWorkstationDevRouterReady;
    const router = await ensure(options);
    return {
      schema_version: BOOTSTRAP_SCHEMA,
      status: router.status,
      ready: Boolean(router.ready),
      base_url: router.base_url ?? null,
      launch_performed: Boolean(router.launch_performed),
      launch_count: Number(router.launch_count) || 0,
      wait_elapsed_ms: Number(router.wait_elapsed_ms) || 0,
      reason_code: router.reason_code || router.status,
    };
  } catch (err) {
    return bootstrapErrorResult(err);
  }
}

async function main() {
  const out = await runDevHeadlessBootstrap({});
  process.stdout.write(`${JSON.stringify(out)}\n`);
  process.exit(out.ready ? 0 : 1);
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("qwen-dev-headless-bootstrap-v1.mjs") ||
    process.argv[1]
      .replace(/\\/g, "/")
      .endsWith("tools/qwen-dev-headless-bootstrap-v1.mjs"));

if (isMain) {
  main().catch((err) => {
    // Last-resort: still one JSON line, never a raw stack / stderr line.
    process.stdout.write(`${JSON.stringify(bootstrapErrorResult(err))}\n`);
    process.exit(1);
  });
}

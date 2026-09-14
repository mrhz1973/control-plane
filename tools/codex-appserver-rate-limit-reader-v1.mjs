#!/usr/bin/env node
/**
 * PHASE_0_5 — Dispatcher live adapter (read-only observation injection).
 *
 * Wires the codex pool authority (CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ)
 * into the LOCAL_DEV dispatcher via the documented local Codex CLI:
 *
 *   codex app-server (stdio, JSON-RPC) → initialize → account/rateLimits/read
 *
 * READ-ONLY LAW: fixed binary resolution, params null, NEVER calls
 * account/rateLimitResetCredit/consume, no inference, no login/refresh,
 * no credential reads. Absolute deadline with process-tree kill; any failure
 * yields null (fail-closed: the codex pool stays UNKNOWN/STALE — OpenClaw is
 * NEVER used as a codex fallback).
 *
 * GLM law untouched: the OpenClaw collector keeps serving glm_coding_plan.
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const CODEX_AUTHORITY_METHOD = "account/rateLimits/read";
const DEFAULT_DEADLINE_MS = 20_000;
const INIT_RESULT_ID = 1;
const READ_RESULT_ID = 2;

/** Fixed, non-secret resolution: bundled extension runtime → PATH fallback. */
export function resolveCodexAppServerExe(env = process.env, exists = existsSync, listDir = readdirSync) {
  const userHome = env.USERPROFILE || env.HOME || null;
  if (userHome) {
    const extRoot = join(userHome, ".cursor", "extensions");
    try {
      const entries = listDir(extRoot)
        .filter((d) => d.startsWith("openai.chatgpt-"))
        .sort()
        .reverse();
      for (const dir of entries) {
        const exe = join(extRoot, dir, "bin", "windows-x86_64", "codex.exe");
        if (exists(exe)) return exe;
      }
    } catch {
      // fall through to PATH fallback
    }
  }
  return "codex";
}

/**
 * One bounded read-only rate-limits observation. Resolves to a payload shaped
 * for normalizeCodexAppServerQuota (observed_at = client wall clock), or null
 * on any failure/timeout (fail-closed).
 */
export async function fetchCodexAppServerRateLimits(options = {}) {
  const deadlineMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : DEFAULT_DEADLINE_MS;
  const exe = resolveCodexAppServerExe();

  return new Promise((resolve) => {
    let child = null;
    let buf = "";
    let readSent = false;
    let settled = false;
    const t0 = Date.now();

    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { if (child) spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
      try { if (child) child.kill(); } catch {}
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), deadlineMs);

    try {
      child = spawn(exe, ["app-server"], { stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
    } catch {
      finish(null);
      return;
    }
    child.on("error", () => finish(null));

    child.stdout.on("data", (d) => {
      buf += d.toString("utf8");
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith("{")) continue;
        let msg;
        try { msg = JSON.parse(s); } catch { continue; }
        if (msg.id === INIT_RESULT_ID && !readSent) {
          readSent = true;
          child.stdin.write(JSON.stringify({
            jsonrpc: "2.0",
            id: READ_RESULT_ID,
            method: CODEX_AUTHORITY_METHOD,
            params: null,
          }) + "\n");
          continue;
        }
        if (msg.id === READ_RESULT_ID) {
          const result = msg.result ?? null;
          finish(result && typeof result === "object"
            ? { ...result, observed_at: new Date().toISOString(), client_elapsed_ms: Date.now() - t0 }
            : null);
          return;
        }
      }
    });

    child.stdin.write(JSON.stringify({
      jsonrpc: "2.0",
      id: INIT_RESULT_ID,
      method: "initialize",
      params: { clientInfo: { name: "control-plane-quota-authority", title: "Codex quota authority", version: "1.0.0" } },
    }) + "\n");
  });
}

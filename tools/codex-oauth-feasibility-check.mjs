#!/usr/bin/env node
/**
 * PM-18 — Codex OAuth feasibility check (read-only, no login, no tokens).
 * Evaluates whether Codex CLI could be a future implementer worker — not active automation.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { platform } from "node:os";

const SCHEMA = "pm18-codex-oauth-feasibility-v1";
const FORBIDDEN = /Bearer\s|sk-[A-Za-z0-9]|oauth_token|refresh_token|access_token|api[_-]?key/i;

function findCodexInPath() {
  const cmd = platform() === "win32" ? "where" : "which";
  try {
    const out = execFileSync(cmd, ["codex"], {
      encoding: "utf8",
      timeout: 5000,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const line = out.split(/\r?\n/).find((l) => l.trim());
    return line?.trim() || null;
  } catch {
    return null;
  }
}

function safeCodexProbe(bin) {
  const notes = [];
  let versionLine = null;
  for (const args of [["--version"], ["--help"]]) {
    try {
      const r = spawnSync(bin, args, {
        encoding: "utf8",
        timeout: 8000,
        maxBuffer: 64 * 1024,
      });
      const text = `${r.stdout || ""}\n${r.stderr || ""}`.trim();
      if (text && !FORBIDDEN.test(text)) {
        versionLine = text.split(/\r?\n/)[0].slice(0, 200);
        notes.push(`probe ${args.join(" ")}: ok (non-sensitive line captured)`);
        break;
      }
    } catch {
      notes.push(`probe ${args.join(" ")}: failed`);
    }
  }
  return { versionLine, notes };
}

function buildResult() {
  const bin = findCodexInPath();
  const notes = [];

  if (!bin) {
    return {
      schema_version: SCHEMA,
      source: "local-check",
      codex_cli_found: false,
      oauth_session_detected: "not_checked",
      can_run_noninteractive: false,
      safe_for_future_worker: false,
      requires_manual_gate: true,
      blocked_reason: "codex CLI not found in PATH",
      notes: [
        "PM-18 feasibility documented; Codex OAuth worker not enabled on this host.",
        "Install/configure Codex CLI locally before a future PM-19 bridge dry-run.",
      ],
    };
  }

  notes.push(`codex binary: ${bin.replace(/[^\w\\/.:-]/g, "_")}`);
  const { versionLine, notes: probeNotes } = safeCodexProbe(bin);
  notes.push(...probeNotes);
  if (versionLine) notes.push(`version/help: ${versionLine}`);

  return {
    schema_version: SCHEMA,
    source: "local-check",
    codex_cli_found: true,
    oauth_session_detected: "not_checked",
    can_run_noninteractive: "unknown",
    safe_for_future_worker: false,
    requires_manual_gate: true,
    blocked_reason:
      "OAuth session not probed (no login, no token read) — manual gate required before worker use",
    notes: [
      ...notes,
      "PM-18 does not run codex login or read credential stores.",
      "Future implementer must consume Ollama classifier decision JSON + explicit approval.",
    ],
  };
}

const out = buildResult();
const text = JSON.stringify(out, null, 2);
if (FORBIDDEN.test(text)) {
  process.stderr.write("refusing to emit output containing secret-like patterns\n");
  process.exit(1);
}
process.stdout.write(text + "\n");

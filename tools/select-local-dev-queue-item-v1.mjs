#!/usr/bin/env node
/**
 * select-local-dev-queue-item-v1 — deterministic dev-queue selector (LOCAL_DEV lane).
 *
 * Scans a queue directory of backlog-item-v1 markdown files (fenced YAML),
 * parses each through the SAME bounded parser the bridge uses, applies the
 * pinned selection law (READY_FOR_PLANNING, gate-free, risk low/medium,
 * target cursor, not already claimed via receipts task_refs; ordering
 * risk(low<medium) then FIFO created_at), and emits the selection decision.
 *
 * NEVER mutates the queue. NEVER claims. Dry-run by construction: the caller
 * (Cursor) uses the decision to invoke the bridge, which is the single
 * claiming authority (duplicate -> CLAIM_ALREADY_EXISTS).
 *
 * Usage:
 *   node tools/select-local-dev-queue-item-v1.mjs --queue tests/local-dev-backlog-envelope-bridge-v1/fixtures \
 *     --receipts reports/runtime/dev-queue/receipts.json --out reports/runtime/dev-queue/selection.json
 *   [--now "2026-09-05T06:00:00Z"]   # deterministic clock override (tests)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parseBoundedBacklogYaml, extractYamlFence } from "./build-primary-remote-cycle-input-from-backlog.mjs";

export const SELECTION_SCHEMA = "local-dev-queue-selection-v1";
const RISK_ORDER = { low: 0, medium: 1 };
const REQUIRED_STATE = "READY_FOR_PLANNING";

export function parseBacklogFile(markdown) {
  if (typeof markdown !== "string" || !markdown.trim()) return { ok: false, reason: "EMPTY_FILE" };
  const fence = extractYamlFence(markdown);
  if (!fence.ok) return { ok: false, reason: "NO_YAML_FENCE" };
  const parsed = parseBoundedBacklogYaml(fence.yaml);
  if (!parsed.ok) return { ok: false, reason: parsed.reason || "YAML_PARSE_FAILED" };
  return { ok: true, item: parsed.value };
}

/** Admissibility mirrors the BRIDGE's full gate set, including the strict
 * DEV-lane extension-field check: an unknown `local_dev` key makes the item
 * bridge-inadmissible (the bridge would reject it with
 * BACKLOG_DEV_FIELDS_UNSUPPORTED), so the selector must not select it. */
const LOCAL_DEV_KEYS = new Set(["dev_profile", "test_commands", "timebox_hint", "max_turns_hint"]);
const PLANNER_PREFERRED = new Set(["qwen", "glm", "codex"]);

export function isAdmissible(item) {
  if (!(item && typeof item === "object" && !Array.isArray(item))) return false;
  if (item.state !== REQUIRED_STATE) return false;
  if (!Array.isArray(item.human_gate_required_if) || item.human_gate_required_if.length > 0) return false;
  if (!RISK_ORDER.hasOwnProperty(item.risk_hint) || item.risk_hint === "high") return false;
  if (item.execution?.target !== "cursor") return false;
  if (typeof item.planner?.preferred !== "string" || !PLANNER_PREFERRED.has(item.planner.preferred)) return false;
  if (typeof item.id !== "string" || !item.id) return false;
  if (typeof item.created_at !== "string" || !item.created_at) return false;
  if (item.local_dev !== undefined && item.local_dev !== null) {
    if (typeof item.local_dev !== "object" || Array.isArray(item.local_dev)) return false;
    for (const k of Object.keys(item.local_dev)) {
      if (!LOCAL_DEV_KEYS.has(k)) return false;
    }
  }
  return true;
}

export function selectNextQueueItem(entries, receipts, nowIso) {
  const claimed = new Set((receipts || []).map((r) => r?.task_ref).filter(Boolean));
  const eligible = [];
  const excluded = [];
  for (const entry of entries || []) {
    if (!entry.ok) { excluded.push({ source: entry.source, reason: entry.reason }); continue; }
    const item = entry.item;
    if (!isAdmissible(item)) { excluded.push({ source: entry.source, reason: "INADMISSIBLE_STATE_OR_SCOPE" }); continue; }
    if (claimed.has(`LOCAL_DEV_B_${item.id}`)) { excluded.push({ source: entry.source, reason: "CLAIM_ALREADY_EXISTS" }); continue; }
    eligible.push({ entry, item });
  }
  eligible.sort((a, b) => {
    const r = RISK_ORDER[a.item.risk_hint] - RISK_ORDER[b.item.risk_hint];
    if (r !== 0) return r;
    return String(a.item.created_at).localeCompare(String(b.item.created_at));
  });
  const top = eligible[0] || null;
  return {
    schema_version: SELECTION_SCHEMA,
    selected: top
      ? {
          task_ref: `LOCAL_DEV_B_${top.item.id}`,
          id: top.item.id,
          risk_hint: top.item.risk_hint,
          created_at: top.item.created_at,
          source_file: top.entry.source,
        }
      : null,
    eligible_count: eligible.length,
    excluded: excluded.sort((a, b) => String(a.source).localeCompare(String(b.source))),
    decided_at: nowIso,
    reason_code: top ? "SELECTED" : (excluded.length ? "NONE_ELIGIBLE_ALL_EXCLUDED" : "NONE_ELIGIBLE_EMPTY_QUEUE"),
  };
}

function loadReceipts(path) {
  if (!path) return [];
  if (!existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const opt = {};
  for (let i = 0; i < args.length; i += 2) opt[args[i]] = args[i + 1];
  if (!opt["--queue"]) {
    process.stderr.write("Usage: node tools/select-local-dev-queue-item-v1.mjs --queue <dir> [--receipts <json>] [--out <json>] [--now <iso>]\n");
    process.exit(2);
  }
  const queueDir = resolve(opt["--queue"]);
  const files = readdirSync(queueDir).filter((f) => f.endsWith(".md")).sort();
  const entries = files.map((f) => {
    const source = basename(f);
    try {
      const parsed = parseBacklogFile(readFileSync(join(queueDir, f), "utf8").replace(/^\uFEFF/, ""));
      return { ...parsed, source };
    } catch (e) {
      return { ok: false, source, reason: e?.message || "READ_FAILED" };
    }
  });
  const receipts = loadReceipts(opt["--receipts"] ? resolve(opt["--receipts"]) : null);
  const now = opt["--now"] ? new Date(opt["--now"]) : new Date();
  const decision = selectNextQueueItem(entries, receipts, now.toISOString());
  const outJson = JSON.stringify(decision, null, 2);
  if (opt["--out"]) {
    const outPath = resolve(opt["--out"]);
    writeFileSync(outPath, `${outJson}\n`, "utf8");
  }
  process.stdout.write(`${outJson}\n`);
  process.exit(0);
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/select-local-dev-queue-item-v1.mjs");
if (isMain) {
  main().catch((e) => {
    process.stderr.write(`${e?.message || e}\n`);
    process.exit(1);
  });
}

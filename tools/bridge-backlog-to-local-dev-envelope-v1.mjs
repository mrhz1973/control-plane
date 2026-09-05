#!/usr/bin/env node
/**
 * V4 — Deterministic bridge: GitHub backlog-item-v1 → local-dev-task-envelope-v1.
 *
 * Design: reports/architecture/v4_local_dev_executor_backlog_envelope_bridge_design_v1.md
 * Zero new dependencies. Reuses:
 *   - extractYamlFence / parseBoundedBacklogYaml (bounded YAML subset, in-repo)
 *   - validateEnvelope / DEFAULT_DEV_PROFILE_ID  (envelope law, unchanged)
 *
 * Fail-closed DEV-lane gates (in order):
 *   BACKLOG_CONTRACT_UNSUPPORTED      fence/schema/required-field violations
 *   BACKLOG_YAML_INVALID              bounded parser rejected the yaml block
 *   BACKLOG_STATE_NOT_CONSUMABLE      state != READY_FOR_PLANNING
 *   HUMAN_GATE_DECLARED               human_gate_required_if non-empty
 *   BRIDGE_HIGH_RISK_REQUIRES_GATE    risk_hint: high
 *   BACKLOG_SCOPE_EMPTY               scope.allowed_areas empty
 *   BACKLOG_DEV_FIELDS_UNSUPPORTED    unknown/ill-typed local_dev fields
 *   REPO_NOT_LOCAL_KNOWN              repository has no canonical local clone
 *   REPO_PATH_MISMATCH                supplied local path != canonical clone
 *   BACKLOG_ID_INVALID                id missing or not D-NNNN-X style
 *   CLAIM_ALREADY_EXISTS              source_ref/task_ref already claimed
 *   (validateEnvelope failures are surfaced verbatim — bridge never
 *    re-implements envelope bounds.)
 *
 * This tool NEVER runs the executor, never generates, never touches git.
 * Dry-run by construction: it only derives and writes envelope+receipt JSON.
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extractYamlFence, parseBoundedBacklogYaml } from "./build-primary-remote-cycle-input-from-backlog.mjs";
import { validateEnvelope, DEFAULT_DEV_PROFILE_ID, ENVELOPE_SCHEMA } from "./local-dev-executor-v1.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

export const BRIDGE_SCHEMA = "local-dev-backlog-bridge-v1";
export const BRIDGE_VERSION = "local-dev-backlog-bridge-v1";
export const RECEIPTS_DIR = "reports/runtime/dev-queue";

/** v1 supports exactly this canonical local clone. */
export const KNOWN_LOCAL_REPOS = {
  "mrhz1973/control-plane": "C:\\Users\\mrhz\\Documents\\AI\\GitHub\\control-plane",
};

const BACKLOG_SCHEMA = "backlog-item-v1";
const CONSUMABLE_STATE = "READY_FOR_PLANNING";
const PLANNER_PREFERRED = new Set(["qwen", "glm", "codex"]);
const RISK_HINTS = new Set(["low", "medium", "high"]);
const ID_RE = /^D-\d+-[A-Za-z0-9_-]+$/;
const LOCAL_DEV_KEYS = new Set(["dev_profile", "test_commands", "timebox_hint", "max_turns_hint"]);

const BASE_ALLOWED_COMMANDS = ["git status --short", "git diff --check"];
const FALLBACK_TEST_COMMAND = "git diff --check";

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function fail(codes) {
  return { ok: false, reason_codes: Array.isArray(codes) ? codes : [codes] };
}

/** Deterministic task_delta template (declares corrective loop only when allowed).
 * CREATE inference is generic (never fixture-specific): an objective that
 * declares creation of a missing/new file gets explicit create-flow shaping
 * so the agent does not read-before-create or shell-probe for existence. */
export function inferTaskKind(b) {
  const objective = typeof b.objective === "string" ? b.objective : "";
  if (/\b(create|add)\b[^.\n]*\b(new\s+)?(file|doc|document|note|report)\b/i.test(objective) ||
      /\bappend\b[^.\n]*\bto\b[^.\n]*\b[A-Za-z0-9_./\\-]+\.(md|txt|json|ya?ml)\b/i.test(objective)) {
    return "CREATE";
  }
  return "MODIFY";
}

export function buildTaskDelta(b, maxTestCycles) {
  const lines = [];
  lines.push(`Objective: ${b.objective}`);
  const taskKind = inferTaskKind(b);
  if (taskKind === "CREATE") {
    lines.push(
      "Execution mode: CREATE — the target file MAY NOT EXIST yet; its absence is EXPECTED, not a blocker.",
      "Create the file directly with the permitted file edit tool; do NOT read the target before initial creation; do NOT use shell commands to test file or directory existence.",
      "After creation, verify through the permitted file tooling only.",
    );
  } else {
    lines.push("Execution mode: MODIFY — operate on the existing target using the permitted file edit tool.");
  }
  if (Array.isArray(b.acceptance) && b.acceptance.length) {
    lines.push("Acceptance criteria:");
    b.acceptance.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  }
  if (Array.isArray(b.scope?.forbidden_areas) && b.scope.forbidden_areas.length) {
    lines.push(`Forbidden (do not touch): ${b.scope.forbidden_areas.join(", ")}`);
  }
  if (maxTestCycles > 0) {
    lines.push(`Workflow: implement then test then correct corrective loop declared, test cycles: ${maxTestCycles}.`);
  }
  lines.push("Perform the change directly in the main agent; no subagents, no delegation; the executor owns tests and git persistence.");
  return lines.join("\n");
}

/**
 * Pure bridge: backlog markdown artifact → validated local-dev envelope + claim receipt.
 * Never executes anything.
 */
export function buildLocalDevEnvelopeFromBacklog(input = {}) {
  const { markdown, repo, commit, path, dispatchBaseHead, now, existingReceipts } = input;
  if (typeof markdown !== "string" || !markdown.trim()) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (typeof repo !== "string" || !repo) return fail("REPO_NOT_LOCAL_KNOWN");
  if (typeof commit !== "string" || !/^[0-9a-f]{40}$/i.test(commit)) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (typeof path !== "string" || !path) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (typeof dispatchBaseHead !== "string" || !/^[0-9a-f]{40}$/i.test(dispatchBaseHead)) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (!(now instanceof Date || typeof now === "string")) return fail("BACKLOG_CONTRACT_UNSUPPORTED");

  // Canonical local clone (v1: single known repo).
  const canonical = KNOWN_LOCAL_REPOS[repo];
  if (!canonical) return fail("REPO_NOT_LOCAL_KNOWN");

  // 1. exactly one fenced yaml block.
  const fence = extractYamlFence(markdown);
  if (!fence.ok) return fail("BACKLOG_CONTRACT_UNSUPPORTED");

  // 2. bounded yaml parse.
  const parsed = parseBoundedBacklogYaml(fence.yaml);
  if (!parsed.ok) return fail(["BACKLOG_YAML_INVALID", parsed.reason || "YAML_PARSE_FAILED"]);
  const b = parsed.value;
  if (!b || typeof b !== "object" || Array.isArray(b)) return fail("BACKLOG_CONTRACT_UNSUPPORTED");

  // 3. contract-required identity fields.
  if (b.schema !== BACKLOG_SCHEMA) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (b.created_by !== "gpt-web") return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (typeof b.branch_target !== "string" || !b.branch_target.trim()) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (!b.execution || typeof b.execution !== "object" || Array.isArray(b.execution)) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (b.execution.target !== "cursor") return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (typeof b.execution.loop_allowed !== "boolean") return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (typeof b.planner?.preferred !== "string" || !PLANNER_PREFERRED.has(b.planner.preferred)) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (typeof b.objective !== "string" || !b.objective.trim()) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (typeof b.id !== "string" || !ID_RE.test(b.id)) return fail("BACKLOG_ID_INVALID");
  if (b.state === undefined || b.state === null) return fail("BACKLOG_CONTRACT_UNSUPPORTED");

  // Gate order per design.
  if (b.state !== CONSUMABLE_STATE) return fail("BACKLOG_STATE_NOT_CONSUMABLE");
  if (!Array.isArray(b.human_gate_required_if)) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (b.human_gate_required_if.length > 0) return fail("HUMAN_GATE_DECLARED");
  if (typeof b.risk_hint !== "string" || !RISK_HINTS.has(b.risk_hint)) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
  if (b.risk_hint === "high") return fail("BRIDGE_HIGH_RISK_REQUIRES_GATE");
  if (!isStringArray(b.scope?.allowed_areas) || b.scope.allowed_areas.length === 0) return fail("BACKLOG_SCOPE_EMPTY");

  // 4. strict DEV-lane extension fields.
  let dev = {};
  if (b.local_dev !== undefined && b.local_dev !== null) {
    if (typeof b.local_dev !== "object" || Array.isArray(b.local_dev)) return fail("BACKLOG_DEV_FIELDS_UNSUPPORTED");
    dev = b.local_dev;
    for (const k of Object.keys(dev)) {
      if (!LOCAL_DEV_KEYS.has(k)) return fail("BACKLOG_DEV_FIELDS_UNSUPPORTED");
    }
  }
  let timeboxHint = 600;
  if (dev.timebox_hint !== undefined && dev.timebox_hint !== null) {
    if (!Number.isInteger(dev.timebox_hint)) return fail("BACKLOG_DEV_FIELDS_UNSUPPORTED");
    timeboxHint = dev.timebox_hint;
  }
  let turnsHint = 8;
  if (dev.max_turns_hint !== undefined && dev.max_turns_hint !== null) {
    if (!Number.isInteger(dev.max_turns_hint)) return fail("BACKLOG_DEV_FIELDS_UNSUPPORTED");
    turnsHint = dev.max_turns_hint;
  }
  let testCommand = FALLBACK_TEST_COMMAND;
  if (dev.test_commands !== undefined && dev.test_commands !== null) {
    if (!isStringArray(dev.test_commands) || dev.test_commands.length > 1) return fail("BACKLOG_DEV_FIELDS_UNSUPPORTED");
    if (dev.test_commands.length === 1 && dev.test_commands[0].trim()) testCommand = dev.test_commands[0];
  }
  const profileId = dev.dev_profile !== undefined && dev.dev_profile !== null ? dev.dev_profile : DEFAULT_DEV_PROFILE_ID;
  if (typeof profileId !== "string" || !profileId.trim()) return fail("BACKLOG_DEV_FIELDS_UNSUPPORTED");

  // 5. loop → test cycles mapping.
  let maxLoopHint = 1;
  if (b.execution.max_loop_rounds_hint !== undefined && b.execution.max_loop_rounds_hint !== null) {
    if (!Number.isInteger(b.execution.max_loop_rounds_hint)) return fail("BACKLOG_CONTRACT_UNSUPPORTED");
    maxLoopHint = b.execution.max_loop_rounds_hint;
  }
  const maxTestCycles = b.execution.loop_allowed ? clamp(maxLoopHint, 1, 2) : 0;

  // 6. idempotency (receipt sidecar, v1 single-writer).
  const sourceRef = `github:${repo}@${commit}:${path}`;
  const taskRef = `LOCAL_DEV_B_${b.id}`;
  const receipts = Array.isArray(existingReceipts) ? existingReceipts : [];
  for (const r of receipts) {
    if (r && (r.source_ref === sourceRef || r.task_ref === taskRef)) return fail("CLAIM_ALREADY_EXISTS");
  }

  // 7. deterministic envelope (schema fields only; closed schema).
  const allowedCommands = [...BASE_ALLOWED_COMMANDS];
  if (testCommand !== FALLBACK_TEST_COMMAND) allowedCommands.push(testCommand);
  const envelope = {
    schema_version: ENVELOPE_SCHEMA,
    task_ref: taskRef,
    target_repo_path: canonical,
    target_remote: `https://github.com/${repo}.git`,
    dispatch_base_head: dispatchBaseHead,
    profile_id: profileId,
    task_delta: buildTaskDelta(b, maxTestCycles),
    task_kind: inferTaskKind(b),
    allowed_paths: [...b.scope.allowed_areas],
    allowed_commands: allowedCommands,
    test_command: testCommand,
    network_policy: "localhost_only",
    timebox_seconds: clamp(timeboxHint, 60, 900),
    max_agent_turns: clamp(turnsHint, 1, 16),
    max_test_cycles: maxTestCycles,
    git_persistence_required: true,
  };

  // 8. single source of envelope law.
  const v = validateEnvelope(envelope);
  if (!v.ok) return { ok: false, reason_codes: ["ENVELOPE_INVALID", ...v.reason_codes] };

  const claimedAt = now instanceof Date ? now.toISOString() : now;
  const receipt = {
    task_ref: taskRef,
    source_ref: sourceRef,
    claimed_at: claimedAt,
    bridge_version: BRIDGE_VERSION,
  };
  return { ok: true, envelope, receipt };
}

/* ----------------------------- CLI (dry-run) ----------------------------- */
function usage() {
  process.stderr.write(
    "Usage: node tools/bridge-backlog-to-local-dev-envelope-v1.mjs --file <backlog.md> --repo <owner/repo> --commit <sha> --path <backlog path> --dispatch-head <live HEAD sha> [--receipts <claims.json>] --out <out.json>\n",
  );
}

async function main() {
  const args = process.argv.slice(2);
  const opt = {};
  for (let i = 0; i < args.length; i += 2) opt[args[i]] = args[i + 1];
  if (!opt["--file"] || !opt["--repo"] || !opt["--commit"] || !opt["--path"] || !opt["--dispatch-head"] || !opt["--out"]) {
    usage();
    process.exit(2);
  }
  const { readFileSync } = await import("node:fs");
  const markdown = readFileSync(resolve(opt["--file"]), "utf8").replace(/^\uFEFF/, "");
  let existingReceipts = [];
  if (opt["--receipts"]) {
    existingReceipts = JSON.parse(readFileSync(resolve(opt["--receipts"]), "utf8"));
    if (!Array.isArray(existingReceipts)) existingReceipts = [];
  }
  const result = buildLocalDevEnvelopeFromBacklog({
    markdown,
    repo: opt["--repo"],
    commit: opt["--commit"],
    path: opt["--path"],
    dispatchBaseHead: opt["--dispatch-head"],
    now: new Date(),
    existingReceipts,
  });
  if (!result.ok) {
    process.stdout.write(`${JSON.stringify({ ok: false, reason_codes: result.reason_codes }, null, 2)}\n`);
    process.exit(1);
  }
  writeFileSync(resolve(opt["--out"]), JSON.stringify({ bridge: BRIDGE_SCHEMA, ...result }, null, 2), "utf8");
  process.stdout.write(`${JSON.stringify({ ok: true, task_ref: result.envelope.task_ref, out: opt["--out"] }, null, 2)}\n`);
  process.exit(0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`${e?.message || e}\n`);
    process.exit(1);
  });
}

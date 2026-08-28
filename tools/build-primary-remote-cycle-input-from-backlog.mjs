#!/usr/bin/env node
/**
 * D-0025-W — Build WF61 consumer_input + routing_input from backlog-item-v1 Markdown.
 *
 * Contract: docs/contracts/backlog-primary-remote-adapter-v1.md
 * Zero HTTP/provider calls. Fail-closed. No new runtime dependencies.
 *
 * Usage:
 *   node tools/build-primary-remote-cycle-input-from-backlog.mjs \
 *     --repo-b64 <base64> \
 *     --commit-b64 <base64> \
 *     --path-b64 <base64> \
 *     --markdown-b64 <base64> \
 *     --gate <path-to-primary-remote-runtime-gate.json>
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, "..");
export const RESULT_SCHEMA = "backlog-primary-remote-adapter-result-v1";
export const GATE_SCHEMA = "primary-remote-runtime-gate-v1";

const RISK = new Set(["low", "medium", "high"]);
const COMPLEXITY = new Set(["low", "medium", "high"]);
const REMOTE_PLANNERS = new Set(["glm", "codex"]);
const ALL_PLANNERS = new Set(["qwen", "glm", "codex"]);

function emit(result, code) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(code);
}

function baseResult(extra = {}) {
  return {
    schema: RESULT_SCHEMA,
    ok: false,
    classification: "ADAPTER_FAILED",
    task_id: null,
    dispatch_allowed: false,
    consumer_input: null,
    routing_input: null,
    reason: null,
    ...extra,
  };
}

function decodeB64(label, b64) {
  if (typeof b64 !== "string" || b64.trim().length === 0) {
    return { ok: false, reason: `${label} base64 is required` };
  }
  try {
    return { ok: true, value: Buffer.from(b64, "base64").toString("utf8") };
  } catch (err) {
    return {
      ok: false,
      reason: `${label} base64 decode failed: ${String(err.message || err)}`,
    };
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const val = argv[i + 1];
    if (val === undefined || val.startsWith("--")) {
      out[key] = true;
      continue;
    }
    out[key] = val;
    i++;
  }
  return out;
}

/**
 * Extract exactly one fenced yaml block from Markdown.
 */
export function extractYamlFence(markdown) {
  if (typeof markdown !== "string") {
    return { ok: false, classification: "BACKLOG_YAML_MALFORMED", reason: "markdown must be a string" };
  }
  const re = /```yaml\s*\r?\n([\s\S]*?)\r?\n```/gi;
  const matches = [...markdown.matchAll(re)];
  if (matches.length === 0) {
    return {
      ok: false,
      classification: "BACKLOG_YAML_MALFORMED",
      reason: "exactly one fenced yaml block is required",
    };
  }
  if (matches.length > 1) {
    return {
      ok: false,
      classification: "BACKLOG_YAML_MALFORMED",
      reason: "multiple fenced yaml blocks are not supported",
    };
  }
  return { ok: true, yaml: matches[0][1] };
}

function unquote(s) {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  return s;
}

function parseScalar(raw) {
  const t = raw.trim();
  if (t === "" || t === "null" || t === "~") return null;
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "[]") return [];
  if (t === "{}") return {};
  if (/^-?\d+$/.test(t)) return Number(t);
  if (/^-?\d+\.\d+$/.test(t)) return Number(t);
  return unquote(t);
}

/**
 * Bounded YAML parser for backlog-item-v1 subset only.
 * Supports: mappings, nested mappings, string arrays, scalars, folded `>` / `|`.
 * Rejects: anchors, aliases, tags, flow maps beyond []/{}, multi-doc, complex nesting.
 */
export function parseBoundedBacklogYaml(text) {
  if (typeof text !== "string") {
    return { ok: false, reason: "yaml text must be a string" };
  }
  // Reject YAML anchors/aliases/tags; allow block scalars `|` / `>`.
  if (/(^|[\s,:\[\{])[&*][A-Za-z0-9_-]+/.test(text) || /![A-Za-z][A-Za-z0-9_-]*/.test(text)) {
    return {
      ok: false,
      reason: "unsupported YAML construct (anchor/alias/tag)",
    };
  }
  if (text.includes("---\n") && text.trimStart().startsWith("---")) {
    // single leading --- ok as document start; second --- is multi-doc
    const docs = text.split(/^---\s*$/m).filter((d) => d.trim().length > 0);
    if (docs.length > 1) {
      return { ok: false, reason: "multi-document YAML is not supported" };
    }
  }

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const root = {};
  const stack = [{ indent: -1, obj: root, kind: "map" }];

  function current() {
    return stack[stack.length - 1];
  }

  function ensureMap(parent, key) {
    if (
      parent.obj[key] === undefined ||
      typeof parent.obj[key] !== "object" ||
      Array.isArray(parent.obj[key])
    ) {
      parent.obj[key] = {};
    }
    return parent.obj[key];
  }

  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    i++;
    if (/^\s*#/.test(line) || line.trim() === "") continue;
    if (/^\s*---\s*$/.test(line)) continue;
    if (/^\s*\.\.\.\s*$/.test(line)) continue;

    const indent = line.match(/^ */)[0].length;
    const trimmed = line.trim();

    while (stack.length > 1 && indent <= current().indent) {
      stack.pop();
    }
    const ctx = current();

    // Array item
    if (trimmed.startsWith("- ")) {
      if (ctx.kind !== "array") {
        return { ok: false, reason: `array item at unexpected indent: ${trimmed}` };
      }
      const rest = trimmed.slice(2).trim();
      if (rest === ">" || rest === "|") {
        return { ok: false, reason: "block scalar array items are not supported" };
      }
      ctx.obj.push(parseScalar(rest));
      continue;
    }
    if (trimmed === "-") {
      return { ok: false, reason: "empty array item is not supported" };
    }

    const kv = trimmed.match(/^([^:#][^:]*?):\s*(.*)$/);
    if (!kv) {
      return { ok: false, reason: `unsupported YAML line: ${trimmed}` };
    }
    const key = kv[1].trim();
    let valRaw = kv[2];

    if (ctx.kind !== "map") {
      return { ok: false, reason: `map key under non-map context: ${key}` };
    }

    // Nested map start: "key:" with nothing / next indented content
    if (valRaw === "" || valRaw === null) {
      // peek next non-empty
      let j = i;
      while (j < lines.length && (lines[j].trim() === "" || /^\s*#/.test(lines[j]))) j++;
      if (j < lines.length) {
        const nextIndent = lines[j].match(/^ */)[0].length;
        const nextTrim = lines[j].trim();
        if (nextIndent > indent && nextTrim.startsWith("- ")) {
          const arr = [];
          ctx.obj[key] = arr;
          stack.push({ indent, obj: arr, kind: "array" });
          continue;
        }
        if (nextIndent > indent) {
          const child = ensureMap(ctx, key);
          stack.push({ indent, obj: child, kind: "map" });
          continue;
        }
      }
      ctx.obj[key] = null;
      continue;
    }

    const blockMarker = valRaw.trim();
    if (/^>([-+])?$/.test(blockMarker) || /^\|([-+])?$/.test(blockMarker)) {
      const folded = blockMarker.startsWith(">");
      const collected = [];
      while (i < lines.length) {
        const n = lines[i];
        if (n.trim() === "") {
          collected.push("");
          i++;
          continue;
        }
        const nIndent = n.match(/^ */)[0].length;
        if (nIndent <= indent) break;
        collected.push(n.slice(indent + 2)); // typical 2-space indent under key
        i++;
      }
      // Better: strip common indent of collected lines
      const nonempty = collected.filter((c) => c.trim().length > 0);
      let common = 0;
      if (nonempty.length) {
        const indents = nonempty.map((c) => (c.match(/^ */) || [""])[0].length);
        common = Math.min(...indents);
      }
      const body = collected
        .map((c) => (c.length >= common ? c.slice(common) : c))
        .join(folded ? " " : "\n")
        .replace(/ +/g, " ")
        .trim();
      // For folded `>`, join paragraphs; for `|` keep newlines more faithfully
      if (folded) {
        ctx.obj[key] = collected
          .map((c) => (c.length >= common ? c.slice(common) : c))
          .join("\n")
          .split(/\n\s*\n/)
          .map((p) => p.replace(/\n/g, " ").replace(/ +/g, " ").trim())
          .filter(Boolean)
          .join("\n")
          .trim();
      } else {
        ctx.obj[key] = collected
          .map((c) => (c.length >= common ? c.slice(common) : c))
          .join("\n")
          .replace(/\n+$/, "");
      }
      continue;
    }

    if (valRaw.trim() === "[]") {
      ctx.obj[key] = [];
      continue;
    }

    // Inline flow sequence: [a, b]
    if (valRaw.trim().startsWith("[") && valRaw.trim().endsWith("]")) {
      const inner = valRaw.trim().slice(1, -1).trim();
      if (inner === "") {
        ctx.obj[key] = [];
      } else {
        ctx.obj[key] = inner.split(",").map((s) => parseScalar(s.trim()));
      }
      continue;
    }

    if (valRaw.trim().startsWith("{")) {
      return { ok: false, reason: "inline flow mappings are not supported" };
    }

    ctx.obj[key] = parseScalar(valRaw);
  }

  return { ok: true, value: root };
}

function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function remoteUsability(planner, st) {
  if (!st || typeof st !== "object" || Array.isArray(st)) return "UNKNOWN";
  if (planner === "qwen") {
    if (st.available === false || st.resource_pressure === "high") return "UNAVAILABLE";
    if (st.available === "unknown" || st.resource_pressure === "unknown") return "UNKNOWN";
    if (
      st.available === true &&
      (st.resource_pressure === "low" || st.resource_pressure === "medium")
    ) {
      return "HEALTHY";
    }
    return "UNKNOWN";
  }
  // glm / codex
  if (st.available === false || st.quota_state === "exhausted") return "UNAVAILABLE";
  if (st.available === "unknown" || st.quota_state === "unknown") return "UNKNOWN";
  if (st.available === true && st.quota_state === "healthy") return "HEALTHY";
  if (st.available === true && st.quota_state === "conserve") return "CONSERVE";
  return "UNKNOWN";
}

function loadGate(gatePath) {
  if (!gatePath || typeof gatePath !== "string") {
    return { ok: false, reason: "--gate path is required" };
  }
  const abs = resolve(gatePath);
  if (!existsSync(abs)) {
    return { ok: false, reason: `gate file not found: ${abs}` };
  }
  let gate;
  try {
    gate = JSON.parse(readFileSync(abs, "utf8").replace(/^\uFEFF/, ""));
  } catch (err) {
    return {
      ok: false,
      reason: `gate JSON parse failed: ${String(err.message || err)}`,
    };
  }
  if (!gate || typeof gate !== "object" || Array.isArray(gate)) {
    return { ok: false, reason: "gate must be a JSON object" };
  }
  if (gate.schema !== GATE_SCHEMA) {
    return {
      ok: false,
      reason: `gate schema must be ${GATE_SCHEMA}`,
    };
  }
  if (typeof gate.enabled !== "boolean") {
    return { ok: false, reason: "gate.enabled must be boolean" };
  }
  if (typeof gate.provider_calls_authorized_per_event !== "number") {
    return {
      ok: false,
      reason: "gate.provider_calls_authorized_per_event must be a number",
    };
  }
  if (!Array.isArray(gate.allowed_planners)) {
    return { ok: false, reason: "gate.allowed_planners must be an array" };
  }
  if (!gate.provider_state || typeof gate.provider_state !== "object") {
    return { ok: false, reason: "gate.provider_state is required" };
  }
  for (const p of ["qwen", "glm", "codex"]) {
    if (!gate.provider_state[p] || typeof gate.provider_state[p] !== "object") {
      return { ok: false, reason: `gate.provider_state.${p} is required` };
    }
  }
  return { ok: true, gate, path: abs };
}

/**
 * Core adapter: markdown + metadata + gate → result object (no process.exit).
 */
export function buildPrimaryRemoteCycleInput({
  repo,
  commit,
  path,
  markdown,
  gate,
}) {
  if (typeof repo !== "string" || repo.trim().length === 0) {
    return baseResult({
      classification: "INPUT_INVALID",
      reason: "repo is required",
    });
  }
  if (typeof commit !== "string" || commit.trim().length === 0) {
    return baseResult({
      classification: "INPUT_INVALID",
      reason: "commit is required",
    });
  }
  if (typeof path !== "string" || path.trim().length === 0) {
    return baseResult({
      classification: "INPUT_INVALID",
      reason: "path is required",
    });
  }
  if (!gate || gate.schema !== GATE_SCHEMA) {
    return baseResult({
      classification: "GATE_SCHEMA_INVALID",
      reason: "runtime gate artifact is invalid",
    });
  }

  const fence = extractYamlFence(markdown);
  if (!fence.ok) {
    return baseResult({
      classification: fence.classification,
      reason: fence.reason,
    });
  }

  const parsed = parseBoundedBacklogYaml(fence.yaml);
  if (!parsed.ok) {
    return baseResult({
      classification: "BACKLOG_YAML_MALFORMED",
      reason: parsed.reason,
    });
  }
  const b = parsed.value;

  // Legacy / unsupported without schema
  if (b.schema === undefined || b.schema === null) {
    return baseResult({
      classification: "BACKLOG_CONTRACT_UNSUPPORTED",
      reason: "legacy backlog without schema: backlog-item-v1 is required",
    });
  }
  if (b.schema !== "backlog-item-v1") {
    return baseResult({
      classification: "BACKLOG_CONTRACT_UNSUPPORTED",
      reason: `unsupported backlog schema: ${String(b.schema)}`,
    });
  }

  // Required presence / types
  const missing = [];
  if (typeof b.id !== "string" || b.id.trim().length === 0) missing.push("id");
  if (typeof b.repository !== "string" || b.repository.trim().length === 0) {
    missing.push("repository");
  }
  if (typeof b.branch_target !== "string" || b.branch_target.trim().length === 0) {
    missing.push("branch_target");
  }
  if (typeof b.objective !== "string" || b.objective.trim().length === 0) {
    missing.push("objective");
  }
  if (!RISK.has(b.risk_hint)) missing.push("risk_hint");
  if (!COMPLEXITY.has(b.complexity_hint)) missing.push("complexity_hint");
  if (!b.planner || typeof b.planner !== "object" || Array.isArray(b.planner)) {
    missing.push("planner");
  }
  if (!b.scope || typeof b.scope !== "object" || Array.isArray(b.scope)) {
    missing.push("scope");
  }
  if (!b.execution || typeof b.execution !== "object" || Array.isArray(b.execution)) {
    missing.push("execution");
  }
  if (!isStringArray(b.acceptance)) missing.push("acceptance");
  if (!isStringArray(b.human_gate_required_if)) missing.push("human_gate_required_if");
  if (typeof b.state !== "string" || b.state.trim().length === 0) missing.push("state");
  if (typeof b.created_by !== "string") missing.push("created_by");

  if (missing.length) {
    return baseResult({
      classification: "BACKLOG_FIELD_MISSING",
      reason: `missing or invalid required fields: ${missing.join(",")}`,
      task_id: typeof b.id === "string" ? b.id : null,
    });
  }

  if (b.created_by !== "gpt-web") {
    return baseResult({
      classification: "BACKLOG_CONTRACT_UNSUPPORTED",
      reason: "created_by must be gpt-web",
      task_id: b.id,
    });
  }

  if (b.repository !== repo) {
    return baseResult({
      classification: "BACKLOG_REPOSITORY_MISMATCH",
      reason: `backlog.repository ${b.repository} != watched repo ${repo}`,
      task_id: b.id,
    });
  }

  if (b.execution.target !== "cursor") {
    return baseResult({
      classification: "BACKLOG_CONTRACT_UNSUPPORTED",
      reason: "execution.target must be cursor",
      task_id: b.id,
    });
  }

  if (!isStringArray(b.scope.allowed_areas)) {
    return baseResult({
      classification: "BACKLOG_FIELD_MISSING",
      reason: "scope.allowed_areas must be a string array",
      task_id: b.id,
    });
  }
  if (!isStringArray(b.scope.forbidden_areas)) {
    return baseResult({
      classification: "BACKLOG_FIELD_MISSING",
      reason: "scope.forbidden_areas must be a string array",
      task_id: b.id,
    });
  }

  if (!ALL_PLANNERS.has(b.planner.preferred)) {
    return baseResult({
      classification: "BACKLOG_FIELD_MISSING",
      reason: "planner.preferred must be qwen|glm|codex",
      task_id: b.id,
    });
  }

  if (!Array.isArray(b.planner.fallback)) {
    return baseResult({
      classification: "BACKLOG_FIELD_MISSING",
      reason: "planner.fallback must be an array",
      task_id: b.id,
    });
  }

  // D-0025 primary-remote lane constraints
  if (b.planner.preferred === "qwen") {
    return baseResult({
      classification: "QWEN_DEFERRED",
      reason: "Qwen is deferred for the primary-remote lane",
      task_id: b.id,
    });
  }
  if (!REMOTE_PLANNERS.has(b.planner.preferred)) {
    return baseResult({
      classification: "PRIMARY_REMOTE_PLANNER_UNSUPPORTED",
      reason: `preferred planner not allowed: ${b.planner.preferred}`,
      task_id: b.id,
    });
  }
  if (b.planner.fallback.length !== 0) {
    return baseResult({
      classification: "PLANNER_FALLBACK_FORBIDDEN",
      reason: "D-0025 primary-remote lane requires empty planner.fallback",
      task_id: b.id,
    });
  }
  if (b.planner.fallback_policy !== "gate_only") {
    return baseResult({
      classification: "FALLBACK_POLICY_INVALID",
      reason: "planner.fallback_policy must be gate_only",
      task_id: b.id,
    });
  }
  if (b.planner.fallback.includes("qwen") || b.planner.preferred === "qwen") {
    return baseResult({
      classification: "QWEN_DEFERRED",
      reason: "Qwen must not appear in preferred or fallback",
      task_id: b.id,
    });
  }

  if (b.state !== "READY_FOR_PLANNING") {
    return baseResult({
      classification: "BACKLOG_STATE_NOT_READY",
      reason: `state must be READY_FOR_PLANNING, got ${b.state}`,
      task_id: b.id,
      ok: false,
    });
  }

  const consumer_input = {
    task_id: b.id,
    source_backlog_ref: `github:${repo}@${commit}:${path}`,
    source_backlog_commit: commit,
    repository: b.repository,
    branch_target: b.branch_target,
    goal: b.objective,
    risk_hint: b.risk_hint,
    complexity_hint: b.complexity_hint,
    planner_requested: b.planner.preferred,
    allowed_paths: [...b.scope.allowed_areas],
    forbidden_paths: [...b.scope.forbidden_areas],
    acceptance_seed: [...b.acceptance],
    validation_seed: [],
    hard_constraints: [...b.human_gate_required_if],
  };

  const routing_input = {
    schema: "planner-routing-input-v1",
    task_id: b.id,
    risk_hint: b.risk_hint,
    complexity_hint: b.complexity_hint,
    preferred: b.planner.preferred,
    fallback: [],
    fallback_policy: "gate_only",
    provider_state: {
      qwen: { ...gate.provider_state.qwen },
      glm: { ...gate.provider_state.glm },
      codex: { ...gate.provider_state.codex },
    },
  };

  // Internal consistency: task_id and preferred must match
  if (
    consumer_input.task_id !== routing_input.task_id ||
    consumer_input.planner_requested !== routing_input.preferred
  ) {
    return baseResult({
      classification: "ADAPTER_INVARIANT_VIOLATION",
      reason: "task_id/preferred mismatch cannot be emitted",
      task_id: b.id,
    });
  }

  // Gate evaluation
  const preferred = routing_input.preferred;
  const usability = remoteUsability(preferred, gate.provider_state[preferred]);
  const gateAllows =
    gate.enabled === true &&
    gate.provider_calls_authorized_per_event === 1 &&
    gate.allowed_planners.includes(preferred) &&
    Array.isArray(routing_input.fallback) &&
    routing_input.fallback.length === 0 &&
    routing_input.fallback_policy === "gate_only" &&
    usability === "HEALTHY" &&
    preferred !== "qwen" &&
    !routing_input.fallback.includes("qwen") &&
    b.state === "READY_FOR_PLANNING";

  if (gateAllows) {
    return {
      schema: RESULT_SCHEMA,
      ok: true,
      classification: "REMOTE_DISPATCH_READY",
      task_id: b.id,
      dispatch_allowed: true,
      consumer_input,
      routing_input,
      reason: "runtime gate armed and preferred planner HEALTHY",
    };
  }

  return {
    schema: RESULT_SCHEMA,
    ok: true,
    classification: "REMOTE_PLANNER_GATE_CLOSED",
    task_id: b.id,
    dispatch_allowed: false,
    consumer_input,
    routing_input,
    reason: gate.enabled
      ? `dispatch not authorized (usability=${usability}; provider_calls_authorized_per_event=${gate.provider_calls_authorized_per_event})`
      : "runtime gate disabled (enabled=false)",
  };
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const repoD = decodeB64("repo-b64", args["repo-b64"]);
  if (!repoD.ok) {
    emit(baseResult({ classification: "INPUT_INVALID", reason: repoD.reason }), 1);
  }
  const commitD = decodeB64("commit-b64", args["commit-b64"]);
  if (!commitD.ok) {
    emit(baseResult({ classification: "INPUT_INVALID", reason: commitD.reason }), 1);
  }
  const pathD = decodeB64("path-b64", args["path-b64"]);
  if (!pathD.ok) {
    emit(baseResult({ classification: "INPUT_INVALID", reason: pathD.reason }), 1);
  }
  const mdD = decodeB64("markdown-b64", args["markdown-b64"]);
  if (!mdD.ok) {
    emit(baseResult({ classification: "INPUT_INVALID", reason: mdD.reason }), 1);
  }
  const gateLoad = loadGate(args.gate);
  if (!gateLoad.ok) {
    emit(
      baseResult({ classification: "GATE_SCHEMA_INVALID", reason: gateLoad.reason }),
      1,
    );
  }

  const result = buildPrimaryRemoteCycleInput({
    repo: repoD.value,
    commit: commitD.value,
    path: pathD.value,
    markdown: mdD.value,
    gate: gateLoad.gate,
  });

  // Contract: exit 0 for deterministic parse/map including closed gate;
  // nonzero for malformed/unsupported/ambiguous/contract violation.
  const successClassifications = new Set([
    "REMOTE_DISPATCH_READY",
    "REMOTE_PLANNER_GATE_CLOSED",
  ]);
  const code = successClassifications.has(result.classification) ? 0 : 1;
  emit(result, code);
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main();
}

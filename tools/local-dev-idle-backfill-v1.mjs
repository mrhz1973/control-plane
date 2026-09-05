#!/usr/bin/env node
/**
 * local-dev-idle-backfill-v1 — policy-gated SYNTHETIC idle-backfill injector.
 *
 * Turns a CLEAN_DRAINED LOCAL_DEV queue into at most ONE policy-valid
 * synthetic READY backlog item per invocation. Deterministic, bounded,
 * idempotent, fail-closed. Reuses the pinned idle/backfill LAW verbatim
 * (tests/local-dev-idle-backfill-policy-v1) and the normal selector gates.
 * Synthetic items are schema-identical backlog-item-v1 files; they receive
 * NO privileged route — downstream selector/claim/bridge/executor are
 * untouched.
 *
 * Authoring law (v1): objectives limited to mechanically-supported runtime
 * documentation maintenance/verification under docs/runtime/** derived from
 * canonical evidence refs (CURRENT_FRONTIER / LAST_CURSOR_REPORT / campaign
 * checkpoint / queue state / existing receipts). No new features, no code
 * changes, no speculative work.
 *
 * CLI flow (double-scan, fail-closed):
 *   scan#1 → decision → candidate authoring → persist → scan#2 re-eval →
 *   (if real READY appeared meanwhile: keep file but DO NOT present it as
 *    synthetic injection; report REAL_WORK_PREEMPTED and exit 0 without
 *    candidate) → self-verify through the REAL selector gates → emit record.
 *
 * Usage:
 *   node tools/local-dev-idle-backfill-v1.mjs --queue <dir> \
 *     --receipts <json> --evidence <dir> --head <sha> --segment <id> \
 *     --out-record <json> [--now <iso>] [--policy <json>]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { parseBacklogFile, isAdmissible } from "./select-local-dev-queue-item-v1.mjs";

export const BACKFILL_SCHEMA = "local-dev-idle-backfill-v1";
export const BACKFILL_POLICY_VERSION = "local-dev-idle-backfill-policy-v1";

/** Pinned v1 policy (do not widen without an operator gate). */
export const DEFAULT_POLICY = Object.freeze({
  schema_version: BACKFILL_POLICY_VERSION,
  synthetic_backfill_enabled: true,
  synthetic_allowed_scope_prefix: "docs/runtime/",
  max_synthetics_per_segment: 3,
  never_touch: ["tools/**", "configs/**", "scripts/**", ".github/**"],
});

/** Scan a queue dir: parse every .md; return admissible-unclaimed partition. */
export function scanQueue(queueDir, receipts) {
  const claimed = new Set((receipts || []).map((r) => r?.task_ref).filter(Boolean));
  const entries = [];
  for (const f of readdirSync(queueDir).filter((x) => x.endsWith(".md")).sort()) {
    try {
      entries.push({ ...parseBacklogFile(readFileSync(join(queueDir, f), "utf8").replace(/^\uFEFF/, "")), source: f });
    } catch {
      entries.push({ ok: false, source: f, reason: "READ_FAILED" });
    }
  }
  const unclaimedAdmissible = entries.filter((e) => e.ok && isAdmissible(e.item) && !claimed.has(`LOCAL_DEV_B_${e.item.id}`));
  const claimedCount = entries.filter((e) => e.ok && isAdmissible(e.item) && claimed.has(`LOCAL_DEV_B_${e.item.id}`)).length;
  return { entries, unclaimedAdmissible: unclaimedAdmissible.length, claimedCount };
}

/** Canonicalize + traversal-guard a candidate path (same law as pinned suite). */
export function normalizeSyntheticPath(rawPath) {
  const normalized = String(rawPath || "").replace(/\\/g, "/").split("/").reduce((acc, seg) => {
    if (seg === "..") acc.pop();
    else if (seg !== "." && seg !== "") acc.push(seg);
    return acc;
  }, []).join("/");
  return normalized;
}

/** The pinned LAW (verbatim semantics from the 10/10 suite). */
export function decideBackfill({ unclaimedAdmissible, claimedCount, syntheticsCreatedThisSegment, syntheticCandidate }, policy = DEFAULT_POLICY) {
  if (unclaimedAdmissible > 0) return { decision: "WORK_AVAILABLE", reason_code: "WORK_AVAILABLE" };
  const rawPath = syntheticCandidate && typeof syntheticCandidate.allowed_path === "string" ? syntheticCandidate.allowed_path : "";
  const normalizedPath = normalizeSyntheticPath(rawPath);
  const syntheticOk =
    policy.synthetic_backfill_enabled &&
    rawPath &&
    !rawPath.includes("..") &&
    normalizedPath.startsWith(policy.synthetic_allowed_scope_prefix) &&
    !policy.never_touch.some((p) => normalizedPath.startsWith(p.replace("/**", "/"))) &&
    (syntheticsCreatedThisSegment ?? 0) < policy.max_synthetics_per_segment;
  if (syntheticOk) return { decision: "BACKFILL_SYNTHETIC", reason_code: "BACKFILL_SYNTHETIC", synthetic: { ...syntheticCandidate, allowed_path: normalizedPath } };
  if (claimedCount > 0 || (syntheticsCreatedThisSegment ?? 0) > 0) {
    return { decision: "IDLE", reason_code: policy.synthetic_backfill_enabled ? "IDLE_ALL_CLAIMED_SYNTHETIC_LIMIT" : "IDLE_ALL_CLAIMED" };
  }
  return { decision: "IDLE", reason_code: "IDLE_CLEAN" };
}

/** Deterministic short sha for identity derivation. */
export function shortSha(text) {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i += 1) {
    h1 = (h1 ^ text.charCodeAt(i)) * 0x01000193 >>> 0;
    h2 = (h2 + text.charCodeAt(i) * (i + 1)) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).slice(0, 8);
}

const OBJECTIVE_CLASSES = Object.freeze(new Set(["create_marker_file", "append_marker_line", "verify_note"]));

/**
 * Author a synthetic candidate ONLY from canonical evidence.
 * evidence = { frontier_path: absolute, report_path: absolute, checkpoint_path: absolute }
 * V1 classes (all mechanically verifiable):
 *  - create_marker_file: docs/runtime/AUTOVIA_SYNTHETIC_HEARTBEAT.md missing
 *    per CURRENT_FRONTIER + queue state → create with deterministic marker.
 *  - append_marker_line: heartbeat EXISTS (evidence = file present on disk)
 *    → append next sequence marker line.
 * Malformed/missing/conflicting evidence → no candidate (clean idle).
 */
export function authorSyntheticCandidate({ head, segment, seq, nowIso, policy = DEFAULT_POLICY, heartbeatPath, heartbeatExists, evidenceRefs }) {
  if (!/^[0-9a-f]{40}$/i.test(String(head || ""))) return { ok: false, reason: "INVALID_HEAD" };
  if (!segment || !Number.isInteger(seq) || seq < 1 || seq > policy.max_synthetics_per_segment) return { ok: false, reason: "INVALID_SEQUENCE" };
  const refs = Array.isArray(evidenceRefs) ? evidenceRefs.filter((r) => typeof r === "string" && r.trim()) : [];
  if (refs.length < 2) return { ok: false, reason: "INSUFFICIENT_EVIDENCE" };
  if (typeof heartbeatPath !== "string" || normalizeSyntheticPath(heartbeatPath).startsWith(policy.synthetic_allowed_scope_prefix) !== true) {
    return { ok: false, reason: "OUT_OF_SCOPE_HEARTBEAT" };
  }
  const path = normalizeSyntheticPath(heartbeatPath);
  if (typeof heartbeatExists !== "boolean") return { ok: false, reason: "MALFORMED_EVIDENCE" };
  const objectiveClass = heartbeatExists ? "append_marker_line" : "create_marker_file";
  if (!OBJECTIVE_CLASSES.has(objectiveClass)) return { ok: false, reason: "UNSUPPORTED_OBJECTIVE_CLASS" };
  const marker = `AUTOVIA_SYNTHETIC seq=${seq} segment=${segment} head=${String(head).slice(0, 12)} at=${nowIso}`;
  const suffix = shortSha(`${segment}|${seq}|${head}`);
  const id = `D-91${String(seq).padStart(2, "0")}-${suffix.toUpperCase()}`;
  const objective = heartbeatExists
    ? `Append exactly one new line at the end of ${path}: ${marker} (do not alter any existing line).`
    : `Create the new file ${path} whose entire content is exactly one line: ${marker}.`;
  return {
    ok: true,
    candidate: {
      objective_class: objectiveClass,
      id,
      allowed_path: path,
      marker,
      objective,
      acceptance: heartbeatExists
        ? [`Line "${marker}" present exactly once at end of ${path}`, "All pre-existing lines of the file unchanged"]
        : [`File ${path} exists and contains exactly one line: ${marker}`],
      evidence_refs: refs,
    },
  };
}

/** Render a synthetic item as a normal backlog-item-v1 markdown file. */
export function renderSyntheticBacklogMarkdown(candidate, { repo, nowIso, head, segment, seq }) {
  const refs = candidate.evidence_refs.map((r) => `    - ${r}`).join("\n");
  const acc = candidate.acceptance.map((a) => `  - ${a.replace(/"/g, "'")}`).join("\n");
  return `# Synthetic LOCAL_DEV idle-backfill item (auto-authored)

<!-- synthetic=true | generated_by=local-dev-idle-backfill-v1 | policy=${BACKFILL_POLICY_VERSION} | segment=${segment} | seq=${seq} | base_head=${head} -->

\`\`\`yaml
schema: backlog-item-v1
id: ${candidate.id}
title: Synthetic runtime heartbeat maintenance seq ${seq}
created_at: ${nowIso}
created_by: gpt-web
repository: ${repo}
branch_target: main

objective: ${candidate.objective}
scope:
  allowed_areas:
    - ${candidate.allowed_path}
  forbidden_areas:
    - tools/**
    - configs/**
    - scripts/**
  notes: []

risk_hint: low
complexity_hint: low

planner:
  preferred: qwen
  fallback: []
  fallback_policy: gate_only

execution:
  target: cursor
  loop_allowed: false
  max_loop_rounds_hint: null

acceptance:
${acc}
human_gate_required_if: []
context_refs:
${refs}

state: READY_FOR_PLANNING
\`\`\`
`;
}

function loadReceipts(path) {
  if (!path || !existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Count synthetic items in the queue for THIS segment (files persist after
 * claim; provenance comment carries the segment identity). */
export function countSyntheticFilesInQueue(queueDir, segment) {
  try {
    return readdirSync(queueDir)
      .filter((f) => f.startsWith("SYNTHETIC_") && f.endsWith(".md"))
      .filter((f) => {
        try {
          const md = readFileSync(join(queueDir, f), "utf8");
          return md.includes(`segment=${segment}`);
        } catch {
          return false;
        }
      }).length;
  } catch {
    return 0;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const opt = {};
  for (let i = 0; i < args.length; i += 2) opt[args[i]] = args[i + 1];
  const required = ["--queue", "--receipts", "--head", "--segment", "--out-record"];
  if (required.some((k) => !opt[k])) {
    process.stderr.write("Usage: node tools/local-dev-idle-backfill-v1.mjs --queue <dir> --receipts <json> --head <sha> --segment <id> --out-record <json> [--now <iso>]\n");
    process.exit(2);
  }
  const queueDir = resolve(opt["--queue"]);
  const receiptsPath = resolve(opt["--receipts"]);
  const head = opt["--head"].toLowerCase();
  const segment = opt["--segment"];
  const nowIso = opt["--now"] ? new Date(opt["--now"]).toISOString() : new Date().toISOString();

  const receipts = loadReceipts(receiptsPath);
  // Authoritative per-segment count: synthetic ITEM FILES in the queue carry
  // the segment identity (files persist after claim; receipts alone would
  // miss the injected-but-not-yet-claimed window).
  const syntheticsCreatedThisSegment = countSyntheticFilesInQueue(queueDir, segment);

  // Canonical evidence refs (must exist; malformed → clean idle).
  const evidenceRefs = [
    "docs/runtime/CURRENT_FRONTIER.md",
    "reports/runtime/overnight-campaigns/2026-09-05__V4_LOCAL_DEV_EXECUTOR_OVERNIGHT_AUTOVIA_CAMPAIGN_V1.md",
  ].filter((p) => existsSync(resolve(p)));
  const heartbeatPath = "docs/runtime/AUTOVIA_SYNTHETIC_HEARTBEAT.md";
  const heartbeatExists = existsSync(heartbeatPath);

  // scan#1 + provisional candidate (never persisted before decision).
  const scan1 = scanQueue(queueDir, receipts);
  const nextSeq = syntheticsCreatedThisSegment + 1;
  const authored = authorSyntheticCandidate({ head, segment, seq: nextSeq, nowIso, heartbeatPath, heartbeatExists, evidenceRefs });
  const candidateForDecision = authored.ok
    ? { allowed_path: authored.candidate.allowed_path, objective_class: authored.candidate.objective_class }
    : null;
  const decision = decideBackfill({
    unclaimedAdmissible: scan1.unclaimedAdmissible,
    claimedCount: scan1.claimedCount,
    syntheticsCreatedThisSegment,
    syntheticCandidate: candidateForDecision,
  });

  const record = {
    schema_version: BACKFILL_SCHEMA,
    decided_at: nowIso,
    base_head: head,
    segment,
    seq_candidate: nextSeq,
    scan1: { unclaimed_admissible: scan1.unclaimedAdmissible, claimed: scan1.claimedCount },
    decision: decision.decision,
    reason_code: decision.reason_code,
    candidate: null,
    synthetic_item_created: "NO",
    selector_verification: null,
    real_ready_preempted: "NO",
    policy_version: BACKFILL_POLICY_VERSION,
  };

  if (decision.decision !== "BACKFILL_SYNTHETIC") {
    writeFileSync(resolve(opt["--out-record"]), JSON.stringify(record, null, 2), "utf8");
    process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
    process.exit(0);
  }

  // Persist the synthetic backlog item (normal markdown, normal gates).
  const md = renderSyntheticBacklogMarkdown(authored.candidate, { repo: "mrhz1973/control-plane", nowIso, head, segment, seq: nextSeq });
  const fileName = `SYNTHETIC_${authored.candidate.id}.md`;
  const itemPath = join(queueDir, fileName);

  // Idempotency guards (BEFORE persist):
  //   (a) a file with this deterministic ID already exists on disk;
  //   (b) a receipt already claims this deterministic task_ref (item was
  //       injected and claimed before, even if its file was housekept).
  const derivedTaskRef = `LOCAL_DEV_B_${authored.candidate.id}`;
  if (existsSync(itemPath) || receipts.some((r) => r?.task_ref === derivedTaskRef)) {
    record.reason_code = "SYNTHETIC_ID_COLLISION";
    record.decision = "IDLE";
    writeFileSync(resolve(opt["--out-record"]), JSON.stringify(record, null, 2), "utf8");
    process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
    process.exit(0);
  }
  writeFileSync(itemPath, md, "utf8");

  // scan#2 re-evaluation AFTER persist (fail-closed preemption window).
  const receipts2 = loadReceipts(receiptsPath);
  const scan2 = scanQueue(queueDir, receipts2);
  const realWorkNow = scan2.entries.filter(
    (e) => e.ok && isAdmissible(e.item) && e.item.id !== authored.candidate.id &&
      !receipts2.some((r) => r?.task_ref === `LOCAL_DEV_B_${e.item.id}`),
  ).length > 0;
  if (realWorkNow) {
    // Real READY appeared between decision and persist: DO NOT present the
    // synthetic item (kept on disk as inert artifact, clearly named).
    record.real_ready_preempted = "YES";
    record.reason_code = "REAL_WORK_PREEMPTED";
    record.decision = "WORK_AVAILABLE";
    record.synthetic_item_created = "NO_INJECTED_BUT_FILE_PRESENT";
    record.candidate = { id: authored.candidate.id, file: fileName, inert: true };
  } else {
    // Self-verify through the REAL selector gates (no privileged route).
    const selDecision = scan2.entries.find((e) => e.ok && e.item.id === authored.candidate.id);
    const admissibleViaNormalGates = selDecision ? isAdmissible(selDecision.item) : false;
    record.synthetic_item_created = admissibleViaNormalGates ? "YES" : "NO_GATE_REJECTED";
    record.selector_verification = admissibleViaNormalGates ? "ADMISSIBLE_VIA_NORMAL_SELECTOR" : "REJECTED_BY_NORMAL_SELECTOR";
    record.candidate = admissibleViaNormalGates ? {
      id: authored.candidate.id,
      file: fileName,
      allowed_path: authored.candidate.allowed_path,
      objective_class: authored.candidate.objective_class,
      marker: authored.candidate.marker,
      evidence_refs: authored.candidate.evidence_refs,
    } : { id: authored.candidate.id, file: fileName, rejected: true };
  }

  writeFileSync(resolve(opt["--out-record"]), JSON.stringify(record, null, 2), "utf8");
  process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
  process.exit(0);
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/local-dev-idle-backfill-v1.mjs");
if (isMain) {
  main().catch((e) => {
    process.stderr.write(`${e?.message || e}\n`);
    process.exit(1);
  });
}

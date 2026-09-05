#!/usr/bin/env node
/**
 * dispatch-local-dev-queue-loop-v1 — unattended LOCAL_DEV dispatcher PRIMITIVE.
 *
 * One bounded iteration of the repeatable cycle, fully dry-run by default:
 *
 *   select (selector law) → bridge-claim (bridge is the single claim
 *   authority; duplicate → CLAIM_ALREADY_EXISTS stops the iteration) →
 *   emit the executor run envelope (bare) + updated receipts + a dispatch
 *   record.
 *
 * The dispatcher itself NEVER runs OpenCode, never spawns the executor, and
 * never touches git. Execution remains an explicit, separate operator/Cursor
 * step using tools/run-local-dev-executor-v1.mjs with the emitted envelope.
 * This separation keeps every live generation behind the same bounded,
 * audited path proven in checkpoints 7–8.
 *
 * Usage (dry-run, queue = fixture dir in v1):
 *   node tools/dispatch-local-dev-queue-loop-v1.mjs --queue <dir> \
 *     --receipts <json> --head <sha> --out-dir <dir> [--max-claims 1] [--now <iso>]
 */
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { parseBacklogFile, isAdmissible, selectNextQueueItem } from "./select-local-dev-queue-item-v1.mjs";
import { buildLocalDevEnvelopeFromBacklog, KNOWN_LOCAL_REPOS } from "./bridge-backlog-to-local-dev-envelope-v1.mjs";
import { readdirSync, readFileSync } from "node:fs";

export const DISPATCH_LOOP_SCHEMA = "local-dev-dispatch-loop-v1";

function loadReceipts(path) {
  if (!path || !existsSync(path)) return [];
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Pure core: given queue markdown entries + receipts, claim up to maxClaims
 * items and produce envelopes. Deterministic; injectable now for clock.
 */
export function runDispatchLoop(entries, receipts, { repo, commit, head, nowIso, maxClaims = 1, queueDir }) {
  const ledger = [...receipts];
  const claims = [];
  const skipped = [];
  let remaining = entries;
  for (let i = 0; i < maxClaims; i += 1) {
    const decision = selectNextQueueItem(remaining, ledger, nowIso);
    if (!decision.selected) {
      return {
        schema_version: DISPATCH_LOOP_SCHEMA,
        ok: true,
        claims,
        skipped,
        stop_reason: claims.length ? "MAX_CLAIMS_REACHED" : "QUEUE_DRAINED",
        decided_at: nowIso,
      };
    }
    const file = decision.selected.source_file;
    const entry = remaining.find((e) => e.source === file);
    const backlogPath = entry.backlog_path || (queueDir ? `${queueDir}/${file}` : `tests/local-dev-backlog-envelope-bridge-v1/fixtures/${file}`);
    const bridge = buildLocalDevEnvelopeFromBacklog({
      markdown: entry.markdown,
      repo,
      commit,
      path: backlogPath,
      dispatchBaseHead: head,
      now: nowIso,
      existingReceipts: ledger,
    });
    if (!bridge.ok) {
      skipped.push({ task_ref: decision.selected.task_ref, reason_codes: bridge.reason_codes });
      remaining = remaining.filter((e) => e.source !== file);
      continue;
    }
    ledger.push(bridge.receipt);
    claims.push({
      task_ref: bridge.receipt.task_ref,
      source_file: file,
      envelope: bridge.envelope,
      receipt: bridge.receipt,
    });
    remaining = remaining.filter((e) => e.source !== file);
  }
  return {
    schema_version: DISPATCH_LOOP_SCHEMA,
    ok: true,
    claims,
    skipped,
    stop_reason: "MAX_CLAIMS_REACHED",
    decided_at: nowIso,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const opt = {};
  for (let i = 0; i < args.length; i += 2) opt[args[i]] = args[i + 1];
  if (!opt["--queue"] || !opt["--receipts"] || !opt["--head"] || !opt["--out-dir"]) {
    process.stderr.write("Usage: node tools/dispatch-local-dev-queue-loop-v1.mjs --queue <dir> --receipts <json> --head <sha> --out-dir <dir> [--max-claims 1] [--now <iso>]\n");
    process.exit(2);
  }
  const head = opt["--head"];
  if (!/^[0-9a-f]{40}$/i.test(head)) {
    process.stderr.write("--head must be a 40-hex sha\n");
    process.exit(2);
  }
  const repo = "mrhz1973/control-plane";
  const canonical = KNOWN_LOCAL_REPOS[repo];
  const queueDir = resolve(opt["--queue"]);
  const files = readdirSync(queueDir).filter((f) => f.endsWith(".md")).sort();
  const entries = files.map((f) => {
    const markdown = readFileSync(join(queueDir, f), "utf8").replace(/^\uFEFF/, "");
    return { ...parseBacklogFile(markdown), source: f, markdown, backlog_path: `${opt["--queue"]}/${f}` };
  });
  const receipts = loadReceipts(resolve(opt["--receipts"]));
  const nowIso = opt["--now"] ? new Date(opt["--now"]).toISOString() : new Date().toISOString();
  const maxClaims = Math.max(1, Number(opt["--max-claims"] || 1));
  const result = runDispatchLoop(entries, receipts, { repo, commit: head, head, nowIso, maxClaims, queueDir: opt["--queue"] });
  // Persist the post-loop ledger (claims included), not the pre-run copy.
  const updatedReceipts = receipts.concat(result.claims.map((c) => c.receipt));

  const outDir = resolve(opt["--out-dir"]);
  mkdirSync(outDir, { recursive: true });
  for (const claim of result.claims) {
    const safe = claim.task_ref.replace(/[^A-Za-z0-9_-]/g, "_");
    writeFileSync(join(outDir, `${safe}__dispatch-envelope.json`), JSON.stringify(claim.envelope, null, 2), "utf8");
  }
  writeFileSync(join(outDir, "dispatch-loop-result.json"), JSON.stringify(result, null, 2), "utf8");
  writeFileSync(resolve(opt["--receipts"]), JSON.stringify(updatedReceipts, null, 2), "utf8");
  process.stdout.write(`${JSON.stringify({ ...result, claims: result.claims.map((c) => ({ task_ref: c.task_ref, source_file: c.source_file })), canonical_repo_path: canonical }, null, 2)}\n`);
  process.exit(0);
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/dispatch-local-dev-queue-loop-v1.mjs");
if (isMain) {
  main().catch((e) => {
    process.stderr.write(`${e?.message || e}\n`);
    process.exit(1);
  });
}

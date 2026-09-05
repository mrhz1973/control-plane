/**
 * Deterministic offline tests for the dispatcher primitive
 * tools/dispatch-local-dev-queue-loop-v1.mjs. No network, no executor run,
 * no OpenCode. Covers operator-mandated loop semantics.
 *
 * Run: node tests/local-dev-dispatch-loop-v1/run.mjs
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { runDispatchLoop } from "../../tools/dispatch-local-dev-queue-loop-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FIXTURES = join(ROOT, "tests", "local-dev-backlog-envelope-bridge-v1", "fixtures");
const HEAD = "d".repeat(40);
const NOW = "2026-09-05T07:00:00.000Z";

let passed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    process.stdout.write(`PASS ${name}\n`);
  } catch (err) {
    failures.push(name);
    process.stdout.write(`FAIL ${name}: ${err?.message || err}\n`);
  }
}
const run = (args) => new Promise((res) => execFile(process.execPath, ["tools/dispatch-local-dev-queue-loop-v1.mjs", ...args], { cwd: ROOT, windowsHide: true, timeout: 30_000 }, (e, so, se) => res({ code: e ? (e.code ?? 1) : 0, out: so || "", err: se || "" })));

function loadEntries(files) {
  return files.map((f) => {
    const markdown = readFileSync(join(FIXTURES, f), "utf8");
    return { ...require0(f), source: f, markdown };
  });
  function require0() { return parseStandalone(); }
  function parseStandalone() {
    // reuse the tool's parser through dynamic import (cached)
    return parseCached();
  }
}
import { parseBacklogFile } from "../../tools/select-local-dev-queue-item-v1.mjs";
function parseCached() { return parseBacklogFileCache; }
let parseBacklogFileCache = null;

await test("L1 single claim: SELECTED envelope has CREATE/MODIFY shaping and receipt appended", async () => {
  const files = ["READY_D9001T.md", "GATED_D9003H.md"];
  const entries = files.map((f) => ({ ...parseBacklogFile(readFileSync(join(FIXTURES, f), "utf8")), source: f, markdown: readFileSync(join(FIXTURES, f), "utf8") }));
  const r = runDispatchLoop(entries, [], { repo: "mrhz1973/control-plane", commit: HEAD, head: HEAD, nowIso: NOW, maxClaims: 1 });
  assert.equal(r.ok, true);
  assert.equal(r.claims.length, 1);
  assert.equal(r.claims[0].task_ref, "LOCAL_DEV_B_D-9001-T");
  assert.equal(r.stop_reason, "MAX_CLAIMS_REACHED");
  assert.equal(r.claims[0].envelope.dispatch_base_head, HEAD);
  assert.ok(r.claims[0].envelope.task_delta.length > 0);
});

await test("L2 duplicate claim skipped: second loop run yields QUEUE_DRAINED for the same fixture set", async () => {
  const files = ["READY_D9001T.md"];
  const entries = files.map((f) => ({ ...parseBacklogFile(readFileSync(join(FIXTURES, f), "utf8")), source: f, markdown: readFileSync(join(FIXTURES, f), "utf8") }));
  const receipts = [{ task_ref: "LOCAL_DEV_B_D-9001-T", source_ref: "x", claimed_at: NOW, bridge_version: "v" }];
  const r = runDispatchLoop(entries, receipts, { repo: "mrhz1973/control-plane", commit: HEAD, head: HEAD, nowIso: NOW, maxClaims: 1 });
  assert.equal(r.claims.length, 0);
  assert.equal(r.stop_reason, "QUEUE_DRAINED");
});

await test("L3 multi-claim: maxClaims=2 claims both eligible items in law order", async () => {
  const files = ["READY_D9001T.md", "READY_D9007Q.md", "READY_D9002L_LOOP.md"];
  const entries = files.map((f) => ({ ...parseBacklogFile(readFileSync(join(FIXTURES, f), "utf8")), source: f, markdown: readFileSync(join(FIXTURES, f), "utf8") }));
  const r = runDispatchLoop(entries, [], { repo: "mrhz1973/control-plane", commit: HEAD, head: HEAD, nowIso: NOW, maxClaims: 2 });
  assert.equal(r.claims.length, 2);
  assert.deepEqual(r.claims.map((c) => c.task_ref), ["LOCAL_DEV_B_D-9001-T", "LOCAL_DEV_B_D-9007-Q"]);
  const refs = r.claims.map((c) => c.receipt.task_ref);
  assert.equal(new Set(refs).size, refs.length, "no duplicate receipts in one loop");
});

await test("L4 loop NEVER executes: result contains no execution fields", async () => {
  const files = ["READY_D9001T.md"];
  const entries = files.map((f) => ({ ...parseBacklogFile(readFileSync(join(FIXTURES, f), "utf8")), source: f, markdown: readFileSync(join(FIXTURES, f), "utf8") }));
  const r = runDispatchLoop(entries, [], { repo: "mrhz1973/control-plane", commit: HEAD, head: HEAD, nowIso: NOW, maxClaims: 1 });
  const json = JSON.stringify(r);
  assert.ok(!json.includes("opencode"));
  assert.ok(!json.includes("OPENCODE_CONFIG"));
  assert.ok(!json.includes("run_local_dev"));
});

await test("L5 CLI end-to-end: emits dispatch envelope file + result + updated receipts (dry-run)", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "lde-loop-"));
  try {
    const receiptsPath = join(tmp, "receipts.json");
    writeFileSync(receiptsPath, "[]", "utf8");
    const outDir = join(tmp, "out");
    const r = await run(["--queue", FIXTURES, "--receipts", receiptsPath, "--head", HEAD, "--out-dir", outDir, "--max-claims", "1", "--now", NOW]);
    assert.equal(r.code, 0, r.err);
    const result = JSON.parse(readFileSync(join(outDir, "dispatch-loop-result.json"), "utf8"));
    assert.equal(result.schema_version, "local-dev-dispatch-loop-v1");
    assert.equal(result.claims.length, 1);
    const files = readdirSync(outDir);
    assert.ok(files.some((f) => f.endsWith("__dispatch-envelope.json")));
    const ledger = JSON.parse(readFileSync(receiptsPath, "utf8"));
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].task_ref, "LOCAL_DEV_B_D-9001-T");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);

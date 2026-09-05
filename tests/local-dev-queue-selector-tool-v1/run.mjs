/**
 * Deterministic offline tests for tools/select-local-dev-queue-item-v1.mjs.
 * No network, no git mutation. Uses the REAL fixture directory + a temp
 * receipts file so the CLI end-to-end path is covered.
 *
 * Run: node tests/local-dev-queue-selector-tool-v1/run.mjs
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { parseBacklogFile, isAdmissible, selectNextQueueItem } from "../../tools/select-local-dev-queue-item-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FIXTURES = join(ROOT, "tests", "local-dev-backlog-envelope-bridge-v1", "fixtures");

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
const run = (args) => new Promise((res) => execFile(process.execPath, ["tools/select-local-dev-queue-item-v1.mjs", ...args], { cwd: ROOT, windowsHide: true, timeout: 30_000 }, (e, so, se) => res({ code: e ? (e.code ?? 1) : 0, out: so || "", err: se || "" })));

await test("parses real fixture: READY item is admissible, GATED/HIGHRISK/BLOCKED are not", () => {
  const ready = parseBacklogFile(readFileSync(join(FIXTURES, "READY_D9001T.md"), "utf8"));
  assert.equal(ready.ok, true);
  assert.equal(isAdmissible(ready.item), true);
  for (const [file, ] of [["GATED_D9003H.md"], ["HIGHRISK_D9004R.md"], ["BLOCKED_D9005B.md"]]) {
    const parsed = parseBacklogFile(readFileSync(join(FIXTURES, file), "utf8"));
    assert.equal(parsed.ok, true, file);
    assert.equal(isAdmissible(parsed.item), false, file);
  }
});

await test("selection over real fixtures: READY item wins, others excluded with reasons", () => {
  const files = ["READY_D9001T.md", "READY_D9002L_LOOP.md", "GATED_D9003H.md", "HIGHRISK_D9004R.md", "BLOCKED_D9005B.md", "UNKNOWNDEV_D9006U.md"];
  const entries = files.map((f) => ({ ...parseBacklogFile(readFileSync(join(FIXTURES, f), "utf8")), source: f }));
  const r = selectNextQueueItem(entries, [], "2026-09-05T06:00:00.000Z");
  assert.equal(r.reason_code, "SELECTED");
  // risk law: low (D-9001-T) precedes medium (D-9002-L loop) regardless of ties in created_at
  assert.equal(r.selected.task_ref, "LOCAL_DEV_B_D-9001-T");
  assert.equal(r.selected.risk_hint, "low");
  assert.equal(r.eligible_count, 2);
  const excludedReasons = r.excluded.map((e) => e.reason).sort();
  assert.ok(excludedReasons.includes("CLAIM_ALREADY_EXISTS") === false);
  assert.ok(r.excluded.length >= 3);
});

await test("claimed low-risk READY promotes the medium-risk loop item", () => {
  const files = ["READY_D9001T.md", "READY_D9002L_LOOP.md"];
  const entries = files.map((f) => ({ ...parseBacklogFile(readFileSync(join(FIXTURES, f), "utf8")), source: f }));
  const receipts = [{ task_ref: "LOCAL_DEV_B_D-9001-T" }];
  const r = selectNextQueueItem(entries, receipts, "2026-09-05T06:00:00.000Z");
  assert.equal(r.selected.task_ref, "LOCAL_DEV_B_D-9002-L");
  assert.equal(r.selected.risk_hint, "medium");
});

await test("selection respects receipts (claimed READY -> NONE_ELIGIBLE_ALL_EXCLUDED)", () => {
  const files = ["READY_D9001T.md", "GATED_D9003H.md"];
  const entries = files.map((f) => ({ ...parseBacklogFile(readFileSync(join(FIXTURES, f), "utf8")), source: f }));
  const r = selectNextQueueItem(entries, [{ task_ref: "LOCAL_DEV_B_D-9001-T" }], "2026-09-05T06:00:00.000Z");
  assert.equal(r.selected, null);
  assert.equal(r.reason_code, "NONE_ELIGIBLE_ALL_EXCLUDED");
});

await test("CLI end-to-end: queue dir + receipts file -> decision JSON (--now pinned)", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "lde-sel-"));
  try {
    const receiptsPath = join(tmp, "receipts.json");
    writeFileSync(receiptsPath, "[]", "utf8");
    const outPath = join(tmp, "selection.json");
    const r1 = await run(["--queue", FIXTURES, "--receipts", receiptsPath, "--out", outPath, "--now", "2026-09-05T06:00:00Z"]);
    assert.equal(r1.code, 0, r1.err);
    const decision = JSON.parse(readFileSync(outPath, "utf8"));
    assert.equal(decision.schema_version, "local-dev-queue-selection-v1");
    // risk law: both D-9007-Q and D-9001-T are low; FIFO by created_at → D-9001-T (04:40Z) wins
    assert.equal(decision.selected.task_ref, "LOCAL_DEV_B_D-9001-T");
    assert.equal(decision.selected.risk_hint, "low");
    assert.equal(decision.decided_at, "2026-09-05T06:00:00.000Z");

    writeFileSync(receiptsPath, JSON.stringify([{ task_ref: "LOCAL_DEV_B_D-9001-T" }, { task_ref: "LOCAL_DEV_B_D-9002-L" }]), "utf8");
    const r2 = await run(["--queue", FIXTURES, "--receipts", receiptsPath, "--out", join(tmp, "s2.json"), "--now", "2026-09-05T06:00:00Z"]);
    assert.equal(r2.code, 0);
    const d2 = JSON.parse(readFileSync(join(tmp, "s2.json"), "utf8"));
    // D-9001-T claimed, D-9002-L medium inadmissible-by-claim only if claimed: it is claimed too;
    // D-9007-Q (low, unclaimed) must be selected.
    assert.equal(d2.selected.task_ref, "LOCAL_DEV_B_D-9007-Q");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

await test("CLI with receipts path that does not exist yet -> treats as empty ledger", async () => {
  const r = await run(["--queue", FIXTURES, "--receipts", "Z:/definitely/missing/receipts.json", "--now", "2026-09-05T06:00:00Z"]);
  assert.equal(r.code, 0);
  const decision = JSON.parse(r.out);
  assert.equal(decision.reason_code, "SELECTED");
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);

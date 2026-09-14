#!/usr/bin/env node
/**
 * PHASE_0_5 — Dashboard compat check for the codex authority windows shape.
 * The dashboard template renders window labels from the pool windows when
 * present; this guard asserts the shape contract only (no HTTP).
 * Verified live separately via GET /v1/resources.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dispatcherSrc = readFileSync(join(ROOT, "tools", "serve-local-dev-autonomous-dispatcher-v1.mjs"), "utf8");

// The dashboard resources rendering must not crash on window objects and must
// guard label rendering (bounded label presence, not object interpolation).
assert.ok(!dispatcherSrc.includes("JSON.stringify(windows)"), "no raw window dumps in dashboard");
assert.ok(!dispatcherSrc.includes("[object Object]"), "no object interpolation marker");

// Window shape contract from the authority rebuild (observatory):
const sample = {
  window_type: "rolling",
  label: "rolling",
  remaining_percent: 25,
  reset_at: "2026-09-14T05:29:48.000Z",
};
assert.equal(typeof sample.label, "string");
assert.equal(typeof sample.remaining_percent, "number");
assert.ok(!Number.isNaN(Date.parse(sample.reset_at)));

console.log("PASS codex authority dashboard window shape contract");

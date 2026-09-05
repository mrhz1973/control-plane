#!/usr/bin/env node
/**
 * Focused policy lint — V4_TOKEN_EFFICIENCY_MICRO_TASK_POLICY_PERSISTENCE_V1.
 * Proves canonical method docs declare MICRO_TASK_DELTA defaults without a
 * large policy engine.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 240) });
}
function read(rel) {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

const LAW = "docs/foundation/MICRO_TASK_DELTA_OPERATING_LAW.md";
const TEMPLATE = "docs/foundation/CURSOR_PROMPT_TEMPLATE.md";
const HANDOFF = "docs/foundation/CURSOR_PROMPT_USER_HANDOFF_STANDARD.md";
const GATE = "docs/foundation/PROMPT_SEQUENCING_GATE.md";
const MULTI = "docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md";

const law = read(LAW);
const template = read(TEMPLATE);
const handoff = read(HANDOFF);
const gate = read(GATE);
const multi = read(MULTI);

// A. authoritative law declares MICRO_TASK_DELTA as default unit
check(
  "A-law-default-micro-task-delta",
  /DEFAULT TASK UNIT = `MICRO_TASK_DELTA`/.test(law) &&
    /DEFAULT TASK UNIT = \*\*`MICRO_TASK_DELTA`\*\*/.test(law) === false
      ? /DEFAULT TASK UNIT = `MICRO_TASK_DELTA`/.test(law)
      : /MICRO_TASK_DELTA/.test(law) && /Default development unit/i.test(law),
  "missing DEFAULT TASK UNIT",
);
check(
  "A2-law-default-unit-exact",
  law.includes("DEFAULT TASK UNIT = `MICRO_TASK_DELTA`"),
  "exact marker missing",
);

// B. default corrective bound = 2
check(
  "B-law-max-corrective-loops-2",
  /max_corrective_loops = 2/.test(law) && /max_rounds: 2/.test(template),
  "bound=2 not in law/template",
);

// C. broad regression is checkpoint-only by default
check(
  "C-checkpoint-only-regression",
  /Broad regression[\s\S]*only[\s\S]*CHECKPOINT_DELTA/i.test(law) ||
    (/checkpoint-only/i.test(law) && /CHECKPOINT_DELTA/.test(law)),
  "checkpoint-only law missing",
);
check(
  "C2-handoff-checkpoint-only",
  /CHECKPOINT_DELTA/.test(handoff) && /no broad regression/i.test(handoff),
  "handoff missing checkpoint-only language",
);

// D. human-authorized campaign exception remains possible
check(
  "D-human-authorized-campaign-exception",
  law.includes("HUMAN_AUTHORIZED_CAMPAIGN_EXCEPTION") &&
    handoff.includes("HUMAN_AUTHORIZED_CAMPAIGN_EXCEPTION"),
  "exception marker missing",
);

// E. wrapper order unchanged (MODELLO → BUGBOT → MODALITÀ → TASK DELTA)
function wrapperOrderOk(text) {
  const m = text.match(
    /MODELLO CURSOR:[\s\S]*?BUGBOT:[\s\S]*?MODALITÀ CURSOR:/,
  );
  if (!m) return false;
  // Ensure no reordering of the three headers in the canonical block
  const block = m[0];
  const iM = block.indexOf("MODELLO CURSOR:");
  const iB = block.indexOf("BUGBOT:");
  const iMod = block.indexOf("MODALITÀ CURSOR:");
  return iM >= 0 && iB > iM && iMod > iB;
}
check("E-wrapper-order-handoff", wrapperOrderOk(handoff), "handoff wrapper order broken");
check("E2-wrapper-order-template", wrapperOrderOk(template), "template wrapper order broken");

// F. consumers inherit / reference the authoritative law (not rewrite-only)
check(
  "F-consumers-reference-law",
  template.includes("MICRO_TASK_DELTA_OPERATING_LAW.md") &&
    handoff.includes("MICRO_TASK_DELTA_OPERATING_LAW.md") &&
    gate.includes("MICRO_TASK_DELTA_OPERATING_LAW.md") &&
    multi.includes("MICRO_TASK_DELTA_OPERATING_LAW.md"),
  "missing consumer references",
);

// G. automation parity persisted, without implying live automation change
check(
  "G-automation-parity-persisted",
  /AUTOMATION_PARITY/.test(law) &&
    /Live automation[\s\S]*not[\s\S]*performed/i.test(law),
  "AUTOMATION_PARITY clause missing",
);

// H. TASK_KIND present in handoff template
check(
  "H-task-kind-in-handoff-template",
  /TASK_KIND: MICRO_TASK_DELTA/.test(handoff),
  "TASK_KIND missing from handoff template",
);

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
console.log(JSON.stringify({ ok: failed.length === 0, passed: results.length - failed.length, failed: failed.length, total: results.length }));
process.exit(failed.length === 0 ? 0 : 1);

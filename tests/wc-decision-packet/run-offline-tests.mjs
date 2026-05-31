#!/usr/bin/env node
/**
 * Offline tests for Wc Decision Packet Telegram template formatting.
 * Node built-ins only. No network, no n8n, no Telegram send.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const workflowPath = resolve(
  repoRoot,
  "workflows/wc-decision-packet-telegram-automatic-cabled.template.json",
);
const testEventPath = resolve(
  repoRoot,
  "docs/runtime/test-events/wc-decision-packet-telegram-test-event.json",
);

const workflow = JSON.parse(readFileSync(workflowPath, "utf8"));
const testEvent = JSON.parse(readFileSync(testEventPath, "utf8"));

const buildNode = workflow.nodes.find((n) => n.name === "Build Decision Packet text");
const telegramNode = workflow.nodes.find(
  (n) => n.name === "Telegram - Send Decision Packet (CONFIGURE_IN_N8N_UI)",
);

if (!buildNode?.parameters?.jsCode) {
  console.error("FAIL: Build Decision Packet text node or jsCode not found");
  process.exit(1);
}
if (!telegramNode) {
  console.error("FAIL: Telegram node not found");
  process.exit(1);
}

const $input = { item: { json: testEvent } };
const fn = new Function("$input", buildNode.parameters.jsCode);
const result = fn($input);
const text = result?.json?.decision_packet_text;

if (typeof text !== "string") {
  console.error("FAIL: decision_packet_text missing from Build node output");
  process.exit(1);
}

const parseMode = telegramNode.parameters?.additionalFields?.parse_mode;

const assertions = [
  ["T1", text.includes("event_id:"), 'text includes literal "event_id:"'],
  ["T2", text.includes("requires_human:"), 'text includes literal "requires_human:"'],
  ["T3", text.includes("human_gate"), 'text includes literal "human_gate"'],
  [
    "T4",
    text.includes("=== TEST ONLY / TEMPLATE VALIDATION ==="),
    "banner uses === TEST ONLY ===",
  ],
  ["T5", !text.includes("***"), "text does NOT include ***"],
  ["T6", text.includes("ID: D-9999-T"), "text includes ID: D-9999-T"],
  ["T7", text.includes("Scrivi: 1 / 2 / 3"), 'text includes "Scrivi: 1 / 2 / 3"'],
  ["T8", text.includes("Cosa NON viene fatto"), "text includes Cosa NON viene fatto"],
  [
    "T9",
    parseMode === "" && parseMode !== "Markdown" && parseMode !== "MarkdownV2",
    'Telegram additionalFields.parse_mode is "" (plain text)',
  ],
];

let failed = 0;
for (const [id, ok, desc] of assertions) {
  if (ok) {
    console.log(`${id} PASS — ${desc}`);
  } else {
    console.log(`${id} FAIL — ${desc}`);
    failed++;
  }
}

if (workflow.active !== false) {
  console.log("FAIL — workflow must stay active:false");
  failed++;
}

if (failed > 0) {
  process.exit(1);
}
console.log("All Wc Decision Packet offline tests passed.");

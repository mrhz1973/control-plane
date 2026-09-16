import { readFileSync, writeFileSync } from "node:fs";
import { NORMALIZER_JSCODE, MESSAGE_BUILDER_JSCODE } from "./wf90-actionable-gate-nodes-v1.mjs";

const ARTIFACT = "workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json";
const raw = readFileSync(ARTIFACT, "utf8").replace(/^\uFEFF/, "");
const wf = JSON.parse(raw);

const NORMALIZE_NODE = "Code - Normalize LOCAL_DEV tick result";
const BUILDER_NODE = "Code - Build WF90 actionable gate message";
const TG_NODE = "Telegram - LOCAL_DEV gate notification";
const IF_SEND = "IF - WF90 send new actionable alert?";

// 1. Sync the normalizer node jsCode (additive gate metadata).
const norm = wf.nodes.find((n) => n.name === NORMALIZE_NODE);
if (!norm) throw new Error("normalizer node missing");
norm.parameters.jsCode = NORMALIZER_JSCODE;
norm.notes = "WF90_TELEGRAM_HUMAN_GATE_RELIABILITY_V1 + V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1: builds telegram_text (HTML-escaped) and additive canonical actionable_gate metadata from dispatcher operator_action_* evidence. WF90 never invents choices; partial/unknown sets degrade to informational.";

// 2. Insert the message builder node between the IF and the Telegram node.
if (!wf.nodes.some((n) => n.name === BUILDER_NODE)) {
  wf.nodes.push({
    parameters: { mode: "runOnceForEachItem", jsCode: MESSAGE_BUILDER_JSCODE },
    id: "90ld-0010-4010-8010-000000000010",
    name: BUILDER_NODE,
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [1000, -240],
    notes: "V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1: MODE A passes telegram_text through (no buttons); MODE B renders exactly the canonical operator_action_choices as inline buttons bound to gate_id + dispatcher nonce. Telegram stays an interaction surface; the dispatcher gate check endpoint is the only validator.",
  });
}

// Rewire: IF(true) -> Builder -> Telegram; Builder output feeds Telegram text/reply markup.
const conn = wf.connections;
if (!conn[IF_SEND] || !conn[IF_SEND].main) throw new Error("IF connection missing");
const ifTrue = conn[IF_SEND].main[0];
if (!ifTrue.some((c) => c.node === BUILDER_NODE)) {
  conn[IF_SEND].main[0] = [{ node: BUILDER_NODE, type: "main", index: 0 }];
}
conn[BUILDER_NODE] = { main: [[{ node: TG_NODE, type: "main", index: 0 }]] };

// 3. Telegram node: switch text source to builder output and add replyMarkup.
const tg = wf.nodes.find((n) => n.name === TG_NODE);
tg.parameters.text = `={{ $json.telegram_text }}`;
tg.parameters.replyMarkup = "inlineKeyboard";
tg.parameters.inlineKeyboard = {
  rows: [
    { row: { buttons: [
      { text: "={{ $json.reply_markup.inline_keyboard[0][0].text }}", additionalFields: { callback_data: "={{ $json.reply_markup.inline_keyboard[0][0].callback_data }}" } },
      { text: "={{ $json.reply_markup.inline_keyboard[0][1].text }}", additionalFields: { callback_data: "={{ $json.reply_markup.inline_keyboard[0][1].callback_data }}" } },
      { text: "={{ $json.reply_markup.inline_keyboard[0][2].text }}", additionalFields: { callback_data: "={{ $json.reply_markup.inline_keyboard[0][2].callback_data }}" } },
    ] } },
  ],
};
tg.notes = "V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1: text from the builder node; inlineKeyboard wired from builder output (MODE B) or suppressed by the builder returning empty markup semantics (MODE A keeps replyMarkup absent via reply_markup null handling at apply time). parse_mode HTML and credential in-memory clone rule unchanged; no decision semantics.";

// 4. purpose/notes additive record.
wf.task_ref_87 = "V4_TELEGRAM_ACTIONABLE_HUMAN_GATE_V1";
wf.purpose += " ISSUE #87: eligible HUMAN_GATE notifications may carry canonical bounded choices (operator_action_choices from the dispatcher) and render as an interactive Telegram handoff; informational gates unchanged.";

writeFileSync(ARTIFACT, JSON.stringify(wf, null, 2) + "\n");
console.log("artifact updated:", { nodes: wf.nodes.length, builder_in_connections: Boolean(conn[BUILDER_NODE]), if_true: JSON.stringify(conn[IF_SEND].main[0]) });

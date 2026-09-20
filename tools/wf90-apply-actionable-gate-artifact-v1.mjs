/**
 * Sync MODE A/B Telegram transport topology into the WF90 patch artifact.
 * Source of truth for jsCode: ./wf90-actionable-gate-nodes-v1.mjs
 *
 * Does NOT talk to n8n. Live apply clones Telegram credentials in memory.
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  MESSAGE_BUILDER_JSCODE,
  MESSAGE_BUILDER_NODE,
  NORMALIZER_JSCODE,
  TELEGRAM_INFO_NODE,
  TELEGRAM_ACTIONABLE_NODE,
  IF_MODE_B_TELEGRAM_NODE,
  PERSIST_ALERT_STATE_NODE,
  TELEGRAM_TEXT_EXPR,
  MODE_B_ACTIONABLE_EXPR,
  MODE_B_BUTTON_TEXT_EXPRS,
  MODE_B_BUTTON_CALLBACK_EXPRS,
} from "./wf90-actionable-gate-nodes-v1.mjs";

const ARTIFACT = "workflows/patches/v4-local-dev-always-on-dispatcher.gpt-web.json";
const NORMALIZE_NODE = "Code - Normalize LOCAL_DEV tick result";
const IF_SEND = "IF - WF90 send new actionable alert?";
const OLD_TG = "Telegram - LOCAL_DEV gate notification";

const raw = readFileSync(ARTIFACT, "utf8").replace(/^\uFEFF/, "");
const wf = JSON.parse(raw);

const norm = wf.nodes.find((n) => n.name === NORMALIZE_NODE);
if (!norm) throw new Error("normalizer node missing");
norm.parameters.jsCode = NORMALIZER_JSCODE;

const builder = wf.nodes.find((n) => n.name === MESSAGE_BUILDER_NODE);
if (!builder) throw new Error("message builder node missing");
builder.parameters.jsCode = MESSAGE_BUILDER_JSCODE;

const iff = wf.nodes.find((n) => n.name === IF_MODE_B_TELEGRAM_NODE);
if (!iff) throw new Error("MODE B IF node missing");
iff.parameters.conditions.conditions[0].leftValue = MODE_B_ACTIONABLE_EXPR;

const info = wf.nodes.find((n) => n.name === TELEGRAM_INFO_NODE);
if (!info) throw new Error("informational Telegram node missing");
info.parameters.text = TELEGRAM_TEXT_EXPR;
delete info.parameters.replyMarkup;
delete info.parameters.inlineKeyboard;
if (info.onError) delete info.onError;
if (info.alwaysOutputData) delete info.alwaysOutputData;

const act = wf.nodes.find((n) => n.name === TELEGRAM_ACTIONABLE_NODE);
if (!act) throw new Error("actionable Telegram node missing");
act.parameters.text = TELEGRAM_TEXT_EXPR;
act.parameters.replyMarkup = "inlineKeyboard";
act.parameters.inlineKeyboard = {
  rows: [
    {
      row: {
        buttons: MODE_B_BUTTON_TEXT_EXPRS.map((text, i) => ({
          text,
          additionalFields: { callback_data: MODE_B_BUTTON_CALLBACK_EXPRS[i] },
        })),
      },
    },
  ],
};
if (act.onError) delete act.onError;
if (act.alwaysOutputData) delete act.alwaysOutputData;

wf.nodes = wf.nodes.filter((n) => n.name !== OLD_TG);

const conn = wf.connections;
conn[IF_SEND].main[0] = [{ node: MESSAGE_BUILDER_NODE, type: "main", index: 0 }];
conn[MESSAGE_BUILDER_NODE] = {
  main: [[{ node: IF_MODE_B_TELEGRAM_NODE, type: "main", index: 0 }]],
};
conn[IF_MODE_B_TELEGRAM_NODE] = {
  main: [
    [{ node: TELEGRAM_ACTIONABLE_NODE, type: "main", index: 0 }],
    [{ node: TELEGRAM_INFO_NODE, type: "main", index: 0 }],
  ],
};
conn[TELEGRAM_ACTIONABLE_NODE] = {
  main: [[{ node: PERSIST_ALERT_STATE_NODE, type: "main", index: 0 }]],
};
conn[TELEGRAM_INFO_NODE] = {
  main: [[{ node: PERSIST_ALERT_STATE_NODE, type: "main", index: 0 }]],
};
delete conn[OLD_TG];

writeFileSync(ARTIFACT, `${JSON.stringify(wf, null, 2)}\n`);
console.log(
  JSON.stringify({
    ok: true,
    nodes: wf.nodes.length,
    info_has_replyMarkup: Object.prototype.hasOwnProperty.call(info.parameters, "replyMarkup"),
    act_replyMarkup: act.parameters.replyMarkup,
    mode_b_buttons: act.parameters.inlineKeyboard.rows[0].row.buttons.length,
  }),
);

#!/usr/bin/env node
/**
 * Live WF90 export proof (read-only): fetch the ACTIVE WF90 version from the
 * live n8n and verify the #87 shape: builder node present, telegram node text
 * from builder, parse_mode HTML, replyMarkup inlineKeyboard, credential id,
 * schedule 2min, timeout 3900000. No mutation.
 */
import { execFileSync } from "node:child_process";

const out = execFileSync("ssh", ["-o", "BatchMode=yes", "ionos-n8n-new",
  "docker exec root-n8n-1 n8n export:workflow --id=90ldaa5a-4000-8000-000000000090 --output=/tmp/wf90-live-now.json 2>/dev/null; docker exec root-n8n-1 cat /tmp/wf90-live-now.json; docker exec root-n8n-1 rm -f /tmp/wf90-live-now.json"
], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });

let wf;
try { wf = JSON.parse(out); } catch {
  const start = out.indexOf("{");
  // Export is a single-element JSON array; slice to the matching close.
  const sliced = out.slice(start).trim().replace(/\n\s*$/, "");
  try { wf = JSON.parse(sliced.endsWith("]") ? sliced : sliced + "]"); }
  catch { wf = JSON.parse(sliced.slice(0, sliced.lastIndexOf("}") + 1)); }
}
if (Array.isArray(wf)) wf = wf[0];
const names = new Set(wf.nodes.map((n) => n.name));
const builder = wf.nodes.find((n) => n.name === "Code - Build WF90 actionable gate message");
const tg = wf.nodes.find((n) => n.name === "Telegram - LOCAL_DEV gate notification");
const sched = wf.nodes.find((n) => n.name === "Schedule Trigger - LOCAL_DEV tick");
const http = wf.nodes.find((n) => n.type === "n8n-nodes-base.httpRequest");
const conn = wf.connections;
const ifSend = conn["IF - WF90 send new actionable alert?"];

const proof = {
  workflow_id: wf.id,
  active: wf.active,
  versionId: wf.versionId,
  nodes_count: wf.nodes.length,
  builder_node_present: names.has("Code - Build WF90 actionable gate message"),
  builder_mode: builder?.parameters?.mode ?? null,
  telegram_text_from_builder: tg?.parameters?.text === "={{ $json.telegram_text }}",
  telegram_parse_mode: tg?.parameters?.additionalFields?.parse_mode ?? null,
  telegram_replyMarkup: tg?.parameters?.replyMarkup ?? null,
  telegram_inlineKeyboard_wired: Boolean(tg?.parameters?.inlineKeyboard?.rows?.[0]?.row?.buttons?.length === 3),
  telegram_credential_id: tg?.credentials?.telegramApi?.id ?? null,
  telegram_credential_name: tg?.credentials?.telegramApi?.name ?? null,
  schedule_minutes: sched?.parameters?.rule?.interval?.[0]?.minutesInterval ?? null,
  http_timeout: http?.parameters?.options?.timeout ?? null,
  if_true_goes_to_builder: JSON.stringify(ifSend?.main?.[0] ?? []).includes("Build WF90 actionable gate message"),
  builder_goes_to_telegram: JSON.stringify(conn["Code - Build WF90 actionable gate message"]?.main?.[0] ?? []).includes("Telegram - LOCAL_DEV gate notification"),
  dedupe_state_key_present: wf.nodes.some((n) => n.type === "n8n-nodes-base.code" && (n.parameters?.jsCode ?? "").includes("wf90:active_alert_signature")),
  normalizer_has_actionable_gate: wf.nodes.find((n) => n.name === "Code - Normalize LOCAL_DEV tick result")?.parameters?.jsCode.includes("actionable_gate") ?? false,
  chat_id_placeholder: tg?.parameters?.chatId ?? null,
};
console.log(JSON.stringify(proof, null, 1));

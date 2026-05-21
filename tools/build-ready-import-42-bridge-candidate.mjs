#!/usr/bin/env node
/**
 * PM-21 — Build READY_IMPORT_42 from READY_IMPORT_40 + classifier bridge branch.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(
  ROOT,
  "workflows/exports/READY_IMPORT_40-control-plane-active-with-credentials.json"
);
const DST = resolve(
  ROOT,
  "workflows/exports/READY_IMPORT_42-classifier-bridge-candidate.json"
);

const CANDIDATE_NAME =
  "42 - CP v4 multirepo + classifier bridge - CANDIDATE OFF";
const CHAT_ID = "472599368";
const FORBIDDEN = [
  "__REDACTED_N8N_CREDENTIAL_ID__",
  "__CONFIGURE_CHAT_ID_IN_N8N_UI__",
  /Bearer\s/i,
  /Authorization/i,
  /api\.telegram\.org\/bot/i,
  /sk-[A-Za-z0-9]/,
];

const CLASSIFIER_JS = `const j=$json;
const commit=j.commitSha||j.currentSha||'';
const short=j.shortSha||(commit?commit.slice(0,7):'');
return {json:{
  schema_version:'pm17-classifier-v1',
  source:'n8n-deterministic-code',
  task_type:'docs-only',
  risk:'low',
  route:'cursor-control-plane',
  approval_required:false,
  allowed_next_step:'prepare handoff preview',
  blocked_reason:null,
  notes:['PM-21 deterministic classifier candidate','No Ollama runtime used in this candidate'],
  input:{
    repo:j.repo||j.ownerRepo||j.sourceRepo||'',
    plan_path:j.planPath||j.plan_path||j.path||j.filename||'',
    commit,
    short_sha:short
  }
}};`;

const BRIDGE_JS = `const c=$json;
const low=c.risk==='low'&&!c.approval_required&&c.route==='cursor-control-plane';
if(low){return {json:{
  schema_version:'pm19-implementer-bridge-result-v1',
  source:'n8n-pm21-candidate',
  status:'dry_run_pass',
  worker:'mock-worker',
  would_send_to_worker:true,
  would_require_telegram_gate:false,
  blocked_reason:null,
  classifier_route:c.route,
  classifier_risk:c.risk,
  classifier:c,
  mock_worker_action:'prepare handoff preview only — no Codex execution',
  notes:['PM-21 candidate bridge branch','No real worker invoked']
}};}
return {json:{
  schema_version:'pm19-implementer-bridge-result-v1',
  source:'n8n-pm21-candidate',
  status:'gate_required',
  worker:'mock-worker',
  would_send_to_worker:false,
  would_require_telegram_gate:true,
  blocked_reason:c.blocked_reason||'gate required by classifier',
  classifier_route:c.route,
  classifier_risk:c.risk,
  classifier:c,
  notes:['PM-21 candidate bridge branch','Telegram gate required']
}};`;

const FORMAT_JS = `const bridge=$json;
const c=bridge.classifier||{};
const inp=c.input||{};
const text=[
'CONTROL PLANE PM-21 bridge decision',
\`Repo: \${inp.repo||''}\`,
\`Plan: \${inp.plan_path||''}\`,
\`Commit: \${inp.short_sha||''}\`,
\`Risk: \${c.risk}\`,
\`Route: \${c.route}\`,
\`Approval required: \${c.approval_required?'yes':'no'}\`,
\`Bridge result: \${bridge.status}\`,
\`Worker: \${bridge.worker}\`,
'Action: preview only, no Codex execution'
].join('\\n');
return {json:{text,bridge,classifier:c}};`;

function getTelegramCred(nodes) {
  const tg = nodes.find((n) => n.type === "n8n-nodes-base.telegram");
  const cred = tg?.credentials?.telegramApi;
  if (!cred?.id || !cred?.name) throw new Error("Telegram credential missing in source");
  return { id: cred.id, name: cred.name };
}

function validate(wf, text) {
  if (wf.name !== CANDIDATE_NAME) throw new Error("wrong name");
  if (wf.active !== false) throw new Error("active must be false");
  const pm21 = wf.nodes.filter((n) => n.name?.includes("PM21"));
  if (pm21.length !== 4) throw new Error(`expected 4 PM21 nodes, got ${pm21.length}`);
  if (!wf.nodes.some((n) => n.name === "Telegram - Send PM21 bridge summary"))
    throw new Error("missing PM21 Telegram node");
  for (const n of wf.nodes) {
    if (n.type === "n8n-nodes-base.telegram") {
      if (n.parameters?.chatId !== CHAT_ID) throw new Error(`bad chatId on ${n.name}`);
      const c = n.credentials?.telegramApi;
      if (!c?.id || !c?.name) throw new Error(`bad telegram cred on ${n.name}`);
    }
    if (n.credentials?.githubApi) {
      const g = n.credentials.githubApi;
      if (!g?.id || !g?.name) throw new Error(`bad github cred on ${n.name}`);
    }
  }
  for (const n of wf.nodes.filter((x) => x.name?.includes("PM21"))) {
    const code = n.parameters?.jsCode || "";
    if (code.includes(".first()") || code.includes("$input.first"))
      throw new Error(`PM21 node ${n.name} must not use .first()`);
  }
  for (const pat of FORBIDDEN) {
    if (typeof pat === "string" && text.includes(pat))
      throw new Error(`forbidden: ${pat}`);
    if (pat.test?.(text)) throw new Error(`forbidden pattern: ${pat}`);
  }
}

function main() {
  const raw = readFileSync(SRC, "utf8");
  const wf = JSON.parse(raw);
  const tgCred = getTelegramCred(wf.nodes);

  delete wf.id;
  delete wf.versionId;
  delete wf.meta;
  wf.name = CANDIDATE_NAME;
  wf.active = false;

  const ids = {
    classifier: randomUUID(),
    bridge: randomUUID(),
    format: randomUUID(),
    telegram: randomUUID(),
  };

  const newNodes = [
    {
      parameters: { mode: "runOnceForEachItem", jsCode: CLASSIFIER_JS },
      id: ids.classifier,
      name: "Code - PM21 classifier decision",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [240, 1000],
    },
    {
      parameters: { mode: "runOnceForEachItem", jsCode: BRIDGE_JS },
      id: ids.bridge,
      name: "Code - PM21 bridge result",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [480, 1000],
    },
    {
      parameters: { mode: "runOnceForEachItem", jsCode: FORMAT_JS },
      id: ids.format,
      name: "Code - PM21 format Telegram bridge summary",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [720, 1000],
    },
    {
      parameters: {
        chatId: CHAT_ID,
        text: "={{ $json.text }}",
        additionalFields: {},
      },
      id: ids.telegram,
      name: "Telegram - Send PM21 bridge summary",
      type: "n8n-nodes-base.telegram",
      typeVersion: 1.2,
      position: [960, 1000],
      credentials: {
        telegramApi: { id: tgCred.id, name: tgCred.name },
      },
    },
  ];

  wf.nodes.push(...newNodes);

  const ifConn = wf.connections["IF - plan_detected?"];
  if (!ifConn?.main?.[0]) throw new Error("IF plan_detected true branch missing");
  ifConn.main[0].push({
    node: "Code - PM21 classifier decision",
    type: "main",
    index: 0,
  });

  wf.connections["Code - PM21 classifier decision"] = {
    main: [[{ node: "Code - PM21 bridge result", type: "main", index: 0 }]],
  };
  wf.connections["Code - PM21 bridge result"] = {
    main: [
      [{ node: "Code - PM21 format Telegram bridge summary", type: "main", index: 0 }],
    ],
  };
  wf.connections["Code - PM21 format Telegram bridge summary"] = {
    main: [[{ node: "Telegram - Send PM21 bridge summary", type: "main", index: 0 }]],
  };
  wf.connections["Telegram - Send PM21 bridge summary"] = { main: [[]] };

  const out = JSON.stringify(wf, null, 2) + "\n";
  validate(wf, out);
  writeFileSync(DST, out, "utf8");

  const tgCount = wf.nodes.filter((n) => n.type === "n8n-nodes-base.telegram").length;
  const ghCount = wf.nodes.filter((n) => n.credentials?.githubApi).length;
  console.log(`written ${DST}`);
  console.log(`nodes: ${wf.nodes.length} (+4 PM21)`);
  console.log(`telegram nodes: ${tgCount}, github cred nodes: ${ghCount}`);
  console.log("validation: PASS");
}

main();

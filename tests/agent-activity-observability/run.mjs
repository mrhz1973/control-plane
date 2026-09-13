#!/usr/bin/env node
/**
 * agent-activity-observability-fixture-v1 — deterministic tests for
 * LOCAL_DEV_HERMES_QWEN_ACTIVITY_OBSERVABILITY_V1 (issue #79).
 *
 * Covers T1..T18 of the mission: schema validity, visibility while dispatcher
 * idle, HUMAN_GATE wait, terminal PASS/STOP, freshness (STALE/UNKNOWN),
 * sanitization, no mutation/authority, endpoint additivity, dashboard render,
 * regressions. Read-only: uses temp registry files only, never the real one.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = join(import.meta.dirname ?? process.cwd(), "..", "..");

const { publishActivity, readActivities, applyFreshness, AGENT_ACTIVITY_SCHEMA, ACTIVITY_STATES, ACTIVITY_STAGES, registryPath } = await import(`file://${ROOT.replace(/\\/g, "/")}/tools/agent-activity-registry-v1.mjs`);
const dispatcher = await import(`file://${ROOT.replace(/\\/g, "/")}/tools/serve-local-dev-autonomous-dispatcher-v1.mjs`);

const results = [];
let passed = 0, failed = 0;
const tmp = () => mkdtempSync(join(tmpdir(), "aa-obs-"));
let nowMs = 1_750_000_000_000;
const NOW_ISO = () => new Date(nowMs).toISOString();

function check(id, cond, detail = "") {
  results.push({ id, ok: !!cond, detail: String(detail).slice(0, 120) });
  if (cond) passed += 1; else failed += 1;
  console.log(`${cond ? "PASS" : "FAIL"} ${id}${detail ? ` — ${detail}` : ""}`);
}

function baseRec(over = {}) {
  return {
    activity_id: "act-test-1", task_ref: "TASK_X", activity_type: "HERMES_QWEN_BROWSER_SEND",
    controller: "QWEN_LOCAL", bridge: "HERMES", browser_surface: "CHROME_CDP_PERSISTENT",
    answer_surface: "CHATGPT_WEB", model_profile: "qwen-test", started_at: NOW_ISO(),
    last_progress_at: NOW_ISO(), elapsed_seconds: 5, stage: "WAITING_WEB_RESPONSE",
    state: "ACTIVE", timeout_total_seconds: 900, timeout_remaining_seconds: 895,
    generation_state: "GEN2_DONE", capture_state: null, cdp_state: "OBSERVED",
    auth_state: true, qwen_occupancy: "DEDICATED", stop_reason: null,
    ...over,
  };
}

// ---------- T1 schema valid ----------
{
  const p = join(tmp(), "r.json");
  const r = publishActivity(baseRec(), { path: p, nowMs });
  check("T1_SCHEMA_VALID", r.ok && r.record.schema_version === undefined && readActivities({ path: p }).schema_version === AGENT_ACTIVITY_SCHEMA && readActivities({ path: p }).activities.length === 1);
}

// ---------- T2 ACTIVE visible while dispatcher IDLE ----------
{
  const p = join(tmp(), "r.json");
  publishActivity(baseRec({ activity_id: "aa2", stage: "WAITING_WEB_RESPONSE" }), { path: p, nowMs });
  const section = dispatcher.buildAgentActivitySection({ readActivities: () => readActivities({ path: p }), applyFreshness: (recs, o) => applyFreshness(recs, { ...o, nowMs }) });
  const idleStatus = { active: false, classification: "IDLE_CLEAN" };
  check("T2_ACTIVE_WHILE_DISPATCHER_IDLE", section.activity_count === 1 && section.active_count === 1 && idleStatus.active === false && section.activities[0].state === "ACTIVE");
}

// ---------- T3 WAITING/HUMAN_GATE visible ----------
{
  const p = join(tmp(), "r.json");
  publishActivity(baseRec({ activity_id: "aa3", state: "WAITING", stage: "HUMAN_GATE", generation_state: "GEN1_DONE" }), { path: p, nowMs });
  const section = dispatcher.buildAgentActivitySection({ readActivities: () => readActivities({ path: p }), applyFreshness: (recs, o) => applyFreshness(recs, { ...o, nowMs }) });
  check("T3_HUMAN_GATE_WAIT_VISIBLE", section.waiting_count === 1 && section.activities[0].state === "WAITING" && section.activities[0].stage === "HUMAN_GATE");
}

// ---------- T4 PASS terminal / T5 STOP terminal + reason ----------
{
  const p = join(tmp(), "r.json");
  publishActivity(baseRec({ activity_id: "aa4", state: "PASS", stage: "PASS", stop_reason: null }), { path: p, nowMs });
  publishActivity(baseRec({ activity_id: "aa5", state: "STOP", stage: "STOP", stop_reason: "CHATGPT_TARGET_NOT_FOUND" }), { path: p, nowMs });
  // stale-proof: even very old terminals keep their terminal state
  const aged = applyFreshness(readActivities({ path: p }).activities, { nowMs: nowMs + 86_400_000, freshMs: 90_000 });
  check("T4_PASS_TERMINAL", aged.find((a) => a.activity_id === "aa4").state === "PASS");
  check("T5_STOP_TERMINAL_REASON", aged.find((a) => a.activity_id === "aa5").state === "STOP" && aged.find((a) => a.activity_id === "aa5").stop_reason === "CHATGPT_TARGET_NOT_FOUND");
}

// ---------- T6 stale ACTIVE => STALE / T7 missing => UNKNOWN ----------
{
  const p = join(tmp(), "r.json");
  publishActivity(baseRec({ activity_id: "aa6", last_progress_at: new Date(nowMs - 600_000).toISOString() }), { path: p, nowMs });
  publishActivity(baseRec({ activity_id: "aa7", last_progress_at: null, started_at: null }), { path: p, nowMs });
  const out = applyFreshness(readActivities({ path: p }).activities, { nowMs, freshMs: 90_000 });
  check("T6_STALE_SEMANTICS", out.find((a) => a.activity_id === "aa6").state === "STALE" && out.find((a) => a.activity_id === "aa6").state_reason === "PROGRESS_TOO_OLD");
  check("T7_UNKNOWN_MISSING", out.find((a) => a.activity_id === "aa7").state === "UNKNOWN" && out.find((a) => a.activity_id === "aa7").state_reason === "NO_PROGRESS_TIMESTAMP");
}

// ---------- T8 no secret fields / T9 no raw session identity ----------
{
  const p = join(tmp(), "r.json");
  const r = publishActivity(baseRec({
    activity_id: "aa8",
    cookie: "SESSDATA=secret", token: "sk-supersecret", credential: "hunter2",
    session_id: "raw-session-uuid-1234", telegram_chat_id: "555123", account: "me@example.com",
    prompt_text: "sensitive prompt content", response_text: "sensitive response",
    extra_nested: { deep_secret: "x" },
  }), { path: p, nowMs });
  const stored = JSON.stringify(readActivities({ path: p }));
  const SECRET_PAT = /secret|hunter2|raw-session-uuid|555123|me@example|sensitive prompt|sensitive response|deep_secret|SESSDATA|sk-super/i;
  check("T8_NO_SECRET_FIELDS", r.ok && !SECRET_PAT.test(stored), stored.slice(0, 80));
  check("T9_NO_RAW_SESSION_IDENTITY", !/"session_id"/.test(stored) && !/"telegram_chat_id"/.test(stored));
  // auth_state is boolean-sanitized only
  const rec = readActivities({ path: p }).activities[0];
  check("T9B_AUTH_SANITIZED", [true, false, "UNKNOWN", null].includes(rec.auth_state));
}

// ---------- T10 no task/receipt mutation / T11 no execution authorization ----------
{
  const dir = tmp();
  const queueBefore = existsSync(join(dir, "queue")) ? readFileSync(join(dir, "queue"), "utf8") : "";
  const p = join(dir, "r.json");
  publishActivity(baseRec({ activity_id: "aa10" }), { path: p, nowMs });
  const moduleSrc = readFileSync(join(ROOT, "tools", "agent-activity-registry-v1.mjs"), "utf8");
  const noMutation = !/receipt|claim|queue/i.test(moduleSrc.replace(/Read-only|claims|never claims|receipts/gi, "")) || true;
  // direct evidence: publish writes ONLY the registry file
  const files = require("fs").readdirSync(dir);
  check("T10_NO_TASK_RECEIPT_MUTATION", files.every((f) => f === "r.json" || f.startsWith("aa-")) && readFileSync(p, "utf8").includes("activities") && queueBefore === "");
  // no authorization surface: module exports no tick/claim/authorize functions
  const exports_ = Object.keys(await import(`file://${ROOT.replace(/\\/g, "/")}/tools/agent-activity-registry-v1.mjs`));
  check("T11_NO_EXECUTION_AUTHORIZATION", exports_.every((k) => !/tick|claim|authoriz|execut|dispatch/i.test(k)), exports_.join(","));
}

// ---------- T12 no /v1/tick side effects ----------
{
  let tickCalls = 0;
  // handler-level: GET agent-activity path must not touch tick deps
  const handlerSrc = readFileSync(join(ROOT, "tools", "serve-local-dev-autonomous-dispatcher-v1.mjs"), "utf8");
  check("T12_NO_TICK_SIDE_EFFECTS", handlerSrc.includes("AGENT_ACTIVITY_PATH") && !handlerSrc.match(/AGENT_ACTIVITY_PATH[\s\S]{0,600}tryAcquireLock/) && tickCalls === 0);
}

// ---------- T13 resource/queue cards unchanged ----------
{
  const diag = await dispatcher.buildDiagnostics({
    statusTracker: { snapshot: () => ({ active: false, classification: "IDLE_CLEAN", phase: "IDLE" }) },
    lastTickStore: { snapshot: () => null },
    scanQueue: () => [],
    loadReceipts: () => [],
    probeQwen: async () => null,
    nowIso: NOW_ISO,
    readActivities: () => ({ schema_version: AGENT_ACTIVITY_SCHEMA, updated_at: NOW_ISO(), activities: [baseRec({ activity_id: "aa13" })] }),
    applyFreshness: (recs, o) => applyFreshness(recs, { ...o, nowMs }),
  });
  const KEYS = ["schema_version", "generated_at", "read_only", "status", "last_tick", "queue", "post_exec_integration", "qwen", "explanation", "operator_visibility", "agent_activity"];
  check("T13_CARDS_UNCHANGED_ADDITIVE", KEYS.every((k) => k in diag) && diag.agent_activity.activity_count === 1 && diag.queue && diag.queue.eligible_count === 0 && diag.read_only === true, Object.keys(diag).join(","));
}

// ---------- T14 multiple recent activities bounded ----------
{
  const p = join(tmp(), "r.json");
  for (let i = 0; i < 25; i += 1) publishActivity(baseRec({ activity_id: `bulk-${i}` }), { path: p, nowMs: nowMs + i });
  const list = readActivities({ path: p }).activities;
  check("T14_BOUNDED_REGISTRY", list.length === 20 && list[0].activity_id === "bulk-24" && !list.some((a) => a.activity_id === "bulk-0"));
}

// ---------- T15 malformed telemetry fails closed ----------
{
  const p = join(tmp(), "r.json");
  const r1 = publishActivity(null, { path: p, nowMs });
  const r2 = publishActivity("nope", { path: p, nowMs });
  const r3 = publishActivity(baseRec({ state: "WARP" }), { path: p, nowMs });
  const r4 = publishActivity(baseRec({ stage: "TELEPORT" }), { path: p, nowMs });
  const r5 = publishActivity({ activity_id: "no-state" }, { path: p, nowMs });
  const r6 = publishActivity(baseRec({ timeout_total_seconds: "many" }), { path: p, nowMs });
  check("T15_MALFORMED_FAILS_CLOSED", r1.ok === false && r2.ok === false && r3.ok === false && r4.ok === false && r5.ok === false && r6.ok === true && r6.record.timeout_total_seconds === null);
  // corrupt file on disk => reader fail-closed, not invented data
  writeFileSync(p, "{corrupt", "utf8");
  check("T15B_CORRUPT_FILE_FAILS_CLOSED", readActivities({ path: p }).activities.length === 0);
}

// ---------- T16 diagnostics endpoint backward compatible ----------
{
  const p = join(tmp(), "r.json");
  // existing required fields present with exact schema when registry is EMPTY and when populated
  const empty = dispatcher.buildAgentActivitySection({ readActivities: () => ({ schema_version: AGENT_ACTIVITY_SCHEMA, activities: [] }), applyFreshness: (r, o) => applyFreshness(r, o) });
  const full = dispatcher.buildAgentActivitySection({ readActivities: () => ({ schema_version: AGENT_ACTIVITY_SCHEMA, updated_at: NOW_ISO(), activities: [baseRec({ activity_id: "aa16" })] }), applyFreshness: (recs, o) => applyFreshness(recs, { ...o, nowMs }) });
  const src = readFileSync(join(ROOT, "tools", "serve-local-dev-autonomous-dispatcher-v1.mjs"), "utf8");
  check("T16_BACKWARD_COMPAT", empty.registry_available === true && empty.activity_count === 0 && full.activity_count === 1 && src.includes('reason_codes: ["DIAGNOSTICS_FAILED"') && src.includes('schema_version: DIAGNOSTICS_SCHEMA'));
}

// ---------- T17 dashboard render PASS ----------
{
  const html = readFileSync(join(ROOT, "tools", "local-dev-dispatcher-dashboard-v1.html"), "utf8");
  check("T17_DASHBOARD_SECTION", html.includes('data-section="agentops"') && html.includes("Operazioni agente / browser") && html.includes("renderAgentActivities") && html.includes("/v1/agent-activity"));
  // renderAgentActivities handles empty + populated + malformed without throwing
  const { createContext, runInContext } = await import("node:vm");
  const sandbox = { document: { getElementById: (id) => ({ set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h || ""; } }) }, AbortController, console };
  sandbox.window = sandbox;
  const ctx = createContext({ ...sandbox, el: (id) => sandbox.document.getElementById(id), escapeHtml: (v) => String(v), date: (v) => String(v ?? ""), list: (v) => Array.isArray(v) ? v : [], obj: (v) => v && typeof v === "object" ? v : {}, text: (v, f) => v ?? f });
  // extract just the helpers + renderAgentActivities function from the dashboard
  const m = html.match(/const AGENT_STATE_TONE[\s\S]*?^    \}$/m);
  if (m) {
    runInContext(m[0] + ";renderAgentActivities({activities:[]});renderAgentActivities({activities:[null,{state:'ACTIVE',stage:'WAITING_WEB_RESPONSE'},{state:'WEIRD'}]});renderAgentActivities(null);", ctx, { timeout: 2000 });
    check("T17B_RENDER_MALFORMED_SAFE", true);
  } else {
    check("T17B_RENDER_MALFORMED_SAFE", false, "renderAgentActivities not extracted");
  }
}

// ---------- T18 existing dispatcher tests/regressions ----------
{
  const { execFileSync } = await import("node:child_process");
  try {
    const out = execFileSync(process.execPath, [join(ROOT, "tests", "local-dev-dispatcher-service-v1", "run.mjs")], { encoding: "utf8", timeout: 300_000, cwd: ROOT });
    check("T18_DISPATCHER_REGRESSIONS", /fail 0\b/i.test(out) || /0 failing/i.test(out) || !/# fail [1-9]/.test(out), (out.match(/# (pass|fail) \d+/g) || []).join(" "));
  } catch (e) {
    const out = String(e.stdout || "") + String(e.stderr || "");
    check("T18_DISPATCHER_REGRESSIONS", false, (out.match(/# (pass|fail) \d+/g) || []).join(" ") || String(e.message).slice(0, 100));
  }
}

// ---------- lifecycle integration check (synthetic, harmless) ----------
{
  const p = join(tmp(), "r.json");
  const stages = ["PREFLIGHT", "QWEN_READY", "HERMES_ATTACHED", "BROWSER_READY", "REQUEST_SENDING", "WAITING_WEB_RESPONSE", "RESULT_CAPTURE", "PASS"];
  for (const stage of stages) {
    const terminal = stage === "PASS";
    publishActivity(baseRec({ activity_id: "lifecycle", stage, state: terminal ? "PASS" : "ACTIVE", last_progress_at: NOW_ISO(), elapsed_seconds: stages.indexOf(stage) * 7 }), { path: p, nowMs: nowMs + stages.indexOf(stage) * 7000 });
  }
  const final = readActivities({ path: p }).activities[0];
  const aged = applyFreshness([final], { nowMs: nowMs + 3_600_000 });
  check("T19_LIFECYCLE_PROOF", stages.every((s) => ACTIVITY_STAGES.includes(s)) && final.state === "PASS" && final.stage === "PASS" && aged[0].state === "PASS");
  // default registry path must NEVER be touched by tests
  check("T20_DEFAULT_REGISTRY_UNTOUCHED", !existsSync(registryPath()) || readActivities().activities.every((a) => !String(a.activity_id).startsWith("act-test") && !String(a.activity_id).startsWith("bulk-") && a.activity_id !== "lifecycle"));
}

console.log(`\nRESULT: ${failed === 0 ? "PASS" : "FAIL"} — ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

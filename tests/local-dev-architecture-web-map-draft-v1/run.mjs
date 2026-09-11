import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ARCHITECTURE_PATH,
  DASHBOARD_PATHS,
  handleTickRequest,
} from "../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs";

const root = resolve(process.cwd());
const mapFile = resolve(root, "tools/local-dev-dispatcher-architecture-map-v1.html");
const dashboardFile = resolve(root, "tools/local-dev-dispatcher-dashboard-v1.html");
const html = readFileSync(mapFile, "utf8");
const dashboard = readFileSync(dashboardFile, "utf8");
let passed = 0;
const failures = [];

function mockReq(method, url) {
  return { method, url, on() {} };
}

function mockRes() {
  return {
    status: null,
    headers: null,
    body: "",
    writeHead(status, headers) { this.status = status; this.headers = headers; },
    end(body = "") { this.body += body; },
  };
}

async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    failures.push(name);
    process.stdout.write(`FAIL ${name}: ${error?.message || error}\n`);
  }
}

await check("GET /architecture 200 and read-only", async () => {
  const res = mockRes();
  await handleTickRequest(mockReq("GET", ARCHITECTURE_PATH), res, { architectureHtml: html });
  assert.equal(res.status, 200);
  assert.match(res.headers["Content-Type"], /text\/html/);
  assert.match(res.body, /Control Plane/);
  const post = mockRes();
  await handleTickRequest(mockReq("POST", ARCHITECTURE_PATH), post, { architectureHtml: html });
  assert.equal(post.status, 405);
});

await check("dashboard links to the architecture map", () => {
  assert.match(dashboard, /href="\/architecture"[^>]*>🗺 Mappa Control Plane</);
});

await check("page identity and required sections", () => {
  for (const text of ["Control Plane", "Hermes", "HERMES", "ORCHESTRATORE / BRIDGE", "Qwen", "MODELLO LOCALE", "OpenCode", "HARNESS / ESECUTORE LOCALE", "Cursor", "non è un modello", "Codex subscription", "ChatGPT Web", "GitHub", "SOURCE OF TRUTH", "VPS", "Macchina locale", "Tailscale", "TRASPORTO PRIVATO", "noVNC", "01", "10", "BACKLOG", "NEXT TASK", "PASS", "STOP", "RETRY", "HUMAN GATE", "MODELLO", "HARNESS", "CONTROLLER / LANE", "ORCHESTRATORE", "TOOL", "INFRASTRUTTURA", "AUTHORITY", "OSSERVABILITÀ"]) {
    assert.match(html, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), text);
  }
});

await check("roles and route are explicit", () => {
  assert.match(html, /Codex subscription[\s\S]*?distinto da ChatGPT Web/);
  assert.match(html, /CONTROLLER SCELTO[\s\S]*?Qwen \/ Codex \/ GLM[\s\S]*?HERMES[\s\S]*?Tool · MCP · governed CDP[\s\S]*?Chrome[\s\S]*?ChatGPT Web/);
  assert.match(html, /ChatGPT App \/ Web[\s\S]*?Non è una pseudo-API/);
  assert.doesNotMatch(html, /data-resource=["']chatgpt_web["']/i);
  assert.doesNotMatch(html, /ChatGPT Web[\s\S]{0,180}quota/i);
});

await check("details expose the component evidence fields", () => {
  for (const field of ["FUNCTION", "REAL COMPONENT", "PROGRAM / SERVICE", "WHERE IT RUNS", "MODEL / HARNESS", "AUTHORITY", "CURRENT STATUS"]) {
    assert.ok((html.match(new RegExp(`<dt>${field}<\\/dt>`, "g")) || []).length >= 3, field);
  }
  for (const state of ["QUALIFICATO", "PARZIALE", "NON OSSERVATO", "NON ATTIVO", "OPEN"]) assert.match(html, new RegExp(state));
});

await check("static page has bounded interaction and responsive layout", () => {
  assert.match(html, /<details\b/);
  assert.match(html, /<meta name="viewport"/);
  assert.match(html, /@media\(max-width:1180px\)/);
  assert.match(html, /@media\(max-width:760px\)/);
  assert.match(html, /grid-template-columns:1fr/);
  assert.equal((html.match(/<script\b/g) || []).length, 1);
  assert.doesNotMatch(html, /<script\b[^>]+src=/i);
  assert.doesNotMatch(html, /<(?:link|img|iframe)\b/i);
});

await check("no public browser or sensitive-state surface", () => {
  assert.match(html, /https:\/\/github\.com\/mrhz1973\/control-plane/);
  assert.doesNotMatch(html, /href="[^"]*(?:novnc|9222|6080|cdp)/i);
  assert.doesNotMatch(html, /https?:\/\/[^"' ]*(?:novnc|9222|6080|cdp)/i);
  assert.doesNotMatch(html, /\b(?:api[_ -]?key|cookie|password|secret|bearer|session storage|raw state)\b/i);
});

await check("dashboard remains the operational console", () => {
  assert.ok(DASHBOARD_PATHS.includes("/dashboard"));
  assert.match(dashboard, /Local Dev Dispatcher/);
  assert.match(dashboard, /GET \/v1\/status/);
  assert.doesNotMatch(dashboard, /data-resource=["']chatgpt_web["']/i);
});

process.stdout.write(`\n${passed} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ARCHITECTURE_PATH, handleTickRequest } from "../../tools/serve-local-dev-autonomous-dispatcher-v1.mjs";

const root = resolve(process.cwd());
const mapFile = resolve(root, "tools/local-dev-dispatcher-architecture-map-v1.html");
const html = await readFile(mapFile, "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1] || "";
let passed = 0;

async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

function mockReq(method, url = ARCHITECTURE_PATH) {
  return { method, url, headers: { host: "127.0.0.1:18793" }, on() {} };
}

function responseMock() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    writeHead(statusCode, headers) { this.statusCode = statusCode; this.headers = headers; },
    end(body = "") { this.body += body; }
  };
}

await check("/architecture serves the interactive page read-only", async () => {
  const response = responseMock();
  await handleTickRequest(mockReq("GET"), response, { architectureHtml: html });
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /interactive infographic|La città/i);
  const post = responseMock();
  await handleTickRequest(mockReq("POST"), post, { architectureHtml: html });
  assert.equal(post.statusCode, 405);
});

await check("component inspector has role filters and bounded facts", () => {
  assert.match(html, /id="component-inspector"/);
  assert.match(html, /id="component-list"/);
  for (const role of ["MODELLO", "HARNESS", "CONTROLLER / LANE", "ORCHESTRATORE", "TOOL", "INFRASTRUTTURA", "AUTHORITY", "HUMAN GATE", "OSSERVABILITÀ"]) {
    assert.match(html, new RegExp(`data-role-filter="${role.replace("/", "\\/")}"`));
  }
  for (const field of ["FUNZIONE", "COMPONENTE REALE", "PROGRAMMA / SERVIZIO", "DOVE GIRA", "MODELLO / HARNESS", "AUTHORITY", "STATO ATTUALE"]) {
    assert.match(html, new RegExp(field));
  }
  assert.match(html, /Seleziona un quartiere per aprire/);
});

await check("route explorer covers governed paths", () => {
  assert.match(html, /id="route-select"/);
  for (const route of ["cursor", "local-qwen", "codex", "hermes", "n8n"]) assert.match(html, new RegExp(`value="${route}"`));
  assert.match(html, /id="route-explorer-view"/);
  assert.match(script, /const ROUTES = Object\.freeze/);
  assert.match(script, /highlightRoute/);
});

await check("current-state overlay is GET-only and bounded", () => {
  assert.match(html, /id="state-overlay" hidden/);
  assert.match(html, /AVAILABLE ≠ ACTIVE/);
  assert.match(html, /CHAIN_OF_THOUGHT_DISPLAY=NO/);
  assert.match(script, /const READ_ONLY_PATHS = Object\.freeze\(\["\/v1\/status", "\/v1\/diagnostics", "\/v1\/resources"\]\)/);
  assert.match(script, /fetch\(path, \{method:"GET"/);
  assert.doesNotMatch(script, /\/v1\/tick/);
  assert.doesNotMatch(script, /\b(?:POST|PUT|PATCH|DELETE)\b/);
  assert.match(script, /const allObserved = results\.every/);
});

await check("task flow is keyboard-addressable and resettable", () => {
  for (const step of ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]) assert.match(html, new RegExp(`<b>${step}<\\/b>`));
  assert.match(html, /id="flow-explainer"/);
  assert.match(script, /event\.key === "Enter"/);
  assert.match(script, /function resetView\(\)/);
  assert.match(html, /id="reset-view"/);
});

await check("no external framework or sensitive browser surface", () => {
  assert.doesNotMatch(html, /<(?:link|img|iframe)\b/i);
  assert.doesNotMatch(html, /<script\b[^>]+src=/i);
  assert.doesNotMatch(html, /(?:api[_ -]?key|cookie|password|bearer|session storage|raw state)/i);
  assert.match(html, /RAW_BROWSER_CDP_EXPOSED=NO/);
});

console.log(`\n${passed} passed, ${6 - passed} failed`);
if (passed !== 6) process.exitCode = 1;

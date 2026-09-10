#!/usr/bin/env node
/** Focused static contract tests for Italian operator-visible dashboard labels. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const dashboardPath = resolve(root, "tools/local-dev-dispatcher-dashboard-v1.html");
const dashboard = readFileSync(dashboardPath, "utf8");

const visibleStateLabels = {
  AVAILABLE: "Disponibile",
  UNAVAILABLE: "Non disponibile",
  UNKNOWN: "Sconosciuto",
  NOT_OBSERVED: "Non osservato",
  OBSERVED: "Osservato",
  UNVERIFIED: "Non verificato",
  ACTIVE: "Attivo",
  IDLE: "Inattivo",
  BLOCKED: "Bloccato",
  OFFLINE: "Offline",
  STALE: "Dati non aggiornati",
  DEGRADED: "Degradato",
  READY: "Pronto",
  WAITING: "In attesa",
  REAL_FAILURE: "Guasto verificato",
  LOADED: "Caricato",
  UNLOADED: "Non caricato",
  LOADING: "Caricamento",
  ERROR: "Errore",
  CONNECTED: "Connesso",
  DISCONNECTED: "Disconnesso",
  REACHABLE: "Raggiungibile",
  UNREACHABLE: "Non raggiungibile",
  PREFILL_ONLY: "Solo precompilazione",
  PARTIAL_NOT_OBSERVED: "Parzialmente non osservato",
};

for (const [code, label] of Object.entries(visibleStateLabels)) {
  assert.match(dashboard, new RegExp(`${code}:'${label}'`), `missing Italian label for ${code}`);
}

assert.match(dashboard, /const uiStateLabel = value =>/);
assert.match(dashboard, /const label = value => uiStateLabel\(value\)/);
assert.match(dashboard, /uiStateLabel\(w\.state\|\|gpu\.state\|\|'UNKNOWN'\)/);
assert.match(dashboard, /uiStateLabel\(v\.state\|\|'UNAVAILABLE'\)/);
assert.match(dashboard, /uiStateLabel\(pool\.state\|\|'UNKNOWN'\)/);
assert.match(dashboard, /uiStateLabel\(cursor\.accounting_mapping\|\|'UNVERIFIED'\)/);
assert.match(dashboard, /uiStateLabel\(event\.phase\)/);
assert.match(dashboard, /uiStateLabel\(value\)/);

for (const [code, anchor] of Object.entries({
  AVAILABLE: "health==='AVAILABLE'",
  UNAVAILABLE: "usage_code:'UNAVAILABLE'",
  REAL_FAILURE: "q.health_state==='REAL_FAILURE'",
  NOT_OBSERVED: "state=text(c.state,'NOT_OBSERVED')",
  ACTIVE: "state==='ACTIVE'",
  BLOCKED: "state==='BLOCKED'",
  OFFLINE: "code:'OFFLINE'",
})) {
  assert.equal(dashboard.includes(anchor), true, `internal state code ${code} must remain present`);
}
assert.match(dashboard, /ORCHESTRATOR \/ BRIDGE/);
assert.match(dashboard, /HARNESS \/ LOCAL EXECUTOR/);
assert.match(dashboard, /RAW_BROWSER_CDP_EXPOSED:/);
assert.match(dashboard, /send\/submit: <span class="operator-safe">NO<\/span>/);
assert.equal(dashboard.includes("innerHTML = raw"), false);
assert.equal(dashboard.includes("browser_console"), false);

const canonicalResources = ["workstation", "vps", "qwen", "glm", "codex", "cursor"];
for (const resource of canonicalResources) {
  assert.match(dashboard, new RegExp(`(?:tile|poolTile)\\('${resource}'`), `missing canonical resource ${resource}`);
}

console.log("FOCUSED_TESTS=PASS");

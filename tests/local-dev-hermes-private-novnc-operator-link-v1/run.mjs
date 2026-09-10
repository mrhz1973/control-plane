#!/usr/bin/env node
/** Offline contract tests for the private Hermes noVNC operator surface. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HERMES_NOVNC_PRIVATE_URL,
  HERMES_NOVNC_VPS_BIND,
  buildHermesNovncVpsObservation,
  collectHermesNovncTunnel,
} from "../../tools/local-dev-resource-observatory-v1.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dashboard = readFileSync(resolve(here, "../../tools/local-dev-dispatcher-dashboard-v1.html"), "utf8");

assert.equal(HERMES_NOVNC_PRIVATE_URL, "http://127.0.0.1:16080/vnc.html");
assert.equal(HERMES_NOVNC_VPS_BIND, "127.0.0.1:6080");

const availableVps = buildHermesNovncVpsObservation({
  hermes_service_states: { xvfb: "active", chromium: "active", x11vnc: "active", novnc: "active" },
  http_status: "200",
  listener_bindings: { "9222": ["LOOPBACK"], "5900": ["LOOPBACK"], "6080": ["LOOPBACK"] },
});
assert.equal(availableVps.chrome_state, "AVAILABLE");
assert.equal(availableVps.novnc_vps_state, "AVAILABLE");
assert.equal(availableVps.public_exposure, "NO");

const unavailableVps = buildHermesNovncVpsObservation({
  hermes_service_states: { chromium: "active", novnc: "inactive" },
  http_status: "200",
  listener_bindings: { "9222": ["LOOPBACK"], "5900": ["LOOPBACK"], "6080": ["LOOPBACK"] },
});
assert.equal(unavailableVps.novnc_vps_state, "UNAVAILABLE");
const endpointObservedVps = buildHermesNovncVpsObservation({
  hermes_service_states: { chromium: "active", novnc: null },
  http_status: "200",
  listener_bindings: { "9222": ["LOOPBACK"], "5900": ["LOOPBACK"], "6080": ["LOOPBACK"] },
});
assert.equal(endpointObservedVps.novnc_vps_state, "AVAILABLE", "HTTP 200 is sufficient availability evidence when the optional service read is not observed");

const connected = await collectHermesNovncTunnel({
  nowMs: Date.parse("2026-09-11T00:00:00.000Z"),
  fetchFn: async (url, options) => {
    assert.equal(url, HERMES_NOVNC_PRIVATE_URL);
    assert.equal(options.method, "GET");
    assert.equal(options.redirect, "manual");
    return { status: 200, body: { cancel: async () => {} } };
  },
});
assert.equal(connected.state, "CONNECTED");

const inactive = await collectHermesNovncTunnel({
  fetchFn: async () => { throw Object.assign(new Error("refused"), { cause: { code: "ECONNREFUSED" } }); },
});
assert.equal(inactive.state, "INACTIVE");

const notObservable = await collectHermesNovncTunnel({
  fetchFn: async () => { throw Object.assign(new Error("timeout"), { cause: { code: "ETIMEDOUT" } }); },
});
assert.equal(notObservable.state, "NOT_OBSERVABLE");
assert.equal(availableVps.novnc_vps_state, "AVAILABLE");
assert.equal(inactive.state, "INACTIVE");
assert.notEqual(availableVps.novnc_vps_state, inactive.state, "VPS availability must not imply a connected client tunnel");
assert.equal(connected.remote_browser_localhost_asserted, false);

assert.match(dashboard, /🖥 Apri Chrome Hermes/);
assert.match(dashboard, /ORCHESTRATORE \/ BRIDGE/);
assert.match(dashboard, /Chrome Hermes/);
assert.match(dashboard, /noVNC VPS/);
assert.match(dashboard, /Tunnel noVNC/);
assert.match(dashboard, /Connesso/);
assert.match(dashboard, /Non attivo/);
assert.match(dashboard, /Non osservabile/);
assert.match(dashboard, /Dettagli accesso Chrome/);
assert.match(dashboard, /Accesso privato/);
assert.match(dashboard, /Nessuna esposizione pubblica/);
assert.match(dashboard, /ssh -N -L 16080:127\.0\.0\.1:6080 ionos-n8n-new/);
assert.match(dashboard, /href="http:\/\/127\.0\.0\.1:16080\/vnc\.html"/);
assert.match(dashboard, /target="_blank"/);
assert.doesNotMatch(dashboard, /(?:href|data-private-url)="[^"']*:6080(?:\/|"|')/i);
assert.doesNotMatch(dashboard, /31\.70\.139\.73:6080|100\.99\.54\.93:6080|Funnel/i);
assert.match(dashboard, /operator-link/);
assert.match(dashboard, /RAW_BROWSER_CDP_EXPOSED: <span class="operator-safe">NO/);
assert.match(dashboard, /send\/submit: <span class="operator-safe">NO/);
assert.doesNotMatch(dashboard, /browser_console/);
assert.match(dashboard, /const CANONICAL_RESOURCES = Object\.freeze\(\['workstation','vps','qwen','glm','codex','cursor'\]\)/);

console.log("FOCUSED_NOVNC_TESTS=PASS");

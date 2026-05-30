#!/usr/bin/env node
/**
 * classifier-server-v1 — thin HTTP server around classifier-wrapper-v1 (Step Wa, OFFLINE).
 *
 * Boundaries:
 * - Node built-ins only (node:http). No express. No external dependency.
 * - Reuses wrapper logic; does NOT duplicate classification.
 * - Offline-only in this step: not exposed live, no daemon, no autostart.
 * - No chain-of-thought is requested, logged, stored, summarized, or persisted.
 * - Lets classifyEvent own its Ollama defaults/env (OLLAMA_BASE_URL, OLLAMA_MODEL,
 *   OLLAMA_TIMEOUT_MS). Wrapper default transport stays loopback 127.0.0.1:11434.
 *
 * Networking safety:
 * - Default bind is exactly loopback "127.0.0.1". The server never defaults to 0.0.0.0.
 * - For n8n via Tailscale, set CLASSIFIER_BIND_ADDR to the Ryzen Tailscale IP
 *   (never a public IP) and rely on Tailscale ACLs.
 */
import http from "node:http";
import { classifyEvent, validateInput } from "./classifier-wrapper-v1.mjs";

export const DEFAULT_BIND_ADDR = "127.0.0.1";
export const DEFAULT_PORT = 8765;

export const FORBIDDEN_BIND_ADDR = "0.0.0.0";

/**
 * Resolve the bind address from env. Never returns 0.0.0.0 by default.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveBindAddr(env = process.env) {
  const raw = env.CLASSIFIER_BIND_ADDR;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim();
  }
  return DEFAULT_BIND_ADDR;
}

/**
 * Resolve the port from env. Defaults to 8765.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolvePort(env = process.env) {
  const raw = env.CLASSIFIER_PORT;
  const n = Number(raw);
  if (raw != null && String(raw).trim() !== "" && Number.isInteger(n) && n > 0) {
    return n;
  }
  return DEFAULT_PORT;
}

/**
 * Pure classification entrypoint.
 * - validates input with validateInput
 * - calls classifyEvent(input, options)
 * - returns { status, payload }
 * Never throws for normal bad-request cases.
 *
 * @param {unknown} body parsed event object
 * @param {object} [options] forwarded to classifyEvent (e.g. { mock, mockResponse })
 * @returns {Promise<{status:number, payload:object}>}
 */
export async function classifyRequest(body, options = {}) {
  let validated;
  try {
    validated = validateInput(body);
  } catch (err) {
    return { status: 400, payload: { error: err.message } };
  }

  try {
    const output = await classifyEvent(validated, options);
    return { status: 200, payload: output };
  } catch (err) {
    // classifyEvent is designed to fall back rather than throw; this is a defensive
    // guard only. No chain-of-thought or internals are exposed.
    return { status: 400, payload: { error: err.message } };
  }
}

/**
 * Optional auth check. If CLASSIFIER_AUTH_TOKEN is set in env, requires header
 * X-Classifier-Token to match exactly. Token value is never logged or returned.
 * @param {Record<string,string>} headers lowercased header map
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {boolean} true if authorized
 */
export function isAuthorized(headers = {}, env = process.env) {
  const expected = env.CLASSIFIER_AUTH_TOKEN;
  if (typeof expected !== "string" || expected === "") {
    return true;
  }
  const provided = headers["x-classifier-token"];
  return provided === expected;
}

function lowerHeaders(headers = {}) {
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    out[String(k).toLowerCase()] = Array.isArray(v) ? v.join(", ") : v;
  }
  return out;
}

/**
 * Pure route helper — resolves method/path/body to { status, payload } without
 * listening on a TCP port. Used by offline tests and by the live request handler.
 *
 * @param {string} method HTTP method
 * @param {string} path request path (query stripped by caller)
 * @param {unknown} body parsed JSON body (object) or undefined; pass the special
 *        sentinel { __malformed__: true } only via parsedBody=null + rawError
 * @param {Record<string,string>} [headers] header map (any case)
 * @param {object} [options] classifier options (e.g. { mock, mockResponse })
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {Promise<{status:number, payload:object}>}
 */
export async function routeRequest(method, path, body, headers = {}, options = {}, env = process.env) {
  const lc = lowerHeaders(headers);

  // /healthz never calls the model and is exempt from auth.
  if (path === "/healthz") {
    if (method !== "GET") {
      return { status: 405, payload: { error: "method not allowed" } };
    }
    return { status: 200, payload: { status: "ok" } };
  }

  if (path === "/classify") {
    if (method !== "POST") {
      return { status: 405, payload: { error: "method not allowed" } };
    }
    if (!isAuthorized(lc, env)) {
      return { status: 401, payload: { error: "unauthorized" } };
    }
    return classifyRequest(body, options);
  }

  return { status: 404, payload: { error: "not found" } };
}

function sendJson(res, status, payload) {
  const text = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(text),
  });
  res.end(text);
}

function readBody(req, limitBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/**
 * Build the http.Server. Does not listen.
 */
export function createServer(env = process.env) {
  return http.createServer(async (req, res) => {
    try {
      const path = (req.url || "/").split("?")[0];
      const method = req.method || "GET";

      if (path === "/classify" && method === "POST") {
        if (!isAuthorized(lowerHeaders(req.headers), env)) {
          sendJson(res, 401, { error: "unauthorized" });
          return;
        }
        let raw;
        try {
          raw = await readBody(req);
        } catch (err) {
          sendJson(res, 400, { error: err.message });
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          sendJson(res, 400, { error: "malformed JSON body" });
          return;
        }
        const result = await classifyRequest(parsed, {});
        sendJson(res, result.status, result.payload);
        return;
      }

      const result = await routeRequest(method, path, undefined, req.headers, {}, env);
      sendJson(res, result.status, result.payload);
    } catch {
      // Never leak internals. No chain-of-thought, no stack traces in payload.
      sendJson(res, 500, { error: "internal error" });
    }
  });
}

function isMainModule() {
  return (
    process.argv[1] &&
    (process.argv[1].endsWith("classifier-server-v1.mjs") ||
      process.argv[1].replace(/\\/g, "/").endsWith("tools/classifier-server-v1.mjs"))
  );
}

// CLI start only when invoked directly. Not run in Step Wa.
if (isMainModule()) {
  const addr = resolveBindAddr();
  const port = resolvePort();
  const server = createServer();
  server.listen(port, addr, () => {
    process.stdout.write(`classifier-server-v1 listening on ${addr}:${port}\n`);
  });
}

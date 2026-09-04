#!/usr/bin/env node
/**
 * V4 — DEV-domain localhost-only Qwen generation guard.
 *
 * Bounded HTTP proxy to the canonical Qwen MultiModel router (http://127.0.0.1:8080).
 * Counts upstream generation requests (POST /v1/chat/completions).
 * Blocks request N+1 at max_agent_turns.
 *
 * - Binds only to 127.0.0.1 (loopback).
 * - No OpenCode launch. No Qwen launch. No body/prompt persistence.
 * - Deterministic counters/state for offline tests.
 */
import http from "node:http";
import { URL } from "node:url";

export const ACCOUNTING_SCHEMA = "local-dev-generation-guard-accounting-v1";
export const READY_SCHEMA = "local-dev-generation-guard-ready-v1";
export const BIND_HOST = "127.0.0.1";
export const DEFAULT_UPSTREAM = "http://127.0.0.1:8080";

const SECRET_HEADER_RE =
  /^(authorization|proxy-authorization|x-api-key|api-key|x-auth-token|openai-api-key)$/i;

export class GuardConfigError extends Error {
  constructor(message, code = "GUARD_CONFIG_INVALID") {
    super(message);
    this.name = "GuardConfigError";
    this.code = code;
  }
}

export function isLoopbackHostname(hostname) {
  if (!hostname) return false;
  const h = String(hostname).toLowerCase().replace(/^\[|\]$/g, "");
  return h === "127.0.0.1" || h === "localhost" || h === "::1";
}

export function assertLoopbackBindHost(host) {
  if (host !== BIND_HOST) {
    throw new GuardConfigError(
      `bind host must be ${BIND_HOST}; got ${JSON.stringify(host)}`,
      "NON_LOOPBACK_BIND",
    );
  }
}

export function normalizeUpstreamOrigin(upstream) {
  if (typeof upstream !== "string" || !upstream.trim()) {
    throw new GuardConfigError("upstream_origin required", "MISSING_UPSTREAM");
  }
  let u;
  try {
    u = new URL(upstream.trim());
  } catch {
    throw new GuardConfigError("upstream_origin is not a valid URL", "INVALID_UPSTREAM_URL");
  }
  if (u.protocol !== "http:") {
    throw new GuardConfigError("upstream must be http:// loopback only", "NON_HTTP_UPSTREAM");
  }
  if (!isLoopbackHostname(u.hostname)) {
    throw new GuardConfigError("upstream hostname must be loopback", "NON_LOOPBACK_UPSTREAM");
  }
  const port = u.port ? `:${u.port}` : "";
  return `http://127.0.0.1${port}`;
}

function hasSecretBearingHeader(headers) {
  for (const name of Object.keys(headers || {})) {
    if (SECRET_HEADER_RE.test(name)) return true;
  }
  return false;
}

function pathOnly(urlPath) {
  const q = urlPath.indexOf("?");
  return q >= 0 ? urlPath.slice(0, q) : urlPath;
}

function writeJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    connection: "close",
  });
  res.end(body);
}

function emptyAccounting(partial = {}) {
  return {
    schema_version: ACCOUNTING_SCHEMA,
    guard_state: partial.guard_state || "listening",
    bind_host: BIND_HOST,
    listen_port: Number(partial.listen_port) || 0,
    upstream_origin: partial.upstream_origin || "",
    max_agent_turns: Number(partial.max_agent_turns) || 0,
    generation_requests_seen: 0,
    upstream_generation_requests: 0,
    blocked_generation_requests: 0,
    informational_requests_forwarded: 0,
    rejected_requests: 0,
    secret_bearing_requests_rejected: 0,
  };
}

function readRequestBody(req) {
  return new Promise((resolvePromise) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolvePromise(Buffer.concat(chunks)));
    req.on("error", () => resolvePromise(Buffer.concat(chunks)));
  });
}

/**
 * Forward a request to the canonical upstream (loopback) and pipe the
 * response back. No body/prompt persistence: streamed, never stored.
 */
function proxyRequest(upstream, req, res) {
  const u = new URL(upstream);
  const opts = {
    host: u.hostname,
    port: u.port || 80,
    method: req.method,
    path: req.url,
    headers: { ...req.headers, host: `${u.hostname}:${u.port || 80}` },
  };
  const upReq = http.request(opts, (upRes) => {
    res.writeHead(upRes.statusCode || 502, upRes.headers);
    upRes.pipe(res);
  });
  upReq.on("error", () => {
    if (!res.headersSent) {
      writeJson(res, 502, { error: { message: "guard upstream unreachable", type: "guard_error" } });
    } else {
      res.end();
    }
  });
  req.pipe(upReq);
}

/**
 * Start the DEV-domain generation guard.
 *
 * options:
 *  - upstreamOrigin  default http://127.0.0.1:8080 (validated loopback)
 *  - maxAgentTurns   hard ceiling of upstream generation requests (>=1)
 *  - listenPort      default 0 (ephemeral)
 *
 * Returns { base_url, listen_port, max_agent_turns, upstream_origin,
 *           getAccounting(), ready, close() }.
 */
export function startLocalDevGenerationGuard(options = {}) {
  const upstreamOrigin = normalizeUpstreamOrigin(options.upstreamOrigin || DEFAULT_UPSTREAM);
  const maxAgentTurns = Number(options.maxAgentTurns);
  if (!Number.isInteger(maxAgentTurns) || maxAgentTurns < 1) {
    throw new GuardConfigError("maxAgentTurns must be an integer >= 1", "INVALID_MAX_AGENT_TURNS");
  }
  const listenPort = Number.isInteger(options.listenPort) && options.listenPort >= 0
    ? options.listenPort
    : 0;

  const accounting = emptyAccounting({
    listen_port: 0,
    upstream_origin: upstreamOrigin,
    max_agent_turns: maxAgentTurns,
  });

  const server = http.createServer((req, res) => {
    const path = pathOnly(req.url || "/");
    const isGeneration = req.method === "POST" && path === "/v1/chat/completions";

    if (hasSecretBearingHeader(req.headers)) {
      accounting.rejected_requests += 1;
      accounting.secret_bearing_requests_rejected += 1;
      writeJson(res, 400, {
        error: { message: "guard: secret-bearing headers forbidden in DEV domain", type: "guard_error" },
      });
      return;
    }

    if (!isGeneration) {
      accounting.informational_requests_forwarded += 1;
      proxyRequest(upstreamOrigin, req, res);
      return;
    }

    accounting.generation_requests_seen += 1;
    if (accounting.upstream_generation_requests >= maxAgentTurns) {
      accounting.blocked_generation_requests += 1;
      writeJson(res, 429, {
        error: {
          message: `guard: max_agent_turns (${maxAgentTurns}) exceeded`,
          type: "local_dev_bounds_violation",
          code: "BOUNDS_TURN_CEILING_EXCEEDED",
        },
      });
      return;
    }
    accounting.upstream_generation_requests += 1;
    proxyRequest(upstreamOrigin, req, res);
  });

  return new Promise((resolvePromise, rejectPromise) => {
    let settled = false;
    server.once("error", (err) => {
      if (settled) return;
      settled = true;
      accounting.guard_state = "failed";
      rejectPromise(err);
    });
    server.listen(listenPort, BIND_HOST, () => {
      if (settled) return;
      settled = true;
      const port = server.address().port;
      accounting.listen_port = port;
      resolvePromise({
        schema_version: READY_SCHEMA,
        ready: true,
        base_url: `http://${BIND_HOST}:${port}`,
        listen_port: port,
        bind_host: BIND_HOST,
        upstream_origin: upstreamOrigin,
        max_agent_turns: maxAgentTurns,
        getAccounting: () => ({ ...accounting }),
        close: () =>
          new Promise((done) => {
            accounting.guard_state = "closed";
            server.close(() => done(true));
            server.closeAllConnections?.();
          }),
      });
    });
  });
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("tools/local-dev-generation-guard-v1.mjs");

if (isMain) {
  startLocalDevGenerationGuard({ maxAgentTurns: 1 })
    .then((g) => {
      process.stdout.write(
        `${JSON.stringify({ ready: g.ready, base_url: g.base_url, max_agent_turns: g.max_agent_turns }, null, 2)}\n`,
      );
      return g.close();
    })
    .catch((err) => {
      process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
      process.exit(1);
    });
}

#!/usr/bin/env node
/**
 * V4 — loopback-only OpenCode→llama.cpp single-generation HTTP firewall.
 * Hard ceiling: upstream POST /v1/chat/completions <= 1.
 * No OpenCode launch. No Qwen launch. No body/prompt persistence.
 */
import http from "node:http";
import { URL } from "node:url";

export const ACCOUNTING_SCHEMA = "opencode-single-generation-guard-accounting-v1";
export const READY_SCHEMA = "opencode-single-generation-guard-ready-v1";
export const BIND_HOST = "127.0.0.1";
export const GENERATION_BUDGET = 1;
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
    throw new GuardConfigError(
      "upstream must be http:// loopback only",
      "NON_HTTP_UPSTREAM",
    );
  }
  if (!isLoopbackHostname(u.hostname)) {
    throw new GuardConfigError(
      "upstream hostname must be loopback",
      "NON_LOOPBACK_UPSTREAM",
    );
  }
  // Canonicalize to 127.0.0.1 origin (no path/query/userinfo)
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
    generation_budget: GENERATION_BUDGET,
    generation_requests_seen: 0,
    upstream_generation_requests: 0,
    blocked_generation_requests: 0,
    informational_requests_forwarded: 0,
    rejected_requests: 0,
    first_generation_started: false,
    first_generation_terminal: false,
    secret_bearing_requests_rejected: 0,
  };
}

/**
 * Start the single-generation guard.
 *
 * @param {object} options
 * @param {string} [options.upstreamOrigin]
 * @param {number} [options.listenPort] 0 = OS-assigned
 * @param {string} [options.bindHost] must be 127.0.0.1
 * @returns {Promise<{ base_url: string, listen_port: number, getAccounting: Function, close: Function }>}
 */
export async function startSingleGenerationGuard(options = {}) {
  const bindHost = options.bindHost ?? BIND_HOST;
  assertLoopbackBindHost(bindHost);
  const upstreamOrigin = normalizeUpstreamOrigin(
    options.upstreamOrigin ?? DEFAULT_UPSTREAM,
  );
  const listenPort = options.listenPort ?? 0;
  if (!Number.isInteger(listenPort) || listenPort < 0 || listenPort > 65535) {
    throw new GuardConfigError("listenPort out of range", "INVALID_PORT");
  }

  const accounting = emptyAccounting({
    guard_state: "listening",
    upstream_origin: upstreamOrigin,
  });

  /** @type {import('node:http').Server} */
  let server;

  function getAccounting() {
    return { ...accounting };
  }

  function tryAcquireGenerationBudget() {
    // Synchronous critical section (Node event-loop single-threaded).
    accounting.generation_requests_seen += 1;
    if (accounting.upstream_generation_requests >= accounting.generation_budget) {
      accounting.blocked_generation_requests += 1;
      return false;
    }
    accounting.upstream_generation_requests += 1;
    accounting.first_generation_started = true;
    return true;
  }

  function forward(req, res, targetPath) {
    const upstreamUrl = new URL(targetPath, upstreamOrigin);
    const headers = { ...req.headers };
    // Force Host to upstream; never forward hop-by-hop connection reuse assumptions.
    headers.host = upstreamUrl.host;
    delete headers["proxy-connection"];

    const upstreamReq = http.request(
      {
        protocol: upstreamUrl.protocol,
        hostname: upstreamUrl.hostname,
        port: upstreamUrl.port || 80,
        path: upstreamUrl.pathname + upstreamUrl.search,
        method: req.method,
        headers,
      },
      (upstreamRes) => {
        res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
        upstreamRes.pipe(res);
        upstreamRes.on("end", () => {
          if (targetPath.startsWith("/v1/chat/completions")) {
            accounting.first_generation_terminal = true;
          }
        });
        upstreamRes.on("error", () => {
          if (targetPath.startsWith("/v1/chat/completions")) {
            accounting.first_generation_terminal = true;
          }
          try {
            res.destroy();
          } catch {
            /* ignore */
          }
        });
      },
    );

    upstreamReq.on("error", () => {
      if (targetPath.startsWith("/v1/chat/completions")) {
        accounting.first_generation_terminal = true;
      }
      if (!res.headersSent) {
        writeJson(res, 502, {
          error: {
            message: "upstream_unreachable",
            type: "guard_upstream_error",
          },
        });
      } else {
        try {
          res.destroy();
        } catch {
          /* ignore */
        }
      }
    });

    req.pipe(upstreamReq);
  }

  function onRequest(req, res) {
    try {
      const method = (req.method || "GET").toUpperCase();
      const pathname = pathOnly(req.url || "/");

      if (hasSecretBearingHeader(req.headers)) {
        accounting.secret_bearing_requests_rejected += 1;
        accounting.rejected_requests += 1;
        writeJson(res, 403, {
          error: {
            message: "secret_bearing_headers_rejected",
            type: "guard_secret_header_rejected",
          },
        });
        return;
      }

      if (method === "GET" && pathname === "/v1/models") {
        accounting.informational_requests_forwarded += 1;
        forward(req, res, req.url || "/v1/models");
        return;
      }

      if (method === "POST" && pathname === "/v1/chat/completions") {
        if (!tryAcquireGenerationBudget()) {
          writeJson(res, 429, {
            error: {
              message: "generation_budget_exhausted",
              type: "guard_generation_blocked",
              generation_budget: GENERATION_BUDGET,
            },
          });
          return;
        }
        forward(req, res, req.url || "/v1/chat/completions");
        return;
      }

      // Fail-closed: alternate generation endpoints and unknown routes.
      accounting.rejected_requests += 1;
      writeJson(res, 403, {
        error: {
          message: "path_rejected",
          type: "guard_path_rejected",
          method,
          path: pathname,
        },
      });
    } catch {
      accounting.rejected_requests += 1;
      if (!res.headersSent) {
        writeJson(res, 500, {
          error: { message: "guard_internal_error", type: "guard_error" },
        });
      }
    }
  }

  server = http.createServer(onRequest);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(listenPort, bindHost, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : listenPort;
  accounting.listen_port = port;
  const base_url = `http://${bindHost}:${port}`;

  async function close() {
    if (accounting.guard_state === "closed") return;
    accounting.guard_state = "closed";
    await new Promise((resolve) => {
      server.close(() => resolve());
      // Ensure hangups don't block tests.
      setTimeout(resolve, 1000).unref?.();
    });
  }

  return {
    base_url,
    listen_port: port,
    bind_host: bindHost,
    upstream_origin: upstreamOrigin,
    getAccounting,
    close,
  };
}

function parseArgs(argv) {
  const opts = {
    upstream: DEFAULT_UPSTREAM,
    port: 0,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") opts.help = true;
    else if (a === "--upstream" && argv[i + 1]) opts.upstream = argv[++i];
    else if (a === "--port" && argv[i + 1]) opts.port = Number(argv[++i]);
    else throw new Error(`unknown arg: ${a}`);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    process.stderr.write(
      "Usage: node tools/opencode-single-generation-guard-v1.mjs --upstream http://127.0.0.1:8080 [--port 0]\n",
    );
    process.exit(0);
  }

  const guard = await startSingleGenerationGuard({
    upstreamOrigin: opts.upstream,
    listenPort: opts.port,
    bindHost: BIND_HOST,
  });

  const ready = {
    schema_version: READY_SCHEMA,
    status: "READY",
    base_url: guard.base_url,
    bind_host: guard.bind_host,
    listen_port: guard.listen_port,
    upstream_origin: guard.upstream_origin,
    generation_budget: GENERATION_BUDGET,
  };
  process.stdout.write(`${JSON.stringify(ready)}\n`);

  const shutdown = async () => {
    try {
      await guard.close();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Stay alive for owning harness.
  await new Promise(() => {});
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("opencode-single-generation-guard-v1.mjs");

if (isMain) {
  main().catch((err) => {
    const msg = err && err.message ? err.message : String(err);
    process.stderr.write(`error: ${msg}\n`);
    process.exit(1);
  });
}

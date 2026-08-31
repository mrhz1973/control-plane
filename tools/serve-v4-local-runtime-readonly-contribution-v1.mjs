#!/usr/bin/env node
/**
 * V4 — private read-only local-runtime contribution endpoint.
 * Transport adapter only: one GET -> one producer evaluation.
 * GET-only, no query, no body, no selectors, in-flight fail-closed.
 * Never generates, never mutates processes, never composes RESOURCE_STATUS.
 */
import http from "node:http";
import {
  loadRuntimeConfig,
  gatherQwenDiagnostics,
  classifyQwenSharedRuntime,
  gatherOpenCodeFilesystemEvidence,
  inspectOpenCodeStatic,
  buildLocalRuntimeContribution,
} from "./produce-v4-local-runtime-readonly-contribution-v1.mjs";

export const CANONICAL_PATH = "/v4/resource-status/local-readonly";
export const RESULT_SCHEMA_VERSION = "v4-local-runtime-readonly-contribution-result-v1";
export const BUSY_CLASSIFICATION = "LOCAL_RUNTIME_PRODUCER_BUSY";
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 18790;

function bounded(ok, classification, reason_codes) {
  return {
    schema_version: RESULT_SCHEMA_VERSION,
    ok,
    classification,
    reason_codes,
    launch_performed: false,
    generation_calls: 0,
  };
}

/**
 * Default evaluation: exactly one producer run per call.
 * gatherQwenDiagnostics is invoked exactly once (single bounded PowerShell).
 */
export function defaultEvaluateProducer() {
  const runtimeConfig = loadRuntimeConfig();
  const diagnostics = gatherQwenDiagnostics(runtimeConfig);
  const qwenClassified = classifyQwenSharedRuntime(
    diagnostics.sampleA,
    diagnostics.sampleB,
    runtimeConfig,
  );
  const fsEvidence = gatherOpenCodeFilesystemEvidence();
  const opencodeStatic = inspectOpenCodeStatic(fsEvidence);
  const contribution = buildLocalRuntimeContribution({
    qwenClassified,
    opencodeStatic,
    producedAtMs: Date.now(),
  });
  return {
    schema_version: RESULT_SCHEMA_VERSION,
    ok: true,
    qwen_occupancy_classification: qwenClassified.classification,
    qwen_classification_reason: qwenClassified.reason,
    opencode_static_classification: opencodeStatic.classification,
    contribution,
    launch_performed: false,
    generation_calls: 0,
  };
}

/**
 * Build the request handler. options.evaluate is injectable for tests.
 * One in-memory guard serializes producer evaluations fail-closed.
 */
export function createLocalRuntimeStatusHandler(options = {}) {
  const evaluate = options.evaluate || defaultEvaluateProducer;
  let inFlight = false;

  return function handle(req, res) {
    return new Promise((resolve) => {
      const send = (status, obj) => {
        try {
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(`${JSON.stringify(obj)}\n`);
        } catch {
          /* client gone */
        }
        resolve();
      };

      if (req.method !== "GET") {
        send(405, bounded(false, "ENDPOINT_METHOD_REJECTED", ["GET_ONLY"]));
        return;
      }

      const transferEncoding = req.headers["transfer-encoding"];
      const contentLength = Number(req.headers["content-length"] || 0);
      if (transferEncoding || contentLength > 0) {
        req.resume();
        send(400, bounded(false, "ENDPOINT_BODY_REJECTED", ["REQUEST_BODY_FORBIDDEN"]));
        return;
      }

      let url;
      try {
        url = new URL(req.url, "http://127.0.0.1");
      } catch {
        send(400, bounded(false, "ENDPOINT_URL_INVALID", ["URL_UNPARSEABLE"]));
        return;
      }
      if (url.search && url.search.length > 0) {
        send(400, bounded(false, "ENDPOINT_QUERY_REJECTED", ["QUERY_PARAMETERS_FORBIDDEN"]));
        return;
      }
      if (url.pathname !== CANONICAL_PATH && url.pathname !== "/") {
        send(404, bounded(false, "ENDPOINT_PATH_REJECTED", ["PATH_NOT_FOUND"]));
        return;
      }

      req.on("data", (chunk) => {
        if (chunk && chunk.length > 0) {
          send(400, bounded(false, "ENDPOINT_BODY_REJECTED", ["REQUEST_BODY_FORBIDDEN"]));
          req.destroy();
        }
      });

      if (inFlight) {
        send(503, bounded(false, BUSY_CLASSIFICATION, ["PRODUCER_BUSY_FAIL_CLOSED"]));
        return;
      }

      inFlight = true;
      let settled = false;
      res.on("close", () => {
        if (!res.writableEnded && !settled) {
          settled = true;
          inFlight = false;
          resolve();
        }
      });

      Promise.resolve()
        .then(() => evaluate())
        .then((result) => {
          if (settled) return;
          settled = true;
          inFlight = false;
          send(200, result);
        })
        .catch(() => {
          if (settled) return;
          settled = true;
          inFlight = false;
          send(
            500,
            bounded(false, "ENDPOINT_INTERNAL_FAIL_CLOSED", [
              "PRODUCER_ERROR_FAIL_CLOSED",
            ]),
          );
        });
    });
  };
}

/**
 * Start the loopback service. host/port injectable for tests.
 * Returns { server, close, address }.
 */
export function startLocalRuntimeStatusService(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  const handler = createLocalRuntimeStatusHandler(options);
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      handler(req, res).catch(() => {
        try {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(
            `${JSON.stringify(
              bounded(false, "ENDPOINT_INTERNAL_FAIL_CLOSED", ["HANDLER_ERROR"]),
            )}\n`,
          );
        } catch {
          /* ignore */
        }
      });
    });
    server.on("error", reject);
    server.listen(port, host, () => {
      resolve({
        server,
        address: server.address(),
        close: () =>
          new Promise((r) => {
            server.close(() => r());
          }),
      });
    });
  });
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith(
    "serve-v4-local-runtime-readonly-contribution-v1.mjs",
  );

if (isMain) {
  const args = new Map();
  for (let i = 2; i < process.argv.length - 1; i += 2) {
    args.set(process.argv[i], process.argv[i + 1]);
  }
  const host = args.get("--host") || DEFAULT_HOST;
  const port = Number(args.get("--port") || DEFAULT_PORT);
  startLocalRuntimeStatusService({ host, port })
    .then(({ address }) => {
      process.stdout.write(
        `${JSON.stringify({
          schema_version: "v4-local-runtime-readonly-endpoint-started-v1",
          ok: true,
          host: address.address,
          port: address.port,
          canonical_path: CANONICAL_PATH,
        })}\n`,
      );
    })
    .catch((err) => {
      process.stderr.write(
        `${JSON.stringify({
          schema_version: "v4-local-runtime-readonly-endpoint-started-v1",
          ok: false,
          error_class: "ENDPOINT_BIND_FAILED",
        })}\n`,
      );
      process.exit(1);
    });
}

#!/usr/bin/env node
/**
 * Bounded one-shot HTTP POST for LiteLLM primary /v1/responses.
 * GPT-Web contract: docs/runtime/PATCH_D0025_W_WF61_HANGPROOF_HTTP_BRIDGE.gpt-web.json
 *
 * Exactly one compact JSON stdout line. No request/response/header logging.
 */
import http from "node:http";
import { Buffer } from "node:buffer";

const SCHEMA = "litellm-primary-http-one-shot-v1";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const val = argv[i + 1];
    if (val === undefined || val.startsWith("--")) {
      out[key] = true;
      continue;
    }
    out[key] = val;
    i++;
  }
  return out;
}

function decodeB64(label, b64) {
  if (typeof b64 !== "string" || b64.length === 0) {
    return { ok: false, reason: `${label} must be non-empty base64` };
  }
  try {
    return { ok: true, value: Buffer.from(b64, "base64") };
  } catch (err) {
    return { ok: false, reason: `${label} base64 decode failed` };
  }
}

function parsePositiveInt(label, raw, fallback) {
  if (raw === undefined || raw === null || raw === "") return { ok: true, value: fallback };
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, reason: `${label} must be a positive integer` };
  }
  return { ok: true, value: n };
}

let emitted = false;
const startedAt = Date.now();

function emit(result, exitCode) {
  if (emitted) return;
  emitted = true;
  const line = JSON.stringify({
    schema: SCHEMA,
    ok: Boolean(result.ok),
    classification: result.classification,
    statusCode: result.statusCode ?? null,
    statusMessage: result.statusMessage ?? null,
    body_b64: result.body_b64 ?? null,
    body_bytes: Number.isFinite(result.body_bytes) ? result.body_bytes : 0,
    elapsed_ms: Date.now() - startedAt,
  });
  process.stdout.write(line + "\n");
  process.exitCode = exitCode;
  // Hard-exit after a tick so pending destroys cannot hang the process.
  setImmediate(() => process.exit(exitCode));
}

function fail(classification, extra = {}, exitCode = 1) {
  emit(
    {
      ok: false,
      classification,
      statusCode: extra.statusCode ?? null,
      statusMessage: extra.statusMessage ?? null,
      body_b64: null,
      body_bytes: extra.body_bytes ?? 0,
    },
    exitCode,
  );
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const urlDec = decodeB64("url-b64", args["url-b64"]);
  if (!urlDec.ok) return fail("INPUT_INVALID");
  const bodyDec = decodeB64("body-b64", args["body-b64"]);
  if (!bodyDec.ok) return fail("INPUT_INVALID");

  const wallP = parsePositiveInt("wall-timeout-ms", args["wall-timeout-ms"], 115000);
  if (!wallP.ok) return fail("INPUT_INVALID");
  const idleP = parsePositiveInt("body-idle-timeout-ms", args["body-idle-timeout-ms"], 15000);
  if (!idleP.ok) return fail("INPUT_INVALID");
  const maxP = parsePositiveInt("max-body-bytes", args["max-body-bytes"], 8388608);
  if (!maxP.ok) return fail("INPUT_INVALID");

  let url;
  try {
    url = new URL(urlDec.value.toString("utf8"));
  } catch {
    return fail("INPUT_INVALID");
  }
  if (url.protocol !== "http:") {
    return fail("INPUT_INVALID");
  }

  const bodyBuf = bodyDec.value;
  // Validate JSON without mutating bytes for wire (Content-Length uses exact bytes).
  try {
    JSON.parse(bodyBuf.toString("utf8"));
  } catch {
    return fail("INPUT_INVALID");
  }

  const wallTimeoutMs = wallP.value;
  const bodyIdleTimeoutMs = idleP.value;
  const maxBodyBytes = maxP.value;

  let req;
  let resRef = null;
  let chunks = [];
  let bodyBytes = 0;
  let idleTimer = null;
  let wallTimer = null;
  let settled = false;

  const clearIdle = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const destroyAll = () => {
    clearIdle();
    try {
      if (resRef && typeof resRef.destroy === "function") resRef.destroy();
    } catch {
      /* ignore */
    }
    try {
      if (req && typeof req.destroy === "function") req.destroy();
    } catch {
      /* ignore */
    }
  };

  const settleFail = (classification, extra = {}) => {
    if (settled || emitted) return;
    settled = true;
    if (wallTimer) clearTimeout(wallTimer);
    destroyAll();
    fail(classification, { ...extra, body_bytes: bodyBytes });
  };

  const settleOk = (statusCode, statusMessage, bodyBuffer) => {
    if (settled || emitted) return;
    settled = true;
    if (wallTimer) clearTimeout(wallTimer);
    clearIdle();
    emit(
      {
        ok: true,
        classification: "HTTP_COMPLETED",
        statusCode,
        statusMessage: statusMessage ?? null,
        body_b64: bodyBuffer.toString("base64"),
        body_bytes: bodyBuffer.length,
      },
      0,
    );
  };

  wallTimer = setTimeout(() => {
    settleFail("HTTP_WALL_TIMEOUT");
  }, wallTimeoutMs);

  const armIdle = () => {
    clearIdle();
    idleTimer = setTimeout(() => {
      settleFail("HTTP_BODY_IDLE_TIMEOUT", {
        statusCode: resRef?.statusCode ?? null,
        statusMessage: resRef?.statusMessage ?? null,
      });
    }, bodyIdleTimeoutMs);
  };

  try {
    req = http.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 80,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        agent: false,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": bodyBuf.length,
          Connection: "close",
        },
      },
      (res) => {
        resRef = res;
        armIdle();
        res.on("data", (chunk) => {
          if (settled || emitted) return;
          armIdle();
          const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          bodyBytes += buf.length;
          if (bodyBytes > maxBodyBytes) {
            settleFail("HTTP_BODY_TOO_LARGE", {
              statusCode: res.statusCode ?? null,
              statusMessage: res.statusMessage ?? null,
            });
            return;
          }
          chunks.push(buf);
        });
        res.on("end", () => {
          if (settled || emitted) return;
          const body = Buffer.concat(chunks, bodyBytes);
          settleOk(res.statusCode ?? 0, res.statusMessage ?? null, body);
        });
        res.on("aborted", () => {
          settleFail("HTTP_RESPONSE_ABORTED", {
            statusCode: res.statusCode ?? null,
            statusMessage: res.statusMessage ?? null,
          });
        });
        res.on("error", () => {
          settleFail("HTTP_RESPONSE_ABORTED", {
            statusCode: res.statusCode ?? null,
            statusMessage: res.statusMessage ?? null,
          });
        });
      },
    );

    req.on("error", () => {
      settleFail("HTTP_REQUEST_ERROR");
    });

    req.write(bodyBuf);
    req.end();
  } catch {
    settleFail("HTTP_REQUEST_ERROR");
  }
}

main();

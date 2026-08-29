#!/usr/bin/env node
/**
 * Offline mock HTTP suite for tools/post-litellm-primary-one-shot.mjs
 * Zero LiteLLM/GLM/Codex/Qwen calls.
 */
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const HELPER = join(ROOT, "tools/post-litellm-primary-one-shot.mjs");

function b64(s) {
  return Buffer.from(s, "utf8").toString("base64");
}

function runHelper({ url, body, wall = 115000, idle = 15000, maxBody = 8388608 }, timeoutMs = 130000) {
  return new Promise((resolvePromise) => {
    const child = spawn(
      process.execPath,
      [
        HELPER,
        "--url-b64",
        b64(url),
        "--body-b64",
        b64(typeof body === "string" ? body : JSON.stringify(body)),
        "--wall-timeout-ms",
        String(wall),
        "--body-idle-timeout-ms",
        String(idle),
        "--max-body-bytes",
        String(maxBody),
      ],
      { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolvePromise({ timedOut: true, code: null, stdout, stderr });
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += d.toString("utf8");
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString("utf8");
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({ timedOut: false, code, stdout, stderr });
    });
  });
}

function parseOneLine(stdout) {
  const lines = stdout.split(/\r?\n/).filter(Boolean);
  if (lines.length !== 1) return { ok: false, reason: `expected 1 line, got ${lines.length}`, lines };
  try {
    return { ok: true, value: JSON.parse(lines[0]), raw: lines[0] };
  } catch (e) {
    return { ok: false, reason: String(e.message || e), lines };
  }
}

function assertNoLeak(stdout, forbiddenSubstrings) {
  for (const s of forbiddenSubstrings) {
    if (s && stdout.includes(s)) return `leaked:${s}`;
  }
  return null;
}

const cases = [];
function check(name, fn) {
  cases.push({ name, fn });
}

async function withServer(handler, fn) {
  const server = http.createServer(handler);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}/v1/responses`);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

check("http-200-json-roundtrip", async () => {
  const payload = { object: "response", status: "completed", marker: "ROUNDTRIP_OK_42" };
  const reqBody = { model: "planner-glm-pilot", input: [{ role: "user", content: "x" }], stream: false };
  return withServer((req, res) => {
    let buf = "";
    req.on("data", (c) => (buf += c));
    req.on("end", () => {
      // echo request was exact JSON; respond with fixed payload
      res.writeHead(200, { "Content-Type": "application/json", Connection: "close" });
      res.end(JSON.stringify(payload));
    });
  }, async (url) => {
    const r = await runHelper({ url, body: reqBody, wall: 5000, idle: 2000 });
    if (r.timedOut) throw new Error("helper timed out");
    const p = parseOneLine(r.stdout);
    if (!p.ok) throw new Error(p.reason);
    if (r.code !== 0) throw new Error(`exit ${r.code}`);
    if (!p.value.ok || p.value.classification !== "HTTP_COMPLETED") throw new Error(JSON.stringify(p.value));
    if (p.value.statusCode !== 200) throw new Error(`status ${p.value.statusCode}`);
    const body = Buffer.from(p.value.body_b64, "base64").toString("utf8");
    if (body !== JSON.stringify(payload)) throw new Error("body not byte-identical");
    const leak = assertNoLeak(r.stdout + r.stderr, ["Authorization", "Bearer", reqBody.input[0].content]);
    // request body content may appear inside body_b64 of response only if echoed — we didn't echo request.
    // Ensure headers / auth not present:
    if (r.stdout.includes("Content-Type") || r.stderr.includes("Content-Type")) throw new Error("header leak");
    if (leak) throw new Error(leak);
  });
});

check("http-4xx-exit-0", async () => {
  return withServer((req, res) => {
    req.resume();
    req.on("end", () => {
      res.writeHead(429, { "Content-Type": "application/json", Connection: "close" });
      res.end(JSON.stringify({ error: "rate" }));
    });
  }, async (url) => {
    const r = await runHelper({ url, body: { stream: false }, wall: 5000, idle: 2000 });
    const p = parseOneLine(r.stdout);
    if (!p.ok) throw new Error(p.reason);
    if (r.code !== 0) throw new Error(`exit ${r.code}`);
    if (p.value.classification !== "HTTP_COMPLETED" || p.value.statusCode !== 429) {
      throw new Error(JSON.stringify(p.value));
    }
  });
});

check("wall-timeout-no-response", async () => {
  return withServer((req, res) => {
    // never respond
    req.resume();
  }, async (url) => {
    const r = await runHelper({ url, body: { stream: false }, wall: 800, idle: 5000 }, 5000);
    const p = parseOneLine(r.stdout);
    if (!p.ok) throw new Error(p.reason);
    if (r.code === 0) throw new Error("expected nonzero exit");
    if (p.value.classification !== "HTTP_WALL_TIMEOUT") throw new Error(JSON.stringify(p.value));
    if (p.value.body_b64 !== null) throw new Error("body should be null");
  });
});

check("body-idle-timeout-after-headers", async () => {
  return withServer((req, res) => {
    req.resume();
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json", Connection: "close" });
      res.write('{"partial":');
      // stall body; do not end
    });
  }, async (url) => {
    const r = await runHelper({ url, body: { stream: false }, wall: 10000, idle: 700 }, 8000);
    const p = parseOneLine(r.stdout);
    if (!p.ok) throw new Error(p.reason);
    if (r.code === 0) throw new Error("expected nonzero exit");
    if (p.value.classification !== "HTTP_BODY_IDLE_TIMEOUT") throw new Error(JSON.stringify(p.value));
  });
});

check("body-too-large", async () => {
  return withServer((req, res) => {
    req.resume();
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/octet-stream", Connection: "close" });
      res.end(Buffer.alloc(200, 0x61));
    });
  }, async (url) => {
    const r = await runHelper({ url, body: { stream: false }, wall: 5000, idle: 2000, maxBody: 50 }, 5000);
    const p = parseOneLine(r.stdout);
    if (!p.ok) throw new Error(p.reason);
    if (r.code === 0) throw new Error("expected nonzero");
    if (p.value.classification !== "HTTP_BODY_TOO_LARGE") throw new Error(JSON.stringify(p.value));
  });
});

check("connection-error", async () => {
  const url = "http://127.0.0.1:1/v1/responses"; // nothing listening
  const r = await runHelper({ url, body: { stream: false }, wall: 3000, idle: 1000 }, 5000);
  const p = parseOneLine(r.stdout);
  if (!p.ok) throw new Error(p.reason);
  if (r.code === 0) throw new Error("expected nonzero");
  if (p.value.classification !== "HTTP_REQUEST_ERROR") throw new Error(JSON.stringify(p.value));
});

check("stdout-one-line-no-header-leak", async () => {
  return withServer((req, res) => {
    req.resume();
    req.on("end", () => {
      res.writeHead(200, { "Content-Type": "application/json", "X-Secret-Header": "nope", Connection: "close" });
      res.end('{"ok":true}');
    });
  }, async (url) => {
    const secretBody = { stream: false, secret_field: "DO_NOT_LEAK_SECRET_FIELD" };
    const r = await runHelper({ url, body: secretBody, wall: 5000, idle: 2000 });
    const lines = r.stdout.split(/\r?\n/).filter(Boolean);
    if (lines.length !== 1) throw new Error(`lines=${lines.length}`);
    if (r.stdout.includes("X-Secret-Header") || r.stderr.includes("X-Secret-Header")) {
      throw new Error("response header leaked");
    }
    if (r.stdout.includes("DO_NOT_LEAK_SECRET_FIELD") || r.stderr.includes("DO_NOT_LEAK_SECRET_FIELD")) {
      throw new Error("request body leaked to diagnostic stdout");
    }
    // body_b64 of response is allowed transport output; ensure it only holds response
    const p = parseOneLine(r.stdout);
    const decoded = Buffer.from(p.value.body_b64, "base64").toString("utf8");
    if (decoded !== '{"ok":true}') throw new Error("unexpected response body");
  });
});

let failed = 0;
for (const c of cases) {
  try {
    await c.fn();
    console.log(`PASS ${c.name} — ok`);
  } catch (err) {
    failed += 1;
    console.log(`FAIL ${c.name} — ${err.message || err}`);
  }
}
console.log(
  JSON.stringify({
    ok: failed === 0,
    passed: cases.length - failed,
    failed,
    total: cases.length,
    provider_calls: 0,
  }),
);
process.exit(failed === 0 ? 0 : 1);

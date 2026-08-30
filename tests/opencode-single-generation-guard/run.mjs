#!/usr/bin/env node
/**
 * Offline tests for opencode-single-generation-guard-v1.
 * Mock upstream only. No Qwen. No OpenCode. No providers.
 */
import http from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  startSingleGenerationGuard,
  normalizeUpstreamOrigin,
  assertLoopbackBindHost,
  GuardConfigError,
  ACCOUNTING_SCHEMA,
  BIND_HOST,
  GENERATION_BUDGET,
} from "../../tools/opencode-single-generation-guard-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

function accountingHasBodies(acc) {
  const text = JSON.stringify(acc).toLowerCase();
  return (
    text.includes('"prompt"') ||
    text.includes('"messages"') ||
    text.includes('"content":"hello') ||
    text.includes("secret-token") ||
    text.includes("sk-")
  );
}

async function startMockUpstream(handler) {
  const state = {
    chat_completions: 0,
    models: 0,
    responses: 0,
    generate: 0,
    other: 0,
    lastChatBody: null,
  };
  const server = http.createServer((req, res) => {
    const path = (req.url || "").split("?")[0];
    if (req.method === "GET" && path === "/v1/models") {
      state.models += 1;
      if (handler?.models) return handler.models(req, res, state);
      const body = JSON.stringify({ data: [{ id: "mock-model" }] });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(body);
      return;
    }
    if (req.method === "POST" && path === "/v1/chat/completions") {
      state.chat_completions += 1;
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        // Intentionally not persisted beyond this mock process memory for assertions;
        // never copied into guard accounting.
        state.lastChatBody = Buffer.concat(chunks).toString("utf8");
        if (handler?.chat) return handler.chat(req, res, state);
        const body = JSON.stringify({
          id: "chatcmpl-mock",
          choices: [{ message: { role: "assistant", content: "OK" } }],
        });
        res.writeHead(200, { "content-type": "application/json" });
        res.end(body);
      });
      return;
    }
    if (req.method === "POST" && path === "/v1/responses") {
      state.responses += 1;
      res.writeHead(200, { "content-type": "application/json" });
      res.end("{}");
      return;
    }
    if (req.method === "POST" && path === "/api/generate") {
      state.generate += 1;
      res.writeHead(200, { "content-type": "application/json" });
      res.end("{}");
      return;
    }
    state.other += 1;
    res.writeHead(404);
    res.end("no");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  return {
    state,
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((r) => server.close(() => r())),
  };
}

async function postJson(baseUrl, path, body, headers = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function getJson(baseUrl, path) {
  const res = await fetch(`${baseUrl}${path}`);
  const text = await res.text();
  return { status: res.status, text };
}

async function run() {
  // Config fail-closed
  {
    let threw = false;
    try {
      normalizeUpstreamOrigin("http://192.168.1.10:8080");
    } catch (e) {
      threw = e instanceof GuardConfigError && e.code === "NON_LOOPBACK_UPSTREAM";
    }
    check("non-loopback-upstream-rejected", threw);

    threw = false;
    try {
      normalizeUpstreamOrigin("https://127.0.0.1:8080");
    } catch (e) {
      threw = e instanceof GuardConfigError;
    }
    check("non-http-upstream-rejected", threw);

    threw = false;
    try {
      assertLoopbackBindHost("0.0.0.0");
    } catch (e) {
      threw = e instanceof GuardConfigError && e.code === "NON_LOOPBACK_BIND";
    }
    check("non-loopback-bind-rejected", threw);

    threw = false;
    try {
      await startSingleGenerationGuard({
        upstreamOrigin: "http://127.0.0.1:8080",
        bindHost: "0.0.0.0",
      });
    } catch (e) {
      threw = e instanceof GuardConfigError && e.code === "NON_LOOPBACK_BIND";
    }
    check("start-rejects-non-loopback-bind", threw);
  }

  // 1 + 2: first forwarded, second blocked
  {
    const mock = await startMockUpstream();
    const guard = await startSingleGenerationGuard({
      upstreamOrigin: mock.origin,
      listenPort: 0,
    });
    try {
      const r1 = await postJson(guard.base_url, "/v1/chat/completions", {
        model: "m",
        messages: [{ role: "user", content: "hello-one" }],
      });
      const r2 = await postJson(guard.base_url, "/v1/chat/completions", {
        model: "m",
        messages: [{ role: "user", content: "hello-two" }],
      });
      const acc = guard.getAccounting();
      check(
        "first-chat-forwarded-once",
        r1.status === 200 && mock.state.chat_completions === 1,
        `status=${r1.status} upstream=${mock.state.chat_completions}`,
      );
      check(
        "second-chat-blocked",
        r2.status === 429 && mock.state.chat_completions === 1,
        `status=${r2.status} upstream=${mock.state.chat_completions}`,
      );
      check(
        "accounting-budget-1",
        acc.upstream_generation_requests === 1 &&
          acc.blocked_generation_requests === 1 &&
          acc.generation_budget === GENERATION_BUDGET &&
          acc.schema_version === ACCOUNTING_SCHEMA &&
          acc.bind_host === BIND_HOST,
        JSON.stringify(acc),
      );
      check("accounting-no-bodies-seq", !accountingHasBodies(acc), JSON.stringify(acc));
    } finally {
      await guard.close();
      await mock.close();
    }
  }

  // 3: concurrent race → exactly one upstream
  {
    const mock = await startMockUpstream({
      chat: (_req, res) => {
        // Slow-ish response so overlap is visible
        setTimeout(() => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
        }, 50);
      },
    });
    const guard = await startSingleGenerationGuard({ upstreamOrigin: mock.origin });
    try {
      const payloads = Array.from({ length: 8 }, (_, i) =>
        postJson(guard.base_url, "/v1/chat/completions", {
          model: "m",
          messages: [{ role: "user", content: `race-${i}` }],
        }),
      );
      const outs = await Promise.all(payloads);
      const ok = outs.filter((o) => o.status === 200).length;
      const blocked = outs.filter((o) => o.status === 429).length;
      const acc = guard.getAccounting();
      check(
        "concurrent-exactly-one-upstream",
        mock.state.chat_completions === 1 &&
          acc.upstream_generation_requests === 1 &&
          ok === 1 &&
          blocked === 7,
        `up=${mock.state.chat_completions} ok=${ok} blocked=${blocked}`,
      );
    } finally {
      await guard.close();
      await mock.close();
    }
  }

  // 4: failed first still consumes budget
  {
    const mock = await startMockUpstream({
      chat: (_req, res) => {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "boom" }));
      },
    });
    const guard = await startSingleGenerationGuard({ upstreamOrigin: mock.origin });
    try {
      const r1 = await postJson(guard.base_url, "/v1/chat/completions", {
        model: "m",
        messages: [{ role: "user", content: "fail" }],
      });
      const r2 = await postJson(guard.base_url, "/v1/chat/completions", {
        model: "m",
        messages: [{ role: "user", content: "retry" }],
      });
      check(
        "failed-first-consumes-budget",
        r1.status === 500 &&
          mock.state.chat_completions === 1 &&
          r2.status === 429 &&
          mock.state.chat_completions === 1,
        `r1=${r1.status} r2=${r2.status} up=${mock.state.chat_completions}`,
      );
    } finally {
      await guard.close();
      await mock.close();
    }
  }

  // 5: streaming passthrough, still one generation
  {
    const mock = await startMockUpstream({
      chat: (_req, res) => {
        res.writeHead(200, {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
        });
        res.write('data: {"delta":"a"}\n\n');
        res.write('data: {"delta":"b"}\n\n');
        res.write("data: [DONE]\n\n");
        res.end();
      },
    });
    const guard = await startSingleGenerationGuard({ upstreamOrigin: mock.origin });
    try {
      const res = await fetch(`${guard.base_url}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: "m",
          stream: true,
          messages: [{ role: "user", content: "stream" }],
        }),
      });
      const text = await res.text();
      const r2 = await postJson(guard.base_url, "/v1/chat/completions", {
        model: "m",
        messages: [{ role: "user", content: "after-stream" }],
      });
      check(
        "streaming-passthrough-one-gen",
        res.status === 200 &&
          text.includes("data:") &&
          text.includes("[DONE]") &&
          mock.state.chat_completions === 1 &&
          r2.status === 429,
        `status=${res.status} up=${mock.state.chat_completions} r2=${r2.status}`,
      );
    } finally {
      await guard.close();
      await mock.close();
    }
  }

  // 6: /v1/models free
  {
    const mock = await startMockUpstream();
    const guard = await startSingleGenerationGuard({ upstreamOrigin: mock.origin });
    try {
      const a = await getJson(guard.base_url, "/v1/models");
      const b = await getJson(guard.base_url, "/v1/models");
      const acc = guard.getAccounting();
      check(
        "models-probe-budget-free",
        a.status === 200 &&
          b.status === 200 &&
          mock.state.models === 2 &&
          acc.upstream_generation_requests === 0 &&
          acc.informational_requests_forwarded === 2,
        JSON.stringify(acc),
      );
    } finally {
      await guard.close();
      await mock.close();
    }
  }

  // 7–9: alternate / unknown rejected
  {
    const mock = await startMockUpstream();
    const guard = await startSingleGenerationGuard({ upstreamOrigin: mock.origin });
    try {
      const r1 = await postJson(guard.base_url, "/v1/responses", { input: "x" });
      const r2 = await postJson(guard.base_url, "/api/generate", { prompt: "x" });
      const r3 = await postJson(guard.base_url, "/v1/weird", { x: 1 });
      const acc = guard.getAccounting();
      check(
        "alternate-generation-endpoints-blocked",
        r1.status === 403 &&
          r2.status === 403 &&
          r3.status === 403 &&
          mock.state.responses === 0 &&
          mock.state.generate === 0 &&
          mock.state.chat_completions === 0 &&
          acc.upstream_generation_requests === 0,
        `r1=${r1.status} r2=${r2.status} r3=${r3.status} acc=${JSON.stringify(acc)}`,
      );
    } finally {
      await guard.close();
      await mock.close();
    }
  }

  // 12: secret headers rejected without persisting value
  {
    const mock = await startMockUpstream();
    const guard = await startSingleGenerationGuard({ upstreamOrigin: mock.origin });
    try {
      const r = await postJson(
        guard.base_url,
        "/v1/chat/completions",
        { model: "m", messages: [{ role: "user", content: "x" }] },
        { Authorization: "Bearer secret-token-SHOULD-NOT-PERSIST" },
      );
      const acc = guard.getAccounting();
      const accText = JSON.stringify(acc);
      check(
        "secret-header-rejection",
        r.status === 403 &&
          mock.state.chat_completions === 0 &&
          acc.secret_bearing_requests_rejected === 1 &&
          !accText.includes("secret-token"),
        accText,
      );
    } finally {
      await guard.close();
      await mock.close();
    }
  }

  // Final invariant sweep across a mixed sequence
  {
    const mock = await startMockUpstream();
    const guard = await startSingleGenerationGuard({ upstreamOrigin: mock.origin });
    try {
      await getJson(guard.base_url, "/v1/models");
      await postJson(guard.base_url, "/v1/chat/completions", {
        model: "m",
        messages: [{ role: "user", content: "one" }],
      });
      await postJson(guard.base_url, "/v1/chat/completions", {
        model: "m",
        messages: [{ role: "user", content: "two" }],
      });
      await postJson(guard.base_url, "/api/generate", { prompt: "no" });
      await getJson(guard.base_url, "/v1/models");
      const acc = guard.getAccounting();
      check(
        "invariant-upstream-le-1",
        acc.upstream_generation_requests <= 1 && mock.state.chat_completions <= 1,
        JSON.stringify(acc),
      );
      check("body-persistence-absent", !accountingHasBodies(acc), JSON.stringify(acc));
    } finally {
      await guard.close();
      await mock.close();
    }
  }

  const failed = results.filter((r) => !r.pass);
  const summary = {
    suite: "opencode-single-generation-guard",
    root: ROOT,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  };
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((err) => {
  process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
  process.exit(1);
});

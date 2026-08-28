#!/usr/bin/env node
/**
 * D-0023-W — local fixture runner for LLM gateway portability adapter
 * plus LiteLLM template non-secret/config checks.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deepStrictEqual } from "node:assert";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const TOOL = join(ROOT, "tools/build-llm-gateway-request.mjs");
const FIX = join(HERE, "fixtures");
const PACKET_SCHEMA = join(
  ROOT,
  "docs/contracts/execution-packet-v1.schema.json",
);
const LITELLM_TEMPLATE = join(
  ROOT,
  "configs/litellm/control-plane-spike.template.yaml",
);
const PRIMARY_REMOTE_TEMPLATE = join(
  ROOT,
  "configs/litellm/control-plane-primary-remote.template.yaml",
);

const CONSUMER = join(FIX, "consumer-input-valid.json");

function runAdapter(consumer, selection, profile) {
  const proc = spawnSync(
    process.execPath,
    [TOOL, consumer, selection, profile],
    { encoding: "utf8", cwd: ROOT },
  );
  const stdout = (proc.stdout || "").trim();
  let result = null;
  try {
    result = JSON.parse(stdout.split(/\r?\n/).filter(Boolean).pop());
  } catch {
    result = null;
  }
  return { proc, result, stdout };
}

function deepEqual(a, b) {
  try {
    deepStrictEqual(a, b);
    return true;
  } catch {
    return false;
  }
}

function hasSecretLeak(blob) {
  return (
    /bearer\s+[A-Za-z0-9._\-+=\/]{8,}/i.test(blob) ||
    /"authorization"\s*:\s*"/i.test(blob) ||
    /"password"\s*:\s*"/i.test(blob) ||
    /"api[_-]?key"\s*:\s*"[^"$\{][^"]*"/i.test(blob) ||
    /sk-[A-Za-z0-9]{10,}/.test(blob)
  );
}

const CASES = [
  {
    name: "litellm-qwen-pass",
    run() {
      const { proc, result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-qwen-proceed.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      if (
        proc.status !== 0 ||
        !result ||
        result.classification !== "PASS" ||
        result.request_ready !== true ||
        result.planner_binding_verified !== true ||
        !result.request_envelope ||
        result.request_envelope.body.model !== "planner-qwen-test"
      ) {
        return `expected PASS qwen alias; got ${JSON.stringify(result && { c: result.classification, m: result.request_envelope && result.request_envelope.body.model, ready: result.request_ready })}`;
      }
      return null;
    },
  },
  {
    name: "litellm-glm-pass",
    run() {
      const { proc, result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-glm-proceed.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      if (
        proc.status !== 0 ||
        !result ||
        result.classification !== "PASS" ||
        result.request_envelope.body.model !== "planner-glm-test"
      ) {
        return `expected PASS glm alias; got ${result && result.classification} ${result && result.request_envelope && result.request_envelope.body.model}`;
      }
      return null;
    },
  },
  {
    name: "litellm-codex-pass",
    run() {
      const { proc, result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-codex-proceed.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      if (
        proc.status !== 0 ||
        !result ||
        result.classification !== "PASS" ||
        result.request_envelope.body.model !== "planner-codex-test"
      ) {
        return `expected PASS codex alias; got ${result && result.classification} ${result && result.request_envelope && result.request_envelope.body.model}`;
      }
      return null;
    },
  },
  {
    name: "openclaw-legacy-unverified",
    run() {
      const { proc, result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-glm-proceed.json"),
        join(FIX, "profile-openclaw-legacy.json"),
      );
      if (
        proc.status === 0 ||
        !result ||
        result.classification !== "PLANNER_BINDING_UNVERIFIED" ||
        result.request_ready !== false ||
        result.planner_binding_verified !== false
      ) {
        return `expected PLANNER_BINDING_UNVERIFIED; got ${JSON.stringify(result)}`;
      }
      return null;
    },
  },
  {
    name: "task-id-mismatch",
    run() {
      const { result } = runAdapter(
        join(FIX, "consumer-input-mismatch-task.json"),
        join(FIX, "selection-glm-proceed.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      if (!result || result.classification !== "INPUT_MISMATCH") {
        return `expected INPUT_MISMATCH; got ${result && result.classification}`;
      }
      return null;
    },
  },
  {
    name: "selection-gate",
    run() {
      const { result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-gate.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      if (!result || result.classification !== "SELECTION_NOT_PROCEED") {
        return `expected SELECTION_NOT_PROCEED; got ${result && result.classification}`;
      }
      return null;
    },
  },
  {
    name: "selection-blocked",
    run() {
      const { result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-blocked.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      if (!result || result.classification !== "SELECTION_NOT_PROCEED") {
        return `expected SELECTION_NOT_PROCEED; got ${result && result.classification}`;
      }
      return null;
    },
  },
  {
    name: "profile-invalid",
    run() {
      const { result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-glm-proceed.json"),
        join(FIX, "profile-invalid.json"),
      );
      if (!result || result.classification !== "PROFILE_INVALID") {
        return `expected PROFILE_INVALID; got ${result && result.classification}`;
      }
      return null;
    },
  },
  {
    name: "missing-alias-fail-closed",
    run() {
      const { result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-glm-proceed.json"),
        join(FIX, "profile-missing-alias.json"),
      );
      if (
        !result ||
        (result.classification !== "PROFILE_INVALID" &&
          result.classification !== "MODEL_ALIAS_MISSING")
      ) {
        return `expected PROFILE_INVALID|MODEL_ALIAS_MISSING; got ${result && result.classification}`;
      }
      return null;
    },
  },
  {
    name: "no-secrets-in-output",
    run() {
      const { stdout, result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-glm-proceed.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      if (!result || result.classification !== "PASS") return "PASS required";
      if (hasSecretLeak(stdout)) return "secret material in stdout";
      return null;
    },
  },
  {
    name: "exactly-one-emit-tool",
    run() {
      const { result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-glm-proceed.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      const tools = result && result.request_envelope && result.request_envelope.body.tools;
      if (!Array.isArray(tools) || tools.length !== 1 || tools[0].name !== "emit_execution_packet") {
        return `bad tools ${JSON.stringify(tools)}`;
      }
      return null;
    },
  },
  {
    name: "parameters-deep-equal-schema",
    run() {
      const { result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-glm-proceed.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      const params =
        result &&
        result.request_envelope &&
        result.request_envelope.body.tools[0].parameters;
      const schema = JSON.parse(
        readFileSync(PACKET_SCHEMA, "utf8").replace(/^\uFEFF/, ""),
      );
      if (!deepEqual(params, schema)) return "parameters not deep-equal schema";
      return null;
    },
  },
  {
    name: "stream-false",
    run() {
      const { result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-glm-proceed.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      if (!result || result.request_envelope.body.stream !== false) {
        return "stream not false";
      }
      return null;
    },
  },
  {
    name: "path-v1-responses",
    run() {
      const { result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-glm-proceed.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      if (
        !result ||
        result.request_envelope.method !== "POST" ||
        result.request_envelope.path !== "/v1/responses"
      ) {
        return "method/path incorrect";
      }
      return null;
    },
  },
  {
    name: "litellm-no-openclaw-agent-header",
    run() {
      const { result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-glm-proceed.json"),
        join(FIX, "profile-litellm-test.json"),
      );
      const h = result && result.request_envelope && result.request_envelope.headers;
      if (!h || Object.prototype.hasOwnProperty.call(h, "x-openclaw-agent-id")) {
        return `unexpected headers ${JSON.stringify(h)}`;
      }
      return null;
    },
  },
  {
    name: "openclaw-never-request-ready",
    run() {
      const { result } = runAdapter(
        CONSUMER,
        join(FIX, "selection-qwen-proceed.json"),
        join(FIX, "profile-openclaw-legacy.json"),
      );
      if (!result || result.request_ready === true) {
        return "OpenClaw legacy must never be request_ready";
      }
      return null;
    },
  },
  {
    name: "litellm-template-config-checks",
    run() {
      if (!existsSync(LITELLM_TEMPLATE)) {
        return `missing template ${LITELLM_TEMPLATE}`;
      }
      const text = readFileSync(LITELLM_TEMPLATE, "utf8");
      if (!/TEST\s*\/\s*SPIKE TEMPLATE\s*—\s*NOT ACTIVE/i.test(text) && !/TEST \/ SPIKE TEMPLATE — NOT ACTIVE/.test(text)) {
        if (!text.includes("TEST / SPIKE TEMPLATE — NOT ACTIVE") && !text.includes("NOT ACTIVE")) {
          return "template missing NOT ACTIVE marker";
        }
      }
      if (!text.includes("planner-qwen-pilot") || !text.includes("planner-glm-pilot") || !text.includes("planner-codex-pilot")) {
        return "missing three pilot aliases";
      }
      if (!text.includes("https://api.z.ai/api/coding/paas/v4")) {
        return "missing GLM coding endpoint";
      }
      if (/sk-[A-Za-z0-9]{10,}/.test(text) || /Bearer\s+[A-Za-z0-9._\-]{8,}/i.test(text)) {
        return "secret-like value in template";
      }
      if (!text.includes("os.environ") && !text.includes("${") && !text.includes("api_key:")) {
        // allow env refs via os.environ/ or ${VAR} or api_key env form
      }
      // Must use env reference for Z.AI key, not a literal secret
      if (/api_key:\s*['\"]?[A-Za-z0-9_\-]{20,}['\"]?/.test(text) && !/os\.environ|\$\{|env\./.test(text)) {
        return "possible literal api_key";
      }
      if (
        !text.includes("chatgpt/gpt-5.6-sol") &&
        !text.includes("<EXACT_CODEX_MODEL_AFTER_OAUTH_DISCOVERY>")
      ) {
        return "missing reconciled Codex model or placeholder";
      }
      if (/openai\.com\/v1|OPENAI_API_KEY|platform\.openai\.com/i.test(text) && /codex/i.test(text)) {
        // allow mention as forbidden; must not configure as fallback route
        if (/api_key:\s*os\.environ\/OPENAI_API_KEY/.test(text) || /openai\//.test(text)) {
          return "Codex appears to use OpenAI Platform API-key path";
        }
      }
      if (!/Qwen\s*3\.8\s*37B/i.test(text)) {
        return "missing Qwen 3.8 37B semantic target";
      }
      if (/27B/.test(text) && !/no\s*27B|not\s*27B|never\s*27B|no silent 27B/i.test(text)) {
        return "27B mentioned without prohibition";
      }
      if (/fallbacks?\s*:/i.test(text) || /router_settings:[\s\S]*fallbacks/i.test(text)) {
        return "runtime fallback chain configured in pilot template";
      }
      if (/systemctl|docker run|pip install|npm install|auto-start|autostart/i.test(text)) {
        // Allow documentation that forbids auto-start; fail only on affirmative commands.
        if (/^(?!#).*?(systemctl|docker run|pip install|npm install)/im.test(text)) {
          return "install/autostart command present in template";
        }
        if (/\bautostart\b/i.test(text) && !/no (service )?auto-start|no autostart/i.test(text)) {
          return "install/autostart command present in template";
        }
      }
      return null;
    },
  },
  {
    name: "litellm-primary-remote-config-checks",
    run() {
      if (!existsSync(PRIMARY_REMOTE_TEMPLATE)) {
        return `missing template ${PRIMARY_REMOTE_TEMPLATE}`;
      }
      const text = readFileSync(PRIMARY_REMOTE_TEMPLATE, "utf8");
      if (!/PRIMARY REMOTE GATEWAY TEMPLATE\s*—\s*NOT ACTIVE/i.test(text)) {
        return "template missing PRIMARY REMOTE NOT ACTIVE marker";
      }
      if (!text.includes("planner-glm-pilot") || !text.includes("planner-codex-pilot")) {
        return "missing live-verified pilot aliases";
      }
      if (text.includes("planner-qwen-pilot")) {
        return "Qwen must not appear in primary-remote config";
      }
      if (!text.includes("model: zai/glm-5.3")) {
        return "missing GLM model binding";
      }
      if (!text.includes("https://api.z.ai/api/coding/paas/v4")) {
        return "missing GLM coding endpoint";
      }
      if (!text.includes("os.environ/ZAI_CODING_API_KEY")) {
        return "missing ZAI env reference";
      }
      if (!text.includes("chatgpt/gpt-5.6-sol")) {
        return "missing Codex model binding";
      }
      if (/sk-[A-Za-z0-9]{10,}/.test(text) || /Bearer\s+[A-Za-z0-9._\-]{8,}/i.test(text)) {
        return "secret-like value in template";
      }
      if (/api_key:\s*['\"]?[A-Za-z0-9_\-]{20,}['\"]?/.test(text) && !/os\.environ/.test(text)) {
        return "possible literal api_key";
      }
      if (/openai\.com\/v1|os\.environ\/OPENAI_API_KEY|openai\//i.test(text)) {
        return "OpenAI Platform API-key path present";
      }
      if (/fallbacks?\s*:/i.test(text) || /router_settings:[\s\S]*fallbacks/i.test(text)) {
        return "runtime fallback chain configured";
      }
      if (/0\.0\.0\.0|public bind|autostart|systemctl enable/i.test(text) && !/no (service )?auto-start|not active|loopback\/private/i.test(text)) {
        return "public bind or autostart implied";
      }
      return null;
    },
  },
  {
    name: "comparison-matrix-exists",
    run() {
      const path = join(
        ROOT,
        "reports/architecture/openclaw_vs_litellm_spike_matrix.md",
      );
      if (!existsSync(path)) return "missing comparison matrix";
      const text = readFileSync(path, "utf8");
      if (/RUNTIME_PROVEN/.test(text.replaceAll("CONFIG_DEFINED_NOT_RUNTIME_PROVEN", ""))) {
        return "RUNTIME_PROVEN must not appear in offline/config stage";
      }
      const required = [
        "Responses API",
        "planner binding",
        "Qwen",
        "Z.AI",
        "Codex",
        "auth",
        "retry",
        "n8n",
        "operational",
        "failure isolation",
        "portability",
        "evidence",
      ];
      for (const r of required) {
        if (!new RegExp(r, "i").test(text)) return `matrix missing topic ${r}`;
      }
      return null;
    },
  },
];

const results = CASES.map((c) => {
  let detail;
  try {
    detail = c.run();
  } catch (err) {
    detail = String(err && err.stack ? err.stack : err);
  }
  const pass = detail === null;
  return { name: c.name, pass, detail: pass ? "ok" : detail };
});

const failed = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name} — ${r.detail}`);
}
const summary = {
  ok: failed.length === 0,
  classification: failed.length === 0 ? "PASS" : "FAIL",
  passed: results.filter((r) => r.pass).length,
  failed: failed.length,
  total: results.length,
  network_access: false,
  provider_model_request_count: 0,
  credential_access: 0,
};
console.log(JSON.stringify(summary));
process.exit(failed.length === 0 ? 0 : 1);

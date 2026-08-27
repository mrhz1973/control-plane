#!/usr/bin/env node
/**
 * D-0020-W — Offline planner consumer round-trip harness.
 *
 * Composes existing tools only (no HTTP, no provider, no OpenClaw runtime):
 *   consumer_input
 *     → tools/build-openclaw-responses-request.mjs   (D-0019)
 *     → synthetic OpenResponses fixture (not model output)
 *     → tools/validate-openclaw-planner-response-gate.mjs (D-0018)
 *     → tools/validate-execution-packet-v1.mjs (D-0017)
 *
 * Plus fail-closed tamper cases against the response gate.
 */
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const FIX = join(HERE, "fixtures");
const ARTIFACTS = join(HERE, "artifacts");

const BUILDER = join(ROOT, "tools/build-openclaw-responses-request.mjs");
const GATE = join(ROOT, "tools/validate-openclaw-planner-response-gate.mjs");
const PACKET_VALIDATOR = join(ROOT, "tools/validate-execution-packet-v1.mjs");

const CONSUMER_INPUT = join(FIX, "consumer-input-valid.json");
const SYNTHETIC_RESPONSE = join(FIX, "synthetic-response-valid.json");
const SYNTHETIC_PACKET = join(FIX, "synthetic-packet-valid.json");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function runNode(args) {
  const proc = spawnSync(process.execPath, args, {
    encoding: "utf8",
    cwd: ROOT,
  });
  const stdout = (proc.stdout || "").trim();
  let result = null;
  try {
    const line = stdout.split(/\r?\n/).filter(Boolean).pop();
    result = line ? JSON.parse(line) : null;
  } catch {
    result = null;
  }
  return { status: proc.status, result, stdout, stderr: proc.stderr || "" };
}

function passFail(ok) {
  return ok ? "PASS" : "FAIL";
}

function hasSecretLeak(blob) {
  if (/bearer\s+[A-Za-z0-9._\-+=\/]{8,}/i.test(blob)) return true;
  if (/"authorization"\s*:\s*"/i.test(blob)) return true;
  if (/"password"\s*:\s*"/i.test(blob)) return true;
  if (/"api[_-]?key"\s*:\s*"/i.test(blob)) return true;
  if (/"access_token"\s*:\s*"/i.test(blob)) return true;
  if (/"refresh_token"\s*:\s*"/i.test(blob)) return true;
  if (/oauth/i.test(blob) && /"[^"]*token[^"]*"\s*:\s*"[^"]+"/i.test(blob)) {
    return true;
  }
  return false;
}

function writeResponseWithPacket(path, packet, functionName = "emit_execution_packet") {
  const response = {
    id: "resp_synthetic_d0020_tamper_fixture",
    object: "response",
    status: "completed",
    fixture_kind: "synthetic_openresponses_offline_fixture",
    note: "D-0020-W tamper fixture only. Not provider/model/OpenClaw runtime evidence.",
    output: [
      {
        type: "function_call",
        name: functionName,
        arguments: JSON.stringify(packet),
      },
    ],
  };
  writeFileSync(path, JSON.stringify(response, null, 2) + "\n");
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

mkdirSync(ARTIFACTS, { recursive: true });

const summary = {
  ok: false,
  classification: "FAIL",
  roundtrip: "FAIL",
  request_builder: "FAIL",
  response_gate: "FAIL",
  packet_validator: "FAIL",
  tamper_tests_passed: 0,
  tamper_tests_total: 0,
  network_access: false,
  provider_model_request_count: 0,
  credential_access: 0,
  fixture_kind: "synthetic_openresponses_offline_fixture",
  note: "Offline composition only; not Phase C / provider / OpenClaw runtime success",
  details: {},
};

try {
  // --- Phase 1: consumer_input fixture ---
  const consumer = readJson(CONSUMER_INPUT);
  const requiredConsumer = [
    "task_id",
    "source_backlog_ref",
    "source_backlog_commit",
    "repository",
    "branch_target",
    "goal",
    "risk_hint",
    "complexity_hint",
    "planner_requested",
    "allowed_paths",
    "forbidden_paths",
    "acceptance_seed",
    "validation_seed",
    "hard_constraints",
  ];
  for (const k of requiredConsumer) {
    if (!Object.prototype.hasOwnProperty.call(consumer, k)) {
      throw new Error(`consumer_input missing required field ${k}`);
    }
  }

  // --- Phase 2: real D-0019 request builder ---
  const built = runNode([BUILDER, CONSUMER_INPUT]);
  const env = built.result && built.result.envelope;
  const builderOk =
    built.status === 0 &&
    built.result &&
    built.result.ok === true &&
    built.result.classification === "PASS" &&
    env &&
    env.method === "POST" &&
    env.path === "/v1/responses" &&
    env.body &&
    env.body.model === "openclaw/default" &&
    env.body.stream === false &&
    env.headers &&
    env.headers["x-openclaw-agent-id"] === "main" &&
    Array.isArray(env.body.tools) &&
    env.body.tools.length === 1 &&
    env.body.tools[0].name === "emit_execution_packet" &&
    env.body.tool_choice &&
    env.body.tool_choice.type === "function" &&
    env.body.tool_choice.name === "emit_execution_packet" &&
    !Object.keys(env.headers || {}).some((k) => k.toLowerCase() === "authorization") &&
    !(
      Object.prototype.hasOwnProperty.call(env.body, "provider") ||
      Object.prototype.hasOwnProperty.call(env.body, "provider_override")
    ) &&
    !hasSecretLeak(built.stdout);

  summary.request_builder = passFail(builderOk);
  summary.details.request_builder = {
    exit: built.status,
    classification: built.result && built.result.classification,
    ok: builderOk,
  };
  if (!builderOk) {
    throw new Error("D-0019 request builder phase failed");
  }

  // --- Phase 3/4: synthetic response → real D-0018 gate ---
  const gate = runNode([GATE, SYNTHETIC_RESPONSE, CONSUMER_INPUT]);
  const gateOk =
    gate.status === 0 &&
    gate.result &&
    gate.result.ok === true &&
    gate.result.classification === "PASS";
  summary.response_gate = passFail(gateOk);
  summary.details.response_gate = {
    exit: gate.status,
    classification: gate.result && gate.result.classification,
    ok: gateOk,
  };
  if (!gateOk) {
    throw new Error(
      `D-0018 response gate phase failed: ${gate.result && gate.result.classification} ${gate.result && gate.result.reason}`,
    );
  }

  // --- Phase 5: extract arguments → real D-0017 validator ---
  const responseObj = readJson(SYNTHETIC_RESPONSE);
  const fc = responseObj.output.find(
    (o) => o && o.type === "function_call" && o.name === "emit_execution_packet",
  );
  if (!fc) {
    throw new Error("synthetic response missing emit_execution_packet");
  }
  const packetArgs =
    typeof fc.arguments === "string" ? JSON.parse(fc.arguments) : fc.arguments;
  const extractedPacketPath = join(ARTIFACTS, "extracted-packet.json");
  writeFileSync(extractedPacketPath, JSON.stringify(packetArgs, null, 2) + "\n");

  // sanity: extracted matches committed synthetic packet fixture
  const committedPacket = readJson(SYNTHETIC_PACKET);
  if (JSON.stringify(packetArgs) !== JSON.stringify(committedPacket)) {
    throw new Error("extracted packet differs from synthetic-packet-valid.json");
  }

  const packetVal = runNode([PACKET_VALIDATOR, extractedPacketPath]);
  const packetOk =
    packetVal.status === 0 &&
    packetVal.result &&
    packetVal.result.ok === true &&
    packetVal.result.classification === "PASS";
  summary.packet_validator = passFail(packetOk);
  summary.details.packet_validator = {
    exit: packetVal.status,
    classification: packetVal.result && packetVal.result.classification,
    ok: packetOk,
    extracted_packet_path: extractedPacketPath,
  };
  if (!packetOk) {
    throw new Error("D-0017 packet validator phase failed");
  }

  summary.roundtrip = "PASS";

  // --- Tamper tests (response gate fail-closed) ---
  const basePacket = clone(committedPacket);
  const tampers = [
    {
      name: "task_id_modified",
      expectClassification: "INPUT_MISMATCH",
      prepare(packet) {
        packet.task_id = "D-9999-X";
        return { packet, functionName: "emit_execution_packet" };
      },
    },
    {
      name: "hard_constraints_reordered",
      expectClassification: "HARD_CONSTRAINT_MISMATCH",
      prepare(packet) {
        packet.hard_constraints = [...packet.hard_constraints].reverse();
        return { packet, functionName: "emit_execution_packet" };
      },
    },
    {
      name: "planner_requested_modified",
      expectClassification: "PLANNER_MISMATCH",
      prepare(packet) {
        packet.planner.requested = "codex";
        packet.planner.used = "codex";
        return { packet, functionName: "emit_execution_packet" };
      },
    },
    {
      name: "function_name_changed",
      expectClassification: "FUNCTION_CALL_NAME",
      prepare(packet) {
        return { packet, functionName: "emit_other_packet" };
      },
    },
    {
      name: "packet_schema_invalid",
      expectClassification: "PACKET_SCHEMA_INVALID",
      prepare(packet) {
        delete packet.goal;
        return { packet, functionName: "emit_execution_packet" };
      },
    },
    {
      name: "request_builder_secret_boundary",
      expectClassification: null,
      kind: "secret_boundary",
      prepare() {
        return null;
      },
    },
  ];

  summary.tamper_tests_total = tampers.length;
  const tamperDetails = [];

  for (const t of tampers) {
    if (t.kind === "secret_boundary") {
      const leak = hasSecretLeak(built.stdout);
      const headers = env.headers || {};
      const authHeader = Object.keys(headers).some(
        (k) => k.toLowerCase() === "authorization",
      );
      const ok =
        !leak &&
        !authHeader &&
        env.auth &&
        env.auth.authorization_value_included === false &&
        env.auth.credential_required === true;
      if (ok) summary.tamper_tests_passed += 1;
      tamperDetails.push({
        name: t.name,
        pass: ok,
        detail: ok
          ? "ok"
          : "secret/Authorization material present beyond non-secret auth marker",
      });
      continue;
    }

    const prepared = t.prepare(clone(basePacket));
    const path = join(ARTIFACTS, `tamper-${t.name}.json`);
    writeResponseWithPacket(path, prepared.packet, prepared.functionName);
    const res = runNode([GATE, path, CONSUMER_INPUT]);
    const ok =
      res.status !== 0 &&
      res.result &&
      res.result.ok === false &&
      res.result.classification === t.expectClassification;
    if (ok) summary.tamper_tests_passed += 1;
    tamperDetails.push({
      name: t.name,
      pass: ok,
      expected: t.expectClassification,
      got: res.result && res.result.classification,
      reason: res.result && res.result.reason,
    });
  }

  summary.details.tamper_tests = tamperDetails;

  const allTamperPass =
    summary.tamper_tests_passed === summary.tamper_tests_total;
  const allPass =
    summary.roundtrip === "PASS" &&
    summary.request_builder === "PASS" &&
    summary.response_gate === "PASS" &&
    summary.packet_validator === "PASS" &&
    allTamperPass;

  summary.ok = allPass;
  summary.classification = allPass ? "PASS" : "FAIL";
} catch (err) {
  summary.ok = false;
  summary.classification = "FAIL";
  summary.details.error = String(err && err.message ? err.message : err);
} finally {
  // Keep artifacts for evidence inspection; remove only if empty later.
}

process.stdout.write(`${JSON.stringify(summary)}\n`);
process.exit(summary.ok ? 0 : 1);

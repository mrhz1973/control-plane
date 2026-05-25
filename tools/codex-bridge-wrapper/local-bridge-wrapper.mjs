#!/usr/bin/env node
/**
 * Local bridge wrapper v1 — fail-closed pre-gates + optional Codex read-only path.
 * Node.js built-ins only. No n8n, OpenClaw, or repo mutation by wrapper.
 */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const WRAPPER_VERSION = "local-bridge-wrapper-v1";
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const FORBIDDEN_SECRET_KEYS = new Set([
  "provider_api_key",
  "oauth_token",
  "webhook_url",
  "chat_id",
  "auth_url",
  "tokenized_url",
]);

const FORBIDDEN_ACTIONS = new Set([
  "n8n_invocation",
  "workflow_40_mutation",
  "workflow_41_mutation",
  "pm34_unlock",
  "provider_api_key",
  "openclaw_agent_main",
  "codex_resume",
  "codex_repo_mutation",
  "cursor_worker_automation",
  "deploy",
  "tag",
  "rollback",
  "codex_execution",
]);

const ALLOWED_CONTEXT_PREFIXES = ["docs/"];
const FORBIDDEN_CONTEXT_FRAGMENTS = [".env", "secrets/", "workflow/", ".."];

const CODEX_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "verdict",
    "summary",
    "recommended_next_step",
    "no_runtime_confirmation",
    "blocked_actions",
    "risk_notes",
  ],
  properties: {
    verdict: { type: "string", enum: ["pass", "needs_human", "blocked", "fail"] },
    summary: { type: "string" },
    recommended_next_step: { type: "string" },
    no_runtime_confirmation: { type: "boolean" },
    blocked_actions: { type: "array", items: { type: "string" } },
    risk_notes: { type: "string" },
  },
};

const POST_GATE_UNSAFE_PATTERNS = [
  { pattern: /(?:invoke|call|wire|integrate|enable|run|connect)\s+(?:the\s+)?n8n/i, action: "n8n_invocation" },
  { pattern: /(?:edit|mutate|modify|touch|change)\s+workflow\s*(?:40|41)/i, action: "workflow_mutation" },
  { pattern: /(?:unlock|enable)\s+pm-?34/i, action: "pm34_unlock" },
  { pattern: /(?:add|configure|use|set)\s+(?:\w+\s+)?provider\s+api\s*key/i, action: "provider_api_key" },
  { pattern: /(?:retry|invoke|run)\s+openclaw\s+agent\s+main/i, action: "openclaw_agent_main" },
  { pattern: /(?:run|use)\s+codex\s+resume/i, action: "codex_resume" },
  { pattern: /(?:deploy|tag|rollback)\s+(?:to|the|production|now)/i, action: "deploy_tag_rollback" },
  { pattern: /(?:activate|enable|run)\s+cursor\s+worker/i, action: "cursor_worker_automation" },
  { pattern: /mutate\s+(?:the\s+)?repo/i, action: "codex_repo_mutation" },
];

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function collectSecretKeys(obj, path = "") {
  const found = [];
  if (obj === null || typeof obj !== "object") return found;
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_SECRET_KEYS.has(key)) found.push(fullPath);
    if (value !== null && typeof value === "object") {
      found.push(...collectSecretKeys(value, fullPath));
    }
  }
  return found;
}

function buildOutput(fixture, fixturePath, opts) {
  const {
    status,
    summary,
    recommendedNextStep,
    blockedActions,
    riskNotes,
    humanGateRequired,
    codexResult = null,
    trace = {},
  } = opts;

  return {
    status,
    request_id: fixture.request_id,
    summary,
    recommended_next_step: recommendedNextStep,
    proposed_prompt_for_cursor: null,
    human_gate_required: humanGateRequired,
    no_runtime_confirmation: true,
    blocked_actions: blockedActions,
    risk_notes: riskNotes,
    codex_result: codexResult,
    wrapper_trace: {
      wrapper_version: WRAPPER_VERSION,
      codex_invoked: trace.codex_invoked ?? false,
      n8n_invoked: false,
      openclaw_invoked: false,
      repo_mutation_attempted: false,
      network_attempted: false,
      codex_transport_used: trace.codex_transport_used ?? false,
      codex_workdir_is_temp: trace.codex_workdir_is_temp ?? false,
      codex_resume_used: false,
      fixture_path: fixturePath,
    },
  };
}

function emit(output) {
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

function validateContextRefs(contextRefs) {
  if (!Array.isArray(contextRefs) || contextRefs.length === 0) {
    return { ok: false, reason: "context_refs must be a non-empty array" };
  }
  for (const ref of contextRefs) {
    if (typeof ref !== "string" || ref.trim() === "") {
      return { ok: false, reason: "context_refs must contain non-empty strings" };
    }
    if (isAbsolute(ref)) {
      return { ok: false, reason: `absolute path not allowed: ${ref}` };
    }
    if (ref.includes("\\")) {
      return { ok: false, reason: `backslash path not allowed: ${ref}` };
    }
    if (!ALLOWED_CONTEXT_PREFIXES.some((p) => ref.startsWith(p))) {
      return { ok: false, reason: `context ref not allowlisted: ${ref}` };
    }
    for (const frag of FORBIDDEN_CONTEXT_FRAGMENTS) {
      if (ref.includes(frag)) {
        return { ok: false, reason: `forbidden context fragment in ${ref}` };
      }
    }
    const fullPath = join(REPO_ROOT, ref);
    if (!fullPath.startsWith(REPO_ROOT)) {
      return { ok: false, reason: `path traversal detected: ${ref}` };
    }
    try {
      readFileSync(fullPath, "utf8");
    } catch {
      return { ok: false, reason: `context ref not readable: ${ref}` };
    }
  }
  return { ok: true };
}

function loadInlinedContext(contextRefs) {
  const parts = [];
  for (const ref of contextRefs) {
    const content = readFileSync(join(REPO_ROOT, ref), "utf8");
    parts.push(`===== BEGIN ${ref} =====\n${content}\n===== END ${ref} =====`);
  }
  return parts.join("\n\n");
}

function buildCodexPrompt(fixture, inlinedContext) {
  return [
    "You are a read-only bridge reasoning component for control-plane wrapper dry-run v1.",
    "",
    "ABSOLUTE RULES:",
    "- Read-only reasoning only. No tools. No shell. No file reads. No network. No repo mutation.",
    "- No n8n. No workflow 40/41. No PM-34. No provider API key. No OpenClaw agent main.",
    "- No Codex resume. No deploy/tag/rollback. No Cursor worker automation.",
    "- Output JSON only. Single turn. No preamble.",
    "",
    "TASK QUESTION:",
    fixture.task_question ?? "Confirm the next safe gate remains explicit and conservative.",
    "",
    "INLINED CONTEXT (do not read files on disk):",
    inlinedContext,
    "",
    "Respond with JSON matching the enforced schema.",
  ].join("\n");
}

function runCodexReadonly(prompt, tempDir) {
  const schemaPath = join(tempDir, "codex-output-schema.json");
  const lastMessagePath = join(tempDir, "codex-last-message.json");
  writeFileSync(schemaPath, JSON.stringify(CODEX_OUTPUT_SCHEMA, null, 2), "utf8");

  const args = [
    "exec",
    "--skip-git-repo-check",
    "--ephemeral",
    "--ignore-rules",
    "-s",
    "read-only",
    "--output-schema",
    schemaPath,
    "--output-last-message",
    lastMessagePath,
    "-C",
    tempDir,
    "-",
  ];

  const result = spawnSync("codex", args, {
    input: prompt,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    shell: process.platform === "win32",
  });

  if (result.error) {
    return { ok: false, reason: `codex spawn error: ${result.error.message}` };
  }
  if (result.status !== 0) {
    const errText = (result.stderr || result.stdout || "").slice(0, 500);
    return { ok: false, reason: `codex exit ${result.status}: ${errText}` };
  }

  let codexJson;
  try {
    const raw = readFileSync(lastMessagePath, "utf8");
    codexJson = JSON.parse(raw);
  } catch (err) {
    return { ok: false, reason: `codex output parse error: ${err.message}` };
  }

  return { ok: true, codexJson };
}

function validateCodexOutput(codexJson) {
  const required = CODEX_OUTPUT_SCHEMA.required;
  for (const key of required) {
    if (!(key in codexJson)) {
      return { ok: false, reason: `missing key: ${key}` };
    }
  }
  if (!["pass", "needs_human", "blocked", "fail"].includes(codexJson.verdict)) {
    return { ok: false, reason: `invalid verdict: ${codexJson.verdict}` };
  }
  if (codexJson.no_runtime_confirmation !== true) {
    return { ok: false, reason: "no_runtime_confirmation must be true" };
  }
  const step = String(codexJson.recommended_next_step ?? "");
  for (const { pattern, action } of POST_GATE_UNSAFE_PATTERNS) {
    if (pattern.test(step)) {
      return { ok: false, reason: `unsafe recommended_next_step: ${action}` };
    }
  }
  return { ok: true };
}

function mapCodexVerdictToStatus(verdict) {
  if (verdict === "pass") return "pass";
  if (verdict === "blocked") return "blocked";
  if (verdict === "fail") return "failed";
  return "needs_human";
}

function runtimePolicyAllowsCodexReadonly(rp) {
  return (
    rp.allows_runtime === true &&
    rp.allows_codex_readonly === true &&
    rp.allows_codex_execution === true &&
    rp.allows_n8n === false &&
    rp.allows_repo_mutation === false &&
    rp.allows_workflow_mutation === false &&
    rp.allows_pm34 === false
  );
}

function handleV0Path(fixture, fixturePath, requestedActions) {
  if (fixture.human_gate_state !== "approved_local_dry_run_only") {
    emit(
      buildOutput(fixture, fixturePath, {
        status: "needs_human",
        summary: "Human gate not approved for local dry-run v0",
        recommendedNextStep: "Use approved_local_dry_run_only or approved_codex_readonly_wrapper_dry_run_v1",
        blockedActions: ["proceed_without_human_gate"],
        riskNotes: `wrapper:preflight:human_gate_state:${fixture.human_gate_state}`,
        humanGateRequired: true,
      })
    );
    process.exit(0);
  }

  if (fixture.runtime_policy.allows_runtime !== true) {
    emit(
      buildOutput(fixture, fixturePath, {
        status: "needs_human",
        summary: "Runtime permission not granted in fixture",
        recommendedNextStep: "Obtain explicit runtime gate before Codex or n8n integration",
        blockedActions: [
          "n8n_invocation",
          "codex_execution",
          "codex_repo_mutation",
          "workflow_40_mutation",
          "workflow_41_mutation",
          "pm34_unlock",
        ],
        riskNotes: "wrapper:preflight:allows_runtime_false",
        humanGateRequired: true,
      })
    );
    process.exit(0);
  }

  emit(
    buildOutput(fixture, fixturePath, {
      status: "needs_human",
      summary: "Wrapper v0 path does not invoke Codex; success path requires separate gate",
      recommendedNextStep: "Open explicit gate for Codex-read-only wrapper dry-run",
      blockedActions: ["codex_execution"],
      riskNotes: "wrapper:v0:codex_not_invoked_by_design",
      humanGateRequired: true,
    })
  );
  process.exit(0);
}

function handleV1Path(fixture, fixturePath, requestedActions) {
  const rp = fixture.runtime_policy;

  if (fixture.human_gate_state !== "approved_codex_readonly_wrapper_dry_run_v1") {
    emit(
      buildOutput(fixture, fixturePath, {
        status: "needs_human",
        summary: "Human gate not approved for Codex-read-only wrapper dry-run v1",
        recommendedNextStep: "Set human_gate_state to approved_codex_readonly_wrapper_dry_run_v1",
        blockedActions: ["proceed_without_human_gate"],
        riskNotes: `wrapper:preflight:human_gate_state:${fixture.human_gate_state}`,
        humanGateRequired: true,
      })
    );
    process.exit(0);
  }

  if (!requestedActions.includes("codex_readonly_reasoning")) {
    emit(
      buildOutput(fixture, fixturePath, {
        status: "needs_human",
        summary: "Success fixture must request codex_readonly_reasoning",
        recommendedNextStep: "Add codex_readonly_reasoning to requested_actions",
        blockedActions: ["codex_readonly_reasoning_missing"],
        riskNotes: "wrapper:preflight:missing_codex_readonly_reasoning",
        humanGateRequired: true,
      })
    );
    process.exit(0);
  }

  if (!runtimePolicyAllowsCodexReadonly(rp)) {
    emit(
      buildOutput(fixture, fixturePath, {
        status: "blocked",
        summary: "runtime_policy does not allow read-only Codex path",
        recommendedNextStep: "Fix runtime_policy restrictive flags",
        blockedActions: ["codex_readonly_reasoning"],
        riskNotes: "wrapper:preflight:runtime_policy_invalid",
        humanGateRequired: true,
      })
    );
    process.exit(0);
  }

  const ctxCheck = validateContextRefs(fixture.context_refs);
  if (!ctxCheck.ok) {
    emit(
      buildOutput(fixture, fixturePath, {
        status: "blocked",
        summary: "Invalid context_refs",
        recommendedNextStep: "Fix context_refs to sanitized docs paths",
        blockedActions: ["invalid_context_refs"],
        riskNotes: `wrapper:preflight:${ctxCheck.reason}`,
        humanGateRequired: true,
      })
    );
    process.exit(0);
  }

  if (process.env.CONTROL_PLANE_ALLOW_CODEX_READONLY !== "1") {
    emit(
      buildOutput(fixture, fixturePath, {
        status: "needs_human",
        summary: "CONTROL_PLANE_ALLOW_CODEX_READONLY not set to 1",
        recommendedNextStep: "Set env CONTROL_PLANE_ALLOW_CODEX_READONLY=1 for authorized dry-run",
        blockedActions: ["codex_readonly_reasoning"],
        riskNotes: "wrapper:preflight:env_gate_missing",
        humanGateRequired: true,
      })
    );
    process.exit(0);
  }

  let tempDir;
  try {
    tempDir = mkdtempSync(join(tmpdir(), "codex-bridge-wrapper-"));
    const inlined = loadInlinedContext(fixture.context_refs);
    const prompt = buildCodexPrompt(fixture, inlined);
    const codexRun = runCodexReadonly(prompt, tempDir);

    if (!codexRun.ok) {
      emit(
        buildOutput(fixture, fixturePath, {
          status: "failed",
          summary: "Codex read-only invocation failed",
          recommendedNextStep: "Review Codex CLI auth and wrapper logs; fail closed",
          blockedActions: ["codex_readonly_reasoning"],
          riskNotes: `wrapper:codex:${codexRun.reason}`,
          humanGateRequired: true,
          trace: {
            codex_invoked: true,
            codex_transport_used: true,
            codex_workdir_is_temp: true,
          },
        })
      );
      process.exit(1);
    }

    const postCheck = validateCodexOutput(codexRun.codexJson);
    if (!postCheck.ok) {
      emit(
        buildOutput(fixture, fixturePath, {
          status: "needs_human",
          summary: "Codex output failed post-gate",
          recommendedNextStep: "Manual review required",
          blockedActions: codexRun.codexJson.blocked_actions ?? [],
          riskNotes: `wrapper:postgate:${postCheck.reason}`,
          humanGateRequired: true,
          codexResult: codexRun.codexJson,
          trace: {
            codex_invoked: true,
            codex_transport_used: true,
            codex_workdir_is_temp: true,
          },
        })
      );
      process.exit(0);
    }

    const status = mapCodexVerdictToStatus(codexRun.codexJson.verdict);
    emit(
      buildOutput(fixture, fixturePath, {
        status,
        summary: codexRun.codexJson.summary,
        recommendedNextStep: codexRun.codexJson.recommended_next_step,
        blockedActions: codexRun.codexJson.blocked_actions,
        riskNotes: codexRun.codexJson.risk_notes,
        humanGateRequired: status !== "blocked",
        codexResult: codexRun.codexJson,
        trace: {
          codex_invoked: true,
          codex_transport_used: true,
          codex_workdir_is_temp: true,
        },
      })
    );
    process.exit(0);
  } finally {
    if (tempDir) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  }
}

function main() {
  const fixtureArg = process.argv[2];
  if (!fixtureArg) {
    fail("Usage: node local-bridge-wrapper.mjs <fixture-path>");
  }

  const fixturePath = resolve(fixtureArg);
  let raw;
  try {
    raw = readFileSync(fixturePath, "utf8");
  } catch (err) {
    fail(`Cannot read fixture: ${err.message}`);
  }

  let fixture;
  try {
    fixture = JSON.parse(raw);
  } catch (err) {
    fail(`Invalid JSON fixture: ${err.message}`);
  }

  if (fixture === null || typeof fixture !== "object" || Array.isArray(fixture)) {
    fail("Fixture must be a JSON object");
  }

  if (typeof fixture.request_id !== "string" || fixture.request_id.trim() === "") {
    fail("request_id must be a non-empty string");
  }

  if (typeof fixture.task_type !== "string" || fixture.task_type.trim() === "") {
    fail("task_type must be a non-empty string");
  }

  if (fixture.runtime_policy === undefined || fixture.runtime_policy === null) {
    fail("runtime_policy must exist");
  }

  if (typeof fixture.runtime_policy !== "object" || Array.isArray(fixture.runtime_policy)) {
    fail("runtime_policy must be an object");
  }

  if (fixture.human_gate_state === undefined) {
    fail("human_gate_state must exist");
  }

  const secretKeys = collectSecretKeys(fixture);
  if (secretKeys.length > 0) {
    fail(`Forbidden secret fields present: ${secretKeys.join(", ")}`);
  }

  if (fixture.requested_actions !== undefined && !Array.isArray(fixture.requested_actions)) {
    fail("requested_actions must be an array if present");
  }

  const requestedActions = fixture.requested_actions ?? [];
  const forbiddenRequested = requestedActions.filter((a) => FORBIDDEN_ACTIONS.has(a));

  if (forbiddenRequested.length > 0) {
    emit(
      buildOutput(fixture, fixturePath, {
        status: "blocked",
        summary: "Fixture requests forbidden actions",
        recommendedNextStep: "Remove forbidden actions from fixture; do not proceed",
        blockedActions: forbiddenRequested,
        riskNotes: `wrapper:preflight:forbidden_actions:${forbiddenRequested.join(",")}`,
        humanGateRequired: true,
      })
    );
    process.exit(0);
  }

  if (fixture.human_gate_state === "approved_codex_readonly_wrapper_dry_run_v1") {
    handleV1Path(fixture, fixturePath, requestedActions);
  } else {
    handleV0Path(fixture, fixturePath, requestedActions);
  }
}

main();

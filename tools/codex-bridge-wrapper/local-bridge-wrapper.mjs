#!/usr/bin/env node
/**
 * Local bridge wrapper v0 — fail-closed deterministic pre-gates only.
 * No Codex, OpenClaw, n8n, network, or repo mutation.
 * Node.js built-ins only.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const WRAPPER_VERSION = "local-bridge-wrapper-v0";

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

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function collectSecretKeys(obj, path = "") {
  const found = [];
  if (obj === null || typeof obj !== "object") return found;
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_SECRET_KEYS.has(key)) {
      found.push(fullPath);
    }
    if (value !== null && typeof value === "object") {
      found.push(...collectSecretKeys(value, fullPath));
    }
  }
  return found;
}

function buildOutput(fixture, fixturePath, opts) {
  const { status, summary, recommendedNextStep, blockedActions, riskNotes, humanGateRequired } = opts;
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
    wrapper_trace: {
      wrapper_version: WRAPPER_VERSION,
      codex_invoked: false,
      n8n_invoked: false,
      openclaw_invoked: false,
      repo_mutation_attempted: false,
      network_attempted: false,
      fixture_path: fixturePath,
    },
  };
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

  if (fixture.requested_actions !== undefined) {
    if (!Array.isArray(fixture.requested_actions)) {
      fail("requested_actions must be an array if present");
    }
  }

  const requestedActions = fixture.requested_actions ?? [];
  const forbiddenRequested = requestedActions.filter((a) => FORBIDDEN_ACTIONS.has(a));

  if (forbiddenRequested.length > 0) {
    const output = buildOutput(fixture, fixturePath, {
      status: "blocked",
      summary: "Fixture requests forbidden actions",
      recommendedNextStep: "Remove forbidden actions from fixture; do not proceed",
      blockedActions: forbiddenRequested,
      riskNotes: `wrapper:preflight:forbidden_actions:${forbiddenRequested.join(",")}`,
      humanGateRequired: true,
    });
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    process.exit(0);
  }

  if (fixture.human_gate_state !== "approved_local_dry_run_only") {
    const output = buildOutput(fixture, fixturePath, {
      status: "needs_human",
      summary: "Human gate not approved for local dry-run",
      recommendedNextStep: "Obtain explicit human gate approval before wrapper dry-run",
      blockedActions: ["proceed_without_human_gate"],
      riskNotes: `wrapper:preflight:human_gate_state:${fixture.human_gate_state}`,
      humanGateRequired: true,
    });
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    process.exit(0);
  }

  if (fixture.runtime_policy.allows_runtime !== true) {
    const output = buildOutput(fixture, fixturePath, {
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
    });
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    process.exit(0);
  }

  // v0: even if fixture appears safe, never call Codex — emit needs_human
  const output = buildOutput(fixture, fixturePath, {
    status: "needs_human",
    summary: "Wrapper v0 does not invoke Codex; success path requires separate gate",
    recommendedNextStep: "Open explicit gate for Codex-read-only wrapper dry-run",
    blockedActions: ["codex_execution"],
    riskNotes: "wrapper:v0:codex_not_invoked_by_design",
    humanGateRequired: true,
  });
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  process.exit(0);
}

main();

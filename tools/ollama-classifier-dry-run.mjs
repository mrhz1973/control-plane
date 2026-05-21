#!/usr/bin/env node
/**
 * PM-17 — Ollama classifier dry-run (local only).
 * Classifier/router/risk scorer — NOT implementer.
 * Writes decision JSON to stdout.
 */
import { readFileSync } from "node:fs";
import { resolve, basename } from "node:path";

const DEFAULT_PLAN = "docs/plans/2026-05-21_2330_pm15-new-40-smoke.plan.md";
const REPO = "mrhz1973/control-plane";
const TIMEOUT_MS = 20_000;
const MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
const BASE =
  (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/$/, "");

const planPath = resolve(process.argv[2] || DEFAULT_PLAN);
const planText = readFileSync(planPath, "utf8");
const planRel = planPath.replace(/\\/g, "/").replace(/.*control-plane\//i, "") || planPath;

function buildClassifierPrompt(plan, rel) {
  return [
    "You are a CONTROL PLANE routing classifier. Output ONLY valid JSON, no markdown.",
    "Schema:",
    '{"schema_version":"pm17-classifier-v1","source":"ollama","task_type":"docs-only|runtime|unknown","risk":"low|medium|high","route":"cursor-control-plane|telegram-gate|manual-review","approval_required":boolean,"allowed_next_step":"string","blocked_reason":null|string,"notes":["string"]}',
    `repo: ${REPO}`,
    `plan_path: ${rel}`,
    "constraints: no provider API; no n8n edit; no GIS/DEV/Alina; classifier only.",
    "--- plan ---",
    plan.slice(0, 8000),
    "--- end ---",
  ].join("\n");
}

function mockDecision(plan, rel) {
  const lower = plan.toLowerCase();
  const docsOnly =
    lower.includes("smoke trigger only") ||
    lower.includes("no runtime change") ||
    lower.includes("docs-only") ||
    (lower.includes("status: smoke") && !lower.includes("implementer"));
  const runtimeHints =
    /activate|promot|import workflow|n8n ui edit|v5|webhook/i.test(plan);

  let task_type = "unknown";
  let risk = "medium";
  let route = "manual-review";
  let approval_required = true;
  let allowed_next_step = "manual review required";
  let blocked_reason = null;
  const notes = ["mock deterministic classifier (Ollama unavailable or timeout)"];

  if (docsOnly && !runtimeHints) {
    task_type = "docs-only";
    risk = "low";
    route = "cursor-control-plane";
    approval_required = false;
    allowed_next_step = "record or continue";
    notes.push("matched PM-15 smoke plan pattern");
  } else if (runtimeHints) {
    task_type = "runtime";
    risk = "high";
    route = "telegram-gate";
    approval_required = true;
    allowed_next_step = "await explicit runtime gate";
    blocked_reason = "runtime change implied in plan text";
  }

  return {
    schema_version: "pm17-classifier-v1",
    source: "mock",
    task_type,
    risk,
    route,
    approval_required,
    allowed_next_step,
    blocked_reason,
    notes,
    input: { repo: REPO, plan_path: rel, plan_file: basename(rel) },
  };
}

async function ollamaReachable() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3000);
  try {
    const r = await fetch(`${BASE}/api/tags`, { signal: ctrl.signal });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function classifyWithOllama(prompt) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        format: "json",
      }),
    });
    if (!r.ok) throw new Error(`ollama http ${r.status}`);
    const data = await r.json();
    const raw = (data.response || "").trim();
    const parsed = JSON.parse(raw);
    parsed.schema_version = parsed.schema_version || "pm17-classifier-v1";
    parsed.source = "ollama";
    return parsed;
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const rel = planRel.includes("docs/plans") ? planRel : `docs/plans/${basename(planPath)}`;
  const prompt = buildClassifierPrompt(planText, rel);

  let out;
  if (await ollamaReachable()) {
    try {
      out = await classifyWithOllama(prompt);
    } catch {
      out = mockDecision(planText, rel);
    }
  } else {
    out = mockDecision(planText, rel);
  }

  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

main().catch((err) => {
  const rel = planRel.includes("docs/plans") ? planRel : `docs/plans/${basename(planPath)}`;
  const out = mockDecision(planText, rel);
  out.notes = [...(out.notes || []), `error: ${err.message}`];
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  process.exit(0);
});

#!/usr/bin/env node
/**
 * Focused tests — v4-glm-quota-collector-windows-v1.
 * Structural checks only. Never prints credential values.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const results = [];

function check(name, pass, detail = "") {
  results.push({ name, pass: pass === true, detail: String(detail).slice(0, 240) });
}

const runnerPath = resolve(ROOT, "tools/run-v4-glm-quota-collector-windows-v1.ps1");
const managePath = resolve(ROOT, "tools/manage-v4-glm-quota-collector-windows-v1.ps1");
const runnerExists = existsSync(runnerPath);
const manageExists = existsSync(managePath);

check("runner-script-exists", runnerExists, runnerPath);
check("manage-script-exists", manageExists, managePath);

if (runnerExists) {
  const runner = readFileSync(runnerPath, "utf8");
  check("runner-resolves-repo-from-own-path", /\$PSScriptRoot/.test(runner) && !/C:\\Users\\mrhz/.test(runner));
  check("runner-fail-closed-on-missing-credential", /CREDENTIAL_ABSENT_FAIL_CLOSED/.test(runner) && /exit 2/.test(runner));
  check("runner-never-prints-credential-value", !/(Write-Host|Write-Output).*\$credValue/.test(runner) && !/(Write-Host|Write-Output).*\$envValue/.test(runner));
  check("runner-targets-quota-ingest-lane", /quota-ingest/.test(runner));
  check("runner-uses-existing-ingest-tool", /rt25-quota-ingest-glm-v1\.mjs/.test(runner));
  check("runner-auto-mode", /auto/.test(runner));
  check("runner-resolves-credential-by-name-only", /ZAI_API_KEY/.test(runner) && /ZHIPUAI_API_KEY/.test(runner));
}

if (manageExists) {
  const manage = readFileSync(managePath, "utf8");
  check("manage-task-name-canonical", /ControlPlane-V4-GlmQuotaCollector/.test(manage));
  check("manage-4-minute-repetition", /New-TimeSpan\s+-Minutes\s+4/.test(manage));
  check("manage-validate-read-only-presence-booleans", /Validate/.test(manage) && /credential_present=/.test(manage));
  check("manage-status-read-only", /Status/.test(manage) && /lastResult=/.test(manage));
  check("manage-working-directory-repo-root", /WorkingDirectory\s+\$repoRoot/.test(manage));
  check("manage-run-as-current-user", /USERDOMAIN/.test(manage) && /USERNAME/.test(manage));
  check("manage-install-refuses-without-credential", /FAIL_CLOSED_NO_CREDENTIAL/.test(manage));
  check("manage-modes", /Validate/.test(manage) && /Install/.test(manage) && /Status/.test(manage) && /Uninstall/.test(manage));
}

const failed = results.filter((r) => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"} ${r.name}${r.pass ? "" : ` — ${r.detail}`}`);
}
console.log(JSON.stringify({
  ok: failed.length === 0,
  passed: results.length - failed.length,
  failed: failed.length,
  total: results.length,
}));
process.exit(failed.length === 0 ? 0 : 1);

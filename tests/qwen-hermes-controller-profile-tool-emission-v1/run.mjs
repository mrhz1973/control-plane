import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const report = fs.readFileSync(path.join(root, "reports/architecture/v4_qwen_hermes_controller_profile_tool_emission_qualification_v1.md"), "utf8");
const policy = JSON.parse(fs.readFileSync(path.join(root, "configs/resources/qwen-local-model-policy.json"), "utf8"));
const roles = JSON.parse(fs.readFileSync(path.join(root, "configs/resources/qwen-role-qualification.json"), "utf8"));
let checks = 0;
const has = (value) => { checks += 1; assert.ok(report.includes(value), `missing ${value}`); };

for (const value of [
  "TASK_REF=V4_QWEN_HERMES_CONTROLLER_PROFILE_TOOL_EMISSION_QUALIFICATION_V1",
  "BASE_HEAD=78c1c9d39ed01776bfa0086c53ee5582adba5aa7",
  "FAILED_RUN_PROFILE_ID=qwen38-opus-q3-opencode-64k",
  "FAILED_RUN_CONTROL_PLANE_ELIGIBLE=NO",
  "FAILED_RUN_TOOL_COUNT_PRESENTED=12",
  "FAILED_RUN_TOOL_CALL_COUNT=0",
  "TOOLS_PRESENTED_BUT_MODEL_DID_NOT_CALL=YES",
  "AGENT24K_PROFILE_ID=qwen38-opus-q3-agent-24k",
  "AGENT24K_CONTROL_PLANE_ELIGIBLE=YES",
  "AGENT24K_TOOL_SCHEMA_PRESENTED=YES",
  "AGENT24K_TOOL_CHOICE=auto",
  "AGENT24K_FINISH_REASON=tool_calls",
  "AGENT24K_TOOL_CALL_COUNT=1",
  "AGENT24K_TOOL_EMISSION_RESULT=PASS",
  "DAILY16K_COMPARISON_RUN=NO",
  "QWEN_GENERATIONS=1",
  "CHATGPT_WEB_SENDS=0",
  "GLM_CALLS=0",
  "CODEX_CALLS=0",
  "OPENAI_API_CALLS=0",
  "PRODUCTION_DISPATCH=0",
  "BROWSER_INTERACTION=0",
  "PHASE_C=PASS",
  "PHASE_D=OPEN",
  "NEXT=V4_HERMES_CONTROLLER_AGENT24K_NATIVE_BROWSER_SEND_QUALIFICATION_V1",
]) has(value);

checks += 1; assert.equal(policy.next_wf40_executor.profile_id, "qwen38-opus-q3-agent-24k");
checks += 1; assert.equal(roles.profiles["qwen38-opus-q3-agent-24k"].qualification.FAST_AGENT, "QUALIFIED");
checks += 1; assert.equal(policy.role_qualification.FAST_AGENT, "QUALIFIED");
checks += 1; assert.ok(!report.includes("Qualification probe only"));
checks += 1; assert.ok(!report.includes("tool_choice=specific"));

console.log(`QWEN_HERMES_CONTROLLER_PROFILE_CHECKS=${checks}`);
console.log("FOCUSED_TESTS=PASS");

#!/usr/bin/env node
import assert from "node:assert/strict";
import { collectQuotaObservatory } from "../../tools/local-dev-resource-observatory-v1.mjs";
import {
  buildResourceObservatory,
  collectQwenResources,
  collectVpsNewResources,
  createCanonicalVpsSshRunner,
  resetVpsObservationCache,
  assertVpsCommandSafe,
  VPS_SAFE_REMOTE_COMMANDS,
} from "../../tools/local-dev-resource-observatory-v1.mjs";

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, pass: true });
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    results.push({ name, pass: false, detail: String(error?.message || error) });
    process.stdout.write(`FAIL ${name}: ${error?.message || error}\n`);
  }
}

await test("verified Qwen HTTP failure is REAL_FAILURE, not idle", async () => {
  const qwen = await collectQwenResources({
    probeQwen: async () => ({ reachable: false, probe_status: "HTTP_FAILURE", error: "HTTP_502", models: [], profile_status: "unreachable" }),
  });
  assert.equal(qwen.health_state, "REAL_FAILURE");
  assert.equal(qwen.observation_state, "OBSERVED");
  assert.equal(qwen.failure_verified, true);
  assert.equal(qwen.reason_code, "QWEN_ENDPOINT_UNHEALTHY");
});

await test("Qwen reachable empty catalog is AVAILABLE IDLE and quota N/A", async () => {
  const qwen = await collectQwenResources({ probeQwen: async () => ({ reachable: true, models: [], profile_status: "unknown" }) });
  assert.equal(qwen.health_state, "AVAILABLE");
  assert.equal(qwen.observation_state, "OBSERVED");
  assert.equal(qwen.occupancy, "IDLE");
  assert.equal(qwen.commercial_quota, "N/A");
});

await test("transport failure and collector-not-wired remain neutral observations", async () => {
  const transport = await collectQwenResources({ probeQwen: async () => ({ reachable: false, models: [], error: "ETIMEDOUT" }) });
  assert.equal(transport.health_state, "NOT_OBSERVED");
  assert.equal(transport.observation_state, "NOT_OBSERVED");
  resetVpsObservationCache();
  const unwired = await collectVpsNewResources({ nowMs: 10_000, bypassCache: true });
  assert.equal(unwired.health_state, "NOT_OBSERVED");
  assert.equal(unwired.observation_state, "COLLECTOR_NOT_WIRED");
  assert.equal(unwired.reason_code, "VPS_PRIVATE_OBSERVATION_UNAVAILABLE");
  assert.equal(unwired.observation_reason_code, "VPS_PRIVATE_OBSERVATION_NOT_WIRED");
});

await test("VPS success, timeout and all commands remain read-only", async () => {
  resetVpsObservationCache();
  const live = await collectVpsNewResources({
    nowMs: 20_000,
    bypassCache: true,
    sshRunner: async ({ commands, batchMode }) => {
      assert.equal(batchMode, true);
      assert.equal(commands.every((command) => assertVpsCommandSafe(command).ok), true);
      return { reachable: true, observed_at: "2026-09-10T00:00:00.000Z", ram_percent: 40, root_disk_percent: 9, n8n: "active" };
    },
  });
  assert.equal(live.health_state, "AVAILABLE");
  assert.equal(live.observation_state, "OBSERVED");
  resetVpsObservationCache();
  const failed = await collectVpsNewResources({ nowMs: 21_000, bypassCache: true, sshRunner: async () => { throw new Error("ETIMEDOUT"); } });
  assert.equal(failed.health_state, "NOT_OBSERVED");
  assert.equal(failed.observation_state, "NOT_OBSERVED");
  assert.equal(VPS_SAFE_REMOTE_COMMANDS.some((command) => /\b(rm|mv|kill|restart|start|stop|delete|POST)\b/i.test(command)), false);
});

await test("canonical SSH runner parses bounded read-only observations", async () => {
  const calls = [];
  const runner = createCanonicalVpsSshRunner({
    execFile: async (program, args) => {
      calls.push({ program, args });
      const command = args.at(-1);
      const stdout = {
        "uname -a": "Linux ionos-n8n-new 6.8.0-31-generic #31 SMP x86_64 GNU/Linux",
        "uptime": " 00:00:00 up 1 day",
        "cat /proc/uptime": "86400.00 123.00",
        "cat /proc/loadavg": "0.08 0.07 0.09 1/640 1",
        "free -b": "Mem: 8267018240 3682258944 615141376\nSwap: 2147483648 1073741824 1073741824",
        "df -B1 /": "Filesystem 1B-blocks Used Available Use% Mounted on\n/dev/vda1 248505155584 22030045184 226458333184 9% /",
        "nproc": "4",
        "hostname": "ionos-n8n-new",
        "cat /etc/os-release": "PRETTY_NAME=\"Ubuntu 24.04.2 LTS\"",
        "hostname -I": "10.0.0.5 100.64.12.34",
        "docker info --format '{{.ServerVersion}}'": "29.0",
        "docker ps --format '{{.Names}} {{.Status}}'": "n8n Up 1 hour",
        "systemctl is-active n8n || true": "active",
        "systemctl is-active docker || true": "active",
        "systemctl is-active postgresql || systemctl is-active postgresql@* || true": "active",
      }[command] || "";
      return { stdout };
    },
  });
  const observation = await runner({});
  assert.equal(observation.reachable, true);
  assert.equal(observation.ram_percent, 44.5);
  assert.equal(observation.swap_percent, 50);
  assert.equal(observation.root_disk_percent, 8.9);
  assert.equal(observation.hostname, "ionos-n8n-new");
  assert.equal(observation.os, "Ubuntu 24.04.2 LTS");
  assert.equal(observation.kernel, "6.8.0-31-generic");
  assert.equal(observation.architecture, "x86_64");
  assert.equal(observation.vcpu_count, 4);
  assert.equal(observation.tailscale_ip, "100.64.12.34");
  assert.deepEqual(observation.service_states, { n8n: "active", docker: "active", postgresql: "active" });
  assert.equal(observation.docker, "29.0");
  assert.equal(calls.every(({ program, args }) => program === "ssh" && args.includes("BatchMode=yes")), true);
  assert.equal(calls.some(({ args }) => args.includes("-X")), false);
});

await test("quota, Codex capability and Cursor accounting are separate", async () => {
  const quotas = await collectQuotaObservatory({
    collectOpenClaw: null,
    composeCanonicalQuotaState: async () => ({
      ok: true,
      schema_version: "v4-rt25-canonical-quota-state-v1",
      joined: { pools: {
        glm_coding_plan: { state: "unknown", freshness: "stale", remaining_percent: null },
        chatgpt_codex_subscription: { state: "unknown", freshness: "stale", remaining_percent: null },
      } },
      reason_codes: [],
    }),
  });
  assert.equal(quotas.pools.glm_coding_plan.health_state, "NOT_APPLICABLE");
  assert.equal(quotas.pools.glm_coding_plan.quota_observation_state, "STALE");
  assert.equal(quotas.codex_capability.health_state, "AVAILABLE");
  assert.equal(quotas.codex_capability.observation_state, "NOT_OBSERVED");
  assert.equal(quotas.pools.chatgpt_codex_subscription.quota_observation_state, "STALE");
  assert.equal(quotas.cursor.observation_state, "UNVERIFIED_ACCOUNTING");
  assert.equal(quotas.cursor.reason_code, "CURSOR_ACCOUNTING_UNVERIFIED");
});

await test("resource envelope is read-only, bounded and contains no credential material", async () => {
  const observation = await buildResourceObservatory({
    nowMs: Date.parse("2026-09-10T00:00:00.000Z"),
    collectWorkstation: async () => ({ state: "AVAILABLE", health_state: "AVAILABLE", observation_state: "OBSERVED", collector_label: "test" }),
    collectQwen: async () => ({ state: "AVAILABLE", health_state: "AVAILABLE", observation_state: "OBSERVED", collector_label: "test" }),
    collectVps: async () => ({ state: "UNAVAILABLE", health_state: "NOT_OBSERVED", observation_state: "COLLECTOR_NOT_WIRED", collector_label: "test" }),
    collectQuotas: async () => ({ pools: {}, cursor: {}, qwen_local: {} }),
    collectChatgptWeb: async () => ({ state: "UNKNOWN", health_state: "NOT_OBSERVED", observation_state: "NOT_OBSERVED", collector_label: "test" }),
  });
  assert.equal(observation.read_only, true);
  assert.equal(observation.dashboard_red_state_requires_real_failure, true);
  const serialized = JSON.stringify(observation);
  assert.equal(/(cookie|token|password|secret|credential|session)/i.test(serialized), false);
  assert.equal(serialized.includes("[object Object]"), false);
});

const failed = results.filter((result) => !result.pass);
process.stdout.write(`${results.length - failed.length}/${results.length} focused checks passed\n`);
process.exitCode = failed.length ? 1 : 0;

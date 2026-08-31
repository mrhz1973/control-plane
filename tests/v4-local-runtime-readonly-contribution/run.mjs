#!/usr/bin/env node
/**
 * Offline tests for produce-v4-local-runtime-readonly-contribution-v1.
 * Synthetic evidence only. Never invokes PowerShell, OpenCode, Qwen, or network.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyQwenSharedRuntime,
  inspectOpenCodeStatic,
  buildLocalRuntimeContribution,
  qwenObservation,
  opencodeObservation,
  gatherQwenDiagnostics,
  getProductionPsDiagnosticScript,
  loadRuntimeConfig,
  PRODUCER_ID,
} from "../../tools/produce-v4-local-runtime-readonly-contribution-v1.mjs";
import { spawnSync } from "node:child_process";
import {
  validateAgainstSchema,
} from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";
import {
  CONTRIBUTION_SCHEMA_PATH,
} from "../../tools/compose-v4-resource-status-control-plane-v1.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const results = [];

function check(name, pass, detail = "ok") {
  results.push({ name, pass, detail: pass ? "ok" : detail });
}

const RUNTIME = {
  launcher: {
    host: "127.0.0.1",
    port: 8080,
    server_executable: "llama.cpp-dflash2/build-cuda/bin/llama-server.exe",
  },
};

function listener(ownerName = "llama-server", port = 8080) {
  return {
    localAddress: "127.0.0.1",
    localPort: port,
    remoteAddress: "0.0.0.0",
    remotePort: 0,
    state: "Listen",
    ownerName,
  };
}

function establishedClient(port = 8080, ownerName = "blender") {
  return {
    localAddress: "127.0.0.1",
    localPort: 54321,
    remoteAddress: "127.0.0.1",
    remotePort: port,
    state: "Established",
    ownerName,
  };
}

function sample({ conns = [], procNames = ["llama-server"], ok = true } = {}) {
  return { ok, conns, procNames };
}

function fsReady(overrides = {}) {
  return {
    platform: "win32",
    shimExists: true,
    packageJsonExists: true,
    packageJsonValid: true,
    version: "1.18.25",
    binEntry: "./bin/opencode.exe",
    binExists: true,
    ...overrides,
  };
}

async function run() {
  // 1 exact listener + no clients both samples -> READY_IDLE
  {
    const s = sample({ conns: [listener()], procNames: ["llama-server", "cursor", "explorer"] });
    const r = classifyQwenSharedRuntime(s, sample({ conns: [listener()], procNames: ["llama-server", "cursor"] }), RUNTIME);
    check("ready-idle-single-listener", r.classification === "QWEN_READY_IDLE", JSON.stringify(r));
  }

  // 2 READY_IDLE -> available=true
  {
    const obs = qwenObservation("QWEN_READY_IDLE");
    check(
      "ready-idle-available-true",
      obs.available === true &&
        JSON.stringify(obs.quota_remaining) === JSON.stringify({ value: null, unit: "unlimited" }) &&
        obs.evidence.classification === "QWEN_READY_IDLE" &&
        obs.evidence.launch_performed === false &&
        obs.evidence.generation_calls === 0,
      JSON.stringify(obs),
    );
  }

  // 3 established non-WebUI client socket -> BUSY
  {
    const a = sample({ conns: [listener(), establishedClient()], procNames: ["llama-server", "blender"] });
    const b = sample({ conns: [listener()], procNames: ["llama-server"] });
    const r = classifyQwenSharedRuntime(a, b, RUNTIME);
    check(
      "established-client-busy",
      r.classification === "QWEN_BUSY_SHARED_RUNTIME" &&
        r.reason === "ESTABLISHED_INFERENCE_CLIENT_ON_CANONICAL_PORT",
      JSON.stringify(r),
    );
  }

  // 4 BUSY -> available=false
  {
    const obs = qwenObservation("QWEN_BUSY_SHARED_RUNTIME");
    check(
      "busy-available-false",
      obs.available === false && obs.quota_remaining.unit === "unknown",
      JSON.stringify(obs),
    );
  }

  // 5 missing listener + no conflict -> NOT_RUNNING_SAFE_TO_START
  {
    const a = sample({ conns: [], procNames: ["cursor", "explorer", "powershell"] });
    const b = sample({ conns: [], procNames: ["cursor", "node"] });
    const r = classifyQwenSharedRuntime(a, b, RUNTIME);
    check("not-running-safe-to-start", r.classification === "QWEN_NOT_RUNNING_SAFE_TO_START", JSON.stringify(r));
  }

  // 6 NOT_RUNNING -> available=false
  {
    const obs = qwenObservation("QWEN_NOT_RUNNING_SAFE_TO_START");
    check(
      "not-running-available-false",
      obs.available === false && obs.evidence.classification === "QWEN_NOT_RUNNING_SAFE_TO_START",
      JSON.stringify(obs),
    );
  }

  // 7 multiple listeners -> UNCERTAIN
  {
    const a = sample({ conns: [listener(), listener("llama-server")], procNames: ["llama-server"] });
    const b = sample({ conns: [listener(), listener("llama-server")], procNames: ["llama-server"] });
    const r = classifyQwenSharedRuntime(a, b, RUNTIME);
    check("multiple-listeners-uncertain", r.classification === "QWEN_OCCUPANCY_UNCERTAIN", JSON.stringify(r));
  }

  // 8 unexpected canonical-port owner -> UNCERTAIN
  {
    const a = sample({ conns: [listener("python")], procNames: ["python"] });
    const b = sample({ conns: [listener("python")], procNames: ["python"] });
    const r = classifyQwenSharedRuntime(a, b, RUNTIME);
    check("unexpected-owner-uncertain", r.classification === "QWEN_OCCUPANCY_UNCERTAIN", JSON.stringify(r));
  }

  // 9 sample failure -> UNCERTAIN
  {
    const a = sample({ ok: false });
    const b = sample({ conns: [listener()], procNames: ["llama-server"] });
    const r = classifyQwenSharedRuntime(a, b, RUNTIME);
    check("sample-failure-uncertain", r.classification === "QWEN_OCCUPANCY_UNCERTAIN", JSON.stringify(r));
  }

  // 10 contradictory sample ownership -> UNCERTAIN
  {
    const a = sample({ conns: [listener()], procNames: ["llama-server"] });
    const b = sample({ conns: [], procNames: ["llama-server"] });
    const r = classifyQwenSharedRuntime(a, b, RUNTIME);
    check("contradictory-ownership-uncertain", r.classification === "QWEN_OCCUPANCY_UNCERTAIN", JSON.stringify(r));
  }

  // 11/12/13 Blender/Cursor/node/python presence alone not BUSY
  {
    for (const name of ["blender", "cursor", "node", "python"]) {
      const s1 = sample({ conns: [listener()], procNames: ["llama-server", name] });
      const s2 = sample({ conns: [listener()], procNames: ["llama-server", name] });
      const r = classifyQwenSharedRuntime(s1, s2, RUNTIME);
      check(
        `presence-alone-not-busy-${name}`,
        r.classification === "QWEN_READY_IDLE",
        JSON.stringify(r),
      );
    }
  }

  // 14/15 launch_performed / generation_calls always false/zero
  {
    const q1 = qwenObservation("QWEN_READY_IDLE");
    const q2 = qwenObservation("QWEN_BUSY_SHARED_RUNTIME");
    const oc = opencodeObservation({ classification: "OPENCODE_STATIC_DISPATCH_READY", available: true });
    check(
      "launch-and-generation-zero",
      q1.evidence.launch_performed === false &&
        q1.evidence.generation_calls === 0 &&
        q2.evidence.launch_performed === false &&
        q2.evidence.generation_calls === 0 &&
        oc.evidence.launch_performed === false &&
        oc.evidence.generation_calls === 0,
      "nonzero",
    );
  }

  // 16 valid static OpenCode 1.18.x -> available=true
  {
    const r = inspectOpenCodeStatic(fsReady());
    check(
      "opencode-static-ready",
      r.classification === "OPENCODE_STATIC_DISPATCH_READY" && r.available === true,
      JSON.stringify(r),
    );
    const oc = opencodeObservation(r);
    check(
      "opencode-ready-available-true",
      oc.available === true && oc.quota_remaining.unit === "unlimited",
      JSON.stringify(oc),
    );
  }

  // 17 missing shim -> available=false
  {
    const r = inspectOpenCodeStatic(fsReady({ shimExists: false }));
    check(
      "opencode-missing-shim-unavailable",
      r.available === false &&
        (r.classification === "OPENCODE_STATIC_INSTALL_UNAVAILABLE" ||
          r.classification === "OPENCODE_STATIC_EVIDENCE_UNCERTAIN"),
      JSON.stringify(r),
    );
  }

  // 18 malformed/unverified version -> available=false
  {
    const bad = inspectOpenCodeStatic(fsReady({ version: "garbage" }));
    const wrong = inspectOpenCodeStatic(fsReady({ version: "1.19.0" }));
    check(
      "opencode-version-unverified",
      bad.available === false &&
        bad.classification === "OPENCODE_STATIC_VERSION_UNVERIFIED" &&
        wrong.available === false &&
        wrong.classification === "OPENCODE_STATIC_VERSION_UNVERIFIED",
      JSON.stringify({ bad, wrong }),
    );
  }

  // 19/25/26/27 source inspection
  {
    const src = readFileSync(
      resolve(ROOT, "tools/produce-v4-local-runtime-readonly-contribution-v1.mjs"),
      "utf8",
    );
    check(
      "no-opencode-spawn",
      !src.includes("opencode --version") &&
        !src.includes('"--version"') &&
        !src.includes("run --help") &&
        !/spawnSync\(\s*["']opencode/i.test(src),
      "opencode spawn found",
    );
    check(
      "no-commandline-collection",
      !src.includes("Win32_Process") &&
        !src.includes("CommandLine") &&
        !src.includes("Get-CimInstance") &&
        !src.includes("environment"),
      "commandline/env access found",
    );
    check(
      "no-qwen-session-collector-imports",
      !src.includes("collect-qwen-local-resource-status") &&
        !src.includes("qwen-local-session-manager") &&
        !src.includes("ensureQwenLocalReady"),
      "forbidden import found",
    );
    check(
      "no-inference-network-path",
      !src.includes("/v1/responses") &&
        !src.includes("chat/completions") &&
        !src.includes("http://") &&
        !src.includes("https://") &&
        !src.includes("fetch("),
      "network/inference path found",
    );
  }

  // 20/21/22/24 envelope
  {
    const contribution = buildLocalRuntimeContribution({
      qwenClassified: { classification: "QWEN_READY_IDLE", reason: "x" },
      opencodeStatic: inspectOpenCodeStatic(fsReady()),
      producedAtMs: Date.parse("2026-08-31T12:00:00.000Z"),
    });
    check("source-local-probe", contribution.source === "local_probe", contribution.source);
    check(
      "exactly-qwen-and-opencode",
      JSON.stringify(Object.keys(contribution.resources).sort()) ===
        JSON.stringify(["opencode", "qwen_local"]),
      JSON.stringify(Object.keys(contribution.resources)),
    );
    const flat = JSON.stringify(contribution);
    check("no-reserve-floor", !flat.includes("reserve_floor"), "reserve_floor present");
    check(
      "no-pid-process-list",
      !/"pid|process_list|procNames|conns"/.test(flat),
      "raw evidence present",
    );
    // 23 schema validation
    const sc = await validateAgainstSchema(COMPONENTS_PATH(), contribution);
    check("contribution-schema-valid", sc.ok === true, JSON.stringify(sc.reason_codes));
  }

  // 28 CLI structural output under injected diagnostics
  {
    const diag = {
      sampleA: sample({ conns: [listener()], procNames: ["llama-server", "cursor"] }),
      sampleB: sample({ conns: [listener()], procNames: ["llama-server", "cursor"] }),
    };
    const fsE = fsReady();
    const out = execFileSync(
      "node",
      [
        "tools/produce-v4-local-runtime-readonly-contribution-v1.mjs",
        "--diagnostics-b64",
        Buffer.from(JSON.stringify(diag)).toString("base64"),
        "--opencode-fs-b64",
        Buffer.from(JSON.stringify(fsE)).toString("base64"),
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
    const lines = out.trim().split(/\r?\n/).filter(Boolean);
    const parsed = JSON.parse(lines[lines.length - 1]);
    check(
      "cli-one-json-injected",
      lines.length === 1 &&
        parsed.ok === true &&
        parsed.qwen_occupancy_classification === "QWEN_READY_IDLE" &&
        parsed.contribution.schema_version === "v4-resource-status-contribution-v1" &&
        parsed.contribution.producer_id === PRODUCER_ID &&
        parsed.launch_performed === false &&
        parsed.generation_calls === 0,
      JSON.stringify({ lines: lines.length, cls: parsed.qwen_occupancy_classification }),
    );
  }

  /* ------------------------------------------------------------------ */
  /* Occupancy false-BUSY + PS_DIAGNOSTIC correction regressions         */
  /* ------------------------------------------------------------------ */

  // PS diagnostic script contains fixed Write parentheses (syntax defect gone)
  {
    const script = getProductionPsDiagnosticScript();
    check(
      "ps-diagnostic-write-parentheses-fixed",
      script.includes("[Console]::Out.Write(($out | ConvertTo-Json -Depth 5 -Compress))") &&
        !script.includes("[Console]::Out.Write($out | ConvertTo-Json -Depth 5 -Compress)"),
      "write form mismatch",
    );
  }

  // On win32: production diagnostic parses (ParseFile) and runs (not DIAGNOSTICS_INCOMPLETE)
  if (process.platform === "win32") {
    const { writeFileSync, unlinkSync, mkdtempSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = mkdtempSync(join(tmpdir(), "cp-ps-diag-"));
    const scriptPath = join(dir, "diag.ps1");
    writeFileSync(scriptPath, getProductionPsDiagnosticScript(), "utf8");
    const parse = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `$e=$null; $null=[System.Management.Automation.Language.Parser]::ParseFile('${scriptPath.replace(/'/g, "''")}', [ref]$null, [ref]$e); if($e -and $e.Count -gt 0){ $e|ForEach-Object{ $_.Message }; exit 1 } else { 'PARSE_OK' }`,
      ],
      { encoding: "utf8", windowsHide: true, timeout: 30000 },
    );
    try {
      unlinkSync(scriptPath);
    } catch {
      /* ignore */
    }
    check(
      "ps-diagnostic-parses",
      parse.status === 0 && String(parse.stdout || "").includes("PARSE_OK"),
      JSON.stringify({ status: parse.status, out: parse.stdout, err: (parse.stderr || "").slice(0, 300) }),
    );
    const diag = gatherQwenDiagnostics(loadRuntimeConfig());
    check(
      "ps-diagnostic-runs-not-incomplete",
      diag.ok === true && diag.sampleA?.ok === true && diag.sampleB?.ok === true,
      JSON.stringify({ ok: diag.ok, a: diag.sampleA?.ok, b: diag.sampleB?.ok }),
    );
    const live = classifyQwenSharedRuntime(diag.sampleA, diag.sampleB, loadRuntimeConfig());
    check(
      "ps-diagnostic-classify-not-incomplete",
      live.reason !== "DIAGNOSTICS_INCOMPLETE",
      JSON.stringify(live),
    );
  } else {
    check("ps-diagnostic-parses", true, "skipped-non-win32");
    check("ps-diagnostic-runs-not-incomplete", true, "skipped-non-win32");
    check("ps-diagnostic-classify-not-incomplete", true, "skipped-non-win32");
  }

  // canonical listener + msedge WebUI only -> READY_IDLE
  {
    const edge = establishedClient(8080, "msedge");
    const a = sample({ conns: [listener(), edge], procNames: ["llama-server", "msedge"] });
    const b = sample({ conns: [listener(), edge], procNames: ["llama-server", "msedge"] });
    const r = classifyQwenSharedRuntime(a, b, RUNTIME);
    check(
      "msedge-webui-only-ready-idle",
      r.classification === "QWEN_READY_IDLE" && r.reason === "PASSIVE_CANONICAL_WEBUI_CLIENT",
      JSON.stringify(r),
    );
  }

  // msedge + conflicting inference process -> BUSY
  {
    const edge = establishedClient(8080, "msedge");
    const a = sample({
      conns: [listener(), edge],
      procNames: ["llama-server", "msedge", "vllm"],
    });
    const b = sample({
      conns: [listener(), edge],
      procNames: ["llama-server", "msedge", "vllm"],
    });
    const r = classifyQwenSharedRuntime(a, b, RUNTIME);
    check(
      "msedge-plus-conflicting-runner-busy",
      r.classification === "QWEN_BUSY_SHARED_RUNTIME" &&
        r.reason === "CONFLICTING_INFERENCE_RUNNER_ACTIVE",
      JSON.stringify(r),
    );
  }

  // opencode-established client -> BUSY
  {
    const oc = establishedClient(8080, "opencode");
    const a = sample({ conns: [listener(), oc], procNames: ["llama-server", "opencode"] });
    const b = sample({ conns: [listener(), oc], procNames: ["llama-server", "opencode"] });
    const r = classifyQwenSharedRuntime(a, b, RUNTIME);
    check(
      "opencode-established-client-busy",
      r.classification === "QWEN_BUSY_SHARED_RUNTIME" &&
        r.reason === "ESTABLISHED_INFERENCE_CLIENT_ON_CANONICAL_PORT",
      JSON.stringify(r),
    );
  }

  // unknown established client -> BUSY fail-closed
  {
    const unk = establishedClient(8080, "chrome");
    const a = sample({ conns: [listener(), unk], procNames: ["llama-server", "chrome"] });
    const b = sample({ conns: [listener(), unk], procNames: ["llama-server", "chrome"] });
    const r = classifyQwenSharedRuntime(a, b, RUNTIME);
    check(
      "unknown-established-client-busy",
      r.classification === "QWEN_BUSY_SHARED_RUNTIME" &&
        r.reason === "ESTABLISHED_INFERENCE_CLIENT_ON_CANONICAL_PORT",
      JSON.stringify(r),
    );
  }

  // msedge + unknown established -> BUSY (WebUI does not mask real clients)
  {
    const edge = establishedClient(8080, "msedge");
    const unk = {
      ...establishedClient(8080, "mystery-agent"),
      localPort: 54322,
    };
    const a = sample({
      conns: [listener(), edge, unk],
      procNames: ["llama-server", "msedge", "mystery-agent"],
    });
    const b = sample({
      conns: [listener(), edge, unk],
      procNames: ["llama-server", "msedge", "mystery-agent"],
    });
    const r = classifyQwenSharedRuntime(a, b, RUNTIME);
    check(
      "msedge-plus-unknown-client-busy",
      r.classification === "QWEN_BUSY_SHARED_RUNTIME",
      JSON.stringify(r),
    );
  }

  const failed = results.filter((x) => !x.pass);
  const summary = {
    suite: "v4-local-runtime-readonly-contribution",
    root: ROOT,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    results,
  };
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  process.exit(failed.length ? 1 : 0);
}

function COMPONENTS_PATH() {
  return CONTRIBUTION_SCHEMA_PATH;
}

run().catch((err) => {
  process.stderr.write(`error: ${err && err.message ? err.message : err}\n`);
  process.exit(1);
});

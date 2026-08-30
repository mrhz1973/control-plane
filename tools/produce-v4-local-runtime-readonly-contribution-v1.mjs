#!/usr/bin/env node
/**
 * V4 — produce read-only local-runtime contribution (qwen_local + opencode).
 * READ-ONLY diagnostics only. Never starts/stops/kills anything.
 * Never spawns OpenCode. Never calls Qwen/LLM endpoints. Never composes status.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CONTRIBUTION_SCHEMA_VERSION = "v4-resource-status-contribution-v1";
export const PRODUCER_ID = "v4-local-runtime-readonly-v1";
export const DEFAULT_RUNTIME_CONFIG_PATH = resolve(
  ROOT,
  "configs/resources/qwen-local-runtime.json",
);

const SAMPLE_DELAY_MS = 1200;
const EXPECTED_SERVER_PROCESS = "llama-server";
const OPENCODE_MAJOR = 1;
const OPENCODE_MINOR = 18;

// Diagnostic PowerShell: two fixed read-only samples in ONE process.
// Read-only process/socket metadata only.
// PIDs are resolved to names inside PowerShell and never emitted.
const PS_DIAGNOSTIC = `
$ErrorActionPreference = 'SilentlyContinue'
function Get-Sample {
  $procs = Get-Process | Where-Object { $_.ProcessName } |
    ForEach-Object { [pscustomobject]@{ pid_ = [int]$_.Id; name = [string]$_.ProcessName } }
  $conns = Get-NetTCPConnection |
    ForEach-Object { [pscustomobject]@{
      localAddress = [string]$_.LocalAddress
      localPort = [int]$_.LocalPort
      remoteAddress = [string]$_.RemoteAddress
      remotePort = [int]$_.RemotePort
      state = [string]$_.State
      owningPid = [int]$_.OwningProcess
    } }
  [pscustomobject]@{ procs = $procs; conns = $conns }
}
$s1 = Get-Sample
Start-Sleep -Milliseconds ${SAMPLE_DELAY_MS}
$s2 = Get-Sample
$pidToName = @{}
foreach ($p in $s2.procs) { $pidToName[[string]$p.pid_] = $p.name }
foreach ($p in $s1.procs) { if (-not $pidToName.ContainsKey([string]$p.pid_)) { $pidToName[[string]$p.pid_] = $p.name } }
function MapConns($conns) {
  $conns | ForEach-Object {
    $oname = $pidToName[[string]$_.owningPid]
    if (-not $oname) { $oname = 'UNKNOWN' }
    [pscustomobject]@{
      localAddress = $_.localAddress; localPort = $_.localPort
      remoteAddress = $_.remoteAddress; remotePort = $_.remotePort
      state = $_.state; ownerName = $oname
    }
  }
}
$out = [pscustomobject]@{
  ok = $true
  sampleA = [pscustomobject]@{ ok = $true; conns = @(MapConns $s1.conns); procNames = @($s1.procs | ForEach-Object { $_.name }) }
  sampleB = [pscustomobject]@{ ok = $true; conns = @(MapConns $s2.conns); procNames = @($s2.procs | ForEach-Object { $_.name }) }
}
[Console]::Out.Write($out | ConvertTo-Json -Depth 5 -Compress)
`;

const INFERENCE_RE =
  /^(llama-server|llamafile|ollama(\.exe)?|ollama_|llama_cpp|vllm|lmstudio|localai)(\W|$)/i;

function normalizeName(name) {
  return String(name || "").trim().replace(/\.exe$/i, "").toLowerCase();
}

function isExpectedServer(name, runtimeConfig) {
  const configured = String(
    runtimeConfig?.launcher?.server_executable || EXPECTED_SERVER_PROCESS,
  )
    .split(/[/\\]/)
    .pop()
    .replace(/\.exe$/i, "")
    .toLowerCase();
  const n = normalizeName(name);
  if (n === configured.toLowerCase() || n === EXPECTED_SERVER_PROCESS) return true;
  return n.startsWith("llama-server");
}

function isConflictingInferenceProcess(name) {
  const n = normalizeName(name);
  if (isExpectedServer(n, {})) return false;
  return INFERENCE_RE.test(n) && !/^ollama$/i.test(n) ? true : INFERENCE_RE.test(n);
}

function connsOnPort(conns, port) {
  return (conns || []).filter(
    (c) => Number(c.localPort) === Number(port) || Number(c.remotePort) === Number(port),
  );
}

function listenersOnPort(conns, port) {
  return (conns || []).filter(
    (c) =>
      String(c.state || "").toUpperCase() === "LISTEN" &&
      Number(c.localPort) === Number(port),
  );
}

function establishedClientsOnPort(conns, port, listenerOwnerNames) {
  const ownerSet = new Set((listenerOwnerNames || []).map(normalizeName));
  return (conns || []).filter((c) => {
    const state = String(c.state || "").toUpperCase();
    if (state !== "ESTABLISHED") return false;
    const touches =
      Number(c.remotePort) === Number(port) ||
      (Number(c.localPort) === Number(port) &&
        String(c.remoteAddress || "") !== "0.0.0.0" &&
        String(c.remoteAddress || "") !== "::" &&
        String(c.remoteAddress || "") !== "");
    if (!touches) return false;
    const owner = normalizeName(c.ownerName);
    if (ownerSet.has(owner)) return false;
    return true;
  });
}

function sampleHasInferenceRunner(procNames, excludeExpected) {
  return (procNames || []).some((n) => {
    const norm = normalizeName(n);
    if (excludeExpected && isExpectedServer(norm, {})) return false;
    return isConflictingInferenceProcess(norm);
  });
}

function analyzeSample(sample, host, port) {
  if (!sample || sample.ok !== true) {
    return { valid: false };
  }
  const listeners = listenersOnPort(sample.conns, port);
  const ownerNames = [...new Set(listeners.map((c) => normalizeName(c.ownerName)))];
  const serverProcs = (sample.procNames || []).filter((n) =>
    isExpectedServer(n, {}),
  );
  const clients = establishedClientsOnPort(sample.conns, port, ownerNames);
  const conflicting = sampleHasInferenceRunner(sample.procNames, true);
  return {
    valid: true,
    listenerCount: listeners.length,
    listenerOwnerNames: ownerNames,
    unexpectedOwner: ownerNames.length === 1 && !isExpectedServer(ownerNames[0], {}),
    serverProcCount: serverProcs.length,
    hasEstablishedClient: clients.length > 0,
    hasConflictingRunner: conflicting,
  };
}

/**
 * Pure occupancy classifier. snapshotA/snapshotB: {ok, conns:[{localPort,
 * remotePort, state, ownerName, remoteAddress}], procNames:[]}.
 * runtimeConfig: parsed configs/resources/qwen-local-runtime.json.
 */
export function classifyQwenSharedRuntime(snapshotA, snapshotB, runtimeConfig) {
  const host = String(runtimeConfig?.launcher?.host || "127.0.0.1");
  const port = Number(runtimeConfig?.launcher?.port || 8080);

  const a = analyzeSample(snapshotA, host, port);
  const b = analyzeSample(snapshotB, host, port);

  if (!a.valid || !b.valid) {
    return { classification: "QWEN_OCCUPANCY_UNCERTAIN", reason: "DIAGNOSTICS_INCOMPLETE" };
  }

  const listenerA = a.listenerCount;
  const listenerB = b.listenerCount;

  // No listener path
  if (listenerA === 0 && listenerB === 0) {
    if (a.serverProcCount > 0 || b.serverProcCount > 0) {
      return {
        classification: "QWEN_OCCUPANCY_UNCERTAIN",
        reason: "SERVER_PROCESS_WITHOUT_LISTENER",
      };
    }
    if (a.hasConflictingRunner || b.hasConflictingRunner) {
      return {
        classification: "QWEN_BUSY_SHARED_RUNTIME",
        reason: "CONFLICTING_INFERENCE_RUNNER_ACTIVE",
      };
    }
    return {
      classification: "QWEN_NOT_RUNNING_SAFE_TO_START",
      reason: "NO_LISTENER_NO_CONFLICT",
    };
  }

  // Listener exists in at least one sample
  if (listenerA > 1 || listenerB > 1) {
    return { classification: "QWEN_OCCUPANCY_UNCERTAIN", reason: "MULTIPLE_LISTENERS" };
  }
  if (listenerA !== listenerB) {
    return {
      classification: "QWEN_OCCUPANCY_UNCERTAIN",
      reason: "CONTRADICTORY_SAMPLE_OWNERSHIP",
    };
  }
  if (a.unexpectedOwner || b.unexpectedOwner) {
    return {
      classification: "QWEN_OCCUPANCY_UNCERTAIN",
      reason: "UNEXPECTED_CANONICAL_PORT_OWNER",
    };
  }
  if (a.serverProcCount === 0 || b.serverProcCount === 0) {
    return {
      classification: "QWEN_OCCUPANCY_UNCERTAIN",
      reason: "LISTENER_OWNER_UNRESOLVED",
    };
  }
  if (a.hasEstablishedClient || b.hasEstablishedClient) {
    return {
      classification: "QWEN_BUSY_SHARED_RUNTIME",
      reason: "ESTABLISHED_CLIENT_ON_CANONICAL_PORT",
    };
  }
  if (a.hasConflictingRunner || b.hasConflictingRunner) {
    return {
      classification: "QWEN_BUSY_SHARED_RUNTIME",
      reason: "CONFLICTING_INFERENCE_RUNNER_ACTIVE",
    };
  }

  return { classification: "QWEN_READY_IDLE", reason: "SINGLE_IDLE_CANONICAL_LISTENER" };
}

/**
 * Pure OpenCode static inspection. fsEvidence: {platform, shimPath,
 * packageJsonPath, packageJsonExists, shimExists, packageJsonValid, version,
 * binEntry, binExists}. Never spawns anything.
 */
export function inspectOpenCodeStatic(fsEvidence) {
  if (!fsEvidence || typeof fsEvidence !== "object") {
    return {
      classification: "OPENCODE_STATIC_EVIDENCE_UNCERTAIN",
      available: false,
      version: null,
    };
  }
  if (fsEvidence.platform !== "win32") {
    return {
      classification: "OPENCODE_STATIC_EVIDENCE_UNCERTAIN",
      available: false,
      version: null,
    };
  }
  if (!fsEvidence.shimExists) {
    return {
      classification: "OPENCODE_STATIC_INSTALL_UNAVAILABLE",
      available: false,
      version: null,
    };
  }
  if (!fsEvidence.packageJsonExists || !fsEvidence.packageJsonValid) {
    return {
      classification: "OPENCODE_STATIC_INSTALL_UNAVAILABLE",
      available: false,
      version: null,
    };
  }
  const version = String(fsEvidence.version || "");
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!m) {
    return {
      classification: "OPENCODE_STATIC_VERSION_UNVERIFIED",
      available: false,
      version: null,
    };
  }
  const major = Number(m[1]);
  const minor = Number(m[2]);
  if (major !== OPENCODE_MAJOR || minor !== OPENCODE_MINOR) {
    return {
      classification: "OPENCODE_STATIC_VERSION_UNVERIFIED",
      available: false,
      version: `${major}.${minor}.${m[3]}`,
    };
  }
  if (!fsEvidence.binEntry || !fsEvidence.binExists) {
    return {
      classification: "OPENCODE_STATIC_INSTALL_UNAVAILABLE",
      available: false,
      version: `${major}.${minor}.${m[3]}`,
    };
  }
  return {
    classification: "OPENCODE_STATIC_DISPATCH_READY",
    available: true,
    version: `${major}.${minor}.${m[3]}`,
  };
}

export function qwenObservation(classification) {
  const ready = classification === "QWEN_READY_IDLE";
  return {
    available: ready,
    quota_remaining: ready
      ? { value: null, unit: "unlimited" }
      : { value: null, unit: "unknown" },
    reset_at: null,
    cost_mode: "free",
    location: "local",
    updated_at: null, // set by builder
    evidence: {
      kind: "qwen_occupancy",
      classification,
      launch_performed: false,
      generation_calls: 0,
    },
  };
}

export function opencodeObservation(staticResult) {
  return {
    available: staticResult.available === true,
    quota_remaining: staticResult.available
      ? { value: null, unit: "unlimited" }
      : { value: null, unit: "unknown" },
    reset_at: null,
    cost_mode: "free",
    location: "local",
    updated_at: null, // set by builder
    evidence: {
      kind: "source_snapshot",
      classification: staticResult.classification,
      launch_performed: false,
      generation_calls: 0,
    },
  };
}

/**
 * Build the contribution from classified parts. Pure.
 * qwenClassified: {classification}; opencodeStatic: inspectOpenCodeStatic result.
 * producedAtMs: number. contributionId: optional stable id.
 */
export function buildLocalRuntimeContribution({
  qwenClassified,
  opencodeStatic,
  producedAtMs,
  contributionId,
}) {
  const producedAt = new Date(producedAtMs).toISOString();
  const qwen = qwenObservation(qwenClassified.classification);
  qwen.updated_at = producedAt;
  const oc = opencodeObservation(opencodeStatic);
  oc.updated_at = producedAt;
  return {
    schema_version: CONTRIBUTION_SCHEMA_VERSION,
    contribution_id:
      contributionId ||
      `v4-local-readonly-${new Date(producedAtMs).toISOString().replace(/[:.]/g, "-")}`,
    producer_id: PRODUCER_ID,
    source: "local_probe",
    produced_at: producedAt,
    resources: {
      qwen_local: qwen,
      opencode: oc,
    },
  };
}

/** ONE bounded read-only PowerShell diagnostic. Two fixed samples inside. */
export function gatherQwenDiagnostics(runtimeConfig) {
  const r = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", PS_DIAGNOSTIC],
    { encoding: "utf8", windowsHide: true, timeout: 60_000 },
  );
  if (r.error || r.status !== 0) {
    return { ok: false, sampleA: { ok: false }, sampleB: { ok: false } };
  }
  try {
    const parsed = JSON.parse((r.stdout || "").trim());
    if (!parsed || parsed.ok !== true) {
      return { ok: false, sampleA: { ok: false }, sampleB: { ok: false } };
    }
    return {
      ok: true,
      sampleA: parsed.sampleA,
      sampleB: parsed.sampleB,
    };
  } catch {
    return { ok: false, sampleA: { ok: false }, sampleB: { ok: false } };
  }
}

/** Filesystem-only OpenCode evidence. No process spawn. */
export function gatherOpenCodeFilesystemEvidence(platform = process.platform) {
  const appData = process.env.APPDATA || join(homedir(), "AppData", "Roaming");
  const shimPath = join(appData, "npm", "opencode.cmd");
  const packageDir = join(appData, "npm", "node_modules", "opencode-ai");
  const packageJsonPath = join(packageDir, "package.json");
  const evidence = {
    platform,
    shimPath,
    packageJsonPath,
    shimExists: false,
    packageJsonExists: false,
    packageJsonValid: false,
    version: null,
    binEntry: null,
    binExists: false,
  };
  if (platform !== "win32") return evidence;
  evidence.shimExists = existsSync(shimPath);
  evidence.packageJsonExists = existsSync(packageJsonPath);
  if (evidence.packageJsonExists) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      evidence.version = typeof pkg.version === "string" ? pkg.version : null;
      const bin = pkg.bin && typeof pkg.bin === "object" ? pkg.bin : null;
      const entry =
        bin && typeof bin.opencode === "string"
          ? bin.opencode
          : bin && typeof pkg.name === "string" && bin[pkg.name]
            ? bin[pkg.name]
            : null;
      evidence.binEntry = entry;
      evidence.packageJsonValid =
        typeof pkg.name === "string" && typeof pkg.version === "string";
      if (entry) {
        evidence.binExists = existsSync(join(packageDir, entry));
      }
    } catch {
      evidence.packageJsonValid = false;
    }
  }
  return evidence;
}

export function loadRuntimeConfig(pathArg) {
  const p = pathArg ? resolve(pathArg) : DEFAULT_RUNTIME_CONFIG_PATH;
  return JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
}

const isMain =
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith(
    "produce-v4-local-runtime-readonly-contribution-v1.mjs",
  );

if (isMain) {
  const args = new Map();
  for (let i = 2; i < process.argv.length - 1; i += 2) {
    args.set(process.argv[i], process.argv[i + 1]);
  }
  const runtimeConfig = loadRuntimeConfig(args.get("--runtime-config"));

  let diagnostics = null;
  if (args.has("--diagnostics-b64")) {
    try {
      diagnostics = JSON.parse(
        Buffer.from(args.get("--diagnostics-b64"), "base64").toString("utf8"),
      );
    } catch {
      diagnostics = null;
    }
  }
  let opencodeFs = null;
  if (args.has("--opencode-fs-b64")) {
    try {
      opencodeFs = JSON.parse(
        Buffer.from(args.get("--opencode-fs-b64"), "base64").toString("utf8"),
      );
    } catch {
      opencodeFs = null;
    }
  }

  const qwenDiag = diagnostics || gatherQwenDiagnostics(runtimeConfig);
  const qwenClassified = classifyQwenSharedRuntime(
    qwenDiag.sampleA,
    qwenDiag.sampleB,
    runtimeConfig,
  );

  const fsEvidence = opencodeFs || gatherOpenCodeFilesystemEvidence();
  const opencodeStatic = inspectOpenCodeStatic(fsEvidence);

  const contribution = buildLocalRuntimeContribution({
    qwenClassified,
    opencodeStatic,
    producedAtMs: Date.now(),
  });

  process.stdout.write(
    `${JSON.stringify({
      schema_version: "v4-local-runtime-readonly-contribution-result-v1",
      ok: true,
      qwen_occupancy_classification: qwenClassified.classification,
      qwen_classification_reason: qwenClassified.reason,
      opencode_static_classification: opencodeStatic.classification,
      contribution,
      launch_performed: false,
      generation_calls: 0,
    })}\n`,
  );
}

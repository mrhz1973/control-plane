#!/usr/bin/env node
/**
 * observe-litellm-primary-network.mjs
 *
 * Bounded, metadata-only network observer for the D-0025-W LiteLLM ingress
 * diagnosis. Text-mode tcpdump ONLY (-tt -n -l, never -A/-X/-x/-w): no
 * payload, no headers, no body, no DNS prose, no secrets. Produces
 * sanitized NDJSON events and terminates deterministically.
 *
 * ZERO PROVIDER CALLS: this tool never opens connections; it only observes.
 *
 * Usage:
 *   node observe-litellm-primary-network.mjs --duration-ms 180000 \
 *     [--out-file /tmp/obs.ndjson]
 *
 * Requires: root (or NET_RAW), docker CLI, tcpdump >= 4.99, node >= 18.
 * Event shape (sanitized to classes/ports/flags only):
 *   { ts, ts_epoch, direction, src_class, dst_class, src_port, dst_port,
 *     tcp_flags }
 * direction: N8N_TO_LITELLM | LITELLM_TO_EXTERNAL | CONNECTION_CLOSE | OTHER
 * Remote addresses are classified EXTERNAL; literal IPs are never emitted
 * for non-container endpoints.
 */

import { spawn, spawnSync } from "node:child_process";
import { openSync, writeSync, closeSync } from "node:fs";

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const m = process.argv[i].match(/^--([a-z0-9-]+)=(.*)$/i);
  if (m) { args[m[1]] = m[2]; continue; }
  const k = process.argv[i].replace(/^--/, "");
  args[k] = process.argv[++i] ?? "";
}

const DURATION_MS = Number(args["duration-ms"] ?? 180000);
const OUT_FILE = args["out-file"] ?? null;

if (!Number.isFinite(DURATION_MS) || DURATION_MS <= 0) {
  console.error(JSON.stringify({ ok: false, classification: "INPUT_INVALID" }));
  process.exit(2);
}

function fail(cls, reason) {
  console.error(JSON.stringify({ ok: false, classification: cls, reason }));
  process.exit(2);
}

function dockerInspect(field, container) {
  const r = spawnSync("docker", ["inspect", "-f", field, container], { encoding: "utf8" });
  if (r.status !== 0) return null;
  return r.stdout.trim();
}

const N8N = "root-n8n-1";
const LIT = "litellm-primary";
const n8nIp = dockerInspect("{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", N8N);
const litIp = dockerInspect("{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", LIT);
if (!n8nIp || !litIp || !/^\d+\.\d+\.\d+\.\d+$/.test(n8nIp) || !/^\d+\.\d+\.\d+\.\d+$/.test(litIp)) {
  fail("DISCOVERY_FAILED", `n8n=${n8nIp} litellm=${litIp}`);
}

console.error(JSON.stringify({
  ok: true,
  observer: "observe-litellm-primary-network.mjs",
  backend: "tcpdump-text-metadata-only",
  started_at: new Date().toISOString(),
  duration_ms: DURATION_MS,
  note: "container IPs resolved at runtime; not persisted in events",
}));

const litNet = litIp.split(".").slice(0, 3).join(".");

// Scoped to litellm-primary relevance only:
//  - n8n <-> litellm (ingress path, primary interest :4000)
//  - litellm -> outside its docker subnet (outbound provider path, pre-NAT)
const FILTER = `((host ${n8nIp} and host ${litIp})) or (host ${litIp} and not net ${litNet}.0/24)`;

const TCPDUMP_ARGS = [
  "-tt",   // absolute numeric timestamps (no payload by default)
  "-n",    // no DNS resolution
  "-l",    // line buffered
  "-i", "any",
  FILTER,
];

const events = [];
let fd = null;
if (OUT_FILE) fd = openSync(OUT_FILE, "w");

function classify(ip) {
  if (ip === n8nIp) return "N8N";
  if (ip === litIp) return "LITELLM";
  if (ip.startsWith(litNet + ".")) return "DOCKER_NET";
  return "EXTERNAL";
}

function isoFromEpoch(epochSec) {
  const ms = Math.round(epochSec * 1000);
  return new Date(ms).toISOString();
}

// SLL2 (-i any): "1788020754.394736 vethee3738e In  IP a.b.c.d.p > e.f.g.h.q: Flags [S], seq ..."
const LINE_RE = /^(\d+\.\d+)\s+\S+\s+(?:In|Out|P|B|--)?\s*IP6?\s+(\d+\.\d+\.\d+\.\d+)\.(\d+)\s*>\s*(\d+\.\d+\.\d+\.\d+)\.(\d+):\s*(.*)$/;

const seenKeys = new Map(); // dedupe In/Out twins within 1 ms buckets

function parseLine(line) {
  const m = line.match(LINE_RE);
  if (!m) return null;
  const [, tsS, srcIp, sportS, dstIp, dportS, tail] = m;
  const tsEpoch = Number(tsS);
  const fm = tail.match(/Flags \[([^\]]*)\]/);
  const tcpFlags = fm ? fm[1] : "";
  const srcCls = classify(srcIp);
  const dstCls = classify(dstIp);
  const flagsNorm = tcpFlags.replace(/[.]/g, "");
  const hasFin = flagsNorm.includes("F");
  const hasRst = flagsNorm.includes("R");
  let direction = "OTHER";
  if (hasFin || hasRst) direction = "CONNECTION_CLOSE";
  else if (srcCls === "N8N" && dstCls === "LITELLM") direction = "N8N_TO_LITELLM";
  else if (srcCls === "LITELLM" && (dstCls === "EXTERNAL" || dstCls === "DOCKER_NET")) direction = "LITELLM_TO_EXTERNAL";
  // Dedupe twins: same 1ms bucket + same 5-tuple + flags
  const bucket = Math.floor(tsEpoch * 1000);
  const key = `${bucket}|${srcIp}|${sportS}|${dstIp}|${dportS}|${flagsNorm}`;
  if (seenKeys.has(key)) return null;
  seenKeys.set(key, 1);
  if (seenKeys.size > 200000) seenKeys.clear();
  return {
    ts: isoFromEpoch(tsEpoch),
    ts_epoch: tsS,
    direction,
    src_class: srcCls,
    dst_class: dstCls,
    src_port: Number(sportS),
    dst_port: Number(dportS),
    tcp_flags: tcpFlags,
  };
}

const child = spawn("tcpdump", TCPDUMP_ARGS, { stdio: ["ignore", "pipe", "pipe"] });

let pending = "";
let stopped = false;

function stop(reason) {
  if (stopped) return;
  stopped = true;
  try { child.kill("SIGTERM"); } catch { /* ignore */ }
  setTimeout(() => { try { child.kill("SIGKILL"); } catch { /* ignore */ } }, 2000).unref();
  const counts = {};
  for (const e of events) counts[e.direction] = (counts[e.direction] || 0) + 1;
  console.error(JSON.stringify({
    ok: true,
    classification: "OBSERVER_COMPLETED",
    reason,
    events: events.length,
    counts,
    ended_at: new Date().toISOString(),
  }));
  if (fd !== null) { try { closeSync(fd); } catch { /* ignore */ } }
  process.exit(0);
}

child.stdout.on("data", (chunk) => {
  pending += chunk.toString("utf8");
  let idx;
  while ((idx = pending.indexOf("\n")) >= 0) {
    const line = pending.slice(0, idx).trim();
    pending = pending.slice(idx + 1);
    if (!line) continue;
    const ev = parseLine(line);
    if (!ev) continue;
    events.push(ev);
    if (fd !== null) { try { writeSync(fd, JSON.stringify(ev) + "\n"); } catch { /* ignore */ } }
  }
});

child.stderr.on("data", (c) => {
  const s = c.toString("utf8");
  if (/permission denied|Operation not permitted/i.test(s)) {
    stop("BACKEND_PERMISSION_DENIED");
  }
});

child.on("error", (e) => fail("BACKEND_SPAWN_FAILED", String(e.message)));
child.on("close", (code, signal) => {
  if (!stopped) stop(`tcpdump_early_exit code=${code} signal=${signal}`);
});

setTimeout(() => stop("duration_elapsed"), DURATION_MS).unref();
setTimeout(() => {
  try { child.kill("SIGKILL"); } catch { /* ignore */ }
  process.exit(0);
}, DURATION_MS + 30000).unref();

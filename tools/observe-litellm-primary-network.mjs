#!/usr/bin/env node
/**
 * observe-litellm-primary-network.mjs
 *
 * Bounded, metadata-only network observer for the D-0025-W LiteLLM ingress
 * diagnosis. Text-mode tcpdump ONLY (-tt -nn -l, never -A/-X/-x/-w): no
 * payload, no headers, no body, no DNS prose, no secrets. Produces
 * sanitized NDJSON events and terminates deterministically.
 *
 * Supports IPv4 and (when present) IPv6 container addresses so upstream
 * provider paths that are IPv6-only remain observable as LITELLM_TO_EXTERNAL.
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
 * Remote addresses are classified EXTERNAL; literal IPs are never emitted.
 */

import { spawn, spawnSync } from "node:child_process";
import { openSync, writeSync, closeSync } from "node:fs";
import { pathToFileURL } from "node:url";

const EVENT_KEYS = Object.freeze([
  "ts",
  "ts_epoch",
  "direction",
  "src_class",
  "dst_class",
  "src_port",
  "dst_port",
  "tcp_flags",
]);

/** Forbidden tcpdump flags (payload / pcap). */
const FORBIDDEN_TCPDUMP_FLAGS = Object.freeze(["-A", "-X", "-x", "-w"]);

function dockerInspect(field, container) {
  const r = spawnSync("docker", ["inspect", "-f", field, container], { encoding: "utf8" });
  if (r.status !== 0) return null;
  return r.stdout.trim();
}

function isIPv4(s) {
  return typeof s === "string" && /^\d{1,3}(\.\d{1,3}){3}$/.test(s);
}

function isIPv6(s) {
  return typeof s === "string" && s.includes(":") && !s.includes(".");
}

/**
 * Discover container IPv4 + optional IPv6 from Docker metadata.
 * Missing IPv6 does not fail; missing IPv4 does (ingress path is IPv4-required).
 */
export function discoverContainerAddrs(inspectFn = dockerInspect, n8nName = "root-n8n-1", litName = "litellm-primary") {
  const n8n4 = inspectFn("{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", n8nName) || "";
  const lit4 = inspectFn("{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}", litName) || "";
  const n8n6 = inspectFn("{{range .NetworkSettings.Networks}}{{.GlobalIPv6Address}}{{end}}", n8nName) || "";
  const lit6 = inspectFn("{{range .NetworkSettings.Networks}}{{.GlobalIPv6Address}}{{end}}", litName) || "";
  const lit6PrefixLenRaw = inspectFn("{{range .NetworkSettings.Networks}}{{.GlobalIPv6PrefixLen}}{{end}}", litName) || "";
  const lit6PrefixLen = Number(lit6PrefixLenRaw) || 0;

  if (!isIPv4(n8n4) || !isIPv4(lit4)) {
    return { ok: false, reason: `ipv4_required n8n4=${n8n4 || "none"} lit4=${lit4 || "none"}` };
  }
  return {
    ok: true,
    n8n4,
    lit4,
    n8n6: isIPv6(n8n6) ? n8n6 : null,
    lit6: isIPv6(lit6) ? lit6 : null,
    lit6PrefixLen: lit6PrefixLen > 0 ? lit6PrefixLen : 64,
    lit4Net: lit4.split(".").slice(0, 3).join("."),
  };
}

/**
 * Build a BPF filter scoped to litellm-primary relevance (IPv4 always; IPv6 when present).
 * Does not emit literal external addresses — only discovered container hosts/nets.
 */
export function buildFilter(addrs) {
  const parts = [];
  parts.push(`(host ${addrs.n8n4} and host ${addrs.lit4})`);
  parts.push(`(host ${addrs.lit4} and not net ${addrs.lit4Net}.0/24)`);
  if (addrs.n8n6 && addrs.lit6) {
    parts.push(`(host ${addrs.n8n6} and host ${addrs.lit6})`);
  }
  if (addrs.lit6) {
    // Outbound IPv6 from litellm toward anything outside its docker IPv6 prefix.
    const pfx = addrs.lit6PrefixLen || 64;
    const net = ipv6NetworkCidr(addrs.lit6, pfx);
    parts.push(`(host ${addrs.lit6} and not net ${net})`);
  }
  return parts.map((p) => `(${p})`).join(" or ");
}

export function buildTcpdumpArgs(filter) {
  return [
    "-tt", // absolute numeric timestamps
    "-nn", // no DNS; numeric ports
    "-l", // line buffered
    "-i",
    "any",
    filter,
  ];
}

export function assertSafeTcpdumpArgs(argv) {
  for (const a of argv) {
    if (FORBIDDEN_TCPDUMP_FLAGS.includes(a)) {
      throw new Error(`forbidden tcpdump flag: ${a}`);
    }
  }
  return true;
}

/**
 * Parse a single tcpdump endpoint token into { ip, port } without assuming IPv4.
 * Supports: 1.2.3.4.80 | 2001:db8::1.443 | [2001:db8::1].443
 */
export function parseEndpoint(token) {
  if (!token || typeof token !== "string") return null;
  if (token.startsWith("[")) {
    const m = token.match(/^\[([0-9a-fA-F:]+)\]\.(\d+)$/);
    if (!m) return null;
    return { ip: m[1].toLowerCase(), port: Number(m[2]) };
  }
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const portS = token.slice(lastDot + 1);
  if (!/^\d{1,5}$/.test(portS)) return null;
  const ip = token.slice(0, lastDot);
  if (isIPv4(ip) || isIPv6(ip)) return { ip: isIPv6(ip) ? ip.toLowerCase() : ip, port: Number(portS) };
  return null;
}

function ipv6PrefixBits(ip, prefixLen) {
  // Expand compressed IPv6 to 8 hextets then compare first prefixLen bits.
  const parts = ip.toLowerCase().split("::");
  let hextets;
  if (parts.length === 1) {
    hextets = parts[0].split(":");
  } else {
    const left = parts[0] ? parts[0].split(":") : [];
    const right = parts[1] ? parts[1].split(":") : [];
    const fill = 8 - left.length - right.length;
    hextets = [...left, ...Array(Math.max(0, fill)).fill("0"), ...right];
  }
  while (hextets.length < 8) hextets.push("0");
  const bits = hextets
    .slice(0, 8)
    .map((h) => Number.parseInt(h || "0", 16).toString(2).padStart(16, "0"))
    .join("");
  return bits.slice(0, prefixLen);
}

export function sameIpv6Prefix(a, b, prefixLen) {
  if (!isIPv6(a) || !isIPv6(b) || !prefixLen) return false;
  try {
    return ipv6PrefixBits(a, prefixLen) === ipv6PrefixBits(b, prefixLen);
  } catch {
    return false;
  }
}

/** Expand IPv6 to 8 hextets (lowercase). */
function expandIpv6Hextets(ip) {
  const parts = ip.toLowerCase().split("::");
  let hextets;
  if (parts.length === 1) {
    hextets = parts[0].split(":");
  } else {
    const left = parts[0] ? parts[0].split(":") : [];
    const right = parts[1] ? parts[1].split(":") : [];
    const fill = 8 - left.length - right.length;
    hextets = [...left, ...Array(Math.max(0, fill)).fill("0"), ...right];
  }
  while (hextets.length < 8) hextets.push("0");
  return hextets.slice(0, 8).map((h) => (h || "0").replace(/^0+(?=\w)/, "") || "0");
}

/**
 * Network address string suitable for tcpdump `net <addr>/<pfx>` (IPv6).
 * Zeros host bits beyond prefixLen.
 */
export function ipv6NetworkCidr(ip, prefixLen) {
  const pfx = prefixLen || 64;
  const hextets = expandIpv6Hextets(ip);
  const bits = hextets
    .map((h) => Number.parseInt(h || "0", 16).toString(2).padStart(16, "0"))
    .join("");
  const kept = bits.slice(0, pfx).padEnd(128, "0");
  const out = [];
  for (let i = 0; i < 8; i++) {
    out.push(Number.parseInt(kept.slice(i * 16, i * 16 + 16), 2).toString(16));
  }
  // Compress trailing zeros lightly for readability (optional); full form is fine for BPF.
  return `${out.join(":")}/${pfx}`;
}

export function classify(ip, addrs) {
  if (!ip) return "EXTERNAL";
  const v = isIPv6(ip) ? ip.toLowerCase() : ip;
  if (v === addrs.n8n4 || (addrs.n8n6 && v === addrs.n8n6.toLowerCase())) return "N8N";
  if (v === addrs.lit4 || (addrs.lit6 && v === addrs.lit6.toLowerCase())) return "LITELLM";
  if (isIPv4(v) && addrs.lit4Net && v.startsWith(addrs.lit4Net + ".")) return "DOCKER_NET";
  if (isIPv6(v) && addrs.lit6 && sameIpv6Prefix(v, addrs.lit6, addrs.lit6PrefixLen || 64)) return "DOCKER_NET";
  return "EXTERNAL";
}

export function directionFor(srcCls, dstCls, tcpFlags) {
  const flagsNorm = String(tcpFlags || "").replace(/[.]/g, "");
  if (flagsNorm.includes("F") || flagsNorm.includes("R")) return "CONNECTION_CLOSE";
  if (srcCls === "N8N" && dstCls === "LITELLM") return "N8N_TO_LITELLM";
  if (srcCls === "LITELLM" && (dstCls === "EXTERNAL" || dstCls === "DOCKER_NET")) return "LITELLM_TO_EXTERNAL";
  return "OTHER";
}

function isoFromEpoch(epochSec) {
  return new Date(Math.round(epochSec * 1000)).toISOString();
}

/**
 * Parse one tcpdump text line (IPv4 or IP6) into a sanitized event, or null.
 * addrs: discovery result; seenKeys: optional Map for In/Out twin dedupe.
 */
export function parseLine(line, addrs, seenKeys = null) {
  // SLL2 (-i any): "<epoch> <iface> In|Out|P|B|-- IP|IP6 <src> > <dst>: <tail>"
  const m = line.match(
    /^(\d+\.\d+)\s+\S+\s+(?:In|Out|P|B|--)?\s*(IP6?)\s+(\S+)\s*>\s*(\S+):\s*(.*)$/,
  );
  if (!m) return null;
  const [, tsS, _fam, srcTok, dstTok, tail] = m;
  const src = parseEndpoint(srcTok.replace(/,$/, ""));
  const dst = parseEndpoint(dstTok.replace(/,$/, ""));
  if (!src || !dst) return null;
  const tsEpoch = Number(tsS);
  const fm = tail.match(/Flags \[([^\]]*)\]/);
  const tcpFlags = fm ? fm[1] : "";
  const srcCls = classify(src.ip, addrs);
  const dstCls = classify(dst.ip, addrs);
  const direction = directionFor(srcCls, dstCls, tcpFlags);
  const flagsNorm = tcpFlags.replace(/[.]/g, "");
  if (seenKeys) {
    const bucket = Math.floor(tsEpoch * 1000);
    const key = `${bucket}|${src.ip}|${src.port}|${dst.ip}|${dst.port}|${flagsNorm}`;
    if (seenKeys.has(key)) return null;
    seenKeys.set(key, 1);
    if (seenKeys.size > 200000) seenKeys.clear();
  }
  return {
    ts: isoFromEpoch(tsEpoch),
    ts_epoch: tsS,
    direction,
    src_class: srcCls,
    dst_class: dstCls,
    src_port: src.port,
    dst_port: dst.port,
    tcp_flags: tcpFlags,
  };
}

/** Ensure serialized event has only the allowed schema keys (no IP literals). */
export function sanitizeEvent(ev) {
  if (!ev || typeof ev !== "object") return null;
  const out = {};
  for (const k of EVENT_KEYS) out[k] = ev[k];
  return out;
}

export function eventContainsLiteralAddress(serialized) {
  // Forbidden keys
  if (/"src_ip"|"dst_ip"|"src_addr"|"dst_addr"/i.test(serialized)) return true;
  // Dotted-quad IPv4 (not timestamps: require 4 octets with each <= 255-ish pattern)
  if (/(?:^|[^0-9])(?:\d{1,3}\.){3}\d{1,3}(?:[^0-9]|$)/.test(serialized)) return true;
  // IPv6: colon groups with at least 2 colons (timestamps have HH:MM:SS but also T/Z — exclude ISO)
  const withoutIso = serialized.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g,
    "<iso>",
  );
  if (/[0-9a-fA-F]{0,4}(?::[0-9a-fA-F]{0,4}){2,}/.test(withoutIso)) return true;
  return false;
}

export { EVENT_KEYS, FORBIDDEN_TCPDUMP_FLAGS };

function main(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const m = argv[i].match(/^--([a-z0-9-]+)=(.*)$/i);
    if (m) {
      args[m[1]] = m[2];
      continue;
    }
    const k = argv[i].replace(/^--/, "");
    args[k] = argv[++i] ?? "";
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

  const addrs = discoverContainerAddrs();
  if (!addrs.ok) fail("DISCOVERY_FAILED", addrs.reason);

  // Meta: never print literal container/external IPs — only presence flags.
  console.error(
    JSON.stringify({
      ok: true,
      observer: "observe-litellm-primary-network.mjs",
      backend: "tcpdump-text-metadata-only",
      started_at: new Date().toISOString(),
      duration_ms: DURATION_MS,
      ipv4: true,
      ipv6: Boolean(addrs.n8n6 && addrs.lit6),
      litellm_ipv6_present: Boolean(addrs.lit6),
      note: "container IPs resolved at runtime; not persisted in events or meta",
    }),
  );

  const FILTER = buildFilter(addrs);
  const TCPDUMP_ARGS = buildTcpdumpArgs(FILTER);
  assertSafeTcpdumpArgs(TCPDUMP_ARGS);

  const events = [];
  let fd = null;
  if (OUT_FILE) fd = openSync(OUT_FILE, "w");
  const seenKeys = new Map();

  const child = spawn("tcpdump", TCPDUMP_ARGS, { stdio: ["ignore", "pipe", "pipe"] });

  let pending = "";
  let stopped = false;

  function stop(reason) {
    if (stopped) return;
    stopped = true;
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        /* ignore */
      }
    }, 2000).unref();
    const counts = {};
    for (const e of events) counts[e.direction] = (counts[e.direction] || 0) + 1;
    console.error(
      JSON.stringify({
        ok: true,
        classification: "OBSERVER_COMPLETED",
        reason,
        events: events.length,
        counts,
        ended_at: new Date().toISOString(),
      }),
    );
    if (fd !== null) {
      try {
        closeSync(fd);
      } catch {
        /* ignore */
      }
    }
    process.exit(0);
  }

  child.stdout.on("data", (chunk) => {
    pending += chunk.toString("utf8");
    let idx;
    while ((idx = pending.indexOf("\n")) >= 0) {
      const line = pending.slice(0, idx).trim();
      pending = pending.slice(idx + 1);
      if (!line) continue;
      const ev = sanitizeEvent(parseLine(line, addrs, seenKeys));
      if (!ev) continue;
      events.push(ev);
      if (fd !== null) {
        try {
          writeSync(fd, JSON.stringify(ev) + "\n");
        } catch {
          /* ignore */
        }
      }
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
    try {
      child.kill("SIGKILL");
    } catch {
      /* ignore */
    }
    process.exit(0);
  }, DURATION_MS + 30000).unref();
}

const isDirect =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirect) {
  main();
}

#!/usr/bin/env node
/**
 * Deterministic zero-provider tests for observe-litellm-primary-network.mjs
 * IPv4 + IPv6 classification / parsing / sanitization / tcpdump safety.
 *
 * Uses documentation-range addresses only (RFC 5737 / RFC 3849).
 * No network I/O. No provider calls.
 */

import {
  parseEndpoint,
  parseLine,
  classify,
  directionFor,
  buildFilter,
  buildTcpdumpArgs,
  assertSafeTcpdumpArgs,
  sanitizeEvent,
  eventContainsLiteralAddress,
  discoverContainerAddrs,
  FORBIDDEN_TCPDUMP_FLAGS,
} from "./observe-litellm-primary-network.mjs";

const addrsV4Only = {
  ok: true,
  n8n4: "203.0.113.10",
  lit4: "203.0.113.20",
  n8n6: null,
  lit6: null,
  lit6PrefixLen: 64,
  lit4Net: "203.0.113",
};

const addrsDual = {
  ok: true,
  n8n4: "203.0.113.10",
  lit4: "203.0.113.20",
  n8n6: "2001:db8:d0c::10",
  lit6: "2001:db8:d0c::20",
  lit6PrefixLen: 64,
  lit4Net: "203.0.113",
};

let failed = 0;
function check(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name}${detail ? " — " + detail : ""}`);
  }
}

// A. IPv4 ingress
{
  const line =
    "1788020825.552202 veth0 In IP 203.0.113.10.53580 > 203.0.113.20.4000: Flags [S], seq 1, win 64240, length 0";
  const ev = parseLine(line, addrsDual);
  check("A_ipv4_ingress_direction", ev?.direction === "N8N_TO_LITELLM", JSON.stringify(ev));
  check("A_ipv4_ingress_classes", ev?.src_class === "N8N" && ev?.dst_class === "LITELLM");
}

// B. IPv4 outbound
{
  const line =
    "1788020825.600000 veth0 Out IP 203.0.113.20.4000 > 198.51.100.50.443: Flags [S], seq 1, win 64240, length 0";
  const ev = parseLine(line, addrsDual);
  check("B_ipv4_outbound_direction", ev?.direction === "LITELLM_TO_EXTERNAL", JSON.stringify(ev));
}

// C. IPv6 ingress
{
  const line =
    "1788020825.700000 veth0 In IP6 2001:db8:d0c::10.53580 > 2001:db8:d0c::20.4000: Flags [S], seq 1, win 64240, length 0";
  const ev = parseLine(line, addrsDual);
  check("C_ipv6_ingress_direction", ev?.direction === "N8N_TO_LITELLM", JSON.stringify(ev));
  check("C_ipv6_ingress_ports", ev?.src_port === 53580 && ev?.dst_port === 4000);
}

// C2. bracketed IPv6 endpoint form
{
  const ep = parseEndpoint("[2001:db8:d0c::10].53580");
  check("C2_bracketed_ipv6_endpoint", ep?.ip === "2001:db8:d0c::10" && ep?.port === 53580);
}

// D. IPv6 outbound
{
  const line =
    "1788020825.800000 veth0 Out IP6 2001:db8:d0c::20.44444 > 2001:db8:ffff::1.443: Flags [S], seq 1, win 64240, length 0";
  const ev = parseLine(line, addrsDual);
  check("D_ipv6_outbound_direction", ev?.direction === "LITELLM_TO_EXTERNAL", JSON.stringify(ev));
  check("D_ipv6_outbound_dst_external", ev?.dst_class === "EXTERNAL");
}

// E. IPv6 FIN
{
  const line =
    "1788020825.900000 veth0 In IP6 2001:db8:d0c::10.53580 > 2001:db8:d0c::20.4000: Flags [F.], seq 2, ack 3, win 64240, length 0";
  const ev = parseLine(line, addrsDual);
  check("E_ipv6_fin_close", ev?.direction === "CONNECTION_CLOSE", JSON.stringify(ev));
}

// F. IPv6 RST
{
  const line =
    "1788020825.910000 veth0 Out IP6 2001:db8:d0c::20.4000 > 2001:db8:d0c::10.53580: Flags [R.], seq 3, win 0, length 0";
  const ev = parseLine(line, addrsDual);
  check("F_ipv6_rst_close", ev?.direction === "CONNECTION_CLOSE", JSON.stringify(ev));
}

// G. IPv6 return traffic must NOT be LITELLM_TO_EXTERNAL
{
  const line =
    "1788020825.920000 veth0 In IP6 2001:db8:ffff::1.443 > 2001:db8:d0c::20.44444: Flags [S.], seq 1, ack 2, win 64240, length 0";
  const ev = parseLine(line, addrsDual);
  check("G_ipv6_return_parses", Boolean(ev), JSON.stringify(ev));
  check(
    "G_ipv6_return_not_outbound",
    ev?.direction !== "LITELLM_TO_EXTERNAL" && ev?.direction === "OTHER",
    JSON.stringify(ev),
  );
  check("G_ipv6_return_classes", ev?.src_class === "EXTERNAL" && ev?.dst_class === "LITELLM");
}

// H. Missing IPv6 — IPv4 still works; filter has no IPv6 host clauses
{
  const line =
    "1788020825.552202 veth0 In IP 203.0.113.10.53580 > 203.0.113.20.4000: Flags [S], seq 1, win 64240, length 0";
  const ev = parseLine(line, addrsV4Only);
  check("H_missing_ipv6_ipv4_ingress", ev?.direction === "N8N_TO_LITELLM");
  const f = buildFilter(addrsV4Only);
  check("H_filter_has_ipv4", f.includes("203.0.113.10") && f.includes("203.0.113.20"));
  check("H_filter_no_ipv6_host", !f.includes("2001:db8"));
  // IPv6 line must not be classifiable as N8N without discovered IPv6
  const line6 =
    "1788020825.700000 veth0 In IP6 2001:db8:d0c::10.53580 > 2001:db8:d0c::20.4000: Flags [S], seq 1, win 64240, length 0";
  const ev6 = parseLine(line6, addrsV4Only);
  check(
    "H_undiscovered_ipv6_not_n8n_to_litellm",
    ev6?.direction !== "N8N_TO_LITELLM",
    JSON.stringify(ev6),
  );
}

// I. Sanitization — no literal IPs in serialized events
{
  const line =
    "1788020825.800000 veth0 Out IP6 2001:db8:d0c::20.44444 > 2001:db8:ffff::1.443: Flags [S], seq 1, win 64240, length 0";
  const ev = sanitizeEvent(parseLine(line, addrsDual));
  const s = JSON.stringify(ev);
  check("I_sanitization_no_literal", !eventContainsLiteralAddress(s), s);
  check(
    "I_schema_keys_only",
    Object.keys(ev).sort().join(",") ===
      ["direction", "dst_class", "dst_port", "src_class", "src_port", "tcp_flags", "ts", "ts_epoch"].sort().join(","),
  );
}

// J. tcpdump safety
{
  const args = buildTcpdumpArgs(buildFilter(addrsDual));
  let ok = true;
  try {
    assertSafeTcpdumpArgs(args);
  } catch {
    ok = false;
  }
  check("J_tcpdump_no_forbidden", ok);
  check(
    "J_tcpdump_no_payload_flags",
    !FORBIDDEN_TCPDUMP_FLAGS.some((f) => args.includes(f)) && args.includes("-nn"),
  );
  check("J_filter_includes_ipv6_when_present", buildFilter(addrsDual).includes("2001:db8:d0c::20"));
}

// Extra: directionFor / classify unit
{
  check("X_classify_n8n6", classify("2001:db8:d0c::10", addrsDual) === "N8N");
  check("X_classify_lit6", classify("2001:db8:d0c::20", addrsDual) === "LITELLM");
  check("X_classify_ext6", classify("2001:db8:ffff::1", addrsDual) === "EXTERNAL");
  check(
    "X_direction_close_fin",
    directionFor("N8N", "LITELLM", "F.") === "CONNECTION_CLOSE",
  );
}

// Discovery missing-IPv6 mock
{
  const mock = (field) => {
    if (field.includes("GlobalIPv6Address")) return "";
    if (field.includes("GlobalIPv6PrefixLen")) return "0";
    if (field.includes("IPAddress") && field.includes) {
      // both containers get IPv4 from same template — use sequential call count
    }
    return "";
  };
  let calls = 0;
  const mockInspect = (field, container) => {
    calls += 1;
    if (field.includes("GlobalIPv6")) return "";
    if (container === "root-n8n-1") return "203.0.113.10";
    if (container === "litellm-primary") return "203.0.113.20";
    return "";
  };
  const d = discoverContainerAddrs(mockInspect);
  check("H2_discovery_ok_without_ipv6", d.ok === true && d.n8n6 === null && d.lit6 === null);
}

if (failed > 0) {
  console.error(JSON.stringify({ ok: false, failed }));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, classification: "ALL_PASS" }));

# D-0025-W — Packet IPv6 observer coverage

**Block ID:** `D0025_W_PACKET_IPV6_OBSERVER_COVERAGE`  
**Starting HEAD / expected origin/main:** `b3aca3be5f340df673ed8fa8a13d3207f2485dae`  
**Packet:** `EP-D-0025-W-GLM-LIVE-001` (`READY_FOR_GATE`)  
**Operator gate resolution:** `docs/runtime/AUTH_D0025_W_EP_D0025_W_GLM_LIVE_001_GATE_RESOLUTION.operator.json` (seen)  
**Status:** **PASS** — metadata-only observer now covers IPv6 litellm-primary traffic  
**Provider calls Δ:** **0** · LiteLLM `/v1/responses` Δ **0** · GLM Δ **0** · tranche 02 remains **1/10 / 1/10**

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main == expected | PASS |
| packet exists · status READY_FOR_GATE | PASS |
| operator gate-resolution artifact | PASS |
| CURRENT_FRONTIER `PACKET_HUMAN_GATE_RESOLVED` · NEXT = this block | PASS |
| tranche02 GLM 1/10 · LiteLLM 1/10 | PASS |
| runtime gate CLOSED · WF61 inactive | PASS (frontier + VPS recheck) |

## Change

`tools/observe-litellm-primary-network.mjs`:

- Dynamic discovery of container IPv4 (required) + optional GlobalIPv6Address / prefix length.
- BPF filter extended: N8N↔LiteLLM IPv4/IPv6; LiteLLM→external IPv4; LiteLLM→external IPv6 when LiteLLM has IPv6.
- Robust endpoint parser for `IP` and `IP6` (dotted port; bracketed IPv6 supported).
- Classification: discovered n8n/litellm IPv6 → N8N/LITELLM; same IPv6 prefix → DOCKER_NET; else EXTERNAL.
- Directions unchanged: `N8N_TO_LITELLM` · `LITELLM_TO_EXTERNAL` · `CONNECTION_CLOSE` · `OTHER`.
- tcpdump args: `-tt -nn -l -i any` — still never `-A/-X/-x/-w`.
- Meta output: presence flags only (no literal IPs).
- Event schema unchanged; `sanitizeEvent` enforces allowed keys.
- Missing IPv6: IPv4 path unchanged.

Test surface: `tools/observe-litellm-primary-network.test.mjs` (documentation-range addresses only; no network I/O).

## Deterministic tests

| ID | Case | Result |
|---|---|---|
| A | IPv4 ingress → N8N_TO_LITELLM | PASS |
| B | IPv4 outbound → LITELLM_TO_EXTERNAL | PASS |
| C | IPv6 ingress → N8N_TO_LITELLM | PASS |
| D | IPv6 outbound → LITELLM_TO_EXTERNAL | PASS |
| E | IPv6 FIN → CONNECTION_CLOSE | PASS |
| F | IPv6 RST → CONNECTION_CLOSE | PASS |
| G | IPv6 return EXTERNAL→LITELLM parses; not LITELLM_TO_EXTERNAL | PASS |
| H | Missing container IPv6 → IPv4 still works; filter has no IPv6 | PASS |
| I | Serialized events: no literal IPv4/IPv6; schema keys only | PASS |
| J | tcpdump args: no payload/pcap flags; `-nn` present | PASS |

Command: `node tools/observe-litellm-primary-network.test.mjs` → `ALL_PASS`.

## Preserve / out of scope

No mutations to workflows, LiteLLM/provider config, Docker/network, credentials, helper one-shot, CASE B, schema, normalizer, OpenClaw, V4 Qwen. Child-row `287888` and node 6112 not touched. No gate arm / WF trigger / provider inference.

## Persisted fields

| Field | Value |
|---|---|
| result_cursor | `PASS_IPV6_OBSERVER_COVERAGE` |
| packet_id | `EP-D-0025-W-GLM-LIVE-001` |
| operator_gate_resolution_seen | `true` |
| observer_ipv4_preserved | `true` |
| observer_ipv6_supported | `true` |
| ipv6_ingress_test / outbound / close / missing_ipv6_fallback / sanitization | all PASS |
| tcpdump_payload_capture | `none` |
| provider_calls_delta / litellm_responses_delta / glm_delta | `0` / `0` / `0` |
| tranche_02_glm_used / litellm_used | `1/10` / `1/10` |
| gate_closed_final | `true` |
| WF61_final | `inactive` |
| bugbot_review | PASS (no findings) |
| architecture_report | `reports/architecture/d0025_packet_ipv6_observer_coverage.md` |
| checkpoint_path | `docs/runtime/CHECKPOINT_D0025_W_PACKET_IPV6_OBSERVER_COVERAGE.md` |
| NEXT | `D0025_W_CHILD_ROW_287888_ACCOUNTING_DIAGNOSIS` (not executed this pass) |

## Output line

`PASS — D0025 PACKET IPV6 OBSERVER COVERAGE COMPLETE / PACKET=EP-D-0025-W-GLM-LIVE-001`

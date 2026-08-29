# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — packet item IPv6 observer coverage → **PASS** |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `EVENT03_PASS_VALID_EXECUTION_PACKET / PACKET_HUMAN_GATE_RESOLVED / PACKET_IPV6_OBSERVER_COVERAGE_PASS` |
| **GATE CORRENTE** | Runtime gate **CLOSED** — no provider calls authorized |
| **NEXT** | `D0025_W_CHILD_ROW_287888_ACCOUNTING_DIAGNOSIS` — separate bounded item; do **not** execute in the IPv6 observer pass. Issue **#31** remains OPEN. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof preserved · versionId `dcf124b9-0cb3-428b-8a09-a6afda8d2083` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **11** `/v1/responses` calls |
| **BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **1/10 used** · LiteLLM **1/10 used** · retry **0** · fallback **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Packet item completed

- `EP-D-0025-W-GLM-LIVE-001` human gate was resolved; selected bounded item = IPv6 observer coverage.
- `tools/observe-litellm-primary-network.mjs` now discovers optional container GlobalIPv6Address, extends BPF for IPv6 ingress/outbound, parses `IP6` endpoints, and classifies `LITELLM_TO_EXTERNAL` for IPv6 upstream without persisting literal addresses.
- Deterministic tests A–J PASS (`tools/observe-litellm-primary-network.test.mjs`); provider Δ=0.

## Boundaries

- Do NOT arm runtime gate or trigger WF40/WF61 for the child-row item unless separately authorized.
- Do NOT auto-dispatch Cursor from the packet (policy GATE remains).
- Node 6112 remains out of scope.
- Keep helper / CASE B / schema / normalizer / LiteLLM config / network unchanged unless a later authorized pass says otherwise.

## Puntatori

- Architecture report: `reports/architecture/d0025_packet_ipv6_observer_coverage.md`
- Checkpoint: `docs/runtime/CHECKPOINT_D0025_W_PACKET_IPV6_OBSERVER_COVERAGE.md`
- Packet: `docs/packets/EP-D-0025-W-GLM-LIVE-001.json`
- Operator gate resolution: `docs/runtime/AUTH_D0025_W_EP_D0025_W_GLM_LIVE_001_GATE_RESOLUTION.operator.json`
- Observer tool: `tools/observe-litellm-primary-network.mjs`
- Issue **#31** — OPEN

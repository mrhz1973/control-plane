# CURRENT FRONTIER — LIVE STATE

> **Unica fonte canonica dello stato operativo vivo.**

| Campo | Valore |
|---|---|
| **FOUNDATION** | v3.2 — LiteLLM primary remote gateway — CANONICAL |
| **WORKSTREAM ATTIVO** | `ARCHITECTURE-V3-EVIDENCE-TRACK` |
| **ACTIVE WORK** | issue **#31 D-0025-W** — valid packet `EP-D-0025-W-GLM-LIVE-001`; packet human gate explicitly RESOLVED by operator; bounded execution item selected: IPv6 observer coverage |
| **BLOCCO ATTIVO** | `D0025_W_LITELLM_PRIMARY_REMOTE_INTEGRATION` |
| **STATO BLOCCO** | `EVENT03_PASS_VALID_EXECUTION_PACKET / PACKET_HUMAN_GATE_RESOLVED / PACKET_EXECUTION_IPV6_OBSERVER_COVERAGE_READY` |
| **GATE CORRENTE** | **AUTO-VIA RELEASED for repo-only bounded packet execution item** — runtime gate remains CLOSED; no provider calls authorized |
| **NEXT** | Execute `D0025_W_PACKET_IPV6_OBSERVER_COVERAGE`: extend `tools/observe-litellm-primary-network.mjs` so `LITELLM_TO_EXTERNAL` metadata-only observation covers IPv6 upstream traffic as well as IPv4, with deterministic offline/parser tests and zero provider calls. Preserve all packet forbidden paths, no-secret, no-destructive, no scope expansion. Child-row `287888` accounting remains a separate later bounded item. |
| **WF40 LIVE** | active · `9ZMj2ACTKyDVhCue` · 44 nodes |
| **WF61 LIVE** | **inactive** · `d0025-6100-4001-8001-000000000061` · hang-proof 6104/6106/6107 · 6106 `2>&1 \|\| true` · 6109/6110 canonical · versionId `dcf124b9-0cb3-428b-8a09-a6afda8d2083` |
| **REMOTE RUNTIME GATE** | `enabled=false` · `provider_calls_authorized_per_event=0` · **CLOSED** |
| **LITELLM LIVE — HISTORICAL** | **11** `/v1/responses` calls |
| **BOUNDED BUDGET** | `D0025_W_GLM_TRANCHE_02` — GLM **1/10 used** · LiteLLM **1/10 used** · retry **0** · fallback **0** · Codex **0** · Qwen **0** · Cursor auto-dispatch **0** |

## Packet gate resolution

- Operator explicitly confirmed for `EP-D-0025-W-GLM-LIVE-001` that the three contradictory generated `hard_constraints` do **not** authorize or require scope expansion, destructive/irreversible action, or manual secret entry.
- Binding constraints remain: `forbidden_paths`, no-secret, no-destructive, no scope expansion.
- Canonical persisted resolution: `docs/runtime/AUTH_D0025_W_EP_D0025_W_GLM_LIVE_001_GATE_RESOLUTION.operator.json`.
- This resolution clears only the packet human gate; it does not weaken any other packet/repository boundary.

## Packet execution selection

GPT-Web resolves the packet's generic "select exactly one next bounded remaining item" against the current canonical live frontier. The selected item is the already-recorded IPv6 observer coverage gap because it is:

- inside packet `allowed_paths` (`tools/`, `reports/architecture/`, `docs/runtime/`);
- non-destructive and repo-only;
- zero-provider / zero-secret;
- directly tied to the live Event03 evidence gap (`api.z.ai` upstream was IPv6-only while the observer was IPv4-scoped);
- bounded independently from the child-row accounting recurrence.

## Boundaries

- Do NOT auto-dispatch any provider/model cycle in the packet execution item.
- Do NOT arm runtime gate or activate WF61.
- Do NOT mutate workflows, LiteLLM config, provider config, Docker/network/firewall, credentials, OpenClaw, WF60, Tailscale, TeamViewer, or V4 Qwen.
- Preserve metadata-only observer guarantees: no payload/header/body capture; no external literal IP persistence.
- Tranche 02 remains **1/10 used** for GLM and LiteLLM during this repo-only pass.
- Child-row hang/accounting `287888` remains recorded-only and out of scope for the IPv6 observer item.
- Node 6112 json-shape finding remains out of scope.

## Puntatori

- Packet: `docs/packets/EP-D-0025-W-GLM-LIVE-001.json`
- Operator gate resolution: `docs/runtime/AUTH_D0025_W_EP_D0025_W_GLM_LIVE_001_GATE_RESOLUTION.operator.json`
- Event 03 report: `reports/architecture/d0025_glm_tranche02_live_event03_with_network_observer.md`
- Observer tool: `tools/observe-litellm-primary-network.mjs`
- Observer prep: `reports/architecture/d0025_litellm_ingress_socket_observer_prep.md`
- Budget authorization: `docs/runtime/AUTH_D0025_W_GLM_BUDGET_TRANCHE_02.operator.json`
- Issue **#31** — OPEN

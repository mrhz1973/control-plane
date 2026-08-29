# D-0025-W — GLM tranche 02 live event 03 with network observer

**Block ID:** `D0025_W_GLM_TRANCHE02_LIVE_EVENT_03_WITH_NETWORK_OBSERVER`  
**Starting HEAD / expected origin/main:** `d49d53ba948d98a00ed377d1b1c5a0ff4d8e926c`  
**Trigger:** `989501e103090bf9a2dea2eb4e62a42c8add36ce` (retry trigger 19; arm-first; observer active before trigger)  
**Canonical task:** `D-0025-W-GLM-LIVE-001`  
**Budget:** `D0025_W_GLM_TRANCHE_02` (pre: GLM 0/10 · LiteLLM 0/10)  
**Status:** **PASS** — valid Execution Packet obtained (`execution-packet-v1` · `READY_FOR_GATE`)  
**Transport classification:** none — HTTP completed **200** before wall; no A–E transport verdict required

---

## Precheck (provider_calls=0)

| Check | Result |
|---|---|
| origin/main exact (`d49d53b…`) | PASS |
| workspace clean | PASS |
| CURRENT_FRONTIER coherent (observer prep PASS) | PASS |
| `tools/observe-litellm-primary-network.mjs` present | PASS (committed; deployed to mount for the event, removed after) |
| WF40 active (`9ZMj2ACTKyDVhCue`, 44 nodes) · WF61 inactive | PASS |
| WF61 13 nodes · versionId `dcf124b9…` | PASS |
| live 6106 `executeCommand` + one-shot + `2>&1 \|\| true` + wall 115000 | PASS |
| Runtime gate CLOSED pre-arming | PASS |
| tranche02 GLM 0/10 · LiteLLM 0/10 · historical **10** | PASS |
| `litellm-primary` / `root-n8n-1` running, restarts 0 | PASS |
| shared `root_default` (172.18.0.2 / 172.18.0.3) | PASS |
| tcpdump 4.99.4 + node v18 available | PASS |
| external ESTABLISHED baseline | **0** (recorded) |

---

## Observer window

| Field | Value |
|---|---|
| backend | tcpdump text metadata-only (`-tt -n -l -i any`, SLL2) |
| observer_start | **2026-08-29T23:05:38.140Z** (meta log) · pid verified alive 23:05:41Z |
| observer_end | **2026-08-29T23:10:38.245Z** (`OBSERVER_COMPLETED`/`duration_elapsed`) |
| duration | 300000 ms exactly; covered pre-trigger + ~97 s request + **post-response grace ≥ 115 s** |
| events | **10** · `N8N_TO_LITELLM` **4** · `CONNECTION_CLOSE` **2** · `OTHER` (return path) 4 |
| payload captured | **none** (metadata-only verified: 0 violations; file deleted after sanitized summary persisted) |
| external IPs persisted | **none** (classes only) |

## Timeline (UTC, 2026-08-29)

| Time | Event |
|---|---|
| 23:05:38.140 | Observer started (before gate arm) |
| ~23:05:5x | Gate ARMED (one event) · WF61 activated (hang-proof verified pre-publish) |
| 23:05:58 | Trigger 19 pushed (`989501e…`) |
| 23:07:02.006 | WF40 `287887` started |
| 23:07:03.297 | WF61 `287888` started |
| **23:07:03.891** | Observer: **N8N→LITELLM** SYN/ACK/PSH on `172.18.0.2:57980 → 172.18.0.3:4000` (request ingressed) |
| **23:08:40.916** | LiteLLM access log: `POST /v1/responses` → **200 OK** (11th historical call; Δ=1) |
| 23:08:40.917 | Observer: LITELLM→N8N PSH (response bytes) + FIN pair both directions (clean close, **no wall event**) |
| 23:08:41.193 | WF40 `287887` stopped **success** — carries canonical cycle result + Execution Packet |
| 23:10:38.245 | Observer bounded termination (grace ~117 s after response) |
| later | Child row `287888` still `running` with purged execution_data (recurrence of documented post-HTTP200 child-row hang) |

`client_close_relative_to_wall_ms` — **n/a** (no wall; clean server-side FIN at response completion, +96 996 ms after ingress).

## Upstream observation caveat (recorded honestly)

`LITELLM_TO_EXTERNAL` was **not** observed. Deterministic follow-up: `api.z.ai` resolves to **IPv6-only** addresses on this host (`240b:…`), and the observer's BPF was IPv4-scoped (`host <ipv4>`), so an IPv6 upstream dispatch was structurally invisible to the probe. This is an **observer coverage gap, not evidence of no dispatch**. LiteLLM's own canonical access log (completion `200`) plus the zai-backed alias with no fallback chain (config: `drop_params`, no degrade, no mock) deterministically proves the gateway processed the request end-to-end.

## Live result

| Field | Value |
|---|---|
| WF40 / WF61 | `287887` success / `287888` (child row stuck; canonical result delivered to parent) |
| transport_classification | **none — HTTP_COMPLETED path** (no hang-proof terminal) |
| http_status | **200** |
| elapsed (ingress→200) | ~96 996 ms (within 115 000 wall) |
| cycle classification | **`PASS`** (`n8n-litellm-primary-cycle-result-v1` · ok=true) |
| response_gate | PASS · response_source_format json |
| packet | `execution-packet-v1` · status **`READY_FOR_GATE`** · `EP-D-0025-W-GLM-LIVE-001` rev 1 |
| packet_census | structural PASS · top-level required all present · nested (planner/loop/risk/gate/context/review) all present |
| deterministic_completion | applied=true · completed `final_report_contract` |
| schema_result | PASS (census-based; packet persisted at `docs/packets/EP-D-0025-W-GLM-LIVE-001.json`, sha256 head `9f517517c669f61a`) |
| policy_result | decision **`GATE`** · `cursor_dispatch_allowed=false` |
| planner | requested=glm · used=glm · fallback_used=false |
| packet goal | next bounded Execution Packet for remaining D-0025-W work · 6 steps · branch main |
| retry / fallback / qwen / codex / cursor dispatch | **0** each |

## Budget accounting

| Budget | Pre | Post | Basis |
|---|---|---|---|
| LiteLLM `/v1/responses` | 10 total / 0 tranche | **11 total / 1 tranche** | access log completion `200` (request processed) |
| GLM | 0/10 | **1/10** | conservative: gateway 200 under zai-backed alias `planner-glm-pilot`, no fallback/mock path; IPv6 dispatch invisible to observer (coverage gap) — treated as consumed |

Exactly **one** new WF61 execution (`287888`); exactly **one** LiteLLM request; **one** GLM attempt; **no** retry/fallback; no Cursor auto-dispatch (policy GATE).

## Post-event state

| Check | Result |
|---|---|
| Runtime gate | restored **CLOSED** (`enabled=false`, 0) |
| WF61 | **inactive** (`active=0`), hang-proof preserved (verified before inactive import) |
| Observer | terminated bounded; raw NDJSON **deleted** after sanitized summary persisted; metadata-only violations **0** |
| Observer tool on mount | removed (canonical copy remains in repo `tools/`) |
| Containers | both running, restarts **0** (no restarts this pass) |
| Workflows/config/network mutated | none (arm/restore protocol only) |
| Secondary 6112 | **not encountered** (`A 'json' property isn't an object` absent in event data) — remains out of scope |

## Secondary finding — child execution row hang (recorded, not repaired)

`287888` remained `running` with purged `execution_data` after the parent completed — the third occurrence of the documented `WF61_HUNG_AFTER_LITELLM_HTTP_200`/child-row pattern (see `d0025_wf61_post_http200_hang_offline_diagnosis.md` and Attempt 16). Notable difference: this time the canonical parent cycle result **was** emitted and captured (6106 exit normalization + capture/finalize chain worked), so the hang is confined to the child execution row accounting. Out of repair scope this pass.

## Persisted fields

| Field | Value |
|---|---|
| result_cursor | `PASS_VALID_EXECUTION_PACKET` |
| classification | `HTTP_COMPLETED_PASS` (no A–E transport verdict; packet obtained) |
| wf40_exec / wf61_exec | `287887` / `287888` |
| observer_backend | `tcpdump-4.99.4-text-metadata-only` |
| observer_start / observer_end | `2026-08-29T23:05:38.140Z` / `2026-08-29T23:10:38.245Z` |
| n8n_to_litellm_seen | `true` (4 events; SYN 23:07:03.891Z) |
| litellm_to_external_seen | `false` (IPv4-only observer coverage gap; upstream is IPv6-only — see caveat) |
| client_close_seen | `true` (clean FIN pair at response, not wall) |
| client_close_relative_to_wall_ms | `n/a` (no wall timeout) |
| upstream_persisted_after_client_close | `n/a` |
| post_timeout_completion_seen | `n/a` (no timeout; completion at 23:08:40.916Z) |
| transport_classification | `none — HTTP 200 completed` |
| transport_elapsed_ms | ~96996 (ingress→completion) |
| http_status | `200` |
| litellm_delta / glm_delta | `1` / `1` |
| tranche_02_glm_used | **1/10** |
| tranche_02_litellm_used | **1/10** |
| packet_census | PASS (structural census; all required present) |
| deterministic_completion | applied=true (`final_report_contract`) |
| schema_result | PASS |
| policy_result | **GATE** (cursor_dispatch_allowed=false) |
| cursor_dispatch / retry / fallback / qwen / codex | `0` each |
| gate_closed_final | `true` |
| WF61_final | `inactive` |
| secondary_6112_finding | not encountered this pass (out of scope) |
| NEXT | Canonical packet PASS path: advance per policy under the packet's own constraints (no auto-dispatch; human gate respected). Bounded follow-ups: (1) child-row hang accounting (`287888` stuck-`running` recurrence), (2) IPv6 observer coverage for upstream dispatch verification, (3) issue **#31** remains OPEN until acceptance is truly complete |

---

## Output line

`PASS — D0025 GLM TRANCHE02 EVENT03 VALID EXECUTION PACKET / POLICY=GATE / TRANCHE=1/10`

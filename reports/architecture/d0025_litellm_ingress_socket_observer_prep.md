# D-0025-W — LiteLLM ingress socket observer prep

**Block ID:** `D0025_W_LITELLM_INGRESS_SOCKET_OBSERVER_PREP`  
**Starting HEAD / expected origin/main:** `cb91aa9932928158878725bc4fd2cfa1cbc2a71c`  
**Status:** **PASS** — temporary, metadata-only, zero-provider observability prepared and validated  
**Context:** follows Event02 `HTTP_WALL_TIMEOUT` offline diagnosis (**E `EVIDENCE_INSUFFICIENT`**)

---

## Precheck (provider_calls = 0)

| Check | Result |
|---|---|
| origin/main exact (`cb91aa9…`) | PASS |
| workspace clean | PASS |
| CURRENT_FRONTIER classification | `EVIDENCE_INSUFFICIENT` · consistent |
| Runtime gate | **CLOSED** (`enabled=false` · `provider_calls_authorized_per_event=0`) |
| WF61 | **inactive** (workflow_entity `active=0`) · WF40 active |
| Tranche 02 | GLM **0/10** · LiteLLM **0/10** |
| Historical LiteLLM `/v1/responses` | **10** (before and after this pass) |
| `litellm-primary` | running · restarts **0** · `172.18.0.3` |
| `root-n8n-1` | running · restarts **0** · `172.18.0.2` |
| Shared Docker network | `root_default` (both) |

No n8n/LiteLLM restarts performed at any point.

---

## Observability backend

| Option | Result |
|---|---|
| **A. `tcpdump` on VPS host** | **CHOSEN** — `tcpdump 4.99.4` already present · root context · zero installs · zero network mutation |
| `ss` (iproute2 6.1.0) | available (baseline checks only) |
| `/proc/net/tcp` | available (fallback, unused) |

Text-mode only: `-tt -n -l -i any` — **no** `-A`/`-X`/`-x`/`-w`, no pcap, no payload/header/body/DNS prose/secret capture. BPF filter dynamically derived from live container IPs (`docker inspect`), scoped strictly to:

- `n8n ↔ litellm-primary` (ingress path, port 4000);
- `litellm-primary →` non-docker-subnet (outbound provider path, pre-NAT).

---

## Tool

`tools/observe-litellm-primary-network.mjs` (new; execution path untouched)

| Property | Value |
|---|---|
| Discovery | dynamic `docker inspect` IPs (never hardcoded) |
| Output | sanitized NDJSON to `--out-file`; meta/summary on stderr |
| Event fields | `ts` · `ts_epoch` · `direction` · `src_class` · `dst_class` · `src_port` · `dst_port` · `tcp_flags` |
| Directions | `N8N_TO_LITELLM` · `LITELLM_TO_EXTERNAL` · `CONNECTION_CLOSE` (F/R) · `OTHER` (return path) |
| Address hygiene | external IPs classified as `EXTERNAL` — **never persisted**; container IPs never persisted in events |
| Dedupe | SLL2 In/Out twins collapsed (1 ms bucket + 5-tuple + flags) |
| Bounded | `--duration-ms` wall + hard cap (+30 s) + SIGTERM→SIGKILL ladder |
| Deterministic exit | observed `OBSERVER_COMPLETED` / `duration_elapsed` |
| Provider calls | **none** — tool only observes |

---

## Zero-provider dry-run (validated on VPS)

| Step | Result |
|---|---|
| Observer window | 15000 ms → actual runtime **15 s** (`OBSERVER_COMPLETED`/`duration_elapsed`) |
| `GET /health/readiness` from true n8n exec context | **200** (41 bytes body — **not** recorded) |
| Bare TCP connect/close to :4000 | connected then FIN |
| `N8N_TO_LITELLM` seen | **true** — 8 events (SYN, ACK, PSH per flow; both test flows on :4000) |
| `CONNECTION_CLOSE` seen | **true** — 5 events (bidirectional `F.`) |
| Payload/body/header in NDJSON | **none** (marker scan: 0 matches; events are ports/flags/classes only) |
| LiteLLM `/v1/responses` after dry-run | **10** (Δ = 0) |

Sample event (sanitized): `{"ts":"2026-08-29T16:27:05.552Z","direction":"N8N_TO_LITELLM","src_class":"N8N","dst_class":"LITELLM","src_port":53580,"dst_port":4000,"tcp_flags":"S"}`

---

## Baseline outbound (read-only, `ss`)

| Field | Value |
|---|---|
| `external_established_baseline` | **false** |
| `external_established_count` | **0** |

No litellm-primary TCP ESTABLISHED sockets toward non-docker/non-loopback networks at prep time.

---

## Preserve (verified untouched)

WF40 · WF61 · `workflows/**` · `tools/post-litellm-primary-one-shot.mjs` · CASE B helper · schema · normalizer · LiteLLM config · provider config · container definitions · Docker network · firewall · credentials · OpenClaw · V4 Qwen — **all unchanged**. No restarts. Node 6112 finding remains out of scope (recorded only).

---

## Persisted fields

| Field | Value |
|---|---|
| `result_cursor` | `PASS_OBSERVER_READY` |
| `observer_backend` | `tcpdump-4.99.4-text-metadata-only` |
| `observer_tool` | `tools/observe-litellm-primary-network.mjs` |
| `dry_run_readiness_status` | `200` |
| `n8n_to_litellm_seen` | `true` |
| `payload_capture` | `none` |
| `external_established_baseline` | `false` |
| `external_established_count` | `0` |
| `provider_calls_delta` | `0` |
| `litellm_responses_delta` | `0` (total stays **10**) |
| `tranche_02_glm_used` | `0/10` |
| `tranche_02_litellm_used` | `0/10` |
| `gate_closed_final` | `true` |
| `WF61_final` | `inactive` |
| `NEXT` | one bounded D-0025-W tranche02 live event **with observer active before trigger** and a bounded post-wall observation grace period — bounded to GLM Δ≤1 · LiteLLM Δ≤1 · retry=0 · fallback=0 · Codex=0 · Qwen=0 · Cursor auto-dispatch=0. **Not executed in this pass.** |

---

## Output line

`PASS — LITELLM INGRESS SOCKET OBSERVER READY / PROVIDER_CALLS_DELTA=0 / TRANCHE02=0/10`

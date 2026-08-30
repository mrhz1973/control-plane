# V4 — Qwen shared-runtime occupancy diagnosis (zero generation)

**Block ID:** `V4_QWEN_SHARED_RUNTIME_OCCUPANCY_DIAGNOSIS_ZERO_GENERATION`
**Starting HEAD / expected origin/main:** `bef52ab6e881e098b43c268df97ec169e803acb3`
**Classification:** **`QWEN_BUSY_SHARED_RUNTIME`**
**Mutations:** none · **Generations:** 0 · **Process kills:** 0

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main | PASS |
| CURRENT_FRONTIER NEXT = this diagnosis | PASS |
| post-restore occupancy hold active | PASS |
| no start/stop/kill/generation | PASS |

## Classification

**`QWEN_BUSY_SHARED_RUNTIME`**

Deterministic concurrent workload on the Ollama/Qwen path (port **31452**), correlated to an active Blender MCP agentic session via `@qwen-code` + `blender-mcp` + `ollama_qwen_proxy.py`. Control-plane DFlash2 on `:8080` remains up but is **not** idle-claimable for a new generation while this shared 27B occupancy is active.

## Process inventory (sanitized)

| Role | Evidence |
|---|---|
| Control-plane DFlash2 | `llama-server.exe` PID **7576** · `llama.cpp-dflash2` · `--port 8080` |
| Ollama serve | `ollama.exe` PID **4656** |
| Ollama llama-server | `llama-server.exe` PID **56168** · `--port 31452` · Ollama blob path |
| Ollama proxy | `python.exe` PID **26840** · `ollama_qwen_proxy.py` |
| Blender | `blender.exe` PID **30048** · alive |
| Blender MCP | `blender-mcp.exe` PID **14592** ← child of qwen-code node tree |
| Agentic Qwen CLI | `node` `@qwen-code/qwen-code` PIDs **58644 → 52176 → 67908** · prompt class: Blender MCP scene work (content not persisted) |
| Cursor | running (IDE) · no established client socket to `:8080` or `:31452` attributed to Cursor |
| OpenCode CLI | **not** observed as a running `opencode` process |
| Edge WebUI | `msedge.exe` PID **61796** · ESTABLISHED to `:8080` (launcher WebUI) |

## Listeners / clients

| Endpoint | Listener | Active clients |
|---|---|---|
| `127.0.0.1:8080` | PID **7576** | **msedge** WebUI (persistent ESTABLISHED); diagnostic poller transient |
| `127.0.0.1:31452` | PID **56168** | **ollama.exe** PID **4656** ESTABLISHED throughout sample |

## Informational endpoints (no inference)

| Probe | Result |
|---|---|
| `http://127.0.0.1:8080/v1/models` | HTTP OK · `qwen38-original-dflash2-8k` **exposed** |
| `ollama ps` | `qwen3.8:27b` loaded · ~18 GB · CPU/GPU split reported · keep-alive ~2 minutes |
| `GET /api/ps` | model `qwen3.8:27b` present · `size_vram` ~8.7 GB · `expires_at` near-term |

## Occupancy sampling (~32 s, 4 snapshots)

| t | `:8080` EST | `:31452` EST | Ollama llama CPU (cum.) | Blender / MCP / qwen-code / proxy |
|---|---|---|---|---|
| t0 | present | present | ~16958 | all alive |
| t1 | present | present | ~17080 | all alive |
| t2 | present | present | ~17202 | all alive |
| t3 | present | present | ~17322 | all alive |

- DFlash2 `:8080` process CPU stayed low (~5–6) — WebUI connected, not the active inference consumer.
- Ollama `:31452` llama-server CPU **rose continuously** (~+365 over window) with large WS (~8.8 GB) — active inference signature.
- Competing tree remained continuous for the full window.

## Correlation

| Pair | Result |
|---|---|
| blender_qwen_correlation | **true** — Blender alive + blender-mcp under qwen-code tree |
| mcp_qwen_correlation | **true** — blender-mcp + ollama_qwen_proxy + Ollama `qwen3.8:27b` loaded |
| cursor_qwen_correlation | **false** for sockets to 8080/31452 (Cursor running but not the established inference client) |
| opencode_qwen_correlation | **false** — no OpenCode process |

## Fields persisted

```yaml
classification: QWEN_BUSY_SHARED_RUNTIME
control_plane_8080_listener: true
control_plane_8080_pid: 7576
control_plane_model_exposed: true
ollama_31452_listener: true
ollama_31452_pid: 56168
ollama_model_loaded: qwen3.8:27b
blender_running: true
mcp_processes_seen: true
cursor_running: true
opencode_running: false
active_8080_clients: msedge_webui
active_31452_clients: ollama_serve
blender_qwen_correlation: true
mcp_qwen_correlation: true
cursor_qwen_correlation: false
opencode_qwen_correlation: false
active_inference_evidence: true
benchmark_evidence: false_not_required
occupancy_sampling_window: ~32s_4_snapshots
qwen_generation_calls: 0
opencode_execution_count: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false
NEXT: WAIT_QWEN_SHARED_RUNTIME_IDLE
```

## Actions not taken

No process kill/stop/restart · no Edge close · no OpenCode · no chat/completions · no session-manager ensure · no runtime/network mutation.

## NEXT

**`WAIT_QWEN_SHARED_RUNTIME_IDLE`** — do not alter the competing Blender/MCP/Ollama workload; do not assign a new Qwen generation; live-proof gate remains closed until a later idle re-diagnosis.

---

## Output line

`PASS — QWEN SHARED RUNTIME OCCUPANCY / QWEN_BUSY_SHARED_RUNTIME / GENERATIONS=0 / PROCESS_KILLS=0`

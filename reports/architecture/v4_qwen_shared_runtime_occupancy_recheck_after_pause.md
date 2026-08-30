# V4 — Qwen shared-runtime occupancy recheck after pause (zero generation)

**Block ID:** `V4_QWEN_SHARED_RUNTIME_OCCUPANCY_RECHECK_AFTER_PAUSE`
**Starting HEAD / expected origin/main:** `80ac8eb778675d80a7ddd3fd185d6bd5bef5cfe0`
**Operator pause signal:** `docs/runtime/OPERATOR_SIGNAL_QWEN_COMPETING_PROJECT_PAUSED_20260830.md` (supporting context only)
**Classification:** **`QWEN_READY_IDLE`**
**Mutations:** none · **Generations:** 0 · **Process kills:** 0 · **Process starts:** 0

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main == expected | PASS |
| workspace clean | PASS |
| CURRENT_FRONTIER NEXT = this recheck | PASS |
| live-proof gate CLOSED · historical AUTH non-reusable | PASS |
| no start/stop/kill/generation/OpenCode | PASS |

## Classification

**`QWEN_READY_IDLE`**

Operator pause is not proof by itself. Bounded read-only sampling shows **no active competing Qwen inference**:

- no `llama-server` processes (control-plane DFlash2 and prior Ollama `:31452` both absent);
- no LISTEN/ESTABLISHED on `127.0.0.1:8080` or `:31452`;
- `ollama ps` / `GET /api/ps` → **0 models loaded**;
- prior agentic consumers `@qwen-code` and `blender-mcp` **not present**;
- residual Blender + orphaned `ollama_qwen_proxy` remain alive but CPU-flat over the sample → paused/idle, not inference.

Do **not** treat process presence alone as BUSY. Live-proof gate remains **CLOSED**; this block does **not** execute OpenCode or restore/start Qwen.

## Process inventory (sanitized)

| Role | Evidence |
|---|---|
| Control-plane DFlash2 `llama-server` | **absent** · `:8080` unreachable |
| Ollama serve | `ollama.exe` PID **4656** · alive · CPU flat · **no model loaded** |
| Ollama app | `ollama app.exe` PID **36072** · alive · idle |
| Ollama llama-server `:31452` | **absent** |
| Ollama proxy | `python.exe` PID **26840** · `ollama_qwen_proxy.py` · PPID **gone** (orphaned) · CPU flat |
| Blender | `blender.exe` PID **30048** · alive · WS ~34 MB · CPU nearly flat · parent gone |
| Blender MCP | **not observed** |
| `@qwen-code` | **not observed** |
| Cursor | running (IDE) · no socket attribution to 8080/31452 |
| OpenCode CLI | **not** observed |
| Edge | processes present; earlier `SYN_SENT` to `:8080` (server down) — **not closed** by this block |

## Listeners / clients

| Endpoint | Listener | Active clients |
|---|---|---|
| `127.0.0.1:8080` | **none** | **none** (no ESTABLISHED) |
| prior Ollama `:31452` | **none** | **none** |

## Informational endpoints (no inference)

| Probe | Result |
|---|---|
| `GET http://127.0.0.1:8080/v1/models` | **UNREACHABLE** · model not exposed |
| `ollama ps` | empty table · no loaded models |
| `GET http://127.0.0.1:11434/api/ps` | HTTP 200 · `models_loaded=0` |

## Occupancy sampling (~32 s, 4 snapshots)

| t | llama-server | listen 8080/31452 | est 8080/31452 | blender CPU | proxy CPU | ollama CPU | qwen-code/mcp |
|---|---|---|---|---|---|---|---|
| t0 09:56:16 | 0 | 0/0 | 0/0 | 1261.50 | 15.50 | 133.11 | 0 |
| t1 09:56:27 | 0 | 0/0 | 0/0 | 1261.58 | 15.50 | 133.11 | 0 |
| t2 09:56:37 | 0 | 0/0 | 0/0 | 1261.67 | 15.50 | 133.11 | 0 |
| t3 09:56:48 | 0 | 0/0 | 0/0 | 1261.89 | 15.53 | 133.11 | 0 |

- Blender ΔCPU ≈ **+0.4** over ~32s · not an inference signature.
- Proxy / Ollama serve essentially **flat**.
- No loaded Ollama model · no rising llama-server CPU (none present).
- End-of-window reconfirm: `ollama ps` empty · `:8080` still UNREACHABLE.

## Correlation

| Pair | Result |
|---|---|
| blender_qwen_correlation | **false** for active inference — Blender alive but no MCP/qwen-code/llama path |
| mcp_qwen_correlation | **false** for active inference — proxy orphaned; blender-mcp absent; no model |
| cursor_qwen_correlation | **false** |
| opencode_qwen_correlation | **false** |

## Fields persisted

```yaml
classification: QWEN_READY_IDLE
control_plane_8080_listener: false
control_plane_model_exposed: false
ollama_runtime_present: true
ollama_model_loaded: false
blender_running: true
mcp_processes_seen: true_orphaned_ollama_qwen_proxy_only
qwen_code_running: false
active_inference_evidence: false
active_8080_clients: none
active_ollama_clients: none
occupancy_sampling_window: ~32s_4_snapshots
qwen_generation_calls: 0
opencode_execution_count: 0
process_start_calls: 0
process_kill_calls: 0
process_stop_calls: 0
runtime_restart_calls: 0
secret_exposure: false
NEXT: V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH
```

## Actions not taken

No process kill/stop/restart · no Edge close · no Blender/MCP/Ollama/Cursor/OpenCode stop · no session-manager ensure/start · no OpenCode execution · no `/v1/chat/completions` · no `/v1/responses` · no `/api/generate` · no runtime/network/config mutation.

## NEXT

**`V4_OPENCODE_BOUNDED_LIVE_DISPATCH_PROOF_REAUTH`** — gate remains **CLOSED**; do **not** run live proof in this block. Fresh operator authorization still required. Note: control-plane `:8080` is currently down; any later authorized proof path must re-establish readiness without disrupting residual idle Blender/proxy/Ollama processes unless separately authorized.

---

## Output line

`PASS — QWEN OCCUPANCY RECHECK / QWEN_READY_IDLE / GENERATIONS=0 / PROCESS_KILLS=0`

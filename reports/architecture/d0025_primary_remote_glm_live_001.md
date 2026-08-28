# D-0025-W — primary remote GLM live planning cycle (001)

**Repository:** `mrhz1973/control-plane`  
**Task:** `D-0025-W_PRIMARY_REMOTE_GLM_LIVE_001` (+ `_RETRY`, `_RETRY_2`)  
**Date:** 2026-08-28  
**Release evidence:** issue #31 comment `5456859595` · `5457265822` (retry) · `5457565004` (retry 2)  
**Standing authorization:** `docs/foundation/STANDING_OPERATOR_AUTHORIZATION.md`  
**Status:** **STOP (retry 2)** — backlog lane reached · WF61 executed once · WF61 template defect aborts before LiteLLM · gate CLOSED

---

## Attempt 1 — STOP

Commit `8765362` observed by WF40; execution `284605` died at GIS `Read/Write Files from Disk` (`No file(s) found`) before the backlog lane. Fixed by `D-0025-W_WF40_GIS_READWRITE_NONBLOCKING`.

## Attempt 2 (RETRY) — STOP

Commit `5ccb8c9` observed; executions `284677`/`284679` died at GIS `Telegram - Send handoff file` (missing binary `'data'` after non-blocking Read/Write passthrough). Fixed by `D-0025-W_WF40_GIS_TELEGRAM_FILE_NONBLOCKING`.

## Attempt 3 (RETRY_2) — STOP (major progress: full lane reached)

| Metric | Value |
|---|---|
| `final_gate_closed` | **true** |
| WF61 executions | **1** (execution `284723`, status `error`, 0.5s) |
| LiteLLM requests | **0** (log: only preflight `GET /v1/models`; **no `POST /v1/responses`**) |
| GLM provider attempts | **0** |
| retry / fallback / qwen / codex / cursor_dispatch | **0** |
| `credential_mutations` | **0** |
| `network_mutations` | **0** |
| `secret_exposure` | **false** |
| GLM expanded budget | **0/10** (unchanged — no inference attempted) |

### Precheck (PASS)

| Check | Result |
|---|---|
| `origin/main` | `8f82a4118a41bc67341628f31d22e439b5a6b71a` |
| WF40 baseline | active · versionId `07fbfca6-e2f9-4fff-bfd6-c59d31f124b7` · 44 nodes · all four `continueOnFail=true` |
| WF61 | inactive · single Execute trigger · exec 0 |
| WF60 | inactive |
| Runtime gate pre | CLOSED |
| LiteLLM | `/v1/models` HTTP 200 · no inference |
| Backlog | YAML intact · `D-0025-W-GLM-LIVE-001` |

### Execution

1. Fresh trigger commit `7d195047d31e665c3885d58cb00dc886ea7cf766` (appends exactly `Retry trigger 2: 2026-08-28 — full GIS tail contained; execute same task D-0025-W-GLM-LIVE-001.` outside YAML).
2. Temp GLM-only gate armed (runtime-only, never committed). WF61 temporarily activated (no node changes).
3. Offline adapter: **REMOTE_DISPATCH_READY** · `preferred=glm` · `fallback=[]` · `gate_only` · `task_id=D-0025-W-GLM-LIVE-001`.
4. Pushed trigger; natural poll observed.

### Lane reached (new)

WF40 execution `284722` ran the **entire canonical lane** for the first time: plan watcher gate → commit details → plan detect → canonical backlog detect → backlog fetch → adapter (`REMOTE_DISPATCH_READY` present in runData) → `IF - remote planner dispatch allowed?` → **`Execute Workflow - WF61 primary remote planner`** dispatched WF61.

### STOP finding (precise)

WF61 execution `284723` failed at node **`Parse prepare result fail-closed`** (4th node) with:

```
Can't use .first() here [line 1, for item 0]
```

Root cause: the GPT-Web-authored WF61 template sets Code nodes to `mode: "runOnceForEachItem"` but their `jsCode` calls `$input.first()`. In per-item mode `$input` is a single item, so `$input.first()` is invalid — the correct accessor is `$json` / `$input.item.json` (or the node must use `runOnceForAllItems`). The same defect exists in `Capture HTTP body + status`, `Return canonical cycle result`, `Return prepare failure without HTTP`, `Return HTTP failure no retry`.

The failure occurred **before** `HTTP Request - LiteLLM primary one-shot`: no LiteLLM request was made (container logs confirm), so the single authorized provider attempt was **not consumed** and GLM budget remains 0/10.

Runtime restored immediately: gate CLOSED · WF61 inactive.

---

## NEXT_GATE

GPT-Web bounded WF61 template correction: fix the per-item Code node input accessor (`$input.first()` → `$json`-style, or switch those nodes to `runOnceForAllItems`) without changing WF61 topology/HTTP contract; re-import inactive; then one more bounded GLM live window with a fresh trigger. The parent lane (WF40 → adapter → dispatch) is now proven end-to-end.

---

## Output line

`STOP — WF61 template defect: runOnceForEachItem Code node uses $input.first() (Can't use .first() here) aborts at Parse prepare result fail-closed before LiteLLM call; GATE_CLOSED=true; WF61_EXECUTIONS=1; PROVIDER_CALLS=0`

# V4 Qwen canonical manager/worker classifier fix — WF40 live proof STOP

**Task ref:** `V4_QWEN_CANONICAL_MANAGER_WORKER_CLASSIFIER_FIX_AND_WF40_LIVE_RESUME`  
**Run nonce:** `QWEN_MANAGER_WORKER_FIX_20260901_01`  
**Result:** STOP at Phase E — n8n scheduler stall  
**Dispatch base:** `8689917fc53d81897be4cdb5650e57a3a449505d`

## Completed

| Item | Result |
|---|---|
| Prior STOP commit `3bf5879` preserved and pushed (`8689917..c73fe1d`) | **PASS** |
| Classifier manager→worker topology fix | **PASS** |
| Target tests `v4-local-runtime-readonly-contribution` | **57/57 PASS** |
| Regressions (private-endpoint, windows-endpoint, opencode, guard) | **PASS** |
| WF40 seam target (preserved) | **27/27 PASS** |
| `git diff --check` | **PASS** |
| BugBot (classifier diff) | **PASS_NO_FINDINGS** (low: tmp script, removed) |
| Live occupancy (2 samples ≥2s) | **QWEN_READY_IDLE** |
| RESOURCE_STATUS | `qwen_local.available=true` · `opencode.available=true` |
| Live WF40 | active · **83 nodes** · transient poll fix · adapter reads Build node |
| D-0025 gate armed then **restored CLOSED** on VPS | **PASS** |

## STOP finding

After arming the gate and pushing canonical backlog + route-source (`1764338`, retry `8542aa2`), **no natural WF40 pipeline execution occurred**.

n8n `execution_entity` latest row is `293784` at `2026-09-01T00:15:02Z`. At VPS `2026-09-01T00:23:19Z` there were **zero** newer executions of any workflow — the **1-minute WF40 scheduler stalled** (~8+ minutes with no firings). All WF40 runs today completed in **<2s** (duplicate-skip path); **no WF61 execution** since 2026-08-29.

Counters remain zero: WF40 pipeline=0 · WF61=0 · remote planner=0 · register=0 · Telegram=0 · execution=0 · OpenCode=0 · Qwen generations=0.

## Preserved safety

- D-0025 gate **CLOSED** (`enabled=false`, `provider_calls_authorized_per_event=0`)
- WF61 **inactive**
- No ACTIVE runtime authorization
- Canonical llama.cpp manager + child worker **not restarted**

## Next

Restore n8n scheduler firing (bounded `docker restart root-n8n-1` or equivalent operator action), verify WF40 1-minute executions resume, then re-arm gate and retry natural backlog event for `D-V4-WF40-LIVE-001`.

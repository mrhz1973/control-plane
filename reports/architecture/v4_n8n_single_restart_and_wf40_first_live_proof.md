# V4 n8n single restart + WF40 live proof — STOP

**Task ref:** `V4_N8N_SINGLE_RESTART_AND_WF40_FIRST_LIVE_PROOF_FINAL_RESUME`  
**Run nonce:** `N8N_SINGLE_RESTART_WF40_LIVE_20260901_01`  
**Result:** STOP — WF40 scheduler not healthy after single restart  
**Dispatch base:** `910afc08a57d35404d16e1deef3de17b727ec671`

## Completed

| Item | Result |
|---|---|
| Repo precheck `HEAD == origin/main == 910afc0` | **PASS** |
| Pre-state: `root-n8n-1` running | **PASS** |
| Exec 293807 | **success** (terminal, no longer blocking) |
| WF40 active, 83 nodes | **verified** |
| WF61 inactive, D-0025 CLOSED | **verified** |
| Exactly one `docker restart root-n8n-1` | **done** at `00:37:33Z` |
| n8n readiness after restart | **PASS** (~1s) |
| Windows pre-live ports 18790/18791/18792/8080 | **1 each** |
| QWEN_READY_IDLE occupancy | **PASS** |
| RESOURCE_STATUS qwen/opencode available | **PASS** |

## STOP finding

After the single restart, no new WF40 scheduled executions appeared within 180 seconds (baseline `293828` at `00:37:02Z`). Last WF40 tick remained `293828`; through `00:41:09Z` (~4 min post-restart) scheduler did not advance. n8n logs show WF40 activated on startup but dependency index reported `0 published workflows` post-restart vs `1` pre-restart.

Live proof not started: gate not armed, no retry trigger 4, no pipeline/register/Telegram/execution.

## Counters

WF40 full pipeline=0 · WF61=0 · remote planner=0 · register=0 · Telegram=0 · OpenCode=0 · Qwen=0 · restarts=1

## Next

Investigate n8n workflow publish/scheduler state after restart (draft vs published WF40 cron), clear scheduler stall without a second restart if policy allows, then resume `D-V4-WF40-LIVE-001`.

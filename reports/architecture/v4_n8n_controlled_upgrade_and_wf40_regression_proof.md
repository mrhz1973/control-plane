# V4 n8n controlled upgrade — STOP (admission defect persists)

**Task ref:** `V4_N8N_CONTROLLED_UPGRADE_AND_WF40_REGRESSION_PROOF`  
**Run nonce:** `N8N_UPGRADE_2333_WF40_20260901_01`  
**Dispatch base:** `d742f10f8f3b3e0e8df18d67b7d64d220095d88b`  
**Result:** STOP — upgrade did not fix execution admission defect

## Upgrade performed

| Item | Value |
|---|---|
| Pre version | 2.19.5 (`sha256:b1b0c592…`) |
| Post version | **2.33.3** (`docker.n8n.io/n8nio/n8n:2.33.3`) |
| Compose | `/root/docker-compose.yaml` (project `root`) |
| DB | SQLite volume `root_n8n_data` (no PostgreSQL) |
| Backup | `/root/n8n-upgrade-backups/20260901T011045Z_pre_2.33.3` |
| Migration | PASS (healthz ok, no crash loop) |

## Structural regression — PASS

| Check | Result |
|---|---|
| WF40 id | `9ZMj2ACTKyDVhCue` unchanged |
| WF40 nodes | **83** |
| WF40 active | true |
| activeVersionId | `a609ad90-7eb4-4495-9ec5-c4413165cea1` |
| Schedule Trigger | present, enabled |
| WF61 | inactive |
| D-0025 | CLOSED |
| Windows pre-live | ports + QWEN_READY_IDLE ×2 PASS |

## Execution-engine regression — FAIL

Post-upgrade WF40 ticks:

| id | status | startedAt | notes |
|---|---|---|---|
| 293896 | success | yes | post-upgrade |
| 293898 | success | yes | post-upgrade |
| **293900** | **new** | **null** | stuck **81+ s** at 01:14 UTC |

`stuck_over_30s=1` — same phenotype as pre-upgrade (293872 on 2.19.5).

## Rollback

**NOT_REQUIRED** per block rules (2.33.3 healthy; do not silently downgrade). Rollback package preserved at backup path with digest-pinned 2.19.5 image ref.

## Live proof

Not started.

## Finding

`N8N_UPGRADE_DID_NOT_FIX_EXECUTION_ADMISSION`

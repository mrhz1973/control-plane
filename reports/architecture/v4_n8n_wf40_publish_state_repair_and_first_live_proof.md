# V4 WF40 publish state repair + live proof — STOP

**Task ref:** `V4_N8N_WF40_PUBLISH_STATE_REPAIR_AND_FIRST_LIVE_PROOF_RESUME`  
**Run nonce:** `N8N_WF40_PUBLISH_REPAIR_20260901_01`  
**Dispatch base:** `5b4ea2e143ec369d5994ee04c9710c8006d6ece0`

## Diagnosis (Section 2–3)

**Classification: A — `ACTIVE_FLAG_TRUE_BUT_NO_PUBLISHED_VERSION`**

| Evidence | WF40 | WF42 (working reference) |
|---|---|---|
| `active` | 1 | 1 |
| `activeVersionId` | `a609ad90-…` (83-node) | `93d606ae-…` |
| `workflow_publish_history` latest | `deactivated` only for recent versions | `activated` with `versionId` |
| `workflow_published_version` | empty | empty |
| Schedule trigger | present, enabled | present |

WF40 had `active=true` and `activeVersionId` matching the current 83-node version, but no `activated`/publish event for that version after post-seam imports — only `deactivated` rows.

## Repair (Section 4–5)

**One native operation:** `n8n publish:workflow --id=9ZMj2ACTKyDVhCue` (n8n 2.19.5 CLI)

- WF40 id unchanged · 83 nodes · `active=true`
- Publish exit 0

## Scheduler health (Section 6)

Post-repair ticks observed (baseline 293828): executions through `293848` at `00:47:02Z` — **PASS** (≥2 ticks after repair at `00:44:58Z`).

## Pre-live invariants (Section 7)

**PASS** — ports 18790/18791/18792/8080=1 · `QWEN_READY_IDLE` ×2 · RESOURCE_STATUS available.

## Live proof (Sections 9–11) — NOT COMPLETED

- Gate armed · retry trigger 5 pushed (`a5fa29d`)
- During pipeline wait execution **293850** stuck `new` (null timestamps); no WF40 runs after `293848`
- No WF61 · no register · no Telegram · no execution
- Gate **restored CLOSED**

## STOP finding

`N8N_SCHEDULER_STALLED_STUCK_EXECUTION_293850_DURING_LIVE_PROOF_WAIT`

## Counters

publish_repair=1 · wf40_full_pipeline=0 · wf61=0 · planner=0 · register=0 · telegram=0 · opencode=0 · qwen=0

# D-0025-W — Child row 287888 accounting diagnosis

**Block ID:** `D0025_W_CHILD_ROW_287888_ACCOUNTING_DIAGNOSIS`  
**Starting HEAD / expected origin/main:** `e9621a2c6c938d38aebe663eae7c4540a71a02f2`  
**Status:** **PASS** — read-only diagnosis complete  
**Classification:** `EXECUTION_ENGINE_CHILD_FINALIZATION_BUG`  
**Provider calls Δ:** **0** · LiteLLM Δ **0** · GLM Δ **0** · tranche 02 **1/10 / 1/10**

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main == expected | PASS |
| workspace clean | PASS |
| CURRENT_FRONTIER NEXT = this block | PASS |
| runtime gate CLOSED · WF61 inactive | PASS |
| tranche02 GLM/LiteLLM 1/10 · historical LiteLLM **11** | PASS |
| no new provider call | PASS |

---

## Executive summary

Child WF61 execution **287888** logically **completed successfully** (all nodes finished; `n8n.workflow.success`; parent Execute Workflow received `PASS` cycle result + Execution Packet), but **child execution bookkeeping desynchronized**: contemporaneous `execution_entity` showed `running` / `stoppedAt=null`, `execution_data` was purged, and the row is now **absent** from `execution_entity` entirely (`wf61` max surviving id **287009**). No live process/task leak remains. Operational impact is **accounting/history only**.

---

## 1. Execution entity (now)

| Field | 287888 (child) | 287887 (parent) |
|---|---|---|
| row exists | **false** (purged) | **true** |
| status (surviving) | n/a — was `running` contemporaneously | `success` |
| startedAt | `2026-08-29 23:07:03.297` (from Event03 + event log) | `2026-08-29 23:07:02.006` |
| stoppedAt | n/a — was `null` contemporaneously | `2026-08-29 23:08:41.193` |
| finished | n/a | `1` |
| workflowId | `d0025-6100-4001-8001-000000000061` | `9ZMj2ACTKyDVhCue` |
| mode | `integrated` (sub-workflow) | `trigger` |

Comparison **286310** (Attempt 16): entity also **purged**; parent **286309** `success`.

---

## 2. Execution data

| Execution | data exists | notes |
|---|---|---|
| 287888 | **false** | purged |
| 287887 | **true** (53 577 B) | markers: `n8n-litellm-primary-cycle-result-v1`, `execution-packet-v1`, `6110` path |
| 286310 | **false** | purged (prior report) |
| 286309 | **true** (51 192 B) | cycle result present; child output `ok=false` |

Contemporaneous Event03 evidence (live pass): child `execution_data` existed briefly (~3.3 KiB stub) then purged while entity still `running`.

---

## 3. Parent/child relationship (deterministic)

From parent **287887** `execution_data` (resolved flatted):

| Field | Value |
|---|---|
| Execute Workflow node | `Execute Workflow - WF61 primary remote planner` |
| node `executionStatus` | **`success`** |
| `metadata.subExecution.executionId` | **`287888`** |
| `metadata.subExecution.workflowId` | `d0025-6100-4001-8001-000000000061` |
| returned output | `schema=n8n-litellm-primary-cycle-result-v1` · `ok=true` · `classification=PASS` · `http_status=200` |
| parent `lastNodeExecuted` | Execute Workflow - WF61 primary remote planner |

**Conclusion:** n8n's Execute Workflow sub-workflow path **delivered the canonical cycle result to the parent** and parent continued to SUCCESS. Child execution bookkeeping is **independent** from the returned sub-workflow output object — parent success does not require `execution_entity` for the child to show terminal status.

Packet **EP-D-0025-W-GLM-LIVE-001** persisted in repo from parent path (`docs/packets/EP-D-0025-W-GLM-LIVE-001.json`).

---

## 4. Active process / task check (now)

| Check | Result |
|---|---|
| helper / one-shot processes in n8n container | **none** |
| WF61 `running` rows in DB | **none** |
| task-runner leak (current) | **none** |
| open socket leak evidence | **none** (`ss` unavailable in container; no helper PIDs) |
| n8n container restarts during Event03 | **0** (started `2026-08-29T15:46:55Z`, before event) |

Event log for **287888** shows `n8n.runner.task.requested` / `response.received` pairs completing for Code nodes — runners finished; no dangling runner task evidenced.

---

## 5. n8n log correlation (Event03 window)

| Source | Finding |
|---|---|
| docker stdout/stderr `23:07–23:15` | **0 lines** (n8n not verbose on docker log for this window) |
| internal `n8nEventLog.log` (sanitized) | **31 events** for `287888` — full node progression through **Return canonical cycle result** · final event **`n8n.workflow.success`** |
| SIGTERM / restart during event | **not seen** in Event03 window |
| db write error | **not seen** in available logs |
| purge/retention log lines | **not seen** explicitly |

**Node sequence (287888, from event log):** trigger → validate → prepare → parse → IF → **6106 executeCommand (finished)** → capture → IF 2xx → finalize → **6110 Return (finished)** → **`n8n.workflow.success`**.

This contradicts a workflow hang at 6106 for Event03; the prior contemporaneous stub was **stale/partial execution_data**, not the final engine state.

---

## 6. Database / retention semantics

| Observation | Implication |
|---|---|
| `settings` table has **5 keys**; no explicit execution retention/prune keys stored | pruning likely **default n8n behavior** |
| `execution_entity` for 287888 **absent** while parent row retained | selective purge of child integrated executions possible |
| `wf61` MAX(id) surviving = **287009** << **287888** | child row **fully removed** from accounting history |
| ID gap `287887 → 287889` (287888 missing) | consistent with purge, not merely stale `running` |
| Contemporaneous shape: `running` + purged `execution_data` | **can occur** when data lifecycle prunes before entity finalization write |

Retention/purge explains **final absence**, not why `execution_entity` stayed `running` after `n8n.workflow.success`.

---

## 7. Recurrence analysis

| Occurrence | Parent Execute Workflow | Child logical completion | Child entity end state | Same workflow hang root? |
|---|---|---|---|---|
| **286310** (Attempt 16) | success · subExecution 286310 · parent output `ok=false` | **No** — contemporaneous hang at 6106; 6107+ not reached in recoverable data | purged | **Different** workflow path |
| **287888** (Event03) | success · subExecution 287888 · parent output `ok=true` PASS | **Yes** — event log: all nodes + `workflow.success` | purged after `running` stub | **Not** 6106 hang |

**Shared accounting signature:** parent Execute Workflow `success` + subExecution id + child row eventually **purged** / never terminal in surviving WF61 history.

**Same root cause proven?** **No** for the old HTTP-node-never-returned hang. **Yes** for **child execution_entity finalization desync** relative to engine success events (Event03 proven via `n8n.workflow.success` + parent PASS output).

---

## 8. Safety / operational impact

| Impact class | Assessment |
|---|---|
| blocks new WF61 execution | **No** — gate CLOSED + WF61 inactive are the active blocks, not stale 287888 |
| locks workflow | **No** |
| consumes task-runner capacity | **No** (now) |
| leaves subprocesses | **No** |
| resource leak | **No** |
| pollutes execution accounting/history | **Was yes** while row showed `running`; **now mitigated** by full purge — historical confusion only |

---

## Classification decision

### Chosen: **`EXECUTION_ENGINE_CHILD_FINALIZATION_BUG`**

| Class | Verdict |
|---|---|
| STALE_EXECUTION_ROW_ONLY | Rejected — row was not merely stale; engine logged `workflow.success` while entity showed `running`, then purge removed row |
| **EXECUTION_ENGINE_CHILD_FINALIZATION_BUG** | **Accepted** — deterministic: child workflow completed (`n8n.workflow.success`, all nodes finished, parent received PASS result) but `execution_entity`/data accounting did not retain consistent terminal state |
| LIVE_CHILD_PROCESS_OR_TASK_LEAK | Rejected — no processes/runners/sockets now |
| PURGE_OR_RETENTION_ACCOUNTING_ARTIFACT | Secondary effect only — explains final absence, not success/running desync |
| OTHER / EVIDENCE_INSUFFICIENT | Rejected — event log + parent runData sufficient |

---

## Persisted fields

| Field | Value |
|---|---|
| result_cursor | `PASS_EXECUTION_ENGINE_CHILD_FINALIZATION_BUG` |
| classification | `EXECUTION_ENGINE_CHILD_FINALIZATION_BUG` |
| child_287888_row_exists | `false` (purged) |
| child_287888_status | was `running`; now absent |
| child_287888_stopped_at | was `null`; now absent |
| child_287888_finished | never observed `1` in surviving DB; event log `workflow.success` |
| child_287888_data_exists | `false` |
| child_287888_data_purged | `true` |
| parent_287887_status | `success` |
| parent_result_delivered | `true` |
| packet_delivered | `true` |
| live_process_leak_seen | `false` |
| task_runner_leak_seen | `false` |
| helper_process_leak_seen | `false` |
| socket_leak_seen | `false` |
| n8n_restart_during_event03 | `false` |
| db_write_error_seen | `false` |
| retention_or_purge_evidence | `true` |
| operational_impact | accounting/history only; no runtime lock |
| old_286310_signature | parent success + subExecution + child purged; 6106 hang; parent ok=false |
| event03_287888_signature | parent success + PASS + workflow.success + all nodes finished + entity running→purged |
| same_root_cause_proven | `false` (workflow hang); accounting desync pattern shared |
| provider_calls_delta / litellm / glm | `0` / `0` / `0` |
| tranche_02_glm_used / litellm_used | `1/10` / `1/10` |
| gate_closed_final | `true` |
| WF61_final | `inactive` |
| NEXT | smallest bounded n8n child-finalization remediation/design; prefer additive/forward fix over historical-row mutation; do not auto-mutate DB |

Node **6112** — out of scope (not encountered in this diagnosis pass).

---

## Output line

`PASS — CHILD ROW 287888 ACCOUNTING DIAGNOSIS / EXECUTION_ENGINE_CHILD_FINALIZATION_BUG / PROVIDER_CALLS_DELTA=0`

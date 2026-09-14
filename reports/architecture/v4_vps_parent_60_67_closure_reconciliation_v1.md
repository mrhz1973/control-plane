# V4 VPS parent 60/67 closure reconciliation V1

**TASK_REF:** `V4_VPS_PARENT_60_67_CLOSURE_RECONCILIATION_V1`
**BASE_HEAD:** `1c46987553deb9d3d51315b4851023745fd5913d` (== origin/main == HEAD at start, verified PASS)
**Date (Europe/Rome):** 2026-09-14
**MODE:** DOCUMENTATION / ISSUE CLOSURE RECONCILIATION ONLY — existing evidence only; no test campaign
**MODEL_INFERENCE=0 · PRODUCTION_CHANGED=NO · RUNTIME_CHANGED=NO**

---

## 1. Issue #67 acceptance matrix (8-point completion path)

| # | Requirement | Evidence (persisted) | Verdict |
|---|---|---|---|
| 1 | NEW inventory/provisioning baseline PASS | issue body baseline (IONOS VPS 6-8-240, `31.70.139.73`, Ubuntu 24.04, 6 vCore, 7.7 GiB RAM, key-based SSH PASS, fingerprint observed) | SATISFIED |
| 2 | Core n8n/PostgreSQL/LiteLLM isolated replica healthy | `v4_vps_production_cutover_old_to_new_v1.md` chain; `NEW_PRODUCTION_PUBLICATION_MAP_MATCH=PASS`; PostgreSQL 16.15 healthy; LiteLLM private/unpublished | SATISFIED |
| 3 | Hermes 0.21.0 + Chromium/Xvfb/CDP + x11vnc/noVNC deployment | #67 qualification comments; `hermes-xvfb`/`hermes-chromium`/`hermes-x11vnc`/`hermes-novnc` active, loopback-only listeners (9222/5900/6080) | SATISFIED |
| 4 | Manual ChatGPT authentication on NEW | fresh manual auth on NEW, no OLD cookies/profile transfer (#67 comment) | SATISFIED |
| 5 | Web sentinel + long-chat recall + auth persistence + resource/endurance on 8 GB | `HERMES_WEB_ROUNDTRIP_NEW8GB=PASS`; `LONG_CHAT_RECALL_NEW8GB=PASS` (exact marker `NEW8-LONGCHAT-7F3C91A2`, same chat only, 8 fillers); AUTH_PERSISTENCE=PASS; `RESOURCE_BASELINE=GREEN`; `HERMES_SHORT_SOAK_30M=PASS` + `HERMES_POST_SOAK_NEW8GB=PASS`; corroborated by `POST_CUTOVER_SOAK=PASS` (29+2+6 exact, independent Codex closure) + `NEW_CORE_RESTART_PERSISTENCE=PASS` | SATISFIED |
| 6 | Parallel validation | `VPS_PARALLEL_VALIDATION=PASS`; F03 census reconciled 32/2 (`v4_vps_codex_a01_f03_review_closure_v1.md`) | SATISFIED |
| 7 | Separate human cutover gate | `HUMAN_CUTOVER_GATE=AUTHORIZED_AND_EXECUTED`; `CUTOVER=PASS`; `PRODUCTION_TRAFFIC_ON_NEW=PASS` | SATISFIED |
| 8 | OLD retained for rollback | satisfied through the full rollback-observation period (retention opened 2026-09-07, soak PASS, zero rollback triggers, NEW stable), then closed by recorded operator authorization (`v4_vps_68_authorized_old_decommission_execution_v1.md`: `ROLLBACK_RETENTION=CLOSED_BY_OPERATOR_AUTHORIZATION`). Historical interpretation: retention through rollback observation, not forever; current authorized OLD shutdown does not retroactively invalidate it | SATISFIED |

```text
ISSUE_67_ACCEPTANCE_COMPLETE=YES
ISSUE_67_REQUIRED_BLOCKERS=0
ISSUE_67_CLOSURE_READY=YES
```

## 2. Issue #60 acceptance matrix (7 criteria)

| # | Criterion | Evidence (persisted) | Verdict |
|---|---|---|---|
| 1 | NEW reachable via pinned SSH alias/key | canonical alias `ionos-n8n-new`, key-based SSH PASS (bootstrap comments in #60, carried into #67) | SATISFIED |
| 2 | Complete OLD inventory and backups | write-freeze dump + SHA256 + final DB sync + publication map + sequence audit (#68 chain; FINAL_BACKUP law satisfied by canonical evidence); F03 census 32/2; consumer mini-audit PASS | SATISFIED |
| 3 | Core stack replicated healthy on NEW | n8n 2.33.3 + PostgreSQL 16.15 + LiteLLM live; `NEW_PRODUCTION_PUBLICATION_MAP_MATCH=PASS` | SATISFIED |
| 4 | End-to-end Control Plane validation on NEW | `VPS_PARALLEL_VALIDATION=PASS`; `POST_CUTOVER_SOAK=PASS`; `NEW_CORE_RESTART_PERSISTENCE=PASS` | SATISFIED |
| 5 | Human-authorized cutover with rollback intact | `HUMAN_CUTOVER_GATE=AUTHORIZED_AND_EXECUTED`; `CUTOVER=PASS`; `PRODUCTION_TRAFFIC_ON_NEW=PASS`; rollback retained through observation, then closed by operator authorization | SATISFIED |
| 6 | Hermes 24/7 qualification with measured resource use | `RESOURCE_BASELINE=GREEN` (4.4 GiB available, swap ~268 KiB, OOM_NONE_RECENT); `HERMES_SHORT_SOAK_30M=PASS`; `HERMES_POST_SOAK_NEW8GB=PASS`; post-cutover soak margin | SATISFIED |
| 7 | OLD retirement a later explicit decision | separately readiness-proven (`v4_vps_68_rollback_exit_decommission_readiness_v1.md`), operator-authorized (#68 issuecomment-5665517718), executed as clean OS shutdown (`OLD_OS_SHUTDOWN=PASS`) | SATISFIED |

```text
ISSUE_60_ACCEPTANCE_COMPLETE=YES
ISSUE_60_REQUIRED_BLOCKERS=0
ISSUE_60_CLOSURE_READY=YES
```

## 3. 16 GB → 8 GB supersession

#60 originally targeted a 16 GB IONOS VPS (`31.70.139.51`). The operator cancelled it for cost on 2026-09-06; child #66 was closed `not_planned` for the cancelled target. The valid replacement path — IONOS VPS 6-8-240, 8 GB, `31.70.139.73` — was tracked in #67 and completed the same infrastructure objective. #60 is therefore closed COMPLETED through the replacement path, NOT not_planned: the objective (migrate Control Plane to the new VPS + qualify Hermes 24/7) was achieved; only the intermediate hardware target changed with explicit operator authorization recorded in #60 comments.

## 4. Relationship to #68

#68 owns full service parity, cutover, rollback retention, and OLD decommission. Current #68 state: technical migration/decommission readiness complete; OLD OS shutdown complete; provider contract/instance termination operator-side pending. #68 was NOT closed, NOT edited, NOT claimed complete by this task.

```text
PROVIDER_TERMINATION_BLOCKS_ISSUE_60=NO
PROVIDER_TERMINATION_BLOCKS_ISSUE_67=NO
```

Neither #60 nor #67 contains an acceptance row requiring OLD provider-commercial termination — verified against both bodies and material comments above. #60 criterion 7 ("OLD retirement remains a later explicit decision") is satisfied by the retirement decision/authorization process having happened as a separate explicit decision (which it did); it never required the IONOS contract tail.

## 5. OLD provider-termination classification

`OLD_PROVIDER_TERMINATION=MANUAL_OPERATOR_ACTION_REQUIRED` — no authenticated IONOS control surface exists (no ionosctl, no API credentials, no browser scraping by law). Do NOT claim `OLD_PROVIDER_TERMINATION=PASS` until IONOS actually completes it. Tailscale OLD node cleanup remains nonblocking manual hygiene.

## 6. Closure comments and final states

- #67 closure comment: issuecomment-5667435002 → post-close re-read `{"state":"CLOSED","stateReason":"COMPLETED"}`
- #60 closure comment: issuecomment-5667435544 → post-close re-read `{"state":"CLOSED","stateReason":"COMPLETED"}`

Bodies, titles, labels untouched. #68 untouched (state re-verified OPEN).

```text
VPS_PARENT_60_CLOSURE=PASS
VPS_PARENT_67_CLOSURE=PASS
ISSUE_60=CLOSED_COMPLETED
ISSUE_67=CLOSED_COMPLETED
ISSUE_68=OPEN_PENDING_PROVIDER_TERMINATION
```

## 7. Preserved current reality

```text
NEW_PUBLIC_IP=31.70.139.73
NEW_ROLE=LIVE
NEW_CANONICAL_VPS=31.70.139.73
OLD_PUBLIC_IP=217.160.71.145
OLD_OS_SHUTDOWN=PASS
OLD_DECOMMISSION_EXECUTED=PARTIAL_OS_SHUTDOWN_COMPLETE
ROLLBACK_RETENTION=CLOSED_BY_OPERATOR_AUTHORIZATION
```

## 8. Runtime unchanged proof

No SSH health campaign, n8n test workflow, PostgreSQL comparison, Hermes inference, ChatGPT Web sentinel, browser/recall/endurance/restart test, port scan, TLS check, GOI test, OpenClaw test, Codex review, soak, or provider probe was run. No OLD/NEW VPS access or mutation. No model inference. Pre-existing tracked telemetry churn (`reports/runtime/cursor-acp/mcp-gate-*.json`) excluded from this task's commit.

## 9. Remaining VPS work

- #68: IONOS OLD provider/account-side termination (operator manual action) → then #68 closure persistence.
- Tailscale OLD node cleanup (nonblocking manual hygiene).
- OLD TLS renewal-helper degradation: moot after provider termination (rollback TLS was valid to 2026-11-15, beyond the shutdown date; no repair performed or required).

## 10. NEXT selection

OPEN issues after #60/#67 closure: #69, #68, #65, #35, #18. Rules applied: #68 remains operator-side parallel pending IONOS termination (excluded); #35 Astra parked until new live-catalog evidence (excluded); #18 OCR deferred research (lower priority than reconciliation). Candidates #65 (future noVNC view-only hardening — a NOT-STARTED runtime implementation task, requires new implementation authorization, not mechanically READY from existing evidence) and #69 (canonical VPS operating model — already MATERIALIZED: its sole comment records `docs/vps/` area live on `main` with all 7 documents; its acceptance — a dedicated canonical VPS section — is satisfied by persisted evidence). #69 is therefore the one mechanically READY closure/reconciliation task.

```text
CURRENT_NEXT=V4_VPS_ISSUE_69_OPERATING_MODEL_CLOSURE_RECONCILIATION_V1
NEXT=V4_VPS_ISSUE_69_OPERATING_MODEL_CLOSURE_RECONCILIATION_V1
```

This task did NOT execute that task. No runtime implementation or test task was invented.

## 11. Pass markers

```text
RESULT=PASS
ISSUE_60_ACCEPTANCE_COMPLETE=YES
ISSUE_60_REQUIRED_BLOCKERS=0
ISSUE_60_STATE=CLOSED
ISSUE_60_STATE_REASON=COMPLETED
ISSUE_67_ACCEPTANCE_COMPLETE=YES
ISSUE_67_REQUIRED_BLOCKERS=0
ISSUE_67_STATE=CLOSED
ISSUE_67_STATE_REASON=COMPLETED
PROVIDER_TERMINATION_BLOCKS_ISSUE_60=NO
PROVIDER_TERMINATION_BLOCKS_ISSUE_67=NO
ISSUE_68=OPEN_PENDING_PROVIDER_TERMINATION
NEW_ROLE=LIVE
MODEL_INFERENCE=0
PRODUCTION_CHANGED=NO
RUNTIME_CHANGED=NO
```

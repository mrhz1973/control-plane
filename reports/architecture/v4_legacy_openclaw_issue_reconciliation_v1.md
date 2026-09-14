# V4 Legacy OpenClaw issue reconciliation V1

**TASK_REF:** `V4_LEGACY_OPENCLAW_ISSUE_RECONCILIATION_V1`
**BASE_HEAD:** `4c0b012fa15872f023ea1123b5af6d3933bea9f9` (== origin/main == HEAD at start, verified PASS)
**Date (Europe/Rome):** 2026-09-14
**MODE:** DOCUMENTATION / ISSUE RECONCILIATION ONLY
**MODEL_INFERENCE=0 · PRODUCTION_CHANGED=NO · RUNTIME_CHANGED=NO**

---

## 1. Verdicts

| Issue | Subject | Verdict | state_reason |
|---|---|---|---|
| #8 | Architecture v3 evidence track — OpenClaw → planners → Cursor bounded loop | Superseded — remaining backlog belongs to retired broker architecture | **NOT_PLANNED** |
| #20 | D-0014-W — Windows OpenClaw private fallback broker | Historical bounded acceptance fulfilled before retirement | **COMPLETED** |
| #22 | D-0016-W — Concrete planner consumer pilot via Windows OpenClaw fallback | Superseded before completion (Phase B/C never executed) | **NOT_PLANNED** |

Closure comments persisted:
- #8: issuecomment-5665975545
- #20: issuecomment-5665976320
- #22: issuecomment-5665977062

Post-close state re-read from GitHub: #8 `CLOSED/NOT_PLANNED`, #20 `CLOSED/COMPLETED`, #22 `CLOSED/NOT_PLANNED`. Titles, bodies, labels untouched.

## 2. Issue #8 — reason

Remaining unchecked backlog was exactly: (a) Z.AI provider-side response/classification wait, (b) subsequent minimum VPS OpenClaw broker config/runtime advancement. Both belong to the retired Architecture-v3 broker track:

- `OPENCLAW_BROKER_RUNTIME=RETIRED` — VPS broker role superseded;
- `OPENCLAW_FALLBACK_ROLE=RETIRED` — Windows fallback (the #20 chain) retired;
- planner/routing moved forward through later canonical V4 work: RT25 quota-aware planner selection core (`V4_CANONICAL_QUOTA_RUNTIME_FINAL_CLOSURE_CHECKPOINT_V1`), `resource-registry-v2` sole routing-policy source (`V4_ROUTING_POLICY_SINGLE_SOURCE_PHASE_4_V1`), Hermes governed routing;
- the stale provider-support wait must not remain active frontier — no `AWAITING_ZAI_SUPPORT_RESPONSE` global blocker exists (verified in canonical frontier/backlog docs; residual ZAI mentions are historical provenance only).

All checked evidence items in the #8 body remain valid historical evidence and are preserved unchanged.

## 3. Issue #20 — reason

Historical bounded acceptance was completed before the fallback role's retirement, with persisted evidence:

- `docs/runtime/D0014_WINDOWS_OPENCLAW_FALLBACK_STATUS.md` records `IMPLEMENTATION_PASS`;
- Windows OpenClaw gateway running private-only: loopback bind + Tailscale Serve (tailnet-only), `127.0.0.1:18789`, no public/Funnel exposure;
- VPS private reachability PASS (HTTPS 200, WSS connect ok from `ubuntu` / `100.114.7.53`);
- local rollback preserved; operator gate evidence issue #20 comment `5431799606`.

Verdict COMPLETED records fulfilled historical acceptance only. The Windows fallback is NOT restarted and does not become a READY/current route; `OPENCLAW_FALLBACK_ROLE=RETIRED` stands.

## 4. Issue #22 — reason

Historical state at abandonment: Phase A PASS (read-only discovery, `HTTP_PLANNER_SURFACE_DISABLED`); Phase B authorized but never executed (home-host offline window, later moot); Phase C bounded one-call pilot never executed. The pilot's execution surface (Windows OpenClaw fallback) is retired; planner-consumer functionality moved forward through the canonical RT25/registry-v2/Hermes routing architecture. NO catch-up Phase A/B/C implementation was executed to close this issue. Historical artifacts preserved as evidence: `docs/contracts/openclaw-execution-packet-consumer-v1.md`, `docs/contracts/execution-packet-v1.schema.json`, Phase A sanitized record.

## 5. Canonical superseding architecture

```text
OPENCLAW_FINAL_DISPOSITION=SCOPED_RETENTION
OPENCLAW_BROKER_RUNTIME=RETIRED
OPENCLAW_FALLBACK_ROLE=RETIRED
OPENCLAW_AGENT_RUNTIME=RETIRED
OPENCLAW_QUOTA_OBSERVATION_LANE=KEEP_SCOPED
OPENCLAW_QUOTA_SCOPE=glm_coding_plan
GLM_QUOTA_AUTHORITY=OPENCLAW
CODEX_QUOTA_AUTHORITY=CODEX_APP_SERVER
CODEX_OPENCLAW_AUTHORITY=NO
CODEX_OPENCLAW_FALLBACK=NO
```

Superseding evidence: `reports/architecture/v4_openclaw_retirement_scope_reconciliation_v1.md`, `reports/architecture/v4_hermes_consolidation_audit_closure_evaluation_v1.md`, CURRENT-OPENCLAW-RECONCILIATION banner in `docs/runtime/CURRENT_FRONTIER.md`. Hermes / current Control Plane routing supersedes the old broker architecture.

## 6. Historical evidence preservation

- Issue bodies, titles, labels: untouched; one concise reconciliation comment added per issue.
- D-0014/D-0016 working docs under `docs/runtime/` (BACKLOG/STATUS/GATE/PLANNER_BRIEF/EXECUTION_PACKET and ISSUE_8 ZAI escalation draft/packet): preserved unchanged as historical provenance. Their references to #8/#20 are historical pointers inside historical documents, not global frontier pointers.
- Historical reports were not rewritten.

## 7. OpenClaw scoped-retention preservation

`OPENCLAW_QUOTA_OBSERVATION_LANE=KEEP_SCOPED` / `OPENCLAW_QUOTA_SCOPE=glm_coding_plan` / `GLM_QUOTA_AUTHORITY=OPENCLAW` remain intact — this reconciliation did not touch the quota observation lane, its dispatcher wiring, or any collector. No OpenClaw runtime was invoked, tested, disabled, or reactivated.

## 8. Current-state law verification

- No global frontier pointer to #8/#20/#22: PASS (canonical frontier + backlog index contain none; verified by search).
- No `AWAITING_ZAI_SUPPORT_RESPONSE` current global blocker: PASS.
- No Windows OpenClaw fallback as READY/current route: PASS (`OPENCLAW_FALLBACK_ROLE=RETIRED` stands).
- Scoped GLM quota observation intact: PASS.
- Not touched: #19 (verified OPEN, no mutation), #35, #60, #67, #68, #69.

## 9. Runtime unchanged proof

No OpenClaw/Hermes/Codex/GLM-provider/Qwen/ChatGPT-Web invocation; no browser automation; no Windows OpenClaw, NEW VPS, OLD VPS, n8n, PostgreSQL, Tailscale, or routing mutation. `MODEL_INFERENCE=0`, `PRODUCTION_CHANGED=NO`, `RUNTIME_CHANGED=NO`. Cursor using GLM 5.3 as the interactive executor model is the sanctioned execution surface for this task, not a Control Plane runtime call. Two pre-existing tracked telemetry files (`reports/runtime/cursor-acp/mcp-gate-*.json`, dispatcher-churn timestamps) were left out of this task's commit.

## 10. IONOS OLD provider termination

Remains an independent parallel operator action (IONOS panel; then #68 closure persistence), recorded separately in `reports/architecture/v4_vps_68_authorized_old_decommission_execution_v1.md` — explicitly NOT global-blocking for this task.

## 11. NEXT

Issue #19 verified OPEN. No earlier independent READY task has mandatory precedence (frontier NEXT was consumed operator-action/NO_READY markers; #35 is child-local parked; IONOS termination is operator-side).

```text
CURRENT_NEXT=V4_ISSUE_19_QUOTA_POLICY_RECONCILIATION_V1
NEXT=V4_ISSUE_19_QUOTA_POLICY_RECONCILIATION_V1
```

This task did NOT execute #19.

## 12. Pass markers

```text
RESULT=PASS
ISSUE_8_RECONCILED=YES
ISSUE_20_RECONCILED=YES
ISSUE_22_RECONCILED=YES
OPENCLAW_BROKER_RUNTIME=RETIRED
OPENCLAW_FALLBACK_ROLE=RETIRED
OPENCLAW_AGENT_RUNTIME=RETIRED
OPENCLAW_QUOTA_OBSERVATION_LANE=KEEP_SCOPED
LEGACY_ZAI_WAIT_GLOBAL_BLOCKER=NO
MODEL_INFERENCE=0
PRODUCTION_CHANGED=NO
RUNTIME_CHANGED=NO
```

# WIKI-LLM LEAN — CANDIDATE MANIFEST

**Date:** 2026-08-25
**Purpose:** pre-deletion classification for issue #10.
**Physical deletions authorized by this file:** **NONE**.

Classification vocabulary:

`KEEP_CANONICAL | KEEP_RUNTIME | KEEP_EVIDENCE | MERGE_THEN_SUPERSEDE | ARCHIVE_CANDIDATE | DELETE_CANDIDATE | STALE_BRANCH_CANDIDATE | NEEDS_REVIEW`

---

## A. Canonical current surface

| Path / group | Class | Reason |
|---|---|---|
| `README.md` AI-BOOT block | KEEP_CANONICAL | sole bootstrap/navigation owner |
| `docs/runtime/CURRENT_FRONTIER.md` | KEEP_CANONICAL | sole LIVE STATE owner |
| `docs/foundation/PROJECT_VISION.md` | KEEP_CANONICAL | foundation/hard-policy owner |
| `docs/foundation/WIKI_LLM_LEAN_METHOD.md` | KEEP_CANONICAL | lean method/source-layer owner |
| `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md` | KEEP_CANONICAL | detailed v3 process, on demand |
| `docs/foundation/CURSOR_PROMPT_TEMPLATE.md` | KEEP_CANONICAL | Cursor execution contract |
| `docs/foundation/HANDOFF_TEMPLATE.md` | KEEP_CANONICAL | seed/extended-handoff protocol |
| `docs/advisors/GLM_ADVISOR_METHOD.md` | KEEP_CANONICAL | GLM mode-specific method |
| `docs/contracts/backlog-item-v1.md` | KEEP_CANONICAL | work contract |
| `docs/contracts/planner-routing-policy-v1.md` | KEEP_CANONICAL | routing contract |
| `docs/contracts/execution-packet-v1.md` | KEEP_CANONICAL | planner→Cursor contract |
| `docs/contracts/execution-checkpoint-v1.md` | KEEP_CANONICAL | Cursor resume contract |
| GitHub issue #10 | KEEP_CANONICAL | current active consolidation work |
| GitHub issue #8 | KEEP_CANONICAL | next architecture evidence backlog |

---

## B. Already declassified on PR #11

| Path | Class | Action on PR #11 |
|---|---|---|
| `docs/OPERATING_MEMORY.md` | MERGE_THEN_SUPERSEDE | old `Status: active` removed; replaced by historical pointer |
| `docs/foundation/FOUNDATION_STATUS.md` | MERGE_THEN_SUPERSEDE | duplicate foundation index replaced by compatibility pointer |
| old full `CURRENT_FRONTIER.md` history | KEEP_EVIDENCE via Git history | removed from live file; not physically lost |
| old HANDOFF_TEMPLATE v3 bulk snapshot model | KEEP_EVIDENCE via Git history | replaced by v4 seed-only method |
| PROJECT_VISION v3.0 duplicated method/state | KEEP_EVIDENCE via Git history | v3.1 retains foundation, removes duplicated manual content |

---

## C. Legacy MVP state cluster

These files describe the May-2026 MVP era. After **L3A.5** the first two are historical pointers only (no current-state language).

| Path | Class after L3A.5 | Notes |
|---|---|---|
| `docs/MVP_STATUS.md` | `HISTORICAL_MVP_STATUS` pointer | no current-state authority; full snapshot in Git history |
| `docs/MVP_CRITERIA.md` | `HISTORICAL_MVP_ACCEPTANCE_EVIDENCE` pointer | not v3.1 acceptance criteria |
| `docs/END_TO_END_CYCLES.md` | KEEP_EVIDENCE / ARCHIVE_CANDIDATE | not rewritten in L3A.5 |
| `docs/HANDOFF_N8N_GATE.md` | `HISTORICAL_EVIDENCE_POINTER` | L3A |
| `docs/POST_MVP_BACKLOG.md` | ARCHIVE_CANDIDATE | body not rewritten in L3A.5; not LIVE STATE; inbound from canonical owners cleared of semantic dependency |
| `docs/V4_POLLING_LATENCY.md` | ARCHIVE_CANDIDATE / KEEP_EVIDENCE | same |
| `docs/PUBLIC_WEBHOOK_GATE.md` | `HISTORICAL_DECISION_POINTER` | durable public-HTTPS/webhook rules → `PROJECT_VISION` §7; no recommended NEXT |

**Group decision:** physical deletion still requires a later delete-gate census after L3A.5. History/session links may remain.


---

## D. Legacy n8n/rebuild/status cluster

| Path | Initial class | L3A action / current class | Notes |
|---|---|---|---|
| `docs/N8N_REBUILD.md` | MERGE_THEN_SUPERSEDE | **lean recovery method** (KEEP runbook, not LIVE STATE) | May/MVP chronology removed; points to frontier + `workflows/**` |
| `docs/WORKFLOW_EXPORT_STATUS.md` | MERGE_THEN_SUPERSEDE | `SUPERSEDED_AS_CURRENT_INVENTORY` | pointer only; assets stay in `workflows/**` |
| `workflows/README.md` | KEEP_RUNTIME / NEEDS_REVIEW | **KEEP_CANONICAL owner** for export/import policy | lean rewrite in L3A; history stripped |
| `docs/N8N_WORKFLOW_NAMING.md` | NEEDS_REVIEW | **naming METHOD** (L3A.5) | current inventory removed; live state → frontier; method owned here, not duplicated in `workflows/README` |
| `docs/TELEGRAM_SETUP.md` | NEEDS_REVIEW | **lean setup/security method** | Day1/Day2/MVP chronology removed |
| `docs/OBSERVABILITY.md` | NEEDS_REVIEW | NEEDS_REVIEW | not rewritten in L3A |
| `docs/RUNTIME_GATES.md` | KEEP_CANONICAL / NEEDS_REVIEW | `SUPERSEDED_AS_POLICY_OWNER` | policy moved to `PROJECT_VISION` §7.0 |
| `docs/HANDOFF_N8N_GATE.md` | KEEP_EVIDENCE / ARCHIVE_CANDIDATE | `HISTORICAL_EVIDENCE_POINTER` | unique n8n 2.x / inactive-import rules migrated |
| `docs/AUTOMATION_GUARDRAILS.md` | NEEDS_REVIEW | NEEDS_REVIEW | not rewritten in L3A |
| `docs/ROTATION_CHECKLIST.md` | KEEP_CANONICAL / NEEDS_REVIEW | KEEP_CANONICAL | compensating control; referenced by `workflows/README` |

---

## E. Legacy plan/watcher/handoff-generation cluster

| Path / pattern | Initial class | Notes |
|---|---|---|
| `docs/PLAN_OUTPUT_INGESTION.md` | ARCHIVE_CANDIDATE | old plan ingestion path; active work now GitHub issues/Backlog Items |
| `docs/PLAN_WATCHER_GATE_C.md` | KEEP_EVIDENCE / ARCHIVE_CANDIDATE | old Gate C watcher design/evidence |
| `docs/HANDOFF_N8N_GATE.md` | KEEP_EVIDENCE / ARCHIVE_CANDIDATE | old handoff-generator workflow, not bootstrap v4 |
| `docs/*handoff*` outside canonical foundation/current task | NEEDS_REVIEW | distinguish history/old runtime design from current seed protocol |

---

## F. PM-era root documents

Pattern examples:

`docs/PM11_*.md`, `docs/PM16_*.md` through `docs/PM80_*.md`.

`docs/PM_INDEX_ARCHIVE.md` already declares the PM era historical/frozen.

**Initial class:** `ARCHIVE_CANDIDATE` or `KEEP_EVIDENCE` depending unique proof.

### Preserve selectively when a PM doc contains

- unique runtime evidence not duplicated in session artifact;
- exact contract still consumed by a current tool/runtime asset;
- a decision provenance still needed by current claims;
- recovery instructions not migrated to a current runbook.

Otherwise Git history + compact archive index is the preferred recovery layer.

---

## G. `docs/runtime-packets/pm-*`

**Initial class:** `KEEP_EVIDENCE / ARCHIVE_CANDIDATE`.

These are closed/old gates by default, not current ACTIVE WORK. Some may prove why a runtime action was or was not authorized.

Before physical reduction:

1. check whether current frontier/foundation cites the packet;
2. check whether a current runtime procedure depends on it;
3. preserve open/unresolved gates even if old;
4. collapse closed packets into an evidence index only after provenance anchors exist.

PM-34 is explicitly **not** deletable while it remains a named blocked invariant/current future gate.

---

## H. `docs/sessions/**`

**Initial class:** `KEEP_EVIDENCE`, excluded from bootstrap/search-by-default.

Sessions are the safest place to retain immutable historical evidence because their path semantics already say `history/evidence`.

Physical deletion has low ROI unless:

- exact duplicate content exists;
- file is erroneous and corrected by a later authoritative evidence artifact;
- Git history alone is accepted as sufficient recovery.

Priority is to remove links from active navigation, not to delete session evidence first.

---

## I. `docs/handoffs/**`

**Initial class:** `KEEP_EVIDENCE / ARCHIVE_CANDIDATE`.

Rules:

- existing full handoffs become historical checkpoints;
- new default handoff is seed-only and usually not persisted;
- old handoff should never be used as LIVE STATE after CORE BOOT;
- later L3 may retain only phase-boundary handoffs and remove redundant rolling copies if reference/evidence census permits.

The 2026-08-25 v3 handoff remains useful as a phase-transition checkpoint even though it is no longer the bootstrap source.

---

## J. Old contract/runtime-helper cluster

Examples discovered through historical references:

- `docs/contracts/classifier-wrapper-v1.md`;
- `docs/contracts/codex-bridge-contract-v1.md`;
- old bridge/invocation contracts;
- old `docs/runtime/codex-prompts/**`;
- old classifier/Codex/OpenClaw helper samples.

**Initial class:** `NEEDS_REVIEW`.

A contract used by a current tool = `KEEP_RUNTIME`. A contract for a superseded architecture with no current consumer = `ARCHIVE_CANDIDATE` after dependency search.

---

## K. Workflow assets

### `workflows/**`

**Default class:** `KEEP_RUNTIME` until proven otherwise.

Never delete merely because a workflow is inactive/old. Classification requires:

- current runtime inventory;
- rebuild dependency;
- rollback value;
- superseding export;
- no unique credential/schema/topology value needed for recovery.

Historical redacted snapshots can later move to archive/remove from main if recovery is fully served by current canonical exports + Git history.

### `tools/**` / `scripts/**`

**Default class:** `KEEP_RUNTIME` or `NEEDS_REVIEW`.

Delete only if no current workflow/build/validation/document contract calls them and no rebuild path needs them.

---

## L. Branch candidates

Observed at 2026-08-25:

| Branch | Class |
|---|---|
| `docs/accepted-multi-planner-cursor-loop` | STALE_BRANCH_CANDIDATE — PR #9 already merged |
| `cursor/d0038e-wf45-import-ui-only-pass-79b7` | STALE_BRANCH_CANDIDATE |
| `cursor/d0041e-ge02-prep-docs-only-79b7` | STALE_BRANCH_CANDIDATE |
| `cursor/ge01-wd45-fanout-fix-d6c9` | STALE_BRANCH_CANDIDATE |
| `cursor/ge02-bounded-runtime-record-79b7` | STALE_BRANCH_CANDIDATE |
| `cursor/handoff-compliance-d0041-d0042-79b7` | STALE_BRANCH_CANDIDATE |
| `cursor/wf47-gate-e-store-consolidation-79b7` | STALE_BRANCH_CANDIDATE |
| `cursor/wf47-store-derivation-dedupe-79b7` | STALE_BRANCH_CANDIDATE |
| `docs/wiki-llm-lean-bootstrap` | ACTIVE — PR #11 |

No ref deletion before unique-commit/merge-base verification.

---

## M. Priority order for L2/L3

1. remove competing current semantics — **already started in PR #11**;
2. legacy MVP status cluster;
3. rebuild/export/status cluster;
4. plan/watcher/handoff-generation cluster;
5. root PM docs + closed runtime packets;
6. old contract/helper cluster;
7. workflow historical snapshots only after runtime/rebuild census;
8. session evidence last;
9. stale branches in separate branch-cleanup gate.

---

## N. Delete gate

A file becomes `DELETE_CANDIDATE` only when all are true:

```yaml
unique_current_rule: false
unique_runtime_dependency: false
unique_rebuild_dependency: false
unique_live_gate_dependency: false
unique_evidence_required_by_current_claim: false
inbound_canonical_links_resolved: true
recovery_via_git_history: confirmed
```

Until then the candidate stays merge/archive/evidence, not delete.

---

## O. L3A record (2026-08-25)

- **L2 census:** PASS; **`DELETE_CANDIDATE` still empty** pre- and post-L3A (no physical deletion).
- **L3A scope:** canonical extraction + legacy declassification only; no branch deletion; no workflow JSON/tool/script changes.
- **Migrated rules:** gate model → `PROJECT_VISION` §7.0; recovery → lean `N8N_REBUILD`; Telegram method → lean `TELEGRAM_SETUP`; export/import owner → lean `workflows/README`.
- **Declassified to compatibility/history:** `RUNTIME_GATES`, `WORKFLOW_EXPORT_STATUS`, `HANDOFF_N8N_GATE`.
- **Re-census required** after L3A merge before any L3B physical reduction.

---

## P. L3A.5 semantic collision cleanup (2026-08-25)

- **PR #12 / L3A:** MERGED PASS (canonical extraction).
- **Post-L3A re-census:** PASS; **`DELETE_READY` pre-L3A.5 = []**.
- **Four material stale collisions addressed:**
  1. `MVP_STATUS` self-declared current state → historical pointer
  2. `MVP_CRITERIA` current-state pointer to MVP_STATUS → historical acceptance evidence pointer
  3. `N8N_WORKFLOW_NAMING` Current CONTROL PLANE / Active inventory → naming METHOD only
  4. `PUBLIC_WEBHOOK_GATE` Recommended next gate → historical decision pointer; durable rules → `PROJECT_VISION` §7
- **Physical deletions:** NONE. **Branch deletions:** NONE.
- **L3A compatibility pointers kept:** `RUNTIME_GATES`, `WORKFLOW_EXPORT_STATUS`, `HANDOFF_N8N_GATE`.
- **Required after L3A.5:** mechanical delete-gate re-census before any L3B physical reduction. Do not promote `DELETE_READY` without proof.

---

## Q. L3A.6 immutable link rewrite (2026-08-25)

- **PR #14 / L3A.5:** MERGED PASS (squash 25319715e35d4f1774b3b8a936d114feed9e1bb8).
- **Final delete-gate verify:** PASS — A–G / recovery / immutable anchor verdi; DELETE_READY_FINAL=[] pre-L3A.6 **only** for surviving-tree **material** link risk.
- **Recovery baseline:** 777504f7c46e5e724b6ad5f8586a98d43bab7ce8
- **Immutable URLs (pre-cleanup snapshots):**
  - MVP_STATUS.md → https://github.com/mrhz1973/control-plane/blob/777504f7c46e5e724b6ad5f8586a98d43bab7ce8/docs/MVP_STATUS.md
  - MVP_CRITERIA.md → https://github.com/mrhz1973/control-plane/blob/777504f7c46e5e724b6ad5f8586a98d43bab7ce8/docs/MVP_CRITERIA.md
  - POST_MVP_BACKLOG.md → https://github.com/mrhz1973/control-plane/blob/777504f7c46e5e724b6ad5f8586a98d43bab7ce8/docs/POST_MVP_BACKLOG.md
  - PLAN_OUTPUT_INGESTION.md → https://github.com/mrhz1973/control-plane/blob/777504f7c46e5e724b6ad5f8586a98d43bab7ce8/docs/PLAN_OUTPUT_INGESTION.md
  - V4_POLLING_LATENCY.md → https://github.com/mrhz1973/control-plane/blob/777504f7c46e5e724b6ad5f8586a98d43bab7ce8/docs/V4_POLLING_LATENCY.md
- **L3A.6 material rewrites:** README lean baseline pointer; END_TO_END_CYCLES, OBSERVABILITY, PLAN_WATCHER_GATE_C relative→immutable; D-C1-A decision packet relative→immutable.
- **Physical deletions:** NONE. **L3B:** still blocked until post-L3A.6 re-census.

## L3B_HISTORY_LINK_REWRITE_PLAN

Exhaustive plan for HISTORY_EVIDENCE refs that would break if the five archive candidates were deleted without rewrite. No broken history links permitted after L3B.

### TARGET: docs/MVP_STATUS.md

- **HISTORY_REF_COUNT:** 21
- **IMMUTABLE_REPLACEMENT:** https://github.com/mrhz1973/control-plane/blob/777504f7c46e5e724b6ad5f8586a98d43bab7ce8/docs/MVP_STATUS.md
- **SOURCE_PATHS / ACTION:**
  - docs/decision-packets/2026-05-21-criterion-1-latency-closure-decision.md → DONE_IN_L3A6 (immutable permalink applied)
  - docs/PM70_OPENCLAW_HANDOFF_LINK_HYGIENE.md → REWRITE_IN_L3B
  - docs/runtime-packets/FAST_TRACK_RUNTIME_SEQUENCE.md → REWRITE_IN_L3B
  - docs/runtime-packets/pm-14-promote-41-to-40-gate.md → REWRITE_IN_L3B
  - docs/runtime-packets/pm-15-post-promotion-regression-gate.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-02f-first-edit-json-draft.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-02f-readonly-first-edit-plan.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-02f-redacted-export-commit.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-02f-redacted-export-hygiene.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-final-n8n-cleanup.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-n8n-numeric-workflow-rename.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-output-ingestion-backlog.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-output-ingestion-gate-b.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-watcher-gate-c-decision-a.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-watcher-gate-c-design.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-pm09-final-docs-close.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-raw-github-url-import-preference.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-22-control-plane-pm58-openclaw-bridge-artifact-lifecycle-design.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-22-control-plane-pm64-pm68-openclaw-governance-cleanup-batch.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-23-control-plane-pm34-artifact-validation-readiness-audit.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-23-control-plane-pm80-openclaw-runtime-evidence-capture-design.md → REWRITE_IN_L3B

### TARGET: docs/MVP_CRITERIA.md

- **HISTORY_REF_COUNT:** 1
- **IMMUTABLE_REPLACEMENT:** https://github.com/mrhz1973/control-plane/blob/777504f7c46e5e724b6ad5f8586a98d43bab7ce8/docs/MVP_CRITERIA.md
- **SOURCE_PATHS / ACTION:**
  - docs/decision-packets/2026-05-21-criterion-1-latency-closure-decision.md → DONE_IN_L3A6 (immutable permalink applied)

### TARGET: docs/POST_MVP_BACKLOG.md

- **HISTORY_REF_COUNT:** 19
- **IMMUTABLE_REPLACEMENT:** https://github.com/mrhz1973/control-plane/blob/777504f7c46e5e724b6ad5f8586a98d43bab7ce8/docs/POST_MVP_BACKLOG.md
- **SOURCE_PATHS / ACTION:**
  - docs/PM11_CANDIDATE_41_HANDOFF_FILE.md → REWRITE_IN_L3B
  - docs/PM16_AUTOMATION_ROUTER_LAYER.md → REWRITE_IN_L3B
  - docs/plans/2026-05-21_1700_control-plane_pm10-automation-next-step.plan.md → REWRITE_IN_L3B
  - docs/runtime-packets/FAST_TRACK_RUNTIME_SEQUENCE.md → REWRITE_IN_L3B
  - docs/runtime-packets/pm-12-candidate-41-handoff-file-import-gate.md → REWRITE_IN_L3B
  - docs/runtime-packets/pm-15-post-promotion-regression-gate.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-02f-first-edit-json-draft.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-02f-readonly-first-edit-plan.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-02f-redacted-export-commit.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-final-n8n-cleanup.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-n8n-numeric-workflow-rename.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-output-ingestion-backlog.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-output-ingestion-gate-b.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-watcher-gate-c-decision-a.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-watcher-gate-c-design.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-pm09-final-docs-close.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-raw-github-url-import-preference.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-pm12-candidate-41-runtime-packet.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-pm13-candidate-41-redacted-export-prep.md → REWRITE_IN_L3B

### TARGET: docs/PLAN_OUTPUT_INGESTION.md

- **HISTORY_REF_COUNT:** 6
- **IMMUTABLE_REPLACEMENT:** https://github.com/mrhz1973/control-plane/blob/777504f7c46e5e724b6ad5f8586a98d43bab7ce8/docs/PLAN_OUTPUT_INGESTION.md
- **SOURCE_PATHS / ACTION:**
  - docs/plans/README.md → REWRITE_IN_L3B
  - docs/runtime-packets/pm-09-gate-c-extend-02f-plan-watcher.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-output-ingestion-backlog.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-output-ingestion-gate-b.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-watcher-gate-c-decision-a.md → REWRITE_IN_L3B
  - docs/sessions/2026-05-21-control-plane-plan-watcher-gate-c-design.md → REWRITE_IN_L3B

### TARGET: docs/V4_POLLING_LATENCY.md

- **HISTORY_REF_COUNT:** 1
- **IMMUTABLE_REPLACEMENT:** https://github.com/mrhz1973/control-plane/blob/777504f7c46e5e724b6ad5f8586a98d43bab7ce8/docs/V4_POLLING_LATENCY.md
- **SOURCE_PATHS / ACTION:**
  - docs/decision-packets/2026-05-21-criterion-1-latency-closure-decision.md → DONE_IN_L3A6 (immutable permalink applied)

**HISTORY_LINK_REWRITE_PLAN_COMPLETE:** `true` (exhaustive mechanical census; remaining history relative links scheduled REWRITE_IN_L3B; D-C1-A already rewritten in L3A.6).

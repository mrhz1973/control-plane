# WIKI-LLM LEAN REDUCTION AUDIT — control-plane

**Date:** 2026-08-25
**Scope:** repository semantics/context efficiency only; no runtime activation.
**Branch:** `docs/wiki-llm-lean-l3a-canonical-extraction` (L3A); originally drafted on `docs/wiki-llm-lean-bootstrap`
**Deletion performed by this audit:** **NONE**.

## 1. Executive finding

The repository contains a strong current foundation v3, but its historical evolution left many documents that are useful as audit evidence while still living in highly discoverable namespaces and sometimes claiming old `active/current/handoff` roles.

For an LLM this creates two different costs:

1. **context cost** — too many files can be loaded before the real task;
2. **semantic collision** — an old document can look more authoritative than it is.

The first problem is addressed immediately by AI-BOOT + lean frontier + AUTO-VIA + `agg`.

The second requires a staged consolidation before any broad deletion.

## 2. Highest-risk semantic conflicts observed

### A. `docs/OPERATING_MEMORY.md`

Current header says:

```text
Status: active.
Future chats and agents must read this file before changing CONTROL PLANE n8n automation.
```

But the same document contains a large May-2026 `Current production state`, PM-era routing assumptions (Ollama classifier, Codex future worker), and long rolling PM history that no longer represents foundation v3.

**Classification:** `MERGE_THEN_SUPERSEDE` — **priority 1**.

Unique current operational/rebuild rules must be extracted to the correct canonical owners. Then this file should cease claiming `active` and become historical or be removed from current `main` after reference review.

### B. old handoff-design documents

Examples:

- `docs/HANDOFF_N8N_GATE.md` — old MVP handoff generation criterion;
- `docs/PM68_OPENCLAW_NEW_CHAT_COMPACT_HANDOFF.md` — historical compact handoff;
- `docs/PM63_OPENCLAW_GOVERNANCE_CHECKPOINT_HANDOFF.md`;
- many `docs/handoffs/**` snapshots.

They are valuable history but must not compete with README AI-BOOT / HANDOFF_TEMPLATE v4.

**Classification:** mostly `KEEP_EVIDENCE` or `ARCHIVE_CANDIDATE`; never bootstrap.

### C. PM root documents and runtime-packets

The repo contains a long PM chain: classifier/Codex/OpenClaw designs, probes, failures, hardening, gate packets and governance batches. `docs/PM_INDEX_ARCHIVE.md` already calls this an archive, confirming that the namespace is historical.

Examples include PM16–PM80 and many `docs/runtime-packets/pm-*` files.

**Classification:** `HISTORY/EVIDENCE`. They should be excluded from normal navigation now. Physical reduction is possible after reference/evidence checks.

### D. rolling evidence files

`docs/runtime/LAST_CURSOR_REPORT.md` is intentionally evidence, but its `LATEST` currently describes D-0080 and is older than the current live frontier/foundation.

**Classification:** `KEEP_EVIDENCE`, not stale-state bug, provided AI-BOOT never treats it as LIVE STATE. `agg` reads it once only when relevant.

### E. duplicate architecture/state narration

The current repo repeats architectural/runtime facts across README, PROJECT_VISION, operating model, frontier, issue, handoffs and historical docs.

**Classification:** reduce by ownership:

- README AI-BOOT = navigation only;
- FRONTIER = current state only;
- PROJECT_VISION = architecture/invariants only;
- operating model = detailed process only;
- issue/backlog = active work only;
- reports/sessions = evidence only.

## 3. Branch hygiene finding

Observed branches at audit time:

```text
main

docs/accepted-multi-planner-cursor-loop
docs/wiki-llm-lean-bootstrap

cursor/d0038e-wf45-import-ui-only-pass-79b7
cursor/d0041e-ge02-prep-docs-only-79b7
cursor/ge01-wd45-fanout-fix-d6c9
cursor/ge02-bounded-runtime-record-79b7
cursor/handoff-compliance-d0041-d0042-79b7
cursor/wf47-gate-e-store-consolidation-79b7
cursor/wf47-store-derivation-dedupe-79b7
```

The previously merged v3 docs branch and seven old Cursor branches are **STALE_BRANCH_CANDIDATE**, but deletion requires a dedicated merge/recovery check. No branch is deleted by this audit.

## 4. Canonical keep-set target

These are expected to remain first-class current sources:

### Bootstrap/live

- `README.md` AI-BOOT block;
- `docs/runtime/CURRENT_FRONTIER.md`.

### Foundation/method

- `docs/foundation/PROJECT_VISION.md`;
- `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`;
- `docs/foundation/WIKI_LLM_LEAN_METHOD.md`;
- `docs/foundation/CURSOR_PROMPT_TEMPLATE.md`;
- `docs/foundation/HANDOFF_TEMPLATE.md`;
- `docs/advisors/GLM_ADVISOR_METHOD.md`.

### Contracts

- `docs/contracts/backlog-item-v1.md`;
- `docs/contracts/planner-routing-policy-v1.md`;
- `docs/contracts/execution-packet-v1.md`;
- `docs/contracts/execution-checkpoint-v1.md`.

### Runtime/rebuild material

Keep only artifacts that are genuinely required to rebuild, validate or operate the current system, plus current workflow exports/tools/scripts. Their detailed census is a separate pass because deletion here can affect recovery.

### Evidence

Evidence should be retained when it proves a still-relevant gate/decision, but is never preload material.

## 5. Reduction classes for the rest of the repository

### `KEEP_EVIDENCE`

Use for:

- D-0081 and other evidence still referenced by live gate history;
- runtime attestations needed to justify current state;
- decisions whose provenance is still relevant.

### `MERGE_THEN_SUPERSEDE`

Likely candidates:

- `docs/OPERATING_MEMORY.md`;
- old current-state/status documents that contain still-valid rules mixed with obsolete state;
- old handoff methodology documents with unique rules not yet copied into AI-BOOT / method docs.

### `ARCHIVE_CANDIDATE`

Likely candidates:

- PM design/probe/governance narratives already represented by closed state + Git history;
- old compact handoff/checkpoints;
- obsolete MVP planning/status narratives;
- closed runtime packets with no current operational dependency.

### `DELETE_CANDIDATE`

Only after evidence proves the file has:

- no unique current rule;
- no unique rebuild content;
- no unique evidence required by a live claim;
- no inbound canonical dependency that cannot be updated;
- full recovery through Git history.

## 6. Specific stale/legacy documents to inspect first

Priority queue:

1. `docs/OPERATING_MEMORY.md`;
2. `docs/MVP_STATUS.md` + `docs/MVP_CRITERIA.md`;
3. `docs/END_TO_END_CYCLES.md`;
4. `docs/HANDOFF_N8N_GATE.md`;
5. old `PLAN_*` documents;
6. `PM_INDEX_ARCHIVE.md` and root `PM*.md` namespace;
7. `runtime-packets/pm-*`;
8. old PM handoff/governance maps;
9. redundant old branches.

This order is semantic-risk-first, not age-first.

## 7. Physical cleanup strategy

### Phase L0 — boot isolation

**Implemented on this branch:** README AI-BOOT, AUTO-VIA, `agg`, lean CURRENT_FRONTIER, seed-only handoff.

### Phase L1 — canonical-source reconciliation

Before deleting anything:

- make bootstrap section in PROJECT_VISION point to README AI-BOOT instead of prescribing a large preload;
- ensure no foundation document says old GLM/Ollama/Codex roles are current;
- extract any still-valid rules from OPERATING_MEMORY to correct owners;
- mark superseded active-looking docs clearly.

### Phase L2 — reference census

For each candidate group:

- inbound links from canonical docs;
- current workflow/tool/script dependency;
- unique evidence/rebuild content;
- Git-history recovery anchor.

Output a machine-readable candidate list if useful.

### Phase L3 — historical reduction PR

Only after L2 PASS:

- remove or relocate redundant PM narratives and old handoff/status docs from current `main`;
- keep compact history index/pointers where useful;
- preserve Git history;
- no runtime asset deletion in the same PR.

### Phase L4 — branch cleanup

Verify each stale branch is merged/obsolete and has no unique commits needed for recovery, then delete stale refs in a separate gate.

### Phase L5 — fresh-session validation

Open a fresh GPT Web session and prove:

```text
remote HEAD
+ AI-BOOT
+ lean frontier
+ issue #8
```

is sufficient to identify state/gate/NEXT and execute AUTO-VIA without loading foundation/history unnecessarily.

## 8. 9.5 acceptance criteria

Score target is reached when all are true:

- CORE BOOT is bounded and small;
- frontier has no history/HEAD duplication;
- handoff is seed-only by default;
- `agg` is evidence-aware and narrow;
- no stale document claims to be a competing current source;
- ACTIVE WORK contains the only active-task detail;
- foundation docs own architecture, not runtime state;
- historical PM/session material is quarantined from normal discovery and physically reduced where safe;
- stale branches are cleaned after verification;
- runtime/rebuild/evidence integrity remains intact;
- a fresh-session bootstrap test passes without human reconstruction.

## 9. Current assessment

- **Foundation/architecture quality:** strong.
- **Bootstrap before this branch:** too heavy.
- **Bootstrap on this branch:** target-quality design.
- **Repository semantic hygiene:** improved by L3A (below); remaining MVP/PM/NEEDS_REVIEW surfaces still discoverable.
- **Deletion readiness:** NOT YET — re-census required after L3A merge; `DELETE_CANDIDATE` still empty.

No deletions are authorized or implied by this audit.

## 10. L3A canonical extraction (2026-08-25)

**L2 census:** PASS (reference/consumer/rebuild census; `DELETE_CANDIDATE=[]` pre-L3A).

**Physical deletions in L3A:** NONE. **Branch deletions:** NONE.

### Rules migrated to canonical owners

| Rule / method | Destination |
|---|---|
| One runtime action per gate; docs-only AUTO-VIA; docs batching; real-gate list | `PROJECT_VISION` §7.0 |
| Durable n8n recovery / import-inactive / Execute Command prerequisite | `docs/N8N_REBUILD.md` (lean) |
| Telegram secrets/setup method | `docs/TELEGRAM_SETUP.md` (lean) |
| Workflow export/import/asset policy + n8n 2.x note | `workflows/README.md` |

### Legacy docs declassified to compatibility / history

| Path | New status |
|---|---|
| `docs/RUNTIME_GATES.md` | `SUPERSEDED_AS_POLICY_OWNER` |
| `docs/WORKFLOW_EXPORT_STATUS.md` | `SUPERSEDED_AS_CURRENT_INVENTORY` |
| `docs/HANDOFF_N8N_GATE.md` | `HISTORICAL_EVIDENCE_POINTER` |
| `docs/N8N_REBUILD.md` | lean recovery method (not LIVE STATE) |
| `docs/TELEGRAM_SETUP.md` | lean setup/security method (not LIVE STATE) |

**Still NEEDS_REVIEW (not rewritten in L3A):** `docs/OBSERVABILITY.md`, `docs/N8N_WORKFLOW_NAMING.md`, MVP/PM clusters.

**Required after L3A merge:** re-census inbound references before any L3B physical reduction.

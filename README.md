# control-plane

Personal Automation MVP — **documentation**, redacted n8n workflow exports, and VPS rebuild runbooks. No application runtime code lives in this repo.

**Authoritative snapshot:** [docs/MVP_STATUS.md](docs/MVP_STATUS.md) · **Post-MVP backlog:** [docs/POST_MVP_BACKLOG.md](docs/POST_MVP_BACKLOG.md) · **Operating memory (agents):** [docs/OPERATING_MEMORY.md](docs/OPERATING_MEMORY.md)

---

## Current operational snapshot (2026-05-21)

| Area | State |
|------|--------|
| **MVP** | Operationally **accepted / closed** with C1 latency exception (**D-C1-A**) — **not** strict 5/5 PASS |
| **C1** | **PARTIAL** (SLA best-effort 1–5 min via v4 polling) |
| **C2–C5** | **PASS** |
| **PM-09** | Gate **C + D + FILE PASS** — plan detect + Telegram text + `.md` file in production **`40`** |
| **Production n8n** | **`40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE`** (1 min schedule) |
| **CONTROL PLANE n8n list** | **4 workflows** — see [naming registry](docs/N8N_WORKFLOW_NAMING.md) |
| **v5 / GitHub webhook** | **Off** / not configured |
| **ALINA LAVORO** | Out of scope — not touched |

### n8n CONTROL PLANE workflows (final list)

| ID | Name | State |
|----|------|--------|
| **40** | CP v4 multirepo polling — FILE HANDOFF SAFE TEXT | **ACTIVE** (sole production poll+handoff + PM-09) |
| **30** | CP handoff manual Telegram v1 | OFF |
| **20** | CP v5 push webhook | OFF |
| **01** | CP v4 single-repo polling | LEGACY OFF |

**Removed from n8n UI** after PM-09 PASS (no longer in the list): backup `40` (pre–Gate D file); **`55`** Gate D test-safe. Details: [final n8n cleanup session](docs/sessions/2026-05-21-control-plane-final-n8n-cleanup.md).

**Future candidates:** import/test as **`41`**, **`42`**, **`43`** — not additional `40` copies. Prefix **`55`** only if a new isolated test-safe workflow is explicitly gated (not in current UI).

---

## Flow (production `40`, v4 polling)

```text
GitHub commit (watched repos)
    → n8n schedule poll (workflow 40, ~1 min)
    → Data Table dedupe (per-repo keys)
    → IF new commit?
        ├─→ Format + Telegram (commit notify)
        ├─→ [GIS path] handoff safe-text + latest-gis-handoff.md file
        └─→ [control-plane plan path]
              Gate C: detect docs/plans/*.plan.md → plan_detected
              Gate D: Telegram plan_detected message
                    → fetch/write .md → Telegram document attachment
```

v5 webhook path is **not** active. Strict sub-30s push→Telegram (C1) is deferred unless [PM-01](docs/POST_MVP_BACKLOG.md) is explicitly reopened.

---

## Repos

| Repo | Role |
|------|------|
| [mrhz1973/dev-method](https://github.com/mrhz1973/dev-method) | Watched — generator / handoff discipline |
| [mrhz1973/cursor-coordinate-converter](https://github.com/mrhz1973/cursor-coordinate-converter) | Watched — GIS benchmark (not modified by control-plane cleanup) |
| [mrhz1973/alina-lavoro](https://github.com/mrhz1973/alina-lavoro) | **Forbidden** — out of scope |

---

## Rules

- **No secrets in git** — tokens, chat_id, credential IDs, webhook URLs stay in n8n UI only.
- Redact workflow exports before commit — [workflows/README.md](workflows/README.md).
- **Runtime changes:** one gate at a time — [docs/RUNTIME_GATES.md](docs/RUNTIME_GATES.md). Docs-only updates may be batched.

---

## Documentation index

| Start here | Doc |
|------------|-----|
| Agent operating memory (ready-import rules) | [docs/OPERATING_MEMORY.md](docs/OPERATING_MEMORY.md) |
| MVP scorecard + runtime table | [docs/MVP_STATUS.md](docs/MVP_STATUS.md) |
| Optional post-MVP work | [docs/POST_MVP_BACKLOG.md](docs/POST_MVP_BACKLOG.md) |
| Workflow IDs + candidate policy | [docs/N8N_WORKFLOW_NAMING.md](docs/N8N_WORKFLOW_NAMING.md) |
| Committed export inventory | [docs/WORKFLOW_EXPORT_STATUS.md](docs/WORKFLOW_EXPORT_STATUS.md) |
| PM-09 plan watcher (Gate C+D) | [docs/PLAN_WATCHER_GATE_C.md](docs/PLAN_WATCHER_GATE_C.md) |
| PM-11 candidate `41` handoff file (design) | [docs/PM11_CANDIDATE_41_HANDOFF_FILE.md](docs/PM11_CANDIDATE_41_HANDOFF_FILE.md) |
| PM-12 candidate `41` import gate (packet) | [docs/runtime-packets/pm-12-candidate-41-handoff-file-import-gate.md](docs/runtime-packets/pm-12-candidate-41-handoff-file-import-gate.md) |
| PM-12 candidate `41` runtime PASS | [docs/sessions/2026-05-21-control-plane-41-handoff-file-runtime-pass.md](docs/sessions/2026-05-21-control-plane-41-handoff-file-runtime-pass.md) |
| PM-13 candidate `41` redacted export (gate) | [docs/runtime-packets/pm-13-candidate-41-redacted-export-gate.md](docs/runtime-packets/pm-13-candidate-41-redacted-export-gate.md) |
| PM-13 `41` export committed | [workflows/exports/2026-05-21_41-plan-handoff-file-candidate.redacted.json](workflows/exports/2026-05-21_41-plan-handoff-file-candidate.redacted.json) · [session](docs/sessions/2026-05-21-control-plane-41-redacted-export-commit.md) |
| PM-14 promotion `41` → `40` (packet) | [docs/runtime-packets/pm-14-promote-41-to-40-gate.md](docs/runtime-packets/pm-14-promote-41-to-40-gate.md) |
| PM-15 post-promotion regression (packet) | [docs/runtime-packets/pm-15-post-promotion-regression-gate.md](docs/runtime-packets/pm-15-post-promotion-regression-gate.md) |
| PM-16 automation router layer (design) | [docs/PM16_AUTOMATION_ROUTER_LAYER.md](docs/PM16_AUTOMATION_ROUTER_LAYER.md) |
| Fast-track runtime sequence (runbook) | [docs/runtime-packets/FAST_TRACK_RUNTIME_SEQUENCE.md](docs/runtime-packets/FAST_TRACK_RUNTIME_SEQUENCE.md) |
| Plan file schema | [docs/plans/README.md](docs/plans/README.md) |
| VPS rebuild | [docs/N8N_REBUILD.md](docs/N8N_REBUILD.md) |
| Runtime gate discipline | [docs/RUNTIME_GATES.md](docs/RUNTIME_GATES.md) |
| Evidence / export hygiene | [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) |

**Session closes:** [PM-09 docs close](docs/sessions/2026-05-21-control-plane-pm09-final-docs-close.md) · [final n8n list cleanup](docs/sessions/2026-05-21-control-plane-final-n8n-cleanup.md)

**Criteria & decisions:** [docs/MVP_CRITERIA.md](docs/MVP_CRITERIA.md) · [D-C1-A packet](docs/decision-packets/2026-05-21-criterion-1-latency-closure-decision.md)

---

## Rebuild principle

If the VPS dies, docs and redacted exports here must be enough to recreate n8n workflows, credentials (in UI), and watched-repo behavior. See [docs/N8N_REBUILD.md](docs/N8N_REBUILD.md).

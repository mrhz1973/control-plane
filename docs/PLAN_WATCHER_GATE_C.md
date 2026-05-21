# Plan watcher — Gate C design (PM-09)

**Docs-only design.** **Runtime not authorized** by this document. No n8n UI, no **02F** modification, no workflow import/export, no Telegram send.

**Related:** [PLAN_OUTPUT_INGESTION.md](PLAN_OUTPUT_INGESTION.md), [POST_MVP_BACKLOG.md](POST_MVP_BACKLOG.md), [RUNTIME_GATES.md](RUNTIME_GATES.md), [OBSERVABILITY.md](OBSERVABILITY.md), [plans/README.md](plans/README.md).

---

## Purpose

Define how a future n8n **watcher** detects new or changed Cursor Plan files under `docs/plans/*.plan.md` after a GitHub commit, validates Gate B schema, dedupes events, and emits a normalized **`plan_detected`** event for Gate D (Telegram summary / orchestrator ingestion).

Gate C covers **detection and normalization only** — not Telegram delivery.

---

## Status

| Item | State |
|------|--------|
| **Gate C design** | **Delivered** (this document) |
| **Gate C runtime** | **Not authorized** — explicit [RUNTIME_GATES.md](RUNTIME_GATES.md) session required |
| **Gate D Telegram** | **Not authorized** |
| **02F modification** | **Not authorized** by this task |
| **v5 / webhook** | **Off** / not configured |
| **C1** | **PARTIAL** (D-C1-A) — unchanged |

---

## Watcher scope

| In scope | Out of scope |
|----------|--------------|
| Commits touching `docs/plans/*.plan.md` in watched repos (v1: **control-plane** primary) | GIS handoff branch logic (existing 02F path) |
| Parse YAML front matter per [Gate B schema](PLAN_OUTPUT_INGESTION.md#required-yaml-front-matter) | Full plan body in Telegram (Gate D) |
| Emit `plan_detected` normalized event | Cursor IDE provider API |
| Dedupe by plan path + content/commit identity | v5 webhook, strict C1 reopen |
| Skip `sample: true` files | ALINA LAVORO, dev-method, GIS repo changes |

**Path filter (strict):**

```text
docs/plans/**/*.plan.md
```

Filename must match Gate B pattern: `YYYY-MM-DD_HHMM_<repo-short>_<task-slug>.plan.md`.

---

## Input

Markdown plan file with YAML front matter (Gate B). Minimum fields validated before `plan_detected`:

`repo`, `task`, `mode`, `model`, `effort`, `risk`, `next_step`, `requires_runtime`, `requires_human_gate`, `target_window`, `created_at`, `source`, `summary`.

Optional field used for filtering: `sample: true` → **ignore** (no event).

---

## Output (Gate C → Gate D handoff)

Normalized event **`plan_detected`** — internal shape for n8n Code node / IF branch; **not** sent to Telegram in Gate C.

```json
{
  "event": "plan_detected",
  "repo_slug": "mrhz1973/control-plane",
  "plan_path": "docs/plans/2026-05-21_1230_control-plane_pm-09-gate-b.plan.md",
  "commit_sha": "<public GitHub SHA>",
  "blob_sha": "<GitHub blob SHA if available>",
  "task": "PM-09 Gate B",
  "risk": "low",
  "next_step": "One sentence from front matter",
  "requires_runtime": "no",
  "requires_human_gate": "yes",
  "target_window": "control-plane",
  "summary": "Telegram-safe one-liner from front matter",
  "github_file_url": "https://github.com/mrhz1973/control-plane/blob/<sha>/docs/plans/...",
  "dedupe_key": "plan:mrhz1973/control-plane:docs/plans/2026-05-21_1230_control-plane_pm-09-gate-b.plan.md:<blob_or_commit_sha>"
}
```

Gate D consumes `plan_detected` to build Telegram payload per [PLAN_OUTPUT_INGESTION.md § Desired Telegram payload](PLAN_OUTPUT_INGESTION.md#desired-telegram-payload-brief).

**Gate C does not send Telegram.**

---

## Candidate architecture A — extend **02F**

Add an isolated branch on **`02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT`** triggered when the polled repo is `mrhz1973/control-plane` and the latest commit includes changes under `docs/plans/*.plan.md`.

| Pros | Cons |
|------|------|
| Reuses existing 1 min schedule and multirepo GitHub poll | Increases **02F** complexity — regression risk on GIS handoff + commit notify |
| Aligns with PM-07 “sole active CP poll+handoff” | Plan logic coupled to handoff workflow |
| No second active schedule | Requires **02F modification gate** + export refresh (PM-08 pattern) |
| control-plane already in watched repo list | Harder to test plan path in isolation |

**Mitigations:** early IF exit (repo ≠ control-plane → skip plan branch); separate Code node module; manual trigger test before publish; duplicate-skip via Data Table key prefix `plan:`.

---

## Candidate architecture B — new workflow (PM-03)

Separate n8n workflow (e.g. `03G - CP plan file watcher`) with its own schedule or manual trigger, polling only `mrhz1973/control-plane` commits for `docs/plans/*.plan.md`.

| Pros | Cons |
|------|------|
| Isolation — plan watcher testable without touching GIS handoff | Second CONTROL PLANE scheduled workflow — tension with PM-07 cleanup |
| Smaller blast radius on failure | Duplicates GitHub poll + dedupe infrastructure |
| Can stay **inactive** until Gate C runtime PASS | Extra operational surface (credentials, schedule, list hygiene) |
| Easier rollback (delete workflow) | Two workflows may race on same commit |

**Mitigations:** start **inactive** + Manual Trigger only for first runtime gate; merge into **02F** after PASS if PM-07 single-workflow rule is reaffirmed.

---

## Recommendation

**Primary: extend 02F (architecture A)** with an isolated plan-detection branch for `mrhz1973/control-plane` only.

**Rationale:**

1. **PM-07** established **`02F`** as the sole active CONTROL PLANE polling workflow — a second scheduled poller (B) reopens list hygiene and duplicate-notify concerns.
2. Plan files v1 live in **control-plane** `docs/plans/`, which **02F** already watches on each poll cycle.
3. Gate C needs commit visibility, not sub-30s latency — existing 1–5 min SLA (D-C1-A) is sufficient.
4. Plan branch can **parallel** existing commit-notify path without replacing GIS handoff — same pattern as current parallel branches (see [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) UX note).

**Fallback:** if **02F** modification gate is rejected or regression risk is too high, use architecture B as **inactive** manual-test workflow first (PM-03 one-off), then decide merge vs keep separate.

**Decision deferred to Gate C runtime session** — this design doc does not authorize either path.

---

## Future algorithm (runtime gate)

Execute **one step at a time** per [RUNTIME_GATES.md](RUNTIME_GATES.md).

```text
1. Poll / receive latest commit for watched repo (02F schedule or manual trigger)
2. List commit-changed files (GitHub API: compare or commit detail)
3. Filter paths matching docs/plans/*.plan.md
4. For each matching file:
   a. Fetch file content at commit SHA (GitHub API)
   b. Parse YAML front matter
   c. If sample: true → skip (log plan_skip_sample)
   d. Validate all mandatory front-matter fields present and non-empty
   e. If invalid → log plan_skip_invalid (no Telegram, no plan_detected)
   f. Compute dedupe_key = plan:<repo_slug>:<plan_path>:<blob_sha or commit_sha>
   g. Data Table get dedupe_key → if exists → skip (plan_skip_duplicate)
   h. Upsert dedupe_key
   i. Emit plan_detected event → hand off to Gate D branch (disabled until Gate D authorized)
5. Do not send Telegram in Gate C-only session
```

---

## Error handling

| Condition | Action | Telegram |
|-----------|--------|----------|
| Invalid YAML / no front matter | Log `plan_skip_invalid`; optional debug row in Data Table | **No** |
| Missing mandatory field | Same as invalid | **No** |
| `sample: true` | Log `plan_skip_sample`; skip silently | **No** |
| Duplicate (dedupe_key exists) | Log `plan_skip_duplicate`; IF false branch | **No** |
| Path matches but not `.plan.md` suffix | Ignore (not plan convention) | **No** |
| GitHub API / n8n runtime unavailable | Workflow error branch; retry on next poll | **No** |
| Valid new plan | Emit `plan_detected`; upsert dedupe | **No** (Gate D only) |

Never put raw file content or secrets in error logs committed to git.

---

## Dedupe design

| Key | Value |
|-----|--------|
| **Data Table** | Reuse `control_plane_state` or dedicated keys with prefix `plan:` |
| **Key format** | `plan:<repo_slug>:<plan_path>:<blob_sha>` preferred; fallback `:<commit_sha>` if blob unavailable |
| **Behavior** | Same path + same content SHA → skip; path changed content → new event |
| **Goal** | No duplicate `plan_detected` on repeated 1 min polls (same as commit dedupe on 02F) |

---

## Security

| Rule | Detail |
|------|--------|
| **No secrets in git** | Tokens, chat_id, credential IDs, webhook URLs stay in n8n UI |
| **No full transcript** | Do not fetch or forward Cursor session logs with PII |
| **Telegram-safe fields only** | Gate C output uses front matter `summary`, `next_step`, public GitHub URLs |
| **Public repo assumption** | Plan files on public GitHub; no signed URLs in docs |
| **Redacted exports** | Any post-runtime export follows [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) |

---

## Data to NOT commit

- Unredacted n8n workflow JSON with credential IDs or chat_id
- Data Table dumps containing operational notes
- Telegram message payloads from live tests
- GitHub tokens, webhook secrets
- Full plan file contents in session logs (SHAs and paths only)

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **02F regression** (GIS handoff / commit notify broken) | Isolated IF branch; manual test on inactive copy first; one gate per change |
| **Duplicate plan notifications** (Gate D) | Dedupe key before emit; test with repeated Manual Trigger |
| **Invalid plan files committed** | Strict front-matter validation; skip silently with observability log |
| **Sample file triggers production** | Honor `sample: true`; ignore `example-*` in filename optionally |
| **Workflow sprawl** (architecture B) | Prefer A; if B, keep inactive until PASS |
| **Export drift** | Re-export redacted JSON after material **02F** change (PM-08 pattern) |

---

## Gate C runtime PASS criteria (future)

Record PASS in docs after an explicit runtime session when **all** are true:

1. A **non-sample** plan file committed under `docs/plans/` per Gate B convention.
2. Watcher (02F extension or approved PM-03 workflow) runs via Manual Trigger or schedule poll.
3. Watcher emits **`plan_detected`** with correct fields and public `github_file_url`.
4. **`sample: true`** file in same commit does **not** emit `plan_detected`.
5. Second poll with unchanged plan → **duplicate skip** (no second event).
6. Invalid front matter file → **no** `plan_detected`; workflow does not fail fatally.
7. **No Telegram sent** during Gate C-only test (Gate D branch disabled or disconnected).
8. GIS handoff + commit notify paths on **02F** still **PASS** smoke (if architecture A).
9. No secrets in execution logs committed to repo.

---

## Out of scope (this design)

- Gate D Telegram send (real message)
- **02F** runtime modification (authorized only in separate gate)
- New workflow import/activation
- v5 / GitHub production webhook / public HTTPS
- Strict C1 &lt;30s reopen (PM-01)
- **ALINA LAVORO**, **dev-method**, **cursor-coordinate-converter**
- Cursor provider API integration

---

## Next trigger

User/orchestrator opens **Gate C runtime** session and chooses:

- **A** — extend **02F** (recommended), or  
- **B** — new PM-03 workflow (inactive manual test first)

Then implement **one** runtime step per [RUNTIME_GATES.md](RUNTIME_GATES.md). Gate D remains a **separate** session after Gate C PASS.

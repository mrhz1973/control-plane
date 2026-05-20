# End-to-end cycle tracker (MVP criterion 3)

**Docs-only tracker.** This document defines how to record three **real** cycles for MVP closure. It does **not** run handoff, implementers, n8n, or GitHub webhooks.

**Criterion (Italian):** Utente ha completato almeno 3 cicli reali end-to-end: handoff → implementer → commit → notifica.

**Related:** [MVP_CRITERIA.md](MVP_CRITERIA.md) §3, [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) (criterion 2 **PASS** 2026-05-20), [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md), [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md).

**Criterion 2 vs criterion 3:** MVP criterion 2 PASS (handoff via n8n + Telegram `Prompt ready: yes`) is a **prerequisite** for credible handoff steps in cycles, but the 2026-05-20 handoff manual test **alone** does **not** count as a Cycle PASS — no implementer work, no commit pushed to a watched repo, no push-triggered notifica cycle completed.

---

## What counts as a valid cycle

A **valid cycle** is one contiguous real workflow on a **watched repo** (`dev-method` or `cursor-coordinate-converter`), with evidence for all four steps:

```text
handoff → implementer → commit → notifica (Telegram)
```

| Step | Requirement |
|------|-------------|
| **1. Handoff** | A handoff was produced for a real task — via `handoff-generate.mjs` (n8n or local) **or** an equivalent handoff explicitly documented (source, repo, prompt-ready outcome). **Criterion 2 PASS** (2026-05-20) satisfies handoff-via-n8n proof; each cycle still needs its own implementer → commit → notifica evidence. |
| **2. Implementer** | User ran an implementer (e.g. Cursor) on that handoff and performed real work — not a dry run or empty prompt. |
| **3. Commit** | A commit was **pushed** to the target watched repo on GitHub (hash recorded). |
| **4. Notifica** | User received a **Telegram** message on their phone tied to that push (see notification paths below). |

**Outcome per cycle:** `PASS` only if all four steps are evidenced. Otherwise `FAIL` or `INCOMPLETE` — do not count toward the three.

---

## What does NOT count

| Does not count | Why |
|----------------|-----|
| Simulated / placeholder handoff | Not a real task |
| Manual Telegram test without handoff + commit chain | Criterion 3 needs full pipeline |
| Commit without prior handoff + implementer | Missing steps 1–2 |
| Handoff + implementer with no push | Step 3 missing |
| Push with no Telegram on phone | Step 4 missing |
| Duplicate counting of the same commit across cycles | One commit = at most one cycle |
| Work on `alina-lavoro` | Out of scope |
| Docs-only commits in **control-plane** used as fake “implementer” cycles | Criterion targets watched product repos |
| Recording token, chat_id, or webhook URL in this file | Security — forbidden |

---

## Repo eligibility for end-to-end cycles

- **Eligible:**
  - `mrhz1973/dev-method`
  - `mrhz1973/cursor-coordinate-converter`
- **Not eligible:**
  - `mrhz1973/control-plane`
- **Rationale:** control-plane is the observer/orchestrator system, not the observed product repo. Its commits may still trigger Telegram via v4, but they **do not count** toward MVP criterion 3.

---

## Notification paths (step 4)

Until [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) is satisfied, Telegram may arrive via:

| Path | Valid for criterion 3? |
|------|-------------------------|
| **v4 polling** (`CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4`) | **Yes for criterion 3 only if** the pushed commit is on a repo v4 actually polls — committed export polls **`mrhz1973/control-plane` only** (not `dev-method` or `cursor-coordinate-converter`). See [v4 repo scope](#v4-repo-scope-commit-notifications) |
| **v5 webhook** (production) | Yes when enabled and stable — not required for first three cycles |
| Manual Telegram workflow only | **No** — not tied to push after real implementer commit |

Note: v4 is **one-minute** polling; criterion 1 strict &lt;30s is separate. Criterion 3 only requires that notification **arrived** after the push, not sub-30s.

---

## v4 repo scope (commit notifications)

**Canonical committed export** (`2026-05-20_github-commit-datatable-dedupe-scheduled-v4.redacted.json`) and [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) history:

| Repo | Polled by v4? |
|------|----------------|
| `mrhz1973/control-plane` | **Yes** — `GET …/repos/mrhz1973/control-plane/commits?per_page=1`; Data Table key `github:mrhz1973/control-plane:last_commit_sha` |
| `mrhz1973/dev-method` | **No** |
| `mrhz1973/cursor-coordinate-converter` | **No** |

**Implication:** A push to **dev-method** or **GIS** does **not** produce a v4 “scheduled poll commit notification” unless runtime was extended beyond the committed export (not evidenced in this diagnosis). Criterion 3 cycles on product repos need either **v4 scope extension** (separate runtime gate), **v5 webhook** when public HTTPS exists, or an agreed alternate notifica path documented at cycle close.

**Draft fix (2026-05-20, not runtime):** `2026-05-20_github-commit-datatable-dedupe-scheduled-v4-multirepo-draft.redacted.json` — polls all three repos with separate Data Table keys; **DRAFT / NOT IMPORTED / NOT ACTIVE**.

**Cycle 1 audit note (2026-05-20):** GIS commit `34d543d` (18:58 UTC) was recorded with “v4 Telegram received.” Control-plane commits `f2bbc51` / `b97aec3` (18:52 / 19:04 UTC) align with v4 scope. Re-verify whether Cycle 1 notifica was a **control-plane** poll message vs **handoff** Telegram (`Prompt ready: yes`) before treating GIS-only v4 as proven.

---

## Relation to criterion 2

- Criterion **2** = n8n can invoke `handoff-generate.mjs` and Telegram shows `Prompt ready: yes/no`.
- Criterion **3** = three **full** cycles where that handoff (or documented equivalent) led to implementer work, a **push**, and a **notifica**.

Recommended order: close or document criterion 2 runtime PASS first, then record cycles here. If criterion 2 is not yet validated, each cycle must still name **handoff source** and how prompt-ready was established.

---

## Minimum record format

Add one section per cycle below (or append rows in your local log). **Never** put secrets in committed fields.

### Required fields

| Field | Description |
|-------|-------------|
| **data/ora** | UTC or local with timezone — when cycle **completed** (notification received) |
| **repo** | `mrhz1973/dev-method` or `mrhz1973/cursor-coordinate-converter` |
| **handoff source** | e.g. `handoff-generate.mjs via n8n manual`, `local dev-method script`, `HANDOFF_N8N_GATE manual test` |
| **implementer** | e.g. `Cursor CONTROL PLANE`, `Cursor GIS` |
| **commit hash** | Short SHA (7 chars) or full — **no** need for secret refs |
| **Telegram notification** | `received` / `not received` — describe message type briefly (e.g. v4 scheduled poll commit notify) |
| **esito** | `PASS` / `FAIL` / `INCOMPLETE` |
| **note** | Optional: task summary, branch, link to PR/issue — no tokens |

### Example shape (placeholder — not a real cycle)

```markdown
### Cycle N — INCOMPLETE

| Field | Value |
|-------|--------|
| data/ora | YYYY-MM-DD HH:MM TZ |
| repo | mrhz1973/dev-method |
| handoff source | handoff-generate.mjs via n8n manual |
| implementer | Cursor … |
| commit hash | abc1234 |
| Telegram notification | received — v4 polling |
| esito | PASS |
| note | … |
```

---

## Cycle log (fill at runtime)

Record **real** cycles here when they happen. Until three `PASS` rows exist, criterion 3 stays open. See [Repo eligibility](#repo-eligibility-for-end-to-end-cycles) above.

### Cycle 1 — PASS

**Status:** **PASS** (2026-05-20) — full pipeline: handoff → implementer → commit → Telegram notifica.

| Field | Value |
|-------|--------|
| data/ora | 2026-05-20 |
| repo | `mrhz1973/cursor-coordinate-converter` |
| **task** | **GIS — T1.3 PCN/Geoportale OGC layer gate decision packet** |
| handoff source | Criterion 2 **PASS** — n8n manual handoff (`CONTROL PLANE - Handoff generate manual Telegram v1` → **`Prompt ready: yes`**, exit 0); see [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) |
| implementer | **Cursor GIS verde** |
| commit hash | `34d543d` |
| commit message | `docs: T1.3 OGC layer gate decision packet` |
| files changed | `docs/orchestrator/latest.md`, `docs/orchestrator/inbox/2026-05-20_0130_t1-3-pcn-geoportale-ogc-gate-decision.md` |
| Telegram notification | **received** — v4 polling for commit `34d543d` (on user's phone) |
| **final evidence** | Docs-only GIS commit; no `coordinate_converter Claude.html`, no `package.json`, no deploy/code; v4 Telegram for pushed commit |
| esito | **PASS** |

**Steps evidenced:** (1) handoff via criterion 2 n8n manual + validated generator output; (2) Cursor GIS verde executed docs-only gate packet; (3) commit `34d543d` pushed to `main`; (4) v4 Telegram notifica received for that commit.

**Reference:** execution prompt used — [Cycle 1 execution prompt source](#cycle-1-execution-prompt-source) (archived for audit; cycle closed).

---

### Cycle 2 — COMMIT DONE / TELEGRAM MISSING (not PASS)

**Status:** Implementer + commit **done**; v4 Telegram **not received** for dev-method push — Cycle 2 **not PASS**.

| Field | Value |
|-------|--------|
| data/ora | 2026-05-20 (commit); notifica _missing_ |
| repo | `mrhz1973/dev-method` |
| **task** | **DEV-METHOD — Document n8n handoff runtime compatibility lessons** |
| handoff source | CONTROL PLANE prepared handoff after Cycle 1 **PASS** (criterion 2 n8n manual + [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) lessons) |
| implementer | **Cursor DEV** — executed |
| commit hash | **`5ce0a25`** |
| commit message | `docs: document n8n handoff runtime compatibility` |
| files changed | `patterns/local-handoff-generator.md`, `CHANGELOG.md`, `ROADMAP.md` (per GitHub) |
| Telegram notification | **not received** — expected v4 for pushed commit; none on phone |
| esito | **NOT PASS** (commit done; notifica missing) |

**Diagnosis (2026-05-20, read-only):** **Cause B — v4 does not monitor `dev-method`.** See [Cycle 2 missing Telegram diagnosis](#cycle-2-missing-telegram-diagnosis-2026-05-20). Not A (commit at 19:20 UTC; container up 2h+; schedule active). Not C/D in logs (no GitHub/Telegram workflow errors; dev-method never polled). **Do not** mark PASS until notifica path matches an agreed criterion-3 proof.

**Prior READY state:** execution prompt in [Cycle 2 execution prompt source](#cycle-2-execution-prompt-source) — steps 2–3 of four-step cycle remain open for notifica only if scope is fixed.

**Type:** docs-only / method documentation — consolidate operational lessons from n8n handoff gate (Execute Command, `NODES_EXCLUDE`, root `safe.directory`, gate ladder).

**Forbidden in implementer session:**

| Forbidden | Reason |
|-----------|--------|
| `mrhz1973/control-plane` | Observer repo — not cycle target |
| `cursor-coordinate-converter`, `alina-lavoro` | Out of scope |
| n8n UI, workflow execution, runtime on VPS | Docs-only in dev-method |
| token, chat_id, credential ID, webhook URL, secrets | Security |
| `git add .` | Stage only intentional docs |

**Completion proof required (all three before esito → PASS):**

1. **Commit hash** on `dev-method` `main` with message `docs: document n8n handoff runtime compatibility`.
2. **Telegram notification** from active v4 workflow for that pushed commit (on user's phone).
3. **Final `git status --short`** clean in dev-method repo.

**Execution prompt:** copy from [Cycle 2 execution prompt source](#cycle-2-execution-prompt-source) in a **separate** Cursor DEV session — do **not** run from control-plane docs-only tasks.

---

### Cycle 2 missing Telegram diagnosis (2026-05-20)

| Check | Result |
|-------|--------|
| Commit `5ce0a25` on GitHub | **Exists** — pushed 2026-05-20T19:20:28Z, message `docs: document n8n handoff runtime compatibility` |
| n8n container `root-n8n-1` | **Up** — image `docker.n8n.io/n8nio/n8n`, version **2.19.5** |
| v4 workflow active | **Yes** — log: `Activated workflow "CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4"` (ID redacted in logs) |
| v4 repo scope (export + runtime design) | **`mrhz1973/control-plane` only** — no `dev-method` URL in committed export |
| Container logs (GitHub/Telegram/schedule errors) | **None observed** for workflow execution; PostHog/Rudder/UI 403 noise only |
| Dedupe skip for `5ce0a25` | **N/A** — commit never fetched because repo out of scope |
| Classification | **B — v4 does not monitor dev-method** |

**Assumption error:** Cycle 2 prep assumed v4 polling on **watched product repos** (`dev-method`, GIS). MVP provisional v4 was built and validated for **control-plane** commit notify only ([WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md), [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)).

**Prepared fix (docs only):** draft export `workflows/exports/2026-05-20_github-commit-datatable-dedupe-scheduled-v4-multirepo-draft.redacted.json` — **DRAFT / NOT IMPORTED / NOT ACTIVE**. See [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md).

**Single recommended next runtime gate:** re-import **corrected** multirepo draft ([item propagation fix](../workflows/exports/2026-05-20_github-commit-datatable-dedupe-scheduled-v4-multirepo-draft.redacted.json) meta `itemPropagationFix`) → Manual Trigger → expect Prepare **3 items** → confirm Telegram per repo (seed dedupe for `5ce0a25` if no retro-spam) → Cycle 2 PASS. **First draft manual test failed:** 3→1 item collapse; dev-method not validated.

**Do not** mark Cycle 2 PASS until notifica received. Active v4 unchanged.

---

### Cycle 3 — PENDING (planned, after Cycle 2 PASS)

| Field | Value |
|-------|--------|
| data/ora | _pending_ |
| repo | `mrhz1973/dev-method` **or** `mrhz1973/cursor-coordinate-converter` |
| handoff source | _pending — `handoff-generate.mjs` via n8n manual or local; full four-step evidence_ |
| implementer | _pending_ |
| commit hash | _pending_ |
| Telegram notification | _pending — v4 commit notify on phone_ |
| esito | **PENDING** (not PASS) |
| note | Third distinct real cycle; third `PASS` closes criterion 3. |

---

## Cycle 2 execution prompt source

**Purpose:** Copy-paste prompt for **Cursor DEV** (dev-method) in a **future** session. **Do not execute** this prompt from control-plane docs-only work.

**Handoff lineage:** Prepared by CONTROL PLANE after Cycle 1 PASS and criterion 2 n8n handoff runtime lessons ([HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md)).

```markdown
MODALITÀ: DEV-METHOD — CRITERION 3 CYCLE 2 / N8N HANDOFF RUNTIME COMPATIBILITY (DOCS-ONLY)

Repo locale previsto:
C:\Users\mrhz\Documents\AI\GitHub\dev-method

Obiettivo:
Documentare nel metodo le lezioni operative emerse dal gate n8n handoff CONTROL PLANE (criterion 2 + Cycle 1 context), committare e pushare su main, poi verificare notifica Telegram v4 per quel commit (criterion 3 step 2–4).

TASK: DEV-METHOD — Document n8n handoff runtime compatibility lessons
TASK STATUS: pending
Operation type: documentation
Risk level: low
Target file(s):
  - patterns/local-handoff-generator.md
  - existing dev-method docs or README only if directly pertinent (no new scope)
Preferred implementer: Cursor DEV
Commit: authorized
Push: authorized

Preflight obbligatorio (dev-method repo):
1. git rev-parse --show-toplevel
2. git branch --show-current  → must be main (stop if not)
3. git status --short
4. se status non è vuoto, fermati e fai report (non procedere senza decisione)
5. git log -1 --oneline

SESSION / REPO GUARD:
- Repo: mrhz1973/dev-method
- Local path: C:\Users\mrhz\Documents\AI\GitHub\dev-method
- Branch: main (stop if not main)
- Do NOT touch control-plane, cursor-coordinate-converter, alina-lavoro, or unrelated repos
- Do NOT open n8n UI, run workflows, SSH to VPS, or send Telegram from this task
- Do NOT use git add .
- Docs-only: nessun runtime, nessun deploy, nessun codice tool changes unless strictly required for doc accuracy (prefer doc-only edits)

CONTEXT:
- CONTROL PLANE MVP: criterion 2 PASS (n8n manual handoff → Prompt ready yes); Cycle 1 PASS on GIS (34d543d).
- Cycle 2 must land in dev-method (method repo), distinct repo from Cycle 1.
- Lessons source: control-plane HANDOFF_N8N_GATE (Execute Command diagnosis, NODES_EXCLUDE=[], root safe.directory, gate ladder).

SCOPE — add or extend documentation (minimum content):
1. n8n v2 can disable `n8n-nodes-base.executeCommand` when `NODES_EXCLUDE` is not explicitly set; document default-disable behavior.
2. `NODES_EXCLUDE=[]` is the config fix used in CONTROL PLANE self-hosted n8n — document as required explicit allow, not “unset means allow all”.
3. Execute Command may run as user `root` in the container even when prior CLI tests used user `node` — document user/context mismatch.
4. For Git repos mounted in the container, `git safe.directory` must be configured for the **actual** user running Execute Command (e.g. root), not only for node.
5. Distinguish clearly (do not conflate):
   - local CLI dry-run PASS;
   - container CLI dry-run PASS;
   - n8n workflow Manual Trigger PASS;
   - Telegram delivery PASS.
6. Recommend **separate runtime gates**; do not skip directly to HTTP bridge if config fix is sufficient.
7. Never document token, chat_id, credential ID, webhook URL, or secrets — use placeholders only.

Preferred placement:
- Primary: `patterns/local-handoff-generator.md` (new subsection on n8n / self-hosted compatibility, or appendix cross-link).
- Secondary: only touch other existing dev-method docs if they already discuss handoff/n8n and need a one-line cross-reference.

OUT OF SCOPE:
- Modifying control-plane or GIS repos
- n8n workflow import, activation, Execute Command nodes in production
- Implementing HTTP bridge or new automation
- Committing secrets or real credential identifiers

FILES ALLOWED:
- patterns/local-handoff-generator.md
- existing dev-method documentation files already in repo (if pertinent)

FILES FORBIDDEN:
- control-plane repo, cursor-coordinate-converter repo, alina-lavoro repo
- any file containing real tokens, chat_id, credential IDs, webhook URLs

VALIDATION:
- git status --short (clean before start; only intentional docs after)
- git diff --check
- git diff -- patterns/ docs/ README.md (as applicable)

GIT RULES:
- Never git add .
- Stage only intentional documentation files
- Commit message: docs: document n8n handoff runtime compatibility
- Push: authorized on origin main

COMMIT MESSAGE:
docs: document n8n handoff runtime compatibility

FINAL REPORT (required):
- Summary of sections added/updated (file paths)
- Confirmation all 7 minimum lesson bullets are covered
- Commit hash (short + full optional)
- Push result
- Final git status --short (must be clean)
- Note for CONTROL PLANE: record commit hash + Telegram v4 received in docs/END_TO_END_CYCLES.md Cycle 2 → esito PASS
```

---

## Cycle 1 execution prompt source

**Purpose:** Copy-paste prompt for **Cursor GIS verde** in a **future** session. **Do not execute** this prompt from control-plane docs-only work. **Cycle closed** — archived for audit.

**Handoff lineage:** Structured task from GIS orchestrator inbox (`2026-05-20_0055_t1-1-polygon-flow-closeout.md` § Future Handoff Prompt) — validated `Prompt ready: yes` via n8n manual handoff 2026-05-20.

```markdown
MODALITÀ: GIS — CRITERION 3 CYCLE 1 / T1.3 GATE DECISION PACKET (DOCS-ONLY)

Repo locale previsto:
C:\Users\mrhz\Documents\AI\GitHub\cursor-coordinate-converter

Obiettivo:
Eseguire il task docs-only T1.3 — produrre il gate decision packet PCN/Geoportale OGC, committare e pushare su main, poi verificare notifica Telegram v4 per quel commit (ciclo CONTROL PLANE criterion 3 step 2–4).

TASK: GIS — T1.3 PCN/Geoportale OGC layer gate decision packet
TASK STATUS: pending
Operation type: plan
Risk level: medium
Target file(s):
  - docs/orchestrator/latest.md
  - docs/orchestrator/inbox/*.md
Preferred implementer: Cursor
Commit: authorized
Push: authorized

Preflight obbligatorio (GIS repo):
1. git rev-parse --show-toplevel
2. git branch --show-current  → must be main (stop if not)
3. git status --short
4. se status non è vuoto, fermati e fai report (non procedere senza decisione)
5. git log -1 --oneline

SESSION / REPO GUARD:
- Repo: mrhz1973/cursor-coordinate-converter
- Local path: C:\Users\mrhz\Documents\AI\GitHub\cursor-coordinate-converter
- Branch: main (stop if not main)
- Do NOT touch dev-method, alina-lavoro, control-plane, or unrelated repos
- Do NOT modify coordinate_converter Claude.html in this task
- Do NOT use git add .
- Docs-only: nessun codice nel monolite, nessun deploy, nessun package.json

CONTEXT:
- T1.1 compound polygon flow: CLOSED (closeout 2026-05-20_0055_t1-1-polygon-flow-closeout.md).
- T1.2 CoT XML waypoint: CLOSED with browser PASS (orchestratore 2026-05-19).
- Next Tier 1 sequence per 2026-05-19_1300_next-tier1-plan.md: Blocco 1 CoT done, Blocco 2 polygon done, Separato = T1.3 PCN/Geoportale research-gated.
- Candidate C requires gate clearance before any WMS/WMTS code in monolite.
- CONTROL PLANE handoff PASS 2026-05-20: Prompt ready yes (n8n manual workflow); this session completes implementer → commit → notifica for MVP cycle 1.

SCOPE:
- Produce a gate decision packet (docs-only) answering the five gates in next-tier1-plan.md § Gate decision packet — PCN/Geoportale (deferred):
  1) Endpoint availability (official WMS/WMTS URLs + public documentation)
  2) CORS feasibility from file:// or app origin
  3) Licensing / ToS for offline-first peer distribution
  4) OPSEC review (gov IT servers from classified/air-gapped context)
  5) Tile fetch compatibility with existing tile engine (not Leaflet)
- For each gate: PASS / FAIL / UNKNOWN + evidence links or notes (no secrets).
- End with recommendation: proceed to implementation planning | remain deferred | blocked.
- Update docs/orchestrator/latest.md (brief top entry) + one new inbox file with full packet (timestamped name).

OUT OF SCOPE:
- Implementing WMS/WMTS layers in coordinate_converter Claude.html
- Scraping external viewers or unofficial endpoints
- Network calls except public documentation fetch if needed for evidence
- Changing package.json, build, deploy, tags
- control-plane, dev-method, alina-lavoro repos

FILES ALLOWED:
- docs/orchestrator/latest.md
- docs/orchestrator/inbox/*.md

FILES FORBIDDEN:
- coordinate_converter Claude.html
- package.json, package-lock.json, build tooling, deploy config, secrets, .env
- dev-method repo, alina-lavoro repo, control-plane repo

VALIDATION:
- git status --short (clean before start; only intentional docs after)
- git diff -- docs/orchestrator/latest.md docs/orchestrator/inbox/
- git diff --check

GIT RULES:
- git rev-parse --show-toplevel; git branch --show-current; git status --short; git log -1 --oneline at start
- Never git add .
- Stage only intentional docs files
- Commit message: docs: T1.3 OGC layer gate decision packet
- Push: authorized on origin main (after user/control-plane cycle gate allows runtime)

COMMIT MESSAGE:
docs: T1.3 OGC layer gate decision packet

FINAL REPORT (required):
- Gate table with PASS/FAIL/UNKNOWN per gate
- Overall recommendation (proceed | deferred | blocked)
- Files changed; inbox path; latest.md updated yes/no
- Commit hash (short + full optional)
- Push result
- Final git status --short (must be clean)
- Note for CONTROL PLANE: record commit hash + Telegram v4 received in docs/END_TO_END_CYCLES.md Cycle 1 → esito PASS
```

---

## Closure rule

**Criterion 3 is closed** when:

1. Cycles 1, 2, and 3 above each have **esito: PASS**;
2. All four steps are evidenced for each;
3. At least **two different repos** or **two clearly distinct tasks** are recommended (not mandatory in MVP text, but avoids three copies of the same trivial change);
4. No token, chat_id, webhook URL, or secret appears in committed records;
5. [MVP_CRITERIA.md](MVP_CRITERIA.md) §3 status updated to **PASS** after review.

**Current tracker status:** **1 / 3 PASS** — Cycle 1 **PASS** (`34d543d`, notifica path audit recommended); Cycle 2 **COMMIT DONE / TELEGRAM MISSING** (`5ce0a25`, cause **B**); Cycle 3 **PENDING**; criterion 3 **not** fully closed.

---

## Docs-only path (now)

| Action | Status |
|--------|--------|
| Define valid / invalid cycle | Done in this file |
| Pre-fill cycle log template | Done — Cycle 1 **PASS**; Cycle 2 **READY**; Cycle 3 **PENDING** |
| Cycle 1 (GIS T1.3) | **PASS** 2026-05-20 — commit `34d543d`, v4 Telegram |
| Cycle 2 implementer + commit | **Done** — `5ce0a25` on dev-method |
| Cycle 2 v4 Telegram | **Missing** — diagnosis **B** (v4 scope) |
| v4 multirepo draft export | **Prepared** — [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md); runtime v4 **unchanged** |
| Extend v4 repo scope (runtime) | **Next runtime gate** — import/update per draft; not in docs-only tasks |
| Close criterion 3 | **PENDING** (**1 / 3 PASS**) |

---

## What NOT to do now

- n8n UI, workflow import, or schedule changes for this docs task
- Execute `handoff-generate.mjs` or implementer runs to “fill” fake cycles
- Configure GitHub webhook or enable v5 production
- Commit tokens, chat_id, webhook URLs, or credentials
- Modify `workflows/exports/`
- Touch GIS repo automation beyond normal watched work; **never** touch `alina-lavoro`

---

## After three PASS cycles

1. Replace `_pending_` fields with real values (hashes and timestamps only — no secrets).
2. Set [MVP_CRITERIA.md](MVP_CRITERIA.md) §3 to **PASS**.
3. Optional: add one line in [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) noting criterion 3 closure date.

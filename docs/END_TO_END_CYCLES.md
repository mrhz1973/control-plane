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
| **v4 polling** (`CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4`) | **Yes** — if message clearly relates to the commit you just pushed and dedupe did not spam duplicates |
| **v5 webhook** (production) | Yes when enabled and stable — not required for first three cycles |
| Manual Telegram workflow only | **No** — not tied to push after real implementer commit |

Note: v4 is **one-minute** polling; criterion 1 strict &lt;30s is separate. Criterion 3 only requires that notification **arrived** after the push, not sub-30s.

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

### Cycle 2 — PENDING (planned, after Cycle 1 PASS)

| Field | Value |
|-------|--------|
| data/ora | _pending_ |
| repo | `mrhz1973/dev-method` |
| handoff source | _pending — distinct task from Cycle 1_ |
| implementer | _pending_ |
| commit hash | _pending_ |
| Telegram notification | _pending — expected via v4 polling after push_ |
| esito | **PENDING** (not PASS) |
| note | Second cycle on **dev-method** — must differ from Cycle 1 repo/task. **Never** use control-plane as cycle target. |

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

## Cycle 1 execution prompt source

**Purpose:** Copy-paste prompt for **Cursor GIS verde** in a **future** session. **Do not execute** this prompt from control-plane docs-only work.

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

**Current tracker status:** **1 / 3 PASS** — Cycle 1 **PASS** on `cursor-coordinate-converter` (commit `34d543d`); Cycles 2–3 open; criterion 3 **not** fully closed.

---

## Docs-only path (now)

| Action | Status |
|--------|--------|
| Define valid / invalid cycle | Done in this file |
| Pre-fill cycle log template | Done — Cycle 1 **PASS**; Cycles 2–3 **PENDING** |
| Cycle 1 (GIS T1.3) | **PASS** 2026-05-20 — commit `34d543d`, v4 Telegram |
| Execute Cycles 2–3 | **Pending** — separate runtime gates |
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

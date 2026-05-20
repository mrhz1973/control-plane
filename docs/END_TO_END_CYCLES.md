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

### Cycle 1 — PENDING (planned)

| Field | Value |
|-------|--------|
| data/ora | _pending_ |
| repo | `mrhz1973/dev-method` |
| handoff source | _pending_ |
| implementer | _pending_ |
| commit hash | _pending_ |
| Telegram notification | _pending — expected via v4 polling after push_ |
| esito | **PENDING** (not PASS) |
| note | First real cycle on **dev-method**: handoff → implementer → push → Telegram via v4. |

### Cycle 2 — PENDING (planned)

| Field | Value |
|-------|--------|
| data/ora | _pending_ |
| repo | `mrhz1973/cursor-coordinate-converter` |
| handoff source | _pending_ |
| implementer | _pending_ |
| commit hash | _pending_ |
| Telegram notification | _pending — expected via v4 polling_ |
| esito | **PENDING** (not PASS) |
| note | Second cycle on **GIS** (frozen) — only if a real authorized task exists; otherwise use **dev-method** with a distinct task. Must differ from Cycle 1 repo. **Never** use control-plane. **2026-05-20:** local CLI dry-run produced `Prompt ready: yes` for GIS T1.3 task — **does not count** as cycle PASS (no implementer → commit → notifica); may seed future Cycle 2 when task is executed. |

### Cycle 3 — PENDING (planned)

| Field | Value |
|-------|--------|
| data/ora | _pending_ |
| repo | `mrhz1973/dev-method` |
| handoff source | _pending — `handoff-generate.mjs` via n8n manual when criterion 2 runtime tested; expect `Prompt ready: yes/no` on Telegram_ |
| implementer | _pending_ |
| commit hash | _pending_ |
| Telegram notification | _pending — `Prompt ready: yes/no` plus commit notification via v4 if applicable_ |
| esito | **PENDING** (not PASS) |
| note | Handoff-generate / criterion 2 validation cycle: full pipeline handoff → implementer → commit → notifica. |

---

## Closure rule

**Criterion 3 is closed** when:

1. Cycles 1, 2, and 3 above each have **esito: PASS**;
2. All four steps are evidenced for each;
3. At least **two different repos** or **two clearly distinct tasks** are recommended (not mandatory in MVP text, but avoids three copies of the same trivial change);
4. No token, chat_id, webhook URL, or secret appears in committed records;
5. [MVP_CRITERIA.md](MVP_CRITERIA.md) §3 status updated to **PASS** after review.

**Current tracker status:** 0 / 3 PASS — criterion open.

---

## Docs-only path (now)

| Action | Status |
|--------|--------|
| Define valid / invalid cycle | Done in this file |
| Pre-fill cycle log template | Done — three **PENDING** planned cycles (not PASS) |
| Execute real cycles | **Not in this task** |
| Close criterion 3 | **PENDING** |

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

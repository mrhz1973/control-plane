# v4 polling latency (criterion 1 measurement)

**Docs-only plan.** This document defines how to measure push→Telegram latency with v4 polling. It does **not** run commits, n8n, or record secrets.

**Related:** [MVP_CRITERIA.md](MVP_CRITERIA.md) §1, [MVP_STATUS.md](MVP_STATUS.md), [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md), [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md).

---

## v4 schedule interval

| Source | Value |
|--------|--------|
| Committed redacted export | **1 minute** (`minutesInterval: 1` on Schedule Trigger) |
| Runtime n8n UI | **Pending exact UI check** — confirm in Schedule Trigger node when running measurement gate |

**Expected worst-case latency** (polling only, no webhook):

```text
worst_case ≈ schedule interval (e.g. ~60s if interval is 1 minute)
```

Average case is roughly half the interval if poll timing is uniform. v4 **cannot guarantee** sub-30s without webhook or faster trigger.

---

## Criterion 1 grading (with v4)

| Grade | Condition |
|-------|-----------|
| **PASS** (strict) | Measured push→Telegram ≤ **30 seconds** on watched repo (`dev-method` or `cursor-coordinate-converter`) |
| **PARTIAL** | Notifications arrive reliably via v4 but measured latency **> 30s** (expected with 1-minute polling) |
| **FAIL** | Latency **> 60s** consistently, duplicate Telegram spam, or no notification after push |

Current documented state: **PARTIAL** — accepted as operational exception (**D-C1-A**, 2026-05-21); SLA 1–5 min via v4. Strict sub-30s measurement / webhook path = **post-MVP optional** only ([decision packet](decision-packets/2026-05-21-criterion-1-latency-closure-decision.md)).

---

## Measurement plan (runtime gate — not docs-only)

Run **3 test commits** on a watched product repo. Record timestamps only — **no token, no chat_id**.

### Per test

| Step | Record |
|------|--------|
| 1 | Note **T_push** — GitHub commit timestamp (UTC) from commit page or `git log -1 --format=%cI` after push |
| 2 | Wait for Telegram on phone |
| 3 | Note **T_telegram** — local time when message received (same timezone as T_push or convert to UTC) |
| 4 | Compute **Δ = T_telegram − T_push** (seconds) |
| 5 | Confirm **single** Telegram (no duplicate within observation window) |

### Log template (commit to this file or local notes)

```markdown
### Latency test N — PENDING

| Field | Value |
|-------|--------|
| repo | mrhz1973/dev-method OR mrhz1973/cursor-coordinate-converter |
| commit hash | (short SHA) |
| T_push (UTC) | |
| T_telegram (UTC) | |
| delta_seconds | |
| duplicates | none / yes |
| grade | PASS / PARTIAL / FAIL |
| notification path | v4 polling |
```

### After 3 tests

| Result | Action |
|--------|--------|
| All Δ ≤ 30s | Update [MVP_CRITERIA.md](MVP_CRITERIA.md) §1 toward **PASS** (strict) |
| All Δ > 30s but ≤ 60s, no spam | Keep **PARTIAL**; document measured range; consider [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) if strict PASS required |
| Any Δ > 60s or spam | **FAIL** — debug v4 schedule, dedupe, GitHub read before new workflows |

---

## What NOT to record in git

- Bot token, chat_id, webhook URL, webhook secret
- n8n credential IDs
- Screenshots with secrets

---

## Relation to criterion 3

Criterion 3 requires notifica **after** push, not sub-30s. Latency tests here serve **criterion 1** only. A cycle can PASS criterion 3 while criterion 1 stays PARTIAL under v4 polling.

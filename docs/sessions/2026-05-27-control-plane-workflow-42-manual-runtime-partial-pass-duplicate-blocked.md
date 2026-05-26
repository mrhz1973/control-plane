# Workflow 42 manual runtime partial PASS — duplicate blocked

**Date:** 2026-05-27  
**Repo:** `mrhz1973/control-plane`  
**Machine:** PC casa / Ryzen (operator n8n UI)  
**Workflow:** 42 — diff-summary Telegram MVP

---

## Result summary

| Check | Result |
|-------|--------|
| GitHub API list (latest commit) | **PASS** |
| Commit detail / files extraction | **PASS** |
| Telegram send | **PASS** |
| Duplicate prevention | **FAIL / BLOCKED** |
| Schedule activation | **NOT authorized** |

---

## Telegram evidence (sanitized)

Observed message content (no secrets):

| Field | Value |
|-------|--------|
| Repo | `cursor-coordinate-converter` |
| Commit | `58c5c46` |
| Message | `docs: final retest handoff safe text file attachment` |
| File | `docs/control-plane-watch-test.md` |
| URL | `https://github.com/mrhz1973/cursor-coordinate-converter/commit/58c5c4650772d21ffd6e8edacf2c536ffd4a4bf0` |

**Problem:** Multiple duplicate Telegram messages for the **same** commit SHA (including around 00:19 and 00:20), indicating schedule and/or dedupe race while workflow was active.

---

## Containment

| Action | Status |
|--------|--------|
| Workflow 42 deactivated by operator | Yes |
| Further execute authorized | **No** |
| Re-import updated template from GitHub | Required before next manual test |

---

## Root cause (hypothesis)

1. Schedule Trigger was connected and workflow was **active** after publish — polling every 120 s.
2. Dedupe read state at workflow start (`Load all`) could be stale vs concurrent runs.
3. Upsert may have lagged behind Telegram on overlapping executions.

Template fix in Git: schedule **disabled + disconnected**; dedupe uses **per-key GET** immediately before branch; upsert **only after** Telegram success node.

---

## Gates still closed

| Gate | Status |
|------|--------|
| Activation (schedule + workflow active) | **Blocked** |
| Workflow 40 mutation | **Forbidden** |
| Workflow 41 mutation | **Forbidden** |
| PAT GitHub | **Gated** |
| New Telegram bot/chat | **Forbidden** |
| PM-34 unlock | **Gated** |
| Provider API | **Forbidden** |

---

## Next step

1. Verify GitHub commit with updated template + this session.
2. Operator **re-import** template in n8n UI (do not activate).
3. **Single** manual test via Manual Trigger only — expect **one** Telegram per SHA.
4. Only after dedupe manual PASS + explicit gate: enable Schedule node, reconnect, activate.

**Do not** declare Diff summary ATTIVO in `PROJECT_VISION.md` until activation gate and dedupe PASS.

---

## Attestations (this session record task)

| Check | Result |
|-------|--------|
| Cursor opened n8n UI/API | No |
| Cursor modified wf40/wf41 exports | No |
| Secrets committed | No |

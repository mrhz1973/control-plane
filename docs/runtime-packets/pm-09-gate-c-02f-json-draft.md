# PM-09 Gate C — 02F JSON draft (first edit import candidate)

**Status:** File-only draft — **not imported**, **not executed**, VPS **02F unchanged**.

**Related:** [pm-09-gate-c-extend-02f-plan-watcher.md](pm-09-gate-c-extend-02f-plan-watcher.md), [pm-09-gate-c-02f-first-edit-plan.md](pm-09-gate-c-02f-first-edit-plan.md), [WORKFLOW_EXPORT_STATUS.md](../WORKFLOW_EXPORT_STATUS.md).

---

## Draft path

```text
workflows/exports/2026-05-21_02f-plan-watcher-first-if-draft.redacted.json
```

**Workflow name in JSON:**

```text
02F - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT + PLAN WATCHER FIRST IF DRAFT
```

**Source (unchanged canonical):**

```text
workflows/exports/2026-05-21_github-commit-datatable-dedupe-scheduled-v4-multirepo-02f-handoff-safe-text.redacted.json
```

---

## Purpose

Deliver a **redacted, importable n8n JSON** for PM-09 Gate C **first edit** per user/orchestrator preference (JSON-first over manual node-by-node UI build).

---

## What it adds

| Item | Detail |
|------|--------|
| **New node** | `Code - Plan watcher repo gate stub` |
| **Type** | Code node (import-safe; no fragile IF typeVersion mismatch) |
| **Logic** | If `ownerRepo` or `sourceRepo` is `mrhz1973/control-plane` → `event: plan_branch_entered`; else `plan_branch_skipped` |
| **Connection** | From **`IF - New commit?`** **true** branch (parallel with GIS handoff + commit notify) |
| **Output** | Stub JSON only — **no Telegram**, no GitHub fetch, no Gate D |
| **active** | `false` in committed file |

---

## What it does NOT add

- Telegram Send nodes or Gate D wiring
- GitHub commit-files / plan path filter / front-matter parse / dedupe / `plan_detected` (later gates)
- Changes to GIS handoff branch
- Changes to commit notify or duplicate-skip branches
- Schedule changes
- v5 / webhook
- Runtime import or Execute

---

## Why JSON-first (vs manual UI edit)

- Reproducible diff from canonical **02F** export
- Reviewable in GitHub before n8n touch
- Matches documented [JSON delivery preference](pm-09-gate-c-extend-02f-plan-watcher.md#operational-preference--n8n-json-delivery-user-2026-05-21)
- Code stub avoids broken IF import edge cases while preserving repo-gate behavior

---

## Future import gate (manual — separate session)

**Preferred:** n8n **Import from URL** using the [raw GitHub URL](#raw-github-url-import) below — not manual file download/upload.

1. Open n8n UI (explicit runtime gate only).
2. **Import from URL** with raw `raw.githubusercontent.com` link — or compare locally — do **not** overwrite production **02F** without review.
3. **Do not Execute** in the same step as import.
4. **Do not send Telegram** — Gate D not authorized.
5. Verify:
   - All **18 original** nodes present
   - **19th** node `Code - Plan watcher repo gate stub` present
   - Connected from **`IF - New commit?`** true output (3 parallel targets)
   - Stub has **no** outgoing connection to Telegram
   - GIS / commit notify / duplicate skip unchanged
6. Re-link credentials / chat_id in UI only (never commit).
7. **Save** only after visual PASS — then optional Manual Trigger in a **next** gate (still no Telegram expectation on stub path).

---

## Raw GitHub URL import

When this draft is committed on **`main`**, prefer **Import from URL** in n8n over manual file download/upload.

| Field | Value |
|-------|--------|
| **Repo path** | `workflows/exports/2026-05-21_02f-plan-watcher-first-if-draft.redacted.json` |
| **Raw URL (use this in n8n)** | `https://raw.githubusercontent.com/mrhz1973/control-plane/main/workflows/exports/2026-05-21_02f-plan-watcher-first-if-draft.redacted.json` |
| **Do not use** | GitHub blob/HTML page URL (e.g. `github.com/.../blob/main/...`) — n8n needs **raw** JSON |

**Rules:**

- **Import from URL** only in an **explicit runtime gate** — this doc does not authorize import.
- Import does **not** authorize **Execute**, **Save** over production **02F**, workflow **activation**, or **Telegram**.
- After import: review nodes/connections → re-link credentials/chat_id in UI → **Save** only in a separate deliberate step.

**Future exports:** same pattern — orchestrator provides `https://raw.githubusercontent.com/mrhz1973/control-plane/<branch>/workflows/exports/<file>.redacted.json`.

---

## Rollback

| Method | When |
|--------|------|
| Do not import draft | Default — production **02F** untouched |
| Delete imported draft workflow in n8n | If imported to wrong slot |
| Re-import canonical **02F** redacted export | If production workflow accidentally replaced |

---

## STOP criteria

- Import would replace active **02F** without inactive copy first
- Draft connects stub to any Telegram node
- GIS or commit notify connections missing after import
- Real chat_id or credential ID appears in exported copy
- User has not authorized import gate

---

## This task did not touch runtime

- No n8n UI Save / Import / Execute
- No Telegram API
- No SSH / Docker / VPS
- Production **02F** on VPS **unchanged**
- Only **new** draft file added under `workflows/exports/`; canonical **02F** export **not overwritten**

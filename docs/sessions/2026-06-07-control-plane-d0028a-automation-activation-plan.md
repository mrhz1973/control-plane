# Session — D-0028-A automation activation plan (docs-only)

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-07  
**Type:** Docs-only. **No runtime by Cursor.** **No n8n.**

---

## 1. Decision

- **D-0028-A Option 2** — progressive automation activation **plan** committed.
- **D-0028-A Option 4** (controlled activation execution) remains a **separate future gate** — **not started** by this task.

## 2. Deliverable

- `docs/runtime/AUTOMATION_ACTIVATION_PLAN.md` — Gates A–F, rollback/kill-switch, Option 4 prerequisites.
- `docs/runtime/CURRENT_FRONTIER.md` updated — plan pointer; next gate not auto-started.

## 3. Boundaries

- No new workflow. No workflow JSON/export changes.
- No n8n import/export/execute. No Telegram send. No VPS changes.
- **PM-34 BLOCKED.** **`n8n_ready=false`**. Pezzi collegati ≠ loop avviato.

## 4. Conclusion

**D-0028-A Option 2 = PASS** (docs-only plan on `main`). Next step: explicit choice of Gate A readiness audit or future Option 4 — operator decision required.

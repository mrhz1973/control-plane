# Wf registration prompt (copy/paste after future Wf live gate)

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/runtime/WF_TELEGRAM_INBOUND_POLLING_REGISTRATION_PROMPT.md`  
**Purpose:** After physical Wf live test of Telegram inbound polling/getUpdates, paste the matching branch into Cursor **CONTROL PLANE**. Docs-only, two-commit rolling report.

> CONTROL PLANE only. Docs-only. No runtime. Fill evidence from `docs/workflow-wf-telegram-inbound-polling-getupdates.md`.

---

## Branch A — Wf live PASS

```
You are working in the current Cursor workspace. Before editing, verify that this is the correct repository and branch.

This task target is:
mrhz1973/control-plane

Task:
Record Wf live PASS — Telegram inbound polling/getUpdates Decision Packet response handling, attested by user.

Task type:
Docs-only. No runtime.

Start with safe local repository update and preflight:

git fetch --prune origin
git status --short
git branch --show-current
git remote -v
git pull --ff-only origin main
git ls-remote origin main
git rev-parse HEAD
git rev-parse origin/main
git log --oneline -8

Do not hardcode an expected origin/main hash. Use freshly fetched git ls-remote origin main and git rev-parse origin/main as source of truth.
If the repo is not mrhz1973/control-plane, stop and report.
If the branch is not main, stop and report.
If git status shows unexpected local changes before pull, stop and report.
If pull is rejected or non-fast-forward, stop and report.
Do not reset, clean, stash, force pull, or force push.

Read before editing:
- docs/runtime/CURRENT_FRONTIER.md
- docs/runtime/LAST_CURSOR_REPORT.md
- docs/workflow-wf-telegram-inbound-polling-getupdates.md

Update docs/runtime/CURRENT_FRONTIER.md in the real commit:
1. Update latest line to: 2026-MM-DD — Wf Telegram inbound polling/getUpdates live PASS
2. Under "## PASS confermati (con prova)" add:
   - Wf Telegram inbound polling/getUpdates: PASS ATTESTATO UTENTE — evidence: getUpdates success; update_id offset handled; decision_id parsed; selected option 1/2/3 parsed; duplicate/stale guard result; sanitized receipt; optional note absent/present as attested; workflow inactive/off or schedule activation gate explicitly documented; no PM-34; no workflow 40/41 mutation; no GitHub write by workflow; no production Data Table mutation; no secrets/token/chat_id/credential/webhook/API key/CoT.
3. Recalibrate next gate:
   - Prossimo gate reale: decide whether to harden polling state persistence/idempotency or connect inbound choice to Decision Packet state. PM-34 remains blocked unless separately decided.
4. Preserve: We live BLOCKED/PENDING on HTTPS webhook unless separately resolved; operational automation NOT RUN unless explicitly decided; PM-34 BLOCCATO; full chain NOT RUN; inbound activation only as attested.

Optional session file: docs/sessions/2026-MM-DD-control-plane-wf-telegram-inbound-polling-live-pass.md

Allowed edit paths:
- docs/runtime/CURRENT_FRONTIER.md
- docs/sessions/2026-MM-DD-control-plane-wf-telegram-inbound-polling-live-pass.md
- docs/runtime/LAST_CURSOR_REPORT.md only for commit 2

Forbidden:
- Do not modify code, tests, workflows, or exports.
- Do not run n8n, send Telegram, poll getUpdates, deleteWebhook, or unlock PM-34.
- Do not add secrets. Do not use git add . Do not force push.

Commit 1: docs: record Wf Telegram inbound polling live PASS
git push origin main

Update LAST_CURSOR_REPORT.md (LATEST.real_task_commit = commit 1 SHA).
Commit 2: docs: update rolling Cursor report
git push origin main
```

---

## Branch B — Wf live BLOCKED / PENDING

```
You are working in the current Cursor workspace. Before editing, verify that this is the correct repository and branch.

This task target is:
mrhz1973/control-plane

Task:
Record Wf live BLOCKED/PENDING — Telegram inbound polling/getUpdates test did not pass.

Task type:
Docs-only. No runtime.

Start with safe local repository update and preflight (same as Branch A).

Read before editing:
- docs/runtime/CURRENT_FRONTIER.md
- docs/runtime/LAST_CURSOR_REPORT.md
- docs/workflow-wf-telegram-inbound-polling-getupdates.md

Update docs/runtime/CURRENT_FRONTIER.md:
1. Update latest line to: 2026-MM-DD — Wf Telegram inbound polling/getUpdates live BLOCKED/PENDING
2. Under frontiera: Wf live BLOCKED/PENDING — include user-attested blocker reason (e.g. webhook still set; token not configured; getUpdates error; malformed response; missing guards; sensitive data leak; unexpected activation).
3. Do NOT mark Wf live PASS. Preserve: Telegram inbound replies / decision buttons NOT RUN / NOT ACTIVE unless separately attested; PM-34 BLOCCATO; operational automation NOT RUN; full chain NOT RUN; We live BLOCKED/PENDING unchanged unless user evidence says otherwise.

Optional session file: docs/sessions/2026-MM-DD-control-plane-wf-telegram-inbound-polling-live-blocked.md

Allowed edit paths:
- docs/runtime/CURRENT_FRONTIER.md
- docs/sessions/2026-MM-DD-control-plane-wf-telegram-inbound-polling-live-blocked.md
- docs/runtime/LAST_CURSOR_REPORT.md only for commit 2

Forbidden:
- Do not mark PASS. Do not modify workflows/exports. Do not run n8n or Telegram. Do not unlock PM-34. Do not add secrets.

Commit 1: docs: record Wf Telegram inbound polling live BLOCKED
git push origin main

Update LAST_CURSOR_REPORT.md (LATEST.real_task_commit = commit 1 SHA).
Commit 2: docs: update rolling Cursor report
git push origin main
```

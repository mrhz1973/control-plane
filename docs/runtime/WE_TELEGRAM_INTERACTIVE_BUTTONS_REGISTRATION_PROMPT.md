# We registration prompt (copy/paste after future We live gate)

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/runtime/WE_TELEGRAM_INTERACTIVE_BUTTONS_REGISTRATION_PROMPT.md`  
**Purpose:** After physical We live test of inbound Telegram decision buttons, paste the matching branch into Cursor **CONTROL PLANE**. Docs-only, two-commit rolling report.

> CONTROL PLANE only. Docs-only. No runtime. Fill evidence from `docs/workflow-we-telegram-interactive-decision-buttons.md`.

---

## Branch A — We live PASS

```
You are working in the current Cursor workspace. Before editing, verify that this is the correct repository and branch.

This task target is:
mrhz1973/control-plane

Task:
Record We live PASS — Telegram interactive decision buttons / inbound response handling, attested by user.

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
- docs/workflow-we-telegram-interactive-decision-buttons.md

Update docs/runtime/CURRENT_FRONTIER.md in the real commit:
1. Update latest line to: 2026-MM-DD — We Telegram interactive decision buttons live PASS
2. Under "## PASS confermati (con prova)" add:
   - We Telegram interactive decision buttons / inbound response handling: PASS ATTESTATO UTENTE — evidence: decision_id parsed; selected option 1/2/3 parsed; callback_data format validated; duplicate/stale guard result recorded; sanitized receipt; optional note absent/present as attested; workflow inactive/off or activation gate documented; no PM-34; no workflow 40/41 mutation; no GitHub write by workflow; no secrets/token/chat_id/credential/webhook/API key/CoT.
3. Recalibrate next gate:
   - Prossimo gate reale: decide whether to integrate inbound choice with Decision Packet state persistence/idempotency hardening, or separate operational wiring. PM-34 remains blocked unless separately decided.
4. Preserve operational automation NOT RUN unless explicitly decided; PM-34 BLOCCATO; full chain NOT RUN.

Optional session file: docs/sessions/2026-MM-DD-control-plane-we-telegram-interactive-buttons-live-pass.md

Allowed edit paths:
- docs/runtime/CURRENT_FRONTIER.md
- docs/sessions/2026-MM-DD-control-plane-we-telegram-interactive-buttons-live-pass.md
- docs/runtime/LAST_CURSOR_REPORT.md only for commit 2

Forbidden:
- Do not modify code, tests, workflows, or exports.
- Do not run n8n, send Telegram, or unlock PM-34.
- Do not add secrets. Do not use git add . Do not force push.

Commit 1: docs: record We Telegram interactive buttons live PASS
git push origin main

Update LAST_CURSOR_REPORT.md (LATEST.real_task_commit = commit 1 SHA).
Commit 2: docs: update rolling Cursor report
git push origin main
```

---

## Branch B — We live BLOCKED / PENDING

```
You are working in the current Cursor workspace. Before editing, verify that this is the correct repository and branch.

This task target is:
mrhz1973/control-plane

Task:
Record We live BLOCKED/PENDING — Telegram interactive decision buttons inbound test did not pass.

Task type:
Docs-only. No runtime.

Start with safe local repository update and preflight (same as Branch A).

Read before editing:
- docs/runtime/CURRENT_FRONTIER.md
- docs/runtime/LAST_CURSOR_REPORT.md
- docs/workflow-we-telegram-interactive-decision-buttons.md

Update docs/runtime/CURRENT_FRONTIER.md:
1. Latest line: 2026-MM-DD — We Telegram interactive buttons live BLOCKED/PENDING
2. Record blocker; do NOT mark PASS.
3. Preserve: inbound NOT ACTIVE until resolved; PM-34 BLOCCATO; operational automation NOT RUN.

Optional session: docs/sessions/2026-MM-DD-control-plane-we-telegram-interactive-buttons-live-blocked.md

Allowed paths: CURRENT_FRONTIER, sessions, LAST_CURSOR_REPORT commit 2 only.

Commit 1: docs: record We Telegram interactive buttons live BLOCKED
Commit 2: docs: update rolling Cursor report
git push origin main
```

---

## Notes

- Branch A records PASS with user evidence only.
- Branch B preserves inbound NOT ACTIVE until explicitly resolved.

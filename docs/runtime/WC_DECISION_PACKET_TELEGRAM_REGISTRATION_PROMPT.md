# Wc registration prompt (copy/paste for a future Cursor task)

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/runtime/WC_DECISION_PACKET_TELEGRAM_REGISTRATION_PROMPT.md`  
**Purpose:** After the user **physically runs** Wc (manual n8n → Decision Packet Telegram automatic/cablato), paste the matching branch below into Cursor **CONTROL PLANE** to record the result. Docs-only, two-commit rolling report pattern.

> Window: Cursor **CONTROL PLANE** only. Not GIS. Not DEV. Docs-only. No runtime.  
> Fill `<...>` evidence placeholders from sanitized execution evidence (per `docs/workflow-wc-decision-packet-telegram.md` §8) before pasting.

---

## Branch A — Wc PASS

```
You are working in the current Cursor workspace. Before editing, verify that this is the correct repository and branch.

This task target is:
mrhz1973/control-plane

Task:
Record Wc PASS — Decision Packet Telegram automatic/cablato manual single execution, attested by user.

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
- docs/workflow-wc-decision-packet-telegram.md
- docs/foundation/DECISION_PACKET_FORMAT.md

Update docs/runtime/CURRENT_FRONTIER.md in the real commit:
1. Update latest line to: 2026-MM-DD — Wc Decision Packet Telegram automatic/cablato manual single execution PASS
2. Under "## PASS confermati (con prova)" add:
   - Wc Decision Packet Telegram automatic/cablato manual single execution: PASS ATTESTATO UTENTE — evidence: one Telegram message sent; workflow inactive after run; message matches DECISION_PACKET_FORMAT.md; TEST ONLY marked; 2-5 numbered options; Scrivi: 1 / 2 / 3; no secrets/token/chat_id/credential/webhook/API key/CoT; no workflow 40/41 mutation; no Data Table mutation; no GitHub write; no PM-34 unlock.
3. Recalibrate next gate (separate, not decided here unless explicitly specified):
   - Prossimo gate reale: integration design from live classifier-server response to operational Decision Packets, or PM-34-adjacent gate only if explicitly decided later.
4. Preserve:
   - Catena completa AUTOMATIZZATA: NOT RUN.
   - PM-34: BLOCCATO.
   - Ollama classifier not fully ATTIVO in automatic loop.
   - Asset n8n existing block unchanged.

Optional session file: docs/sessions/2026-MM-DD-control-plane-wc-decision-packet-telegram-pass.md

Allowed edit paths:
- docs/runtime/CURRENT_FRONTIER.md
- docs/sessions/2026-MM-DD-control-plane-wc-decision-packet-telegram-pass.md
- docs/runtime/LAST_CURSOR_REPORT.md only for commit 2 rolling report

Forbidden:
- Do not modify code, tests, workflows, or workflow exports.
- Do not modify PROJECT_VISION.md or DECISION_PACKET_FORMAT.md.
- Do not run n8n runtime, import, export, or execute.
- Do not send Telegram. Do not unlock PM-34. Do not change pm34_unblocked or n8n_ready.
- Do not add secrets, token, chat_id, credential id, credential content, webhook URL, auth URL, provider API key, or env dump.
- Do not include chain-of-thought. Do not deploy, tag, rollback. Do not use git add . Do not force push.

Validation before commit 1:
git diff --check
git status --short
git diff -- docs/runtime/CURRENT_FRONTIER.md docs/sessions/2026-MM-DD-control-plane-wc-decision-packet-telegram-pass.md

Commit 1 (stage only changed files explicitly; do not use git add .):
docs: record Wc Decision Packet Telegram manual execution PASS
git push origin main

After commit 1 capture verbatim:
git ls-remote origin main
git log --oneline -5
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git show --stat HEAD

Then update docs/runtime/LAST_CURSOR_REPORT.md (rolling rule):
- LATEST.real_task_commit must be the commit 1 SHA (not the report-only commit).
- Commit 2 modifies only docs/runtime/LAST_CURSOR_REPORT.md.
Commit 2 message: docs: update rolling Cursor report
git push origin main

Final verification after commit 2 (include verbatim):
git ls-remote origin main
git log --oneline -8
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git show --stat HEAD
```

---

## Branch B — Wc BLOCKED / PENDING

```
You are working in the current Cursor workspace. Before editing, verify that this is the correct repository and branch.

This task target is:
mrhz1973/control-plane

Task:
Record Wc BLOCKED/PENDING — Decision Packet Telegram automatic/cablato execution did not pass; record blocker only, do not mark PASS.

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
- docs/workflow-wc-decision-packet-telegram.md

Update docs/runtime/CURRENT_FRONTIER.md in the real commit:
1. Update latest line to: 2026-MM-DD — Wc Decision Packet Telegram BLOCKED/PENDING (blocker registrato)
2. Under "## NON ripetere / bloccato" add:
   - Wc Decision Packet Telegram automatic/cablato manual single execution: BLOCKED/PENDING — blocker: <blocker reason from user evidence>. NON marcato PASS.
3. Preserve current frontier (do NOT mark Wc runtime PASS):
   - Prossimo gate reale (Wc physical): resta da rieseguire dall'utente dopo risoluzione blocker.
   - Telegram Decision Packet automatico/cablato runtime send: NOT RUN.
   - PM-34: BLOCCATO.
   - Ollama classifier not fully ATTIVO in loop.
   - Catena completa AUTOMATIZZATA: NOT RUN.
   - Asset n8n existing block unchanged.

Only record BLOCKED/PENDING if the user provided evidence. Do not mark PASS.

Optional session file: docs/sessions/2026-MM-DD-control-plane-wc-decision-packet-telegram-blocked.md

Allowed edit paths:
- docs/runtime/CURRENT_FRONTIER.md
- docs/sessions/2026-MM-DD-control-plane-wc-decision-packet-telegram-blocked.md
- docs/runtime/LAST_CURSOR_REPORT.md only for commit 2 rolling report

Forbidden:
- Do not modify code, tests, workflows, or workflow exports.
- Do not modify PROJECT_VISION.md or DECISION_PACKET_FORMAT.md.
- Do not run n8n runtime, import, export, or execute.
- Do not send Telegram. Do not unlock PM-34.
- Do not add secrets, token, chat_id, credential id, credential content, webhook URL, auth URL, provider API key, or env dump.
- Do not include chain-of-thought. Do not deploy, tag, rollback. Do not use git add . Do not force push.

Validation before commit 1:
git diff --check
git status --short
git diff -- docs/runtime/CURRENT_FRONTIER.md docs/sessions/2026-MM-DD-control-plane-wc-decision-packet-telegram-blocked.md

Commit 1 (stage only changed files explicitly; do not use git add .):
docs: record Wc Decision Packet Telegram execution BLOCKED
git push origin main

After commit 1 capture verbatim:
git ls-remote origin main
git log --oneline -5
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git show --stat HEAD

Then update docs/runtime/LAST_CURSOR_REPORT.md (rolling rule):
- LATEST.real_task_commit must be the commit 1 SHA (not the report-only commit).
- Commit 2 modifies only docs/runtime/LAST_CURSOR_REPORT.md.
Commit 2 message: docs: update rolling Cursor report
git push origin main

Final verification after commit 2 (include verbatim):
git ls-remote origin main
git log --oneline -8
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git show --stat HEAD
```

---

## Notes

- Both branches are docs-only, CONTROL PLANE only, with full git preflight and two-commit rolling report.
- Neither branch runs n8n, sends Telegram, or unlocks PM-34.
- Branch A records runtime PASS only with user-attested evidence; Branch B preserves automatic/cablato as NOT RUN until resolved.

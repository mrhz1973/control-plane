# Wb-live registration prompt (copy/paste for a future Cursor task)

**Repository:** `mrhz1973/control-plane`
**Document:** `docs/runtime/WB_LIVE_REGISTRATION_PROMPT.md`
**Purpose:** After the user **physically runs** Wb-live (manual n8n → classifier-server via
Tailscale), paste the matching branch below into Cursor **CONTROL PLANE** to record the
result. Docs-only, two-commit rolling report pattern.

> Window: Cursor **CONTROL PLANE** only. Not GIS. Not DEV. Docs-only. No runtime.
> Fill the `<...>` evidence placeholders from the user's sanitized execution evidence
> (per `docs/workflow-wb-live-classifier-server.md` §8) before pasting.

---

## Branch A — Wb-live PASS

```
You are working in the current Cursor workspace. Before editing, verify that this is the correct repository and branch.

This task target is:
mrhz1973/control-plane

Task:
Record Wb-live PASS — manual n8n -> classifier-server single execution via Tailscale, attested by user.

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
- docs/workflow-wb-live-classifier-server.md

Update docs/runtime/CURRENT_FRONTIER.md in the real commit:
1. Update latest line to: 2026-MM-DD — Wb-live n8n -> classifier-server manual single execution via Tailscale PASS
2. Under "## PASS confermati (con prova)" add:
   - Wb-live n8n -> classifier-server manual single execution via Tailscale: PASS ATTESTATO UTENTE — evidence: HTTP 200; schema-valid classifier output (<risk>/<route>/requires_human=<bool>); no fallback; workflow inactive after run; no Telegram send; no workflow 40/41 mutation; no PM-34 unlock.
3. Recalibrate next gate (still separate):
   - Prossimo gate reale: design/import gate del Decision Packet Telegram automatico/cablato (ancora separato, non eseguito).
4. Preserve:
   - Telegram Decision Packet automatico/cablato: NOT RUN.
   - PM-34: BLOCCATO.
   - Ollama classifier not fully ATTIVO in loop.
   - Catena completa AUTOMATIZZATA: NOT RUN.
   - Asset n8n existing block unchanged.

Optional session file: docs/sessions/2026-MM-DD-control-plane-wb-live-pass.md (concise: evidence summary, attested by user, docs-only, no runtime).

Allowed edit paths:
- docs/runtime/CURRENT_FRONTIER.md
- docs/sessions/2026-MM-DD-control-plane-wb-live-pass.md
- docs/runtime/LAST_CURSOR_REPORT.md only for commit 2 rolling report

Forbidden:
- Do not modify code, tests, workflows, or workflow exports.
- Do not modify PROJECT_VISION.md or DECISION_PACKET_FORMAT.md.
- Do not run n8n runtime, import, export, or execute.
- Do not start the classifier server or call Ollama.
- Do not send Telegram. Do not create or send a real Decision Packet.
- Do not unlock PM-34. Do not change pm34_unblocked or n8n_ready.
- Do not add secrets, token, chat_id, credential id, credential content, webhook URL, auth URL, provider API key, or env dump.
- Do not include chain-of-thought. Do not deploy, tag, rollback. Do not use git add . Do not force push.

Validation before commit 1:
git diff --check
git status --short
git diff -- docs/runtime/CURRENT_FRONTIER.md docs/sessions/2026-MM-DD-control-plane-wb-live-pass.md

Commit 1 (stage only changed files explicitly; do not use git add .):
docs: record Wb-live classifier-server manual execution PASS
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

## Branch B — Wb-live BLOCKED / PENDING

```
You are working in the current Cursor workspace. Before editing, verify that this is the correct repository and branch.

This task target is:
mrhz1973/control-plane

Task:
Record Wb-live BLOCKED/PENDING — manual n8n -> classifier-server execution did not pass; record blocker only, do not mark PASS.

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
- docs/workflow-wb-live-classifier-server.md

Update docs/runtime/CURRENT_FRONTIER.md in the real commit:
1. Update latest line to: 2026-MM-DD — Wb-live BLOCKED/PENDING (blocker registrato)
2. Under "## NON ripetere / bloccato" add:
   - Wb-live n8n -> classifier-server manual single execution: BLOCKED/PENDING — blocker: <blocker reason from user evidence>. NON marcato PASS.
3. Preserve current frontier (do NOT mark Wb-live PASS):
   - Prossimo gate reale (Wb-live physical): resta da rieseguire dall'utente dopo risoluzione blocker.
   - n8n runtime/wiring to classifier wrapper/server: NOT RUN.
   - Telegram Decision Packet automatico/cablato: NOT RUN.
   - PM-34: BLOCCATO.
   - Ollama classifier not fully ATTIVO in loop.
   - Catena completa AUTOMATIZZATA: NOT RUN.
   - Asset n8n existing block unchanged.

Only record BLOCKED/PENDING if the user provided evidence. Do not mark PASS.

Optional session file: docs/sessions/2026-MM-DD-control-plane-wb-live-blocked.md (concise: blocker reason, docs-only, no runtime).

Allowed edit paths:
- docs/runtime/CURRENT_FRONTIER.md
- docs/sessions/2026-MM-DD-control-plane-wb-live-blocked.md
- docs/runtime/LAST_CURSOR_REPORT.md only for commit 2 rolling report

Forbidden:
- Do not modify code, tests, workflows, or workflow exports.
- Do not modify PROJECT_VISION.md or DECISION_PACKET_FORMAT.md.
- Do not run n8n runtime, import, export, or execute.
- Do not start the classifier server or call Ollama.
- Do not send Telegram. Do not create or send a real Decision Packet.
- Do not unlock PM-34. Do not change pm34_unblocked or n8n_ready.
- Do not add secrets, token, chat_id, credential id, credential content, webhook URL, auth URL, provider API key, or env dump.
- Do not include chain-of-thought. Do not deploy, tag, rollback. Do not use git add . Do not force push.

Validation before commit 1:
git diff --check
git status --short
git diff -- docs/runtime/CURRENT_FRONTIER.md docs/sessions/2026-MM-DD-control-plane-wb-live-blocked.md

Commit 1 (stage only changed files explicitly; do not use git add .):
docs: record Wb-live classifier-server execution BLOCKED
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

- Both branches are **docs-only**, Cursor CONTROL PLANE only, with full git preflight and the
  two-commit rolling report pattern.
- Neither branch runs runtime, imports/executes n8n, starts the server, calls Ollama, or sends
  Telegram. No secrets / token / `chat_id`.
- Branch A records PASS only with user-attested runtime evidence; Branch B records BLOCKED/PENDING
  and preserves the current frontier (PM-34 remains BLOCCATO; automatic Telegram and n8n wiring
  remain NOT RUN).

# Wd registration prompt (copy/paste after gate B live)

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/runtime/WD_OPERATIONAL_DECISION_PACKET_REGISTRATION_PROMPT.md`  
**Purpose:** After the user **physically runs** Wd gate B live (classifier-server → operational-style Decision Packet Telegram TEST ONLY), paste the matching branch into Cursor **CONTROL PLANE**. Docs-only, two-commit rolling report pattern.

> Window: Cursor **CONTROL PLANE** only. Not GIS. Not DEV. Docs-only. No runtime.  
> Fill evidence from sanitized execution per `docs/workflow-wd-operational-decision-packet-integration.md` §7.

---

## Branch A — Wd B live PASS

```
You are working in the current Cursor workspace. Before editing, verify that this is the correct repository and branch.

This task target is:
mrhz1973/control-plane

Task:
Record Wd B live PASS — operational-style Decision Packet integration manual single execution, attested by user.

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
- docs/workflow-wd-operational-decision-packet-integration.md
- docs/foundation/DECISION_PACKET_FORMAT.md

Update docs/runtime/CURRENT_FRONTIER.md in the real commit:
1. Update latest line to: 2026-MM-DD — Wd operational-style Decision Packet integration B live PASS
2. Under "## PASS confermati (con prova)" add:
   - Wd operational-style Decision Packet integration manual single execution: PASS ATTESTATO UTENTE — evidence: classifier-server HTTP success; schema-valid classifier output; Telegram send ok (message_id <id>); TEST ONLY operational-style message; ID D-9998-T; event_id/human_gate/requires_human rendered literally; workflow inactive/off; no workflow 40/41 mutation; no Data Table mutation; no GitHub write by workflow; no PM-34 unlock/touch; no secrets/token/chat_id/credential/webhook/API key/CoT.
3. Recalibrate next gate:
   - Prossimo gate reale: decide whether to harden/idempotency/guard the Wd path or proceed to a separate operational wiring gate. PM-34 remains blocked unless separately decided.
4. Preserve:
   - Telegram Decision Packet operational automation: NOT RUN (unless explicitly decided later).
   - n8n runtime/wiring automatic/cablato: NOT RUN.
   - Catena completa AUTOMATIZZATA: NOT RUN.
   - PM-34: BLOCCATO.
   - Asset n8n existing block unchanged.

Optional session file: docs/sessions/2026-MM-DD-control-plane-wd-operational-decision-packet-b-live-pass.md

Allowed edit paths:
- docs/runtime/CURRENT_FRONTIER.md
- docs/sessions/2026-MM-DD-control-plane-wd-operational-decision-packet-b-live-pass.md
- docs/runtime/LAST_CURSOR_REPORT.md only for commit 2 rolling report

Forbidden:
- Do not modify code, tests, workflows, or workflow exports.
- Do not run n8n, send Telegram, call classifier-server, or unlock PM-34.
- Do not add secrets, token, chat_id, credential id, webhook URL, auth URL, provider API key, or chain-of-thought.
- Do not use git add . Do not force push.

Commit 1: docs: record Wd operational Decision Packet B live PASS
git push origin main

Then update docs/runtime/LAST_CURSOR_REPORT.md (LATEST.real_task_commit = commit 1 SHA).
Commit 2: docs: update rolling Cursor report
git push origin main
```

---

## Branch B — Wd B live BLOCKED / PENDING

```
You are working in the current Cursor workspace. Before editing, verify that this is the correct repository and branch.

This task target is:
mrhz1973/control-plane

Task:
Record Wd B live BLOCKED/PENDING — operational-style Decision Packet integration did not pass; record blocker only.

Task type:
Docs-only. No runtime.

Start with safe local repository update and preflight (same as Branch A).

Read before editing:
- docs/runtime/CURRENT_FRONTIER.md
- docs/runtime/LAST_CURSOR_REPORT.md
- docs/workflow-wd-operational-decision-packet-integration.md

Update docs/runtime/CURRENT_FRONTIER.md in the real commit:
1. Update latest line to: 2026-MM-DD — Wd operational Decision Packet integration B live BLOCKED/PENDING
2. Under "## NON ripetere / bloccato" or frontier add:
   - Wd operational-style Decision Packet integration B live: BLOCKED/PENDING — blocker: <reason>. NON marcato PASS.
3. Preserve:
   - Prossimo gate reale (Wd B live): resta da rieseguire dopo risoluzione blocker.
   - Telegram Decision Packet operational automation: NOT RUN.
   - PM-34: BLOCCATO.
   - Catena completa AUTOMATIZZATA: NOT RUN.

Only record if user provided evidence. Do not mark PASS.

Allowed edit paths:
- docs/runtime/CURRENT_FRONTIER.md
- docs/sessions/2026-MM-DD-control-plane-wd-operational-decision-packet-b-live-blocked.md
- docs/runtime/LAST_CURSOR_REPORT.md only for commit 2

Forbidden: same as Branch A.

Commit 1: docs: record Wd operational Decision Packet B live BLOCKED
git push origin main

Commit 2: docs: update rolling Cursor report
git push origin main
```

---

## Notes

- Docs-only; no runtime, Telegram, classifier-server, or PM-34 unlock.
- Branch A records PASS with user evidence; Branch B preserves NOT RUN boundaries.

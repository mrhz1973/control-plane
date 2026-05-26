# Operator decision — n8n read-only runtime inspection

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/operator-decision-n8n-read-only-runtime-inspection.md`  
**Date:** 2026-05-26

## Status

- **DECISION PACKET ONLY**
- no runtime in this task
- no n8n UI / API / credential access in this task
- no VPS SSH in this task
- no workflow execution / import / export
- no workflow 40/41 mutation
- no PM-34 unlock
- no automation authorization

**Prerequisites:** [n8n read-only runtime gate packet](n8n-read-only-runtime-gate-packet.md) · [read-only preflight closeout](n8n-read-only-preflight-closeout.md) · [hardening](n8n-read-only-preflight-hardening.md)  
**Related:** [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md) · [evidence template](n8n-read-only-runtime-evidence-template.md) · [decision closeout](n8n-read-only-runtime-decision-closeout.md)

---

## Decision requested

The operator (human) must choose **one** option **outside** this packet — in chat, Decision Packet, or session note. **This document does not choose for the operator.**

| Option | Label | Summary |
|--------|-------|---------|
| **A** | Approve one read-only n8n inspection session | Single gated runtime: Tier A list metadata only |
| **B** | Defer n8n runtime; continue docs-only | No n8n touch; refine templates/checklists |
| **C** | Reject n8n runtime path for now | Pause VPS/n8n escalation; rely on GitHub/docs |

Record the choice in a future `docs/sessions/` entry when made. Until then, **default safe = B or C** (no runtime).

---

## Option A scope

**If the operator later approves A**, one session may run under [runtime gate packet](n8n-read-only-runtime-gate-packet.md) limits:

| Allowed (Tier A only) | Forbidden in same session |
|------------------------|---------------------------|
| Workflow id / name **list** (sanitized in git if needed) | Open workflow in **editor** |
| Active / inactive flag per row | **Execution** history / logs |
| Last updated timestamp (list metadata) | Workflow JSON **export** |
| Workflow count | **Credentials** panel or API |
| n8n version string (sanitized if needed) | **Payload send** to n8n |
| | Run / test / **execute** / trigger |
| | Activate / deactivate (40/41 or any) |
| | Telegram send / webhook test |

**Access path (operator must pick one when approving A):**

- UI — n8n **Workflows list** page only, or
- API — `GET` workflows list metadata only — **only if** explicitly named in approval

One session. No repeat without new approval.

---

## Option B scope

**If the operator chooses B (defer):**

| Continue | Do not |
|----------|--------|
| Refine evidence templates in docs | n8n login |
| Prepare operator checklists (docs-only) | VPS SSH for n8n |
| Update FOUNDATION_STATUS after docs work | Any Tier A observation |
| Local wrapper / payload contract evidence only | Open runtime gate |

Aligns with PC lavoro **docs-only** and Ryzen casa for future runtime when ready.

---

## Option C scope

**If the operator chooses C (reject path for now):**

| Keep | Pause |
|------|-------|
| Local wrapper evidence chain (PM-17…local integration) | n8n read-only runtime escalation |
| Payload contract + read-only preflight docs on paper | VPS inspection queue |
| GitHub as source of truth for workflow state | Operator pressure to “just peek” at n8n |

No regression on existing gates. Re-open decision only via new explicit packet.

---

## Explicit non-authorization

**This decision packet does not authorize:**

| Item | Status |
|------|--------|
| n8n login | **Not authorized** |
| n8n API call | **Not authorized** |
| VPS SSH | **Not authorized** |
| Workflow execution / import / export | **Forbidden** |
| Workflow 40/41 mutation | **Forbidden** |
| PM-34 unlock | **Forbidden** |
| Payload send to n8n | **Forbidden** |
| Credential access | **Forbidden** |
| Provider API key | **Forbidden** |
| Automation / unattended loop | **Forbidden** |
| Cursor/agent executing Option A without operator written approval | **Forbidden** |

Choosing **A** in a later message is **not** automatic execution — it requires a **separate runtime session** with evidence per gate packet.

---

## Evidence required if Option A is later approved

Future runtime session (`docs/sessions/YYYY-MM-DD-…-n8n-read-only-runtime-pass|fail.md`) must record:

| # | Evidence |
|---|----------|
| 1 | **Operator decision reference** — link to this packet + date of approval + option **A** |
| 2 | **Exact UI or API path** — e.g. “Workflows list only” (sanitized) |
| 3 | **Tier A fields observed** — table of flags/counts/version; placeholders for ids/names |
| 4 | **Credentials untouched** — `<NO_CREDENTIAL_ACCESS>` |
| 5 | **Executions untouched** — `<NO_EXECUTION_HISTORY_ACCESS>` |
| 6 | **Workflows untouched** — no save/publish/import/activate |
| 7 | **Payload not sent** — `<NO_PAYLOAD_SENT>` |
| 8 | **Sanitized evidence only** in git |
| 9 | **Git status before/after** if control-plane docs updated |

PASS/FAIL per [runtime gate packet](n8n-read-only-runtime-gate-packet.md). Use field structure from [evidence template](n8n-read-only-runtime-evidence-template.md).

---

## Recommended next step

**Operator selects A / B / C outside this packet**

No default selection by agents. After operator records choice:

| If | Then |
|----|------|
| **A** | Schedule separate runtime session; do not batch with other gates |
| **B** | Continue docs-only (e.g. evidence template refinement) |
| **C** | Update FOUNDATION_STATUS note “n8n read-only runtime deferred” in next docs commit |

---

## Remaining gates

| Gate | Status |
|------|--------|
| n8n read-only runtime execution | **Gated** — requires operator **A** + runtime session |
| Operator decision (A/B/C) | **Pending** — outside this packet |
| n8n execute / import / export | **Gated** |
| Workflow 40/41 mutation | **Gated** |
| PM-34 unlock | **Gated** |
| Provider API key | **Forbidden** |
| Payload send | **Gated** |
| OpenClaw `agent main` | **Forbidden** |
| `codex resume` | **Forbidden** |
| Codex repo mutation | **Forbidden** |
| Cursor worker automation | **Gated** |
| Deploy / tag / rollback | **Forbidden** |
| Unattended automation | **Forbidden** |

This decision packet does **NOT** open any gate above.

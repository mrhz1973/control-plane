# n8n read-only runtime gate packet

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/n8n-read-only-runtime-gate-packet.md`  
**Date:** 2026-05-26

## Status

- **GATE PACKET ONLY**
- no runtime in this task
- no n8n UI / API / credential access in this task
- no VPS SSH in this task
- no workflow execution / import / export
- no workflow activation / deactivation
- no workflow 40/41 mutation
- no PM-34 unlock
- no automation authorization

**Prerequisites:** [read-only preflight closeout](n8n-read-only-preflight-closeout.md) · [hardening](n8n-read-only-preflight-hardening.md) · [design packet](n8n-read-only-preflight-design-packet.md)  
**Related:** [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Purpose

The **read-only preflight paper phase is complete** ([closeout](n8n-read-only-preflight-closeout.md)): payload contract, synthetic examples, checklist, design, hardening, and closeout exist without touching n8n.

This document defines a **future explicit operator gate** — what a human may authorize in a **separate** session if they choose to open it.

| Principle | Rule |
|-----------|------|
| This packet | **Defines** the gate; **does not open** it |
| Execution | Requires **written operator approval** + new `docs/sessions/` runtime record |
| Cursor / agents | **Must not** execute this gate without that approval |
| Production | Workflow **`40` ACTIVE**, **`41` BACKUP OFF** — observation only, zero mutation |

---

## Future gate scope

**If and only if** an operator later **explicitly approves** this gate (separate decision), the runtime session may observe **Tier A list-level metadata only** per [hardening](n8n-read-only-preflight-hardening.md):

| Allowed observation | Form | Sanitization |
|---------------------|------|--------------|
| Workflow id / name **list** | List view row set | Use `<REDACTED_WORKFLOW_ID>` / `<REDACTED_WORKFLOW_NAME_IF_SENSITIVE>` in git |
| Active / inactive flag | Boolean per row | OK as boolean in session text |
| Last updated timestamp | Per-workflow metadata on list | ISO date OK; no execution ids |
| Workflow count | Integer | OK |
| n8n version string | About/banner text | `<REDACTED_N8N_VERSION_IF_NEEDED>` if host-identifying |

**Allowed access paths (when gate is opened — pick one per session, document in evidence):**

- n8n UI — **Workflows list page only** (no row click into editor)
- n8n API — `GET` workflows **list** metadata only — **only if** future operator gate explicitly allows API and documents endpoint

**This packet does not authorize any path until operator approval.**

---

## Still forbidden even if gate opens

The following remain **forbidden** during an approved read-only runtime session:

| Forbidden | Notes |
|-----------|--------|
| Credentials (read/mutation) | No credential panel, no credential API |
| Execution logs / history | No executions tab, no execution API |
| Workflow editor / node graph | Tier B — abort |
| Workflow JSON export | Tier C — abort |
| Data Tables | Contents excluded |
| Webhook URLs | No webhook test, no URL capture |
| Telegram config | No bot token, no chat_id |
| Payload send to n8n | No integration POST |
| Run / test / execute / trigger | Any side effect |
| Activate / deactivate workflow | Including 40/41 |
| Workflow 40/41 **mutation** | Edit, import, publish, delete |
| PM-34 unlock | Worker, `pm34_unblocked` |
| Provider API key | Configure or use in n8n |
| Unattended automation | No scheduled follow-up from agent |
| VPS SSH for other purposes | SSH only if gate explicitly includes path; not implied here |
| Tailscale / exposure change | No bind or Funnel change |

---

## Allowed evidence form

Future runtime session evidence in `docs/sessions/` must be:

| Rule | Detail |
|------|--------|
| Form | **Sanitized screenshot** and/or **sanitized text transcript** of list columns only |
| Secrets | **No** tokens, OAuth, PAT, webhook secrets, chat_id |
| Credentials | **No** credential names/values — attest `<NO_CREDENTIAL_ACCESS>` |
| Webhooks | **No** webhook URLs |
| Executions | **No** execution IDs — attest `<NO_EXECUTION_HISTORY_ACCESS>` |
| Workflow JSON | **No** export blobs |
| Payload | Attest `<NO_PAYLOAD_SENT>` |
| Git | `git status --short` before/after if repo docs updated |
| Commit | **Do not** commit raw screenshots with secrets — redact or keep local only |

---

## PASS criteria for future runtime gate

Future **PASS** requires **all**:

| # | Criterion |
|---|-----------|
| P1 | Only **Tier A** metadata observed (list-level) |
| P2 | **Credentials untouched** — `<NO_CREDENTIAL_ACCESS>` verified |
| P3 | **Workflows untouched** — no save, publish, import, activate on any workflow |
| P4 | **Executions untouched** — `<NO_EXECUTION_HISTORY_ACCESS>` verified |
| P5 | **No payload sent** to n8n — `<NO_PAYLOAD_SENT>` verified |
| P6 | **No workflow mutation** on 40/41 or others |
| P7 | **No PM-34** unlock or worker language |
| P8 | **Evidence sanitized** — placeholders only in git |
| P9 | **Operator can verify** — session lists exact UI page or API path used |
| P10 | **Operator gate documented** — approval date + scope in session header |

PASS records **observation only** — it does **not** unlock PM-34, payload send, or workflow changes.

---

## FAIL / abort criteria

**Abort immediately** (FAIL) if **any**:

| Trigger | Action |
|---------|--------|
| Credential access requested or performed | Abort — do not record secrets |
| Execution history opened | Abort |
| Workflow editor opened | Abort |
| Export JSON requested or downloaded | Abort |
| Execute / test / activate / deactivate appears | Abort |
| Telegram send appears | Abort |
| Payload send to n8n appears | Abort |
| PM-34 unlock appears | Abort |
| Provider API key appears | Abort |
| Evidence cannot be sanitized | Abort — do not commit |
| Operator gate missing | Abort — no runtime without approval |
| Drift beyond Tier A | Abort — e.g. opened single workflow detail beyond list columns |

On abort: session doc records **FAIL/abort** + reason; **no** partial PASS.

---

## Recommended next step

**Operator decision packet for n8n read-only runtime inspection**

**Rationale:** After this docs-only gate packet, the next step is a **real human decision** — whether to open a tightly scoped runtime read-only inspection at all, on which machine (Ryzen vs operator workstation), and whether UI list-only vs deferred indefinitely. That decision packet is still **docs-only** until the operator signs scope.

---

## Remaining gates

| Gate | Status |
|------|--------|
| n8n read-only runtime execution | **Gated** — not opened by this packet |
| Operator decision (docs) | **Next tactical step** |
| n8n execute / import / export | **Gated** |
| Workflow 40/41 mutation | **Gated** |
| PM-34 unlock | **Gated** |
| Provider API key | **Forbidden** |
| Payload send to n8n | **Gated** |
| VPS SSH | **Gated** — only if operator decision explicitly includes |
| OpenClaw `agent main` | **Forbidden** |
| `codex resume` | **Forbidden** |
| Codex repo mutation | **Forbidden** |
| Cursor worker automation | **Gated** |
| Deploy / tag / rollback | **Forbidden** |
| Unattended automation | **Forbidden** |

This gate packet does **NOT** open any gate above.

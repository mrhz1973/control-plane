# n8n read-only preflight design packet

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/n8n-read-only-preflight-design-packet.md`  
**Date:** 2026-05-26

## Status

- **DESIGN PACKET ONLY**
- no runtime
- no n8n UI / API / credential access in this task
- no workflow execution
- no workflow activation / deactivation
- no workflow import / export
- no workflow 40/41 mutation
- no PM-34 unlock
- no VPS SSH in this task
- no automation authorization

**Prerequisite:** [n8n payload contract closeout](n8n-payload-contract-closeout.md) — payload design phase closed on paper  
**Related:** [n8n preflight boundary](n8n-preflight-boundary-design-packet.md) · [payload validation checklist](n8n-payload-validation-checklist.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Purpose

The **n8n payload contract phase is closed on paper** ([closeout](n8n-payload-contract-closeout.md)). Allowlist, denylist, hardening, synthetic examples, and validation checklist exist. None of that required n8n to be running.

The **next safe step** is only to define — on paper — whether a **future**, separately gated operator session may perform a **read-only** inspection of n8n state on the VPS, and what metadata may be observed vs permanently excluded.

| Principle | Rule |
|-----------|------|
| This packet | **Does not touch n8n** — no UI login, no API call, no SSH, no credential read |
| Future runtime | Requires **explicit human gate** + session doc + sanitized evidence |
| Production workflows | **`40` ACTIVE**, **`41` BACKUP OFF** — no mutation implied by this design |
| PM-34 | Remains **blocked** |

---

## Future read-only scope

If and only if a **future gate** explicitly authorizes read-only preflight, the following **metadata classes** may be considered. Each class still requires its own sub-gate and sanitized recording — this list is **not** self-authorizing.

| Metadata class | Allowed in future read-only preflight (when gated) | Notes |
|----------------|------------------------------------------------------|-------|
| Workflow IDs / names | **Maybe** — list view only, no export download in first gate | Compare to [N8N_WORKFLOW_NAMING](../N8N_WORKFLOW_NAMING.md) / FOUNDATION_STATUS |
| Active / inactive flag | **Maybe** — boolean per workflow id | No toggle, no publish |
| Last updated timestamp | **Maybe** — per workflow metadata | No execution timestamps from runs |
| Workflow count | **Maybe** — aggregate number | No node graph |
| n8n version string | **Maybe** — if visible without credential panel | Sanitized in session only |

**Explicitly not in read-only scope (even when gated):**

| Excluded | Reason |
|----------|--------|
| Credentials (names, ids, values) | Secrets boundary |
| Execution logs / execution history | Runtime observation; separate gate if ever |
| Run / test / execute / trigger | Mutation or side effect |
| Workflow JSON export (full or partial) | Criterion 4 / export hygiene; separate redacted export gate |
| Payload send to n8n | Payload contract is outbound design only until new gate |
| Telegram send / bot config | Out of scope |
| Data Table contents | May contain PII or dedupe secrets — excluded |
| Webhook URLs / secrets | Excluded |

---

## Explicit exclusions

The following remain **forbidden** in this design task and **not authorized** by this packet for any future step unless a **new** explicit gate says otherwise:

| Exclusion | Scope |
|-----------|--------|
| n8n execution | No workflow run, manual or scheduled |
| n8n UI login | **In this task** — not performed |
| n8n API call | **In this task** — not performed |
| Credential read / mutation | Never in read-only preflight v1 |
| Execution history read | Excluded from read-only v1 |
| Telegram send | Excluded |
| Workflow **40** / **41** mutation | Import, edit, publish, activate, deactivate, delete |
| PM-34 unlock | Excluded |
| Provider API key | Excluded |
| OpenClaw `agent main` | Excluded |
| `codex resume` | Excluded |
| Codex repo mutation | Excluded |
| Cursor worker automation | Excluded |
| Deploy / tag / rollback | Excluded |
| Unattended automation | Excluded |
| Tailscale exposure change | No new public port, no Funnel, no bind change |
| VPS SSH for n8n inspection | **Gated** — not part of this docs-only packet |

---

## Abort conditions

Abort **design review** or **any future preflight attempt** if **any** of the following appear:

| # | Abort trigger |
|---|---------------|
| A1 | Credential access requested (read, list, export, copy id) |
| A2 | Workflow mutation requested (edit, import, publish, activate, deactivate) |
| A3 | Execution / run / test trigger implied |
| A4 | PM-34 unlock language or `pm34_unblocked: true` |
| A5 | Provider API key configuration or use |
| A6 | Telegram send or chat_id capture |
| A7 | Payload send to n8n (live or test) |
| A8 | Evidence cannot be verified (claims without sanitized record) |
| A9 | Operator explicit gate missing (no session doc, no human approval) |
| A10 | Full workflow export JSON requested without redaction gate |
| A11 | Tailscale / firewall / bind change suggested as part of preflight |

**Fail-closed:** When ambiguous, treat as abort and remain on paper-only design.

---

## Evidence requirements for future gated runtime

A future **authorized** read-only preflight session (separate gate) must produce a `docs/sessions/` record containing at minimum:

| # | Evidence item |
|---|---------------|
| E1 | **Exact read-only path** — e.g. “n8n UI workflows list screenshot redacted” or “GET /api/v1/workflows read-only with credential header not used” (only if future gate allows API) |
| E2 | **Credentials untouched** — explicit attestation; no credential panel opened |
| E3 | **Workflows untouched** — no save, publish, import, execute on 40/41 |
| E4 | **Executions untouched** — no execution list opened if excluded; or redacted aggregate only if gate expands |
| E5 | **Payload not sent** — no HTTP POST of integration payload to n8n |
| E6 | **Git status** — `git status --short` before/after any local doc update from session |
| E7 | **Sanitized evidence only** — no tokens, chat_id, credential ids, webhook URLs, execution ids with secrets |
| E8 | **Operator machine** — which machine (e.g. Ryzen casa vs PC lavoro docs-only) |
| E9 | **Abort if** — list any A1–A11 triggers that were checked and not seen |

This design packet does **not** authorize that session — it only specifies what it must contain if a gate opens it later.

---

## Recommended next step

**n8n read-only preflight hardening (docs-only)**

Tighten: metadata allowlist per observation type, redaction placeholders for future evidence, fail-closed abort matrix, and distinction between “list workflow names” vs “open workflow editor”. Still **no** n8n runtime in hardening gate.

---

## Remaining gates

| Gate | Status |
|------|--------|
| n8n runtime (execute) | **Gated** |
| n8n read-only preflight runtime | **Gated** — not opened by this design packet |
| n8n UI / API in docs-only tasks | **Forbidden** |
| Workflow 40/41 mutation | **Gated** |
| PM-34 unlock | **Gated** |
| Provider API key | **Forbidden** |
| OpenClaw `agent main` | **Forbidden** |
| `codex resume` | **Forbidden** |
| Codex repo mutation | **Forbidden** |
| Cursor worker automation | **Gated** |
| Deploy / tag / rollback | **Forbidden** |
| Unattended automation | **Forbidden** |
| Payload send to n8n | **Gated** |
| VPS SSH | **Gated** |
| Live Codex negative tests | **Gated** |
| Wrapper / fixture changes | **Gated** (separate) |

This design packet does **NOT** open any gate above.

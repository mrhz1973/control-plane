# n8n read-only preflight hardening

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/n8n-read-only-preflight-hardening.md`  
**Date:** 2026-05-26

## Status

- **DOCS-ONLY HARDENING**
- no runtime
- no n8n UI / API / credential access
- no VPS SSH
- no workflow execution
- no workflow import / export
- no workflow activation / deactivation
- no workflow 40/41 mutation
- no PM-34 unlock
- no automation authorization

**Prerequisite:** [n8n read-only preflight design packet](n8n-read-only-preflight-design-packet.md)  
**Related:** [n8n payload contract closeout](n8n-payload-contract-closeout.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Hardened read-only boundary

Future observation is split into **classes**. Each class requires a **separate explicit gate** and sanitized session evidence. **This hardening document authorizes none of them.**

| Observation class | Future allow (only if sub-gated) | Observation method (when gated) |
|-------------------|----------------------------------|--------------------------------|
| Workflow id / name **list** | List-level metadata only | UI workflows list (no row drill-down into editor) or read-only API list endpoint if future gate allows |
| Active / inactive boolean | Per workflow id | List column or metadata field only — **no** toggle click |
| Last updated timestamp | Per workflow metadata | List column only — **not** execution finished-at |
| Workflow count | Aggregate integer | Count from list length or API total — **no** per-workflow detail beyond list |
| n8n version string | Install/version banner | About/settings version text only — **no** credential panels |

**Critical distinction:**

| Tier | What it is | Hardened rule |
|------|------------|---------------|
| **A — List metadata** | Id, name, active flag, updated-at on list view | Only tier eligible for **first** read-only runtime gate |
| **B — Workflow interior** | Editor, node graph, parameters, connections | **Forbidden** in read-only v1 — abort |
| **C — Export / execution** | JSON export, run history, test webhook, execute | **Forbidden** — abort; separate gates if ever |

**None of the above is authorized by this document.**

---

## Forbidden observation classes

Always **forbidden** in read-only preflight v1 (and in this docs-only task):

| Class | Examples | Abort if |
|-------|----------|----------|
| **Credentials** | Names, ids, values, OAuth, Telegram bot token | Any credential panel opened or API credential endpoint called |
| **Execution logs / history** | Run list, error stack, execution id with payload | Execution tab opened or execution API queried |
| **Workflow editor / node graph** | Canvas, node parameters, connections | Any workflow opened in editor beyond list view |
| **Workflow JSON export** | Download export, copy workflow JSON | Export action or full JSON retrieved |
| **Data Tables** | Rows, keys, dedupe state | Data Table UI or API access |
| **Webhook URLs** | Production webhook URL, signing secret | URL or secret visible in output |
| **Telegram config** | chat_id, bot settings in n8n | Telegram node credential or send test |
| **Payload send to n8n** | POST integration payload, webhook test body | Any outbound payload to n8n from bridge |
| **Run / test / execute / trigger** | Manual run, test workflow, activate schedule | Any execute or activate action |
| **Workflow activate / deactivate** | Publish, unpublish, toggle active | Any state change on 40/41 or other workflows |

---

## Observation methods (when future gate exists)

| Method | Allowed tier | Forbidden use |
|--------|--------------|---------------|
| n8n UI — workflows **list** page only | A | Open editor (B), executions (C), credentials |
| n8n UI — workflow **editor** | — | **Always abort** in v1 |
| n8n API — `GET` workflows **list** metadata | A (if gate explicitly allows API) | `GET` execution, credentials, export |
| SSH + curl to n8n | — | **Gated separately** — not implied by read-only design |
| Screenshot | A fields only | Must use redaction placeholders below |

This task performs **none** of these methods.

---

## Redaction placeholders

Use in future `docs/sessions/` evidence (never commit live values):

| Placeholder | Use when |
|-------------|----------|
| `<REDACTED_WORKFLOW_ID>` | Numeric n8n workflow id in evidence |
| `<REDACTED_WORKFLOW_NAME_IF_SENSITIVE>` | Name if non-public or operator prefers redaction |
| `<REDACTED_N8N_VERSION_IF_NEEDED>` | Version string if combined with host-identifying info |
| `<REDACTED_LOCAL_PATH>` | Any accidental absolute path in notes |
| `<NO_CREDENTIAL_ACCESS>` | Attestation block — credentials panel not opened |
| `<NO_EXECUTION_HISTORY_ACCESS>` | Attestation — execution list not opened |
| `<NO_PAYLOAD_SENT>` | Attestation — no HTTP payload to n8n |

Additional standard placeholders (align with payload contract): `REDACTED`, `REDACTED_URL`, `REDACTED_CREDENTIAL`, `REDACTED_EXECUTION_ID`.

---

## Fail-closed abort matrix

| Trigger | Expected result | Notes |
|---------|-----------------|-------|
| Credential access requested | **abort** | Includes “just peek at Telegram credential” |
| Workflow mutation requested | **abort** | Edit, import, publish, activate, deactivate, delete |
| Execution / run implied | **abort** | Test workflow, manual trigger, “run once” |
| Export JSON requested | **abort** | Full or partial workflow export |
| Telegram send appears | **abort** | Test message, handoff notify |
| PM-34 unlock appears | **abort** | `pm34_unblocked`, worker enablement language |
| Provider API key appears | **abort** | Configure OpenAI/OpenRouter in n8n |
| Payload send appears | **abort** | Live or test POST of integration payload |
| Evidence cannot be sanitized | **abort** | Raw screenshot with secrets — do not commit |
| Operator gate missing | **abort** | No human approval / no session doc |
| Workflow **editor** opened | **abort** | Crossed from list metadata (A) to interior (B) |
| Data Table opened | **abort** | Forbidden class |
| Tailscale / exposure change | **abort** | Out of read-only scope |

**Rule:** First matching row wins; no partial proceed.

---

## Future evidence standard

A future **gated** read-only preflight runtime session must prove:

| # | Requirement |
|---|-------------|
| 1 | **Read-only path only** — document exact UI page or API `GET` path (sanitized) |
| 2 | **Credentials untouched** — `<NO_CREDENTIAL_ACCESS>` attestation |
| 3 | **Workflows untouched** — no save, publish, import on 40/41 or others |
| 4 | **Executions untouched** — `<NO_EXECUTION_HISTORY_ACCESS>` attestation |
| 5 | **Payload not sent** — `<NO_PAYLOAD_SENT>` attestation |
| 6 | **Sanitized evidence only** — placeholders above; no tokens in git |
| 7 | **Git status before/after** — if session updates docs in control-plane |
| 8 | **Operator gate present** — explicit human approval recorded in session header |

This hardening packet does **not** authorize that session.

---

## Recommended next step

**n8n read-only preflight closeout (docs-only)**

**Rationale:** Before any runtime gate, close the read-only **design + hardening** phase on paper and decide whether a future gated read-only inspection is worth opening vs remaining on GitHub/docs-only verification. Closeout should state what is proven on paper, what remains gated, and whether runtime read-only preflight is deferred or queued behind explicit operator decision.

---

## Remaining gates

| Gate | Status |
|------|--------|
| n8n runtime (execute) | **Gated** |
| n8n read-only preflight runtime | **Gated** |
| n8n UI / API in docs-only tasks | **Forbidden** |
| VPS SSH | **Gated** |
| Workflow 40/41 mutation | **Gated** |
| PM-34 unlock | **Gated** |
| Provider API key | **Forbidden** |
| Payload send to n8n | **Gated** |
| OpenClaw `agent main` | **Forbidden** |
| `codex resume` | **Forbidden** |
| Codex repo mutation | **Forbidden** |
| Cursor worker automation | **Gated** |
| Deploy / tag / rollback | **Forbidden** |
| Unattended automation | **Forbidden** |
| Workflow JSON export (live) | **Gated** |
| Live Codex negative tests | **Gated** |

This hardening packet does **NOT** open any gate above.

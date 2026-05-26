# n8n payload contract design packet

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/n8n-payload-contract-design-packet.md`  
**Date:** 2026-05-26

## Status

- **DESIGN PACKET ONLY**
- no runtime executed
- no n8n execution
- no n8n UI / API / credential access
- no workflow 40/41 mutation
- no workflow import/export
- no PM-34 unlock
- no Codex runtime
- no wrapper or fixture changes
- explicit gate required before any payload runtime / preflight execution

**Related:** [n8n preflight boundary](n8n-preflight-boundary-design-packet.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Purpose

Define a **synthetic/sanitized n8n-facing payload contract** for a future integration handoff from local wrapper evidence.

| Principle | Rule |
|-----------|------|
| Paper-only | Payload contract is validated by **documentation review**, not by calling n8n |
| No n8n dependency | This document does **not** require n8n to exist or run to be considered complete |
| Boundary prerequisite | [n8n preflight boundary](n8n-preflight-boundary-design-packet.md) already scoped exclusions |
| Runtime | **Unauthorized** — n8n, wf 40/41 mutation, PM-34 unlock remain gated |

---

## Allowed payload fields (v1)

| Field | Type | Role |
|-------|------|------|
| `schema_version` | string | Contract version identifier |
| `request_id` | string | Synthetic / non-secret identifier |
| `status` | string | Safe enum-like value (see field rules) |
| `summary` | string | Short sanitized text |
| `recommended_next_step` | string | Docs / gate-only text only |
| `human_gate_required` | boolean | |
| `no_runtime_confirmation` | boolean | Must remain `true` in this phase |
| `blocked_actions` | string[] | Forbidden / gated action labels |
| `risk_notes` | string | Sanitized notes only |
| `wrapper_trace` | object | Explicit booleans only (see below) |
| `source_session_path` | string | Repo-relative `docs/sessions/` path |
| `source_commit` | string | Git SHA only (no secret-bearing URL) |
| `generated_at` | string | ISO-8601 timestamp |
| `payload_mode` | string | Safe mode label (see field rules) |

### `wrapper_trace` (v1 required booleans when object present)

| Key | Phase default |
|-----|----------------|
| `n8n_invoked` | **`false`** until future n8n runtime gate |
| `codex_invoked` | `false` unless explicitly synthetic example |
| `wrapper_modified_repo` | **`false`** |
| `pm34_unblocked` | **`false`** |
| `provider_api_key_used` | **`false`** |

Optional bridge-mapped booleans (future hardening may align names): `codex_transport_used`, `codex_resume_used`, `mock_codex_output_used` — only with schema bump and gate.

**Omitted:** `proposed_prompt_for_cursor`, `codex_result` bodies, live fixture absolute paths.

---

## Field rules

| Field | Rule |
|-------|------|
| `schema_version` | Fixed string, e.g. `"n8n-payload-v1"` |
| `request_id` | Synthetic; no PII; no live n8n execution id |
| `status` | One of: `design_only`, `blocked`, `ready_for_manual_review` — or bridge-mapped safe class documented in hardening |
| `summary` | Short sanitized text; no secrets; no executable commands |
| `recommended_next_step` | Gate/docs language only; **no** executable runtime command |
| `human_gate_required` | Boolean |
| `no_runtime_confirmation` | Boolean; **must be `true`** in this phase |
| `blocked_actions` | Array of enum-like strings; no credential names |
| `risk_notes` | Sanitized; no tokens |
| `wrapper_trace` | All listed booleans explicit when object present |
| `source_session_path` | Repo-relative under `docs/sessions/` only |
| `source_commit` | Short or full SHA; no tokenized remote URL |
| `generated_at` | Timestamp only |
| `payload_mode` | One of: `design_only`, `synthetic_fixture`, `redacted_sample` |

---

## Denied payload fields

Must **never** appear (key or value):

| Category | Denied |
|----------|--------|
| Secrets | API keys, provider API keys, OAuth tokens/material, PAT, passwords |
| Messaging | Webhook URLs, chat IDs |
| URLs | Tokenized URLs, auth URLs with embedded secrets |
| Prompts | Raw prompts containing secrets |
| n8n | Credential names/values, live execution IDs |
| Workflows | Workflow export JSON; any field implying workflow mutation |
| PM-34 | Any field implying PM-34 unlock |
| Paths | Local absolute paths not sanitized |
| Automation | Fields requiring n8n execution to validate this document |
| Cursor bridge | `proposed_prompt_for_cursor` (any value) |

**Fail-closed:** Denied key at any depth → abort payload construction.

---

## Redaction rules

| Input pattern | Output placeholder |
|---------------|-------------------|
| Secret-like values | `REDACTED` |
| Tokenized / signed / auth URLs | `REDACTED_URL` |
| Chat IDs | `REDACTED_CHAT_ID` |
| Credential names/values | `REDACTED_CREDENTIAL` |
| Local absolute paths | Repo-relative if safe; else `REDACTED_LOCAL_PATH` |
| Live n8n execution IDs | `REDACTED_EXECUTION_ID` |
| Raw prompts with secret-shaped content | **Omit entirely** — do not partial-commit |

Additional rules:

- `n8n_invoked` must remain `false` until separate n8n runtime gate
- `recommended_next_step` abort if implies: invoke n8n, run workflow, unlock PM-34, configure provider API key

---

## Abort conditions

Abort payload construction if:

| Condition | Action |
|-----------|--------|
| Any denied field appears | STOP |
| Payload implies n8n execution | STOP |
| Payload implies workflow 40/41 mutation | STOP |
| Payload implies credential access | STOP |
| Payload implies PM-34 unlock | STOP |
| Payload requires provider API key | STOP |
| Payload requires unattended automation | STOP |
| `no_runtime_confirmation` missing or `false` | STOP |
| Evidence cannot be verified | STOP |
| Workspace becomes dirty outside allowed paths | STOP |

---

## Example synthetic payload

```json
{
  "schema_version": "n8n-payload-v1",
  "request_id": "synthetic-integration-closeout-001",
  "status": "design_only",
  "summary": "Paper-only payload example for contract review. No n8n call required.",
  "recommended_next_step": "Proceed to n8n payload contract hardening docs-only under explicit human gate.",
  "human_gate_required": true,
  "no_runtime_confirmation": true,
  "blocked_actions": ["n8n runtime", "workflow 40/41 mutation", "PM-34 unlock"],
  "risk_notes": "Synthetic fixture; not derived from live n8n.",
  "wrapper_trace": {
    "n8n_invoked": false,
    "codex_invoked": false,
    "wrapper_modified_repo": false,
    "pm34_unblocked": false,
    "provider_api_key_used": false
  },
  "source_session_path": "docs/sessions/2026-05-26-control-plane-local-only-integration-dry-run.md",
  "source_commit": "f17f407",
  "generated_at": "2026-05-26T12:00:00Z",
  "payload_mode": "synthetic_fixture"
}
```

---

## Validation checks (manual checklist)

Future implementers must confirm before any payload commit or send:

- [ ] `schema_version` present
- [ ] Only allowlisted top-level fields
- [ ] No denied fields (recursive key scan)
- [ ] `no_runtime_confirmation === true`
- [ ] `wrapper_trace.n8n_invoked === false`
- [ ] `wrapper_trace.wrapper_modified_repo === false`
- [ ] `wrapper_trace.pm34_unblocked === false`
- [ ] `wrapper_trace.provider_api_key_used === false`
- [ ] `source_session_path` repo-relative under `docs/sessions/`
- [ ] `payload_mode` is `design_only`, `synthetic_fixture`, or `redacted_sample`
- [ ] No runtime executed to produce this packet review artifact
- [ ] No n8n access (API/UI/credentials)
- [ ] Workflow 40/41 untouched
- [ ] PM-34 unchanged
- [ ] No secrets, tokens, chat IDs, webhook URLs, OAuth, PAT, live execution IDs

---

## Recommended next gate

**n8n payload contract hardening (docs-only)**

This still does **not** authorize n8n runtime, payload preflight runtime, workflow mutation, or PM-34 unlock.

---

## Remaining gates

| Gate | Status |
|------|--------|
| n8n runtime | **Gated** |
| Workflow 40/41 mutation | **Gated** |
| PM-34 unlock | **Gated** |
| Provider API key | **Forbidden** |
| OpenClaw `agent main` | **Forbidden** |
| `codex resume` | **Forbidden** |
| Codex repo mutation | **Forbidden** |
| Cursor worker automation | **Forbidden** |
| Deploy / tag / rollback | **Forbidden** |
| Unattended automation | **Forbidden** |
| Live Codex negative tests | **Gated** |
| Timeout / outage / rate-limit runtime tests | **Gated** |
| Cross-machine execution | **Gated** |
| Payload preflight runtime | **Gated** |

This design packet does **NOT** open any gate above.

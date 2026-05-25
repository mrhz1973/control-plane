# n8n payload contract design packet

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/n8n-payload-contract-design-packet.md`  
**Date:** 2026-05-26

## Status

- **DESIGN PACKET ONLY**
- no runtime executed by this task
- no n8n execution
- no n8n UI / API / credential access
- no workflow 40/41 mutation
- no PM-34 unlock
- no Codex execution by this task
- no wrapper code changes
- no fixture changes
- explicit gate required before any payload runtime / preflight execution

**Related:** [n8n preflight boundary](n8n-preflight-boundary-design-packet.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Purpose

The [n8n preflight boundary design packet](n8n-preflight-boundary-design-packet.md) defines **what** a future n8n preflight may discuss on paper. This packet defines **how** a future n8n-facing payload would be shaped: allowlist, denylist, redaction, abort rules, and evidence requirements.

| Fact | Implication |
|------|-------------|
| Preflight boundary defined | Field-level contract can be specified |
| Payload contract | **Docs-only** — no serializer, no n8n call |
| n8n runtime | Still **unauthorized** |
| Workflow 40/41 | **Untouched** |
| PM-34 | **Gated** |

---

## Allowed payload fields

Future payloads may include **only** these top-level fields (v1 contract):

| Field | Type | Notes |
|-------|------|-------|
| `schema_version` | string | e.g. `"n8n-payload-v1"` |
| `request_id` | string | From bridge; no PII |
| `status` | string | `pass` \| `needs_human` \| `blocked` \| `failed` |
| `summary` | string | Sanitized text; max length TBD in hardening |
| `recommended_next_step` | string | Must not imply n8n execution (validated) |
| `human_gate_required` | boolean | |
| `no_runtime_confirmation` | boolean | Must be `true` until separate runtime gate |
| `blocked_actions` | string[] | From bridge; enum-like strings only |
| `risk_notes` | string | Sanitized; no secrets |
| `wrapper_trace` | object | **Booleans only** — see trace allowlist below |
| `source_session_path` | string | Repo-relative path under `docs/sessions/` |
| `source_commit` | string | Short git SHA |
| `generated_at` | string | ISO-8601 UTC |
| `payload_mode` | string | `"synthetic"` \| `"sanitized"` only |

### `wrapper_trace` allowlist (booleans only)

| Key | Required when present |
|-----|----------------------|
| `codex_invoked` | optional |
| `n8n_invoked` | optional — must be `false` until n8n runtime gate |
| `openclaw_invoked` | optional |
| `repo_mutation_attempted` | optional |
| `codex_transport_used` | optional |
| `codex_workdir_is_temp` | optional |
| `codex_resume_used` | optional |
| `mock_codex_output_used` | optional |

No other keys under `wrapper_trace` without a new schema version and gate.

**Omitted by design:** `proposed_prompt_for_cursor`, `codex_result` body, raw fixture paths, `fixture_path` absolute values.

---

## Denied payload fields

The following must **never** appear in an n8n-facing payload (key name or value pattern):

| Denied | Examples / patterns |
|--------|---------------------|
| API keys | `api_key`, `*_api_key`, `secret` |
| Provider API keys | `openai_api_key`, `provider_api_key` |
| OAuth tokens / material | `oauth`, `access_token`, `refresh_token` |
| PATs | `pat`, `personal_access_token` |
| Webhook URLs | `webhook`, `hooks.slack.com`, n8n webhook paths |
| Chat IDs | `chat_id`, `telegram_chat_id` |
| Tokenized URLs | query params `token=`, `sig=` |
| Auth URLs | login links with embedded secrets |
| Raw prompts with secrets | full Codex prompt bodies |
| n8n credential names/values | credential vault fields |
| Live execution IDs | n8n execution UUIDs from production |
| Workflow export JSON | wf 40/41 JSON blobs |
| Local absolute paths | `C:\`, `/home/`, drive letters — use repo-relative or placeholder |
| Workflow mutation signals | `import_workflow`, `activate_workflow`, wf patch ops |
| PM-34 unlock signals | `pm34_unlock`, `unlock_pm34` |
| `proposed_prompt_for_cursor` | non-null values |

**Fail-closed:** Any denied key at any depth → abort payload construction.

---

## Redaction rules

| Rule | Behavior |
|------|----------|
| Secret-shaped keys | Reject payload if key matches denylist (case-insensitive substring on key) |
| Raw tokens / URLs | Never include; strip or abort |
| Absolute paths | Replace with `"<redacted-local-path>"` or repo-relative only |
| Evidence paths | Repo-relative only, e.g. `docs/sessions/2026-05-26-....md` |
| `proposed_prompt_for_cursor` | Omit or explicit `null` — prefer omit in n8n payload |
| `n8n_invoked` | Must be `false` (or omitted with validator default false) until separate n8n runtime gate |
| `recommended_next_step` | Reject if matches unsafe patterns: `invoke n8n`, `run workflow`, `PM-34 unlock`, `provider API key` |
| Summaries | Truncate long text; no paste of CLI stderr with tokens |

---

## Abort conditions

Abort future payload construction if:

| Condition | Action |
|-----------|--------|
| Any denied field appears | STOP |
| `no_runtime_confirmation` missing or `false` | STOP |
| `recommended_next_step` implies n8n execution | STOP |
| Workflow 40/41 mutation referenced as action | STOP |
| PM-34 unlock referenced | STOP |
| Provider API key referenced | STOP |
| Credential access referenced | STOP |
| Unattended automation referenced | STOP |
| `n8n_invoked: true` without explicit n8n runtime gate | STOP |
| Evidence cannot be verified (dirty workspace, missing session) | STOP |

---

## Example synthetic payload

Safe illustrative JSON (no secrets, no live IDs, `n8n_invoked: false`):

```json
{
  "schema_version": "n8n-payload-v1",
  "request_id": "dry-run-v1-codex-readonly-success-path",
  "status": "pass",
  "summary": "Local wrapper integration dry-run: live Codex read-only path passed with fail-closed trace.",
  "recommended_next_step": "Proceed only under explicit human gate; do not invoke n8n or mutate workflows.",
  "human_gate_required": true,
  "no_runtime_confirmation": true,
  "blocked_actions": ["n8n integration or invocation"],
  "risk_notes": "Synthetic example for contract review only.",
  "wrapper_trace": {
    "codex_invoked": true,
    "n8n_invoked": false,
    "openclaw_invoked": false,
    "repo_mutation_attempted": false,
    "codex_transport_used": true,
    "codex_workdir_is_temp": true,
    "codex_resume_used": false,
    "mock_codex_output_used": false
  },
  "source_session_path": "docs/sessions/2026-05-26-control-plane-local-only-integration-dry-run.md",
  "source_commit": "f17f407",
  "generated_at": "2026-05-26T12:00:00Z",
  "payload_mode": "synthetic"
}
```

---

## Future validation checks

Before any payload is committed or sent (future gated step):

| # | Check |
|---|--------|
| 1 | `schema_version` present and recognized |
| 2 | Only allowlisted top-level fields |
| 3 | Denied fields absent (recursive key scan) |
| 4 | `no_runtime_confirmation === true` |
| 5 | `human_gate_required === true` when `status` is `needs_human` or `blocked` |
| 6 | `wrapper_trace.n8n_invoked === false` if present |
| 7 | `source_session_path` repo-relative under `docs/` |
| 8 | `payload_mode` is `synthetic` or `sanitized` only |
| 9 | `recommended_next_step` passes unsafe-pattern scan |
| 10 | No absolute local paths in any string value |

---

## Recommended next step

**n8n payload contract hardening (docs-only)**

**Rationale:** Before any runtime or n8n-facing preflight, harden field rules, edge cases, and additional safe examples — still docs-only.

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

---

## Acceptance criteria (this packet)

- [x] Allowlist and denylist defined
- [x] Redaction and abort rules specified
- [x] Safe synthetic example included
- [x] Future validation checks listed
- [x] Does not authorize n8n runtime
- [x] No runtime in this task

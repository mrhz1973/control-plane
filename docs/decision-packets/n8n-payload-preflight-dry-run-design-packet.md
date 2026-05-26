# n8n payload preflight dry-run design packet

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/n8n-payload-preflight-dry-run-design-packet.md`  
**Date:** 2026-05-26

## Status

- **DESIGN PACKET ONLY**
- no runtime executed in this task
- no payload sent to n8n
- no n8n UI / API / credential access
- no workflow execution / import / export
- no workflow 40/41 mutation
- no PM-34 unlock
- no provider API key
- no Codex runtime
- no unattended automation

**Prerequisites:** [post-n8n-read-only-inspection hardening](post-n8n-read-only-inspection-hardening.md) · [Tier A PASS](../sessions/2026-05-26-control-plane-n8n-read-only-runtime-inspection-tier-a-pass.md) · [payload contract design](n8n-payload-contract-design-packet.md) · [payload contract hardening](n8n-payload-contract-hardening.md)  
**Related:** [n8n preflight boundary](n8n-preflight-boundary-design-packet.md) · [runtime gate packet](n8n-read-only-runtime-gate-packet.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Purpose

Define how a **future n8n payload preflight dry-run** should work on paper before any runtime gate opens.

| Goal | Rule |
|------|------|
| Separate design from runtime | This packet **defines** dry-run scope; it **does not execute** it |
| Prevent Tier A misread | Tier A list PASS **must not** be interpreted as `n8n_ready=true` |
| Verifiable criteria first | PASS/FAIL, abort, and evidence rules exist before payload send or n8n API |
| Fail-closed | Any ambiguity → abort in future dry-run; no strip-and-continue |
| Chain integrity | Dry-run evidence is **separate** from Tier A list observation evidence |

---

## Scope allowed (this task and Phase 0)

| Allowed | Detail |
|---------|--------|
| Logical dry-run contract | Phases, criteria, evidence model in docs |
| Synthetic or redacted sample payloads | In markdown only — no live send |
| Paper validation / checklist | Reference [hardening](n8n-payload-contract-hardening.md) V1–V15 |
| Repo-relative evidence | `docs/sessions/`, `docs/decision-packets/` paths only |
| Gate documentation | What future phases require explicit operator approval |

**No n8n interaction** in Phase 0 or this design task.

---

## Scope forbidden

| Forbidden | Notes |
|-----------|--------|
| Send payload to n8n | Includes webhook POST, integration trigger, test execute |
| Call n8n webhook / API | Any HTTP to n8n host |
| Open n8n UI | List PASS already consumed; no casual re-open |
| Use live execution IDs | Synthetic `request_id` only |
| Read credential names/values | `<NO_CREDENTIAL_ACCESS>` |
| Export workflow JSON | Tier C — abort |
| Open or mutate workflow **40** / **41** | Production / backup invariant |
| PM-34 unlock | `pm34_unblocked` must stay `false` |
| Start automation | Schedules, unattended loops, Cursor worker |
| Executable scripts | No validator `.mjs` / `.py` in this task |
| Set `n8n_ready=true` | Not in allowlist; abort if present |

---

## Proposed future dry-run phases

| Phase | Name | Authorized now? | Summary |
|-------|------|-----------------|---------|
| **0** | Docs-only design | **YES** (this packet) | Scope, criteria, evidence model — no payload send |
| **1** | Synthetic payload validation in repo | **NO** — separate gate | Docs-only pass/fail JSON examples exercising contract |
| **2** | Local validator / mock-only | **NO** — separate explicit gate | In-memory or fixture validation; still `n8n_invoked=false` |
| **3** | n8n read-only preflight runtime | **NO** — separate explicit gate | Tier A already done once; future scope must re-gate |
| **4** | Payload send to controlled endpoint | **NO** — high-risk gate | Real HTTP to n8n; wf 40/41 still untouched unless new gate |

**Only Phase 0 is authorized by this document.**

Phase progression requires: operator approval + `docs/sessions/` record + unchanged gates unless explicitly opened.

---

## Synthetic payload shape

References [n8n payload contract design packet](n8n-payload-contract-design-packet.md) v1 allowlist and [hardening](n8n-payload-contract-hardening.md) invariants.

### Allowlisted top-level fields only

| Field | Phase 0–2 requirement |
|-------|----------------------|
| `schema_version` | e.g. `"n8n-payload-v1"` |
| `request_id` | Synthetic; no live execution id |
| `status` | Closed enum per hardening |
| `summary` | Sanitized text |
| `recommended_next_step` | Docs/gate language only |
| `human_gate_required` | Boolean |
| `no_runtime_confirmation` | **`true`** required |
| `blocked_actions` | Enum-like gate labels (array) |
| `risk_notes` | Sanitized text |
| `wrapper_trace` | Boolean-only object |
| `source_session_path` | Repo-relative under allowed roots |
| `source_commit` | Git SHA only |
| `generated_at` | ISO-8601 |
| `payload_mode` | `synthetic` \| `sanitized` only |

### `wrapper_trace` safe defaults (Phases 0–2)

| Key | Required value |
|-----|----------------|
| `n8n_invoked` | **`false`** |
| `wrapper_modified_repo` | **`false`** |
| `pm34_unblocked` | **`false`** |
| `provider_api_key_used` | **`false`** |
| `codex_invoked` | **`false`** unless explicit synthetic example gate |

Optional trace keys — boolean only if present: `codex_transport_used`, `codex_resume_used`, `mock_codex_output_used`.

### Explicit exclusions

| Field / pattern | Rule |
|-----------------|------|
| `n8n_ready` | **Must not** appear as `true`; field absent preferred |
| Credential fields | Forbidden at any depth |
| Webhook URLs | Forbidden |
| Execution IDs | Forbidden |
| `proposed_prompt_for_cursor` | Null or omitted — non-null → abort |
| Workflow export JSON | Forbidden |

### Illustrative synthetic fragment (docs-only — not sent)

```json
{
  "schema_version": "n8n-payload-v1",
  "request_id": "SYNTHETIC-DRYRUN-001",
  "status": "design_only",
  "summary": "Synthetic dry-run shape for paper validation only.",
  "recommended_next_step": "Continue docs-only dry-run examples gate.",
  "human_gate_required": true,
  "no_runtime_confirmation": true,
  "blocked_actions": [
    "n8n_payload_send",
    "n8n_api_call",
    "workflow_40_41_mutation",
    "pm34_unlock",
    "provider_api_key"
  ],
  "risk_notes": "Tier A PASS does not imply n8n_ready.",
  "wrapper_trace": {
    "n8n_invoked": false,
    "wrapper_modified_repo": false,
    "pm34_unblocked": false,
    "provider_api_key_used": false,
    "codex_invoked": false
  },
  "source_session_path": "docs/sessions/2026-05-26-control-plane-n8n-payload-preflight-dry-run-design-packet-docs-only.md",
  "source_commit": "<GIT_SHA>",
  "generated_at": "2026-05-26T12:00:00Z",
  "payload_mode": "synthetic"
}
```

Replace `<GIT_SHA>` with commit at recording time. **Do not send** this JSON to n8n.

---

## PASS criteria (future dry-run)

Future **PASS** (Phases 1–2 docs/mock; Phase 3+ require additional gates) requires **all**:

| # | Criterion |
|---|-----------|
| D1 | Payload uses **only** allowlisted top-level fields |
| D2 | Denied fields **absent** recursively (fail-closed denylist) |
| D3 | `no_runtime_confirmation === true` |
| D4 | `wrapper_trace.n8n_invoked === false` (Phases 0–2) |
| D5 | `wrapper_trace.pm34_unblocked === false` |
| D6 | `wrapper_trace.provider_api_key_used === false` |
| D7 | `source_session_path` repo-relative only |
| D8 | `recommended_next_step` contains **no** executable runtime command |
| D9 | `blocked_actions` includes remaining gates relevant to phase |
| D10 | Evidence is **sanitized text only** in git |
| D11 | Workflow **40** / **41** remain **untouched** |
| D12 | `n8n_ready` not set `true` |
| D13 | Tier A PASS not cited as payload preflight PASS |

PASS in Phase 1–2 **does not** unlock Phase 3 or 4.

---

## FAIL / abort criteria

**Abort immediately** if **any**:

| Trigger | Action |
|---------|--------|
| Secret-like value (API key, token, password) | Abort — do not commit |
| Webhook URL | Abort |
| OAuth / PAT / provider API key material | Abort |
| `chat_id` or bot token pattern | Abort |
| n8n credential name/value | Abort |
| Live execution ID | Abort |
| Payload implies workflow **40** / **41** mutation | Abort |
| Payload implies PM-34 unlock (`pm34_unblocked: true`) | Abort |
| Payload implies `n8n_ready=true` | Abort |
| Executable runtime command in `recommended_next_step` | Abort |
| Payload requires n8n UI/API to validate (Phase 0–2) | Abort |
| Evidence cannot be verified from repo | Abort |
| `proposed_prompt_for_cursor` non-null | Abort |
| Workflow export JSON or node graph | Abort |
| Local unsanitized absolute path | Abort |

On abort: session records **FAIL/abort** + reason; no partial PASS.

---

## Evidence model

| Rule | Detail |
|------|--------|
| Form | **Text-only** in `docs/sessions/` or decision packets |
| Screenshots | Not committed unless separately authorized and redacted |
| Binaries | No attachments in git |
| Workflow JSON | No raw export blobs |
| Paths | Repo-relative only; no `C:\`, `/home/`, `file://` |
| Attestation | Docs-only sessions must state: no runtime, no payload send, no n8n access |
| Separation | Dry-run evidence ≠ Tier A list evidence ≠ payload send evidence |
| Placeholders | `<NO_CREDENTIAL_ACCESS>`, `<NO_PAYLOAD_SENT>`, `<GIT_SHA>` |

Future Phase 2 mock validator output may be recorded as sanitized JSON in session text — still **not** sent to n8n.

---

## Gate matrix

| Gate | Status |
|------|--------|
| Payload preflight runtime | **Gated** |
| Payload send to n8n | **Gated** |
| n8n API | **Gated** |
| n8n UI | **Gated** |
| Workflow 40/41 mutation | **Gated** |
| PM-34 unlock | **Gated** |
| Provider API key | **Forbidden** |
| Codex runtime | **Gated** |
| Cursor worker automation | **Gated** |
| Unattended automation | **Forbidden** |
| Deploy / tag / rollback | **Forbidden** |
| Phase 1 dry-run examples | **Next docs-only step** — not opened by this packet alone |
| Phase 2 local validator | **Gated** |
| Phase 4 payload send | **Gated** (high risk) |

This design packet does **NOT** open any gate above except documenting Phase 0.

---

## Tier A PASS boundary (explicit)

From [post-n8n-read-only-inspection hardening](post-n8n-read-only-inspection-hardening.md):

| Tier A proved | Dry-run does **not** inherit |
|---------------|------------------------------|
| Workflows list reachable (operator) | Payload preflight runtime |
| wf 40 active, wf 41 backup off on list | `n8n_ready=true` |
| Count = 5 | n8n API readiness |
| Sanitized list evidence in GitHub | Authorization to send payloads |

Dry-run design assumes Tier A PASS exists but **does not** consume it as payload authorization.

---

## Recommended next step

**n8n payload preflight dry-run examples — docs-only**

| Property | Value |
|----------|-------|
| Scope | Pass/fail synthetic JSON examples for dry-run criteria D1–D13 |
| Runtime | **Not authorized** |
| Payload send | **Forbidden** |
| n8n UI / API | **Not authorized** |
| PM-34 unlock | **Forbidden** |
| wf 40/41 | **Untouched** |

Examples task remains paper-only until Phase 1 gate is explicitly opened.

---

## Remaining gates

Unchanged from [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md): payload preflight runtime, payload send, n8n execute/import/export, workflow 40/41 mutation, PM-34 unlock, provider API key, live Codex negative tests, timeout/outage tests, cross-machine execution, unattended automation, Cursor worker automation, deploy/tag/rollback, OpenClaw `agent main`, `codex resume`, Codex repo mutation.

**Invariant flags:** `n8n_ready=false`, `pm34_unblocked=false`.

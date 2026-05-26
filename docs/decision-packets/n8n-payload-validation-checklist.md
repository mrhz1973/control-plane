# n8n payload validation checklist

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/n8n-payload-validation-checklist.md`  
**Date:** 2026-05-26

## Status

- **DOCS-ONLY CHECKLIST**
- no runtime
- no n8n execution / UI / API / credentials
- no workflow 40/41 mutation
- no PM-34 unlock
- no wrapper or fixture changes

**Related:** [synthetic examples](synthetic-payload-validation-examples.md) · [hardening](n8n-payload-contract-hardening.md) · [design packet](n8n-payload-contract-design-packet.md) · [closeout](n8n-payload-contract-closeout.md)

---

## Pre-validation checks

Before field-level review, confirm:

- [ ] **Source session exists** — `source_session_path` points to a real file under `docs/sessions/` in repo (or documented synthetic path for examples only).
- [ ] **Source commit exists** — `source_commit` is a valid Git SHA on `main` (or marked synthetic with `payload_mode: synthetic` and no false claim).
- [ ] **Payload is synthetic or sanitized** — `payload_mode` is `synthetic` or `sanitized` only.
- [ ] **`schema_version` present** — matches `n8n-payload-v1` (or documented successor after gate).
- [ ] **`no_runtime_confirmation` is `true`** — not missing, not `false`.
- [ ] **`human_gate_required` explicit** — boolean present; `true` when status or next-step implies gate.

---

## Field allowlist check

Top-level keys must be **only** from this list (v1):

| Field | Required | Notes |
|-------|----------|-------|
| `schema_version` | yes | e.g. `n8n-payload-v1` |
| `request_id` | yes | Synthetic; no live n8n execution id |
| `status` | yes | Safe enum: `design_only`, `blocked`, `ready_for_manual_review` |
| `summary` | yes | Sanitized text |
| `recommended_next_step` | yes | Gate/docs language only |
| `human_gate_required` | yes | Boolean |
| `no_runtime_confirmation` | yes | Must be `true` |
| `blocked_actions` | optional | String array; no credential names |
| `risk_notes` | optional | Sanitized |
| `wrapper_trace` | optional | Boolean values only |
| `source_session_path` | yes | Repo-relative |
| `source_commit` | yes | SHA only |
| `generated_at` | yes | ISO-8601 |
| `payload_mode` | yes | `synthetic` \| `sanitized` |

**Omitted by design:** `proposed_prompt_for_cursor`, `codex_result`, live fixture absolute paths, workflow JSON.

- [ ] No keys outside allowlist
- [ ] `proposed_prompt_for_cursor` absent or null

---

## Denylist check

Reject if **any** category appears (key or value pattern):

| Category | Examples / patterns |
|----------|---------------------|
| **Secrets** | API keys, passwords, private keys |
| **OAuth** | `access_token`, `refresh_token`, `id_token`, auth codes |
| **Provider API keys** | OpenAI/Anthropic/OpenRouter/Gemini keys, `sk-…` |
| **PATs** | `ghp_…`, `github_pat_…` |
| **Webhooks** | Webhook URLs, signing secrets |
| **Chat IDs** | Telegram `chat_id`, bot token `id:secret` |
| **Tokenized URLs** | URLs with embedded tokens or auth query params |
| **Auth URLs** | OAuth authorize URLs with secrets in query |
| **n8n credentials** | Credential names, ids, stored secret values |
| **Workflow export JSON** | Full/partial n8n workflow graphs |
| **Execution IDs** | Live n8n execution id, Codex/OpenClaw session handles |
| **Unsanitized absolute paths** | `C:\…`, `/home/…`, `~`, `file://` |
| **Automation unlock language** | `pm34_unblocked: true`, `n8n_ready: true`, `auto_execute`, `unattended` |

- [ ] Recursive key scan — no denied keys at any depth
- [ ] Value pattern scan — no secret-shaped substrings in allowed fields

---

## Abort checklist

**Abort** payload construction or review if **any** apply:

- [ ] **n8n runtime implied** — execute workflow, call n8n API, `n8n_invoked: true`
- [ ] **Workflow 40/41 mutation implied** — publish, activate, import, edit production workflow
- [ ] **PM-34 unlock implied** — worker enablement, `pm34_unblocked: true`
- [ ] **Credential access implied** — read/write n8n or Telegram credentials
- [ ] **Provider key implied** — configure or use paid provider API from n8n
- [ ] **Unattended automation implied** — schedule, loop, or auto-execute without human gate
- [ ] **Evidence cannot be verified** — session path or commit does not exist when claimed as real

---

## Reviewer result

Future human or docs reviewer assigns **one** status after checklist completion:

| Status | Meaning |
|--------|---------|
| **pass** | All pre-validation, allowlist, denylist, and abort checks satisfied; safe for paper archive only |
| **needs_human** | Ambiguous status/next-step; requires explicit human decision before archive |
| **blocked** | Correct rejection — payload must not proceed; document reason |
| **fail** | Checklist incomplete or reviewer error; re-run validation |

**Note:** `pass` here does **not** authorize n8n runtime, workflow mutation, or PM-34 unlock.

---

## Remaining gates

Unchanged — see [closeout](n8n-payload-contract-closeout.md) and [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md).

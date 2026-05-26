# n8n payload contract hardening

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/n8n-payload-contract-hardening.md`  
**Date:** 2026-05-26

## Status

- **DOCS-ONLY HARDENING**
- no runtime
- no n8n execution
- no n8n UI / API / credential access
- no workflow 40/41 mutation
- no workflow import/export
- no PM-34 unlock
- no Codex execution
- no OpenClaw execution
- no wrapper or fixture changes
- no automation authorization

**Prerequisite:** [n8n payload contract design packet](n8n-payload-contract-design-packet.md) (v1 allowlist/denylist)  
**Related:** [n8n preflight boundary](n8n-preflight-boundary-design-packet.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Purpose

Tighten the v1 n8n-facing payload contract with **hardened invariants**, an expanded **denylist taxonomy**, formal **fail-closed validation behavior**, and explicit **payload safety guarantees** before any future runtime or preflight discussion.

This document does **not** authorize sending payloads to n8n, running preflight against n8n, or mutating production workflows.

---

## Hardened invariants

These rules are **mandatory** for any payload claiming conformance to `n8n-payload-v1` (or successor schema) in the current foundation phase.

| # | Invariant | Rule |
|---|-----------|------|
| I1 | `no_runtime_confirmation` | Field **must exist** and **must be boolean `true`**. Missing or `false` → **fail-closed abort**. |
| I2 | `payload_mode` | **Limited to** `synthetic` \| `sanitized` only. Any other value → **fail-closed abort**. (Design packet aliases `design_only` / `synthetic_fixture` / `redacted_sample` map to these two hardened modes: `design_only` → `synthetic`; `synthetic_fixture` / `redacted_sample` → `synthetic` or `sanitized` per redaction pass.) |
| I3 | `wrapper_trace` | When present, **only boolean values** allowed for all keys. Non-boolean → **fail-closed abort**. No nested objects, arrays, or strings inside `wrapper_trace`. |
| I4 | Source paths | `source_session_path` (and any path-like field) **repo-relative only**, under allowed roots (`docs/sessions/`, `docs/decision-packets/`, `docs/foundation/`). Leading `/`, drive letters (`C:\`, `D:\`), `~`, `\\`, or `file://` → **fail-closed abort**. |
| I5 | Denied fields | Any key matching the **hardened denylist** (any depth) → **fail-closed abort** — never strip-and-continue. |
| I6 | `human_gate_required` | **Required boolean** when `status` is `ready_for_manual_review`, `blocked`, or when `recommended_next_step` references a gate. For `design_only` / informational payloads, must still be explicit (`true` or `false`). |
| I7 | `proposed_prompt_for_cursor` | **Must be null or omitted**. Any non-null string value → **fail-closed abort**. |
| I8 | `wrapper_trace.n8n_invoked` | **Must be `false`** before a separate, explicit n8n runtime gate. `true` in current phase → **fail-closed abort**. |
| I9 | Contradictory status | e.g. `status: design_only` with `human_gate_required: false` but `recommended_next_step` implying runtime execution → **fail-closed abort**. |
| I10 | Schema version | `schema_version` must match declared contract (`n8n-payload-v1` until bump gate). Unknown version → **fail-closed abort**. |

### `wrapper_trace` required booleans (when object present)

| Key | Hardened default | Abort if |
|-----|------------------|----------|
| `n8n_invoked` | `false` | `true` without n8n runtime gate |
| `codex_invoked` | `false` | `true` without Codex runtime gate |
| `wrapper_modified_repo` | `false` | `true` |
| `pm34_unblocked` | `false` | `true` |
| `provider_api_key_used` | `false` | `true` |

Optional trace keys (`codex_transport_used`, `codex_resume_used`, `mock_codex_output_used`) — if present, **boolean only**; same fail-closed rules.

---

## Hardened denylist

Denylist applies to **keys and value patterns** at any nesting depth. Detection → **abort** (no partial redaction of denied keys in committed/sent payloads).

| Category | Denied (examples / patterns) |
|----------|------------------------------|
| **Secrets** | API keys, client secrets, passwords, private keys, signing secrets |
| **OAuth material** | `access_token`, `refresh_token`, `id_token`, authorization codes, OAuth URLs with embedded state/secret |
| **Provider API keys** | OpenAI, Anthropic, OpenRouter, Gemini, or any `sk-…`, `Bearer …` in values |
| **PATs** | `ghp_…`, `github_pat_…`, GitHub fine-grained tokens |
| **Credential references** | n8n credential names/ids, Telegram bot tokens, stored webhook secrets |
| **Webhook / chat identifiers** | Webhook URLs, `chat_id`, bot token patterns (`<id>:<secret>`) |
| **Workflow export JSON** | Full or partial n8n workflow JSON, node graphs, `active: true` export blobs |
| **Runtime execution IDs** | Live n8n execution id, OpenClaw session id, Codex session/resume handles |
| **Local unsanitized absolute paths** | `C:\…`, `/home/…`, `~/.…`, UNC paths, `file://` |
| **Raw prompts with secrets** | Any prompt field containing secret-shaped substrings; `proposed_prompt_for_cursor` (any non-null) |
| **Automation unlock fields** | `pm34_unblocked: true`, `n8n_ready: true`, `auto_execute: true`, `unattended: true`, `skip_human_gate: true` |
| **Workflow mutation hints** | Fields implying edit/publish/activate workflow 40 or 41 |
| **Provider routing** | Fields selecting paid provider endpoints from n8n |

**Fail-closed rule:** Unknown key matching sensitive naming heuristics (`*token*`, `*secret*`, `*credential*`, `*webhook*`, `*api_key*`, `*password*`, `*pat*`) → **abort** unless explicitly allowlisted in schema bump gate.

---

## Validation behavior

Validation runs **before serialization** (in-memory or pre-commit). Order is fixed; first failure stops.

| Step | Check | On failure |
|------|-------|------------|
| V1 | JSON/schema parse | Abort — malformed structure |
| V2 | `schema_version` known | Abort |
| V3 | Top-level keys ⊆ allowlist | Abort — unknown top-level key |
| V4 | Recursive denylist key scan | Abort — denied key at any depth |
| V5 | `no_runtime_confirmation` present and `=== true` | Abort |
| V6 | `payload_mode` ∈ `{ synthetic, sanitized }` | Abort |
| V7 | `wrapper_trace` values all boolean | Abort |
| V8 | `wrapper_trace.n8n_invoked === false` | Abort |
| V9 | `wrapper_trace.pm34_unblocked === false` | Abort |
| V10 | `wrapper_trace.provider_api_key_used === false` | Abort |
| V11 | `proposed_prompt_for_cursor` null or absent | Abort |
| V12 | Path fields repo-relative only | Abort |
| V13 | Status / `human_gate_required` / `recommended_next_step` consistency | Abort — contradictory |
| V14 | Value pattern scan (secret-shaped strings, URLs with tokens) | Abort |
| V15 | `recommended_next_step` does not imply forbidden runtime | Abort |

**Fail-closed principles:**

- **No** strip-and-continue for denied fields.
- **No** downgrade from abort to warning in foundation phase.
- **No** validation path that requires n8n to be running.
- **No** validation path that reads n8n credentials.

---

## Payload safety guarantees

The following guarantees apply to any payload conforming to this hardening packet in the **current foundation phase**:

| Guarantee | Statement |
|-----------|-----------|
| Informational only | Payload describes evidence or design state; it does **not** execute work. |
| No runtime authorization | Payload **cannot** authorize n8n execution, Codex invocation, or OpenClaw agent turns. |
| No PM-34 unlock | Payload **cannot** set or imply `pm34_unblocked` or worker enablement. |
| No workflow mutation | Payload **cannot** mutate, publish, import, or activate workflow **40** or **41**. |
| No automation creation | Payload **cannot** create schedules, webhooks, or unattended loops. |
| No credential access | Payload **cannot** imply reading or writing n8n/Telegram/GitHub credentials. |
| No provider API spend | Payload **cannot** route to paid provider APIs from n8n. |
| GitHub remains SoT | Operational truth stays on GitHub; payload is derivative documentation handoff only. |

Violating any guarantee in an actual send to n8n requires a **new explicit gate** — not implied by this document.

---

## Future safe scope

**Allowed** future direction (each still requires its own gate):

| Direction | Gate |
|-----------|------|
| Docs-only payload refinement | Human review |
| Synthetic validation examples (docs-only) | **Recommended next** — no n8n |
| Schema version bump discussion | Design packet |
| Redaction policy extension | Hardening revision |
| Manual checklist expansion | Docs-only |

**Still forbidden** without separate gates:

| Forbidden | Reason |
|-----------|--------|
| n8n runtime (UI/API/execute) | Production boundary |
| Workflow 40/41 mutation | Invariant |
| PM-34 unlock | Blocked track |
| Provider API key configuration | Policy |
| Unattended automation | Safety |
| Live payload preflight against VPS n8n | Not authorized |
| Wrapper/fixture changes in same gate | Scope separation |

---

## Recommended next step

**Synthetic payload validation examples (docs-only)**

Produce documented pass/fail example payloads (synthetic JSON only) that exercise V1–V15 without calling n8n, without mutating workflows, and without unlocking PM-34.

---

## Remaining gates

| Gate | Status |
|------|--------|
| n8n runtime | **Gated** |
| n8n payload preflight runtime | **Gated** |
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
| Wrapper/fixture changes | **Gated** (separate from this packet) |

This hardening packet does **NOT** open any gate above.

---

## Cross-reference — v1 allowlist (unchanged)

Top-level allowlist remains as defined in [n8n-payload-contract-design-packet.md](n8n-payload-contract-design-packet.md):  
`schema_version`, `request_id`, `status`, `summary`, `recommended_next_step`, `human_gate_required`, `no_runtime_confirmation`, `blocked_actions`, `risk_notes`, `wrapper_trace`, `source_session_path`, `source_commit`, `generated_at`, `payload_mode`.

Hardening **narrows** interpretation and validation; it does not add runtime fields.

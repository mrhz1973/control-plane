# n8n preflight boundary design packet

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/n8n-preflight-boundary-design-packet.md`  
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
- explicit gate required before any n8n preflight **runtime**

**Related:** [n8n-free local closeout](n8n-free-local-integration-readiness-closeout.md) · [Post-local-only hardening](post-local-only-integration-hardening.md) · [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md)

---

## Purpose

The [n8n-free local integration readiness closeout](n8n-free-local-integration-readiness-closeout.md) **closed the local-only phase on paper**. Cumulative wrapper and integration evidence exists; **n8n runtime remains unauthorized**.

This packet defines a **future n8n preflight boundary** — design and documentation only — for how control-plane might later describe a sanitized handoff from local wrapper output toward n8n **without** executing n8n, mutating workflows, or unlocking PM-34.

| Fact | Implication |
|------|-------------|
| Local phase closed | Prerequisite for n8n **design** discussion only |
| This packet | Boundary spec, not implementation |
| n8n runtime | Still **forbidden** |
| Workflow 40/41 | **Untouched** — no import/export/mutation in scope |
| PM-34 | **Gated** — no unlock |

---

## Future n8n preflight boundary means

When explicitly gated in the future, **n8n preflight** (design phase) would cover **docs/design only**:

| Topic | Design intent |
|-------|----------------|
| Wrapper → payload representation | Map bridge JSON to a **sanitized, synthetic** n8n-facing payload schema (no live n8n call) |
| Allowed n8n-facing fields | Status class, summaries, trace booleans, evidence paths, gate flags |
| Blocked / redacted fields | Secrets, credentials, tokenized URLs, raw OAuth, chat IDs, webhook URLs, provider keys |
| Operator evidence | Session record: payload sample (redacted), abort checklist, `git status` before/after |
| Fail-closed | Pre-send gate rejects payload if forbidden keys present or `n8n_invoked` would be required |

**Not in scope for preflight design:**

- Calling n8n HTTP API
- Opening n8n UI
- Reading or writing n8n credentials
- Triggering workflow executions
- Wiring wrapper to n8n at runtime

```text
local wrapper JSON (proven locally)
  → [future] sanitize/map to payload contract (paper only)
  → [future] preflight checklist (paper only)
  → STOP — no n8n execution until separate runtime gate
```

---

## Explicitly excluded

| Excluded | Notes |
|----------|-------|
| n8n runtime execution | No workflow runs, no webhooks fired |
| n8n API calls | No REST/CLI to VPS loopback or remote |
| n8n UI changes | No editor access as part of preflight |
| n8n credential inspection or mutation | No vault/token reads |
| Workflow 40/41 mutation | No touch ACTIVE/BACKUP workflows |
| Workflow import/export | No JSON wf changes in repo or VPS |
| PM-34 unlock | Real worker gated |
| Provider API key | Forbidden |
| OpenClaw `agent main` | Forbidden |
| `codex resume` | Forbidden |
| Codex repo mutation | Forbidden |
| Cursor worker automation | Forbidden |
| Deploy / tag / rollback | Forbidden |
| Unattended automation | Forbidden |
| Cross-machine execution | Out of first n8n preflight scope |

---

## Payload boundary

Future payload contract (to be detailed in next packet) must follow:

| Principle | Rule |
|-----------|------|
| Data class | Synthetic or **sanitized** only — derived from bridge output, not live secrets |
| Secrets | **None** — no API keys, PATs, passwords, OAuth blobs |
| URLs | No tokenized URLs; no webhook URLs; no signed links |
| Identifiers | No chat IDs; no execution IDs from live n8n unless synthetic fixture |
| Provider keys | No `openai_api_key` or equivalent |
| Required fields | `status`, `no_runtime_confirmation`, `human_gate_required` |
| Safety metadata | `blocked_actions`, `risk_notes` preserved when present |
| Trace | Wrapper trace booleans allowed (`n8n_invoked`, `codex_invoked`, etc.) — must reflect **false** for n8n until runtime gate |
| Evidence | Source session paths / commit refs only — **no secret content** |
| `proposed_prompt_for_cursor` | Must be `null` or omitted in any handoff payload |

**Abort payload construction** if any forbidden key appears or if payload implies n8n execution is required to proceed.

---

## Preflight questions for future design

| # | Question |
|---|----------|
| 1 | Which workflow, if any, would be **read-only referenced** in documentation (name/id only, no export)? |
| 2 | Is workflow 40/41 **read-only reference** enough, or should they remain **completely out of scope** until a separate wf gate? |
| 3 | What payload fields are **allowed** in v1 contract? |
| 4 | What payload fields **force abort** (hard deny list)? |
| 5 | Where is **sanitized evidence** recorded (`docs/sessions/` only)? |
| 6 | What confirms **no credential exposure** in sample payloads? |
| 7 | What confirms **no n8n execution** occurred (operator attestation + trace + clean git)? |
| 8 | What **operator gate** is required before any n8n preflight runtime (written run plan, forbidden list, abort conditions)? |

Default recommendation until answered: **workflows 40/41 remain out of scope** for first n8n payload contract; reference only as “untouched production wf” in status tables.

---

## Abort conditions

Abort future n8n preflight **design or runtime** if:

| Condition | Action |
|-----------|--------|
| Any secret appears in payload or session | STOP — redact; do not commit raw material |
| Workflow mutation requested | STOP |
| Credential access requested | STOP |
| PM-34 unlock appears in payload or plan | STOP |
| Provider API key appears | STOP |
| Unattended automation implied | STOP |
| n8n execution implied or required to validate design | STOP |
| Evidence cannot be verified (dirty workspace, missing trace) | STOP |

---

## Recommended next step

**n8n payload contract design packet (docs-only)**

**Rationale:** Before any n8n runtime preflight, define the exact payload contract, field allowlist/denylist, and redaction rules on paper.

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
| n8n preflight runtime | **Gated** — requires gate beyond this design packet |

This design packet does **NOT** open any gate above.

---

## Acceptance criteria (this packet)

- [x] Defines n8n preflight as design-only boundary
- [x] Lists exclusions and payload principles
- [x] Captures preflight questions for payload contract
- [x] Does not authorize n8n runtime or wf mutation
- [x] Recommends n8n payload contract design packet next
- [x] No runtime in this task

# n8n payload contract closeout

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/n8n-payload-contract-closeout.md`  
**Date:** 2026-05-26

## Status

- **DOCS-ONLY CLOSEOUT**
- no runtime
- no n8n execution / UI / API / credentials
- no workflow 40/41 mutation
- no PM-34 unlock
- no automation authorization
- no wrapper or fixture changes

This document **closes the n8n payload contract design phase on paper**. It does **not** open n8n runtime or payload preflight execution.

---

## Completed in this phase

| Artifact | Doc |
|----------|-----|
| n8n preflight boundary design | [n8n-preflight-boundary-design-packet.md](n8n-preflight-boundary-design-packet.md) |
| n8n payload contract design (v1) | [n8n-payload-contract-design-packet.md](n8n-payload-contract-design-packet.md) |
| n8n payload contract hardening | [n8n-payload-contract-hardening.md](n8n-payload-contract-hardening.md) |
| Synthetic payload validation examples | [synthetic-payload-validation-examples.md](synthetic-payload-validation-examples.md) |
| n8n payload validation checklist | [n8n-payload-validation-checklist.md](n8n-payload-validation-checklist.md) |
| This closeout | `n8n-payload-contract-closeout.md` |

Supporting sessions under `docs/sessions/2026-05-26-control-plane-n8n-*`.

---

## What is ready (paper-only)

- Payload field **allowlist** defined (v1 top-level keys)
- **Denied fields** and categories defined (design + hardening denylist)
- **Redaction rules** defined (`REDACTED_*` placeholders in design packet)
- **Abort conditions** defined (design + hardening V1–V15)
- **Synthetic examples** defined (valid + eight invalid deltas)
- **Validation checklist** defined (pre-validation, allowlist, denylist, abort, reviewer result)
- **Fail-closed validation behavior** formalized (hardening)
- **Payload safety guarantees** stated (informational only; cannot authorize runtime)

All of the above are validated by **documentation review**, not by calling n8n.

---

## What is not authorized

| Item | Status |
|------|--------|
| n8n runtime (UI / API / execute) | **Not authorized** |
| Workflow 40/41 mutation | **Forbidden** |
| PM-34 unlock | **Forbidden** |
| Credential access | **Forbidden** |
| Provider API key | **Forbidden** |
| OpenClaw `agent main` | **Forbidden** |
| `codex resume` | **Forbidden** |
| Codex repo mutation | **Forbidden** |
| Cursor worker automation | **Forbidden** |
| Deploy / tag / rollback | **Forbidden** |
| Unattended automation | **Forbidden** |
| Payload preflight runtime against VPS | **Gated** — separate gate |
| n8n read-only VPS inspection | **Gated** — next design packet only |

---

## Recommended next step

**n8n read-only preflight design packet (docs-only)**

**Rationale:** Before any runtime touch of n8n, define on paper whether a future step may **read-only inspect** n8n state (e.g. workflow list metadata, inactive export comparison) and what must remain excluded (credentials, execute, activate, Telegram send, Tailscale exposure change). This is design scope only — not VPS SSH, not n8n UI login, not API calls in this gate.

---

## Remaining gates

| Gate | Status |
|------|--------|
| n8n runtime | **Gated** |
| n8n read-only preflight runtime | **Gated** |
| Payload send to n8n | **Gated** |
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
| Wrapper/fixture changes | **Gated** (separate) |

This closeout does **NOT** open any gate above.

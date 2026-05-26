# Synthetic payload validation examples

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/synthetic-payload-validation-examples.md`  
**Date:** 2026-05-26

## Status

- **DOCS-ONLY EXAMPLES**
- no runtime
- no n8n execution / UI / API / credentials
- no workflow 40/41 mutation
- no PM-34 unlock
- synthetic payloads only
- no secrets
- no live execution IDs
- no workflow export JSON

**Related:** [n8n payload contract design](n8n-payload-contract-design-packet.md) · [hardening](n8n-payload-contract-hardening.md) · [validation checklist](n8n-payload-validation-checklist.md) · [closeout](n8n-payload-contract-closeout.md)

---

## Valid synthetic payload example

Paper-only JSON exercising the hardened allowlist. **Not** sent to n8n; **not** derived from live execution.

```json
{
  "schema_version": "n8n-payload-v1",
  "request_id": "synthetic-validation-pass-001",
  "status": "design_only",
  "summary": "Synthetic pass example for docs-only validation review. No runtime implied.",
  "recommended_next_step": "Proceed to n8n read-only preflight design packet docs-only under explicit human gate.",
  "human_gate_required": true,
  "no_runtime_confirmation": true,
  "blocked_actions": [
    "n8n runtime",
    "workflow 40/41 mutation",
    "PM-34 unlock",
    "provider API key",
    "unattended automation"
  ],
  "risk_notes": "Synthetic fixture; not derived from live n8n or wrapper output.",
  "wrapper_trace": {
    "n8n_invoked": false,
    "codex_invoked": false,
    "wrapper_modified_repo": false,
    "pm34_unblocked": false,
    "provider_api_key_used": false
  },
  "source_session_path": "docs/sessions/2026-05-26-control-plane-local-only-integration-dry-run.md",
  "source_commit": "f17f407",
  "generated_at": "2026-05-26T14:00:00Z",
  "payload_mode": "synthetic"
}
```

**Checks satisfied:**

| Requirement | Value |
|-------------|-------|
| `payload_mode` | `synthetic` |
| `no_runtime_confirmation` | `true` |
| `human_gate_required` | `true` |
| `wrapper_trace.n8n_invoked` | `false` |
| Secrets | none |
| Live execution IDs | none |
| Workflow export JSON | none |
| `source_session_path` | repo-relative under `docs/sessions/` |

---

## Invalid examples

Compact rejection cases. Each row is a **delta** against the valid example unless noted.

### 1. Missing `no_runtime_confirmation`

| Field | Value |
|-------|-------|
| Delta | Omit `no_runtime_confirmation` entirely |
| **Expected result** | **reject / fail-closed** |
| **Reason** | Invariant I1 — field must exist and be `true` (hardening V5) |

### 2. `provider_api_key` present

| Field | Value |
|-------|-------|
| Delta | Add top-level `"provider_api_key": "REDACTED_EXAMPLE"` |
| **Expected result** | **reject / fail-closed** |
| **Reason** | Denylist — provider API keys; sensitive key heuristic (hardening V4) |

### 3. `webhook_url` present

| Field | Value |
|-------|-------|
| Delta | Add `"webhook_url": "https://example.invalid/webhook/REDACTED"` |
| **Expected result** | **reject / fail-closed** |
| **Reason** | Denylist — webhook URLs; not on allowlist (hardening V3, V4) |

### 4. n8n execution implied

| Field | Value |
|-------|-------|
| Delta | `"wrapper_trace": { "n8n_invoked": true, ... }` or `recommended_next_step`: "Execute workflow 40 now" |
| **Expected result** | **reject / fail-closed** |
| **Reason** | Invariant I8 — `n8n_invoked` must be `false`; or contradictory status (hardening V8, V13, V15) |

### 5. Workflow 40 mutation implied

| Field | Value |
|-------|-------|
| Delta | `"recommended_next_step": "Publish and activate workflow 40"` or key `workflow_40_mutation: true` |
| **Expected result** | **reject / fail-closed** |
| **Reason** | Denylist — workflow mutation hints; abort on forbidden next-step language (hardening V15) |

### 6. PM-34 unlock implied

| Field | Value |
|-------|-------|
| Delta | `"wrapper_trace": { "pm34_unblocked": true, ... }` or `"pm34_unblocked": true` at top level |
| **Expected result** | **reject / fail-closed** |
| **Reason** | Denylist — automation unlock fields (hardening V9, V4) |

### 7. Local absolute path unsanitized

| Field | Value |
|-------|-------|
| Delta | `"source_session_path": "C:\\Users\\mrhz\\Documents\\AI\\GitHub\\control-plane\\docs\\sessions\\example.md"` |
| **Expected result** | **reject / fail-closed** |
| **Reason** | Invariant I4 — repo-relative paths only; no drive letters (hardening V12) |

### 8. `proposed_prompt_for_cursor` non-null

| Field | Value |
|-------|-------|
| Delta | `"proposed_prompt_for_cursor": "Run codex and commit"` |
| **Expected result** | **reject / fail-closed** |
| **Reason** | Invariant I7 — field must be null or omitted (hardening V11) |

---

## Validation rule summary

- **Allowlist fields only** at top level — unknown keys → abort.
- **Denylist always wins** — denied key at any depth → abort; no strip-and-continue.
- **Unknown sensitive fields fail-closed** — heuristic names (`*token*`, `*secret*`, `*credential*`, `*webhook*`, `*api_key*`) → abort unless schema bump.
- **Booleans must be booleans** — especially all `wrapper_trace` values.
- **Source paths repo-relative only** — under `docs/sessions/`, `docs/decision-packets/`, or `docs/foundation/`.
- **Payload cannot authorize runtime** — informational only; `no_runtime_confirmation: true` required.
- **`payload_mode`** limited to `synthetic` \| `sanitized`.
- **`n8n_invoked`** must remain `false` until separate n8n runtime gate.

---

## Next step

**n8n payload validation checklist (docs-only)** — see [n8n-payload-validation-checklist.md](n8n-payload-validation-checklist.md) (**DOCS COMPLETE** in batch `71e1dc6`).

Foundation current next: [n8n read-only preflight design packet (docs-only)](n8n-payload-contract-closeout.md#recommended-next-step).

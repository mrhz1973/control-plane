# n8n read-only runtime evidence template

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/n8n-read-only-runtime-evidence-template.md`  
**Date:** 2026-05-26

## Status

- **DOCS-ONLY TEMPLATE**
- no runtime
- no n8n access in this task
- no workflow mutation
- no PM-34 unlock
- no automation authorization

**Use when:** Operator has approved **Option A** and a separate runtime session runs under [runtime gate packet](n8n-read-only-runtime-gate-packet.md).  
**Related:** [operator decision](operator-decision-n8n-read-only-runtime-inspection.md) · [decision closeout](n8n-read-only-runtime-decision-closeout.md)

---

## Future evidence fields

Copy this structure into a future `docs/sessions/` runtime record. **Sanitize all values before commit.**

```yaml
decision_packet_path: docs/decision-packets/operator-decision-n8n-read-only-runtime-inspection.md
operator_choice: A  # A only for runtime; B/C = no runtime session
inspection_started_at: 2026-05-26T00:00:00Z  # ISO-8601 when session starts
inspection_ended_at: 2026-05-26T00:00:00Z
access_method: n8n_ui_workflows_list_only  # or n8n_api_get_workflows_list — must match operator approval
tier_observed: A  # must be A; abort if B or C
sanitized_workflow_count: 4
sanitized_workflow_metadata:
  - id: <REDACTED_WORKFLOW_ID>
    name: <REDACTED_WORKFLOW_NAME_IF_SENSITIVE>
    active: true
    updated_at: 2026-05-26T00:00:00Z
  # repeat for list rows only — no editor fields
n8n_version_string: <REDACTED_N8N_VERSION_IF_NEEDED>
credentials_touched: false
executions_touched: false
workflows_mutated: false
payload_sent: false
pm34_unlocked: false
evidence_redaction_notes: "List screenshot redacted; no credential panel opened."
git_status_before: ""  # paste git status --short output
git_status_after: ""
result: pass  # pass | needs_human | blocked | fail
```

| Field | Rule |
|-------|------|
| `decision_packet_path` | Repo-relative path to operator decision packet |
| `operator_choice` | **A** only for this template in runtime; B/C → do not use runtime template |
| `access_method` | Exact path documented in session prose |
| `tier_observed` | Must be **A** for PASS |
| `sanitized_workflow_metadata` | List-level only; use placeholders for ids/names |
| Boolean attestations | Must all be `false` except `result` evaluation |
| `result` | One of: `pass`, `needs_human`, `blocked`, `fail` |

---

## Redaction rules

| Rule | Detail |
|------|--------|
| No credential names/values | Never record n8n credential labels or ids |
| No webhook URLs | Omit or `<REDACTED_URL>` |
| No execution IDs | No run history identifiers |
| No workflow JSON export | No node graphs or export blobs |
| No screenshots with secrets | Redact locally; do not commit raw captures with tokens |
| Sanitize workflow names | Use `<REDACTED_WORKFLOW_NAME_IF_SENSITIVE>` when non-public |
| No chat_id / bot tokens | Telegram fields excluded |
| No VPS internal IPs in git | Unless already public in FOUNDATION_STATUS |

Placeholders align with [hardening](n8n-read-only-preflight-hardening.md): `<REDACTED_WORKFLOW_ID>`, `<NO_CREDENTIAL_ACCESS>`, `<NO_EXECUTION_HISTORY_ACCESS>`, `<NO_PAYLOAD_SENT>`.

---

## Abort markers

If **any** marker occurs during inspection, set `result: fail` or `blocked` and **abort** — do not commit unsanitized evidence.

| Marker | Meaning |
|--------|---------|
| Credentials visible | Credential panel opened or values on screen |
| Execution history opened | Executions tab or execution API queried |
| Workflow editor opened | Tier B — crossed from list |
| Export requested | Workflow JSON download or copy |
| Test / execute / activate / deactivate appears | Side effect attempted |
| Payload send appears | HTTP POST to n8n integration path |
| PM-34 unlock appears | Worker enablement language or `pm34_unblocked: true` |
| Evidence cannot be sanitized | STOP — local notes only |

---

## Recommended use

1. Operator approves **A** outside packet (record date in session header).
2. Runtime session uses this template + [runtime gate packet](n8n-read-only-runtime-gate-packet.md) PASS criteria.
3. Commit sanitized session doc only if `result: pass` or documented `fail`/`blocked` with no secrets.

This template does **not** authorize runtime by itself.

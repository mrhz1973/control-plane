# n8n read-only runtime inspection — Tier A

**Date:** 2026-05-26  
**Repo:** `mrhz1973/control-plane`  
**Branch:** `main`  
**Status:** **BLOCKED**  
**Operator decision:** **A** (approved one read-only inspection session)  
**Decision reference:** [operator-decision-n8n-read-only-runtime-inspection](../decision-packets/operator-decision-n8n-read-only-runtime-inspection.md)  
**Gate:** [n8n-read-only-runtime-gate-packet](../decision-packets/n8n-read-only-runtime-gate-packet.md)  
**Evidence template:** [n8n-read-only-runtime-evidence-template](../decision-packets/n8n-read-only-runtime-evidence-template.md)

---

## Inputs read

- `docs/foundation/PROJECT_VISION.md`
- `docs/foundation/FOUNDATION_STATUS.md`
- `docs/decision-packets/operator-decision-n8n-read-only-runtime-inspection.md`
- `docs/decision-packets/n8n-read-only-runtime-evidence-template.md`
- `docs/decision-packets/n8n-read-only-runtime-decision-closeout.md`
- `docs/decision-packets/n8n-read-only-runtime-gate-packet.md`

---

## Access method attempted

| Step | Result |
|------|--------|
| Preferred path | n8n UI **Workflows list page only** |
| Local probe | `http://127.0.0.1:5678` — **connection refused** (no n8n listener on PC lavoro) |
| Tailscale | **Not installed** on this host — no mesh path to VPS loopback n8n |
| Operator UI session | **Not available** — no pre-opened n8n tab or forwarded port in this session |
| n8n API list GET | **Not attempted** — would require credential/API key access; forbidden without explicit safe list-only path and available authorized key |

**Block reason:** Tier A list metadata cannot be observed from Cursor CONTROL PLANE (arancione) without operator opening n8n manually (UI on VPS/Ryzen with loopback access, or a documented read-only tunnel to workflows list only).

---

## Tier A metadata observed

**None.** Inspection did not reach n8n.

| Field | Value |
|-------|-------|
| `workflow_count` | `<NOT_OBSERVED>` |
| `sanitized_workflow_metadata` | `<NOT_OBSERVED>` |
| `n8n_version_string` | `<NOT_OBSERVED>` |
| `tier_observed` | N/A (blocked before Tier A) |

---

## Sanitized evidence table

| # | Item | Value |
|---|------|-------|
| 1 | `decision_packet_path` | `docs/decision-packets/operator-decision-n8n-read-only-runtime-inspection.md` |
| 2 | `operator_choice` | A |
| 3 | `inspection_started_at` | 2026-05-26T12:00:00Z (approx.) |
| 4 | `inspection_ended_at` | 2026-05-26T12:05:00Z (approx.) |
| 5 | `access_method` | `blocked_no_ui_path` |
| 6 | `tier_observed` | none |
| 7 | `sanitized_workflow_count` | `<NOT_OBSERVED>` |
| 8 | `n8n_version_string` | `<NOT_OBSERVED>` |
| 9 | `credentials_touched` | **false** |
| 10 | `executions_touched` | **false** |
| 11 | `workflows_mutated` | **false** |
| 12 | `payload_sent` | **false** |
| 13 | `pm34_unlocked` | **false** |
| 14 | `result` | **blocked** |

Attestations: `<NO_CREDENTIAL_ACCESS>` · `<NO_EXECUTION_HISTORY_ACCESS>` · `<NO_PAYLOAD_SENT>`

---

## Confirmation

| Check | Value |
|-------|-------|
| `credentials_touched` | **false** |
| `executions_touched` | **false** |
| `workflows_mutated` | **false** |
| `payload_sent` | **false** |
| `workflow_40_41_mutated` | **false** |
| `pm34_unlocked` | **false** |
| `provider_api_key_used` | **false** |
| `automation_started` | **false** |

No forbidden areas were opened. Inspection stopped at access boundary per gate packet.

---

## Git status before/after

**Before:**

```text
(clean)
```

**After (pre-commit):**

```text
 M docs/foundation/FOUNDATION_STATUS.md
?? docs/sessions/2026-05-26-control-plane-n8n-read-only-runtime-inspection-tier-a.md
```

---

## Remaining gates

| Gate | Status |
|------|--------|
| n8n Tier A observation | **BLOCKED** — access path required |
| n8n execute / import / export | **Gated** |
| Workflow 40/41 mutation | **Gated** |
| PM-34 unlock | **Gated** |
| Provider API key | **Forbidden** |
| Payload send | **Gated** |
| OpenClaw `agent main` | **Forbidden** |
| `codex resume` | **Forbidden** |
| Codex repo mutation | **Forbidden** |
| Cursor worker automation | **Gated** |
| Deploy / tag / rollback | **Forbidden** |
| Unattended automation | **Forbidden** |

---

## Next step

**Resolve n8n read-only inspection access method (docs-only)** — operator must provide one of:

1. Manual UI access to n8n **Workflows list only** on a host where n8n loopback is reachable (VPS/Ryzen), with sanitized list metadata pasted into a follow-up session; or  
2. A documented read-only tunnel to list view only (no editor/credentials/executions); or  
3. Explicit defer (**B**) / reject (**C**) if runtime access remains unavailable.

Do **not** retry with workflow editor, execution history, credentials, export, or payload send.

---

## Verification commands

```text
git branch --show-current
git status --short
git log -1 --oneline
git fetch origin main
git pull --ff-only origin main
git diff --check
git add docs/sessions/2026-05-26-control-plane-n8n-read-only-runtime-inspection-tier-a.md docs/foundation/FOUNDATION_STATUS.md
git commit -m "test: record n8n read-only inspection tier a"
git push origin main
git fetch origin main
git status --short
git log --oneline -5
```

**Commit hash after push:** `dcee5db`

---

## Attestation

| Check | Result |
|-------|--------|
| No workflow editor | Yes |
| No execution history | Yes |
| No credentials | Yes |
| No export / execute / payload | Yes |
| No wf 40/41 mutation | Yes |
| No PM-34 unlock | Yes |

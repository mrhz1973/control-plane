# n8n read-only runtime inspection Tier A — PASS

**Date:** 2026-05-26  
**Repo:** `mrhz1973/control-plane`  
**Branch:** `main`  
**Status:** **PASS** (manual operator observation — Tier A only)  
**Prior attempt:** [BLOCKED session](2026-05-26-control-plane-n8n-read-only-runtime-inspection-tier-a.md) (agent could not reach n8n from PC lavoro)

---

## Status

- **MANUAL RUNTIME INSPECTION — TIER A ONLY**
- UI Workflows list only
- no workflow editor opened
- no executions / logs opened
- no credentials opened
- no workflow export JSON
- no API call in this recording task
- no VPS SSH in this recording task
- no workflow execution / import / export
- no workflow 40/41 mutation
- no PM-34 unlock
- no payload sent to n8n
- no provider API key
- no unattended automation

**Gate:** [n8n-read-only-runtime-gate-packet](../decision-packets/n8n-read-only-runtime-gate-packet.md)  
**Evidence template:** [n8n-read-only-runtime-evidence-template](../decision-packets/n8n-read-only-runtime-evidence-template.md)

---

## Operator decision reference

| Item | Value |
|------|-------|
| Packet | [operator-decision-n8n-read-only-runtime-inspection](../decision-packets/operator-decision-n8n-read-only-runtime-inspection.md) |
| Option | **A** — approve one read-only n8n inspection session |
| Operator approval | Manual chat: **"OK proviamo"** |
| Recorded by | Docs-only session (Cursor CONTROL PLANE arancione) — agent did **not** open n8n |

---

## Exact access path

| Field | Value |
|-------|-------|
| Method | **UI — Workflows list page only** |
| Route observed | localhost loopback host, **`/home/workflows`** (Workflows list / Overview) |
| UI access | Operator-reported successful reach of Workflows list |
| API | **Not used** in inspection or this recording task |
| Tokenized URLs | **Not committed** |

---

## Tier A observed fields

| Field | Observed value |
|-------|----------------|
| `workflow_count` | **5** |
| `tier_observed` | **A** (list-level only) |
| `n8n_version_string` | **Not visible** from allowed Workflows list page; **not inspected further** |

### Workflow list (sanitized — operator-reported list columns)

| # | Name (as visible on list) | Active / status observed | Last updated | Created |
|---|---------------------------|--------------------------|--------------|---------|
| 40 | `40 - CP v4 multirepo + classifier bridge - ACTIVE` | **Published / active** | 4 days ago | 22 May |
| 41 | `41 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF` | **Backup / off**; no Published badge visible | 4 days ago | 22 May |
| — | `30 - CP handoff manual Telegram v1 - OFF` | OFF | (list row) | (list row) |
| — | `20 - CP v5 push webhook - OFF` | OFF | (list row) | (list row) |
| — | `01 - CP v4 single-repo polling - LEGACY OFF` | OFF | (list row) | (list row) |

**Operator attestation (not opened during inspection):** workflow editor, executions, credentials, export JSON, run/test/trigger, activate/deactivate, payload send, Telegram send, webhook test, credential access.

---

## Attestation

| Check | Value |
|-------|-------|
| Credentials untouched | `<NO_CREDENTIAL_ACCESS>` |
| Executions untouched | `<NO_EXECUTION_HISTORY_ACCESS>` |
| Workflows untouched | No save / publish / import / activate / deactivate |
| Payload not sent | `<NO_PAYLOAD_SENT>` |
| Sanitized evidence only | No screenshot binary committed |
| `credentials_touched` | **false** |
| `executions_touched` | **false** |
| `workflows_mutated` | **false** |
| `payload_sent` | **false** |
| `workflow_40_41_mutated` | **false** |
| `pm34_unlocked` | **false** |
| `provider_api_key_used` | **false** |
| `automation_started` | **false** |

---

## Result

| Outcome | Statement |
|---------|-----------|
| **PASS** | Tier A Workflows list reachability and list-level metadata observation |
| **NOT** | PM-34 unlock |
| **NOT** | `n8n_ready` or payload/runtime integration authorization |
| **NOT** | Authorization to mutate workflow **40** or **41** |
| **NOT** | Repeat inspection without new operator gate |

Meets gate packet criteria P1–P10 for **list-level observation only**.

---

## Remaining gates

| Gate | Status |
|------|--------|
| n8n payload preflight runtime | **Gated** |
| Workflow 40/41 mutation | **Gated** |
| PM-34 unlock | **Gated** |
| Provider API key | **Forbidden** |
| Live Codex negative tests | **Gated** |
| Timeout / outage / rate-limit runtime tests | **Gated** |
| Cross-machine execution | **Gated** |
| Unattended automation | **Forbidden** |
| Cursor worker automation | **Gated** |
| Deploy / tag / rollback | **Forbidden** |
| n8n execute / import / export | **Gated** |
| OpenClaw `agent main` | **Forbidden** |
| `codex resume` | **Forbidden** |
| Codex repo mutation | **Forbidden** |

---

## Recommended next step

Reconcile [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md) and continue **post-n8n-read-only-inspection hardening docs-only** (synthetic payload validation examples already **DOCS COMPLETE**). No further n8n runtime unless a new explicit gate is opened.

---

## Git status before/after

**Before recording task:**

```text
(clean)
```

**After (pre-commit):**

```text
 M docs/foundation/FOUNDATION_STATUS.md
?? docs/sessions/2026-05-26-control-plane-n8n-read-only-runtime-inspection-tier-a-pass.md
```

**Commit hash after push:** `89c3568`

---

## Recording task attestation

This commit records operator-reported evidence only. The Cursor agent did **not** open n8n UI, call n8n API, SSH to VPS, read credentials, open executions, export workflow JSON, execute workflows, mutate 40/41, unlock PM-34, or send payloads.

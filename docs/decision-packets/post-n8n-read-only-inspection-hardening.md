# Post-n8n-read-only-inspection hardening

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/decision-packets/post-n8n-read-only-inspection-hardening.md`  
**Date:** 2026-05-26

## Status

- **DOCS-ONLY HARDENING**
- based on manual Tier A PASS evidence
- no runtime executed in this task
- no n8n UI / API / credential access in this task
- no workflow execution / import / export
- no workflow 40/41 mutation
- no PM-34 unlock
- no payload sent to n8n
- no provider API key
- no unattended automation

**Prerequisite:** [Tier A PASS session](../sessions/2026-05-26-control-plane-n8n-read-only-runtime-inspection-tier-a-pass.md) · [runtime gate packet](n8n-read-only-runtime-gate-packet.md) · [operator decision](operator-decision-n8n-read-only-runtime-inspection.md)  
**Related:** [FOUNDATION_STATUS](../foundation/FOUNDATION_STATUS.md) · [prior BLOCKED attempt](../sessions/2026-05-26-control-plane-n8n-read-only-runtime-inspection-tier-a.md)

---

## What Tier A PASS proves

| # | Proven item | Evidence |
|---|-------------|----------|
| P1 | n8n Workflows list reachable by operator | Operator UI via localhost loopback tunnel/path to `/home/workflows` |
| P2 | Workflows list / Overview page observed | List columns visible without opening editor |
| P3 | Workflow count observed | **5** workflows on list |
| P4 | Workflow **40** state on list | **Published / active** — name visible on list row |
| P5 | Workflow **41** state on list | **Backup / off** — no Published badge visible |
| P6 | Additional list rows | Workflows 30, 20, 01 observed OFF on list |
| P7 | Sanitized metadata recordable in GitHub | Text evidence committed without secrets, tokens, or screenshot binaries |
| P8 | Constrained read-only observation feasible | When explicitly gated (operator Option **A**) and scoped to Tier A list only |
| P9 | Credentials / executions / editor not required for list PASS | Operator attestation: no credential panel, execution history, or workflow editor opened |
| P10 | `n8n_invoked` remains false for this docs chain | PASS session recorded observation only; no agent n8n contact in recording task |

**Invariant flags after PASS (unchanged):**

| Flag | Value |
|------|-------|
| `n8n_ready` | **`false`** — not set or implied by Tier A PASS |
| `pm34_unblocked` | **`false`** — Tier A does not unlock worker |
| Workflow 40/41 mutation | **none** — list observation only |

---

## What Tier A PASS does NOT prove

| # | Not proven | Reason |
|---|------------|--------|
| N1 | n8n payload preflight runtime | No payload sent; no preflight execution |
| N2 | n8n API readiness | API not used; no list GET with API key |
| N3 | Workflow 40/41 mutation authorization | Observation only; production wf untouched |
| N4 | Workflow execution safety | No run/test/trigger observed or authorized |
| N5 | PM-34 unlock | Real worker remains gated |
| N6 | Cursor worker automation | Not tested; remains gated |
| N7 | Codex repo mutation | Out of scope; remains forbidden |
| N8 | Unattended loop readiness | Manual operator gate only |
| N9 | Provider API key authorization | Not used; remains forbidden |
| N10 | `n8n_ready=true` | Must not be inferred from list PASS |
| N11 | n8n version string | **Not visible** from allowed list page — remains **unknown**, not guessed |
| N12 | Credential health | No credential panel opened |
| N13 | Execution history health | No executions tab opened |
| N14 | Webhook / Telegram path | No webhook test or Telegram send |
| N15 | Repeat observation without new gate | One approved session consumed |

---

## Hardening rules

| # | Rule | Enforcement |
|---|------|-------------|
| H1 | Tier A list observation may **not** be repeated without a **new explicit gate** | Operator approval + new session scope required |
| H2 | Any future n8n contact must **specify scope before access** | UI path or API endpoint documented in gate packet before runtime |
| H3 | List-only evidence remains **separate** from payload/runtime evidence | Do not merge Tier A PASS into payload preflight PASS |
| H4 | Workflow **40** is production | No casual open/edit/export/activate from inspection follow-ups |
| H5 | Workflow **41** is backup/off | No silent delete, import overwrite, or activate without separate gate |
| H6 | n8n version unknown stays unknown | Do not infer version from list PASS; About page is out of Tier A scope unless future gate allows |
| H7 | Screenshots not committed unless redacted and authorized | Prefer sanitized text evidence in `docs/sessions/` |
| H8 | Sanitized text evidence preferred | Placeholders for ids/URLs; no tokenized URLs in git |
| H9 | Agent recording tasks are docs-only | Cursor agent must not open n8n when recording operator evidence |
| H10 | BLOCKED then PASS is valid chain | Prior [BLOCKED session](../sessions/2026-05-26-control-plane-n8n-read-only-runtime-inspection-tier-a.md) documents access gap; PASS does not erase it |

---

## Gate matrix

| Gate | Status after Tier A PASS |
|------|--------------------------|
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
| Tier A re-inspection | **Gated** — new explicit operator gate required |
| n8n API list GET | **Gated** — not proven by UI list PASS |

This hardening packet does **NOT** open any gate above.

---

## Recommended next step

**n8n payload preflight dry-run design packet — docs-only**

| Property | Value |
|----------|-------|
| Scope | Design only — paper preflight dry-run scope, PASS/FAIL criteria, exclusions |
| Runtime | **Not authorized** |
| Payload send | **Forbidden** |
| n8n UI / API | **Not authorized** in design task |
| Workflow mutation | **Forbidden** |
| PM-34 unlock | **Forbidden** |
| wf 40/41 | **Untouched** |

Even the design packet does not authorize runtime until a separate explicit gate opens.

---

## Cross-reference — Tier A observed snapshot (sanitized)

From [Tier A PASS session](../sessions/2026-05-26-control-plane-n8n-read-only-runtime-inspection-tier-a-pass.md):

| Field | Value |
|-------|-------|
| `workflow_count` | 5 |
| Workflow 40 | Published / active |
| Workflow 41 | Backup / off (no Published badge) |
| Workflows 30, 20, 01 | OFF on list |
| `n8n_version_string` | Not visible — not inspected further |
| Access | UI Workflows list `/home/workflows` (localhost loopback) |

This table is **derivative documentation** — not a live n8n query in this hardening task.

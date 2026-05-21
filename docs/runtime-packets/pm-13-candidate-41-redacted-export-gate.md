# Runtime packet — PM-13: candidate `41` redacted export gate

**Packet ID:** `pm-13-candidate-41-redacted-export-gate`  
**Date:** 2026-05-21  
**Status:** **Prepared** — n8n export + commit **not authorized** by this packet alone.

**Related:** [PM-12 session PASS](../sessions/2026-05-21-control-plane-41-handoff-file-runtime-pass.md) · [pm-12 packet Gate H](pm-12-candidate-41-handoff-file-import-gate.md) · [PM11 design](../PM11_CANDIDATE_41_HANDOFF_FILE.md) · [WORKFLOW_EXPORT_STATUS.md](../WORKFLOW_EXPORT_STATUS.md) · [workflows/README.md](../../workflows/README.md) · [OBSERVABILITY.md](../OBSERVABILITY.md)

---

## Purpose

Freeze the **tested** n8n workflow

```text
41 - CP v4 multirepo + plan handoff file - CANDIDATE
```

as a **redacted, import-safe** JSON commit under `workflows/exports/`, after PM-12 runtime Gates **A–F PASS**.

**This packet does not:** export from n8n, commit JSON, promote **`41`→`40`**, or activate schedule on **`41`**.

---

## PM-12 state (prerequisite)

| Item | State |
|------|--------|
| **PM-12 runtime** | **PASS recorded** — [session](../sessions/2026-05-21-control-plane-41-handoff-file-runtime-pass.md) |
| **Gates A–F** | PASS (user evidence) |
| **Gate H (this packet)** | **Pending** — export + redact + commit |
| **Gate I (promotion)** | **Not authorized** — separate future packet |
| **Production** | **`40 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - ACTIVE`** — unchanged |
| **Candidate** | **`41`** — inactive; **not** production |

---

## Why redacted export before promotion

| Reason | Detail |
|--------|--------|
| **Criterion 4 hygiene** | Rebuild record for tested handoff-file branch |
| **Audit trail** | Git documents exact candidate that passed Manual Trigger |
| **Import safety** | `active: false` in repo; credentials as names/placeholders only |
| **Promotion discipline** | Do not promote to **`40`** without committed export + explicit Gate I |

---

## n8n target (exact)

| Field | Value |
|-------|--------|
| **Workflow name in export** | `41 - CP v4 multirepo + plan handoff file - CANDIDATE` |
| **Runtime state** | **Inactive** — no schedule publish on candidate |
| **Basis** | PM-12 PASS candidate (copy of `40` + handoff-file branch) |
| **Handoff path (reference)** | `/home/node/.n8n-files/latest-control-plane-handoff.md` |

---

## Next real gate — export from n8n UI (one step)

**Single action for first runtime session:** Export workflow **`41`** from n8n UI to local file — then **stop** before redaction commit.

| Step | Action |
|------|--------|
| 1 | Open n8n → workflow **`41 - CP v4 multirepo + plan handoff file - CANDIDATE`** |
| 2 | Confirm still **inactive** (schedule off) |
| 3 | Confirm **`40`** still **active/published** — do not export wrong workflow |
| 4 | **Download / Export** JSON to local staging (e.g. `41-unredacted-export-local-only.json`) |
| 5 | **Do not** commit unredacted file to git |

**Do not** in same session: activate `41`, run Execute, promote to `40`, or batch redaction + promotion.

---

## Committed file (target — not yet in repo)

| Field | Value |
|-------|--------|
| **Path** | `workflows/exports/2026-05-21_41-plan-handoff-file-candidate.redacted.json` |
| **Status** | **Pending** — file **does not exist** in git until Gate H completes |
| **JSON `name`** | `41 - CP v4 multirepo + plan handoff file - CANDIDATE` |
| **JSON `active`** | `false` (import-safe) |

---

## Redaction rules (mandatory)

| Remove or placeholder | Use |
|------------------------|-----|
| Bot token | Omit / never in git |
| Operational **chat_id** | `__CONFIGURE_CHAT_ID_IN_N8N_UI__` |
| n8n **credential IDs** | `__REDACTED_N8N_CREDENTIAL_ID__` |
| Webhook URL / secret / tunnel URL | Omit |
| Tokenized Telegram URLs | Omit |
| Execution payloads / pinned execution data | Strip |
| Binary / base64 blobs | Strip |
| Personal notes in static data | Strip |

| Allowed | Detail |
|---------|--------|
| **Credential names** | e.g. `CONTROL PLANE - Telegram Bot` — operational names documented elsewhere |
| **Data Table name** | `control_plane_state` |
| **Safe file paths** | `/home/node/.n8n-files/...` without secrets |
| **Public GitHub URLs** | Repo slugs and public blob paths only |

Add JSON metadata `redaction` note listing stripped fields (PM-08 pattern).

**Never commit:** `*.unredacted.json`, `41-unredacted-export-local-only.json`.

---

## Pre-commit JSON checklist (inspect full file)

- [ ] `"name": "41 - CP v4 multirepo + plan handoff file - CANDIDATE"` (exact)
- [ ] `"active": false` at workflow level
- [ ] No literal bot token
- [ ] No operational chat_id (placeholder only)
- [ ] No real credential UUIDs
- [ ] No webhook URL with secrets
- [ ] Handoff-file branch nodes present (write + Telegram doc path)
- [ ] `grep`/search: no `Bearer`, no `api.telegram.org/bot`, no private tunnel hosts with auth

---

## PASS criteria (Gate H complete)

Record PASS in docs when **all** true:

1. Redacted file committed at `workflows/exports/2026-05-21_41-plan-handoff-file-candidate.redacted.json`.
2. Pre-commit checklist **PASS**.
3. [WORKFLOW_EXPORT_STATUS.md](../WORKFLOW_EXPORT_STATUS.md) updated — PM-13 section **committed** (not pending).
4. Session note: `docs/sessions/YYYY-MM-DD-control-plane-41-redacted-export-commit.md`.
5. Production **`40`** still ACTIVE — no accidental replace in n8n.
6. **`41`** still inactive in n8n UI.
7. No secrets in committed JSON or session log.

**Criterion 4:** Strengthens rebuild record; does **not** relabel C1 PASS or strict 5/5 MVP.

---

## STOP criteria

| Condition | Action |
|-----------|--------|
| Export from **`40`** instead of **`41`** | Re-export correct workflow |
| Unredacted JSON staged for `git add` | Redact first; never commit |
| `active: true` left in committed JSON without explicit decision | Set `false` for import-safe default |
| Real chat_id/token in file | Re-redact; do not commit |
| Promotion to **`40`** in same session | STOP — Gate I is separate |
| Invented/fake JSON without n8n export | Do not commit — export from UI first |

---

## What NOT to do

- Open n8n as part of **this docs-only** commit
- Create or commit fake/invented workflow JSON
- Modify existing files under `workflows/exports/` (historical exports)
- Activate or schedule **`41`**
- Switch production **`40` → `41`**
- Touch GIS / dev-method / ALINA LAVORO
- Implementer auto-send; provider API; v5/webhook
- Batch export + promotion + docs in one unrecorded session

---

## After export commit (next gates)

| Order | Gate | Authorized |
|-------|------|------------|
| 1 | PM-13 export + redact + commit | **Next** — this packet Gate H |
| 2 | Optional: `Import from URL` smoke on **inactive** copy | Separate step |
| 3 | Gate I promotion `41` → `40` | **Future explicit packet only** — [pm-12 Gate I](pm-12-candidate-41-handoff-file-import-gate.md) |

---

## This commit (docs packet only)

| Item | State |
|------|--------|
| **PM-13 packet** | Committed (this file) |
| **Redacted JSON** | **Not in repo** until user runs n8n export gate |
| **Next real action** | Export **`41`** from n8n UI → redact → selective `git add` → commit |

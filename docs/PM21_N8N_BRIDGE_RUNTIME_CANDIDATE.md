# PM-21 — n8n bridge runtime candidate

**Status:** **Runtime PASS** (PM-21C) — commit `1f46c64`; see [session](sessions/2026-05-22-control-plane-pm21c-bridge-runtime-pass.md).

**Related:** [runtime packet](runtime-packets/pm-21-n8n-bridge-runtime-candidate-import-gate.md) · [PM20](PM20_N8N_BRIDGE_PACKET.md) · [session](sessions/2026-05-22-control-plane-pm21-n8n-bridge-runtime-candidate.md)

---

## Candidate workflow

| Field | Value |
|-------|--------|
| **Import file** | `workflows/exports/READY_IMPORT_42-classifier-bridge-candidate.json` |
| **n8n name** | `42 - CP v4 multirepo + classifier bridge - CANDIDATE OFF` |
| **active** | `false` |
| **Base** | `READY_IMPORT_40-control-plane-active-with-credentials.json` (unchanged on disk) |

---

## PM-21 branch (added)

After `IF - plan_detected?` **true**:

```text
Code - PM21 classifier decision  (deterministic pm17 JSON)
  → Code - PM21 bridge result     (pm19 dry_run_pass / gate_required)
  → Code - PM21 format Telegram bridge summary
  → Telegram - Send PM21 bridge summary
```

**Unchanged:** Gate D plan_detected text, plan file attachment, GIS handoff, commit dedupe.

---

## Boundaries

| Item | PM-21 |
|------|--------|
| **Production `40`** | **Not modified** in repo or n8n by this task |
| **Ollama** | **Not** called — deterministic Code classifier |
| **Codex** | **Not** invoked |
| **Provider API** | **Off** |
| **Credential ids** | Copied from READY_IMPORT_40 (real n8n ids) |

---

## Code node note (2026-05-22 fix)

PM-21 nodes use **`$json`** (not `$input.first()`) because `runOnceForEachItem` mode rejects `.first()`. Regenerate bundle after script changes: `node tools/build-ready-import-42-bridge-candidate.mjs`.

---

## First future test (one session)

1. Import **`42`** in n8n — keep **inactive**.
2. Confirm **`40`** still **Published/active**.
3. **Manual Trigger** on `42` or one plan smoke commit.
4. Expect Telegram: **CONTROL PLANE PM-21 bridge decision** (+ existing Gate D messages).
5. Leave **`42` inactive** after test unless explicit promotion gate.

**Runtime PASS** is **not** claimed until import gate evidence is recorded.

---

## Next

- Import inactive **`42`** + one smoke — [pm-21 packet](runtime-packets/pm-21-n8n-bridge-runtime-candidate-import-gate.md)
- **Not** combined with Codex CLI install in same session

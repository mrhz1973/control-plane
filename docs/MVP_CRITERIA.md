# MVP closure criteria

## Document role

| | |
|---|---|
| **Ruolo** | Definizione **canonica** dei 5 criteri MVP e di cosa significa PASS |
| **Cambia** | Solo se cambia la definizione di PASS per un criterio |
| **Stato corrente** | Vive in [MVP_STATUS.md](MVP_STATUS.md) |

Automation MVP is **closed** only when all five criteria below are true.

**Consolidated snapshot:** [MVP_STATUS.md](MVP_STATUS.md)

**Day 5 rule:** If all 5 are not true by Day 5, do **not** add Ollama on Day 6. Stabilize first.

---

## 1. Push notification latency

**Criterion:** Push su GIS Tool o dev-method → notifica Telegram al telefono utente entro 30 secondi

- **Status:** PARTIAL PASS / PENDING FINAL 30s WEBHOOK
- **Validated:** Telegram bot, n8n Telegram credential, manual Telegram workflow, GitHub latest-commit read, Data Table dedupe, and v4 one-minute controlled polling are working.
- **MVP provisional path:** `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4` is active and prevents duplicate Telegram notifications with `control_plane_state`.
- **Still PENDING for strict criterion:** sub-30-second delivery from GIS Tool or dev-method push. One-minute polling does not satisfy the strict 30-second requirement. Measure with [V4_POLLING_LATENCY.md](V4_POLLING_LATENCY.md).
- **Next likely gate:** GitHub webhook as a separate controlled runtime gate, if strict sub-30-second notification is required. Prerequisite: [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) (public HTTPS to n8n, or stay on v4 polling).
- **Verification method:** Push a commit to `dev-method` or `cursor-coordinate-converter`, then confirm Telegram message arrives on the user's phone within 30 seconds.

---

## 2. Handoff via n8n

**Criterion:** handoff-generate.mjs può essere invocato da n8n (manuale o webhook) e il risultato Prompt ready: yes/no arriva su Telegram

- **Status:** PASS
- **Validated:** n8n manual workflow `CONTROL PLANE - Handoff generate manual Telegram v1` invoked `handoff-generate.mjs`; Telegram delivered **`Prompt ready: yes`** on user's phone; exit code **0** (2026-05-20). See [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md).
- **Prerequisites documented:** local CLI PASS, container CLI PASS, `NODES_EXCLUDE=[]`, root `safe.directory` runtime fix.
- **Verification method:** Trigger the n8n workflow (manual or webhook), invoke `handoff-generate.mjs`, and confirm a Telegram message shows `Prompt ready: yes` or `Prompt ready: no`.

---

## 3. Three real end-to-end cycles

**Criterion:** Utente ha completato almeno 3 cicli reali end-to-end: handoff → implementer → commit → notifica

- **Status:** **PASS** — **3 / 3** (closed 2026-05-20)
- **Validated:**
  - Cycle 1 **PASS** — `mrhz1973/cursor-coordinate-converter`, commit **`34d543d`**
  - Cycle 2 **PASS** — `mrhz1973/dev-method`, commit **`5ce0a25`**
  - Cycle 3 **PASS** — `mrhz1973/dev-method`, commit **`0be529d`**
- **Documented:** [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md) (per-cycle log, closure rule), [MVP_STATUS.md](MVP_STATUS.md) (consolidated snapshot).
- **Still PENDING:** None for criterion 3; closed 2026-05-20. Overall MVP closure still pending criteria 1 and 5.
- **Verification method:** Three completed cycles documented with commit hash and Telegram **received** evidence — see [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md).

---

## 4. Workflow export in repo

**Criterion:** Workflow n8n esportato come JSON committato nel repo control-plane

- **Status:** PASS
- **Documented:** [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) — full inventory, canonical v4, inactive v5, historical v2 (failed dedupe), v3 manual PASS, redaction rules, runtime-vs-commit status.
- **Validated exports:** seven redacted JSON files under `workflows/exports/`; canonical provisional MVP export is v4 scheduled Data Table dedupe.
- **Runtime match:** PASS — active n8n workflow visually checked against committed redacted v4 export; see [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) for verified vs not-verified perimeter.
- **Handoff export:** `workflows/exports/2026-05-20_handoff-generate-manual-telegram-v1.redacted.json` (optional re-export if runtime differs).
- **Verification method:** A redacted workflow JSON file exists under `workflows/exports/` following the naming convention in [workflows/README.md](../workflows/README.md), and active runtime v4 matches the committed redacted export.

---

## 5. Rebuild instructions

**Criterion:** README control-plane con istruzioni per ricostruire il setup da zero se VPS muore

- **Status:** **PASS** (2026-05-20)
- **Validated:** Non-destructive **recovery drill** per [N8N_REBUILD.md](N8N_REBUILD.md) FIELD result — n8n UI, workflows present, `control_plane_state`, Telegram credential operational evidence, **active v4** duplicate-skip Manual Trigger smoke **PASS** (no second Telegram). **Clean VPS rebuild not performed** — accepted for MVP criterion 5 closure.
- **Documented:** [N8N_REBUILD.md](N8N_REBUILD.md) runbook + field validation checklist + 2026-05-20 evidence table.
- **Still PENDING:** None for criterion 5. **Overall MVP not 5/5** — criterion 1 remains **PARTIAL** ([MVP_STATUS.md](MVP_STATUS.md)).
- **Verification method:** Follow [N8N_REBUILD.md](N8N_REBUILD.md) FIELD checklist on clean VPS **or** documented recovery drill; record PASS evidence. Satisfied by 2026-05-20 recovery drill.

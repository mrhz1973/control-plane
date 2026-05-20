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

- **Status:** LOCAL + CONTAINER CLI PASS / EXECUTE COMMAND CONFIG FIX APPLIED / PENDING UI CHECK + TELEGRAM
- **Execute Command config fix applied** 2026-05-20 (`NODES_EXCLUDE=[]`); UI check and manual Telegram test still pending.
- **Validated (CLI only):** local and n8n-container dry-runs → **`Prompt ready: yes`**, exit code 0; no Telegram yet.
- **Still PENDING for closure:** n8n **workflow** manual trigger invokes the generator and Telegram delivers `Prompt ready: yes` or `Prompt ready: no` on the user's phone.
- **Verification method:** Trigger the n8n workflow (manual or webhook), invoke `handoff-generate.mjs`, and confirm a Telegram message shows `Prompt ready: yes` or `Prompt ready: no`.

---

## 3. Three real end-to-end cycles

**Criterion:** Utente ha completato almeno 3 cicli reali end-to-end: handoff → implementer → commit → notifica

- **Status:** DOCUMENTED / PENDING VALIDATION (0 / 3 PASS)
- **Documented:** [END_TO_END_CYCLES.md](END_TO_END_CYCLES.md) — valid/invalid cycle rules, minimum record fields, cycle log template, v4 polling as valid notification path, criterion 2 dependency, closure rule.
- **Still PENDING for closure:** three real cycles recorded with **esito: PASS** (handoff → implementer → commit pushed → Telegram received on phone).
- **Verification method:** Document three completed cycles with timestamps: handoff generated, implementer run, commit pushed, Telegram notification received.

---

## 4. Workflow export in repo

**Criterion:** Workflow n8n esportato come JSON committato nel repo control-plane

- **Status:** PASS
- **Documented:** [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) — full inventory, canonical v4, inactive v5, historical v2 (failed dedupe), v3 manual PASS, redaction rules, runtime-vs-commit status.
- **Validated exports:** seven redacted JSON files under `workflows/exports/`; canonical provisional MVP export is v4 scheduled Data Table dedupe.
- **Runtime match:** PASS — active n8n workflow visually checked against committed redacted v4 export; see [WORKFLOW_EXPORT_STATUS.md](WORKFLOW_EXPORT_STATUS.md) for verified vs not-verified perimeter.
- **Still pending outside criterion 4:** handoff workflow export after criterion 2 runtime exists.
- **Verification method:** A redacted workflow JSON file exists under `workflows/exports/` following the naming convention in [workflows/README.md](../workflows/README.md), and active runtime v4 matches the committed redacted export.

---

## 5. Rebuild instructions

**Criterion:** README control-plane con istruzioni per ricostruire il setup da zero se VPS muore

- **Status:** PARTIAL PASS / PENDING FIELD VALIDATION
- **Documented:** [N8N_REBUILD.md](N8N_REBUILD.md) — operational runbook (n8n prerequisites, Telegram credential, `control_plane_state`, v4 import, chat_id in UI, manual dedupe tests, v5 off, recovery scenarios, hard rules). [README.md](../README.md) links rebuild principle.
- **Still PENDING for closure:** follow the runbook on a clean VPS without prior state and confirm smoke test checklist passes in production.
- **Verification method:** Follow [N8N_REBUILD.md](N8N_REBUILD.md) and root [README.md](../README.md) on a clean VPS without prior state; smoke test passes.

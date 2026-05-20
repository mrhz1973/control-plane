# MVP closure criteria

Automation MVP is **closed** only when all five criteria below are true.

**Day 5 rule:** If all 5 are not true by Day 5, do **not** add Ollama on Day 6. Stabilize first.

---

## 1. Push notification latency

**Criterion:** Push su GIS Tool o dev-method → notifica Telegram al telefono utente entro 30 secondi

- **Status:** PARTIAL PASS / PENDING FINAL 30s WEBHOOK
- **Validated:** Telegram bot, n8n Telegram credential, manual Telegram workflow, GitHub latest-commit read, Data Table dedupe, and v4 one-minute controlled polling are working.
- **MVP provisional path:** `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4` is active and prevents duplicate Telegram notifications with `control_plane_state`.
- **Still PENDING for strict criterion:** sub-30-second delivery from GIS Tool or dev-method push. One-minute polling does not satisfy the strict 30-second requirement.
- **Next likely gate:** GitHub webhook as a separate controlled runtime gate, if strict sub-30-second notification is required. Prerequisite: [PUBLIC_WEBHOOK_GATE.md](PUBLIC_WEBHOOK_GATE.md) (public HTTPS to n8n, or stay on v4 polling).
- **Verification method:** Push a commit to `dev-method` or `cursor-coordinate-converter`, then confirm Telegram message arrives on the user's phone within 30 seconds.

---

## 2. Handoff via n8n

**Criterion:** handoff-generate.mjs può essere invocato da n8n (manuale o webhook) e il risultato Prompt ready: yes/no arriva su Telegram

- **Status:** DOCUMENTED / PENDING VALIDATION
- **Documented:** [HANDOFF_N8N_GATE.md](HANDOFF_N8N_GATE.md) — design for script contract, future n8n flow, Telegram message shape, runtime gate order, docs-only vs runtime boundary.
- **Still PENDING for closure:** real n8n invocation of `handoff-generate.mjs` and Telegram delivery of `Prompt ready: yes` or `Prompt ready: no` on the user's phone.
- **Verification method:** Trigger the n8n workflow (manual or webhook), invoke `handoff-generate.mjs`, and confirm a Telegram message shows `Prompt ready: yes` or `Prompt ready: no`.

---

## 3. Three real end-to-end cycles

**Criterion:** Utente ha completato almeno 3 cicli reali end-to-end: handoff → implementer → commit → notifica

- **Status:** PENDING
- **Verification method:** Document three completed cycles with timestamps: handoff generated, implementer run, commit pushed, Telegram notification received.

---

## 4. Workflow export in repo

**Criterion:** Workflow n8n esportato come JSON committato nel repo control-plane

- **Status:** PARTIAL PASS
- **Validated exports:** redacted Telegram manual test, GitHub latest commit manual notify, Data Table dedupe v3, and schedule-capable Data Table dedupe v4 exist under `workflows/exports/`.
- **Still PENDING for closure:** final production workflow export must match the runtime workflow after activation/configuration and be redacted before commit.
- **Verification method:** A redacted workflow JSON file exists under `workflows/exports/` following the naming convention in [workflows/README.md](../workflows/README.md).

---

## 5. Rebuild instructions

**Criterion:** README control-plane con istruzioni per ricostruire il setup da zero se VPS muore

- **Status:** PARTIAL PASS / PENDING FIELD VALIDATION
- **Documented:** [N8N_REBUILD.md](N8N_REBUILD.md) — operational runbook (n8n prerequisites, Telegram credential, `control_plane_state`, v4 import, chat_id in UI, manual dedupe tests, v5 off, recovery scenarios, hard rules). [README.md](../README.md) links rebuild principle.
- **Still PENDING for closure:** follow the runbook on a clean VPS without prior state and confirm smoke test checklist passes in production.
- **Verification method:** Follow [N8N_REBUILD.md](N8N_REBUILD.md) and root [README.md](../README.md) on a clean VPS without prior state; smoke test passes.

# MVP closure criteria

Automation MVP is **closed** only when all five criteria below are true.

**Day 5 rule:** If all 5 are not true by Day 5, do **not** add Ollama on Day 6. Stabilize first.

---

## 1. Push notification latency

**Criterion:** Push su GIS Tool o dev-method → notifica Telegram al telefono utente entro 30 secondi

- **Status:** PENDING
- **Prerequisite PASS:** local Telegram bot `sendMessage` verified (see [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)). Full push-triggered notification remains PENDING.
- **Still PENDING for this criterion:** GitHub webhook, n8n Telegram credential, n8n workflow, push-triggered notification, schedule trigger.
- **Verification method:** Push a commit to `dev-method` or `cursor-coordinate-converter`, then confirm Telegram message arrives on the user's phone within 30 seconds.

---

## 2. Handoff via n8n

**Criterion:** handoff-generate.mjs può essere invocato da n8n (manuale o webhook) e il risultato Prompt ready: yes/no arriva su Telegram

- **Status:** PENDING
- **Verification method:** Trigger the n8n workflow (manual or webhook), invoke `handoff-generate.mjs`, and confirm a Telegram message shows `Prompt ready: yes` or `Prompt ready: no`.

---

## 3. Three real end-to-end cycles

**Criterion:** Utente ha completato almeno 3 cicli reali end-to-end: handoff → implementer → commit → notifica

- **Status:** PENDING
- **Verification method:** Document three completed cycles with timestamps: handoff generated, implementer run, commit pushed, Telegram notification received.

---

## 4. Workflow export in repo

**Criterion:** Workflow n8n esportato come JSON committato nel repo control-plane

- **Status:** PENDING
- **Verification method:** A redacted workflow JSON file exists under `workflows/exports/` following the naming convention in [workflows/README.md](../workflows/README.md).

---

## 5. Rebuild instructions

**Criterion:** README control-plane con istruzioni per ricostruire il setup da zero se VPS muore

- **Status:** PENDING
- **Verification method:** Follow [N8N_REBUILD.md](N8N_REBUILD.md) and root [README.md](../README.md) on a clean VPS without prior state; smoke test passes.

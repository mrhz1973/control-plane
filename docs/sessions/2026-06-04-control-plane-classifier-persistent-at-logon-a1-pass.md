# Session — Classifier persistent at-logon (a.1) PASS

**Repository:** `mrhz1973/control-plane`  
**Date:** 2026-06-04  
**Type:** Runtime user-attested. **No runtime by Cursor.**

---

## 1. Context

- **a.1** makes the classifier-server on Ryzen **persistent at Windows logon** via Task Scheduler (`control-plane-classifier`), loopback only.
- Runtime executed manually by operator on Ryzen; Cursor records evidence only.
- **Not** loop automation — persistence only; stable n8n routing remains a later gate.

## 2. Evidence L1 — after real logout/login (no manual start)

Port **8765** in **LISTEN**, started by the task at logon.

```text
Get-NetTCPConnection 8765
127.0.0.1   8765   0.0.0.0   0   Listen   52560
```

OwningProcess **52560** is new: not manual PIDs **14488** / **30568**, not smoke PID **72712**.

```text
GET http://127.0.0.1:8765/healthz
status: ok
```

## 3. Evidence L2 — first POST /classify after login

Ollama warm; real case **"A"** from `tests/classifier-wrapper/cases.json`:

```json
{
  "risk": "low",
  "route": "auto_allowed",
  "reason": "The event involves a markdown cleanup in a non-sensitive directory with no flags indicating potential issues.",
  "confidence": "high",
  "requires_human": false
}
```

## 4. Fix — direct node.exe at logon (0xC000013A)

The direct `node.exe` task action died at logon with **0xC000013A** (`STATUS_CONTROL_C_EXIT`, console close).

**Final task action:**

```text
powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'tools\classifier-server-v1.mjs' -WorkingDirectory 'C:\Users\mrhz\Documents\AI\GitHub\control-plane' -WindowStyle Hidden"
```

Exported snapshot: `docs/runtime/control-plane-classifier.task.xml`.

## 5. Scope / red-line

- **Ryzen-only**, loopback **127.0.0.1:8765**.
- No auth (`CLASSIFIER_AUTH_TOKEN` unset).
- **No** VPS, tunnel, or n8n wiring in this gate.
- **Not** permanent loop automation.

## 6. Reversibility

```powershell
Unregister-ScheduledTask -TaskName "control-plane-classifier"
```

## 7. Conclusion

**a.1 classifier persistent at-logon = PASS ATTESTATO UTENTE.**

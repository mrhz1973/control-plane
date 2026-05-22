# PM-51 — Handoff nuova chat (OpenClaw confined gateway no-op probe)

> **Fonte canonica:** questo file in [mrhz1973/control-plane](https://github.com/mrhz1973/control-plane) — `docs/handoffs/pm-51-openclaw-confined-gateway-noop-probe-new-chat.md`
>
> **Mirror metodo:** dev-method commit `bb5693d` (`docs: add PM-51 new chat handoff`) — solo copia/disciplina metodo.
>
> **In caso di divergenza vince questo file in control-plane.**

**Status handoff:** PM-51 **PREPARED / NOT EXECUTED** — copiare intero file in nuova chat prima di qualsiasi azione runtime.

**Related:** [PM-51 gate](../PM51_OPENCLAW_CONFINED_GATEWAY_NOOP_PROBE_GATE.md) · [runtime packet](../runtime-packets/pm-51-openclaw-confined-gateway-noop-probe-gate.md) · [PM-50 PASS](../PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_PASS.md) · [PM-34 blocked](../runtime-packets/pm-34-n8n-codex-worker-integration-gate.md)

---

## 1. Identità

| Campo | Valore |
|-------|--------|
| **Progetto** | CONTROL PLANE / OpenClaw (track implementer bridge alternativo a Codex CLI runner) |
| **Repo operativo** | [mrhz1973/control-plane](https://github.com/mrhz1973/control-plane) |
| **Repo locale casa** | `C:\Users\mrhz\Documents\AI\GitHub\control-plane` — **unica macchina per eseguire PM-51** |
| **Repo locale lavoro** | `C:\Users\Utente\Downloads\Documents\AI\control-plane` — **solo docs-only** |
| **Orchestratore** | ChatGPT |
| **Lingua** | Italiano |

---

## 2. Stato corrente (non modificare senza gate esplicito)

| Item | Stato |
|------|--------|
| **PM-50** | **PASS** / RUNTIME MANUAL CONTROLLED |
| **PM-51** | **PREPARED / NOT EXECUTED** |
| **PM-34** | **BLOCCATO** |
| **Workflow 40** | **ACTIVE** (produzione CP) |
| **Workflow 41** | **BACKUP OFF** |
| **MVP C1** | **PARTIAL** (D-C1-A) |
| **MVP C2–C5** | **PASS** |

---

## 3. OpenClaw (post PM-50)

| Campo | Valore |
|-------|--------|
| **Versione** | OpenClaw **2026.5.20** (e510042) |
| **Comando Windows** | **`openclaw.cmd`** — non usare `openclaw.ps1` (ExecutionPolicy) |
| **Profile** | **control-plane** |
| **OAuth** | OpenAI Codex — **completato** (valore token **non** in git/chat) |
| **Modello default** | **openai/gpt-5.5** |
| **Gateway** | **127.0.0.1:18789** · mode **local** · auth **token** (valore **non** registrato) |
| **Browser sidecar** | **18791** |
| **Tailscale** | **OFF** |
| **Daemon / service** | **No** |
| **Worker** | **Non abilitato** |

**Prerequisito PM-51:** finestra PowerShell separata con gateway già avviato:

```powershell
openclaw.cmd --profile control-plane gateway
```

Lasciare la finestra **aperta** per tutta la durata del probe.

---

## 4. Macchine

| Macchina | Ruolo |
|----------|--------|
| **Casa — username `mrhz`** | **Unica macchina autorizzata** per eseguire PM-51 |
| **Lavoro — username `Utente`** | Solo docs/commit in control-plane — **non** eseguire OpenClaw/gateway/PM-51 |
| **dev-method** | Solo mirror metodo/docs (`bb5693d`) — **non** runtime PM-51 |

**Prima di PM-51 a casa verificare:**

```powershell
$env:USERNAME
Test-Path "C:\Users\mrhz\Documents\AI\GitHub\control-plane"
```

Entrambi devono confermare ambiente casa. Se `USERNAME` ≠ `mrhz` o path assente → **STOP**.

---

## 5. Vietato in PM-51 (e in questa chat fino a PASS esplicito)

- **n8n** — UI, API, import, attivazione workflow
- **Workflow 40 / 41** — nessuna modifica
- **Worker** Codex/OpenClaw — nessun enablement
- **Telegram**
- **OpenRouter / Gemini**
- **LAN / Tailscale / Funnel** — restare su loopback
- **Daemon / service install**
- **Codex CLI runner** (track PM-44…48) — fuori scope PM-51
- **Alina** — repo/progetto out of scope
- **GIS** — repo `cursor-coordinate-converter` watched; non pertinente a PM-51
- **DEV** — istanza Cursor/repo dev-method; solo metodo/docs, non runtime PM-51
- **Token / OAuth URL / session id** in chat o git

---

## 6. Obiettivo PM-51

Primo **no-op probe reale** del gateway OpenClaw confinato su loopback — **dopo** PM-50 PASS.

| Consentito | Non consentito |
|------------|----------------|
| `status`, health HTTP locale, netstat | Integrazione n8n |
| Probe read-only su `127.0.0.1:18789` | Mutazione repo/filesystem |
| Snapshot output **senza segreti** | Bridge automation (PM-52+) |

**PM-34 resta BLOCCATO** anche se PM-51 PASS.

---

## 7. Blocco PowerShell PM-51

> **Solo casa (`mrhz`).** Gateway già in ascolto su `127.0.0.1:18789` in finestra separata.

```powershell
Set-Location "C:\Users\mrhz\Documents\AI\GitHub\control-plane"

Write-Host "=== PM-51 OPENCLAW CONFINED GATEWAY NO-OP PROBE ===" -ForegroundColor Cyan

Write-Host "`nGIT STATUS:"
git status --short

Write-Host "`nCHECK OPENCLAW VERSION:"
openclaw.cmd --version

Write-Host "`nCHECK LOCAL GATEWAY LISTEN:"
netstat -ano | findstr 18789

Write-Host "`nONE LOCAL HTTP NO-OP PROBE:"
try {
  $response = Invoke-WebRequest -Uri "http://127.0.0.1:18789/health" -UseBasicParsing -TimeoutSec 5
  Write-Host "HTTP_STATUS:" $response.StatusCode
  Write-Host "BODY_PREVIEW:"
  ($response.Content | Select-Object -First 1)
} catch {
  Write-Host "HTTP_PROBE_ERROR:"
  Write-Host $_.Exception.Message
}

Write-Host "`nOPENCLAW STATUS SNAPSHOT:"
openclaw.cmd --profile control-plane status
```

---

## 8. Criteri PASS / FAIL (runtime futuro)

**PASS se tutti:**

1. Gateway raggiungibile su **127.0.0.1** (netstat + HTTP e/o `status`)
2. Nessun segreto in output committato o incollato in chat
3. Nessuna mutazione repo / n8n / worker
4. Workflow 40/41 non toccati

**FAIL se:** richiesta API key esterna, exposure LAN/Tailscale, azioni shell/repo, leak token/OAuth URL/session id, touch n8n/worker.

---

## 9. Dopo PM-51 (solo se PASS — gate separato)

1. Session doc in `docs/sessions/` (pattern PM-50)
2. Aggiornare [PM51 gate](../PM51_OPENCLAW_CONFINED_GATEWAY_NOOP_PROBE_GATE.md) e [MVP_STATUS](../MVP_STATUS.md)
3. **Non** sbloccare PM-34 automaticamente
4. Prossimo design: **PM-52** confined bridge

---

## 10. Prompt copiabile (incolla in nuova chat)

```text
CONTROL PLANE — PM-51 OpenClaw confined gateway no-op probe

Leggi prima (control-plane):
docs/handoffs/pm-51-openclaw-confined-gateway-noop-probe-new-chat.md
docs/PM51_OPENCLAW_CONFINED_GATEWAY_NOOP_PROBE_GATE.md
docs/PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_PASS.md

Regole: solo casa (mrhz); gateway già aperto; loopback only; no n8n/40/41/worker/Telegram/OpenRouter/Gemini; PM-34 blocked; no secrets in git/chat.

Esegui solo il blocco PowerShell §7 se operatore conferma gateway LISTENING.
```

---

*Handoff generato 2026-05-22 — PM-51 NOT EXECUTED.*

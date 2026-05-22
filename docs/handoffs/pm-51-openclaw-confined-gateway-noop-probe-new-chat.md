# PM-51 — OpenClaw confined gateway no-op probe — new chat handoff

> **Fonte canonica operativa:** questo file in [mrhz1973/control-plane](https://github.com/mrhz1973/control-plane) — `docs/handoffs/pm-51-openclaw-confined-gateway-noop-probe-new-chat.md`.
>
> **Mirror metodo/docs:** dev-method commit `bb5693d` (`docs: add PM-51 new chat handoff`) — **non** è fonte runtime.
>
> **In caso di divergenza vince questo file in control-plane.**

**Status handoff:** PM-51 **PREPARED / NOT EXECUTED**. Copiare l'intero file in nuova chat ChatGPT prima di qualsiasi azione runtime.

**Related (control-plane):** [PM-51 gate](../PM51_OPENCLAW_CONFINED_GATEWAY_NOOP_PROBE_GATE.md) · [runtime packet PM-51](../runtime-packets/pm-51-openclaw-confined-gateway-noop-probe-gate.md) · [PM-50 PASS](../PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_PASS.md) · [PM-34 blocked](../runtime-packets/pm-34-n8n-codex-worker-integration-gate.md) · [PM-49 feasibility](../PM49_OPENCLAW_OAUTH_BRIDGE_FEASIBILITY.md)

---

## 1. Titolo

**PM-51 — OpenClaw confined gateway no-op probe — new chat handoff**

---

## 2. Fonte canonica

- Questo file in `mrhz1973/control-plane` è la **fonte canonica operativa PM-51**.
- Il commit `bb5693d` in `mrhz1973/dev-method` (`docs: add PM-51 new chat handoff`) è **solo mirror/metodo/docs** e **non** è fonte runtime.
- Se i due file divergono, **vince questo file in control-plane**.

---

## 3. Ruolo nuova chat

| Ruolo | Dettaglio |
|-------|-----------|
| **Orchestratore operativo** | ChatGPT |
| **Esecutori** | Cursor / PowerShell — agiscono **solo** quando ChatGPT lo istruisce |
| **Lingua** | Italiano |

---

## 4. Formato obbligatorio risposta nuova chat

Ogni risposta della nuova chat ChatGPT deve terminare con **una sola** riga finale, scelta tra:

```
NEXT: <prossimo step concreto>
WAIT: <gate reale o output richiesto>
DONE: <chiuso, nessun prossimo step>
```

Mai più di una. Mai vuota.

---

## 5. Obiettivo unico

La nuova chat deve occuparsi **solo** di **PM-51 — OpenClaw confined gateway no-op probe**.

Niente altro: niente Codex CLI runner, niente n8n, niente Workflow 40/41, niente PM-34, niente bridge design (PM-52+), niente refactor docs estesi.

---

## 6. Macchina corretta per PM-51 — CASA

PM-51 si esegue **solo** sulla macchina di casa:

| Campo | Valore |
|-------|--------|
| Username Windows | **`mrhz`** |
| Repo locale | **`C:\Users\mrhz\Documents\AI\GitHub\control-plane`** |
| Gateway OpenClaw | Aperto in finestra PowerShell **separata**, **foreground** |

---

## 7. Macchina lavoro — NON eseguire PM-51

| Campo | Valore |
|-------|--------|
| Username Windows | **`Utente`** |
| Repo locale control-plane | **`C:\Users\Utente\Downloads\Documents\AI\control-plane`** |
| Uso ammesso | **docs-only** e controllo via Cursor |
| Gateway OpenClaw disponibile | **No** |
| PM-51 eseguibile | **No** |

---

## 8. Stato PM (riferimento)

| PM | Stato |
|----|-------|
| **PM-50** | **PASS / RUNTIME MANUAL CONTROLLED** |
| **PM-51** | **PREPARED / NOT EXECUTED** |
| **PM-34** | **BLOCCATO** |
| **PM-48** | **fallback preparato** — non strada principale |
| **PM-44** | **FAILED** (Codex local runner probe) — non riaprire |
| **PM-46** | **FAILED** (Codex runner v2, exit 2) — non riaprire |
| **PM-49** | **PASS** (OpenClaw OAuth bridge feasibility) |

---

## 9. Workflow n8n (riferimento)

| Workflow | Stato | Regola |
|----------|-------|--------|
| **40 - CP v4 multirepo + classifier bridge - ACTIVE** | **ACTIVE / produzione** | **Non toccare** |
| **41 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF** | **BACKUP OFF** | **Non cancellare, non toccare** |
| Altri (`30`, `20`, `01`) | OFF / legacy | Non pertinenti |

**PM-51 non usa n8n in nessuna forma** (no UI, no API, no import).

---

## 10. OpenClaw casa — configurazione validata in PM-50

| Campo | Valore |
|-------|--------|
| **Comando Windows** | **`openclaw.cmd`** — **non** usare `openclaw` senza `.cmd` (PowerShell colpirebbe `openclaw.ps1` e ExecutionPolicy bloccherebbe) |
| **Profilo** | **`control-plane`** |
| **Gateway locale** | **`127.0.0.1:18789`** |
| **Browser sidecar** | **`18791`** |
| **`gateway.mode`** | **`local`** |
| **`gateway.auth`** | **token persistente** — valore **segreto**, **non** in chat/git |
| **Daemon** | **Nessuno** |
| **Service** | **Nessuno** |
| **Worker** | **Non abilitato** |
| **Esposizione LAN / Tailscale / Funnel** | **Nessuna** |

Avvio gateway (finestra separata, **da lasciare aperta**):

```powershell
openclaw.cmd --profile control-plane gateway
```

---

## 11. Criteri PASS PM-51

PM-51 è **PASS** **solo se tutti** i seguenti sono veri:

1. `netstat -ano | findstr 18789` conferma `TCP 127.0.0.1:18789 ... LISTENING`
2. Richiesta locale innocua **oppure** `openclaw.cmd --profile control-plane status` restituisce output leggibile
3. Nessun token / API key richiesto durante il probe
4. Nessun n8n usato
5. Nessun worker abilitato
6. Workflow 40 / 41 non toccati
7. Nessun Telegram
8. Nessuna esposizione LAN / Tailscale / Funnel
9. Nessun file scritto dal probe runtime
10. Nessuna repo action / shell action tramite agente (solo operatore manuale)
11. Nessun segreto nell'output da registrare
12. Nessun provider esterno (OpenRouter / Gemini / GitHub PAT)

---

## 12. Criteri FAIL o invalid PM-51

PM-51 è **FAIL / invalid** se **anche uno solo** dei seguenti accade:

- `Connection refused` su `127.0.0.1:18789`
- Porta `18789` **non** in `LISTENING`
- **Timeout** della richiesta locale
- **HTTP 5xx** dal gateway
- Il probe **richiede API key** o provider esterno
- Richiesta credenziali OpenRouter / Gemini / Telegram / GitHub PAT
- Uso di **n8n** in qualsiasi forma
- Uso di **worker**
- Modifica / tocco di **workflow 40** o **41**
- **Esposizione** LAN / Tailscale / Funnel
- **Agent turn / tool action** automatica esegue il probe
- **Segreti** compaiono nell'output

---

## 13. Prima risposta desiderata della nuova chat

La nuova chat ChatGPT, alla prima interazione, deve **prima riconoscere la macchina**.

**Se l'utente è su PC lavoro (username `Utente`):**

- **Non** proporre il blocco PowerShell PM-51
- **Non** suggerire di aprire il gateway
- Chiudere con:
  ```
  WAIT: utente torni sulla macchina di casa prima di eseguire PM-51
  ```

**Se l'utente conferma di essere a casa (username `mrhz`):**

Chiedere **solo** questi tre controlli, uno per riga:

```powershell
$env:USERNAME
node --version
# verifica finestra gateway già aperta con:
#   openclaw.cmd --profile control-plane gateway
```

**Pass dei tre controlli:**

| Check | Valore atteso |
|-------|---------------|
| `$env:USERNAME` | **`mrhz`** |
| `node --version` | **`v22.19+`** oppure **`v24.x`** |
| Finestra gateway | aperta e foreground con `openclaw.cmd --profile control-plane gateway` in esecuzione |

Solo dopo questi tre OK → proporre il blocco PowerShell §14.

---

## 14. Blocco PowerShell PM-51

> **NON eseguire dal PC lavoro.** Eseguire **solo dalla macchina casa** (`mrhz`) **dopo** i tre controlli §13 e con gateway già `LISTENING` su `127.0.0.1:18789`.

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

## 15. Output da incollare dopo PM-51 — secret hygiene

La nuova chat deve chiedere l'**output integrale** del blocco §14, **ma deve ricordare esplicitamente** all'utente di **non** incollare nessuna delle seguenti stringhe / valori:

- `access_token`
- `refresh_token`
- `id_token`
- `Authorization`
- `Bearer`
- OAuth `code` / authorization URL completo
- API key / `api_key`
- Telegram bot token (`<id>:<segreto>`)
- GitHub PAT (`ghp_…`, `github_pat_…`)
- Qualsiasi URL con token in query string
- Qualsiasi `session_id` / `session` OpenClaw o ChatGPT
- Qualsiasi credenziale n8n

Se uno di questi valori compare nell'output del blocco PowerShell, l'utente deve **redarlo prima** di incollare (`<REDACTED>`).

---

## 16. Chiusura handoff

Quando l'utente nuova chat ha incollato l'handoff e confermato lettura, la chat deve:

1. Riconoscere la macchina (§13)
2. Chiudere con **una** riga `NEXT:` / `WAIT:` / `DONE:` (§4)

Niente azioni automatiche da parte di tool/agent.

---

*Handoff canonico generato 2026-05-22 — PM-51 NOT EXECUTED. Sorgente di verità: `mrhz1973/control-plane` `docs/handoffs/pm-51-openclaw-confined-gateway-noop-probe-new-chat.md`.*

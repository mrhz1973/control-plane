# Remote Invocation Transport — design (docs-only)

**Repository:** `mrhz1973/control-plane`  
**Task:** D-0031-W (Option 2 design-first)  
**Date:** 2026-06-08  
**Status:** Design only. **Not wired.** **No services started.** **No runtime.**

**Related:** [`AUTOMATIC_POST_PUSH_VERIFIER.md`](AUTOMATIC_POST_PUSH_VERIFIER.md) · [`tools/runtime-post-push-verifier.ps1`](../../tools/runtime-post-push-verifier.ps1) · [`PROJECT_VISION.md`](../foundation/PROJECT_VISION.md) §7.6 · §7.7

---

## 1. Scopo e NON-scopo

### Scopo

Definire **come**, in una futura attivazione separata, la **VPS** (n8n) potrebbe ottenere l'esito del **runtime post-push verifier** eseguito sul **nodo Ryzen** (`<node>`), senza implementare nulla in questo task.

Il verifier esistente (`tools/runtime-post-push-verifier.ps1`) è **read-only**, emette JSON strutturato e exit code coerente. Questo documento copre solo il **trasporto** e i **vincoli di invocazione** tra `<vps>` e `<node>`.

### NON-scopo (esplicito)

| Vietato in questo task / finché non gated | Stato |
|-------------------------------------------|--------|
| Avviare o configurare servizi (sshd, listener, firewall) | **Non fatto** |
| Creare/modificare workflow n8n | **Non fatto** |
| HTTP wrapper / webhook pubblico / Funnel / Telegram Trigger | **Non fatto** |
| Sbloccare PM-34 | **BLOCKED** |
| Impostare `n8n_ready=true` | **false** |
| Avviare loop operativo permanente | **NOT ACTIVE** |
| Segreti, chiavi, hostname Tailscale reali in Git | **Vietato** |
| Remote command execution arbitraria | **Vietato** — solo invocazione verifier |

**Pezzi collegati ≠ loop avviato.** Questo doc **non attiva** nulla.

---

## 2. Direzione della chiamata

### (A) VPS → inbound sul nodo (listener SSH sul Ryzen)

```
<vps> (n8n) ──SSH──► <node> (Ryzen)
                      └── esegue verifier
                      └── ritorna JSON
```

| Pro | Contro |
|-----|--------|
| VPS controlla timing (push → verify immediato) | **Superficie inbound a casa**: porte/servizi in ascolto sul Ryzen |
| Modello familiare (remote exec) | Espone il nodo domestico anche su tailnet-only |
| | Richiede hardening continuo del listener |
| | Se nodo offline, VPS deve gestire timeout/retry |

**Superficie inbound a casa:** ≠ zero (anche bind tailnet-only resta un listener attivo sul nodo).

### (B) Nodo → VPS push — **RACCOMANDATA**

```
<node> (Ryzen) ──connessione outbound──► <vps>
     │                                      └── riceve JSON risultato
     └── esegue verifier localmente
     └── push esito (file drop / API interna / coda)
```

| Pro | Contro |
|-----|--------|
| **Zero listener inbound a casa** sul Ryzen | Timing meno immediato (nodo deve poll/trigger locale) |
| Coerente con fallback graceful: nodo offline → VPS non riceve nulla | Richiede meccanismo di deposito esito su VPS |
| Nodo inizia sempre la connessione (outbound-only) | |
| Verifier gira **localmente** sul clone git del nodo (path corretto) | |

### Raccomandazione: **(B)**

Motivazione:

1. **Superficie inbound a casa = zero** — nessun sshd/listener sul Ryzen per questo use case.
2. **Fallback graceful naturale** (`PROJECT_VISION.md` §7.6): se `<node>` è offline o Tailscale down, `<vps>` semplicemente **non riceve** un risultato — degrada a verify manuale / Telegram gate, **senza** inventare PASS.
3. Il verifier **deve** girare sul nodo dove risiede il clone operativo e le credenziali git locali (read-only fetch).
4. Allineato al principio già usato per n8n su VPS (`127.0.0.1`) e mesh privata: connessioni **iniziate** dal componente che ha il workload locale.

**Nota:** `<vps>` può ancora **richiedere** verify indirettamente (es. scrivendo un flag su GitHub o Data Table che il nodo legge), ma la **connessione di rete** parte dal nodo.

---

## 3. Trasporto

### Vincoli assoluti

| Vincolo | Regola |
|---------|--------|
| Rete | **Solo Tailscale** (interfaccia tailnet). Mai LAN esposta. Mai internet pubblico. **No Funnel.** |
| Bind | Se mai si usasse un servizio di deposito su `<vps>`, bind **solo** su `<tailnet-ip>` del VPS, non `0.0.0.0` pubblico |
| SSH (solo se Option A in futuro) | Key-based **only**; no password auth; bind **solo** interfaccia tailnet; AllowUsers/forced-command limitato al verifier |
| Invocazione | **Solo** `tools/runtime-post-push-verifier.ps1` (o wrapper equivalente read-only). **Mai** shell arbitraria |
| Output | JSON strutturato + exit code; nessun segreto nel payload |

### Placeholder topologia (nessun identificatore reale)

```
Tailnet (privata)
├── <vps>     — n8n, eventuale ricevitore esito verify
└── <node>    — Ryzen, clone control-plane, verifier locale
```

Comunicazione: `<node>` → `<vps>:<tailnet-port>` (outbound), protocollo da definire in gate runtime (es. scp one-shot, HTTP su tailnet-only, n8n webhook **interno** tailnet — **non** pubblico).

### Cosa il trasporto **non** fa

- Non espone GitHub webhook al nodo
- Non crea tunnel pubblici
- Non memorizza token in Git
- Non esegue comandi diversi dal verifier

---

## 4. Threat model

### Superficie per direzione

| Scenario | (A) VPS→inbound nodo | (B) nodo→VPS push |
|----------|----------------------|-------------------|
| Attaccante su tailnet | Può tentare connessioni al listener SSH sul nodo | Può tentare inviare esiti falsi al ricevitore VPS |
| Chiave Tailscale compromessa | Accesso tailnet; se (A), possibile SSH se non hardened | Accesso tailnet; può spedire JSON fake a VPS |
| Nodo compromesso | Attaccante già locale — può falsificare verify | Stesso — può inviare JSON fake |
| VPS compromessa | Può triggerare verify remoto (A) o accettare fake (B) | Può accettare/registrare esiti fake |

### Mitigazioni (design)

1. **Verifier read-only** — anche con invocazione riuscita, il danno è limitato a: fetch git, ls-remote, JSON. **Nessun** commit/push/n8n/workflow dal verifier.
2. **VPS non tratta JSON come PASS assoluto** — deve correlare `expected_task_commit` con GitHub `origin/main` indipendentemente (come già fa il verifier locale).
3. **(B) Autenticazione esito** — futuro gate: HMAC shared secret **solo in n8n UI**, firma JSON, replay window; **non** in Git.
4. **Tailscale ACL** — limitare `<vps>` ↔ `<node>` alle sole porte necessarie.
5. **No arbitrary RCE** — forced command / allowlist unico script.

### Cosa il nodo può / non può fare

| Può | Non può |
|-----|---------|
| Eseguire verifier sul clone locale | Eseguire comandi arbitrari via design (B) |
| Fetch/ls-remote git read-only | Modificare wf40/41/42 o exports |
| Inviare JSON esito a VPS | Sbloccare PM-34 o impostare `n8n_ready=true` |
| Degradare silenziosamente se offline | Inventare PASS senza verify reale |

---

## 5. Fallback graceful (§7.6)

Ogni failure **degrada** a percorso manuale; **nessuno** stato inventato fuori da GitHub.

| Failure | Comportamento VPS/n8n | Fallback umano |
|---------|----------------------|----------------|
| `<node>` offline | Nessun esito ricevuto; timeout; **no PASS** | Prompt Cursor verify-only; `LAST_HANDOFF_VERIFY.md`; shell utente (finale) |
| Tailscale down | Stessa connessione impossibile | Idem |
| Verifier exit 1 (FAIL) | Registra JSON FAIL; Telegram / Decision Packet | Diagnosi; nessuna automazione downstream |
| Verifier crash / JSON malformato | Trattare come FAIL; `failure_reasons` include `verifier_exception` | Retry manuale |
| GitHub unreachable dal nodo | Verifier FAIL (`git_fetch_failed`, ecc.) | Verify-only Cursor |
| Esito mai arrivato entro TTL | **Non** assumere PASS | Orchestratore legge GitHub + report; verify-only |

**Regola:** assenza di esito ≠ PASS. Coerente con `PROJECT_VISION.md` §8.1 e `LAST_HANDOFF_VERIFY.md`.

---

## 6. Attestazione invarianti (termine documento)

| Invariante | Stato |
|------------|--------|
| PM-34 | **BLOCKED** |
| `n8n_ready` | **false** |
| HTTP wrapper wired | **No** |
| Servizi avviati (sshd, listener, n8n workflow nuovo) | **No** |
| Workflow n8n modificati | **No** |
| Loop operativo permanente | **NOT ACTIVE** |
| Segreti in Git | **No** |
| Hostname Tailscale / IP tailnet reali in Git | **No** (solo placeholder) |

---

## 7. Decision Packet BOZZA (NON approvato)

> **Formato §7.7 — bozza only.** Questo documento **non attiva** nulla. Richiede gate runtime separato + approvazione umana.

```yaml
decision_id: D-0032-W
kind: runtime
status: DRAFT — NOT APPROVED
title: Attivazione trasporto remoto verifier nodo→VPS
context: D-0031-W design; verifier hardened; Option B raccomandata
```

### Opzioni (2–3)

| Opzione | Descrizione | Rischio |
|---------|-------------|---------|
| **1 — Status quo** | Nessun trasporto; verify manuale / Cursor verify-only | Basso; micro-interazione umana resta |
| **2 — (B) nodo push esito a VPS, Manual Trigger n8n** | Nodo esegue verifier on schedule/push-hook locale; deposita JSON su VPS tailnet-only; n8n Manual Trigger inactive by default | Medio; richiede credenziale n8n UI, ACL tailnet |
| **3 — (A) VPS SSH inbound tailnet-only** | VPS trigger SSH forced-command verifier su nodo | Medio-alto; superficie inbound a casa |

### Raccomandazione (bozza)

**Opzione 2** — coerente con raccomandazione §2; zero inbound a casa; fallback graceful se nodo offline.

### Cosa NON viene fatto (qualsiasi opzione finché non approvato)

- PM-34 unlock
- `n8n_ready=true`
- Webhook pubblico / Funnel / Telegram Trigger permanente
- HTTP wrapper esposto su internet
- Remote shell arbitraria
- Modifica wf40/41/42/45–49/56
- Segreti in Git
- Loop operativo permanente senza kill switch

### Prossimo gate (se approvato in futuro)

1. Decision Packet D-0032-W approvato da umano
2. Implementazione test-safe Opzione 2: script push one-shot + n8n Manual Trigger **inactive**
3. User-attested PASS session
4. **Non** auto-promuovere a schedule permanente

---

**Fine documento — design only, not wired.**

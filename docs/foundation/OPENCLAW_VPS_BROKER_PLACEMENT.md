# OPENCLAW VPS BROKER PLACEMENT — Foundation Addendum

**Repository:** `mrhz1973/control-plane`  
**Stato:** `ACCEPTED_TARGET_DESIGN — PLANNING/DOCS ONLY`  
**Decisione operatore:** 2026-08-26  
**Runtime autorizzato da questo documento:** **NO**  

## 0. Decisione

Per l'architettura target v3, **OpenClaw viene collocato canonicamente sul VPS IONOS**, vicino a n8n, come broker sempre disponibile per provider/auth/quota/failover.

L'installazione OpenClaw già verificata sul PC Windows resta valida come **ambiente di test / fallback / evidence**, ma non è il target runtime canonico del control-plane.

Questa decisione modifica la **placement topology** del metodo di lavoro, non i ruoli canonici già definiti in `PROJECT_VISION.md` e `MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`.

## 1. Topologia target

```text
OPERATORE
   ↓
GPT Web — strategic orchestrator / backlog owner
   ↓
GitHub — source of truth
   ↓
VPS IONOS
   ├─ n8n — workflow / deterministic policy / gates
   └─ OpenClaw — provider/auth/quota/failover broker, 24/7 target
        ├─ Codex OAuth
        ├─ GLM / Z.AI
        └─ provider routing / usage / failover
              ↓ Tailscale/private transport when local execution is needed
PC Windows
   ├─ Cursor — implementation/execution harness
   ├─ Bugbot — review
   └─ Ollama / Qwen 3.8 37B — local planner/advisor when available
```

## 2. Placement rules

### 2.1 VPS

Target VPS:

- n8n resta workflow/policy/gate engine;
- OpenClaw resta broker, non orchestratore strategico;
- Codex OAuth e GLM/Z.AI possono essere usati anche quando il PC locale è spento;
- usage/quota/provider state può essere osservato centralmente;
- OpenClaw non deve essere esposto come endpoint pubblico non autenticato;
- preferire localhost/Tailscale/private transport e least exposure.

### 2.2 PC Windows

Restano locali:

- Cursor;
- filesystem/terminale/tooling di implementazione;
- Bugbot/integrationi Cursor;
- Ollama / Qwen locale;
- eventuale OpenClaw locale come test/fallback, non come broker canonico 24/7.

### 2.3 Qwen

Qwen 3.8 37B **non viene spostato implicitamente sul VPS**. Il modello locale resta sul nodo Windows/GPU e viene usato quando il PC è disponibile e la policy lo consente.

OpenClaw VPS può considerare il nodo locale come capability disponibile via canale privato, ma nessun local-worker protocol o routing runtime è dichiarato operativo finché non verificato con evidence dedicata.

## 3. OAuth e credenziali

L'OAuth Codex già verificato sul PC Windows è **evidence di compatibilità**, non autorizzazione a copiare token o auth state sul VPS.

Regole:

- nessun token OAuth viene copiato manualmente dal PC al VPS;
- l'eventuale auth Codex sul VPS richiede un gate separato e un login/provider setup sul VPS;
- GLM/Z.AI credential/config write richiede gate separato;
- nessun secret viene persistito in GitHub;
- billing/provider changes restano gate umano.

## 4. Sequenza di adozione

1. **Discovery VPS read-only** via `ssh ionos-n8n`: OS, risorse, Node/npm, OpenClaw presence/version, Tailscale, porte/processi, n8n coexistence.
2. Se il VPS è compatibile: preparare Decision Packet per eventuale install/update/config OpenClaw.
3. Installazione/config/runtime del broker VPS solo dopo gate esplicito.
4. Verificare provider Codex OAuth e GLM/Z.AI sul VPS separatamente.
5. Eseguire planner smoke sul broker VPS.
6. Solo dopo evidence: wiring n8n → OpenClaw e, separatamente, OpenClaw/n8n → Cursor locale via Tailscale.

## 5. Cosa viene deferito

La precedente proposta di eseguire subito il primo `openclaw agent --local` smoke sul PC è **deferita**, non cancellata. Può essere riutilizzata come fallback/evidence locale se serve, ma la priorità passa alla verifica del broker VPS canonico.

## 6. Hard boundaries invariati

Questa decisione NON autorizza:

- installazione o update OpenClaw sul VPS;
- start/restart/install di gateway/service/scheduled task;
- apertura porte/firewall/reverse proxy;
- copia di token OAuth;
- login OAuth sul VPS;
- GLM/Z.AI credential write;
- n8n workflow/runtime mutation;
- public webhook / Telegram Trigger;
- PM-34 unlock;
- L5 activation/runtime/endurance;
- permanent schedule/loop;
- Qwen pull/run sul VPS o sul nodo locale.

## 7. Source-of-truth relationship

- ruoli/invarianti generali: `docs/foundation/PROJECT_VISION.md`;
- operating model multi-planner: `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`;
- **placement topology OpenClaw:** questo documento;
- stato vivo/gate/NEXT: `docs/runtime/CURRENT_FRONTIER.md`;
- active evidence backlog: GitHub issue #8.

Se esiste ambiguità sulla collocazione di OpenClaw, **questo addendum prevale per la placement topology** finché non superseded da una successiva decisione operatore persistita su GitHub.

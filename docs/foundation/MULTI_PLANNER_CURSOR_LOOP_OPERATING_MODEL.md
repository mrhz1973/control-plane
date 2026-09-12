# MULTI-PLANNER CURSOR LOOP — Operating Model

**Repository:** `mrhz1973/control-plane`
**Documento:** `docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md`
**Stato:** `FOUNDATION OPERATING MODEL — ALIGNED TO QUALIFIED RUNTIME + OPERATOR DECISIONS`
**Runtime autorizzato da questo documento:** **NO** (docs only; non attiva routing/policy)
**PM-34 / L5 / permanent schedule:** **INVARIATI E NON AUTORIZZATI**

Lo stato runtime autorevole resta `docs/runtime/CURRENT_FRONTIER.md`.
Questo file non lo aggiorna.

---

## 0. Scopo e classificazione

Questo documento allinea il modello operativo foundation con:

1. componenti **LIVE / QUALIFIED** già provati nel repo/runtime;
2. decisioni operatore già raccolte in Notion (**TARGET / DECIDED BUT NOT ACTIVE** dove indicato);
3. percorsi **HISTORICAL / EXPERIMENTAL**;
4. superfici **GATED / NOT AUTHORIZED**.

| Etichetta | Significato |
|-----------|-------------|
| **LIVE / QUALIFIED** | Provato nel runtime o campagna di qualificazione; non implica policy di routing attiva |
| **TARGET / DECIDED BUT NOT ACTIVE** | Decisione operatore registrata; **non** runtime-active |
| **HISTORICAL / EXPERIMENTAL** | Provato abbastanza da esistere come evidenza; **non** qualificato come route live |
| **GATED / NOT AUTHORIZED** | Dietro gate esistente; non attivabile da questo documento |

**Default operating unit:** `MICRO_TASK_DELTA` (authoritative: `docs/foundation/MICRO_TASK_DELTA_OPERATING_LAW.md`).

Catena canonica del lavoro:

```text
Backlog Item
    ↓
Execution Packet
    ↓
Execution Result
```

Unità di lavoro piccola e bounded: **`MICRO_TASK_DELTA`**.

Non esiste un componente architetturale separato chiamato “Prompt Executor”.

---

## 1. Mappa componenti concreta (“chi lo fa davvero”)

Per ogni stadio principale: funzione, componente reale, programma/servizio, dove gira, modello/harness, autorità, stato attuale.

| FUNCTION | REAL COMPONENT | PROGRAM / SERVICE | WHERE IT RUNS | MODEL / HARNESS | AUTHORITY | CURRENT STATUS |
|----------|----------------|-------------------|---------------|-----------------|-----------|----------------|
| STRATEGIC ORCHESTRATOR / BACKLOG OWNER | ChatGPT Web (GPT Web Plus) + operatore | ChatGPT Web session / human | Browser / operatore | ChatGPT Web (cognitive; **SEPARATE_AVAILABILITY_DOMAIN**) | Operatore + GitHub SoT | **LIVE** (human-facing); non scheduler automatico |
| BACKLOG ITEM | GitHub issue / backlog markdown / queue item | GitHub + `reports/runtime/dev-queue/` | GitHub + workstation repo | n/a (artifact) | GitHub = source of truth | **LIVE** |
| BACKLOG SELECTOR | `tools/select-local-dev-queue-item-v1.mjs` | LOCAL_DEV queue selector | Workstation (Node) | deterministic (no LLM) | Selector + receipts ledger | **LIVE / QUALIFIED** (LOCAL_DEV lane) |
| RESOURCE + QUOTA + AVAILABILITY STATE | `tools/local-dev-resource-observatory-v1.mjs` + `tools/rt25-canonical-quota-state-v1.mjs` + quota translators | Dispatcher `GET /v1/resources` + dashboard; canonical quota compose | Workstation dispatcher `127.0.0.1:18793` | collectors + ingest evidence | Deterministic compose; UNKNOWN/STALE valid | **LIVE** observatory UI; quota freshness observation-dependent |
| ADMISSION GATE | `tools/admit-micro-task-delta-v1.mjs` (+ dispatcher hygiene / Qwen preflight) | LOCAL_DEV dispatcher tick path | Workstation | LLM may recommend; **final authority deterministic** | Fail-closed admission | **LIVE** (LOCAL_DEV); broader production gates separately gated |
| PLANNER / PACKET BUILDER | Planner pool: Qwen local / GLM / Codex (surface-dependent) | Planner tools + Execution Packet artifacts | Workstation / IDE / provider surface | profile IDs / provider models (dynamic) | Packet persisted before auto-exec | **QUALIFIED** paths vary; see §5–§7 |
| EXECUTION PACKET | Envelope / packet artifact (e.g. backlog-envelope bridge, dispatch envelope) | `tests`/`tools` bridge + queue envelopes | Repo filesystem + GitHub-referenced | n/a (artifact) | Must exist before execution | **LIVE** (LOCAL_DEV envelope path) |
| EXECUTION ROUTER | `tools/n8n-v4-execution-routing-bridge-v1.mjs` + n8n V4 seams | n8n + Node bridge | VPS n8n + local tools | does **not** execute by itself | Deterministic route decision | **LIVE** structural; live production promotion **GATED** |
| IMPLEMENTER | OpenCode (canonical Qwen path) **or** Cursor harness classes | OpenCode CLI / Cursor Agent | Workstation filesystem/terminal/tests/Git | See §5–§6 (harness ≠ model) | Bound by packet + admission | **QWEN→OpenCode QUALIFIED** (D-9405); Cursor classes proven variously |
| DETERMINISTIC TESTS | Existing Node suites / task `test_commands` | `node tests/.../run.mjs` | Workstation | n/a | Pass/fail evidence | **LIVE** |
| REVIEW STAGE | Bugbot / review-stage boundary tools | Bugbot + `tools` review-stage helpers | Cursor/cloud review where configured | Bugbot = quality gate, **not** router | Prefer checkpoint / significant delta | **LIVE** capability; **not** mandatory every MICRO_TASK_DELTA |
| RESULT GATE | Deterministic post-exec evaluation (tests, diff, review, provenance/quota) | n8n / dispatcher / policy tools | Workstation + VPS policy surfaces | Implementer **must not** self-certify | Outputs PASS / RETRY / HUMAN_GATE / SERVICE_ERROR / DEFER | **LIVE** concepts + LOCAL_DEV receipts; full auto result-gate **partially GATED** |
| RETRY ROUTER | Formal branch after repairable STOP | retry-stage boundary + policy | Same authority surfaces | Bounded re-attempt / re-route | Behind existing authorization gates | **TARGET / GATED** auto-retry unless separately proven |
| HUMAN GATE | Telegram decision path | `tools/v4-runtime-authorization-issuance-v1.mjs` + Telegram bot | VPS/runtime auth service | human | Telegram = human gate only | **LIVE** issuance pattern; not every LOCAL_DEV tick |
| NEXT BACKLOG ITEM | Selector + receipts after terminal outcome | `select-local-dev-queue-item-v1` + receipts.json | Workstation queue | deterministic | One claim per tick (LOCAL_DEV) | **LIVE** |

### Superfici di autorità (non negoziabili)

- **GitHub** — source of truth (backlog, decisioni, evidenza, handoff).
- **Core deterministico** — selector, admission, quota compose, hygiene, receipts.
- **n8n** — workflow engine / policy seams (non LLM planner).
- **OpenClaw** — **non** è authority del Control Plane attuale; vedi §12 (`KEEP_STAGED_PENDING`).

### Observatory operatore (visibilità risorse/quote)

- Dashboard: `http://127.0.0.1:18793/dashboard`
- Resources: `GET http://127.0.0.1:18793/v1/resources`
- Status / diagnostics: `GET /v1/status`, `GET /v1/diagnostics`
- Servizio: Scheduled Task `ControlPlane-V4-LocalDevDispatcher` → `tools/serve-local-dev-autonomous-dispatcher-v1.mjs`

UNKNOWN / STALE / UNAVAILABLE sono osservazioni valide. Non inventare dati mancanti.

---

## 2. Due gate distinti

### 2.1 ADMISSION GATE — PRIMA dell’esecuzione

**LIVE / QUALIFIED** come concetto e helper (`admit-micro-task-delta-v1` + preflight dispatcher).

Controlla, tra gli altri:

- HEAD / repo hygiene
- scope
- validità task / contratto backlog
- disponibilità PC / workstation
- readiness / occupancy Qwen (profile_id esatto dove applicabile)
- finestra temporale (quando policy attiva — oggi spesso **TARGET**)
- evidenza quota fresca
- adeguatezza modello
- rischio
- autorizzazione

L’LLM può raccomandare/classificare. **L’autorità finale resta deterministica.**

### 2.2 RESULT GATE — DOPO l’esecuzione

Consuma:

- execution result
- tests
- Git diff
- review (quando richiesta)
- provenance / quota

Output ammessi:

- `PASS`
- `RETRY`
- `HUMAN_GATE`
- `SERVICE_ERROR`
- `DEFER`

**L’implementer non auto-certifica l’acceptance.**

---

## 3. DEFER (plain Italian)

**DEFER** = il task **non** è fallito e **non** è scartato.
Resta **in sospeso** finché non diventa disponibile una route **permessa** e **adeguata**.

Non confondere DEFER con STOP riparabile, HUMAN_GATE, o discard.

---

## 4. Quote e risorse (domini di accounting)

| Dominio | Cosa è | Pool / accounting | Note |
|---------|--------|-------------------|------|
| **Qwen** | capacità di compute locale | **nessuna quota commerciale** | unmetered locale; subject to occupancy / adequacy |
| **GLM-5.3** + **GLM-5.3-Flash** | modelli commerciali distinti | **UN solo pool** `glm_coding_plan` | non contare due quote separate |
| **Codex** | superfici Codex (IDE extension / correlati) | `chatgpt_codex_subscription` | pool condiviso tra superfici Codex registrate |
| **Cursor** | harness + eventuale allowance | mapping accounting **UNVERIFIED** salvo prova separata | non trattare allowance come verificata di default |
| **ChatGPT Web** | dominio cognitivo / orchestrazione | **SEPARATE_AVAILABILITY_DOMAIN** | **non** illimitato e **non** “free” |

Ogni diagramma di route deve rendere visibile il dominio quota/accounting applicabile.

---

## 5. Qwen

### 5.1 Route canonica / qualificata — LIVE / QUALIFIED

```text
Qwen locale
    ↓
OpenCode
    ↓
filesystem / terminal / tests / Git
```

- Campagna **D-9405-A/B/C**: **PASS / QUALIFIED**
- **`QWEN_INDEPENDENT_QUALIFIED=YES`**
- Usare **profile ID** di registry (es. profilo OpenCode 64k), **non** hardcodare un parameter-count/nome stale tipo “37B” come identità canonica.

### 5.2 Route storica sperimentale — HISTORICAL / EXPERIMENTAL / NOT QUALIFIED

```text
Qwen
    ↓
Cline
    ↓
Cursor
```

Evidenza operatore: **è stata provata** e ha dimostrato possibilità tecnica, ma **Cline non ha funzionato bene**.

- Può essere valutata in futuro come **secondo harness Qwen**.
- **NON** diventa route live solo perché documentata qui.
- **Concurrency law:** un secondo harness Qwen può essere considerato solo quando lo **stesso** runtime/risorse Qwen locali **non** sono già occupati da un altro processo autorizzato (`docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`).

---

## 6. Cursor — EXECUTION HARNESS, non modello

Cursor **non** è un LLM. È un **harness di esecuzione** (Agent, terminal, filesystem, tests, Git, tool/MCP).

Classi attualmente distinguibili:

| Classe | Stato tipico | Dominio quota |
|--------|--------------|---------------|
| Cursor native / Composer | proven as harness path | Cursor allowance **UNVERIFIED** unless proven |
| GLM BYOK inside Cursor | proven where configured | `glm_coding_plan` |
| Codex IDE extension | proven where registry surfaces say so | `chatgpt_codex_subscription` |
| Future Qwen/Cline via Cursor | **HISTORICAL / EXPERIMENTAL** | Qwen local (no commercial quota) |

---

## 7. PC ONLINE / OFFLINE

### 7.1 PC ONLINE — implementazione

```text
Qwen → OpenCode → filesystem / tests / Git
```

Quando serve lavoro cognitivo ChatGPT Web:

```text
Qwen → Hermes → ChatGPT Web
```

(Shadow/qualification paths may still be separately gated; do not invent completion.)

### 7.2 PC OFFLINE — target resilience — TARGET / DECIDED BUT NOT ACTIVE as full resilience story

```text
NEW VPS
  ↓
GLM-5.3-Flash
  ↓
Hermes
  ↓
ChatGPT Web
  ↓
planning / synthesis / review / Execution Packet
  ↓
GitHub
```

L’implementazione locale **attende** che una superficie di esecuzione autorizzata torni disponibile.

**Non** implica che il VPS possa fare implementazione workstation-local.

**Observability gap (live):** se NEW VPS osserva `VPS_PRIVATE_OBSERVATION_UNAVAILABLE`, quello è un gap di osservabilità residuo. Questo documento **non** autorizza un nuovo trasporto SSH.

---

## 8. Hermes — COGNITIVE WEB BRIDGE

Etichetta canonica: **COGNITIVE WEB BRIDGE**.

Può essere guidato da Qwen o GLM dove qualificati.

Hermes **NON** è:

- scheduler
- broker authority
- GitHub authority
- secondo Control Plane
- state owner

GitHub + core deterministico + n8n restano le superfici di autorità.

---

## 9. Bugbot + Grok

### Bugbot

- Quality / review gate
- **Non** obbligatorio per ogni `MICRO_TASK_DELTA`
- Preferire review a **checkpoint** / delta significativi
- Non seleziona route planner

### Grok

- Candidato **routing arbiter / persistent-agent** per: route ambigue, disaccordo modelli, non-convergenza, classificazione difficile, cross-check strategico
- **NON** definire: ogni task → Bugbot → Grok
- Esecuzione Grok: **non LIVE** salvo evidenza repo separata → trattare come **TARGET / GATED**

---

## 10. Retry (ramo formale)

```text
implementation
  → tests
  → review
  → repairable STOP
  → Retry Router
  → bounded new attempt / route
```

**Verità corrente:** reviewer execution e automatic retry execution restano dietro i **gate di autorizzazione esistenti**, salvo prova repo diversa. Documentare il ramo ≠ attivarlo.

La continuazione bounded dopo uno STOP è definita dal contratto
`docs/contracts/bounded-repair-continuation-policy-v1.md`. È harness-independent
e non conferisce nuova authority: Cursor, ACP, Codex, Qwen/OpenCode, Hermes e
future superfici devono avere qualification specifica prima di essere dichiarati
same-session proven.

`RT25_REUSE_REQUIRED=YES` · `ARE_WE_REBUILDING_RT25_ALREADY_IMPLEMENTED=NO`.
Quota state, review, retry, checkpoint e provenance machinery RT25 già
implementate sono la base da riusare; questo operating model non crea un nuovo
quota router.

---

## 11. OPERATOR ROUTING POLICY — DOCUMENT ONLY

**OPERATOR-CONFIRMED POLICY**
**NOT YET RUNTIME-ACTIVE**

Questa policy documenta l’evidenza empirica dell’operatore e il comportamento
del Control Plane; **non** attiva finestre runtime, non sblocca GLM, non cambia
registry e non autorizza fallback silenziosi.

### 11.1 Finestra 08:00–12:00 Europe/Rome — OPERATOR POLICY

```text
Qwen available + adequate
    → Qwen / OpenCode

    else Codex capacity fresh + available
    → Codex

else
    → DEFER

glm-5.3-flash = INELIGIBLE
glm-5.3       = INELIGIBLE
```

`GLM_08_12_CLASSIFICATION=OPERATOR_POLICY`
`GLM_08_12_EMPIRICAL_EVIDENCE=CONFIRMED_BY_OPERATOR`
`GLM_08_12_APPLIES_WEEKEND=YES`
`GLM_08_12_BYDAY=MO,TU,WE,TH,FR,SA,SU`
`GLM_08_12_WINDOW=[08:00,12:00)` · `GLM_08_12_TIMEZONE=Europe/Rome`
`GLM_53_BLACKOUT_08_12=YES` · `GLM_53_FLASH_BLACKOUT_08_12=YES`

Motivo della policy: entrambi consumano lo stesso pool `glm_coding_plan`.
Il pool resta uno solo; la policy è operatore + Control Plane, non una provider
rule Z.AI.

### 11.2 Fuori 08:00–12:00 — TARGET ONLY

```text
Qwen when adequate/convenient
    ↓
GLM-5.3-Flash commercial priority
    ↓
Codex independent pool / alternative / review
    ↓
GLM-5.3 full = escalation
    ↓
stronger Codex route = difficult-case escalation
```

### 11.3 Preferenza operativa Codex — TARGET ONLY

| Classe di lavoro | Preferenza desiderata |
|------------------|------------------------|
| simple / quota-sensitive | Luna Low class |
| normal / medium | Luna Medium class |
| higher model | explicit escalation |

**Non** congelare i nomi modello Codex nel registry statico. La disponibilità modello resta **dinamica** e va verificata sulla superficie di accesso reale.

---

## 12. OpenClaw

**Non** è l’authority / broker attivo del Control Plane corrente.

Stato accurato dove applicabile: **`KEEP_STAGED_PENDING`** (staged/inactive; future activation separately gated).

Trattarlo solo secondo ruolo staged/proven — **non** come scheduler o state owner per assunzione.

---

## 13. Ruoli residui (sintesi)

| Ruolo | Componente | Status |
|-------|------------|--------|
| Strategic orchestrator | ChatGPT Web + operatore | LIVE (human) |
| SoT | GitHub | LIVE |
| Workflow / policy | n8n | LIVE structural; promotion GATED |
| LOCAL_DEV autonomous lane | dispatcher + selector + admission + OpenCode | LIVE / QUALIFIED (bounded) |
| Provider broker legacy | OpenClaw | KEEP_STAGED_PENDING |
| Human gate | Telegram | LIVE pattern |
| Cognitive web bridge | Hermes | role canonical; path proofs may be GATED |
| Review | Bugbot | LIVE capability; selective |
| Routing arbiter candidate | Grok | TARGET / GATED |

---

## 14. Cosa questo documento NON fa

- Non modifica routing runtime, registry, quota contracts, dispatcher code, n8n, Qwen profiles, Hermes, VPS, Tailscale.
- Non aggiorna `CURRENT_FRONTIER`.
- Non autorizza PM-34 / L5 / permanent schedule.
- Non promuove Cline, Grok execution, o OpenClaw a LIVE.
- Non inventa SSH/osservazione VPS privata.

---

## 15. Riferimenti operativi

- `docs/foundation/MICRO_TASK_DELTA_OPERATING_LAW.md`
- `docs/runtime/CURRENT_FRONTIER.md` (stato runtime)
- `docs/runtime/OPERATOR_CONSTRAINT_QWEN_SHARED_RUNTIME_CONCURRENCY.md`
- `docs/contracts/resource-registry-v2.md`
- `tools/serve-local-dev-autonomous-dispatcher-v1.mjs`
- `tools/local-dev-resource-observatory-v1.mjs`
- `tools/select-local-dev-queue-item-v1.mjs`
- `tools/admit-micro-task-delta-v1.mjs`
- `tools/n8n-v4-execution-routing-bridge-v1.mjs`
- `tools/rt25-canonical-quota-state-v1.mjs`

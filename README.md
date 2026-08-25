# control-plane

Repository di **documentazione** del control-plane, **export n8n redatti** e **runbook di rebuild**. Nessun codice runtime applicativo. Foundation del team AI con **GPT Web** come orchestratore strategico, **GitHub/n8n** come control-plane persistente e **Cursor** come execution harness.

## START HERE

| Doc | Ruolo |
|-----|--------|
| [docs/runtime/CURRENT_FRONTIER.md](docs/runtime/CURRENT_FRONTIER.md) | Stato runtime autorevole — **LEGGI PRIMA DI PROPORRE** |
| [docs/foundation/PROJECT_VISION.md](docs/foundation/PROJECT_VISION.md) | Foundation e invarianti canoniche |
| [docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md](docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md) | **Target accettato 2026-08-25**: GPT Web backlog → planner pool → Cursor loop; planning/docs-only |
| [docs/runtime/AUTOMATION_ACTIVATION_PLAN.md](docs/runtime/AUTOMATION_ACTIVATION_PLAN.md) | Scala di attivazione, gate A–F |
| [docs/advisors/GLM_ADVISOR_METHOD.md](docs/advisors/GLM_ADVISOR_METHOD.md) | metodo storico/standing per GLM Advisor; il nuovo target multi-planner richiede migrazione gated |

Lo stato runtime corrente vive **SOLO** nel frontier. Il nuovo operating model è una **direzione architetturale accettata**, non un'autorizzazione runtime: PM-34, L5, schedule permanenti e workflow produzione restano invariati finché non esiste un gate dedicato.

## Architettura target

- **GPT Web Plus** = orchestratore strategico e owner del backlog GitHub
- **GitHub** = source of truth: backlog, decisioni, Execution Packet, checkpoint, risultati
- **n8n su VPS** = workflow engine, policy deterministica, gate, Telegram I/O
- **OpenClaw** = provider/auth/quota broker; non strategic orchestrator
- **Planner pool** = Codex OAuth / GLM 5.3 / Qwen 3.8 37B locale
- **Cursor** = execution harness: Agent, loop task-bounded, subagent, terminale, test, Git; GLM BYOK dove verificato
- **Bugbot** = reviewer/quality gate, non router
- **Telegram** = gate umano via Decision Packet
- **Tailscale** = trasporto privato VPS ↔ nodo locale

Dettagli e gestione delle finestre di contesto: [MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md](docs/foundation/MULTI_PLANNER_CURSOR_LOOP_OPERATING_MODEL.md).

## Invarianti stabili

- **Repo non-confidenziale** (`PROJECT_VISION.md` §10, v2.15): controllo compensativo = rotazione totale a fine progetto — [`docs/ROTATION_CHECKLIST.md`](docs/ROTATION_CHECKLIST.md); `tools/redaction-check.sh` **rimosso**
- Workflow produzione mai mutati in silenzio
- GPT Web/GPT-B resta autore autorevole degli artefatti workflow n8n finché la foundation non viene cambiata con gate esplicito
- Attivazioni solo via Decision Packet
- **PM-34 BLOCKED** · **`n8n_ready=false`**
- **L5_PASS NOT_CLAIMED** · nessun permanent loop/schedule autorizzato
- GitHub, non la memoria di una chat, resta la memoria persistente del progetto

## Context / handoff principle

La fine di una context window non deve interrompere il progetto. GPT Web, planner e Cursor devono poter aprire una nuova sessione leggendo dal repository vivo:

- stato autorevole;
- Backlog Item / Execution Packet;
- ultimo checkpoint;
- HEAD/branch;
- test/findings;
- gate aperti;
- singolo prossimo step.

Restano validi `handoff ora` e il limite foundation dei 20 prompt utente come hard bound; il nuovo operating model introduce anche **Execution Checkpoint** per il rollover delle sessioni Cursor.

## Export / redazione

- [workflows/README.md](workflows/README.md) — regole export e redazione
- [docs/RUNTIME_GATES.md](docs/RUNTIME_GATES.md) — un gate runtime alla volta

## Rebuild principle

If the VPS dies, docs and redacted exports here must be enough to recreate n8n workflows, credentials (in UI), and watched-repo behavior. See [docs/N8N_REBUILD.md](docs/N8N_REBUILD.md).

## Storico

Era PM (maggio 2026): [docs/PM_INDEX_ARCHIVE.md](docs/PM_INDEX_ARCHIVE.md)

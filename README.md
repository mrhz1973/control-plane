# control-plane

Repository di **documentazione** del control-plane, **export n8n redatti** e **runbook di rebuild**. Nessun codice runtime applicativo. Foundation del team AI: triangolo **Claude / GPT-B / Cursor**; **n8n / Ollama / Telegram** come control-plane operativo.

## START HERE

| Doc | Ruolo |
|-----|--------|
| [docs/foundation/PROJECT_VISION.md](docs/foundation/PROJECT_VISION.md) | Visione e regole — entry point canonico |
| [docs/runtime/CURRENT_FRONTIER.md](docs/runtime/CURRENT_FRONTIER.md) | Stato autorevole — **LEGGI PRIMA DI PROPORRE** |
| [docs/runtime/AUTOMATION_ACTIVATION_PLAN.md](docs/runtime/AUTOMATION_ACTIVATION_PLAN.md) | Scala di attivazione, gate A–F |
| [docs/advisors/GLM_ADVISOR_METHOD.md](docs/advisors/GLM_ADVISOR_METHOD.md) | metodo standing per GLM Advisor read-only |

Lo stato corrente vive **SOLO** nel frontier. Questo README non contiene snapshot: se ne trovi uno, è un bug.

## Architettura

- **GitHub** = source of truth (codice, piani, documenti)
- **n8n su VPS** = orchestrazione — **MAI** provider API
- **Nodo Ryzen** = Ollama classifier, Cursor, OpenClaw
- **Telegram** = gate umano via Decision Packet
- **Tailscale** = trasporto privato VPS ↔ nodo locale

## Invarianti stabili

- **Repo non-confidenziale** (`PROJECT_VISION.md` §10, v2.15): controllo compensativo = rotazione totale a fine progetto — [`docs/ROTATION_CHECKLIST.md`](docs/ROTATION_CHECKLIST.md); `tools/redaction-check.sh` **rimosso**
- **Advisor read-only:** metodo e cautele output in [`docs/advisors/GLM_ADVISOR_METHOD.md`](docs/advisors/GLM_ADVISOR_METHOD.md)
- Workflow produzione mai mutati in silenzio
- Attivazioni solo via Decision Packet
- **PM-34 BLOCKED** · **`n8n_ready=false`** — gate espliciti

## Export / redazione

- [workflows/README.md](workflows/README.md) — regole export e redazione
- [docs/RUNTIME_GATES.md](docs/RUNTIME_GATES.md) — un gate runtime alla volta

## Rebuild principle

If the VPS dies, docs and redacted exports here must be enough to recreate n8n workflows, credentials (in UI), and watched-repo behavior. See [docs/N8N_REBUILD.md](docs/N8N_REBUILD.md).

## Storico

Era PM (maggio 2026): [docs/PM_INDEX_ARCHIVE.md](docs/PM_INDEX_ARCHIVE.md)

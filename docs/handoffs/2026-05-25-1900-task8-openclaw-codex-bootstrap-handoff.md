# HANDOFF — task #8 bootstrap pre-runtime

**Path canonico nel repo:** `docs/handoffs/2026-05-25-1900-task8-openclaw-codex-bootstrap-handoff.md`
**Entry point della prossima chat:** `docs/foundation/PROJECT_VISION.md` v2.0
**Chat di origine:** chat "control-plane post-foundation v2.0", chiusa per kill switch volontario (PROJECT_VISION.md sezione 11.1) prima di test runtime critico.

---

## HEAD GitHub osservato

`mrhz1973/control-plane`, branch principale, con `docs/foundation/PROJECT_VISION.md` v2.0 (2026-05-25) come entry point canonico. Stato sezione 3 invariato rispetto alla foundation: tutti i PASS del 25 maggio (Tailscale, Cursor Agent CLI, Ollama qwen3 classifier API, classifier wrapper contract, local path preflight, OpenClaw gateway loopback) confermati. Workflow `40` produzione attivo, `41` backup off (invarianti sezione 10 non toccate).

## Stato reale del workflow/runtime

Nessuna modifica runtime in questa chat. n8n workflow 40 non toccato. OpenClaw sul Ryzen presunto installato dal PASS del 25 maggio ma **non riavviato in questa chat** — la chat nuova dovrà verificare stato gateway prima di lanciare il test.

## Ultimo risultato utile

Bootstrap del task #8 (sezione 12 punto 8 del documento — *"OpenClaw / Codex minimal read-only integration"*) completato a livello di pianificazione, non eseguito.

Specificamente:

- **Architettura dei ruoli chiarita**: tre livelli AI distinti — Claude come consigliere strategico in chat, ChatGPT come orchestratore-B dello sviluppo del progetto, Codex via OpenClaw come orchestratore-A del sistema a regime (componente da accendere col task #8). Distinzione introdotta in questa chat, **non ancora committata in foundation**.
- **Triangolo operativo fissato**: Claude scrive consiglio → utente porta a ChatGPT come *proposta* (non comando) → ChatGPT risponde → utente riporta a Claude → Claude commenta come consigliere → utente decide.
- **Briefing per ChatGPT** prodotto in chat, contenente: ruolo orchestratore-B, riferimento a PROJECT_VISION.md con istruzione di lettura, task #8 con sei vincoli espliciti, criteri di PASS proposti, schema COP a 7 campi proposto, decisioni operative delegate a ChatGPT, vincoli di sicurezza.
- **Risposta di ChatGPT-orchestratore-B ottenuta**, contenente: conferma schema a 7 campi (ID, Obiettivo, Contesto letto, Vincoli, Criterio di completamento, Rischio stimato, Micro-interazioni eliminate), cinque criteri di PASS estesi (i tre originali + sicurezza + fallback), scelta del documento di prova (`docs/sessions/2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md`), perimetro di lettura mirato al solo file, sequenza operativa in 7 step, comando PowerShell pronto, fallback per modalità di errore. Risposta validata da Claude come consigliere: coerente con foundation, vincoli di sicurezza rispettati, due dubbi operativi segnalati.

## Decisioni recenti non ancora consolidate

- **Schema Codex Operational Prompt v0 a 7 campi** confermato dall'utente contro raccomandazione del consigliere (che proponeva 4 campi v0 minimal). Da committare in `docs/foundation/CODEX_OPERATIONAL_PROMPT_FORMAT.md` *dopo* la prima prova reale (sezione 7.8 — Docs ROI Gate), non prima.
- **Soglia handoff portata da 20 a 25 turni una tantum** per il bootstrap del task #8. Non modifica PROJECT_VISION.md sezione 11.2 — è bump motivato isolato, non cambio di regola stabile.
- **Distinzione orchestratore-A vs orchestratore-B** osservata ma non scritta in PROJECT_VISION.md. Il documento parla solo dell'orchestratore-A. L'orchestratore-B (ChatGPT come cervello dello sviluppo) è ruolo de facto, non documentato. Da considerare come voce di sezione 14 (backlog futuro) in una revisione successiva — non come azione immediata.

## Gate aperti reali

- **Verifica porta `18789`** per il gateway OpenClaw sul Ryzen. Citata da ChatGPT come fatto stabilito, non presente in PROJECT_VISION.md. Da confermare tramite `openclaw.cmd gateway health` o session log del PASS 25 maggio.
- **Verifica `--agent main`** come nome agent corretto sul Ryzen. Citato da ChatGPT, da confermare con comando equivalente a `agent --list` o procedura nota.
- **Stato gateway OpenClaw**: probabilmente spento dato che il PASS del 25 maggio era foreground manual runtime. Da riavviare prima di lanciare il test.
- **OAuth ChatGPT Plus** per Codex sul Ryzen: da PM-30/33 risulta verificato, ma worker non abilitato (sezione 3). Il task #8 non richiede worker, solo che Codex risponda. Da verificare al primo lancio.
- **Workspace Git pulito** sul Ryzen prima del test (`git status --short` deve essere vuoto). Vincolo sezione 7.3, PASS 4 del test.

## Prossimo passo tattico già deciso

Eseguire il **micro-test OpenClaw/Codex read-only** sul Ryzen, con il comando PowerShell prodotto da ChatGPT-orchestratore-B (riportato qui sotto integralmente per non perderlo nell'handoff).

**Cosa fa il test:** Codex via OpenClaw legge `docs/sessions/2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md`, produce un Codex Operational Prompt a 7 campi che dimostri lettura (almeno due dettagli specifici citati: `read probe timeout`, `auth none solo loopback`, `workflow 40/41 untouched`, oppure `operator.read + operator.pairing`).

**Cinque criteri di PASS** (versione estesa di ChatGPT, ancorata al documento):

1. **Connessione**: gateway su `127.0.0.1:18789`, no Tailscale exposure, no Funnel, no n8n.
2. **Lettura contesto**: almeno due dettagli specifici del file citati.
3. **Forma output**: COP a 7 campi strutturato, non prosa libera.
4. **Sicurezza**: workspace Git pulito; niente commit, niente shell, niente workflow 40/41, niente PM-34 unlock.
5. **Fallback**: se fallisce, errore registrato, sistema torna manuale, niente stato perso (sezione 7.6).

**Comando da lanciare sul Ryzen, finestra Gateway aperta in parallelo:**

```powershell
cd "C:\Users\mrhz\Documents\AI\GitHub\control-plane"

Write-Host "=== OPENCLAW CODEX MICRO TEST — READ ONLY PROMPT GENERATION ===" -ForegroundColor Cyan

Write-Host "`nPRECHECK:"
git status --short

Write-Host "`nGATEWAY HEALTH:"
cmd /c openclaw.cmd gateway health

Write-Host "`nRUN OPENCLAW AGENT MAIN:"
cmd /c openclaw.cmd agent --agent main --json --thinking minimal --timeout 240 --message "CONTROL-PLANE READ-ONLY TEST.

You are Codex via OpenClaw for the control-plane project.

Read this file only:
docs/sessions/2026-05-25-control-plane-openclaw-gateway-loopback-runtime-pass.md

Do not modify files.
Do not run shell commands.
Do not call n8n.
Do not touch workflow 40 or 41.
Do not commit or push.
Do not use Cursor worker.
Do not unlock PM-34.

Task:
Generate a structured Codex Operational Prompt v0 for the next safe gate.

Your output must contain exactly these 7 fields:
ID:
Obiettivo:
Contesto letto:
Vincoli:
Criterio di completamento:
Rischio stimato:
Micro-interazioni eliminate:

To prove you read the file, include at least two specific details from it.
The generated prompt must be addressed to a future Cursor/OpenClaw test, but must not execute anything."

Write-Host "`nPOSTCHECK:"
git status --short

Write-Host "`n=== END OPENCLAW CODEX MICRO TEST ==="
```

**Modalità di FAIL e contromosse (da ChatGPT-orchestratore-B):**

- `No target session selected` → correggere `--agent <nome>` dopo verifica.
- gateway `1006` → riavviare gateway foreground loopback.
- provider/API/token richiesto → stop, registrare gate OAuth, **non inserire API key** (invariante sezione 7.5).
- output in prosa libera → FAIL formato, irrigidire schema nel prompt.
- workspace sporco prima del test → stop, ispezione manuale, **niente reset automatico** (sezione 7.3).

## Contatore turni

Chat di origine chiusa a 20 turni utente effettivi (handoff su soglia bump-25 una tantum, regola sezione 11.2 con eccezione motivata). Chat nuova riparte da 0/20 con default standard.

## Riferimento entry point chat nuova

`docs/foundation/PROJECT_VISION.md` v2.0 (2026-05-25). La chat nuova deve leggerlo per intero come prima azione, citare invariante sezione 10 e regola sezione 7 a scelta per dimostrare la lettura, applicare regole 1-6 del kickoff originale (lettura documento, citazione, NEXT/WAIT/DONE, no nuovi PM, ancoraggio a sezioni, handoff a ~20).

La chat nuova deve essere informata che:

- Architettura dei ruoli (Claude consigliere / ChatGPT orchestratore-B / Codex orchestratore-A) è convenzione operativa, **non ancora scritta nel documento**.
- Triangolo operativo Claude↔utente↔ChatGPT è la modalità di lavoro fissata.
- Il prossimo evento è il lancio del test sul Ryzen, comando già pronto sopra.
- Due gate operativi da verificare prima del lancio: porta `18789` e nome `--agent main`.

---

**Fine handoff.**

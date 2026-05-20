# Telegram setup

**Docs-only placeholder.** No Telegram bot is created in the Day 1 bootstrap.

## Security

- **No token in this repo.** Never commit bot tokens, chat IDs used as secrets, or webhook URLs containing tokens.
- Tokens must stay in **n8n credentials** or a **local secure environment** only.

## Schedule

- **Day 2** will handle Telegram bot creation as a separate runtime-gated micro-step (see [RUNTIME_GATES.md](RUNTIME_GATES.md), gates 1–3).

## Documentation policy

- This file will be expanded when the bot is created.
- **No commands with real tokens** will appear in committed documentation.

## Local Telegram bot test — PASS

Bot dedicato control-plane creato tramite BotFather.

- **Username:** `@mrhz_control_plane_mvp_bot`
- **Test locale (PowerShell):** PASS
- **Verificato:** `getMe` OK; `/start` inviato al bot; `getUpdates` count = 1; `chat_id` recuperato localmente; `sendMessage` OK; messaggio ricevuto sul telefono.
- **Token:** caricato solo in variabile d'ambiente temporanea durante il test — **non** in questo repo.
- **chat_id:** recuperato localmente — **non** committato (valore operativo completo fuori repo; da configurare in credential n8n al gate dedicato).

## n8n Telegram credential — PASS

Credential Telegram dedicata al control-plane salvata in n8n.

- **Credential name:** `CONTROL PLANE - Telegram Bot`
- **Token:** inserito solo nella credential n8n — **non** in questo repo.
- **chat_id:** non committato; resta fuori repo e verrà usato solo nel workflow/runtime quando serve.
- **Scope:** credential disponibile per workflow control-plane futuri; i workflow Alina esistenti non devono essere toccati.

## n8n manual Telegram workflow — PASS

Workflow n8n control-plane importato e testato manualmente.

- **Workflow name:** `CONTROL PLANE - Telegram manual notification test`
- **Credential used:** `CONTROL PLANE - Telegram Bot`
- **Execution mode:** manual test only.
- **Result:** Telegram message received on the user's phone.
- **Token:** not committed.
- **chat_id:** not committed.
- **GitHub webhook:** not configured in this gate.
- **Schedule:** not enabled in this gate.
- **Existing Alina workflows:** not touched.

## n8n GitHub latest commit manual notify — PASS

Workflow n8n control-plane importato e testato manualmente con sorgente GitHub reale.

- **Workflow name:** `CONTROL PLANE - GitHub latest commit manual notify`
- **Source:** latest public commit from `mrhz1973/control-plane` via GitHub REST public read.
- **Credential used:** `CONTROL PLANE - Telegram Bot`
- **Execution mode:** manual test only.
- **Result:** Telegram message received on the user's phone.
- **GitHub token:** not used.
- **Telegram token:** not committed.
- **chat_id:** not committed.
- **GitHub webhook:** not configured in this gate.
- **Schedule:** not enabled in this gate.
- **Existing Alina workflows:** not touched.

## n8n GitHub commit poll dedupe notify v2 — first run PASS, second run FAIL

Workflow n8n control-plane v2 importato e testato manualmente con deduplica su ultimo commit.

- **Workflow name:** `CONTROL PLANE - GitHub commit poll dedupe notify v2`
- **Source:** latest public commit from `mrhz1973/control-plane` via GitHub REST public read.
- **Dedupe mechanism attempted:** workflow static data key `lastSeenControlPlaneSha`.
- **Fix applied:** v2 uses `$getWorkflowStaticData('global')` for n8n Code node compatibility.
- **Credential used:** `CONTROL PLANE - Telegram Bot`.
- **Execution mode:** manual editor/test runs only.
- **First-run result:** Telegram message received on the user's phone.
- **Second-run result:** FAIL — a second Telegram message was received instead of duplicate-skip.
- **Interpretation:** Telegram and GitHub read are working; the static-data dedupe method is not reliable for this manual validation path.
- **GitHub token:** not used.
- **Telegram token:** not committed.
- **chat_id:** not committed.
- **GitHub webhook:** not configured in this gate.
- **Schedule:** not enabled in this gate.
- **Existing Alina workflows:** not touched.

## n8n Data Table state store — PASS

Persistent state table creata nella UI n8n per sostituire la deduplica basata su workflow static data.

- **Data table name:** `control_plane_state`
- **Columns:** `key`, `value`, `updated_at`, `note`
- **Purpose:** store last-seen event keys for duplicate-skip validation.
- **Scope:** control-plane workflows only.
- **Existing Alina workflows:** not touched.

## n8n GitHub Data Table dedupe notify v3 — PASS

Workflow n8n control-plane v3 importato e testato manualmente con stato persistente in Data Table.

- **Workflow name:** `CONTROL PLANE - GitHub commit Data Table dedupe notify v3`
- **State table:** `control_plane_state`
- **Source:** latest public commit from `mrhz1973/control-plane` via GitHub REST public read.
- **Credential used:** `CONTROL PLANE - Telegram Bot`.
- **Execution mode:** manual validation only.
- **First-run result:** Telegram message received on the user's phone.
- **Second-run note:** a second Telegram was expected because a GitHub documentation commit had been created between runs.
- **Third-run result:** PASS — duplicate-skip worked with no additional Telegram when no GitHub commit occurred between executions.
- **Dedupe result:** validated with Data Table persistent state.
- **GitHub token:** not used.
- **Telegram token:** not committed.
- **chat_id:** not committed.
- **GitHub webhook:** not configured in this gate.
- **Schedule:** not enabled in this gate.
- **Existing Alina workflows:** not touched.

## n8n GitHub Data Table scheduled v4 — manual PASS

Workflow n8n control-plane v4 importato e testato manualmente.

- **Workflow name:** `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4`
- **State table:** `control_plane_state`
- **Source:** latest public commit from `mrhz1973/control-plane` via GitHub REST public read.
- **Credential used:** `CONTROL PLANE - Telegram Bot`.
- **Execution mode:** manual test only.
- **Manual result:** OK.
- **Schedule trigger:** present in workflow but not activated in this gate.
- **GitHub token:** not used.
- **Telegram token:** not committed.
- **chat_id:** not committed.
- **GitHub webhook:** not configured in this gate.
- **Existing Alina workflows:** not touched.

## n8n GitHub Data Table scheduled v4 — controlled polling PASS then resumed

Workflow n8n control-plane v4 attivato per polling controllato, validato, spento temporaneamente durante la preparazione webhook e poi riattivato come MVP provvisorio.

- **Workflow name:** `CONTROL PLANE - GitHub commit Data Table dedupe scheduled v4`
- **State table:** `control_plane_state`
- **Source:** latest public commit from `mrhz1973/control-plane` via GitHub REST public read.
- **Credential used:** `CONTROL PLANE - Telegram Bot`.
- **Schedule:** one-minute controlled polling validated and currently resumed as provisional MVP path.
- **Validation:** after activation, no duplicate Telegram was received during the observation window when no new GitHub commit occurred.
- **Dedupe result:** PASS — Data Table state prevented duplicate Telegram notifications.
- **Stability check:** after resuming v4 and creating a documentation commit, only the expected single Telegram was observed and no duplicate messages followed during the observation window.
- **GitHub token:** not used.
- **Telegram token:** not committed.
- **chat_id:** not committed.
- **GitHub webhook:** not configured in this gate.
- **Existing Alina workflows:** not touched.

## n8n GitHub push webhook Data Table dedupe notify v5 — manual PASS then disabled

Workflow n8n control-plane v5 importato e testato manualmente con payload placeholder, poi spento perché il webhook production URL non è pubblicamente raggiungibile quando n8n è aperto solo via localhost/tunnel.

- **Workflow name:** `CONTROL PLANE - GitHub push webhook Data Table dedupe notify v5`
- **State table:** `control_plane_state`
- **Source:** GitHub push webhook payload shape; manual trigger used only for local placeholder validation.
- **Credential used:** `CONTROL PLANE - Telegram Bot`.
- **Execution mode:** manual placeholder test only.
- **Manual result:** OK.
- **Current runtime status:** inactive / not published.
- **Production GitHub webhook:** not configured; GitHub rejected localhost because it is not reachable from the public Internet.
- **Webhook URL/secret:** not committed.
- **GitHub token:** not used.
- **Telegram token:** not committed.
- **chat_id:** not committed.
- **Existing Alina workflows:** not touched.

**Current provisional path:** v4 one-minute polling remains active and stable as the working MVP path. **Next gate:** expose n8n through a secure public HTTPS URL or another safe relay before attempting real GitHub webhook delivery.

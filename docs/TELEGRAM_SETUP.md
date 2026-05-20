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

**Prossimo gate (non in questo task):** configurare la credential Telegram in n8n. Webhook GitHub, workflow n8n e notifica push-triggered restano PENDING.

# ROTATION CHECKLIST — rotazione credenziali a fine progetto

**Repository:** `mrhz1973/control-plane`  
**Documento:** `docs/ROTATION_CHECKLIST.md`  
**Ruolo:** controllo compensativo della decisione 2026-07-02 (repo dichiaratamente non confidenziale) — vedi `docs/foundation/PROJECT_VISION.md` §10.

Rotazione totale a fine progetto (o immediata su sospetto abuso):

- [ ] Telegram bot token: BotFather revoke + new token; update n8n UI credential.
- [ ] Telegram chat/binding: re-verify with new bot.
- [ ] Classifier token: regenerate in Ryzen classifier-server config; update n8n UI.
- [ ] n8n credentials: recreate exposed/suspect credentials in n8n UI.
- [ ] cp_inbox SSH key: rotate if ever exposed; update authorized_keys + local alias.
- [ ] GitHub PAT: revoke/regenerate if any exists.
- [ ] Webhook secrets / API keys: revoke and regenerate at source service.
- [ ] Tailnet IP/hostname: optional regeneration, owner's choice.

---

**Fine documento.**

# DATA_TABLE_CSV_CONVENTION — Seed CSV per Data Tables n8n

**Repository:** `mrhz1973/control-plane`  
**Status:** Convention — applies from 2026-05-31 onward.

## Regola

Ogni Data Table n8n usata dal control-plane ha, quando praticabile, un **CSV seed versionato** in `data-tables/`.

Il CSV è la fonte autorevole dello stato iniziale/di reset: si importa in n8n invece di editare a mano.

## Cosa va nei CSV

- Schema esatto: header = nomi colonna.
- Righe seed test-only.
- Dati test-only come `decision_id`, `status`, offset, `update_id`, note test-only, ecc.
- `chat_id` reale quando serve per asset di configurazione, ammesso dal gate esplicito 2026-05-31.

## Cosa NON va MAI nei CSV né in alcun file Git

- Token bot Telegram.
- Credential id/contenuto.
- Webhook/auth URL.
- API key.
- OAuth material.
- PAT.
- Chain-of-thought.
- Execution dump non sanitizzati.

## Naming e posizione

- `data-tables/<nome_tabella>.csv`
- Tabelle test-only: suffisso `_test`.
- Mai `control_plane_state` senza gate esplicito.

## Layout noti

### `wf47_polling_state_test`

Layout key/value. Colonne:

```csv
key,value,updated_at,note
```

Righe seed:

- `last_update_id`
- `last_handled_update_id`
- `handled_keys_json`

### `wg_decision_state_test`

Colonne:

```csv
decision_id,status,selected_option,created_at,closed_at,update_id,note_preview,source
```

## Uso

1. n8n → Data Tables → Import CSV per creare/resettare la tabella.
2. Reset di un gate = reimport del CSV seed.
3. Dopo import/reset, workflow resta manual/inactive/off finché il gate runtime non lo richiede.

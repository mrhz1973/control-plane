# PM-21C fixed bridge smoke plan

Status: smoke trigger only.

Purpose:
Trigger the fixed PM-21 n8n bridge candidate workflow after replacing .first() usage with $json in PM21 Code nodes.

Expected candidate 42 behavior:
- detect this new plan commit;
- run Code - PM21 classifier decision without .first() error;
- run Code - PM21 bridge result;
- run Code - PM21 format Telegram bridge summary;
- send Telegram PM-21 bridge decision summary;
- use mock-worker only;
- do not invoke Codex;
- do not use provider API;
- do not modify production 40.

Out of scope:
- no runtime workflow edits;
- no workflow promotion;
- no Codex/OAuth;
- no GIS;
- no DEV;
- no Alina.

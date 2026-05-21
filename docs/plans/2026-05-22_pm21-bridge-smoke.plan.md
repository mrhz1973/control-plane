# PM-21 bridge smoke plan

Status: smoke trigger only.

Purpose:
Trigger the PM-21 n8n bridge candidate workflow.

Expected candidate 42 behavior:
- detect this plan commit;
- run deterministic PM21 classifier;
- run PM21 bridge result;
- send Telegram PM-21 bridge decision summary;
- use mock-worker only;
- do not invoke Codex;
- do not use provider API;
- do not modify production 40.

Out of scope:
- no runtime workflow edits;
- no promotion;
- no Codex/OAuth;
- no GIS;
- no DEV;
- no Alina.

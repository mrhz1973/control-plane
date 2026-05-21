# PM-21B isolated bridge smoke plan

Status: smoke trigger only.

Purpose:
Trigger candidate 42 while production 40 is temporarily off, so the shared Data Table dedupe does not consume the commit before 42.

Expected candidate 42 behavior:
- detect this new plan commit;
- run deterministic PM21 classifier;
- run PM21 bridge result;
- send Telegram PM-21 bridge decision summary;
- use mock-worker only;
- do not invoke Codex;
- do not use provider API;
- do not modify production 40.

Out of scope:
- no workflow promotion;
- no Codex/OAuth;
- no GIS;
- no DEV;
- no Alina.

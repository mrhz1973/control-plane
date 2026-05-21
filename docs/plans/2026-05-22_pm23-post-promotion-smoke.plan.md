# PM-23 post-promotion smoke plan

Status: smoke trigger only.

Purpose:
Verify the promoted production workflow after PM-22.

Expected production 40 behavior:
- detect this new plan commit;
- send scheduled poll commit notification;
- send plan_detected;
- send Gate D plan file;
- send PM-21 bridge decision summary;
- classify as low risk;
- route to cursor-control-plane;
- approval required no;
- bridge result dry_run_pass or dryrunpass;
- worker mock-worker;
- do not invoke Codex;
- do not use provider API;
- do not invoke a real worker.

Expected workflow state:
- 40 - CP v4 multirepo + classifier bridge - ACTIVE is Published;
- 41 - CP v4 multirepo polling - FILE HANDOFF SAFE TEXT - BACKUP OFF remains OFF;
- 01 / 20 / 30 remain OFF;
- no 42 is active.

Out of scope:
- no workflow edits;
- no rollback unless smoke fails;
- no Codex/OAuth;
- no GIS;
- no DEV;
- no Alina.

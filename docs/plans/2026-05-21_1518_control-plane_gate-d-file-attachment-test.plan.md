# Gate D file attachment test

Purpose: verify that the active Control Plane workflow detects this plan file and sends both the Gate D text message and the markdown file attachment to Telegram.

Expected runtime result:

- the scheduled workflow sees a new control-plane commit;
- the plan branch detects this file under docs/plans;
- the Gate D text message is sent;
- the Gate D markdown file is sent as a Telegram document attachment.

No v5 or webhook path is involved.

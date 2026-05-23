# OpenClaw evidence preview plan

**Purpose:** ask workflow `40` Gate D / PM21 preview to acknowledge the just-committed OpenClaw liveness evidence.

**Scope:**

- existing workflow `40` only;
- Telegram preview expected;
- mock-worker / preview-only behavior expected;
- no workflow `40`/`41` edit;
- no n8n import;
- no real worker;
- no raw OpenClaw output;
- no `docs/artifacts/openclaw/**` creation.

**Expected:**

- scheduled-poll commit notification;
- `CONTROL PLANE plan_detected` for this file;
- Gate D plan file message;
- `CONTROL PLANE PM-21 bridge decision` with `bridge_result=dry_run_pass`, `worker=mock-worker`, `risk=low`.

**Operator note:** Controlled preview trigger after OpenClaw liveness evidence pass. Not a strict_pass artifact. Does not unblock PM-34 real worker execution.

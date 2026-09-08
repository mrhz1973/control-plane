# Local-dev dispatcher observability micro-UI

**TASK:** MICRO-UI read-only dashboard for `serve-local-dev-autonomous-dispatcher-v1`  
**Date (UTC):** 2026-09-08  
**RESULT:** PASS (offline suite) · live page requires dispatcher process reload to pick up revision

## Open in browser

- **Dashboard:** http://127.0.0.1:18793/dashboard  
  (also http://127.0.0.1:18793/)
- **Status:** http://127.0.0.1:18793/v1/status  
- **Diagnostics:** http://127.0.0.1:18793/v1/diagnostics  

Existing `POST /v1/tick` unchanged. Dashboard never triggers ticks.

## What was added

1. **Static dashboard** `tools/local-dev-dispatcher-dashboard-v1.html`  
   Served by the dispatcher. Auto-polls status + diagnostics every 3s.  
   Sections: overview cards, Qwen/runtime, last tick decision, queue dry-run, tooltips.

2. **`GET /v1/diagnostics`** schema `local-dev-dispatch-diagnostics-v1`  
   Read-only bundle:
   - current `/v1/status` snapshot
   - last completed tick (`reason_codes`, `execution_performed`, `human_gate_required`, …)
   - dry-run queue scan (eligible_count, candidate, rejected items, skip summary)
   - optional read-only `:8080/v1/models` probe (never launch/load/recycle)
   - plain-language `explanation` (headline / detail / blocked_at / why_code)

3. **`createLastTickStore()`** — in-memory last tick for diagnostics (observability only).

## Invariants preserved

- No mutation endpoints added
- No queue/claim semantics change
- `/v1/status` schema unchanged for existing consumers
- Qwen probe is GET-only; no `ensureWorkstationDevQwenReady` on diagnostics path
- Focused suite: **28/28 PASS** (S25–S28 cover dashboard + diagnostics)

## Operator note

The Windows Scheduled Task process must be restarted once after pull so the listening Node process loads this revision. Identity-verified task: `ControlPlane-V4-LocalDevDispatcher`.

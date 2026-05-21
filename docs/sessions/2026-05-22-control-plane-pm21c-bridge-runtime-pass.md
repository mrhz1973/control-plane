# PM-21C — bridge runtime PASS (candidate `42`)

**Date:** 2026-05-22 (01:21 local Telegram evidence)  
**Status:** **Runtime PASS** — candidate `42` PM-21 branch

## Trigger

| Field | Value |
|-------|--------|
| **Commit** | `1f46c64` — `test: trigger PM-21C fixed bridge smoke` |
| **Plan** | `docs/plans/2026-05-22_pm21c-fixed-bridge-smoke.plan.md` |
| **Prior commit** | `d85afc2` (bundle fix) |
| **Bundle fix** | PM-21 Code nodes use `$json` not `$input.first()` |

## Telegram evidence (PASS)

| # | Message | Result |
|---|---------|--------|
| 1 | Scheduled poll commit notification | **PASS** — new `1f46c64`, previous `d85afc2` |
| 2 | `plan_detected` | **PASS** |
| 3 | Gate D plan file | **PASS** — attachment for `1f46c64` |
| 4 | **CONTROL PLANE PM-21 bridge decision** | **PASS** — no Code `.first()` error |

### PM-21 bridge summary (user evidence)

- Repo: `mrhz1973/control-plane`
- Plan: `docs/plans/2026-05-22_pm21c-fixed-bridge-smoke.plan.md`
- Commit: `1f46c64`
- Risk: **low**
- Route: **cursor-control-plane**
- Approval required: **no**
- Bridge result: **dry_run_pass**
- Worker: **mock-worker**
- Action: preview only, no Codex execution

## Posture

| Item | State |
|------|--------|
| **Candidate `42`** | Tested — PM-21 branch **PASS** |
| **Production `40`** | User context: still production; not promoted from this smoke |
| **Codex / provider API** | **Not invoked** |
| **C1** | **PARTIAL** — unchanged |
| **Promotion `42`→`40`** | **Not authorized** — separate gate |

## Prior attempts

| Attempt | Outcome |
|---------|---------|
| PM-21 / PM-21B triggers | Consumed by dedupe / prior errors |
| `.first()` runtime error | Fixed in `d85afc2` |
| **PM-21C** | **PASS** |

## Next

- Optional: re-export runtime snapshot of `42` or post-merge `40`
- **PM-18** Codex CLI setup or **PM-20** n8n integration on successor workflow — separate gates

Related: [PM21 doc](../PM21_N8N_BRIDGE_RUNTIME_CANDIDATE.md) · [first error fix](2026-05-21-control-plane-pm21-first-runtime-error-fix.md)

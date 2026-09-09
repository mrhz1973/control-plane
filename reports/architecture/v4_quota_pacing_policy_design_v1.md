# v4 Quota Pacing Policy Design v1

Issue: #73
Status: DRAFT — policy/simulation layer only; NOT activated in live routing.

## Scope

This document describes the deterministic, offline, repo-only quota pacing
controller that will be consumed by a future separately-authorized runtime
task. This simulator MUST NOT:

- activate or modify live routing
- call any model/provider
- consume any quota reset
- change n8n/WF90
- inspect credentials

## CLI Contract

- Accepts exactly one UTF-8 JSON scenario path.
- Input is one bounded object of synthetic/normalized observations.
- Output is one compact JSON object only; no file writes.

## Required Input Domains

| Domain | Fields |
|--------|--------|
| `now_local_iso` | local timestamp |
| `qwen_local` | `available`, `adequate_for_task` |
| `glm_coding_plan` | `state`, `freshness`, `effective_remaining_percent`, `rolling_remaining_percent`, `weekly_remaining_percent`, `rolling_reset_at`, `weekly_reset_at` |
| `chatgpt_codex_subscription` | same as GLM + `banked_reset_count`, `banked_reset_expiry` |
| `task` | `quality_class`, `urgency`, `estimated_burn_class` |
| `policy` | `glm_blackout_local_start`, `glm_blackout_local_end`, `reserve_floor_percent`, `horizon_hours` |
| `empirical_burn` | `qwen_local`, `glm_flash`, `glm_full`, `codex_low`, `codex_medium`, `codex_strong` |

`empirical_burn` values are injected observations/estimates only. The simulator
MUST NOT hardcode provider token economics or assume token count == quota
consumption.

## Route Evaluation Rules

### Qwen Local

- No commercial quota; preferred when `available` AND `adequate_for_task`.
- Admitted when both conditions are true; `UNAVAILABLE` or `INADEQUATE`
  otherwise.

### GLM Coding Plan

- Shared pool for `glm-5.3` and `glm-5.3-flash`.
- Blackout window (default `08:00–12:00` Europe/Rome) is a policy gate over the
  whole `glm_coding_plan`; both full and flash blocked during blackout.
- **Stale/unknown commercial quota MUST fail closed** for commercial-route
  admission. `freshness` must be `fresh`.
- `effective_remaining_percent` is consumed as canonical evidence of the
  limiting window (MIN law). Simulator does not recompute a conflicting MAX law.

### Codex Subscription

- Same canonical MIN window law.
- **Banked resets are advisory capacity only.** The simulator MUST NEVER
  auto-consume a reset. Any recommendation that would need a reset must be
  classified `HUMAN_GATE_RESET`.

## Reserve Protection

- If projected post-task effective remaining would fall at/below
  `reserve_floor_percent`, classify route `CONSERVE` unless
  urgency/quality semantics require escalation.
- Escalation allowed only when `urgency === high` (and quality class warrants).
- Never silently spend below reserve.

## Pacing Horizon

- Compare current effective remaining, time-to-reset, and empirical burn
  estimate.
- If current burn rate would exhaust the long window before reset or within
  `horizon_hours`, classify `PACING_EXHAUST_BEFORE_RESET` or
  `PACING_EXHAUST_WITHIN_HORIZON` respectively.

## Classification Taxonomy

| Classification | Meaning |
|----------------|---------|
| `ADMIT` | Route admitted, normal admission |
| `UNAVAILABLE` | Route unavailable (state not active/available) |
| `INADEQUATE` | Qwen local adequate_for_task false |
| `STALE_FAIL_CLOSED` | Stale/unknown freshness; fail closed |
| `BLACKOUT` | GLM blackout window active |
| `CONSERVE` | Reserve floor would be breached; no escalation warranted |
| `ESCALATE` | Reserve floor breached but urgency/quality warrants escalation |
| `HUMAN_GATE_RESET` | Would require a banked reset; human gate required |
| `PACING_EXHAUST_BEFORE_RESET` | Burn rate would exhaust window before reset |
| `PACING_EXHAUST_WITHIN_HORIZON` | Burn rate would exhaust window within horizon |

## Recommendation Logic

1. Collect all admitted routes.
2. Prefer `qwen_local` when admitted (no commercial quota).
3. Else prefer `glm_coding_plan` over `codex_subscription`.
4. If no route admitted but a `HUMAN_GATE_RESET` gate exists, recommend that gate.
5. Else `NO_ROUTE`.

## Test Coverage

`tests/quota-pacing-simulator-v1/run.mjs` covers:
- GLM blackout enforcement at 10:00 Rome
- Qwen local preference when available+adequate
- Stale GLM freshness fail-closed
- Reserve floor breach => CONSERVE
- Codex reserve breach with banked reset => HUMAN_GATE_RESET

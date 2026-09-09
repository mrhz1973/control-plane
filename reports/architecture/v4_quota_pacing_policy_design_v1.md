# v4 Quota Pacing Policy Design v1

## Observed quota state

The simulator consumes **already-normalized** observations only:

| Domain | Role |
|--------|------|
| `qwen_local` | Local availability + task adequacy (no commercial pool) |
| `glm_coding_plan` | Shared commercial pool for `glm_flash` and `glm_full` |
| `chatgpt_codex_subscription` | Shared commercial pool for Codex model classes |

Canonical commercial **admission** capacity is `effective_remaining_percent` (MIN of fresh binding windows, computed upstream). The simulator consumes it directly and never recomputes a conflicting MAX/MIN.

- `rolling_remaining_percent` / `rolling_reset_at` — short-window **context** only
- `weekly_remaining_percent` / `weekly_reset_at` — **long-window pacing protection**
- Auxiliary/MCP fields, if present, are ignored and must never inflate routing capacity

## Pacing policy

1. Prefer `qwen_local` when available and adequate (no commercial spend). This is the only fixed preference rule.
2. GLM blackout **08:00–12:00 Europe/Rome** blocks **both** Flash and full (shared pool gate).
3. Commercial candidates: generate all eligible model classes for both shared pools; filter by blackout, freshness/state, and quality floor. **Provider identity is never a ranking advantage.** Rank deterministically from scenario evidence:
   - quality adequacy (closest adequate match);
   - lower empirical burn;
   - better projected post-task headroom / long-window pacing surplus;
   - neutral tie-break by stable `model_class` identifier.
4. Admit only when projected post-task **effective** remaining stays above `reserve_floor_percent`, and long-window burn would not exhaust `weekly_remaining_percent` before `weekly_reset_at` (planning-clipped by `horizon_hours`). Rolling reset must not mask weekly exhaustion.
5. On long-window exhaustion: try a lower-burn class only if quality floor permits; otherwise `DEFER`.
6. Reserve breach: alternate evidence-ranked route, else `CONSERVE` or `DEFER` — never silent spend below reserve.
7. `DEFER` means **pending** eligibility later, not failure/discard.

## Empirical burn coefficients

`empirical_burn` values are **injected observations/estimates** keyed by model class (`qwen_local`, `glm_flash`, `glm_full`, `codex_low`, `codex_medium`, `codex_strong`).

They are used as:

- one-shot projected spend (`effective - burn[class]`) for reserve checks;
- burn rate (% / hour) for weekly long-window exhaustion and horizon checks;
- commercial ranking signal (lower burn preferred among quality-eligible classes).

The simulator does **not** hardcode provider token economics and does **not** assume token count equals quota consumption.

## Banked reset inventory

Codex `banked_reset_count` / `banked_reset_expiry` are **advisory inventory only**:

- never increase `effective_remaining_percent`;
- never auto-consume;
- `HUMAN_GATE_RESET` only when a **valid, soon-expiring** banked reset is relevant to a capacity-critical decision;
- `banked_reset_count=0` must not alone produce `HUMAN_GATE_RESET`.

## Runtime promotion gate

This artifact is **offline policy/simulation preparation** for issue #73. Live dispatcher/selector/receipt wiring, provider collectors, and banked-reset consumption require a **separately authorized** runtime task. Until then: `RUNTIME_ACTIVE=NO`.

## Simulator contract

- CLI: exactly one UTF-8 JSON scenario path.
- Output schema: `quota-pacing-simulation-v1` with `classification`, `selected_route`, `selected_model_class`, `decision` ∈ {`USE`,`CONSERVE`,`DEFER`,`HUMAN_GATE_RESET`}, `reasons[]` (max 16), `commercial_pool_used`, `projected_effective_remaining_percent`, `blackout_active`, `reset_horizon_hours`.
- Fail closed on malformed / non-object / missing-required / secret-like input; never echo secrets; never expose scenario path in output.
- Quality floor: model class must meet `task.quality_class`; strong/high tasks never auto-downgrade to Flash/low classes.

## Tooling

- `tools/simulate-quota-pacing-v1.mjs`
- `tests/quota-pacing-simulator-v1/run.mjs`

---

ISSUE=73
COMPONENT=QUOTA_PACING_POLICY_SIMULATOR
RUNTIME_ACTIVE=NO
PROVIDER_CALLS=0
MODEL_INFERENCE=0
RESET_CONSUMPTION=0
ROUTING_MUTATION=0
GLM_BLACKOUT=08:00-12:00 Europe/Rome
EFFECTIVE_QUOTA_LAW=MIN_BINDING_WINDOWS
BANKED_RESETS=ADVISORY_HUMAN_GATE_ONLY
BURN_RATE=EMPIRICAL_INPUT_NOT_TOKEN_ASSUMPTION
DEFER=PENDING_NOT_FAILURE
RESULT=PASS

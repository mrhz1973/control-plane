# V4 GPT-6 Astra subscription surface qualification V1

**TASK_REF:** `V4_GPT6_ASTRA_SUBSCRIPTION_SURFACE_QUALIFICATION_V1`
**BASE_HEAD:** `e8d874b771af53d14d01c108080dd2524ba21e7c` (== origin/main == HEAD at start, verified)
**Date (Europe/Rome):** 2026-09-14
**MODE:** BOUNDED SUBSCRIPTION-SURFACE QUALIFICATION — parent #32, target #35 (left OPEN)

## 3. #32/#35 relationship

Issue #32 is the master future track (quota-pool/time-aware multi-surface
routing + Codex subscription/Cursor). Issue #35 is its Astra-shaped child:
first-class Astra capability, live availability discovery, selectable
reasoning per current client, subscription-vs-API billing separation, and
`EXPIRING_ALLOWANCE_USE` opportunistic routing. #35 was NOT closed or edited
by this task.

## 4. Operator API/BYOK exclusion (superseding policy)

`ASTRA_OPENAI_API_SURFACE=OUT_OF_SCOPE`, `ASTRA_BYOK=OUT_OF_SCOPE`.
Only subscription-backed Codex usage was qualified. No OpenAI API key was
read, created, configured, or billed; no BYOK path touched.

## 5. Current client/account inventory (read-only)

| Item | Observed value |
|---|---|
| Codex CLI (PATH shim) | `codex-cli 0.133.0` (`codex` / `codex.cmd`, Windows) |
| Cursor Codex extension binary | `~/.cursor/extensions/openai.chatgpt-*/bin/windows-x86_64/codex.exe` (fixed resolution, same as qualified quota authority) |
| Account state | authenticated subscription-backed account (initialize + reads only) |
| Account/rate-limit source | `account/rateLimits/read` (existing qualified reader, unchanged) |
| Quota pools observed | `codex`, `base_model_inference` (+ credit-reset fields) — canonical id `chatgpt_codex_subscription` |
| Routing metadata | resource-registry-v2 sole canonical static policy source; Codex model ids dynamic |

## 6. Live model-catalog evidence (no inference)

Two independent read-only `model/list` inventories (JSON-RPC app-server,
bounded deadlines, sanitized printing):

1. **Cursor-bundled extension binary (IDE surface)** — 4 models:
   `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.5`.
   `ASTRA_LIVE_CATALOG_EXPOSED=NO`.
2. **PATH Codex CLI binary (CLI surface, v0.133.0)** — 5 models:
   `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.3-codex`, `gpt-5.2`.
   `CLI_ASTRA_EXPOSED=NO`.

The known config hint `~/.codex/config.toml` `model = "gpt-6-astra"` is
confirmed present **as a configuration preference only** — neither live
catalog exposes it. A configured model id is not account exposure: no
silent fallback to a phantom model id is possible through the qualified
router (`STALE_MODEL_FAIL_CLOSED` PASS).

## 7. IDE vs CLI surface identity

The two clients currently serve **different catalog views**
(`gpt-5.6-*` generation vs `gpt-5.4/5.5` generation), i.e. they are not
byte-identical catalog views, but both resolve against the same
subscription-backed account and both expose **no Astra**.
`MODEL != ACCESS_SURFACE != QUOTA_POOL` was therefore only partially
probed; per decision law the qualification stops at Phase 3.

```text
ASTRA_IDE_ACCESS=UNAVAILABLE
ASTRA_CLI_ACCESS=UNAVAILABLE
SHARED_QUOTA_POOL=UNKNOWN (not separable without Astra exposure)
SEPARATE_BILLING_INFERRED=NO
```

## 8. Reasoning controls (live, current values)

Observed per-model `supportedReasoningEfforts` (IDE catalog):
`low, medium, high, xhigh, max` on all four models, plus `ultra`
("Maximum reasoning with automatic task delegation") on `gpt-5.6-sol` and
`gpt-5.6-terra` only. Defaults: sol=low, terra=medium, luna=medium, 5.5=medium.

```text
ASTRA_REASONING_LEVELS_OBSERVED=UNKNOWN (model not exposed)
ASTRA_REASONING_CONTROLS_DISCOVERED=NO_WITH_EXACT_REASON: gpt-6-astra absent
from both live subscription catalogs; no Astra-specific reasoning ladder to
discover. Historical API reasoning-level assumptions were not imported.
```

## 9. Bounded live proof

Not eligible: Phase 3 decision law short-circuits Phase 4/5 when Astra is
absent from the live subscription-backed catalog. `MODEL_INVOCATIONS=0`
(no generation, no planner task, no token burn, no retry loops).

## 10. Quota-pool evidence

`account/rateLimits/read` (qualified authority, unchanged code path) returned
pools `codex` and `base_model_inference` with reset-credit fields — no
Astra-specific bucket exists to attribute consumption to.

```text
ASTRA_QUOTA_POOL=chatgpt_codex_subscription (designation preserved; exposure pending)
ASTRA_CONSUMES_CODEX_SUBSCRIPTION_POOL=UNKNOWN (no live Astra usage possible)
OPENAI_API_BILLING_USED=NO
OPENAI_API_QUOTA_POOL_CREATED=NO
ASTRA_API_SURFACE_CREATED=NO
```

## 11. Dynamic-routing compatibility

No router/registry change was needed or made (nothing to represent: Astra is
not in the live catalog).

```text
RESOURCE_REGISTRY_V2=SOLE_CANONICAL_STATIC_ROUTING_POLICY_SOURCE (unchanged)
CODEX_MODEL_DISCOVERY=DYNAMIC (unchanged)
ASTRA_MODEL_ID_SOURCE=LIVE_CODEX_CATALOG (law preserved)
STATIC_ASTRA_MODEL_PIN_CREATED=NO
NO_SILENT_FALLBACK=PASS (focused suite 19/19: DYNAMIC_CATALOG, EXACT_SELECTION,
FUTURE_MODEL_AUTO_DISCOVERY, STALE_MODEL_FAIL_CLOSED)
QUOTA_POOL_IDENTITY=suite 8/8 PASS (fail-closed authority incl. rate-limit
respect, no OpenClaw override); metadata parsing suite PASS
(pool_id=chatgpt_codex_subscription, tolerance 5%).
ROUTING_CHANGED=NO
```

## 12. EXPIRING_ALLOWANCE_USE census

```text
EXPIRING_ALLOWANCE_USE_IMPLEMENTED=NO
EXPIRING_ALLOWANCE_USE_PROVEN=NO
```

Repository census found only fail-closed *unverified-allowance* guards
(`evaluate-quota-aware-route-v1.mjs` `UNVERIFIED_ALLOWANCE_UNKNOWN`,
`rt25-quota-state-join-v1.mjs` null-pool semantics) — the intended
near-reset preference law (prefer higher-capability included model when
READY work + real benefit + reserve/priority permit, never manufactured
work) is NOT implemented. Per task law this is left for a separate bounded
task, not folded into this qualification.

## 13. Issue #35 closure-readiness

```text
A. ASTRA_SUBSCRIPTION_SURFACE=UNAVAILABLE (both surfaces) -> A=FAIL
B. EXPIRING_ALLOWANCE_USE implemented/proven -> NO -> B=FAIL
ISSUE_35_CLOSURE_READY=NO
```

Required blockers toward #35 closure (exact):
1. `gpt-6-astra` not exposed by the current subscription-backed catalog
   (neither IDE nor CLI surface) — positive live qualification impossible now.
2. `EXPIRING_ALLOWANCE_USE` acceptance criterion not yet implemented/proven.

This is a valid QUALIFIED_NEGATIVE outcome, not an executor failure: the
account rollout has simply not reached this subscription yet. Issue #35 was
left untouched (no comment needed; repository persistence is the canonical
method for qualification results here).

## 14. Hard-wall verification

```text
OPENAI_API_KEY_USED=NO
BYOK_USED=NO
ASTRA_OPENAI_API_SURFACE=NOT_CREATED
API_BILLING_MUTATION=NO
CHATGPT_WEB=NOT_USED
HERMES_BROWSER=NOT_USED
N8N/NEW_VPS/OLD_VPS/OPENCLAW/LITELLM_MUTATIONS=NONE
PRODUCTION_DISPATCH=0
PRODUCTION_ROUTE_ACTIVATION=NONE
TELEGRAM_APPROVAL_CONSUMED=NONE
CREDENTIALS_PERSISTED=NONE (sanitized output only)
BENCHMARK_CAMPAIGN=NONE
MEANINGLESS_QUOTA_CONSUMPTION=NONE
MODEL_INVOCATIONS=0
ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0
PRODUCTION_CHANGED=NO
RUNTIME_CHANGED=NO
```

## 15. Exact NEXT

```text
QUALIFICATION_RESULT=QUALIFIED_NEGATIVE_NOT_CURRENTLY_EXPOSED
GPT6_ASTRA_SUBSCRIPTION_QUALIFICATION=QUALIFIED_NEGATIVE
CURRENT_NEXT=WAIT_FOR_SUBSCRIPTION_ASTRA_AVAILABILITY_OR_NEW_EVIDENCE
NEXT=WAIT_FOR_SUBSCRIPTION_ASTRA_AVAILABILITY_OR_NEW_EVIDENCE
```

Re-arm condition: any new evidence of Astra in the live subscription catalog
(newer client version, account rollout signal) re-opens the bounded
qualification path (Phases 4–7) under the same law. The separate
`EXPIRING_ALLOWANCE_USE` task (`V4_EXPIRING_ALLOWANCE_USE_POLICY_V1` class)
is independent of Astra exposure and may proceed on its own evidence.

## Rollback

`git revert` this task's commit removes only this report and the three
canonical doc pointer updates. No adapter, router, registry, or runtime
artifact was modified.

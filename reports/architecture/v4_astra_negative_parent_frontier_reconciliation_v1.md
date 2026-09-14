# V4 Astra negative parent frontier reconciliation V1

**TASK_REF:** `V4_ASTRA_NEGATIVE_PARENT_FRONTIER_RECONCILIATION_V1`
**BASE_HEAD:** `4f65001d35aa41f4586e8dd352efdc9032535eca` (== origin/main == HEAD at start, verified)
**Date (Europe/Rome):** 2026-09-14
**MODE:** DOCUMENTATION / FRONTIER RECONCILIATION ONLY — parent #32, parked child #35

## 3. Astra qualification result (preserved verbatim)

`V4_GPT6_ASTRA_SUBSCRIPTION_SURFACE_QUALIFICATION_V1` (commit `4f65001`)
returned `QUALIFIED_NEGATIVE`: `ASTRA_LIVE_CATALOG_EXPOSED=NO` on both
subscription surfaces (IDE extension binary: gpt-5.6-sol/terra/luna + gpt-5.5;
CLI 0.133.0: gpt-5.5/5.4/5.4-mini/5.3-codex/5.2), `MODEL_INVOCATIONS=0`,
`OPENAI_API_KEY_USED=NO`, `BYOK_USED=NO`, no routing mutation. API/BYOK
remains `OUT_OF_SCOPE` by operator policy.

## 4. Why #35 remains parked (not closed)

Both #35 blockers are external/pending, not failed work: (a) the
subscription-backed catalog does not expose `gpt-6-astra` yet — a provider
rollout fact outside Control Plane control; (b) `EXPIRING_ALLOWANCE_USE`
acceptance is unimplemented, but that is generic #32 architecture now
resumed independently (below). Closing #35 would misstate Astra as
qualified; reopening probing loops would violate the no-polling law.
#35 stays **OPEN**, untouched (state re-verified OPEN this task).

## 5. Child-local WAIT vs global NEXT (the corrected conflation)

The previous frontier wrote the #35 wait condition into the *global*
CURRENT_NEXT slot. That was too wide: a child-scoped external-availability
wait must not freeze the whole #32 track. Persisted separately now:

```text
ISSUE_35_NEXT=WAIT_FOR_SUBSCRIPTION_ASTRA_AVAILABILITY_OR_NEW_EVIDENCE
GLOBAL_CURRENT_NEXT=V4_EXPIRING_ALLOWANCE_USE_POLICY_V1
ISSUE_35_WAIT_CONDITION=SUBSCRIPTION_ASTRA_AVAILABILITY_OR_NEW_EVIDENCE (child-local)
```

No periodic polling is scheduled; a future live-catalog observation re-arms
#35 through normal evidence flow.

## 6. #32 current child status

- #33 Cline-named Qwen DEV profiles → completed (2026-09-05)
- #34 Codex IDE in Cursor via ChatGPT subscription → completed (2026-09-05)
- #35 GPT-6 Astra subscription surface → **OPEN_PARKED_EXTERNAL_AVAILABILITY**
  (QUALIFIED_NEGATIVE 2026-09-14)
- Parent #32 acceptance remains: answer "which adequate model/access surface
  executes this role now" given quality, availability, remaining shared
  quota, reserve, reset, time-dependent cost, urgency — with auditable
  selection reasons. Not yet satisfied; quota/time awareness is the
  unfinished half.

## 7. Dependency check for EXPIRING_ALLOWANCE_USE (selection law)

1. **Still unimplemented?** YES — qualification census proved
   `EXPIRING_ALLOWANCE_USE_IMPLEMENTED=NO`, `EXPIRING_ALLOWANCE_USE_PROVEN=NO`;
   only fail-closed unverified-allowance guards exist
   (`evaluate-quota-aware-route-v1.mjs` `UNVERIFIED_ALLOWANCE_UNKNOWN`,
   `rt25-quota-state-join-v1.mjs` null-pool semantics — the base to extend,
   11.2 KB, already canonical).
2. **Part of #32 acceptance/scope?** YES — issue #35 carries it into the
   track and the parent acceptance literally requires "reset,
   time-dependent cost" answers before each AI call.
3. **Requires Astra?** NO — the intended law is explicitly generic:
   "a higher-capability included model MAY be preferred near a quota reset"
   for eligible quota-backed resources (e.g. glm_coding_plan 5h/weekly
   windows, chatgpt_codex_subscription windows). No Astra dependency.
4. **Earlier unresolved dependency?** NONE found — the frontier's only
   forward pointer was the mis-scoped Astra wait (corrected here); #34/#78/#79
   are closed; quota authority/adapter bases (Phase 0.5 law, app-server
   reader) are canonical and green.
5. **Higher mandatory precedence canonical task?** NONE — the frontier's
   CURRENT_NEXT was the wait marker itself; no other pending gate exists.

All five conditions TRUE → selection is mechanically determined, not invented.

## 8. Selected global next

```text
ASTRA_CHILD_STATE=OPEN_PARKED_EXTERNAL_AVAILABILITY
ASTRA_CHILD_NEXT=WAIT_FOR_SUBSCRIPTION_ASTRA_AVAILABILITY_OR_NEW_EVIDENCE
ASTRA_BLOCKS_PARENT_32=NO
PARENT_32_FRONTIER_RESUMED=YES
GLOBAL_WAIT_ON_ASTRA=NO
EXPIRING_ALLOWANCE_USE_IMPLEMENTED=NO
EXPIRING_ALLOWANCE_USE_PROVEN=NO
CURRENT_NEXT=V4_EXPIRING_ALLOWANCE_USE_POLICY_V1
NEXT=V4_EXPIRING_ALLOWANCE_USE_POLICY_V1
NEXT_HUMAN_GATE_REQUIRED=NO
```

## 9. Production/runtime unchanged proof

Pure documentation task: no Qwen/GLM-route/Codex-inference/Hermes/OpenClaw/
ChatGPT-Web invocation, no browser, no dispatcher tick, no n8n/PostgreSQL/
LiteLLM/NEW-VPS/OLD-VPS mutation, no route-control change, no runtime
authorization, no Telegram gate use, no credential access, no polling
automation created (no cron/scheduled task/n8n/dispatcher checks; no Codex
model/list calls this task — the wait state is persisted text, not a probe
loop). GitHub: #32 and #35 both re-verified OPEN, neither mutated. Only the
three canonical docs + this report change. Cursor using GLM 5.3 as executor
is the sanctioned surface.

```text
ACTIVE_PRODUCTION_AUTHORIZATION_FINAL=0
PRODUCTION_CHANGED=NO
RUNTIME_CHANGED=NO
```

## Rollback

`git revert` this commit removes only the three doc pointer updates and this
report. No runtime, routing, registry, or issue-state artifact was touched.

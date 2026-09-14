# STOP — V4_OPENCLAW_PAPER_RETIREMENT_PHASE_1_V1

**RESULT=STOP**
**Date (Europe/Rome):** 2026-09-14
**BASE_HEAD (verified at start):** `eca01ad147289b422cdec4f3bbd66fbff4d0e395` (origin/main == BASE_HEAD == HEAD, PASS)
**BLOCKER (canonical):**

```
OPENCLAW_PAPER_RETIREMENT_BLOCKED_BY_LIVE_REFERENCE
```

**Exact live caller (single, precise):**

| Item | Value |
|---|---|
| File / caller | `tools/local-dev-resource-observatory-v1.mjs` (imported and invoked LIVE by `tools/serve-local-dev-autonomous-dispatcher-v1.mjs` → `GET /v1/resources` → `buildResourceObservatory` → `collectQuotaObservatory`) |
| Module | `tools/collect-openclaw-quota-v1.mjs` (`getOpenClawQuotaObservation`) |
| Runtime invocation | `openclaw status --usage --json` (fixed args, `execFile`, read-only CLI probe) |
| Live runtime proof (2026-09-14 ~01:55 CEST) | Dispatcher PID 27964 serving `serve-local-dev-autonomous-dispatcher-v1.mjs`; child process PID 5088: `node.exe C:\Users\mrhz\AppData\Roaming\npm\node_modules\openclaw\openclaw.mjs status --usage --json` captured LIVE |
| Endpoint proof | `GET http://127.0.0.1:18793/v1/resources` → `quotas.openclaw = {"collector":"openclaw_usage_live","observed_at":null,"freshness":"stale","cache_hit":false,"refresh_in_progress":true,"reason_codes":["OPENCLAW_USAGE_PENDING"]}` — an OpenClaw CLI invocation was literally in flight during the audit probe |
| Secondary live consumer | `tools/collect-codex-appserver-quota-v1.mjs` reconciliation declares `primary_source: "OPENCLAW_STATUS_USAGE_JSON"`, `routing_authority: "OPENCLAW_PRIMARY"`; observatory line 910 feeds `openclaw.pools.chatgpt_codex_subscription` as the codex reconciliation PRIMARY — OpenClaw is a live routing-authority data plane for the Codex quota pool, not dormant code |

**No disable switch exists.** `collectOpenClaw !== null` is the only guard; the
dispatcher does not pass `collectOpenClaw: null`, so the collector is active by
default in the LIVE scheduled-task runtime. The openclaw CLI itself is installed
and resolvable (`%APPDATA%\npm\node_modules\openclaw\openclaw.mjs` exists).

**Gate outcome per task law:**

- `LIVE_RUNTIME_CALLERS=1` (>= 1 → gate FAIL)
- `UNKNOWN_RUNTIME_REFERENCES=0` (classification of every candidate surface completed)

Because at least one LIVE_RUNTIME_CALLER exists, the main PASS gate is not met.
Task law: STOP at the first blocker, NO repair loop, NO same-pass remediation.

## Caller audit — classification result (complete)

| Reference surface | Classification | Note |
|---|---|---|
| `tools/local-dev-resource-observatory-v1.mjs` + `tools/collect-openclaw-quota-v1.mjs` | **LIVE_RUNTIME_CALLER** | proven by live process + endpoint probe above |
| `tools/collect-codex-appserver-quota-v1.mjs` (`routing_authority: OPENCLAW_PRIMARY`) | LIVE consumer of the same collector output (reconciliation semantics) | same data plane, same finding |
| `configs/resources/registry.json` | NO OpenClaw entry present | registry is already clean — zero work needed there |
| `docs/runtime/CURRENT_FRONTIER.md` | CURRENT_DOC_ONLY (lines 18, 360–366) | mentions `KEEP_STAGED_PENDING` + audit pointer |
| `docs/runtime/LOCAL_DEV_DISPATCHER_OPERATING_MODEL.md` L214–236 | CURRENT_DOC_ONLY | describes the LIVE quota mapping (documenting the live caller) |
| `docs/foundation/PROJECT_VISION.md`, `MULTI_PLANNER…`, `AUTOMATION_ACTIVATION_PLAN.md`, `docs/vps/*.md`, `docs/contracts/planner-routing-policy-v1.md`, `planner-selection-evaluator-v1.md`, `quota-pool-status-v1.md`, `backlog-primary-remote-adapter-v1.md`, `docs/runtime/D0014_*`, `BACKLOG_D0014_WINDOWS_OPENCLAW_FALLBACK.md` | CURRENT_DOC_ONLY (status text only) | explicitly say OpenClaw is NOT an authority / not involved / staged-inactive; describe historical/lane semantics |
| `docs/PM65…/PM62/PM71/PM72/PM56`, `docs/sessions/*`, `docs/handoffs/*`, `docs/runtime-packets/*`, `docs/packets/*`, `docs/decision-packets/*`, `reports/architecture/d0025_*`, older v4 reports | HISTORICAL_EVIDENCE | left untouched per law |
| `tools/build-openclaw-responses-request.mjs`, `tools/validate-openclaw-*`, `tools/adapt-openclaw-bridge-artifact.mjs` | DORMANT_CODE | dry-run validators/builders; no live caller chain into production runtime |
| `tools/run-litellm-primary-cycle.mjs` → `validate-openclaw-planner-response-gate.mjs` (evaluate) | DORMANT_CODE (response shape gate import; schema name only, no OpenClaw invocation) | LiteLLM cycle itself not live-activated |
| `tests/*` (openclaw-planner-response-gate, openclaw-consumer-roundtrip, openclaw-quota-collector-v1, codex-appserver-quota-v1, local-dev-dispatcher-service-v1, llm-gateway-*) | DORMANT_CODE / test-only | no production route requires OpenClaw as runtime |
| `workflows/*` (wf60 template, patches) | HISTORICAL_EVIDENCE | D-0025 frozen, never re-opened |

**Registries verified unchanged and OpenClaw-free:** resource registry v2 has no
OpenClaw entry; no selector or fallback can currently route to OpenClaw (T3/T4
already satisfied); LiteLLM, n8n, Qwen/Hermes/Codex/GLM routes untouched.

## Why NOT a doc-only conclusion

The Phase-1 mission said "paper retirement only" assuming OpenClaw had **zero
runtime callers**. That assumption is disproven by the audit: the quota
observation lane (#73) executes the OpenClaw CLI live from the production
dispatcher. Changing that is a REAL runtime behavior change (quota source for
`chatgpt_codex_subscription` + `glm_coding_plan` projection), which is exactly
what this task was forbidden to do. Hence STOP, no workaround, no repair.

## Next actionable direction (NOT executed, pending separate authorization)

Retire the OpenClaw **quota observation lane** first (PHASE_0.5), e.g. a
separately gated task that:

1. passes `collectOpenClaw: null` (or equivalent config flag) at the dispatcher
   call site — runtime behavior change, explicitly gated;
2. reclassifies `collect-codex-appserver-quota` reconciliation authority law
   (OpenClaw-primary → Codex app-server primary or UNKNOWN fail-closed);
3. updates the two CURRENT_DOC_ONLY surfaces that document this lane
   (`LOCAL_DEV_DISPATCHER_OPERATING_MODEL.md`, `quota-pool-status-v1.md`);
4. then re-runs this caller audit (expected `LIVE_RUNTIME_CALLERS=0`) and only
   afterwards executes the actual PAPER retirement (frontier + registry/diagram
   surfaces), which is then a true no-runtime-change pass.

Alternative to be decided by the operator: OpenClaw CLI quota observation may
also be deliberately KEPT as the live quota source (it was qualified and closed
as issue #73 CLOSED/COMPLETED) and the consolidation audit's `RETIRE`
disposition amended to scope only the broker/fallback role — a semantic
correction, not a retirement. This decision belongs to the operator, not to
this task.

## Rollback

Nothing was modified: `git status` after STOP = only pre-existing unrelated
dirty runtime artifacts (mcp-gate suite result JSONs, present before task
start). No revert required; no runtime procedure required.

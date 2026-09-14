# V4 Hermes CDP governance unification — Phase 2

**TASK_REF:** `V4_HERMES_CDP_GOVERNANCE_UNIFICATION_PHASE_2_V1`
**Classification:** `PASS`
**BASE_HEAD:** `47fbd800238af9f91aa49c12135d6cf0dd8afe8b`
**Date (Europe/Rome):** 2026-09-14

## Result

```text
HERMES_CDP_GOVERNANCE_UNIFICATION_PHASE_2=PASS
LEGACY_GOVERNED_CDP_GLUE_ACTIVE=NO
HERMES_NATIVE_GOVERNED_CDP=CANONICAL
LEGACY_GOVERNED_CDP_GLUE_ACTIVE_CALLERS=0
LEGACY_LIVE_CALLERS=0
UNKNOWN=0
HERMES_NATIVE_PARITY=PASS
PREFILL_ONLY_PROOF=PASS
RAW_CDP_CONTROLLER_EXPOSURE=NO
PUBLIC_EXPOSURE=NO
VISUAL_SIDECAR_UNCHANGED=YES
PRODUCTION_CHANGED=NO
RUNTIME_AUTHORITY_CHANGED=NO
NEXT=PHASE_3 scheduler dedup LOCAL_DEV
PHASE_3_HUMAN_GATE_REQUIRED=YES
```

The Phase 2 audit found no active qualification or live runtime caller that
needed a code import swap. The already-qualified Hermes-native path is
therefore the canonical path for the current proof surfaces, while the two
legacy Python files remain present but inactive for rollback. This is a
bounded governance consolidation, not a deletion or vendor patch.

## Legacy census

| Path / reference | Classification | Finding |
|---|---|---|
| `tools/hermes_governed_cdp_composer_v1.py` | `LEGACY_TOOLING_ROLLBACK` | Repo-owned guarded composer adapter; no current runtime or qualification caller. |
| `tools/apply-hermes-governed-cdp-v1.py` | `LEGACY_TOOLING_ROLLBACK` | Apply/verify/rollback helper only; not invoked by a current flow. |
| `tests/hermes-governed-cdp-adapter-v1/run.mjs` | `TEST_ONLY` | Static regression test intentionally retains references to verify the legacy guard and rollback surface. |
| architecture reports and audit rows | `HISTORICAL_EVIDENCE` / `DOC_ONLY` | Historical provenance and disposition records; not executable callers. |

The repository-wide path census produced:

```text
LIVE_RUNTIME_CALLER=0
ACTIVE_QUALIFICATION_CALLER=0
UNKNOWN=0
LEGACY_GLUE_ACTIVE_CALLERS=0
EXACT_FLOWS_MIGRATED=0 (no active legacy caller existed)
LEGACY_GLUE_FILES_PRESERVED_FOR_ROLLBACK=YES
```

No external runtime caller, dispatcher path, production route, or browser
send path was found. The remaining source references are deliberately
test-only, rollback, or historical references.

## Native parity and authority boundaries

The native Hermes path remains the qualified per-invocation allowlist surface.
Its model-visible tools are exactly:

```text
browser_navigate
browser_snapshot
browser_type
browser_press
```

The following remain non-visible and non-dispatchable to the controller:

```text
browser_cdp
browser_console
browser_exec
```

The Phase 2 parity result is:

```text
PREFILL_ONLY=YES
RAW_CDP_MODEL_EXPOSURE=NO
LOOPBACK_OR_PRIVATE_ONLY=YES
PUBLIC_CDP_EXPOSURE=NO
EPHEMERAL_EXPOSURE_WINDOW=YES
SANITIZED_EVIDENCE=YES
SECRET_PERSISTENCE=NO
PRODUCTION_DISPATCH=NO
```

The visual observation sidecar from issue #78 was not modified, replaced, or
used as an authority. Its state remains independent of Hermes tool governance.

## Proof and regressions

Persisted V7 qualification evidence remains the source for the bounded,
prefill-only browser proof: exact target/composer discovery, exact prefill,
DOM verification, clear, hash proof, and clear completed without Enter or a
ChatGPT user turn. No new browser interaction, provider call, Qwen/Hermes
generation, or production action was performed for this Phase 2 census because
no legacy caller existed to migrate.

Deterministic local regressions executed after the census:

```text
node tests/hermes-governed-cdp-adapter-v1/run.mjs
FOCUSED_TESTS=PASS

node tests/hermes-per-invocation-browser-allowlist-v1/run.mjs
FOCUSED_CHECKS=73
PASSED=73
FOCUSED_TESTS=PASS
```

These checks cover the fixed legacy guard, native allowlist, state gates,
DOM-confirmation fence, exact payload identity, no-retry budget, and exclusion
of raw CDP/console/exec. No test changed the browser, provider, dispatcher,
queue, receipts, n8n, VPS, or production state.

## Files and hard-wall verification

The only files changed by this task are:

```text
docs/runtime/CURRENT_FRONTIER.md
docs/runtime/LAST_CURSOR_REPORT.md
reports/architecture/v4_hermes_consolidation_component_retirement_audit_v1.md
reports/architecture/v4_hermes_cdp_governance_unification_phase_2_v1.md
```

No file under `tools/`, `tests/`, or `workflows/` was changed. No production
dispatch or activation, ChatGPT send, Enter action, raw/public CDP exposure,
credential/token/cookie persistence, n8n/VPS/OpenClaw/LiteLLM/GLM mutation,
issue mutation, or Phase 3 execution occurred.

## Rollback and residual references

Rollback is available because both legacy Python files remain intact and no
vendor installation was patched. Reverting the four documentation changes
restores the pre-Phase-2 documentation state; re-enabling the legacy tooling
would remain an explicit, separately governed decision. The residual test and
historical references are retained to preserve the security and provenance
record, but they do not constitute active callers.

The next bounded slice is Phase 3 scheduler deduplication for LOCAL_DEV and
requires a human gate. Phase 3 is not executed or pre-claimed here.

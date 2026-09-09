# V4 Codex app-server secondary quota collector v1

ISSUE=73
COMPONENT=CODEX_APPSERVER_SECONDARY_QUOTA_COLLECTOR
PRIMARY_SOURCE=OPENCLAW_STATUS_USAGE_JSON
SECONDARY_SOURCE=CODEX_APP_SERVER_ACCOUNT_RATE_LIMITS_READ
QUOTA_POOL_ID=chatgpt_codex_subscription
SECOND_POOL_CREATED=NO
SOURCE_SEMANTICS=USED_PERCENT
EFFECTIVE_QUOTA_LAW=MIN_BINDING_WINDOWS
BANKED_RESETS=OBSERVE_ONLY
RESET_CONSUMPTION=0
PROVIDER_CALLS_AUTONOMOUS_RUN=0
MODEL_INFERENCE=0
ROUTING_AUTHORITY_CHANGED=NO
RUNTIME_PROMOTION=SEPARATE_HUMAN_GATED_STEP
RESULT=PASS

## Scope

`tools/collect-codex-appserver-quota-v1.mjs` is an offline adapter for an
already-collected or fixture response corresponding to
`account/rateLimits/read`. It does not open a transport, invoke Codex, read
credentials, refresh authentication, or write an observation.

The Codex app-server response uses `usedPercent`. The adapter derives:

```text
remaining_percent = clamp(100 - usedPercent, 0, 100)
```

The required 5h (`windowDurationMins=300`) and weekly
(`windowDurationMins=10080`) windows are binding. The effective value is the
minimum of both fresh binding windows. Missing, malformed, stale, or ambiguous
binding evidence produces an explicit `unknown` result.

Reset timestamps and duration metadata are retained in the normalized window.
No timezone conversion is invented. Banked reset inventory is retained only as
bounded advisory data and has no effect on effective capacity.

## Shared identity and reconciliation

`codex_ide_cursor_extension` and `codex_external_planner` remain observations of
the one pool `chatgpt_codex_subscription`. The adapter emits one pool entry and
never sums the OpenClaw and app-server observations.

`reconcileCodexQuotaObservations()` compares fresh comparable effective values
with a deterministic absolute tolerance of **5 percentage points**:

- `MATCH`: exact equality;
- `WITHIN_TOLERANCE`: nonzero difference up to 5 points;
- `MISMATCH`: difference greater than 5 points;
- `UNKNOWN`: either observation is missing or not fresh/comparable.

OpenClaw is always the primary authority. A secondary mismatch is diagnostic
only and cannot replace the primary value. A stale secondary cannot downgrade a
fresh primary. A stale or missing primary does not promote the secondary to
routing authority.

The resource observatory accepts only an injected
`codexAppServerResponse`/`codexAppServerObservation` fixture for this slice.
When present, the normalized secondary observation and reconciliation are
attached to the existing single Codex pool; the canonical OpenClaw projection
and routing inputs are unchanged.

## Safety boundary

There is no reset-credit action in the module or exported API. In particular,
the app-server reset-credit consumption method is not called or represented.
Raw provider responses are not persisted or echoed. Secret-like input is
rejected fail-closed, and normalized output is bounded to quota, timestamp,
window, and reconciliation metadata.

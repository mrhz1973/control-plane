# V4 local runtime read-only contribution — live double-diagnostic STOP (operator relay)

**Source:** operator-relayed Cursor terminal result  
**Independent repository verification:** NO — producer remains uncommitted in the operator workspace  
**Canonical remote HEAD before this evidence update:** `1da67135a9bc72794e7c1d3383202996ab7ff581`

## Reported terminal result

`STOP — LIVE_DIAGNOSTIC_POWERSHELL_PROCESSES=2 (CLI double-invokes gatherQwenDiagnostics) / REQUIRED=1 / GENERATIONS=0`

The report is accepted as operator-relayed evidence only. The relevant producer code is still local/uncommitted and therefore cannot be independently inspected from canonical GitHub yet.

## Reported completed work

- Preservation stash `v4-local-readonly-adapter-28of29-preserve` still held.
- Local HEAD synced to canonical remote `1da67135a9bc72794e7c1d3383202996ab7ff581`.
- Prior false-positive diagnosis verified.
- Comment-only correction applied; test guard unchanged; classifier/PowerShell/OpenCode logic otherwise unchanged.
- Target suite: **29/29 PASS** once.
- Regressions: **34 + 7 + 6 + 12 PASS** once each.
- Live producer proof executed exactly once and not repeated.

## Reported live proof result

- contribution schema: valid
- `qwen_occupancy_classification`: `QWEN_OCCUPANCY_UNCERTAIN`
- `qwen_available`: `false`
- `opencode_static_classification`: `OPENCODE_STATIC_DISPATCH_READY`
- `opencode_available`: `true`
- `launch_performed`: `false`
- `generation_calls`: `0`
- resources: exactly `qwen_local` + `opencode`

These values are operator-relayed and not independently verified until the producer is committed.

## Exact reported blocker

The CLI path reportedly evaluates `gatherQwenDiagnostics(runtimeConfig)` twice when extracting `sampleA` and `sampleB`, causing two PowerShell diagnostic processes during the single live producer run.

Reported local shape:

```js
gatherQwenDiagnostics(runtimeConfig).sampleA,
gatherQwenDiagnostics(runtimeConfig).sampleB,
```

Required hard counter is exactly one diagnostic PowerShell process per producer run.

## Minimal corrective boundary

Authorize one production-logic correction only:

```js
const diag = gatherQwenDiagnostics(runtimeConfig);
```

then consume `diag.sampleA` and `diag.sampleB` from that single result.

No other production behavior is to change. In particular:

- no change to diagnostic PowerShell contents;
- no change to occupancy classifier;
- no change to OpenCode static inspection;
- no change to contribution mapping/schema;
- no weakening of tests;
- no workflow/runtime/config mutation;
- no Qwen/OpenCode/provider execution.

After the correction: target once, regressions once, then one new read-only live proof once. Any failure stops immediately.

## Safety counters reported at STOP

- Qwen generations: 0
- Qwen HTTP inference calls: 0
- OpenCode CLI calls: 0
- process kill/stop/restart calls: 0
- provider calls: 0
- workflow mutations: 0
- secret exposure: false

## NEXT

`V4_LOCAL_RUNTIME_READONLY_SINGLE_DIAGNOSTIC_BIND_CORRECTION_ONE_PASS`

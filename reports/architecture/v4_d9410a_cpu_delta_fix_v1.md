# V4_D9410A_CPU_DELTA_FIX_AND_CLOSE_V1 — D-9410-A CPU delta sampling fix and closure

RESULT=PASS
TASK_REF=V4_D9410A_CPU_DELTA_FIX_AND_CLOSE_V1

OPERATOR_DECISION=FIX

BASE_HEAD=b23627a89eefa6046f99e0e730365ae9dcffe48a
FINAL_HEAD=38dfe456c7b45aa432adfc8478ff1c606d00a6e6

DIRTY_FILES_BEFORE=tools/local-dev-resource-observatory-v1.mjs; tests/local-dev-resource-observability-integrity-v1/run.mjs
DIRTY_FILE_COUNT_BEFORE=2

DEFECT_FIXED=YES
CPU_SOURCE=cat /proc/stat
CPU_SAMPLING_MODE=DELTA
CPU_SAMPLE_INTERVAL_MS=1000 (bounded local delay, clamped 500..1500; injectable via cpuSampleIntervalMs for tests)

DELTA_FIELDS=user; nice; system; idle; iowait; irq; softirq; steal
DELTA_VALIDATION=fail-closed: null sample, malformed aggregate line, <8 fields, non-numeric or negative counter, negative (non-monotonic) per-field delta, delta_total<=0, result outside 0..100, or either SSH read failure -> cpu_percent=null; VPS reachability and all other resource fields remain unaffected

FOCUSED_TEST_COMMAND=node tests/local-dev-resource-observability-integrity-v1/run.mjs
FOCUSED_TEST_RESULT=7/8 PASS (all CPU/VPS/D-9410-A assertions PASS; delta proof 78.7% from two mocked samples; exactly two canonical `cat /proc/stat` remote reads asserted; fail-closed on malformed second sample asserted)

KNOWN_BASELINE_FAILURE_PRESENT=YES (single pre-existing unrelated failure: "quota, Codex capability and Cursor accounting are separate" — NOT_OBSERVED vs STALE; signature unchanged from canonical review)
NEW_TEST_FAILURES=0

LIVE_CPU_PROBE=PASS (canonical read-only SSH path, bypassCache, full allowlisted command set + bounded second /proc/stat read)
LIVE_CPU_PERCENT=5.4 (probe 1); 5.8 (live /v1/resources after service reload)
MANUAL_CROSS_CHECK=3.38%..7.74% (independent two-sample ssh deltas at ~0-3 s intervals) — consistent

READ_ONLY_VPS=YES
VPS_MUTATIONS=0

D9410A_IMPLEMENTATION_COMMITTED=YES
PRIMARY_WORKTREE_CLEAN=YES

WF90_CHANGED=NO
TELEGRAM_CHANGED=NO
N8N_CHANGED=NO
OTHER_PROJECT_FILES_CHANGED=0

LOCAL_SERVICE_RESTARTED=YES (canonical Scheduled Task `ControlPlane-V4-LocalDevDispatcher`; pre-restart check `status.active=false` (no active LOCAL_DEV execution interrupted); post-restart `/v1/status` 200 + healthy; the running service held the old module in memory and exposed cpu_percent=null until restart)

SECRETS_EXPOSED=0

COMMIT=38dfe456c7b45aa432adfc8478ff1c606d00a6e6
REMOTE_HEAD_VERIFIED=YES

## Implementation notes

- `tools/local-dev-resource-observatory-v1.mjs`
  - Replaced cumulative-since-boot `parseCpuPercentFromStat` with:
    - `parseCpuStatSample(text)` — parses one aggregate `cpu ` line into the 8 canonical counters (fail-closed);
    - `computeCpuPercentFromDeltaSamples(first, second)` — per-field deltas, `busy = user+nice+system+irq+softirq+steal`, `total = busy+idle+iowait`, `cpu_percent = delta_busy/delta_total*100` rounded to 0.1.
  - `createCanonicalVpsSshRunner`: after the allowlisted command sweep, if `cat /proc/stat` ran, it waits a bounded local interval (default 1000 ms, clamped 500..1500 ms) and issues a SECOND read of the SAME canonical remote command `cat /proc/stat`, storing it under the local result key `cat /proc/stat#2`. The remote command string is byte-identical to the allowlisted one (a `#2` suffix in the remote command would make remote `cat` fail — found and fixed during live qualification). Single sequential path, same per-command timeout, BatchMode, single-flight and cache semantics preserved.
- `tests/local-dev-resource-observability-integrity-v1/run.mjs`
  - Fixture now serves two distinct `/proc/stat` samples by read count; asserts delta result 78.7% (delta_busy=740, delta_total=940), exactly two remote `cat /proc/stat` calls, read-only posture, and fail-closed null on a malformed second sample without affecting reachability.

## WF90 natural resolution

Primary worktree clean after commit; next natural WF90 tick no longer reports TRACKED_DIRTY_CONFLICT (verified via dispatcher diagnostics/status; HUMAN_GATE from the dirty handoff no longer active).

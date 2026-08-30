# V4 — local runtime read-only private endpoint target hang STOP (operator-relayed)

**Task ref:** `V4_LOCAL_RUNTIME_READONLY_PRIVATE_ENDPOINT_IMPLEMENTATION`  
**Evidence class:** operator-relayed / not independently verified  
**Starting/final repo HEAD reported:** `b56837f1306d151e3458130a6452ab1559595bb6`  
**Commit/push:** none  
**Runtime mutation:** none

## Reported result

`STOP — LOCAL_READONLY_PRIVATE_ENDPOINT_TARGET_HUNG_TEST2_RESPONSE_NEVER_SENT / GENERATIONS=0`

Target suite was started once. Test 1 passed; test 2 (`valid GET returns producer wrapper`) hung because the server never completed the response.

## Reported root cause

In local uncommitted `tools/serve-v4-local-runtime-readonly-contribution-v1.mjs`, `createLocalRuntimeStatusHandler` registered a disconnect guard on the request stream with `req.on("close", ...)`.

For a bodyless GET on current Node, the request `IncomingMessage` may emit `close` when the request message completes, while the asynchronous producer `evaluate()` is still pending. The handler then marks the request as settled. When `evaluate()` later resolves, the `.then(...)` path observes `settled` and returns without calling `send(200, ...)`, leaving the client waiting indefinitely.

The reported minimal correction is to scope premature-disconnect handling to the response object instead: `res.on("close", ...)` and release the in-flight guard only when `!res.writableEnded` and not already settled.

## One-pass stop state

- no corrective edit after the hang;
- no target rerun;
- regressions not run;
- no scheduled task created;
- no Tailscale Serve change;
- loopback port 18790 reported free;
- existing OpenClaw root route reported intact;
- producer evaluations: 0;
- diagnostic PowerShell processes: 0;
- Qwen/OpenCode/provider generations/calls: 0;
- workspace retains only untracked endpoint block artifacts.

## Canonical interpretation

This is a bounded implementation defect in the uncommitted endpoint HTTP lifecycle, not an architecture or transport blocker. The next pass should preserve the current local artifacts, sync canonical remote docs, restore only endpoint block paths, authorize exactly one production change in `createLocalRuntimeStatusHandler`, rerun the target once, then continue the original regression/runtime sequence only if green.

## NEXT

`V4_LOCAL_RUNTIME_READONLY_RESPONSE_CLOSE_GUARD_CORRECTION_ONE_PASS`

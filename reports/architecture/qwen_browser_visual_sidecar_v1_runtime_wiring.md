# QWEN_BROWSER_VISUAL_SIDECAR_V1_RUNTIME_WIRING

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_RUNTIME_WIRING`
**Classification:** `PASS — sidecar wired into the real project-owned Hermes browser path`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `a121c9c613dc8556b255a54df4eb1f992b630602`

## Gap closed

Until now `observeVisually()` was reachable only from its own module and the
tests. This task added the smallest real integration point and proved the
full caller flow:

```
QWEN_LOCAL controller
  → DOM/accessibility via REAL Hermes bridge (exec-tool browser_snapshot)
      → SUFFICIENT  ⇒ continue normally (sidecar_calls = 0)
      → INSUFFICIENT ⇒ observeVisually() exactly ONCE
          → structured observation (@eN refs, zero invented targets)
          → back to the controller layer
```

## New project-owned surface (one file)

`tools/hermes-visual-observation-adapter-v1.mjs`:

- `boundedBridge()` — one bridge invocation under the sidecar's
  `runBoundedTree` (absolute deadline ⇒ `taskkill /T /F`). Per-process env:
  `BROWSER_CDP_URL` pins the endpoint (the documented per-invocation
  `/browser connect` equivalent) and `HERMES_HOME` points at an EPHEMERAL
  temp config home (see "SSRF guard" below). The real user Hermes home is
  never read or mutated.
- `domGateDecision()` — deterministic, code-owned DOM gate on the
  bridge-sanitized envelope (`decision === "DISPATCHED"` && `success` &&
  `element_count >= minElements`). The decision is NEVER left to the model;
  anything unverifiable falls back to the read-only visual path (fail-closed
  direction).
- `observeWithDomGate()` — one observation cycle; at most ONE
  `observeVisually()` call; fail-closed envelopes with zero invented
  targets on bridge error / snapshot failure / ambiguity / unavailability /
  blocked-Qwen. Read-only: the adapter never clicks, types, navigates,
  presses, evaluates JS, authorizes routes, creates/claims tasks, dispatches.
  The only bridge tool used is `browser_snapshot` (already in
  `EXACT_ALLOWLIST` — no 5th model-visible tool, no authority expansion).
- `AUTOVIA` marker: every cycle envelope carries
  `autovia.can_use_real_browser_observation_path = true` — a future allowed
  autonomous task on the qualified runner can use this same read-only
  observation path. No autonomous task was activated; no selector/claim
  authority or Autovia policy changed.

No vendor Hermes file was modified; no new sidecar; OCR=NO; VLM=NO.

## SSRF guard discovery (loopback fixture policy, not a bypass)

The real Hermes `browser_snapshot` handler blocked the loopback fixture page
("page URL targets a private or internal address"): the vendor SSRF guard is
active for non-local backends unless `browser.allow_private_urls` is set in
the **scoped** config home. The adapter therefore runs each bridge process
with an ephemeral `HERMES_HOME` containing ONLY
`browser:\n  allow_private_urls: true` (created in temp, deleted after the
call). This is equivalent to the operator consent switch, applied per-process
and never persisted; production config and real profiles are untouched, and
the guard's purpose (protect REMOTE browsing from private-network pivots) is
not weakened for any other surface.

## Real-path proof (T1–T16, `tests/qwen-browser-visual-sidecar-runtime-wiring/run.mjs`)

Single run `RESULT: PASS — 23 passed, 0 failed` (~77 s), all through the REAL
caller (never `observeVisually()` directly as the only proof):

- T1 rich page: gate SUFFICIENT (elements=3), `sidecar_calls=0`;
- Cycle 2 (policy `minElements=10 > 3`, rich page active): INSUFFICIENT →
  visual fallback → **ambiguity=NONE, refs `@e1,@e2,@e3`**, targets ≡ refs
  (T3B/T4) — structured observation reaches the controller layer;
- Cycle 3 canvas-only page: INSUFFICIENT → **EMPTY_ANNOTATIONS**, zero
  targets (T2/T2B — the correct fail-closed answer when nothing is
  annotatable);
- T5: deterministic capture failure through the real caller →
  `CONNECT_TIMEOUT_BOUNDED`, tree killed, `UNAVAILABLE`, zero targets,
  **10.5 s** total (budget < 20 s);
- T6 screenshots ephemeral (default dir = 0 pngs);
- T7 VISUAL_INSPECTION telemetry in the #79 lane (7 entries, activity_type
  stable across the ACTIVE→terminal stage overwrite);
- T7B exactly ONE sidecar activity per observation cycle;
- T8 Qwen READY before (40 ms) / after (14 ms); T9 OCR off; T10 VLM off;
- T11 no action authority (adapter dispatches only `browser_snapshot`);
- T12 loopback-only CDP; T13 temp profile only (no vendor mutation);
- T14 no secret persistence; T15 zero process leaks after reap
  (`AGENT_BROWSER_FINAL=0`), no orphan Chrome;
- T16 previous sidecar regression suite re-run inside: **28/28 PASS**.

Fixture plumbing note: agent-browser client connections resolve the
browser's first/active target, so the poor-page cycle opens the canvas tab
and closes the rich one (pure CDP `/json` target management — no navigation
by the observation path).

## Acceptance

REAL_RUNTIME_CALLER_WIRED=PASS · DOM_REMAINS_DEFAULT=PASS ·
DOM_INSUFFICIENT_TRIGGERS_VISUAL=PASS · SIDE_CAR_CALLS_MAX_PER_CYCLE=1 ·
STRUCTURED_OBSERVATION_REACHES_CONTROLLER_LAYER=PASS ·
FAIL_CLOSED_AMBIGUITY=PASS · FAILURE_PATH_BOUNDED=PASS ·
SCREENSHOT_EPHEMERAL=PASS · QWEN_PRIMARY_STABILITY=PASS ·
VISUAL_INSPECTION_TELEMETRY=PASS · AUTOVIA_COMPATIBILITY=PASS
(`AUTOVIA_CAN_USE_REAL_BROWSER_OBSERVATION_PATH=YES` demonstrated) ·
ACTION_AUTHORITY=NO · OCR_ENABLED=NO · VLM_ENABLED=NO · PROCESS_LEAKS=0 ·
REGRESSIONS=PASS · REAL_CHATGPT_WEB_SENDS=0 · PRODUCTION_CHANGED=NO

## Next

Issue #78 can be evaluated for closure as minimum capability complete
(observation fallback wired, qualified, bounded). OCR escalation remains
gated on real evidence that `--annotate` is insufficient — no automatic
installation.

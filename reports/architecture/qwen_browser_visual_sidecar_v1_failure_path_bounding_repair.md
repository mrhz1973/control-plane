# QWEN_BROWSER_VISUAL_SIDECAR_V1_FAILURE_PATH_BOUNDING_REPAIR

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_FAILURE_PATH_BOUNDING_REPAIR`
**Classification:** `PASS — T5 blocker repaired; sidecar materially complete`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `7faf6f9372582a5fb0162bdef58988c2e8573240`
**Supersedes:** `STOP_MINIMAL_IMPLEMENTATION.md` (blocker `T5_FAILURE_PATH_PROBE_NOT_BOUNDED`)

## Scope law

This task repaired ONLY the T5 blocker of
`QWEN_BROWSER_VISUAL_SIDECAR_V1_MINIMAL_IMPLEMENTATION`. The sidecar was
already 24/25 PASS at STOP; its architecture, laws and proven results were
preserved (the three files left uncommitted by the STOP were carried into
this commit, per operator instruction — never reset/checked-out/stashed).

## Worktree verification at start

`origin/main == HEAD == 7faf6f9`. Dirty worktree matched exactly the three
preserved files (`tools/qwen-browser-visual-sidecar-v1.mjs` untracked,
`tools/agent-activity-registry-v1.mjs` modified-additive,
`tests/qwen-browser-visual-sidecar-implementation/run.mjs` untracked).
All other untracked entries (n8n/wf40 operator scripts, tmp probes,
`.cursor/` diagnostics) pre-date this task lineage (present in the git
status of previous task starts) and were left untouched — recorded as a
bounded, documented deviation, no foreign file staged.

## Root cause (repaired)

Three stacked defects, all proven empirically with bounded probes:

1. **Per-call `--cdp` deadlocks a live daemon.** The vendor daemon keeps ONE
   endpoint per session; issuing `--cdp <port>` per invocation on a daemon
   already attached to a different (or stale) endpoint hangs forever — this
   is the original 33 min / 1.7 h probe hang.
2. **`npx --yes` cold-start is unbounded** (network + resolution) and spawns
   an unresolved child that outlives exec timeouts.
3. **False timeout on daemon-spawning commands.** When the CLI starts the
   daemon as its own child, that grandchild inherits the stdout pipe, so the
   Node `close` event never fires even though the command SUCCEEDED (proof:
   `✓ Done` captured in stdout, then a fabricated 60 s timeout). Completion
   must hook process `exit`, not stream `close`.

Two additional vendor behaviors were discovered and are now handled:

4. `screenshot --annotate` silently returns NO `annotations[]` unless a
   `snapshot` (accessibility tree with @eN refs) was taken first on the
   pinned session.
5. Daemon cold-start `connect` takes ~20 s wall on this workstation even
   when loopback-only — budgets must exceed it while staying bounded.

## Repair (project-owned, vendor untouched)

`tools/qwen-browser-visual-sidecar-v1.mjs` — additive hardening only:

- `resolveAgentBrowserExe()` — pins the vendor binary DIRECTLY from the npx
  cache at the exact qualified version (0.26.0). NO `npx`, NO network, NO
  cold-start, NO vendor install/patch. `AGENT_BROWSER_EXE` override honored.
- `runBoundedTree(exe, args, timeoutMs)` — bounded process-tree runner:
  direct `spawn`, ABSOLUTE deadline, deadline ⇒ `taskkill /PID <pid> /T /F`
  (Windows tree-kill; the only mechanism proven to reap the vendor daemon's
  children — Promise.race/AbortSignal do NOT). Completes on `exit` (with
  100 ms buffer flush) instead of `close`, killing defect (3).
- `captureAnnotatedScreenshot()` — THREE-STEP bounded flow implementing the
  DAEMON LAW (pin, never re-switch):
  1. `connect <cdp>` — pins the caller's endpoint (clamp ≤ 45 s ≥ observed 20 s);
  2. `snapshot` — populates @eN refs (clamp ≤ 20 s);
  3. `screenshot --annotate` — annotated capture (full `timeoutMs`).
  Every step fail-closed (`CONNECT_TIMEOUT_BOUNDED`, `SNAPSHOT_TIMEOUT_BOUNDED`,
  `ANNOTATION_TIMEOUT_BOUNDED`, …) with zero invented targets.

Test harness (`run.mjs`): T5 rebuilt as the deterministic bounded-failure
proof; daemon preamble comment updated to the pinned-endpoint law; T2B now
prints the failure note; temp-dir cleanup hardened against EPERM races with
just-killed children.

## T5 proof (deterministic, seconds — not the hours of the blocker)

`timeoutMs: 1` is an absolute deadline: capture fails via
`CONNECT_TIMEOUT_BOUNDED` with `timed_out=true, killed_tree=true`,
`observeVisually` returns `ambiguity=UNAVAILABLE`, `candidate_targets=[]`,
temp screenshot deleted, and the probe-attributable process count does not
grow. Last green run measured **T5 total = 960 ms** (budget < 20 s; blocker
was 33 min–1.7 h).

## Full suite (single run, this tree)

`RESULT: PASS — 28 passed, 0 failed` (~28 s wall), including:

- T1 DOM-sufficient skips sidecar; T2/T2B DOM-insufficient triggers it;
- T3 `@e1,@e2,@e3` ref mapping on live annotated capture (restored);
- T4 screenshots ephemeral (own temp + CLI default dir = 0 pngs);
- T5/T5B/T5C/T5D bounded failure path (see above);
- T6/T7 ambiguity + malformed fail-closed, zero targets;
- T8/T8B Qwen-unhealthy refusal (unit + E2E); T9 Qwen READY after (14 ms);
- T10 `OCR_ENABLED=false`; T11 `VLM_ENABLED=false`;
- T12 loopback-only CDP; T13 temp-profile only; T14 no secret persistence;
- T15 no action authority; T16/T16B/T16C `VISUAL_INSPECTION` in the #79
  lane, no image data, stage enum additive;
- T9C no orphan Chrome; T4B resource pressure reported
  (VRAM used 9144 / free 2972 MiB, Qwen READY throughout);
- Regressions: T17 #79 lane 23/23; T18A MCP gate 37/37; T18B dispatcher
  69 passed / 0 failed.

## Post-run orphan audit

`AGENT_BROWSER=0` after session-daemon reap (the one daemon found after the
suite was the by-design session daemon of T2B's successful capture; reaped;
`PORT_9226=DOWN`, `CHROME=0`). Orphan processes attributable to probes: 0.

## Invariants preserved

Qwen stays controller; Hermes stays bridge; DOM remains the primary
observation method (the sidecar is invoked only when `domSufficient` is
false); observation-only (no click/type/navigate/eval authority); no public
CDP; no browser-profile mutation; no OCR; no VLM; no vendor patch; no
second execution authority; #79 lane unchanged (additive `VISUAL_INSPECTION`
stage only). REAL_CHATGPT_WEB_SENDS=0. PRODUCTION_CHANGED=NO.

## Next

The minimal implementation is materially complete/superseded by this repair
PASS. OCR escalation remains EVALUATION-GATED: pursue
`QWEN_BROWSER_VISUAL_SIDECAR_V1_OCR_ESCALATION_EVALUATION` only if real
evidence shows `--annotate` is insufficient. Do not install OCR automatically.

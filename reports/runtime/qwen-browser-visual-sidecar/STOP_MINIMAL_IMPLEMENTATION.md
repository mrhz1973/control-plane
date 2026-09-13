# STOP — QWEN_BROWSER_VISUAL_SIDECAR_V1_MINIMAL_IMPLEMENTATION

**TASK_REF:** `QWEN_BROWSER_VISUAL_SIDECAR_V1_MINIMAL_IMPLEMENTATION`
**Classification:** `STOP — FIRST_ACTIONABLE_BLOCKER: T5_FAILURE_PATH_PROBE_NOT_BOUNDED`
**Date (Europe/Rome):** 2026-09-13
**BASE_HEAD:** `57f6555c86affe5db3169925845ec04426899825`
**Worktree at STOP:** uncommitted (operator-ordered preserve — see Worktree State)

## First actionable blocker

**T5 failure-path probe/test harness non termina in modo bounded.**

### Evidence (chronological, bounded)

1. **Warm path works:** `agent-browser --cdp 9226 --json screenshot --annotate`
   returned a valid structured envelope in ~14 s (`annotations[]` with
   `number/ref/role/box`, `path` in `~\.agent-browser\tmp\screenshots`). The
   implementation suite reached **24/25 PASS** with `@e1,@e2,@e3` ref mapping
   proven (T2B/T3) and the #79 `VISUAL_INSPECTION` telemetry visible (T16).
2. **Failure-path probes hang unbounded.** Three separate background probes
   (`task 544809`, `task 544810`) attempting a deterministic capture-failure
   against a non-CDP / invalid endpoint never completed:
   - `544809`: killed by operator/agent after ~22 min (no output);
   - `544810`: still running after **~4.7 h** — killed (PID 65392).
   The `agent-browser` CLI daemon caches the FIRST `--cdp` endpoint it
   receives and ignores subsequent ones; after a daemon kill, a fresh
   `npx --yes` invocation can cold-hang (network/resolution) without
   returning any JSON envelope, defeating per-call `timeoutMs` (the CLI
   itself spawns an unresolved child that outlives the exec timeout).
3. **Cascade into the suite:** T5 attempts (bad port / listening non-CDP port)
   turned into multi-minute waits; the last full run aborted at spawn
   (operator interrupted the run manually).

### Why this blocks the mission

The FAIL-CLOSED law requires a bounded, deterministic proof that capture
failure ⇒ `UNAVAILABLE`. The transport (vendor CLI daemon) does not guarantee
bounded failure — it can hang without emitting its own error envelope. Until
the failure path is bounded, T5 (and the overall PASS) cannot be honestly
claimed; no workaround live in the same pass per STOP law.

## Implementation status at STOP (NOT discarded, preserved in worktree)

- `tools/qwen-browser-visual-sidecar-v1.mjs` — NEW, complete minimal helper:
  annotate-tier only (`OCR_ENABLED=NO`, `VLM_ENABLED=NO`), observation-only,
  ephemeral screenshots (own temp + CLI default dir cleanup), fail-closed
  envelopes (`UNAVAILABLE / EMPTY_ANNOTATIONS / AMBIGUOUS /
  BLOCKED_QWEN_UNHEALTHY`), Qwen-primary health gate, `#79` telemetry
  (`stage=VISUAL_INSPECTION`).
- `tools/agent-activity-registry-v1.mjs` — additive: `VISUAL_INSPECTION`
  appended to `ACTIVITY_STAGES`.
- `tests/qwen-browser-visual-sidecar-implementation/run.mjs` — T1–T18 harness;
  last completed run: **24/25 PASS, T5 FAIL** (unbounded failure path);
  regressions green inside it: #79 lane 23/23, MCP gate 37/37, dispatcher 69/69.

## Worktree State (operator-ordered preserve)

Per explicit operator instruction: tests NOT resumed, implementation NOT
modified further, local worktree NOT discarded. The three task files above
remain uncommitted in the worktree. This STOP report, the runtime STOP
evidence, and runtime doc updates are committed separately (they do not
touch the preserved files).

## Next (after operator review)

Candidate remediation directions (NOT executed):
1. wrap the annotate call in a project-owned process-tree timeout
   (`taskkill /T /F` on timeout) so failure is bounded even when the vendor
   daemon hangs;
2. pin/reuse a single long-lived daemon endpoint per session instead of
   per-call `--cdp` switching;
3. verify `--config`/env (`AGENT_BROWSER_*`) support for disabling daemon
   caching before re-attempting T5.

## Hard walls respected

No OCR install; no VLM install/load; no new commercial API; no production
dispatch; no route activation; no public CDP; no browser-profile reset; no
credential/cookie/token persistence; no vendor patch; no automatic fallback;
no second execution authority. No real ChatGPT Web send performed.

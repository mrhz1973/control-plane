# V4 — Backlog→envelope bridge CLI dry-run (v1)

Task: `V4_LOCAL_DEV_EXECUTOR_BACKLOG_ENVELOPE_BRIDGE_DRY_RUN_V1`
Base: `42a678ab2aed694b850225ce13ff6b7a97636ce6`
Date: 2026-09-05 · Campaign pass 3 · No execution, no generation, no git mutation of main.

## What was run

1. Fixture artifact committed OUT-OF-BAND (never on main): standalone
   commit `efdef1aa249d4caeb3ab839f46af55f3a3e7d2ea` (commit-tree of the
   tracked fixture blob) simulating a backlog artifact at an exact GitHub
   commit. main untouched; commit is dangling/local-only.
2. Live dispatch anchor captured: `git rev-parse HEAD` = 42a678a…
3. Bridge CLI invoked (dry-run): produced
   `reports/runtime/dev-queue/LOCAL_DEV_B_D-9001-T__envelope-preview.json`
   containing `{bridge, ok:true, envelope, receipt}` — envelope is the
   complete `local-dev-task-envelope-v1` with profile 24K, verbatim
   allowed_paths, declared-loop-free task_delta (loop_allowed=false),
   persistence required.
4. Duplicate refusal at the CLI shape: replaying the same artifact with the
   receipt in the claims file → exit 1, `CLAIM_ALREADY_EXISTS`, no output
   file written (transient temp artifact removed).

## Environment notes (evidence fidelity)

- The session PowerShell profile wraps `git commit*`, breaking
  `git commit-tree`; the standalone commit was created via `git.exe`
  directly. Recorded here because a fresh-session launcher would not have
  hit this quirk.
- A first duplicate-check attempt was INVALID due to PowerShell pipeline
  unrolling (`@()` collapsed by `|`), producing an empty receipts list; the
  re-run with correct array serialization is the valid evidence above.

## Outcome

CLI shape proven end-to-end at real-commit semantics: preview artifact
persisted in-repo (evidence only — NOT a live claim; the receipt registry
for real use remains out-of-repo runtime state). Unit suite 18/18 remains
green. The bridge is now proven: pure function ✓, CLI form ✓, idempotency ✓.

## Derived minimum NEXT

`V4_LOCAL_DEV_EXECUTOR_CLINE24K_BRIDGED_LIVE_PROOF_V1` — execute EXACTLY
ONE real LOCAL_DEV_EXECUTOR run whose envelope is produced by the bridge
CLI from the D-9001-T fixture artifact (target: create the fixture-referenced
marker file `docs/runtime/CAMPAIGN_NOTES.md` append… note: v1 mapping pins
the canonical repo; the derived envelope's allowed path must exist in the
canonical clone, so the fixture objective must reference an in-repo path —
the D-9001-T objective already targets `docs/runtime/CAMPAIGN_NOTES.md`,
which does not exist yet and is inside allowed_paths → append creates it).
This is the natural bounded proof that backlog→envelope→executor works
end-to-end. AUTO-VIA eligible (mechanically determined, bounded, DEV lane).

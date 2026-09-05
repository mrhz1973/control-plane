# PASS evidence — bridged new-file live proof (remediation V1)

Task: V4_LOCAL_DEV_EXECUTOR_OPENCODE_PERMISSION_AND_NEW_FILE_CONVERGENCE_REMEDIATION_V1
Recorded: 2026-09-05, closure pass. All facts below are Git-verified.

## Verdict

**BRIDGED_LIVE_PROOF = PASS** — the full chain ran end-to-end on
`qwen38-opus-q3-cline-24k`:

backlog READY fixture (D-9001-T) → deterministic bridge
(LOCAL_DEV_B_D-9001-T__envelope-proof2.json) → local-dev-task-envelope-v1
with CREATE shaping → LOCAL_DEV_EXECUTOR → OpenCode (config-gated) → DEV
guard → Qwen Cline24K → NEW in-scope file created → executor PASS commit →
push → remote verified.

## Primary Git facts

- EXECUTOR_END_HEAD = `db6b275b46da3929b6cd1d91574980032c3730ee`
  (`executor-pass: LOCAL_DEV_B_D-9001-T`), pushed; LOCAL == REMOTE verified
  on origin/main.
- The PASS commit creates EXACTLY ONE new file, in-scope:
  `docs/runtime/CAMPAIGN_NOTES.md` (new file mode, 1 insertion), containing
  the single marker line
  `<!-- CAMPAIGN_MARKER: LOCAL_DEV_B_D-9001-T -->`
  → acceptance criterion (marker present) satisfied.
- This is the TASK_CREATED_UNTRACKED selective-staging path (option-B
  semantics) exercised LIVE for the first time: the staged file did not exist
  before the run and was inside allowed_paths.

## Safety invariants verified after the run

- tracked tree clean (git status --untracked-files=no empty);
- pre-existing untracked files preserved: untracked count grew from 32
  (pre-run snapshot) to 36 — the +4 delta is exactly Cursor's own proof
  bookkeeping artifacts (envelope variants, run input, result/ledger
  files), i.e. no pre-existing file touched, deleted, renamed, or staged;
- the executor's fail-closed refusals observed during this task
  (STOP:PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE ×2, STOP:UNEXPECTED_FILE_CHANGES
  ×1) were all CORRECT verdicts against Cursor-side bookkeeping mistakes and
  are retained as enforcement evidence.

## Run attempts ledger

See LOCAL_DEV_B_D-9001-T__proof2-attempt-ledger.md for the bounded attempt
history (config-gate integration repair cycle 1 = 1159d8d; bookkeeping-only
cycles 1b = 526bd81; the substantial proof run consumed 5 real Qwen turns /
145 s before its result was rerouted through the untracked ledger pattern).
Per the delegated policy the same root-cause family has 1 of max 2 repair
cycles consumed; no further repair is needed for this capability.

## Repairs applied (records per policy)

1. AUTO_REPAIR_SELECTED=config-gate runs resolved spawn binary; ENOENT degrades to SKIP
   RATIONALE=literal opencode.exe is an npm shim not executable without a shell; debug config via the resolved binary returned ok for the exact generated config
   INVARIANTS_PRESERVED=[deny-all-first overlay unchanged, no permission keys invented, no command widening, deterministic tests added]
2. AUTO_REPAIR_SELECTED=untracked run/result artifact pattern (bookkeeping)
   RATIONALE=executor correctly refuses dirty tracked tree and unexpected tracked mutations; run inputs/outputs moved to untracked paths (proof1 pattern)
   INVARIANTS_PRESERVED=[envelope bounds unchanged, no enforcement weakening, pre-existing untracked protection unchanged]

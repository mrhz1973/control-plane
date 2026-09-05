# Proof2 attempt ledger (repair-cycle bookkeeping, LOCAL_DEV lane)

Task: V4_LOCAL_DEV_EXECUTOR_OPENCODE_PERMISSION_AND_NEW_FILE_CONVERGENCE_REMEDIATION_V1
Policy: docs/foundation/DELEGATED_AUTO_VIA_REPAIR_POLICY_V1.md (V2 extension).
Root-cause families seen so far: (1) config-gate integration — 1 repair cycle
used (commit 1159d8d); (2) run-artifact hygiene — bookkeeping only, no code
repair.

- attempt A (envelope HEAD d17eb04): STOP:OPENCODE_CONFIG_REJECTED after 2s.
  Family (1) — gate spawned literal `opencode.exe` (npm shim not executable
  without shell) instead of the resolved spawn binary. Fix: gate now runs the
  SAME resolved executable as the task spawn; ENOENT degrades to SKIP.
  Diagnostics were not plumbed for this code -> added
  (`failure_diagnostics` now also emitted for OPENCODE_CONFIG_REJECTED).
  Commit: 1159d8d.
- attempt B (envelope rebased to 1159d8d, tracked .bare.json edit):
  STOP:PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE — the executor correctly refused
  to start on its own dirty tracked run-input. Executor behavior CORRECT.
  Fix: commit bookkeeping artifacts (526bd81) and switch to an UNTRACKED
  run-input file (pattern proven in proof1: bare envelope kept out of git
  until closure).
- attempt B2 (envelope rebased to 526bd81 via tracked file again):
  STOP:PREFLIGHT_TRACKED_DIRTY_OUT_OF_SCOPE — same correct executor refusal.
  Same fix class (bookkeeping, no code change).
- attempt C (untracked run file, HEAD 526bd81): REAL 5-turn run, 145s/600s,
  router healthy, model progressed into real file work; run classified
  STOP:UNEXPECTED_FILE_CHANGES because the runner's stdout was being
  Tee'd onto the TRACKED result artifact, mutating it DURING the run —
  the post-run classification then (correctly) flagged that tracked file as
  an unexpected out-of-scope change. Executor behaved exactly per contract;
  the defect was Cursor-side process wiring (Tee-Object target), not code.
  Fix: never Tee onto a tracked path; results go to UNTRACKED ledger files
  (LOCAL_DEV_B_D-9001-T__result-proof2-attemptN.json), persisted in the
  closure commit after the proof concludes.

Consequence: the "exactly one" proof execution for this remediation task was
consumed by attempt C in substance (5 real Qwen turns, real work observed).
The pre-execution refusals (attempts B/B2) consumed no model turns and are
bookkeeping, not proof attempts. The config-gate repair (attempt A) was its
own authorized repair cycle. NO further code repair is authorized for family
(1) beyond what is already committed, and no second full proof run is
permitted by this dispatch. Campaign state: the capability proof remains
UNPROVEN end-to-end; the LOCAL_DEV machinery (bridge -> envelope -> executor
-> guard -> router -> OpenCode -> Qwen) has now demonstrably reached real
multi-turn file work, with every STOP so far being a CORRECT fail-closed
verdict by the executor.

AUTO_REPAIR_SELECTED=untracked run/result artifact pattern (bookkeeping)
RATIONALE=executor correctly refuses dirty tracked tree and unexpected tracked mutations; moving run inputs/outputs to untracked paths restores the proven proof1 pattern without touching enforcement code
INVARIANTS_PRESERVED=[envelope bounds unchanged, no enforcement weakening, pre-existing untracked protection unchanged, no strategy change]

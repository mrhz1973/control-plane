# PM-43 — Codex adapter runner dry-run

**Status:** **PASS / DRY-RUN ONLY** (2026-05-22)

**Related:** [pm-43 gate](runtime-packets/pm-43-codex-adapter-runner-dry-run-gate.md) · [PM-42 design](PM42_CODEX_ADAPTER_RUNNER_DESIGN.md) · [session](sessions/2026-05-22-control-plane-pm43-codex-adapter-runner-dry-run.md) · [tool](../tools/codex-adapter-runner-dry-run.mjs)

---

## Purpose

Implement parser/adapter **dry-run** without invoking Codex — validates local fixtures only.

---

## Results

| Fixture | Classification | n8n usable |
|---------|----------------|------------|
| PM-37 mock `mock_raw_output` | **strict_pass** | **true** (future, after PM-44 gate) |
| PM-38 probe sample | **recoverable_partial** | **false** |
| PM-41 fail sample | **fail_scope_drift** | **false** |

**Outputs:** [good](examples/pm43-codex-adapter-good-result.sample.json) · [partial](examples/pm43-codex-adapter-partial-result.sample.json) · [fail](examples/pm43-codex-adapter-fail-result.sample.json) · [summary](examples/pm43-codex-adapter-summary.sample.json)

---

## Constraints observed

| Item | Value |
|------|--------|
| **Codex invoked** | **false** |
| **n8n touched** | **false** |
| **Worker enabled** | **false** |
| **PM-34** | **Blocked** |

---

## Next

**PM-44** real local runner probe — `codex.cmd` via wrapper, stdout capture, same parser validation, safe artifact only.

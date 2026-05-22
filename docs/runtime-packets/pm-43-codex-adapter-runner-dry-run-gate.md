# Runtime packet — PM-43: Codex adapter runner dry-run gate

**Packet ID:** `pm-43-codex-adapter-runner-dry-run-gate`  
**Date:** 2026-05-22  
**Status:** **PASS / DRY-RUN ONLY** (2026-05-22)

**Evidence:** [PM-43 doc](../PM43_CODEX_ADAPTER_RUNNER_DRY_RUN.md) · [session](../sessions/2026-05-22-control-plane-pm43-codex-adapter-runner-dry-run.md) · [summary sample](../examples/pm43-codex-adapter-summary.sample.json)

**Related:** [PM42 design](../PM42_CODEX_ADAPTER_RUNNER_DESIGN.md) · [PM-44 gate](pm-44-real-local-codex-runner-probe-gate.md) · [PM-39 hardening](../PM39_CODEX_STRICT_HARNESS_HARDENING.md)

---

## Purpose

Implement **local runner parser** in mock/dry-run first — **does not run Codex**.

---

## Test inputs (fixtures)

| Fixture | Expected classification |
|---------|-------------------------|
| PM-37 good mock raw output | **strict_pass** |
| PM-38 partial sample | **recoverable_partial** |
| PM-41 fail sample | **fail** |

---

## Future PASS criteria

| # | Criterion |
|---|-----------|
| 1 | Parser classifies fixtures correctly |
| 2 | No n8n touched |
| 3 | No worker enabled |
| 4 | No secrets in committed artifacts |

---

## Runtime result (2026-05-22)

| Fixture | Classification |
|---------|----------------|
| PM-37 | **strict_pass** |
| PM-38 | **recoverable_partial** |
| PM-41 | **fail_scope_drift** |

**Tool:** `tools/codex-adapter-runner-dry-run.mjs` — **Codex not invoked**.

**PM-34:** remains **blocked**. **PM-44** prepared for real local probe.

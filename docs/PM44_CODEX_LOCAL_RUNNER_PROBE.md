# PM-44 — Codex local runner probe

**Status:** **FAIL** (2026-05-22)

**Related:** [pm-44 gate](runtime-packets/pm-44-real-local-codex-runner-probe-gate.md) · [session](sessions/2026-05-22-control-plane-pm44-codex-local-runner-probe.md) · [artifact](examples/pm44-codex-local-runner-probe-result.sample.json) · [tool](../tools/codex-local-runner-probe.mjs) · [PM-43 dry-run](PM43_CODEX_ADAPTER_RUNNER_DRY_RUN.md)

---

## Purpose

Real **local runner** probe: single `codex.cmd exec`, stdout/stderr captured **in memory only**, validated outside Codex, **sanitized artifact** written.

---

## Result

| Field | Value |
|-------|--------|
| **Runner invoked Codex** | **yes** |
| **Runtime executed** | **yes** (process started; exit code **2**) |
| **Classification** | **fail** |
| **strict_pass** | **false** |
| **Markers / schema** | **Not found** |
| **Raw stdout/stderr committed** | **no** |
| **n8n usable artifact** | **false** |
| **PM-34** | **Blocked** |

Codex did not return the required `CONTROL_PLANE_JSON_START` / `END` block. Probe is **not** n8n-usable.

---

## Constraints observed

| Item | Value |
|------|--------|
| **Codex invocations** | **1** (no retry) |
| **n8n touched** | **false** |
| **Workflow 40 / 41** | **false** |
| **Worker enabled** | **false** |

---

## Next

**PM-45** runner integration hardening (CLI args, exit-code handling, scope classification) **or** stabilize — PM-34 gate planning only after future **strict_pass** artifact + separate approval.

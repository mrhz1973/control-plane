# PM-39 — Codex strict harness hardening

**Status:** **PASS** — docs/mock validator only; **no** Codex invocation.

**Related:** [PM-38 strict fail](PM38_CODEX_STRUCTURED_OUTPUT_PROBE.md) · [PM-37 harness](PM37_CODEX_EXACT_OUTPUT_HARNESS.md) · [PM-40 gate](runtime-packets/pm-40-real-codex-strict-structured-retry-gate.md) · [session](sessions/2026-05-22-control-plane-pm39-codex-strict-harness-hardening.md)

---

## Purpose

Harden parser/validator after **PM-38** strict failure. Classify Codex output before any n8n consumption.

**Tool:** `node tools/codex-structured-output-hardening-dry-run.mjs`

**Samples:** [classification](examples/pm39-codex-hardening-classification.sample.json) · [normalized](examples/pm39-codex-normalized-output.sample.json)

---

## PM-38 input (real partial)

| Check | Result |
|-------|--------|
| Repo-read functional | **PASS** |
| JSON-like output | **Yes** |
| Strict markers/schema | **FAIL** (`<<<JSON>>>` drift) |

---

## PM-39 classification (PM-38 case)

| Field | Value |
|-------|--------|
| **classification** | `recoverable_partial` |
| **strict_pass** | **false** |
| **PM-34 blocked** | **true** |
| **future_n8n_consumption_allowed** | **false** |

---

## Classification levels

| Level | Meaning |
|-------|---------|
| **strict_pass** | Automation-eligible — exact PM-37 markers + schema |
| **recoverable_partial** | Useful evidence; **not** n8n-usable |
| **fail** | Unusable |

**Warning:** Never let n8n consume **recovered** Codex output unless **strict_pass**.

---

## State

| Item | State |
|------|--------|
| Codex invoked | **No** |
| n8n / workflow 40/41 | **Not touched** |
| Worker | **Not enabled** |

---

## Next

**PM-40** strict structured retry **OR** stabilize.

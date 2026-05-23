# Control Plane — strict_pass dry-run package

**Date:** 2026-05-23  
**Status:** **PACKAGE ONLY / NO RUNTIME / PM-34 STILL GATED**

**Related:** [strict_pass contract](2026-05-23-control-plane-strict-pass-artifact-contract-design.md) · [next gate design](2026-05-23-control-plane-pm34-next-gate-design.md) · [fixture](../examples/strict-pass-artifact-v1.example.json) · [readiness checklist](2026-05-23-control-plane-strict-pass-dry-run-readiness-checklist.md)

---

## A. Purpose

Prepare a future **mock-worker strict_pass dry-run** that validates the artifact contract and forbidden-path rules **without** enabling Codex, a real worker, or n8n/workflow mutation.

This package **does not execute** the dry-run.

---

## B. Preconditions

| Item | Required before execution |
|------|---------------------------|
| [strict_pass contract](2026-05-23-control-plane-strict-pass-artifact-contract-design.md) | present on `main` |
| [example fixture](../examples/strict-pass-artifact-v1.example.json) | present |
| [readiness checklist](2026-05-23-control-plane-strict-pass-dry-run-readiness-checklist.md) | all boxes operator-verified |
| OpenClaw dual preview | reconciled — preview only |
| PM-34 packet | real worker **gated** |
| Operator | explicit approval **before** any runtime step |

---

## C. Dry-run scope

| In scope | Out of scope |
|----------|----------------|
| Mock-worker path via existing workflow **40** preview pattern **only if** a separate gate explicitly authorizes a plan trigger | Real worker |
| Produce one **sanitized** artifact record (session + optional committed JSON under `docs/examples/` or session summary) | `docs/plans/**` trigger in **this** package commit |
| Verify contract fields and forbidden-path flags | OpenClaw gateway start (unless separate casa gate) |
| `worker_type=mock-worker` | Codex invocation |

---

## D. Expected artifact fields

Use all fields defined in [strict_pass contract](2026-05-23-control-plane-strict-pass-artifact-contract-design.md). Reference shape: [strict-pass-artifact-v1.example.json](../examples/strict-pass-artifact-v1.example.json).

---

## E. Expected PASS / FAIL interpretation

| Outcome | Meaning |
|---------|---------|
| **Dry-run PASS** | All contract PASS criteria met; `strict_pass_candidate` may be set **true** in the **artifact record only** — still requires human gate before PM-34 real worker |
| **Dry-run FAIL** | Any forbidden path touched, secret scan fail, dirty workspace, or scope drift — `strict_pass_candidate=false`, `final_decision=fail` |
| **Dry-run blocked** | Preconditions not met — do not proceed; `final_decision=blocked` |

This package commit does **not** set `strict_pass_candidate=true`.

---

## F. Forbidden runtime actions

| Boundary | Value |
|----------|--------|
| `worker_type` | `mock-worker` only |
| `codex_invoked` | **false** |
| `real_worker_enabled` | **false** |
| `workflow_40_modified` | **false** |
| `workflow_41_modified` | **false** |
| `n8n_import_export_performed` | **false** |
| `openclaw_raw_log_committed` | **false** |
| `secrets_detected` | **false** |
| `pm34_unblocked` | **false** |
| `n8n_ready` | **false** |

Also forbidden: `docs/artifacts/openclaw/**`, raw OpenClaw/Codex output in git, workflow **40**/**41** edit, blind retries.

---

## G. Operator gate required before execution

1. Complete [readiness checklist](2026-05-23-control-plane-strict-pass-dry-run-readiness-checklist.md).  
2. Confirm **no** `docs/plans/*.plan.md` trigger until a **separate** execution gate task.  
3. Run dry-run in **one** micro-step; stop on first failure.  
4. Commit only sanitized evidence; secret-scan before push.

---

This package prepares a dry-run; it does **not** authorize or execute it.

# D-0025-W — Child finalization reconciliation policy v1

**Block ID:** `D0025_W_CHILD_FINALIZATION_RECONCILIATION_POLICY_V1`  
**Starting HEAD / expected origin/main:** `fc4f9c9e56cb12a39a416f6331da22333f82b7b1`  
**Status:** **PASS** — additive reconciliation overlay v1  
**Provider calls Δ:** **0** · tranche 02 **1/10 / 1/10**

---

## Precheck

| Check | Result |
|---|---|
| branch main · HEAD == origin/main | PASS |
| CURRENT_FRONTIER NEXT = child-finalization design | PASS (prior pass) |
| runtime gate CLOSED · WF61 inactive | PASS |
| tranche02 GLM/LiteLLM 1/10 · historical LiteLLM **11** | PASS |
| no provider/DB/workflow mutation | PASS |

---

## Deliverables

| Artifact | Path |
|---|---|
| Contract | `docs/contracts/n8n-child-execution-reconciliation-v1.md` |
| Tool | `tools/reconcile-n8n-child-execution-v1.mjs` |
| Tests | `tools/reconcile-n8n-child-execution-v1.test.mjs` |

---

## Design summary

Control-plane now distinguishes **logical execution state** from **n8n accounting state** for integrated child workflows (WF61 via Execute Workflow).

v1 rules:

- **TERMINAL_SUCCESS** requires parent success + matching subExecution + returned result + `workflow.success` + terminal return + **no** runtime leaks (fail-closed on any leak).
- Accounting overlay: `CONSISTENT_TERMINAL` · `STALE_RUNNING` · `PURGED` · `UNKNOWN`.
- Classifications: `CONSISTENT` · `LOGICALLY_TERMINAL_ACCOUNTING_STALE` · `LOGICALLY_TERMINAL_ACCOUNTING_PURGED` · `POSSIBLE_LIVE_EXECUTION` · `INSUFFICIENT_EVIDENCE`.
- **`historical_row_mutation_allowed` always `false`** in v1 — no DB UPDATE/DELETE.

Zero provider calls. Zero DB access in tool.

---

## Deterministic tests

Command: `node tools/reconcile-n8n-child-execution-v1.test.mjs` → **ALL_PASS**

| ID | Case | Result |
|---|---|---|
| A | consistent terminal | PASS |
| B | stale `running` | PASS → `LOGICALLY_TERMINAL_ACCOUNTING_STALE` |
| C | purged row | PASS → `LOGICALLY_TERMINAL_ACCOUNTING_PURGED` |
| D–E | insufficient evidence | PASS |
| F–H | live leaks fail-closed | PASS → `POSSIBLE_LIVE_EXECUTION` |
| I | subexecution mismatch | PASS |
| J | no historical mutation | PASS |

---

## Canonical 287888 fixture (sanitized from reports only)

From `reports/architecture/d0025_child_row_287888_accounting_diagnosis.md` — no DB query, no secrets.

**Purged accounting shape:**

```json
{
  "logical_state": "TERMINAL_SUCCESS",
  "accounting_state": "PURGED",
  "reconciliation_classification": "LOGICALLY_TERMINAL_ACCOUNTING_PURGED",
  "operational_block": false,
  "historical_row_mutation_allowed": false
}
```

**Contemporaneous stale-running shape:** `LOGICALLY_TERMINAL_ACCOUNTING_STALE` · `operational_block=false`.

---

## Bugbot

Review-only pass — see `bugbot_review` in LAST_CURSOR_REPORT.

---

## Persisted fields

| Field | Value |
|---|---|
| result_cursor | `PASS_CHILD_FINALIZATION_RECONCILIATION_V1` |
| contract_path | `docs/contracts/n8n-child-execution-reconciliation-v1.md` |
| tool_path | `tools/reconcile-n8n-child-execution-v1.mjs` |
| test_path | `tools/reconcile-n8n-child-execution-v1.test.mjs` |
| tests_result | `ALL_PASS` |
| historical_287888_fixture_result | `LOGICALLY_TERMINAL_ACCOUNTING_PURGED` |
| logical_state_287888 | `TERMINAL_SUCCESS` |
| operational_block_287888 | `false` |
| historical_row_mutation_allowed | `false` |
| provider_calls_delta / litellm / glm | `0` / `0` / `0` |
| tranche_02_glm_used / litellm_used | `1/10` / `1/10` |
| gate_closed_final | `true` |
| WF61_final | `inactive` |
| NEXT | `D0025_W_ACCEPTANCE_CLOSURE_REVIEW` (repo/read-only; not executed) |

---

## Output line

`PASS — D0025 CHILD FINALIZATION RECONCILIATION POLICY V1 / 287888=LOGICALLY_TERMINAL / DB_MUTATION=FALSE`

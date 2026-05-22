# PM-56 — OpenClaw adapter contract review

**Status:** **PASS / DOCS-ONLY CONTRACT REVIEW** (2026-05-22) · **F-07 remediated by [PM-57](PM57_OPENCLAW_CONTRACT_FIXTURE_REVIEW.md)** (`next_gate` allowlist; historical status unchanged)

**Related:** [runtime packet](runtime-packets/pm-56-openclaw-adapter-contract-review-gate.md) · [session](sessions/2026-05-22-control-plane-pm56-openclaw-adapter-contract-review.md) · [PM-52](PM52_OPENCLAW_CONFINED_BRIDGE_DESIGN.md) · [PM-53](PM53_OPENCLAW_BRIDGE_ARTIFACT_VALIDATOR_DRY_RUN.md) · [PM-54](PM54_OPENCLAW_BRIDGE_ADAPTER_DESIGN.md) · [PM-55](PM55_OPENCLAW_BRIDGE_ADAPTER_DRY_RUN.md) · [pm-34](runtime-packets/pm-34-n8n-codex-worker-integration-gate.md)

---

## 1. Scopo

PM-56 revisiona il **contratto** tra PM-52, PM-53, PM-54 e PM-55.

| Item | PM-56 |
|------|--------|
| **Implementazione codice** | **No** |
| **Runtime / OpenClaw** | **No** |
| **Gateway** | **No** |
| **n8n** | **No** |
| **Worker** | **Not** enabled |
| **Workflow 40 / 41** | **Not** touched |
| **PM-34** | **Not** unblocked |

---

## 2. Contract chain esaminata

| Step | Role |
|------|------|
| **PM-52** | Definisce schema artifact `pm52.openclaw.bridge.v1` (design only) |
| **PM-53** | Valida artifact bridge; rifiuta invalidi, segreti, forbidden, raw |
| **PM-54** | Definisce schema adapter `pm54.openclaw.adapter.v1` (design only) |
| **PM-55** | Produce adapter output da artifact PM-53-validato (dry-run locale) |
| **PM-34** | Resta **blocked** — nessuna fase PM-52…55 lo sblocca |

```text
PM-52 schema (design)
  → PM-53 validator (PASS)
  → PM-54 adapter schema (design)
  → PM-55 adapter dry-run (PASS)
  → PM-56 contract review (this doc)
  → PM-34 still blocked
```

---

## 3. Matrice contract review

| Area | Source | Consumer | Expected contract | PM-56 finding | Severity |
|------|--------|----------|-------------------|---------------|----------|
| **schema_version PM-52** | PM-52 `pm52.openclaw.bridge.v1` | PM-53 enforces; PM-55 sets `source_artifact_schema` | Single version string, required | PM-53 rejects unknown/missing; PM-55 echoes `pm52.openclaw.bridge.v1` on success | **OK** |
| **classification allowed set** | PM-52: `pass\|fail\|partial\|auth_required\|invalid` | PM-53 validates; PM-54/55 propagate | Same five values only | Set identical across docs, validator, adapter sample | **OK** |
| **forbidden_touched all false** | PM-52 artifact `forbidden_touched.*` | PM-53 rejects any `true` | All seven keys present and `false` | PM-53 checks all keys; invalid-forbidden sample rejected | **OK** |
| **secret_scan pass** | PM-52 `secret_scan.status: pass` | PM-53 rejects `fail` + pattern scan | `pass` required before valid artifact | PM-53 pattern scan + status check; invalid-secret sample rejected | **OK** |
| **raw_output_included false** | PM-54 `safety.raw_output_included` | PM-55 always `false` | Never include raw OpenClaw output | PM-55 hardcodes `false`; PM-53 rejects raw/transcript fields | **OK** |
| **n8n_ready false** | PM-54 design rule | PM-55 `safety.n8n_ready` | **Always false** in PM-54/55 phase | PM-55 code and sample output both `false`; no doc proposes `true` | **OK** |
| **evidence_refs non raw** | PM-54 `evidence_refs` id-only | PM-55 `{run_id}:evidence:{index}` | Refs only, no raw evidence text | PM-55 maps indices, does not copy evidence strings | **OK** |
| **next_gate PM-56/PM-57/stop** | PM-52/54 design examples | PM-55 success → `pm-56-adapter-contract-review`; fail → `stop` | Forward gate or stop on reject | PM-55 success gate matches PM-56; reject uses `stop` | **NOTE** |
| **PM-34 blocked** | pm-34 gate + all PM-52…55 docs | Entire chain | No implicit unblock | All docs and gates state blocked; PM-56 does not authorize PM-34 | **OK** |
| **no workflow 40/41 mutation** | PM-52 boundaries | PM-53/55 dry-run | No workflow edits | No workflow files touched in PM-52…55 | **OK** |
| **no n8n direct consumption** | PM-34 + PM-54 | PM-55 output | `n8n_ready: false`; separate gate required | Chain enforces; PM-34 requires strict_pass + separate gate | **OK** |
| **adapter_schema PM-54** | PM-54 `pm54.openclaw.adapter.v1` | PM-55 `adapter_schema` | Same version string | Sample output matches design | **OK** |
| **PM-53 before PM-55** | PM-54 input rules | PM-55 subprocess validator | Adapter only after validation PASS | PM-55 calls validator CLI; invalid samples → `adapted: false` | **OK** |
| **bridge next_gate unconstrained** | PM-52 sample values | PM-53 validator | Optional forward pointer on artifact | PM-53 validates presence only, not enum — sample uses historical `pm-54-bridge-adapter-design` | **LOW** → **remediated [PM-57](PM57_OPENCLAW_CONTRACT_FIXTURE_REVIEW.md)** |
| **PM-55 `adapted` field** | PM-55 CLI output | Not in PM-54 design JSON | Dry-run success flag | Extension for CLI semantics; does not weaken safety | **NOTE** |
| **reject safety aggregate** | PM-55 fail output | `safety.forbidden_touched: true` on any reject | Conservative fail-safe | Set even for schema errors — intentional, not n8n-facing | **NOTE** |

---

## 4. Findings

| ID | Finding | Severity |
|----|---------|----------|
| F-01 | Schema chain PM-52 → PM-53 → PM-55 `source_artifact_schema` aligned | **OK** |
| F-02 | Classification set consistent across design, validator, adapter | **OK** |
| F-03 | Secret scan + forbidden_touched enforced before adaptation | **OK** |
| F-04 | `n8n_ready` always false in PM-55 implementation and samples | **OK** |
| F-05 | Raw output never propagated; evidence_refs are index refs only | **OK** |
| F-06 | PM-34 remains blocked; no doc in chain implies auto-unblock | **OK** |
| F-07 | Bridge artifact `next_gate` not enum-validated by PM-53 | **LOW** → **closed in PM-57** |
| F-08 | PM-55 adds `adapted` / `errors` / `warnings` beyond PM-54 design sketch | **NOTE** |
| F-09 | PM-55 uses validator subprocess (validator `main()` on import) | **NOTE** |
| F-10 | PM-55 reject path sets aggregate `safety.forbidden_touched: true` for all failures | **NOTE** |

**Blockers:** none.

---

## 5. Requisiti minimi per passare da PM-56 a PM-57

PM-57 candidato **solo se**:

| # | Requirement | PM-56 state |
|---|-------------|-------------|
| 1 | Contract review senza blocker | **Met** |
| 2 | PM-55 adapter output mantiene `n8n_ready: false` | **Met** |
| 3 | PM-34 resta blocked | **Met** |
| 4 | Nessun raw output ammesso | **Met** |
| 5 | Nessun workflow 40/41 toccato | **Met** |

Remediation opzionale (non blocker, future task):

- Enum o allowlist per `next_gate` su artifact PM-52 (LOW).
- Allineare PM-54 design schema con campi CLI PM-55 (`adapted`, `errors`, `warnings`) in doc-only follow-up (NOTE).

---

## 6. Cosa PM-56 NON autorizza

| Item | State |
|------|--------|
| PM-34 unblock | **Not** authorized |
| n8n consumption | **Not** authorized |
| Worker enablement | **Not** authorized |
| OpenClaw runtime | **Not** authorized |
| Workflow edit | **Not** authorized |
| `n8n_ready: true` | **Not** authorized |

---

## 7. Decisione PM-56

**PASS / DOCS-ONLY CONTRACT REVIEW**

La chain PM-52 → PM-53 → PM-54 → PM-55 è **coerente, sicura e non ambigua** per lo scope attuale (design + validator dry-run + adapter dry-run). Nessun finding BLOCKER. NOTE e LOW sono documentali o evolvibili in task futuri senza runtime.

PM-56 **non** sblocca PM-34 implicitamente.

---

## 8. Next

| Step | Scope |
|------|--------|
| **PM-57** (candidate) | **OpenClaw adapter contract fixture review** — docs-only o dry-run locale su fixture aggiuntive; **not** PM-34 runtime |
| **PM-34** | Remains **blocked** until validated strict_pass artifact + **separate** integration gate |
| **PM-55** | Remains **PASS** — unchanged by this review |

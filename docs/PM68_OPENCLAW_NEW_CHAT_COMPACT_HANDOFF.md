# PM-68 — OpenClaw new chat compact handoff

**Status:** **PASS / COMPACT HANDOFF** (2026-05-22)

**Related:** [runtime packet](runtime-packets/pm-68-openclaw-new-chat-compact-handoff-gate.md) · [PM-64 map](PM64_OPENCLAW_GOVERNANCE_MAP_CLEANUP.md) · [PM-63 full handoff](PM63_OPENCLAW_GOVERNANCE_CHECKPOINT_HANDOFF.md)

---

## Start here (nuova chat)

| Item | Value |
|------|--------|
| **Repo** | `https://github.com/mrhz1973/control-plane` |
| **Branch** | `main` |
| **Workspace** | `C:\Users\mrhz\Documents\AI\GitHub\control-plane` |
| **Cursor** | **CONTROL PLANE** (arancione) — **not** DEV/GIS |
| **Ultimo commit batch** | `docs: add PM-64 PM-68 OpenClaw governance cleanup batch` (SHA dopo push) |

---

## Catena PM-51 → PM-68

| PM | Status |
|----|--------|
| PM-51 | **PASS** |
| PM-52 | **DESIGN** |
| PM-53 | **PASS** |
| PM-54 | **DESIGN** |
| PM-55 | **PASS** |
| PM-56 | **PASS** |
| PM-57 | **PASS** |
| PM-58 | **DESIGN** |
| PM-59 | **PASS** |
| PM-60 | **PASS** |
| PM-61 | **PASS** |
| PM-62 | **DESIGN** |
| PM-63 | **CHECKPOINT** |
| PM-64 | **MAP CLEANUP** |
| PM-65 | **BOUNDARY REVIEW** |
| PM-66 | **RISK REGISTER** |
| PM-67 | **OPTIONS** |
| PM-68 | **HANDOFF** (this doc) |
| PM-74–78 | **PASS** — lifecycle transition hardening — [PM78](PM78_OPENCLAW_LIFECYCLE_HARDENING_CHECKPOINT.md) |
| PM-79 | **PASS** — second controlled gateway probe (casa) — [PM79](PM79_OPENCLAW_CONTROLLED_SECOND_GATEWAY_PROBE.md) |
| PM-80 | **DESIGN** — runtime evidence capture contract — [PM80](PM80_OPENCLAW_RUNTIME_EVIDENCE_CAPTURE_DESIGN.md) |

---

## Invarianti (non negoziabili)

| Rule | State |
|------|--------|
| **PM-34** | **BLOCKED** |
| **n8n_ready** | **false** |
| **Workflow 40** | **ACTIVE** — **do not touch** |
| **Workflow 41** | **BACKUP OFF** — retain — **do not touch** |
| **Raw OpenClaw → n8n** | **Never** direct |
| **OpenClaw runtime** | Only explicit casa gate (e.g. PM-51 style) — **not** in docs batches |
| **Artifact storage** | `docs/artifacts/openclaw/**` **not** created yet |

---

## Tools (dry-run only, optional)

- `tools/validate-openclaw-bridge-artifact.mjs` (PM-53)
- `tools/adapt-openclaw-bridge-artifact.mjs` (PM-55)
- `tools/validate-openclaw-lifecycle-metadata.mjs` (PM-60)

---

## Batch policy (PM-65)

| Allowed batch (5–6 tasks) | Docs-only · review · schema · fixture · validator dry-run · handoff |
| **One-step only** | OpenClaw gateway · n8n · workflow 40/41 · worker · PM-34 · secrets · deploy |

---

## Prossimo candidato consigliato

| PM | Scope |
|----|--------|
| **PM-81** | Sample evidence fixture (docs-only, no secrets) |

---

## Vietato come prossimo step

- PM-34 runtime
- n8n consumption
- workflow edit
- worker enablement
- `n8n_ready: true`
- OpenClaw gateway (unless explicit operator casa task)

---

## Doc pointers

| Need | Doc |
|------|-----|
| **Governance index** | [PM-69](PM69_OPENCLAW_GOVERNANCE_INDEX_CLEANUP.md) |
| **Lifecycle hardening** | [PM78](PM78_OPENCLAW_LIFECYCLE_HARDENING_CHECKPOINT.md) · [PM74 transitions](PM74_OPENCLAW_LIFECYCLE_TRANSITION_RULES_DESIGN.md) |
| **PM-79 gateway** | [PM79](PM79_OPENCLAW_CONTROLLED_SECOND_GATEWAY_PROBE.md) |
| **PM-80 evidence** | [PM80](PM80_OPENCLAW_RUNTIME_EVIDENCE_CAPTURE_DESIGN.md) |
| **Cleanup checkpoint** | [PM-73](PM73_OPENCLAW_GOVERNANCE_CLEANUP_CHECKPOINT.md) |
| Full map | [PM-64](PM64_OPENCLAW_GOVERNANCE_MAP_CLEANUP.md) |
| Boundaries | [PM-65](PM65_OPENCLAW_DECISION_BOUNDARY_REVIEW.md) |
| Risks | [PM-66](PM66_OPENCLAW_RESIDUAL_RISK_REGISTER.md) |
| Options | [PM-67](PM67_OPENCLAW_NEXT_PHASE_OPTIONS_PACKET.md) |
| PM-34 gate | [pm-34 packet](runtime-packets/pm-34-n8n-codex-worker-integration-gate.md) |

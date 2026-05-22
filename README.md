# control-plane

Personal Automation MVP — **documentation**, redacted n8n workflow exports, and VPS rebuild runbooks. No application runtime code lives in this repo.

**Authoritative snapshot:** [docs/MVP_STATUS.md](docs/MVP_STATUS.md) · **Post-MVP backlog:** [docs/POST_MVP_BACKLOG.md](docs/POST_MVP_BACKLOG.md) · **Operating memory (agents):** [docs/OPERATING_MEMORY.md](docs/OPERATING_MEMORY.md)

---

## Current operational snapshot (2026-05-21)

| Area | State |
|------|--------|
| **MVP** | Operationally **accepted / closed** with C1 latency exception (**D-C1-A**) — **not** strict 5/5 PASS |
| **C1** | **PARTIAL** (SLA best-effort 1–5 min via v4 polling) |
| **C2–C5** | **PASS** |
| **PM-09** | Gate **C + D + FILE PASS** — plan detect + Telegram text + `.md` file in production **`40`** |
| **Production n8n** | **`40 - CP v4 multirepo + classifier bridge - ACTIVE`** (1 min; PM-22/23 PASS) |
| **CONTROL PLANE n8n list** | **4 workflows** — see [naming registry](docs/N8N_WORKFLOW_NAMING.md) |
| **v5 / GitHub webhook** | **Off** / not configured |
| **ALINA LAVORO** | Out of scope — not touched |

### n8n CONTROL PLANE workflows (final list)

| ID | Name | State |
|----|------|--------|
| **40** | CP v4 multirepo + classifier bridge | **ACTIVE** (sole production; PM-21 bridge) |
| **41** | CP v4 multirepo polling — FILE HANDOFF SAFE TEXT | **BACKUP OFF** |
| **30** | CP handoff manual Telegram v1 | OFF |
| **20** | CP v5 push webhook | OFF |
| **01** | CP v4 single-repo polling | LEGACY OFF |

**Removed from n8n UI** after PM-09 PASS (no longer in the list): backup `40` (pre–Gate D file); **`55`** Gate D test-safe. Details: [final n8n cleanup session](docs/sessions/2026-05-21-control-plane-final-n8n-cleanup.md).

**Future candidates:** import/test as **`41`**, **`42`**, **`43`** — not additional `40` copies. Prefix **`55`** only if a new isolated test-safe workflow is explicitly gated (not in current UI).

---

## Flow (production `40`, v4 polling)

```text
GitHub commit (watched repos)
    → n8n schedule poll (workflow 40, ~1 min)
    → Data Table dedupe (per-repo keys)
    → IF new commit?
        ├─→ Format + Telegram (commit notify)
        ├─→ [GIS path] handoff safe-text + latest-gis-handoff.md file
        └─→ [control-plane plan path]
              Gate C: detect docs/plans/*.plan.md → plan_detected
              Gate D: Telegram plan_detected message
                    → fetch/write .md → Telegram document attachment
```

v5 webhook path is **not** active. Strict sub-30s push→Telegram (C1) is deferred unless [PM-01](docs/POST_MVP_BACKLOG.md) is explicitly reopened.

---

## Repos

| Repo | Role |
|------|------|
| [mrhz1973/dev-method](https://github.com/mrhz1973/dev-method) | Watched — generator / handoff discipline |
| [mrhz1973/cursor-coordinate-converter](https://github.com/mrhz1973/cursor-coordinate-converter) | Watched — GIS benchmark (not modified by control-plane cleanup) |
| [mrhz1973/alina-lavoro](https://github.com/mrhz1973/alina-lavoro) | **Forbidden** — out of scope |

---

## Rules

- **No secrets in git** — tokens, chat_id, credential IDs, webhook URLs stay in n8n UI only.
- Redact workflow exports before commit — [workflows/README.md](workflows/README.md).
- **Runtime changes:** one gate at a time — [docs/RUNTIME_GATES.md](docs/RUNTIME_GATES.md). Docs-only updates may be batched.

---

## Documentation index

| Start here | Doc |
|------------|-----|
| Agent operating memory (ready-import rules) | [docs/OPERATING_MEMORY.md](docs/OPERATING_MEMORY.md) |
| MVP scorecard + runtime table | [docs/MVP_STATUS.md](docs/MVP_STATUS.md) |
| Optional post-MVP work | [docs/POST_MVP_BACKLOG.md](docs/POST_MVP_BACKLOG.md) |
| Workflow IDs + candidate policy | [docs/N8N_WORKFLOW_NAMING.md](docs/N8N_WORKFLOW_NAMING.md) |
| Committed export inventory | [docs/WORKFLOW_EXPORT_STATUS.md](docs/WORKFLOW_EXPORT_STATUS.md) |
| PM-09 plan watcher (Gate C+D) | [docs/PLAN_WATCHER_GATE_C.md](docs/PLAN_WATCHER_GATE_C.md) |
| PM-11 candidate `41` handoff file (design) | [docs/PM11_CANDIDATE_41_HANDOFF_FILE.md](docs/PM11_CANDIDATE_41_HANDOFF_FILE.md) |
| PM-12 candidate `41` import gate (packet) | [docs/runtime-packets/pm-12-candidate-41-handoff-file-import-gate.md](docs/runtime-packets/pm-12-candidate-41-handoff-file-import-gate.md) |
| PM-12 candidate `41` runtime PASS | [docs/sessions/2026-05-21-control-plane-41-handoff-file-runtime-pass.md](docs/sessions/2026-05-21-control-plane-41-handoff-file-runtime-pass.md) |
| PM-13 candidate `41` redacted export (gate) | [docs/runtime-packets/pm-13-candidate-41-redacted-export-gate.md](docs/runtime-packets/pm-13-candidate-41-redacted-export-gate.md) |
| PM-13 `41` export committed | [workflows/exports/2026-05-21_41-plan-handoff-file-candidate.redacted.json](workflows/exports/2026-05-21_41-plan-handoff-file-candidate.redacted.json) · [session](docs/sessions/2026-05-21-control-plane-41-redacted-export-commit.md) |
| PM-14 promotion `41` → `40` (packet) | [docs/runtime-packets/pm-14-promote-41-to-40-gate.md](docs/runtime-packets/pm-14-promote-41-to-40-gate.md) |
| PM-15 post-promotion regression (packet) | [docs/runtime-packets/pm-15-post-promotion-regression-gate.md](docs/runtime-packets/pm-15-post-promotion-regression-gate.md) |
| PM-16 automation router layer (design) | [docs/PM16_AUTOMATION_ROUTER_LAYER.md](docs/PM16_AUTOMATION_ROUTER_LAYER.md) |
| PM-17 Ollama classifier dry-run | [docs/PM17_OLLAMA_CLASSIFIER_DRY_RUN.md](docs/PM17_OLLAMA_CLASSIFIER_DRY_RUN.md) |
| PM-18 Codex OAuth feasibility | [docs/PM18_CODEX_OAUTH_FEASIBILITY_DRY_RUN.md](docs/PM18_CODEX_OAUTH_FEASIBILITY_DRY_RUN.md) |
| PM-19 implementer bridge dry-run | [docs/PM19_IMPLEMENTER_BRIDGE_DRY_RUN.md](docs/PM19_IMPLEMENTER_BRIDGE_DRY_RUN.md) |
| PM-20 n8n bridge packet (prepared) | [docs/PM20_N8N_BRIDGE_PACKET.md](docs/PM20_N8N_BRIDGE_PACKET.md) |
| PM-21 bridge candidate `42` (import bundle) | [docs/PM21_N8N_BRIDGE_RUNTIME_CANDIDATE.md](docs/PM21_N8N_BRIDGE_RUNTIME_CANDIDATE.md) |
| PM-22 promotion `42` → `40` (packet) | [docs/runtime-packets/pm-22-promote-42-to-40-bridge-gate.md](docs/runtime-packets/pm-22-promote-42-to-40-bridge-gate.md) |
| PM-23 post-promotion smoke (packet) | [docs/runtime-packets/pm-23-post-promotion-smoke-gate.md](docs/runtime-packets/pm-23-post-promotion-smoke-gate.md) |
| PM-22/23 promotion + smoke PASS | [docs/sessions/2026-05-22-control-plane-pm22-pm23-promotion-smoke-pass.md](docs/sessions/2026-05-22-control-plane-pm22-pm23-promotion-smoke-pass.md) |
| PM-26 post-promotion stabilization | [docs/PM26_POST_PROMOTION_STABILIZATION.md](docs/PM26_POST_PROMOTION_STABILIZATION.md) |
| PM-27 backup `41` retention gate | [docs/runtime-packets/pm-27-backup-41-retention-cleanup-gate.md](docs/runtime-packets/pm-27-backup-41-retention-cleanup-gate.md) |
| PM-28 next-track decision (B then C) | [docs/decision-packets/pm-28-next-track-decision.md](docs/decision-packets/pm-28-next-track-decision.md) |
| PM-29 post-promotion snapshot (PENDING) | [docs/PM29_POST_PROMOTION_SNAPSHOT.md](docs/PM29_POST_PROMOTION_SNAPSHOT.md) |
| PM-30 Codex CLI setup (PASS) | [docs/runtime-packets/pm-30-codex-cli-local-setup-gate.md](docs/runtime-packets/pm-30-codex-cli-local-setup-gate.md) · [session](docs/sessions/2026-05-22-control-plane-pm30-codex-cli-local-setup.md) |
| PM-31 Codex worker contract (mock PASS) | [docs/PM31_CODEX_WORKER_CONTRACT_DRY_RUN.md](docs/PM31_CODEX_WORKER_CONTRACT_DRY_RUN.md) |
| PM-33 Codex OAuth login gate (PASS) | [docs/runtime-packets/pm-33-codex-oauth-manual-login-gate.md](docs/runtime-packets/pm-33-codex-oauth-manual-login-gate.md) · [session](docs/sessions/2026-05-22-control-plane-pm33-codex-manual-login-pass.md) |
| PM-35 Codex no-op probe (PASS) | [docs/PM35_CODEX_NOOP_PROBE.md](docs/PM35_CODEX_NOOP_PROBE.md) · [session](docs/sessions/2026-05-22-control-plane-pm35-codex-noop-probe-pass.md) |
| PM-36 Codex repo-read probe (PASS w/ format deviation) | [docs/PM36_CODEX_REPO_READ_PROBE.md](docs/PM36_CODEX_REPO_READ_PROBE.md) · [session](docs/sessions/2026-05-22-control-plane-pm36-codex-repo-read-probe-pass.md) |
| PM-37 exact-output harness (mock PASS) | [docs/PM37_CODEX_EXACT_OUTPUT_HARNESS.md](docs/PM37_CODEX_EXACT_OUTPUT_HARNESS.md) |
| PM-38 structured Codex probe (strict fail) | [docs/PM38_CODEX_STRUCTURED_OUTPUT_PROBE.md](docs/PM38_CODEX_STRUCTURED_OUTPUT_PROBE.md) · [session](docs/sessions/2026-05-22-control-plane-pm38-codex-structured-output-probe-strict-fail.md) |
| PM-39 strict harness hardening (PASS) | [docs/PM39_CODEX_STRICT_HARNESS_HARDENING.md](docs/PM39_CODEX_STRICT_HARNESS_HARDENING.md) |
| PM-40 strict retry (blocked) | [docs/PM40_CODEX_STRICT_RETRY_BLOCKED.md](docs/PM40_CODEX_STRICT_RETRY_BLOCKED.md) · [session](docs/sessions/2026-05-22-control-plane-pm40-codex-strict-retry-blocked.md) |
| PM-41 external strict retry (fail) | [docs/PM41_CODEX_EXTERNAL_STRICT_RETRY_FAIL.md](docs/PM41_CODEX_EXTERNAL_STRICT_RETRY_FAIL.md) · [session](docs/sessions/2026-05-22-control-plane-pm41-fail-pm42-pm43-adapter-design.md) |
| PM-42 Codex adapter runner (design) | [docs/PM42_CODEX_ADAPTER_RUNNER_DESIGN.md](docs/PM42_CODEX_ADAPTER_RUNNER_DESIGN.md) |
| PM-43 adapter dry-run (PASS) | [docs/PM43_CODEX_ADAPTER_RUNNER_DRY_RUN.md](docs/PM43_CODEX_ADAPTER_RUNNER_DRY_RUN.md) · [session](docs/sessions/2026-05-22-control-plane-pm43-codex-adapter-runner-dry-run.md) |
| PM-44 local runner probe (fail) | [docs/PM44_CODEX_LOCAL_RUNNER_PROBE.md](docs/PM44_CODEX_LOCAL_RUNNER_PROBE.md) · [session](docs/sessions/2026-05-22-control-plane-pm44-codex-local-runner-probe.md) |
| PM-45 runner hardening (PASS) | [docs/PM45_CODEX_RUNNER_HARDENING.md](docs/PM45_CODEX_RUNNER_HARDENING.md) · [session](docs/sessions/2026-05-22-control-plane-pm45-codex-runner-hardening.md) |
| PM-46 local runner v2 (fail) | [docs/PM46_CODEX_LOCAL_RUNNER_PROBE_V2.md](docs/PM46_CODEX_LOCAL_RUNNER_PROBE_V2.md) · [session](docs/sessions/2026-05-22-control-plane-pm46-codex-local-runner-v2.md) |
| PM-47 runner CLI diagnosis (PASS) | [docs/PM47_CODEX_RUNNER_CLI_DIAGNOSIS.md](docs/PM47_CODEX_RUNNER_CLI_DIAGNOSIS.md) · [session](docs/sessions/2026-05-22-control-plane-pm47-codex-runner-cli-diagnosis.md) |
| PM-48 runner probe v3 (prepared, fallback) | [docs/runtime-packets/pm-48-real-local-codex-runner-v3-gate.md](docs/runtime-packets/pm-48-real-local-codex-runner-v3-gate.md) |
| PM-49 OpenClaw OAuth bridge (feasibility) | [docs/PM49_OPENCLAW_OAUTH_BRIDGE_FEASIBILITY.md](docs/PM49_OPENCLAW_OAUTH_BRIDGE_FEASIBILITY.md) · [session](docs/sessions/2026-05-22-control-plane-pm49-openclaw-oauth-bridge-feasibility.md) |
| PM-50 OpenClaw install/onboard (PASS) | [docs/PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_PASS.md](docs/PM50_OPENCLAW_LOCAL_INSTALL_ONBOARD_PASS.md) · [session](docs/sessions/2026-05-22-control-plane-pm50-openclaw-local-onboard-pass.md) |
| PM-51 OpenClaw gateway no-op (PASS) | [docs/sessions/2026-05-22-control-plane-pm51-openclaw-confined-gateway-noop-probe-pass.md](docs/sessions/2026-05-22-control-plane-pm51-openclaw-confined-gateway-noop-probe-pass.md) · [PM51](docs/PM51_OPENCLAW_CONFINED_GATEWAY_NOOP_PROBE_GATE.md) |
| PM-52 OpenClaw confined bridge (design) | [docs/PM52_OPENCLAW_CONFINED_BRIDGE_DESIGN.md](docs/PM52_OPENCLAW_CONFINED_BRIDGE_DESIGN.md) · [session](docs/sessions/2026-05-22-control-plane-pm52-openclaw-confined-bridge-design.md) |
| PM-53 bridge artifact validator (PASS) | [docs/PM53_OPENCLAW_BRIDGE_ARTIFACT_VALIDATOR_DRY_RUN.md](docs/PM53_OPENCLAW_BRIDGE_ARTIFACT_VALIDATOR_DRY_RUN.md) · [tool](tools/validate-openclaw-bridge-artifact.mjs) |
| PM-54 OpenClaw bridge adapter (design) | [docs/PM54_OPENCLAW_BRIDGE_ADAPTER_DESIGN.md](docs/PM54_OPENCLAW_BRIDGE_ADAPTER_DESIGN.md) · [session](docs/sessions/2026-05-22-control-plane-pm54-openclaw-bridge-adapter-design.md) |
| PM-55 OpenClaw bridge adapter dry-run (PASS) | [docs/PM55_OPENCLAW_BRIDGE_ADAPTER_DRY_RUN.md](docs/PM55_OPENCLAW_BRIDGE_ADAPTER_DRY_RUN.md) · [tool](tools/adapt-openclaw-bridge-artifact.mjs) · [sample output](examples/pm55-openclaw-bridge-adapter-valid-output.sample.json) |
| PM-56 OpenClaw adapter contract review (PASS) | [docs/PM56_OPENCLAW_ADAPTER_CONTRACT_REVIEW.md](docs/PM56_OPENCLAW_ADAPTER_CONTRACT_REVIEW.md) · [session](docs/sessions/2026-05-22-control-plane-pm56-openclaw-adapter-contract-review.md) |
| PM-57 OpenClaw contract fixture review (PASS) | [docs/PM57_OPENCLAW_CONTRACT_FIXTURE_REVIEW.md](docs/PM57_OPENCLAW_CONTRACT_FIXTURE_REVIEW.md) · [session](docs/sessions/2026-05-22-control-plane-pm57-openclaw-contract-fixture-review.md) |
| PM-58 OpenClaw bridge artifact lifecycle (design) | [docs/PM58_OPENCLAW_BRIDGE_ARTIFACT_LIFECYCLE_DESIGN.md](docs/PM58_OPENCLAW_BRIDGE_ARTIFACT_LIFECYCLE_DESIGN.md) · [session](docs/sessions/2026-05-22-control-plane-pm58-openclaw-bridge-artifact-lifecycle-design.md) |
| PM-34 n8n Codex integration (prepared) | [docs/runtime-packets/pm-34-n8n-codex-worker-integration-gate.md](docs/runtime-packets/pm-34-n8n-codex-worker-integration-gate.md) |
| PM-24 rollback / recovery (packet) | [docs/runtime-packets/pm-24-rollback-recovery-gate.md](docs/runtime-packets/pm-24-rollback-recovery-gate.md) |
| PM-25 fast-track operator checklist | [docs/runtime-packets/pm-25-fast-track-runtime-operator-checklist.md](docs/runtime-packets/pm-25-fast-track-runtime-operator-checklist.md) |
| Fast-track runtime sequence (runbook) | [docs/runtime-packets/FAST_TRACK_RUNTIME_SEQUENCE.md](docs/runtime-packets/FAST_TRACK_RUNTIME_SEQUENCE.md) |
| PM-16 `40` post-PM15 export snapshot | [session](docs/sessions/2026-05-22-control-plane-40-post-pm15-export-snapshot.md) — **PENDING** |
| Plan file schema | [docs/plans/README.md](docs/plans/README.md) |
| VPS rebuild | [docs/N8N_REBUILD.md](docs/N8N_REBUILD.md) |
| Runtime gate discipline | [docs/RUNTIME_GATES.md](docs/RUNTIME_GATES.md) |
| Evidence / export hygiene | [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) |

**Session closes:** [PM-09 docs close](docs/sessions/2026-05-21-control-plane-pm09-final-docs-close.md) · [final n8n list cleanup](docs/sessions/2026-05-21-control-plane-final-n8n-cleanup.md) · [PM-15 new 40 smoke PASS](docs/sessions/2026-05-22-control-plane-pm15-new-40-smoke-pass.md)

**Criteria & decisions:** [docs/MVP_CRITERIA.md](docs/MVP_CRITERIA.md) · [D-C1-A packet](docs/decision-packets/2026-05-21-criterion-1-latency-closure-decision.md)

---

## Rebuild principle

If the VPS dies, docs and redacted exports here must be enough to recreate n8n workflows, credentials (in UI), and watched-repo behavior. See [docs/N8N_REBUILD.md](docs/N8N_REBUILD.md).

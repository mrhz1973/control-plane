# V4 — LOCAL_DEV_EXECUTOR backlog→envelope bridge DESIGN (v1)

Task: `V4_LOCAL_DEV_EXECUTOR_BACKLOG_ENVELOPE_BRIDGE_DESIGN_V1`
Base: `300d03fa06647c2da72f91b06ceb66074369faca`
Date: 2026-09-05 · Type: DESIGN-ONLY (no execution activated)
Campaign: V4_LOCAL_DEV_EXECUTOR_OVERNIGHT_AUTOVIA_CAMPAIGN_V1 (pass 1)

## 1. Scope & authority

Workstation-only DEV-domain bridge: deterministic translation of a canonical
GitHub `backlog-item-v1` Markdown artifact into a validated
`local-dev-task-envelope-v1`, closing the gap between the strategic backlog
contract (GPT-Web authored) and the proven LOCAL_DEV_EXECUTOR. No production
activation: nothing in this design touches the production execution domain,
WF40/WF61/D-0025, n8n, or the eligible set. Authority: standing operator
authorization for bounded dev tasks + explicit overnight campaign
authorization (DEV lane only).

## 2. Proven reused foundations (read, verified this pass)

- `docs/contracts/backlog-item-v1.md` — source artifact contract (one fenced
  yaml block; required fields; state machine; scope/human-gate semantics).
- `docs/contracts/backlog-primary-remote-adapter-v1.md` — production lane
  precedent: source-location discipline (exact commit SHA, one backlog per
  commit), fence parsing, fail-closed classification style.
- `tools/build-primary-remote-cycle-input-from-backlog.mjs` — exports
  `extractYamlFence()` and `parseBoundedBacklogYaml()`; a bounded, zero
  dependency YAML subset parser already in-repo. REUSED AS-IS (imported),
  not forked.
- `docs/contracts/local-dev-executor-v1.md` + `tools/local-dev-executor-v1.mjs`
  — envelope schema `local-dev-task-envelope-v1`, `validateEnvelope`,
  hard caps (1800/16/3), DEV-category profile resolution,
  `DEFAULT_DEV_PROFILE_ID = qwen38-opus-q3-cline-24k`. REUSED unchanged.

## 3. Source artifact (bridge input)

Exactly one Markdown file (fixture or, later, canonical backlog path) at an
exact Git commit, containing exactly one fenced `yaml` block whose object
satisfies `backlog-item-v1`. DEV-lane additional requirements (mirror of the
production lane discipline, kept strict for uniformity):

- `schema: backlog-item-v1`;
- `state: READY_FOR_PLANNING` (the only consumable state; anything else →
  `BACKLOG_STATE_NOT_CONSUMABLE`);
- `created_by: gpt-web`;
- `branch_target` non-empty;
- `execution.target: cursor`;
- `planner.preferred` in `qwen|glm|codex` (recorded as
  `planner_requested` provenance only — the DEV executor is by construction
  the local Qwen 24K profile; planner preference never selects providers);
- exactly one backlog item per artifact → else
  `MULTIPLE_BACKLOG_ITEMS_IN_ARTIFACT`.

## 4. Deterministic mapping (backlog → envelope)

| envelope field | derivation |
|---|---|
| schema_version | constant `local-dev-task-envelope-v1` |
| task_ref | `LOCAL_DEV_B_${b.id}` (id required, `D-NNNN-X` style) |
| target_repo_path | resolved local clone for `b.repository`; v1 supports exactly the canonical local clone `C:\Users\mrhz\Documents\AI\GitHub\control-plane` for `mrhz1973/control-plane`; anything else → `REPO_NOT_LOCAL_KNOWN` (fail closed) |
| target_remote | `https://github.com/${b.repository}.git` |
| dispatch_base_head | NOT taken from the backlog; captured live at claim time (`git rev-parse HEAD` must equal `origin/main`) |
| profile_id | `b.local_dev.dev_profile` if present (must resolve `workstation_dev_executor_profile`) else `DEFAULT_DEV_PROFILE_ID` (24K) |
| task_delta | deterministic template: objective + numbered acceptance list + explicit loop-declaration sentence when `execution.loop_allowed=true` (satisfies `TEST_CYCLES_WITHOUT_DECLARED_LOOP` mechanically) |
| allowed_paths | `b.scope.allowed_areas` VERBATIM (never widened; empty → reject) |
| allowed_commands | minimum `["git status --short","git diff --check"]` + at most one `local_dev.test_commands[0]` |
| test_command | `local_dev.test_commands[0]` if present else `git diff --check` |
| network_policy | constant `localhost_only` |
| timebox_seconds | `local_dev.timebox_hint` clamped to [60, 900], default 600 |
| max_agent_turns | `local_dev.max_turns_hint` clamped to [1, 16], default 8 |
| max_test_cycles | `execution.loop_allowed ? clamp(execution.max_loop_rounds_hint, 1, 2) : 0` |
| git_persistence_required | constant `true` |

DEV-lane namespaced extension fields (additive to backlog-item-v1, strict):
`local_dev.{dev_profile, test_commands, timebox_hint, max_turns_hint}`.
Unknown keys under `local_dev` → `BACKLOG_DEV_FIELDS_UNSUPPORTED` (fail
closed; silent upgrade forbidden, mirroring the production adapter stance).

## 5. Fail-closed bridge rules (before envelope validation)

1. fence count ≠ 1 → `BACKLOG_CONTRACT_UNSUPPORTED`;
2. bounded YAML parse failure → `BACKLOG_YAML_INVALID` (+reason);
3. state ≠ `READY_FOR_PLANNING` → `BACKLOG_STATE_NOT_CONSUMABLE`;
4. `human_gate_required_if` non-empty → `HUMAN_GATE_DECLARED` (never auto);
5. `risk_hint: high` → `BRIDGE_HIGH_RISK_REQUIRES_GATE`;
6. empty `scope.allowed_areas` → `BACKLOG_SCOPE_EMPTY`;
7. unknown `local_dev` keys → `BACKLOG_DEV_FIELDS_UNSUPPORTED`;
8. unknown repository → `REPO_NOT_LOCAL_KNOWN`;
9. `validateEnvelope` failure → surfaced verbatim (single source of truth
   for envelope law — bridge never re-implements bounds).

## 6. Claim receipt & idempotency (v1 semantics, repo-local)

Because the envelope schema is closed (no provenance field), provenance is
recorded in a bridge receipt sidecar written under
`reports/runtime/dev-queue/`:

```json
{ "task_ref": "...", "source_ref": "github:<repo>@<commit>:<path>",
  "claimed_at": "<ISO>", "bridge_version": "local-dev-backlog-bridge-v1" }
```

Duplicate detection: an existing receipt with the same `source_ref` →
`CLAIM_ALREADY_EXISTS` (refuse, never re-derive). Atomic lease/CAS semantics
are EXPLICITLY DEFERRED to a later pass (mechanically required only once a
real unattended selector consumes live backlog); v1 is single-writer by
construction (one operator-run bridge invocation at a time).

## 7. Tool shape (to be implemented by the NEXT pass)

New `tools/bridge-backlog-to-local-dev-envelope-v1.mjs`:

- `buildLocalDevEnvelopeFromBacklog({ markdown, repo, commit, path,
  localRepoPath, now, existingReceipts })` →
  `{ ok, envelope, receipt }` | `{ ok:false, reason_codes }`;
- CLI form `--file --repo --commit --path --out` for dry-run preview
  (writes envelope+receipt JSON; runs nothing, generates nothing);
- zero new dependencies; imports only the two reused symbols plus
  `validateEnvelope`/`DEFAULT_DEV_PROFILE_ID`;
- fixtures under `tests/local-dev-backlog-envelope-bridge-v1/fixtures/`.

## 8. Test plan (deterministic, offline)

`tests/local-dev-backlog-envelope-bridge-v1/run.mjs`:
happy path (envelope passes `validateEnvelope`); loop mapping (false→0;
true+hint 3→clamped 2); verbatim allowed_paths (no widening); human-gate
stop; high-risk stop; state stop; zero/multiple fences; YAML parse failure;
unknown `local_dev` key; unknown repo; default vs explicit DEV profile;
duplicate source_ref receipt refusal; task_delta contains declared-loop
sentence exactly when loop_allowed.

## 9. Non-goals / STOP boundaries honored

No execution activation in the design pass; no real backlog consumption
(fixtures only, per campaign backlog safety); no n8n authoring; no
production identity reuse (agent-24k untouched); no model/provider policy
change; no timebox/bounds escalation (executor hard caps unchanged).

## 10. Derived minimum NEXT

`V4_LOCAL_DEV_EXECUTOR_BACKLOG_ENVELOPE_BRIDGE_IMPLEMENT_V1` — implement
the tool + deterministic tests exactly per this design (reuse unchanged;
mechanically determined; test-contained; repo-local → AUTO-VIA eligible).

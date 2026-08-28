# Backlog primary-remote adapter v1

**Repository:** `mrhz1973/control-plane`  
**Document:** `docs/contracts/backlog-primary-remote-adapter-v1.md`  
**Version:** `backlog-primary-remote-adapter-v1`  
**Date:** 2026-08-28  
**Authority:** `GPT_WEB`  
**Status:** `GPT-WEB AUTHORED — IMPLEMENTATION CONTRACT`  
**Runtime authorized by this document:** **NO**

---

## 0. Purpose

Define the deterministic adapter between a canonical GitHub `backlog-item-v1` Markdown artifact and the two exact inputs required by WF61:

- `openclaw-consumer-input-v1` compatible `consumer_input`;
- `planner-routing-input-v1` `routing_input`.

This adapter is not a planner and must never invent project semantics. It parses GPT-Web-authored backlog fields, applies the current D-0025 primary-remote policy, reads only a non-secret runtime gate/config artifact, and fails closed when any required fact is absent or unsupported.

Canonical parents:

- `docs/contracts/backlog-item-v1.md`
- `docs/contracts/openclaw-consumer-input-v1.schema.json`
- `docs/contracts/planner-routing-input-v1.schema.json`
- `docs/contracts/planner-selection-evaluator-v1.md`
- `docs/contracts/litellm-primary-cycle-runner-v1.md`

---

## 1. Source backlog

The source is one Markdown file matching:

`docs/runtime/BACKLOG_*.md`

at an exact Git commit SHA.

The Markdown must contain exactly one fenced `yaml` block whose decoded object satisfies the required `backlog-item-v1` fields. For the D-0025 primary-remote lane the object MUST also contain:

- `schema: backlog-item-v1`;
- `state: READY_FOR_PLANNING`;
- `created_by: gpt-web`;
- `branch_target` non-empty;
- `execution.target: cursor`;
- `planner.preferred` in `glm|codex`;
- `planner.fallback: []`;
- `planner.fallback_policy: gate_only`.

Legacy backlog files that predate these required fields are not silently upgraded. They classify `BACKLOG_CONTRACT_UNSUPPORTED` and do not dispatch.

Multiple backlog artifacts in the same watched commit are not auto-selected. The workflow must fail closed for that event with `MULTIPLE_BACKLOG_ITEMS_IN_COMMIT`.

---

## 2. Deterministic mapping — consumer_input

Given backlog object `b`, repository `repo`, exact commit `commit`, and backlog path `path`:

| `consumer_input` field | Exact source |
|---|---|
| `task_id` | `b.id` |
| `source_backlog_ref` | literal `github:${repo}@${commit}:${path}` |
| `source_backlog_commit` | exact `commit` |
| `repository` | `b.repository` |
| `branch_target` | `b.branch_target` |
| `goal` | `b.objective` |
| `risk_hint` | `b.risk_hint` |
| `complexity_hint` | `b.complexity_hint` |
| `planner_requested` | `b.planner.preferred` |
| `allowed_paths` | `b.scope.allowed_areas` |
| `forbidden_paths` | `b.scope.forbidden_areas` |
| `acceptance_seed` | `b.acceptance` |
| `validation_seed` | `[]` in adapter v1; backlog-item-v1 has no validation field |
| `hard_constraints` | `b.human_gate_required_if` |

`scope.allowed_areas` / `scope.forbidden_areas` are intentionally used verbatim: the parent backlog contract defines them as repository paths, components, or bounded areas. The adapter may not widen, normalize away, or reinterpret them.

Additional constraints:

- `b.repository` MUST equal the watched repository `repo`; else `BACKLOG_REPOSITORY_MISMATCH`.
- `b.id`, `objective`, `branch_target`, risk, complexity, planner preference and required arrays must be present and type-valid.
- no missing field may be synthesized from commit message, PM17/PM19 route, filename, chat history, or model prose.

---

## 3. Deterministic mapping — routing_input

The adapter builds:

```json
{
  "schema": "planner-routing-input-v1",
  "task_id": "<b.id>",
  "risk_hint": "<b.risk_hint>",
  "complexity_hint": "<b.complexity_hint>",
  "preferred": "<b.planner.preferred>",
  "fallback": [],
  "fallback_policy": "gate_only",
  "provider_state": "<from runtime gate artifact only>"
}
```

The adapter MUST NOT derive provider availability/quota from PM21 classifier output, LiteLLM prose, commit messages, or planner output.

For adapter v1, `provider_state` comes only from the canonical non-secret artifact:

`configs/planner/primary-remote-runtime-gate.json`

The runtime gate artifact itself is policy state, not a secret store.

---

## 4. Runtime gate contract

Required schema:

`primary-remote-runtime-gate-v1`

Dispatch is allowed only when ALL are true:

1. `enabled === true`;
2. `provider_calls_authorized_per_event === 1`;
3. backlog preferred planner is listed in `allowed_planners`;
4. backlog `fallback` is empty and `fallback_policy` is `gate_only`;
5. runtime-gate provider state makes the preferred planner deterministically `HEALTHY` under `planner-selection-evaluator-v1`;
6. Qwen is not selected or present in fallback;
7. backlog state is `READY_FOR_PLANNING`;
8. canonical consumer/routing objects pass their structural contracts.

Anything else is a non-dispatch PASS/GATE classification; it must not call WF61.

Initial canonical runtime gate is deliberately disabled. Enabling it or increasing provider-call authorization is a separate provider/inference operator gate.

---

## 5. Helper CLI contract

Implementation target:

`tools/build-primary-remote-cycle-input-from-backlog.mjs`

Required invocation shape:

```text
node tools/build-primary-remote-cycle-input-from-backlog.mjs \
  --repo-b64 <base64> \
  --commit-b64 <base64> \
  --path-b64 <base64> \
  --markdown-b64 <base64> \
  --gate <path-to-primary-remote-runtime-gate.json>
```

Base64 is transport encoding only, not secrecy.

Required one-line JSON output:

```json
{
  "schema": "backlog-primary-remote-adapter-result-v1",
  "ok": true,
  "classification": "REMOTE_DISPATCH_READY|REMOTE_PLANNER_GATE_CLOSED|<fail-closed-code>",
  "task_id": "D-NNNN-X|null",
  "dispatch_allowed": false,
  "consumer_input": null,
  "routing_input": null,
  "reason": "<bounded text>"
}
```

When parsing/structural mapping succeeds but the runtime gate is closed, `ok=true`, `dispatch_allowed=false`, and the helper MAY include the structurally valid `consumer_input` and `routing_input` for offline evidence. It must not turn a closed gate into an error that breaks the legacy WF40 lanes.

When `dispatch_allowed=true`, both input objects are required and must be internally consistent (`task_id` and preferred planner match).

Exit code:

- `0`: parsed/mapped deterministically, including closed-gate result;
- nonzero: malformed/unsupported/ambiguous input or contract violation.

---

## 6. YAML parsing boundary

Implementation may use an already-installed YAML parser if present in the canonical n8n/runtime Node resolution path. It must not install packages at runtime.

If no compatible parser is already available, implementation may include a bounded parser for exactly the `backlog-item-v1` subset required by this contract. It must reject unsupported YAML constructs rather than guess.

No network access is needed by the helper itself.

---

## 7. n8n parent-lane semantics

The GPT-Web-authored WF40 patch is additive and parallel to the legacy PM21 plan/mock-worker branch.

Canonical lane:

```text
GitHub - Fetch commit details (plan files)
  -> Code - Detect canonical backlog item
  -> IF - canonical backlog detected?
       TRUE -> GitHub - Fetch canonical backlog item
               -> Code - Encode canonical backlog adapter input
               -> Execute Command - build primary remote cycle input
               -> Code - Parse primary remote adapter result
               -> IF - remote dispatch allowed?
                    TRUE -> Execute Workflow - WF61 primary remote planner
                    FALSE -> Code - Remote planner gate closed (terminal)
       FALSE -> terminal for this parallel lane
```

The legacy plan/PM21/Telegram branch remains untouched.

The WF61 Execute Workflow target is fixed:

`d0025-6100-4001-8001-000000000061`

Input is passthrough of exactly:

```json
{
  "consumer_input": {},
  "routing_input": {}
}
```

---

## 8. Safety invariants

- Current runtime gate starts disabled; therefore parent wiring apply causes zero WF61 executions and zero provider calls.
- No credential values are read, copied, logged, hashed, measured, or persisted.
- Existing GitHub credential binding may be cloned from the already-live WF40 GitHub HTTP node; value remains opaque.
- No `LITELLM_MASTER_KEY` or Header Auth is introduced for n8n→LiteLLM.
- WF60/OpenClaw lane is preserved.
- Existing PM21 classifier/mock-worker/Telegram path is preserved.
- Qwen remains deferred.
- No automatic fallback.
- A commit containing more than one canonical backlog artifact does not dispatch.
- Backlog objects not authored as `READY_FOR_PLANNING` do not dispatch.

---

## 9. Required tests

At minimum:

1. valid GLM backlog + gate disabled → parsed, `dispatch_allowed=false`;
2. valid Codex backlog + gate disabled → parsed, `dispatch_allowed=false`;
3. gate enabled + exactly one authorized call + GLM healthy → GLM dispatch ready;
4. gate enabled + Codex healthy → Codex dispatch ready;
5. preferred Qwen → reject primary-remote lane;
6. non-empty fallback → reject current D-0025 lane;
7. non-`gate_only` fallback policy → reject;
8. state not `READY_FOR_PLANNING` → no dispatch;
9. repository mismatch → reject;
10. malformed YAML → reject;
11. missing required backlog field → reject;
12. legacy backlog without `schema` → unsupported, no dispatch;
13. provider state unknown/unavailable → no dispatch;
14. task/preferred mismatch cannot be emitted;
15. no secret-like material in output fixtures.

---

**End of contract.**

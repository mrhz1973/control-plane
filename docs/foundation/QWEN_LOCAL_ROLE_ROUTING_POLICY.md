# Qwen local role-routing policy — Control Plane

Status: **CANONICAL POLICY — runtime integration pending**  
Policy version: `qwen38-rtx3060-2026-09-02`

Source benchmark repository: `mrhz1973/qwen38-blender-lab`  
Source benchmark commit: `a3b6daef80be62eced02bc6249fa85d45b4ed7bc`

This policy is scoped to the **Control Plane**. Blender-specific routing is deliberately excluded; Blender remains a separate downstream project concern.

## Decision

The local Qwen runtime is role-routed. One model is not the default for every workload.

### OPUS_Q3 — DAILY / QUALITY / planner-reviewer

Use for:

- complex reasoning;
- planning and architecture;
- high-value code generation and review;
- task decomposition;
- implementation/Cursor prompt generation;
- ambiguous failure analysis;
- decision support and final review.

Selected model:

`D:\AI\qwen38-blender-lab\models\qwen38-opus\Qwen3.8-27B-Opus-Distill-v2-Q3_K_M.gguf`

SHA-256:

`abca69f6401dfdf361092071687b9a925df9c4846d4f040e4facddb663f74e0b`

Validated runtime lane: normal llama.cpp CUDA, build `10499`, commit `1deefcca3`.

### DCFR_IQ3 — FAST / FAST_AGENT / executor

Use for:

- OpenCode execution;
- generic MCP/tool-heavy work;
- repeated control loops;
- polling/status operations;
- structured tool calls;
- deterministic automation steps;
- latency-sensitive local execution.

Selected model:

`D:\AI\qwen38-blender-lab\models\qwen38-iq3\Qwen3.8-27B-UD-IQ3_XXS.gguf`

SHA-256:

`c0b7c3038681ed2e3040456c1dd45f9858b6c2290bed172c70388a94874f3eee`

Required runtime lane:

`D:\AI\qwen38-blender-lab\runtimes\dcfr\qwen38-27b-rtx3060-dcfr\third_party\llama.cpp\build-cuda\bin\llama-server.exe`

Runtime version: `0.2.0-dev (build 4, commit c060ca974c77-dcfr)`.

DCFR_IQ3 **must not** be silently launched under the normal llama.cpp runtime.

## Routing pattern

```text
STATE / TASK
    |
    v
complex / ambiguous / architectural?
    | yes
    v
OPUS_Q3 planner/reviewer
    |
    v
bounded TASK DELTA
    |
    v
DCFR_IQ3 FAST_AGENT executor
    |
    v
observation
    |
    +-- deterministic -> DCFR continues bounded loop
    |
    +-- ambiguous / failure / high-value review -> OPUS_Q3
```

External human/security gates remain authoritative. Model selection never weakens authorization boundaries.

## Context presets

Context is a runtime preset, not a separate model identity.

| Preset | Context | Intended use |
|---|---:|---|
| `FAST_INTERACTIVE` | 8K | short routine work |
| `AGENT_16K` | 16K | normal tool/MCP/OpenCode agent work |
| `AGENT_HEAVY_24K` | 24K | large tool schema / large control-plane state |

Do not assume 8K is universally sufficient for tool-heavy sessions.

## Superseded production assumptions

The following old Control Plane production assumptions are superseded by this policy and must be migrated before the next real local-Qwen live generation:

- `qwen38-original-dflash2-8k` as the universal production model;
- `fast_8k` as the universal execution profile;
- `dflash_required=true` as a production invariant;
- AR/non-DFlash being categorically forbidden.

The benchmark found DFlash lanes slower on the target RTX 3060. DFlash is therefore **DO_NOT_PROMOTE** for the current Control Plane hardware.

## Do not promote

- `DFLASH` — decode regression on this workstation;
- `Q2_DCFR` — raw-speed-only; reasoning collapse;
- `FULL_HAUHAU_Q3` — capability/reasoning failure;
- `EXL3_3_5bpw` — non-viable on 12 GB VRAM.

## Runtime-integration gate

This policy does **not** claim that OPUS_Q3 or DCFR_IQ3 are already exposed on the current `127.0.0.1:8080` MultiModel router.

Before any live Control Plane generation using the new policy, implementation must mechanically verify:

1. launcher/profile integration for both selected models;
2. per-profile runtime selection so DCFR uses its patched binary;
3. `/v1/models` exposes the intended profile/model IDs;
4. readiness/session-manager logic no longer hardcodes DFlash;
5. OpenCode/authorization scope binds the chosen role/profile exactly;
6. one-generation, retry=0, fallback=0 and human authorization invariants remain intact.

Machine-readable source of truth:

`configs/resources/qwen-local-model-policy.json`
